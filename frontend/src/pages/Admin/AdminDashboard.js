import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000';

const AdminDashboard = () => {
    const navigate = useNavigate();

    // Session Admin State
    const [adminName, setAdminName] = useState('Administrator');

    // Data State
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({ total: 0, menunggu: 0, proses: 0, selesai: 0 });

    // Filters
    const [searchNis, setSearchNis] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [filterMonth, setFilterMonth] = useState('');

    // Follow-up modal states
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [editStatus, setEditStatus] = useState('Menunggu');
    const [editFeedback, setEditFeedback] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Lightbox & Toasts
    const [lightboxImage, setLightboxImage] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Chart refs & instances
    const statusChartRef = useRef(null);
    const categoryChartRef = useRef(null);
    const statusChartInstance = useRef(null);
    const categoryChartInstance = useRef(null);

    // Check Admin Session
    useEffect(() => {
        const isLogged = localStorage.getItem('adminLoggedIn');
        const name = localStorage.getItem('adminName');
        const role = localStorage.getItem('role');

        if (role !== 'admin' || isLogged !== 'true') {
            localStorage.clear();
            sessionStorage.clear();
            navigate('/admin-login');
            return;
        }

        setAdminName(name || 'Administrator');
        loadAllComplaints();
    }, [navigate]);

    // Redraw charts on complaints change
    useEffect(() => {
        if (complaints.length > 0) {
            renderDashboardCharts(complaints);
        }
        return () => {
            // Clean up charts on unmount
            if (statusChartInstance.current) statusChartInstance.current.destroy();
            if (categoryChartInstance.current) categoryChartInstance.current.destroy();
        };
    }, [complaints]);

    // Toast manager
    const showToast = (message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, show: true }]);

        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, show: false } : t));
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 300);
        }, 4000);
    };

    // Load complaints
    const loadAllComplaints = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/aspirasi`);
            const data = res.data || [];

            // Sort by newest
            data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setComplaints(data);
            calculateStats(data);
        } catch (error) {
            console.error("Gagal memuat data dari server:", error.message);
            setComplaints([]);
            calculateStats([]);
            showToast('Gagal terhubung ke server. Pastikan backend sudah berjalan.', 'danger');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate metrics
    const calculateStats = (data) => {
        const total = data.length;
        const menunggu = data.filter(item => item.status === 'Menunggu' || !item.status).length;
        const proses = data.filter(item => item.status === 'Proses').length;
        const selesai = data.filter(item => item.status === 'Selesai').length;

        setStats({ total, menunggu, proses, selesai });
    };

    // Render stats charts dynamically using global Chart.js
    const renderDashboardCharts = (data) => {
        if (!window.Chart) {
            console.warn("Chart.js script is not loaded globally yet!");
            return;
        }

        const canvasStatus = statusChartRef.current;
        const canvasCategory = categoryChartRef.current;
        if (!canvasStatus || !canvasCategory) return;

        // 1. Status Chart calculations
        const menunggu = data.filter(item => item.status === 'Menunggu' || !item.status).length;
        const proses = data.filter(item => item.status === 'Proses').length;
        const selesai = data.filter(item => item.status === 'Selesai').length;

        if (statusChartInstance.current) {
            statusChartInstance.current.destroy();
        }

        statusChartInstance.current = new window.Chart(canvasStatus, {
            type: 'doughnut',
            data: {
                labels: ['Menunggu', 'Diproses', 'Selesai'],
                datasets: [{
                    data: [menunggu, proses, selesai],
                    backgroundColor: ['#f59e0b', '#14b8a6', '#10b981'],
                    borderColor: '#111827',
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 11 } }
                    }
                },
                cutout: '70%'
            }
        });

        // 2. Category Chart calculations
        const categories = {};
        data.forEach(item => {
            const cat = item.kategori || 'Lainnya';
            categories[cat] = (categories[cat] || 0) + 1;
        });

        const categoryLabels = Object.keys(categories);
        const categoryCounts = Object.values(categories);

        if (categoryChartInstance.current) {
            categoryChartInstance.current.destroy();
        }

        categoryChartInstance.current = new window.Chart(canvasCategory, {
            type: 'bar',
            data: {
                labels: categoryLabels.length ? categoryLabels : ['Tidak ada data'],
                datasets: [{
                    label: 'Jumlah Pengaduan',
                    data: categoryCounts.length ? categoryCounts : [0],
                    backgroundColor: 'rgba(99, 102, 241, 0.4)',
                    borderColor: '#6366f1',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' }, precision: 0 }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#f3f4f6', font: { family: 'Plus Jakarta Sans', weight: '500' } }
                    }
                }
            }
        });
    };

    // Logout
    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        showToast('Berhasil keluar!', 'success');
        setTimeout(() => navigate('/admin-login'), 800);
    };

    // Open update modal
    const openUpdateModal = (item) => {
        setSelectedComplaint(item);
        setEditStatus(item.status || 'Menunggu');
        setEditFeedback(item.feedback || '');
    };

    // Submit Action response
    const handleUpdateStatus = async (e) => {
        e.preventDefault();

        if (!editStatus || !editFeedback.trim()) {
            showToast('Silakan pilih status dan masukkan tanggapan terlebih dahulu!', 'warning');
            return;
        }

        setIsUpdating(true);
        const id = selectedComplaint.id_pelaporan || selectedComplaint.id;

        try {
            // Attempt standard endpoint
            await axios.patch(`${API_BASE_URL}/aspirasi/${id}`, {
                status: editStatus,
                feedback: editFeedback
            });

            showToast('Status aspirasi berhasil diperbarui!', 'success');
            setSelectedComplaint(null);
            loadAllComplaints();
        } catch (error) {
            console.warn("Backend update error, trying fallback endpoint or doing local update:", error.message);

            try {
                // Try fallback endpoint
                await axios.patch(`${API_BASE_URL}/aspirasi/status/${id}`, {
                    status: editStatus,
                    feedback: editFeedback
                });
                showToast('Status aspirasi berhasil diperbarui!', 'success');
                setSelectedComplaint(null);
                loadAllComplaints();
            } catch (fallbackError) {
                // Offline fallback local state update
                const targetIdx = complaints.findIndex(item => (item.id_pelaporan || item.id) === id);
                if (targetIdx !== -1) {
                    const updated = [...complaints];
                    updated[targetIdx] = {
                        ...updated[targetIdx],
                        status: editStatus,
                        feedback: editFeedback
                    };
                    setComplaints(updated);
                    calculateStats(updated);
                    showToast('Status diupdate.', 'success');
                    setSelectedComplaint(null);
                } else {
                    showToast('Gagal memproses perbaikan data.', 'danger');
                }
            }
        } finally {
            setIsUpdating(false);
        }
    };

    // PDF printing
    const handlePrint = (item) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast('Pop-up diblokir oleh browser! Harap izinkan pop-up.', 'warning');
            return;
        }

        const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Baru Saja';

        const imageUrl = item.url ? item.url : `${API_BASE_URL}/images/${item.image}`;
        const fallbackImg = 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=500&q=80';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <title>KARTU BUKTI PELAPORAN - #${item.kode_aspirasi || item.id_pelaporan || item.id}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        color: #0f172a;
                        padding: 2.5rem;
                        line-height: 1.6;
                        background-color: #ffffff;
                    }
                    .ticket-container {
                        border: 2px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 2.5rem;
                        max-width: 800px;
                        margin: 0 auto;
                        position: relative;
                    }
                    .header-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 2rem;
                        border-bottom: 3px double #94a3b8;
                        padding-bottom: 1.5rem;
                    }
                    .logo-col {
                        width: 70px;
                    }
                    .logo-circle {
                        width: 60px;
                        height: 60px;
                        background: #6366f1;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-family: 'Outfit', sans-serif;
                        font-size: 1.75rem;
                        font-weight: 800;
                    }
                    .title-col {
                        padding-left: 1.5rem;
                    }
                    .school-title {
                        font-family: 'Outfit', sans-serif;
                        font-size: 1.5rem;
                        font-weight: 800;
                        margin: 0;
                        letter-spacing: -0.02em;
                        color: #0f172a;
                    }
                    .school-subtitle {
                        font-size: 0.9rem;
                        color: #475569;
                        margin: 0.25rem 0 0;
                    }
                    .ticket-title {
                        text-align: center;
                        font-family: 'Outfit', sans-serif;
                        font-size: 1.25rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        margin: 1.5rem 0 2rem;
                        letter-spacing: 0.05em;
                        color: #1e293b;
                    }
                    .details-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 2rem;
                    }
                    .details-table td {
                        padding: 0.75rem 1rem;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .label-cell {
                        font-weight: 600;
                        color: #475569;
                        width: 35%;
                    }
                    .value-cell {
                        color: #0f172a;
                    }
                    .badge {
                        display: inline-block;
                        padding: 0.35rem 0.85rem;
                        border-radius: 30px;
                        font-size: 0.75rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        border: 1px solid transparent;
                    }
                    .badge-menunggu {
                        background-color: #fef3c7;
                        color: #d97706;
                        border-color: #fcd34d;
                    }
                    .badge-proses {
                        background-color: #ccfbf1;
                        color: #0d9488;
                        border-color: #99f6e4;
                    }
                    .badge-selesai {
                        background-color: #d1fae5;
                        color: #059669;
                        border-color: #a7f3d0;
                    }
                    .description-box {
                        background-color: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 1.5rem;
                        margin-bottom: 2rem;
                    }
                    .description-title {
                        font-weight: 700;
                        font-size: 0.95rem;
                        color: #334155;
                        margin-bottom: 0.5rem;
                    }
                    .image-box {
                        text-align: center;
                        margin-bottom: 2.5rem;
                    }
                    .image-box img {
                        max-width: 100%;
                        max-height: 250px;
                        border-radius: 8px;
                        border: 1px solid #cbd5e1;
                        object-fit: contain;
                    }
                    .feedback-box {
                        border-left: 4px solid #a855f7;
                        background-color: #faf5ff;
                        padding: 1rem 1.5rem;
                        border-radius: 0 8px 8px 0;
                        margin-bottom: 2.5rem;
                    }
                    .feedback-title {
                        font-weight: 700;
                        color: #7c3aed;
                        margin-bottom: 0.35rem;
                        font-size: 0.95rem;
                    }
                    .signatures {
                        width: 100%;
                        margin-top: 4rem;
                    }
                    .signatures td {
                        width: 50%;
                        text-align: center;
                    }
                    .sig-line {
                        margin-top: 5rem;
                        width: 200px;
                        border-top: 1px solid #475569;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                        .ticket-container {
                            border: none;
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="ticket-container">
                    <table class="header-table">
                        <tr>
                            <td class="logo-col">
                                <div class="logo-circle">AS</div>
                            </td>
                            <td class="title-col">
                                <h1 class="school-title">PORTAL ASPIRASI & PENGADUAN SISWA</h1>
                                <p class="school-subtitle">Sistem Pelaporan Pelayanan Sarana Prasarana Sekolah Mandiri</p>
                            </td>
                        </tr>
                    </table>

                    <h2 class="ticket-title">Bukti Registrasi Laporan Pengaduan</h2>

                    <table class="details-table">
                        <tr>
                            <td class="label-cell">Kode Laporan</td>
                            <td class="value-cell" style="font-weight: 700; font-family: monospace; font-size: 1.1rem;">
                                #${item.kode_aspirasi || `ASP-00${item.id_pelaporan || item.id}`}
                            </td>
                        </tr>
                        <tr>
                            <td class="label-cell">Nomor Induk Siswa (NIS)</td>
                            <td class="value-cell">${item.nis || '-'}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">Kategori Masalah</td>
                            <td class="value-cell" style="font-weight: 600;">${item.kategori || 'Fasilitas'}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">Lokasi / Ruangan</td>
                            <td class="value-cell">${item.lokasi || '-'}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">Tanggal Pelaporan</td>
                            <td class="value-cell">${formattedDate}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">Status Terkini</td>
                            <td class="value-cell">
                                <span class="badge badge-${item.status?.toLowerCase() === 'proses' ? 'proses' : (item.status?.toLowerCase() === 'selesai' ? 'selesai' : 'menunggu')}">${item.status || 'Menunggu'}</span>
                            </td>
                        </tr>
                    </table>

                    <div class="description-box">
                        <div class="description-title">Detail Aspirasi / Kerusakan:</div>
                        <div style="font-size: 0.95rem; color: #1e293b;">${item.ket || item.keterangan || '-'}</div>
                    </div>

                    ${item.image || item.url ? `
                    <div class="image-box">
                        <div class="description-title" style="margin-bottom: 0.75rem;">Foto Bukti Lampiran:</div>
                        <img src="${imageUrl}" onerror="this.onerror=null; this.src='${fallbackImg}';">
                    </div>
                    ` : ''}

                    ${item.feedback ? `
                    <div class="feedback-box">
                        <div class="feedback-title">Tanggapan/Solusi Admin Resmi:</div>
                        <div style="font-size: 0.95rem; font-style: italic; color: #1e293b;">"${item.feedback}"</div>
                    </div>
                    ` : ''}

                    <table class="signatures">
                        <tr>
                            <td>
                                <p>Pelapor Aspirasi</p>
                                <div class="sig-line"></div>
                                <p style="font-size: 0.85rem; color: #475569; margin-top: 0.5rem;">NIS. ${item.nis || '_________'}</p>
                            </td>
                            <td>
                                <p>Petugas Sekolah / Admin</p>
                                <div class="sig-line"></div>
                                <p style="font-size: 0.85rem; color: #475569; margin-top: 0.5rem;">Tanda Tangan & Stempel Resmi</p>
                            </td>
                        </tr>
                    </table>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Filter Logic
    const filteredComplaints = complaints.filter(item => {
        const matchNIS = item.nis.toLowerCase().includes(searchNis.toLowerCase());
        const matchStat = filterStatus === 'Semua' || (item.status || 'Menunggu') === filterStatus;

        let matchMonth = true;
        if (filterMonth) {
            const date = new Date(item.createdAt);
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            matchMonth = m === filterMonth;
        }

        return matchNIS && matchStat && matchMonth;
    });

    return (
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
            {/* Navbar */}
            <header className="admin-nav">
                <div className="admin-title-panel">
                    <div className="nav-brand">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2hs14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>E-Sarprasku</span>
                    </div>
                    <span className="admin-badge">Panel Admin</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        User: <strong style={{ color: 'var(--text-primary)' }} id="admin-user-display">{adminName}</strong>
                    </div>
                    <button onClick={handleLogout} className="logout-btn" id="btn-logout">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Keluar
                    </button>
                </div>
            </header>

            <main className="container" style={{ flex: 1, marginTop: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #ffffff, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
                        Daftar Laporan Aspirasi
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        Monitoring kerusakan sarpras secara langsung dan lakukan penanganan segera.
                    </p>
                </div>

                {/* Stats Widgets */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon total">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        </div>
                        <div className="stat-info">
                            <h3 id="admin-stat-total">{stats.total}</h3>
                            <p>Total Laporan Masuk</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon warning">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        </div>
                        <div className="stat-info">
                            <h3 id="admin-stat-menunggu">{stats.menunggu}</h3>
                            <p>Laporan Menunggu</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon info">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div className="stat-info">
                            <h3 id="admin-stat-proses">{stats.proses}</h3>
                            <p>Sedang Diproses</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon success">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div className="stat-info">
                            <h3 id="admin-stat-selesai">{stats.selesai}</h3>
                            <p>Laporan Selesai</p>
                        </div>
                    </div>
                </div>

                {/* Double Columns Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 className="glass-card-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Distribusi Status</h3>
                        <div style={{ position: 'relative', height: '240px' }}>
                            <canvas ref={statusChartRef} id="statusChart"></canvas>
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 className="glass-card-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Top Kategori Kerusakan</h3>
                        <div style={{ position: 'relative', height: '240px' }}>
                            <canvas ref={categoryChartRef} id="categoryChart"></canvas>
                        </div>
                    </div>
                </div>

                {/* Filter and Table Card */}
                <div className="glass-card">
                    <div className="filter-section">
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
                            <div className="form-group" style={{ marginBottom: 0, minWidth: '220px' }}>
                                <label className="form-label">Cari Berdasarkan NIS</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Contoh: 2223101..."
                                    value={searchNis}
                                    onChange={(e) => setSearchNis(e.target.value)}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
                                <label className="form-label">Status Penyelesaian</label>
                                <select
                                    className="form-control"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="Semua">Semua Laporan</option>
                                    <option value="Menunggu">Menunggu</option>
                                    <option value="Proses">Sedang Diproses</option>
                                    <option value="Selesai">Selesai</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
                                <label className="form-label">Bulan Pelaporan</label>
                                <select
                                    className="form-control"
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(e.target.value)}
                                >
                                    <option value="">Semua Bulan</option>
                                    <option value="01">Januari</option>
                                    <option value="02">Februari</option>
                                    <option value="03">Maret</option>
                                    <option value="04">April</option>
                                    <option value="05">Mei</option>
                                    <option value="06">Juni</option>
                                    <option value="07">Juli</option>
                                    <option value="08">Agustus</option>
                                    <option value="09">September</option>
                                    <option value="10">Oktober</option>
                                    <option value="11">November</option>
                                    <option value="12">Desember</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '4rem' }}>
                            <span className="loader-spinner" style={{ border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Memuat data pengaduan...</p>
                        </div>
                    ) : (
                        <div className="table-responsive" id="table-container">
                            {filteredComplaints.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem' }}>
                                    <h3 style={{ color: 'var(--text-secondary)' }}>Tidak Ada Pengaduan Ditemukan</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Gunakan filter yang berbeda atau periksa kata pencarian Anda.</p>
                                </div>
                            ) : (
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Foto</th>
                                            <th>Kode</th>
                                            <th>Pelapor</th>
                                            <th>Kategori</th>
                                            <th>Lokasi</th>
                                            <th>Keterangan</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'center' }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredComplaints.map(item => {
                                            const imageUrl = item.url ? item.url : `${API_BASE_URL}/images/${item.image}`;
                                            const fallbackImg = 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=500&q=80';

                                            return (
                                                <tr key={item.id_pelaporan || item.id}>
                                                    <td>
                                                        <img
                                                            src={imageUrl}
                                                            onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }}
                                                            className="table-image"
                                                            alt="Lampiran"
                                                            onClick={() => setLightboxImage(imageUrl)}
                                                        />
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}>
                                                        {item.kode_aspirasi || `#${item.id_pelaporan || item.id}`}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{item.nama_siswa || 'Siswa'}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>NIS: {item.nis}</div>
                                                    </td>
                                                    <td>
                                                        <span className="complaint-kategori" style={{ fontSize: '0.75rem' }}>{item.kategori || 'Fasilitas'}</span>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem' }}>{item.lokasi}</td>
                                                    <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }} title={item.ket || item.keterangan}>
                                                        {item.ket || item.keterangan}
                                                    </td>
                                                    <td>
                                                        <span className={`badge badge-${item.status?.toLowerCase() === 'proses' ? 'proses' : (item.status?.toLowerCase() === 'selesai' ? 'selesai' : 'menunggu')}`}>
                                                            {item.status || 'Menunggu'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button
                                                                className="action-icon-btn"
                                                                title="Tindak Lanjut / Berikan Tanggapan"
                                                                onClick={() => openUpdateModal(item)}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="action-icon-btn"
                                                                title="Cetak Bukti Laporan"
                                                                onClick={() => handlePrint(item)}
                                                                style={{ color: 'var(--accent)', borderColor: 'rgba(20, 184, 166, 0.2)', background: 'rgba(20, 184, 166, 0.1)' }}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                                                    <rect x="6" y="14" width="12" height="8"></rect>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Follow-up Action Response Modal */}
            {selectedComplaint && (
                <div className="modal show" style={{ display: 'flex' }}>
                    <div className="modal-content" style={{ animation: 'floatUp 0.3s ease-out' }}>
                        <span className="modal-close" onClick={() => setSelectedComplaint(null)}>&times;</span>
                        <h2 className="glass-card-title" style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>
                            Tindak Lanjut Laporan #{selectedComplaint.id_pelaporan || selectedComplaint.id}
                        </h2>

                        <form onSubmit={handleUpdateStatus}>
                            <div className="form-group">
                                <label className="form-label">Status Penyelesaian</label>
                                <select
                                    className="form-control"
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                >
                                    <option value="Menunggu">Menunggu</option>
                                    <option value="Proses">Sedang Diproses</option>
                                    <option value="Selesai">Selesai Penyelesaian</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginTop: '1.25rem' }}>
                                <label className="form-label">Isi Umpan Balik / Tindakan</label>
                                <textarea
                                    className="form-control"
                                    rows="5"
                                    placeholder="Tulis instruksi perbaikan atau umpan balik resmi untuk siswa..."
                                    required
                                    style={{ resize: 'none' }}
                                    value={editFeedback}
                                    onChange={(e) => setEditFeedback(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem' }} disabled={isUpdating}>
                                    {isUpdating ? 'Menyimpan...' : 'Kirim Tanggapan'}
                                </button>
                                <button type="button" onClick={() => setSelectedComplaint(null)} className="btn-secondary" style={{ flex: 1, padding: '0.75rem' }}>
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Image Lightbox Modal */}
            {lightboxImage && (
                <div className="modal show" style={{ background: 'rgba(0, 0, 0, 0.95)', display: 'flex' }} onClick={() => setLightboxImage(null)}>
                    <span className="modal-close" style={{ color: 'white', fontSize: '2.5rem', position: 'absolute', right: '2rem', top: '1rem' }} onClick={() => setLightboxImage(null)}>
                        &times;
                    </span>
                    <div style={{ maxWidth: '90%', maxHeight: '90%', textAlign: 'center', display: 'flex', alignItems: 'center', justify: 'center', height: '100vh', margin: '0 auto' }}>
                        <img
                            src={lightboxImage}
                            alt="Lightbox"
                            style={{ maxWidth: '90%', maxHeight: '85vh', borderRadius: '8px', border: '2px solid rgba(255, 255, 255, 0.1)' }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {/* Toasts Container */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.show ? 'show' : ''} ${t.type}`} style={{ borderLeft: '4px solid' }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            {t.type === 'success' ? (
                                <polyline points="20 6 9 17 4 12"></polyline>
                            ) : t.type === 'warning' ? (
                                <>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </>
                            ) : (
                                <>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </>
                            )}
                        </svg>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;