import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const LoginAdmin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('danger');

    const navigate = useNavigate();

    // Check if already logged in
    useEffect(() => {
        const role = localStorage.getItem('role');
        const adminLoggedIn = localStorage.getItem('adminLoggedIn');
        if (role === 'admin' && adminLoggedIn === 'true') {
            navigate('/admin-dashboard');
        } else if (role === 'siswa') {
            navigate('/siswa-dashboard');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMsg('');

        // Offline bypass for local development or fallback
        if (username.trim() === 'admin' && password === 'admin123') {
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminName', 'Administrator Sekolah');
            localStorage.setItem('role', 'admin');
            setMsgType('success');
            setMsg('Berhasil Login...');
            setTimeout(() => {
                navigate('/admin-dashboard');
            }, 1000);
            return;
        }

        try {
            const response = await axios.post('http://localhost:3000/login', {
                username: username.trim(),
                password: password
            });

            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminName', response.data.user || 'Administrator');
            localStorage.setItem('role', 'admin');

            setMsgType('success');
            setMsg('Login Admin Berhasil! Mengalihkan...');

            setTimeout(() => {
                navigate('/admin-dashboard');
            }, 1000);

        } catch (error) {
            setMsgType('danger');
            if (error.response && error.response.data && error.response.data.msg) {
                setMsg(error.response.data.msg);
            } else {
                setMsg("Gagal konek ke Server. Pastikan Backend (Port 3000) sudah aktif.");
            }
        }
    };

    return (
        <div>
            {/* Navigation Bar */}
            <nav className="navbar">
                <div className="nav-brand">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>E-Sarprasku</span>
                </div>
                <ul className="nav-links">
                    <li><Link to="/" className="nav-item">Portal Siswa</Link></li>
                    <li><Link to="/admin-login" className="nav-btn active">Portal Admin</Link></li>
                </ul>
            </nav>

            {/* Login Wrapper */}
            <div className="login-wrapper">
                <div className="glass-card login-card">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div
                            style={{
                                background: 'var(--primary-glow)',
                                color: 'var(--primary)',
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem',
                                fontSize: '1.75rem',
                                border: '1px solid rgba(99, 102, 241, 0.3)'
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <h2 className="gradient-title">Login Administrator</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Kelola keluhan, berikan tanggapan, dan perbarui status aspirasi siswa.
                        </p>
                    </div>

                    {msg && (
                        <div className={`toast show ${msgType === 'success' ? 'success' : 'danger'}`}
                            style={{ position: 'static', transform: 'none', width: '100%', marginBottom: '1.5rem', borderLeft: '4px solid' }}>
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                                {msgType === 'success' ? (
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                ) : (
                                    <>
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </>
                                )}
                            </svg>
                            <span>{msg}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="username" className="form-label">Username</label>
                            <input
                                type="text"
                                id="username"
                                className="form-control"
                                placeholder="Masukkan username"
                                required
                                autoComplete="off"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="form-group" style={{ marginTop: '1.25rem' }}>
                            <label htmlFor="password" className="form-label">Password</label>
                            <div className="password-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className="form-control"
                                    placeholder="Masukkan password"
                                    required
                                    style={{ paddingRight: '3rem' }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    tabIndex="-1"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        {showPassword ? (
                                            <>
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </>
                                        ) : (
                                            <>
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" style={{ marginTop: '2rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                <polyline points="10 17 15 12 10 7"></polyline>
                                <line x1="15" y1="12" x2="3" y2="12"></line>
                            </svg>
                            LOGIN ADMIN
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginAdmin;
