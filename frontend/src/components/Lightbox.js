import React from 'react';

/**
 * Komponen lightbox untuk menampilkan preview gambar fullscreen
 * Props:
 *   - imageUrl: URL gambar yang ditampilkan
 *   - onClose: fungsi untuk menutup lightbox
 */
const Lightbox = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <div
            className="modal show"
            style={{ background: 'rgba(0, 0, 0, 0.95)', display: 'flex' }}
            onClick={onClose}
        >
            <span
                className="modal-close"
                style={{ color: 'white', fontSize: '2.5rem', position: 'absolute', right: '2rem', top: '1rem', cursor: 'pointer' }}
                onClick={onClose}
            >
                &times;
            </span>
            <div style={{ maxWidth: '90%', maxHeight: '90%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: '0 auto' }}>
                <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ maxWidth: '90%', maxHeight: '85vh', borderRadius: '8px', border: '2px solid rgba(255, 255, 255, 0.1)' }}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
};

export default Lightbox;
