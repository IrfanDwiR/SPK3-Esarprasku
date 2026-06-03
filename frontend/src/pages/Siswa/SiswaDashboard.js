import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000';

const SiswaDashboard = () => {
    // Session State
    const [siswa, setSiswa] = useState({ nis: '', nama: '', kelas: 'Siswa' });
    const navigate = useNavigate();

    // Stats State
    const [stats, setStats] = useState({ total: 0, menunggu: 0, proses: 0, selesai: 0 });

    // Form Inputs State
    const [kategori, setKategori] = useState('');
    const [lokasi, setLokasi] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Complaint History Feed
    const [laporans, setLaporans] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Lightbox & Toast system
    const [lightboxImage, setLightboxImage] = useState(null);
    const [toasts, setToasts] = useState([]);

    // Check session on load
    useEffect(() => {
        const role = localStorage.getItem('role');
        const nis = localStorage.getItem('nis');
        const nama = localStorage.getItem('nama');

        if (role !== 'siswa' || !nis) {
            localStorage.clear();
            sessionStorage.clear();
            navigate('/');
            return;
        }

        // Try getting class from backend or use default
        setSiswa({
            nis: nis,
            nama: nama || 'Siswa',
            kelas: 'XII PPLG' // Default, will attempt to load details
        });

        // Load student details
        axios.get(`${API_BASE_URL}/siswa/${nis}`)
            .then(res => {
                if (res.data && res.data.kelas) {
                    setSiswa(prev => ({ ...prev, kelas: res.data.kelas }));
                }
            })
            .catch(err => console.log("Gagal memuat detail kelas:", err.message));

        loadDashboardData(nis);
    }, [navigate]);

    // Toast generator
    const showToast = (message, type = 'info') => {
        const id = Date.now() + Math.random();
        const newToast = { id, message, type, show: true };
        setToasts(prev => [...prev, newToast]);

        // Remove toast after 4s
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, show: false } : t));
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 300);
        }, 4000);
    };

    // Load Laporan & Stats
    const loadDashboardData = async (studentNis) => {
        setIsLoadingHistory(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/aspirasi`);
            const allAspirasi = res.data || [];

            // Filter only this student's reports
            const personalAspirasi = allAspirasi.filter(item => String(item.nis) === String(studentNis));

            // Sort by latest
            personalAspirasi.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setLaporans(personalAspirasi);

            // Compute statistics based on filtered data
            const total = personalAspirasi.length;
            const menunggu = personalAspirasi.filter(item => item.status === 'Menunggu' || !item.status).length;
            const proses = personalAspirasi.filter(item => item.status === 'Proses').length;
            const selesai = personalAspirasi.filter(item => item.status === 'Selesai').length;

            setStats({ total, menunggu, proses, selesai });
        } catch (error) {
            console.error(error);
            showToast('Gagal memuat riwayat pengaduan dari server.', 'danger');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Logout handler
    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        showToast('Berhasil keluar!', 'success');
        setTimeout(() => navigate('/'), 800);
    };

    // File Preview & Selection Handler
    const processFile = (selectedFile) => {
        if (!selectedFile) return;

        if (!selectedFile.type.startsWith('image/')) {
            showToast('File harus berupa gambar (JPG, JPEG, PNG)!', 'danger');
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            showToast('Ukuran gambar tidak boleh melebihi 5 MB!', 'danger');
            return;
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        showToast('Gambar berhasil diunggah dan siap dikirim.', 'success');
    };

    // Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!kategori || !lokasi || !keterangan || !file) {
            showToast('Mohon lengkapi semua kolom formulir pelaporan!', 'warning');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('nis', siswa.nis);
        formData.append('kategori', kategori);
        formData.append('lokasi', lokasi);
        formData.append('keterangan', keterangan);
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/aspirasi`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showToast(response.data.msg || 'Laporan Aspirasi Anda berhasil dikirim!', 'success');

            // Reset inputs
            setKategori('');
            setLokasi('');
            setKeterangan('');
            setFile(null);
            setPreview('');

            // Reload data
            loadDashboardData(siswa.nis);

        } catch (error) {
            console.error(error);
            const errMsg = error.response && error.response.data && error.response.data.msg
                ? error.response.data.msg
                : 'Gagal terhubung ke server backend.';
            showToast(errMsg, 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    // PDF Printable Ticket Generation
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
                        background: #0ea5e9;
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
                        border-left: 4px solid #14b8a6;
                        background-color: #f0fdfa;
                        padding: 1rem 1.5rem;
                        border-radius: 0 8px 8px 0;
                        margin-bottom: 2.5rem;
                    }
                    .feedback-title {
                        font-weight: 700;
                        color: #0d9488;
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
                            <td class="value-cell">${siswa.nis}</td>
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
                                <p style="font-size: 0.85rem; color: #475569; margin-top: 0.5rem;">NIS. ${siswa.nis}</p>
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

    return (
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
            {/* Navbar */}
            <nav className="navbar" style={{ padding: '1rem 5%' }}>
                <div className="nav-brand">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>E-Sarprasku</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }} id="nav-profile-info">
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }} id="nav-student-name">{siswa.nama}</div>
                        <div style={{ fontSize: 0.75, color: 'var(--text-secondary)' }} id="nav-student-nis">NIS: {siswa.nis}</div>
                    </div>
                    <button onClick={handleLogout} className="btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Keluar
                    </button>
                </div>
            </nav>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', flex: 1 }} className="container">
                {/* Profile Info Widget */}
                <div className="glass-card"
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', padding: '1.5rem 2.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div className="profile-avatar">
                            {siswa.nama ? siswa.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'S'}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <h2 style={{ fontSize: '1.5rem' }}>{siswa.nama}</h2>
                                <span className="student-badge">{siswa.kelas}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Selamat datang kembali! Laporkan kendala sarana prasarana sekolah di bawah ini.
                            </p>
                        </div>
                    </div>
                    <div
                        style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>
                            Identitas NIS
                        </span>
                        <strong style={{ fontSize: '1.25rem', color: 'var(--student-primary)', fontFamily: "'Outfit', sans-serif" }}>
                            {siswa.nis}
                        </strong>
                    </div>
                </div>

                {/* Stats grid for Student Laporan */}
                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--student-primary)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.total}</h3>
                            <p>Total Laporan Saya</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon warning">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.menunggu}</h3>
                            <p>Menunggu</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon info">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.proses}</h3>
                            <p>Diproses</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon success">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.selesai}</h3>
                            <p>Selesai</p>
                        </div>
                    </div>
                </div>

                {/* Double-column section: Form & History list */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} id="dashboard-grid" className="siswa-dashboard-columns">
                    {/* Column 1: Submission Form */}
                    <div>
                        <div className="glass-card">
                            <h3 className="glass-card-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                                Ajukan Pengaduan Baru
                            </h3>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="form-nis" className="form-label">NIS (Terkunci Otomatis)</label>
                                    <input
                                        type="text"
                                        id="form-nis"
                                        className="form-control"
                                        value={siswa.nis}
                                        readOnly
                                        style={{ background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)', cursor: 'not-allowed', borderColor: 'rgba(255,255,255,0.03)' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="form-kategori" className="form-label">Pilih Kategori Kendala</label>
                                    <select
                                        id="form-kategori"
                                        className="form-control"
                                        required
                                        value={kategori}
                                        onChange={(e) => setKategori(e.target.value)}
                                    >
                                        <option value="" disabled>-- Pilih Kategori --</option>
                                        <option value="Sarana & Prasarana Lab">Sarana & Prasarana Lab</option>
                                        <option value="Fasilitas Kelas">Fasilitas Kelas</option>
                                        <option value="Kebersihan Sekolah">Kebersihan Sekolah</option>
                                        <option value="Kelistrikan & AC">Kelistrikan & AC</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="form-lokasi" className="form-label">Lokasi Kejadian</label>
                                    <input
                                        type="text"
                                        id="form-lokasi"
                                        className="form-control"
                                        placeholder="Contoh: Lab RPL Lantai 3, Kelas XI-RPL"
                                        required
                                        value={lokasi}
                                        onChange={(e) => setLokasi(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="form-keterangan" className="form-label">Detail Kerusakan / Masalah</label>
                                    <textarea
                                        id="form-keterangan"
                                        className="form-control"
                                        rows="4"
                                        placeholder="Jelaskan secara lengkap detail kendala atau kerusakan sarpras..."
                                        required
                                        style={{ resize: 'none' }}
                                        value={keterangan}
                                        onChange={(e) => setKeterangan(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Foto Bukti Kerusakan</label>
                                    <div
                                        className={`file-dropzone ${isDragOver ? 'dragover' : ''}`}
                                        id="form-dropzone"
                                        onClick={() => fileInputRef.current.click()}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                        onDragLeave={() => setIsDragOver(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragOver(false);
                                            if (e.dataTransfer.files.length > 0) {
                                                processFile(e.dataTransfer.files[0]);
                                            }
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Tarik foto kesini atau klik untuk memilih</p>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mendukung format PNG, JPG, JPEG (Maks. 5 MB)</span>
                                        <input
                                            type="file"
                                            id="form-file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            ref={fileInputRef}
                                            onChange={(e) => {
                                                if (e.target.files.length > 0) {
                                                    processFile(e.target.files[0]);
                                                }
                                            }}
                                        />
                                    </div>
                                    {preview && (
                                        <div className="file-preview" style={{ display: 'flex', marginTop: '1rem' }}>
                                            <img src={preview} alt="Upload Preview" />
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className="btn-primary btn-student-submit" style={{ marginTop: '1.5rem' }} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <span className="loader-spinner" style={{ border: '2.5px solid rgba(255,255,255,0.2)', borderTop: '2.5px solid white', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}></span>
                                            Mengirim data...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                            </svg>
                                            Kirim Laporan Pengaduan
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Column 2: Personal Complaint History */}
                    <div>
                        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Riwayat Laporan Saya
                        </h2>

                        {/* Loader */}
                        {isLoadingHistory && (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <span className="loader-spinner" style={{ border: '4px solid var(--border-color)', borderTop: '4px solid var(--student-primary)', borderRadius: '50%', width: '40px', height: '40px', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontWeight: 500 }}>Menghubungkan ke database...</p>
                            </div>
                        )}

                        {/* History Feed */}
                        {!isLoadingHistory && (
                            <div className="history-grid">
                                {laporans.length === 0 ? (
                                    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style={{ color: 'var(--warning)', marginBottom: '1rem' }}>
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                        <h3 style={{ marginBottom: '0.5rem' }}>Belum Ada Laporan</h3>
                                        <p style={{ color: 'var(--text-secondary)' }}>Anda belum mengirimkan laporan keluhan sarana prasarana.</p>
                                    </div>
                                ) : (
                                    laporans.map(item => {
                                        const imageUrl = item.url ? item.url : `${API_BASE_URL}/images/${item.image}`;
                                        const fallbackImg = 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=500&q=80';

                                        const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        }) : 'Baru Saja';

                                        return (
                                            <div className="complaint-card" key={item.id_pelaporan || item.id}>
                                                <div className="complaint-img-container">
                                                    <img
                                                        src={imageUrl}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }}
                                                        alt="Bukti Pelaporan"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => setLightboxImage(imageUrl)}
                                                    />
                                                </div>
                                                <div className="complaint-content">
                                                    <div>
                                                        <div className="complaint-header">
                                                            <span className="complaint-kategori">{item.kategori || 'Lainnya'}</span>
                                                            <span className={`badge badge-${item.status?.toLowerCase() === 'proses' ? 'proses' : (item.status?.toLowerCase() === 'selesai' ? 'selesai' : 'menunggu')}`}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style={{ marginRight: '4px' }}>
                                                                    {item.status === 'Selesai' ? (
                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                    ) : (
                                                                        <>
                                                                            <circle cx="12" cy="12" r="10"></circle>
                                                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                                        </>
                                                                    )}
                                                                </svg>
                                                                {item.status || 'Menunggu'}
                                                            </span>
                                                        </div>
                                                        <div className="complaint-body">
                                                            <div className="complaint-loc">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                                    <circle cx="12" cy="10" r="3"></circle>
                                                                </svg>
                                                                <span>{item.lokasi}</span>
                                                            </div>
                                                            <p className="complaint-desc">{item.ket || item.keterangan}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        {item.feedback ? (
                                                            <div className="complaint-feedback">
                                                                <div className="complaint-feedback-title">Tanggapan/Solusi dari Admin:</div>
                                                                <div style={{ fontSize: '0.9rem', lineHeight: 1.4, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                                                                    "{item.feedback}"
                                                                </div>
                                                            </div>
                                                        ) : item.status === 'Proses' ? (
                                                            <div className="complaint-feedback" style={{ borderLeftColor: 'var(--accent)' }}>
                                                                <div className="complaint-feedback-title" style={{ color: 'var(--accent)' }}>Tanggapan Admin:</div>
                                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                                    Petugas sedang meninjau dan mempersiapkan perbaikan untuk keluhan Anda. Terima kasih atas kesabaran Anda.
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        <div className="complaint-footer" style={{ marginTop: '1rem' }}>
                                                            <span>No. Pelaporan: #{item.id_pelaporan || item.id}</span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span>Dilaporkan: {formattedDate}</span>
                                                                <button
                                                                    onClick={() => handlePrint(item)}
                                                                    className="btn-secondary"
                                                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(14, 165, 233, 0.1)', borderColor: 'rgba(14, 165, 233, 0.2)', color: 'var(--student-primary)' }}
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                                                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                                                        <rect x="6" y="14" width="12" height="8"></rect>
                                                                    </svg>
                                                                    Cetak PDF
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Lightbox Modal */}
            {lightboxImage && (
                <div className="modal show" style={{ background: 'rgba(0, 0, 0, 0.95)', display: 'flex' }} onClick={() => setLightboxImage(null)}>
                    <span className="modal-close" style={{ color: 'white', fontSize: '2.5rem', position: 'absolute', right: '2rem', top: '1rem' }} onClick={() => setLightboxImage(null)}>
                        &times;
                    </span>
                    <div style={{ maxWidth: '90%', maxHeight: '90%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: '0 auto' }}>
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

export default SiswaDashboard;
