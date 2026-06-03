import React, { useState, useCallback } from 'react';

let toastIdCounter = 0;

const ToastContainer = () => {
    return null; // Managed via hook
};

/**
 * Custom hook untuk menampilkan toast notification
 * Penggunaan:
 *   const { toasts, showToast, ToastRenderer } = useToast();
 *   showToast('Berhasil!', 'success');
 */
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = ++toastIdCounter;
        setToasts(prev => [...prev, { id, message, type, show: true }]);

        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, show: false } : t));
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 300);
        }, 4000);
    }, []);

    const ToastRenderer = () => (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast ${t.show ? 'show' : ''} ${t.type}`} style={{ borderLeft: '4px solid' }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {t.type === 'success' ? (
                            <polyline points="20 6 9 17 4 12"></polyline>
                        ) : t.type === 'warning' ? (
                            <>
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </>
                        ) : t.type === 'danger' ? (
                            <>
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
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
    );

    return { toasts, showToast, ToastRenderer };
};

export default ToastContainer;
