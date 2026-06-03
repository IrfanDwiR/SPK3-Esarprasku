import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ title = 'E-Sarprasku', badgeText, userName, userSub, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        if (onLogout) onLogout();
        navigate('/');
    };

    return (
        <header className="admin-nav">
            <div className="admin-title-panel">
                <div className="nav-brand">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>{title}</span>
                </div>
                {badgeText && <span className="admin-badge">{badgeText}</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {userName && (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{userName}</div>
                        {userSub && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{userSub}</div>}
                    </div>
                )}
                <button onClick={handleLogout} className="logout-btn" id="btn-logout">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Keluar
                </button>
            </div>
        </header>
    );
};

export default Navbar;
