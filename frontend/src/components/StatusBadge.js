import React from 'react';

/**
 * Badge status laporan pengaduan
 * Props:
 *   - status: 'Menunggu' | 'Proses' | 'Selesai'
 */
const StatusBadge = ({ status = 'Menunggu' }) => {
    const normalizedStatus = status?.toLowerCase() || 'menunggu';

    let badgeClass = 'badge-menunggu';
    if (normalizedStatus === 'proses') badgeClass = 'badge-proses';
    if (normalizedStatus === 'selesai') badgeClass = 'badge-selesai';

    return (
        <span className={`badge ${badgeClass}`}>
            {status || 'Menunggu'}
        </span>
    );
};

export default StatusBadge;
