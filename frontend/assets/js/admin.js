// Configuration
const API_BASE_URL = 'http://localhost:3000';

// Global variables for dashboard
let allComplaints = [];
let statusChartInstance = null;
let categoryChartInstance = null;

// Initialize Elements based on active page
document.addEventListener('DOMContentLoaded', () => {
    // If on admin-login.html
    if (document.getElementById('form-login')) {
        setupLoginHandler();
    }

    // If on admin-dashboard.html
    if (document.getElementById('admin-table-body')) {
        checkAdminSession();
        setupDashboardHandlers();
        loadDashboardData();
    }
});

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '';
    if (type === 'success') {
        icon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'warning') {
        icon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else if (type === 'danger') {
        icon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
        icon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// ADMIN SESSION MANAGER
// ==========================================
function checkAdminSession() {
    const isLogged = localStorage.getItem('adminLoggedIn');
    const adminUser = localStorage.getItem('adminUser');

    if (!isLogged || isLogged !== 'true') {
        window.location.href = 'admin-login.html';
        return;
    }

    // Display admin username
    const displayElement = document.getElementById('admin-user-display');
    if (displayElement && adminUser) {
        displayElement.textContent = adminUser;
    }
}

// ==========================================
// ADMIN LOGIN PORTAL
// ==========================================
function setupLoginHandler() {
    const form = document.getElementById('form-login');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            showToast('Username dan password harus diisi!', 'warning');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="loader-spinner" style="border: 2.5px solid rgba(255,255,255,0.2); border-top: 2.5px solid white; border-radius: 50%; width: 18px; height: 18px; display:inline-block; animation: spin 1s linear infinite; margin-right: 8px;"></span> Memverifikasi...`;

        try {
            // Attempt API call to backend
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                // Login Success via backend
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminUser', result.user || username);
                showToast('Login berhasil! Mengalihkan...', 'success');
                setTimeout(() => window.location.href = 'admin-dashboard.html', 1000);
                return;
            } else {
                throw new Error(result.msg || 'Login gagal.');
            }

        } catch (error) {
            console.warn("Koneksi backend gagal, mencoba mode offline/bypass:", error.message);

            // Bypass Login Offline (Sangat berguna untuk demonstrasi/tugas sekolah!)
            // User: admin, Pass: admin123
            if (username === 'admin' && password === 'admin123') {
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminUser', 'Admin');
                showToast('Login Berhasil!', 'success');
                setTimeout(() => window.location.href = 'admin-dashboard.html', 1000);
            } else {
                showToast('Username atau password Admin salah!', 'danger');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
        }
    });
}

// ==========================================
// ADMIN DASHBOARD CONTROLLER
// ==========================================
function setupDashboardHandlers() {
    // Logout Button Handler
    const btnLogout = document.getElementById('btn-logout');
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUser');
        window.location.href = 'admin-login.html';
    });

    // Filter Change Handler
    const filterStatus = document.getElementById('filter-status');
    filterStatus.addEventListener('change', () => {
        renderTable(allComplaints);
    });

    // Close Modal Button Handlers
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const modalEdit = document.getElementById('modal-edit');

    const closeModal = () => {
        modalEdit.classList.remove('show');
        setTimeout(() => modalEdit.style.display = 'none', 300);
    };

    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    // Edit Form Submit Handler
    const formUpdate = document.getElementById('form-update-status');
    formUpdate.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('edit-id-pelaporan').value;
        const status = document.getElementById('edit-status').value;
        const feedback = document.getElementById('edit-feedback').value.trim();

        if (!status || !feedback) {
            showToast('Silakan pilih status dan masukkan tanggapan terlebih dahulu!', 'warning');
            return;
        }

        const submitBtn = formUpdate.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `Menyimpan...`;

        try {
            const response = await fetch(`${API_BASE_URL}/aspirasi/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, feedback })
            });

            if (!response.ok) {
                // If it fails (e.g. backend endpoint is not completely mapped yet), try other common endpoints
                const altResponse = await fetch(`${API_BASE_URL}/aspirasi/status/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status, feedback })
                });
                if (!altResponse.ok) throw new Error("Gagal memperbarui data di backend.");
            }

            showToast('Status aspirasi berhasil diperbarui!', 'success');
            closeModal();
            loadDashboardData(); // Refresh list

        } catch (error) {
            console.warn("Backend error, melakukan update lokal di browser session:", error.message);

            // Offline Mode Fallback: Update local array state
            const targetIdx = allComplaints.findIndex(item => (item.id_pelaporan || item.id) == id);
            if (targetIdx !== -1) {
                allComplaints[targetIdx].status = status;
                allComplaints[targetIdx].feedback = feedback;
                showToast('Status berhasil diupdate lokal (Offline mode).', 'success');
                closeModal();
                updateStats(allComplaints);
                renderTable(allComplaints);
            } else {
                showToast('Gagal memproses perbaikan data.', 'danger');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    });

    // Setup Lightbox for image view
    const lightbox = document.getElementById('modal-lightbox');
    const btnCloseLightbox = document.getElementById('btn-close-lightbox');

    const closeLightbox = () => {
        lightbox.classList.remove('show');
        setTimeout(() => lightbox.style.display = 'none', 300);
    };

    if (btnCloseLightbox) btnCloseLightbox.addEventListener('click', closeLightbox);
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target.id === 'modal-lightbox') closeLightbox();
        });
    }
}

// Fetch all database entries for admin
async function loadDashboardData() {
    const loader = document.getElementById('admin-loader');
    const tableContainer = document.getElementById('table-container');
    const emptyBox = document.getElementById('admin-empty-box');

    loader.style.display = 'block';
    tableContainer.style.display = 'none';
    emptyBox.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/aspirasi`);
        if (!response.ok) throw new Error("Gagal mengambil data dari server");

        const data = await response.json();
        allComplaints = data;

        loader.style.display = 'none';
        updateStats(allComplaints);
        renderTable(allComplaints);

    } catch (error) {
        console.warn("Gagal terhubung ke backend. Memuat data demonstrasi dummy (Offline mode):", error.message);
        loader.style.display = 'none';

        // Load dummy complaints for visual excellence if database is completely empty/unconnected
        const dummyData = [
            {
                id_pelaporan: 1,
                nis: "2223101",
                kategori: "Fasilitas",
                lokasi: "Gedung Lab Komputer B",
                ket: "AC di Lab Komputer B mengeluarkan bunyi keras dan tidak dingin, mengganggu jalannya kegiatan belajar mengajar produktif.",
                image: "dummy1.jpg",
                status: "Menunggu",
                createdAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
            },
            {
                id_pelaporan: 2,
                nis: "2223105",
                kategori: "Kebersihan",
                lokasi: "Kantin Sekolah Belakang",
                ket: "Sampah plastik menumpuk di area belakang kantin dan tidak diangkut selama 3 hari, menimbulkan bau busuk yang sangat menyengat.",
                image: "dummy2.jpg",
                status: "Proses",
                createdAt: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
            },
            {
                id_pelaporan: 3,
                nis: "2223112",
                kategori: "Keamanan",
                lokasi: "Parkiran Motor Siswa",
                ket: "Gerbang keluar parkiran motor siswa longgar dan tidak dikunci saat jam pelajaran dimulai. Mohon ditugaskan satpam untuk standby.",
                image: "dummy3.jpg",
                status: "Selesai",
                feedback: "Satpam telah dikerahkan di pos parkir, gerbang kini selalu dikunci saat jam belajar. Kondisi aman terkendali.",
                createdAt: new Date(Date.now() - 3600000 * 48).toISOString() // 2 days ago
            }
        ];

        allComplaints = dummyData;
        updateStats(allComplaints);
        renderTable(allComplaints);

        showToast('Berjalan dalam mode Offline (Tersedia data dummy)', 'warning');
    }
}

// Calculate and render statistics blocks
function updateStats(data) {
    const total = data.length;
    const menunggu = data.filter(item => item.status === 'Menunggu' || !item.status).length;
    const proses = data.filter(item => item.status === 'Proses').length;
    const selesai = data.filter(item => item.status === 'Selesai').length;

    document.getElementById('admin-stat-total').textContent = total;
    document.getElementById('admin-stat-menunggu').textContent = menunggu;
    document.getElementById('admin-stat-proses').textContent = proses;
    document.getElementById('admin-stat-selesai').textContent = selesai;

    // Render charts
    renderCharts(data);
}

// Render dynamic diagrams using Chart.js
function renderCharts(data) {
    const ctxStatus = document.getElementById('statusChart');
    const ctxCategory = document.getElementById('categoryChart');
    if (!ctxStatus || !ctxCategory) return;

    // 1. Calculate Status Distribution
    const menunggu = data.filter(item => item.status === 'Menunggu' || !item.status).length;
    const proses = data.filter(item => item.status === 'Proses').length;
    const selesai = data.filter(item => item.status === 'Selesai').length;

    // Destroy existing instance to prevent visual bugs
    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    // Status Doughnut Chart
    statusChartInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Menunggu', 'Diproses', 'Selesai'],
            datasets: [{
                data: [menunggu, proses, selesai],
                backgroundColor: [
                    '#f59e0b', // warning orange
                    '#6366f1', // primary/info indigo
                    '#10b981'  // success emerald
                ],
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
                    labels: {
                        color: '#9ca3af',
                        font: { family: 'Plus Jakarta Sans', size: 11 }
                    }
                }
            },
            cutout: '70%'
        }
    });

    // 2. Calculate Category Distribution
    const categories = {};
    data.forEach(item => {
        const cat = item.kategori || 'Lain-lain';
        categories[cat] = (categories[cat] || 0) + 1;
    });

    const categoryLabels = Object.keys(categories);
    const categoryCounts = Object.values(categories);

    // Destroy existing instance to prevent visual bugs
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    // Category Horizontal Bar Chart
    categoryChartInstance = new Chart(ctxCategory, {
        type: 'bar',
        data: {
            labels: categoryLabels.length ? categoryLabels : ['Tidak ada data'],
            datasets: [{
                label: 'Jumlah Pengaduan',
                data: categoryCounts.length ? categoryCounts : [0],
                backgroundColor: 'rgba(168, 85, 247, 0.65)', // secondary purple
                borderColor: '#a855f7',
                borderWidth: 1.5,
                borderRadius: 8,
                barThickness: 20
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af', stepSize: 1 }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render dynamic elements to tables
function renderTable(data) {
    const tbody = document.getElementById('admin-table-body');
    const tableContainer = document.getElementById('table-container');
    const emptyBox = document.getElementById('admin-empty-box');
    const selectedFilter = document.getElementById('filter-status').value;

    // Filter array
    let displayData = [...data];
    if (selectedFilter !== 'ALL') {
        displayData = displayData.filter(item => {
            const itemStatus = item.status || 'Menunggu';
            return itemStatus === selectedFilter;
        });
    }

    // Clear previous elements
    tbody.innerHTML = '';

    if (displayData.length === 0) {
        tableContainer.style.display = 'none';
        emptyBox.style.display = 'block';
        return;
    }

    tableContainer.style.display = 'block';
    emptyBox.style.display = 'none';

    // Build Rows
    displayData.forEach(item => {
        const id = item.id_pelaporan || item.id;
        const itemStatus = item.status || 'Menunggu';
        const description = item.ket || item.keterangan || '';

        // Status Badge
        let statusBadge = '';
        if (itemStatus === 'Proses') {
            statusBadge = `<span class="badge badge-proses">Proses</span>`;
        } else if (itemStatus === 'Selesai') {
            statusBadge = `<span class="badge badge-selesai">Selesai</span>`;
        } else {
            statusBadge = `<span class="badge badge-menunggu">Menunggu</span>`;
        }

        // Image Bukti
        const imageUrl = item.url ? item.url : `${API_BASE_URL}/images/${item.image}`;
        const fallbackImg = 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=500&q=80';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight: 700; color: var(--text-primary);">${item.nis}</td>
            <td><span style="font-size:0.85rem; font-weight:600; color:var(--primary);">${item.kategori || 'Fasilitas'}</span></td>
            <td><span style="font-size:0.85rem; color:var(--text-secondary);"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px; vertical-align:middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>${item.lokasi}</span></td>
            <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-secondary);" title="${description}">${description}</td>
            <td style="text-align: center;">
                <img src="${imageUrl}" onerror="this.onerror=null; this.src='${fallbackImg}';" class="table-image" onclick="openLightbox('${imageUrl}')">
            </td>
            <td>${statusBadge}</td>
            <td style="text-align: center; white-space: nowrap;">
                <button class="action-icon-btn" onclick="openEditModal(${id}, '${itemStatus}', '${(item.feedback || '').replace(/'/g, "\\'")}')" title="Tindak Lanjut" style="margin-right: 4px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                    </svg>
                </button>
                <button class="action-icon-btn" onclick="cetakLaporan(${id})" title="Cetak Ke PDF" style="background: rgba(16, 185, 129, 0.1); color: var(--success); border-color: rgba(16, 185, 129, 0.2);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Lightbox controller
function openLightbox(src) {
    const lightbox = document.getElementById('modal-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    lightboxImg.src = src;
    lightbox.style.display = 'flex';
    setTimeout(() => lightbox.classList.add('show'), 10);
}
window.openLightbox = openLightbox;

// Edit Status Modal Controller
function openEditModal(id, status, feedback) {
    const modal = document.getElementById('modal-edit');

    document.getElementById('edit-id-pelaporan').value = id;
    document.getElementById('edit-status').value = status;
    document.getElementById('edit-feedback').value = feedback || '';

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}
window.openEditModal = openEditModal;

// ==========================================
// PRINT PDF TICKET SYSTEM
// ==========================================
function cetakLaporan(id) {
    const item = allComplaints.find(c => (c.id_pelaporan || c.id) == id);
    if (!item) {
        showToast("Laporan tidak ditemukan untuk dicetak!", "danger");
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast("Pop-up diblokir oleh browser! Harap izinkan pop-up.", "warning");
        return;
    }

    const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Baru Saja';

    let statusText = item.status || 'Menunggu';
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
                            <span class="badge badge-${statusText.toLowerCase() === 'proses' ? 'proses' : (statusText.toLowerCase() === 'selesai' ? 'selesai' : 'menunggu')}">${statusText}</span>
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
}
window.cetakLaporan = cetakLaporan;

// ==========================================
// PRINT RECAP REPORT SYSTEM (ALL FILTERED)
// ==========================================
function cetakSemuaLaporan() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast("Pop-up diblokir oleh browser! Harap izinkan pop-up.", "warning");
        return;
    }

    const selectedFilter = document.getElementById('filter-status').value;

    let displayData = [...allComplaints];
    if (selectedFilter !== 'ALL') {
        displayData = displayData.filter(item => {
            const itemStatus = item.status || 'Menunggu';
            return itemStatus === selectedFilter;
        });
    }

    if (displayData.length === 0) {
        showToast("Tidak ada data laporan untuk dicetak dengan filter saat ini!", "warning");
        printWindow.close();
        return;
    }

    let rowsHtml = '';
    displayData.forEach((item, index) => {
        const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : 'Baru Saja';

        rowsHtml += `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td style="font-family: monospace; font-weight: bold;">#${item.kode_aspirasi || `ASP-00${item.id_pelaporan || item.id}`}</td>
                <td>${item.nis}</td>
                <td>${item.kategori}</td>
                <td>${item.lokasi}</td>
                <td>${item.ket || item.keterangan || '-'}</td>
                <td style="text-align: center; font-weight: bold;">${item.status || 'Menunggu'}</td>
                <td>${formattedDate}</td>
            </tr>
        `;
    });

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>REKAP LAPORAN ASPIRASI SISWA</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    padding: 2rem;
                    color: #0f172a;
                }
                .header {
                    text-align: center;
                    margin-bottom: 2rem;
                    border-bottom: 3px double #0f172a;
                    padding-bottom: 1rem;
                }
                .school-title {
                    font-size: 1.6rem;
                    font-weight: bold;
                    margin: 0;
                }
                .school-sub {
                    font-size: 0.95rem;
                    color: #475569;
                    margin: 0.25rem 0 0;
                }
                h2 {
                    text-align: center;
                    text-transform: uppercase;
                    font-size: 1.25rem;
                    margin: 1.5rem 0;
                    letter-spacing: 0.05em;
                }
                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                }
                .report-table th, .report-table td {
                    border: 1px solid #cbd5e1;
                    padding: 0.75rem;
                    font-size: 0.85rem;
                }
                .report-table th {
                    background-color: #f1f5f9;
                    font-weight: 600;
                }
                .report-table tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .footer {
                    margin-top: 3rem;
                    width: 100%;
                }
                .footer td {
                    width: 50%;
                    text-align: center;
                }
                .sig-line {
                    margin-top: 5rem;
                    width: 200px;
                    border-top: 1px solid #0f172a;
                    margin-left: auto;
                    margin-right: auto;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="school-title">PORTAL ASPIRASI & PENGADUAN SISWA</h1>
                <p class="school-sub">Laporan Rekapitulasi Pelayanan Sarana Prasarana Sekolah Mandiri</p>
            </div>
            
            <h2>Rekapitulasi Laporan Aspirasi (${selectedFilter === 'ALL' ? 'Semua Status' : selectedFilter})</h2>
            <p style="font-size: 0.9rem; margin-bottom: 1rem;">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

            <table class="report-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Kode Laporan</th>
                        <th>NIS</th>
                        <th>Kategori</th>
                        <th>Lokasi</th>
                        <th>Detail Kerusakan</th>
                        <th>Status</th>
                        <th>Tanggal Masuk</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <table class="footer">
                <tr>
                    <td></td>
                    <td>
                        <p>Mengetahui,</p>
                        <p>Kepala / Penanggung Jawab Sarpras</p>
                        <div class="sig-line"></div>
                        <p style="margin-top: 0.5rem; font-weight: bold;">Administrator Sekolah</p>
                    </td>
                </tr>
            </table>

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
}
window.cetakSemuaLaporan = cetakSemuaLaporan;
