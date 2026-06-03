import User from "../models/UserModel.js";
import Aspirasi from "../models/AspirasiModel.js";
import UmpanBalik from "../models/UmpanBalikModel.js";
import LogAktivitas from "../models/LogAktivitasModel.js";
import bcrypt from "bcrypt";

// Login Admin
export const LoginAdmin = async(req, res) => {
    try {
        const admin = await User.findOne({
            where: { username: req.body.username, level: 'admin' }
        });
        if(!admin) return res.status(404).json({msg: "Admin tidak ditemukan!"});

        const match = await bcrypt.compare(req.body.password, admin.password);
        if(!match) return res.status(400).json({msg: "Password Salah!"});

        // Record Activity Log
        await LogAktivitas.create({
            id_user: admin.id_user,
            aktivitas: `Admin ${admin.nama_lengkap} berhasil login`,
            waktu: new Date()
        });

        res.status(200).json({msg: "Login Admin Berhasil", user: admin.nama_lengkap});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

// Admin Update Status & Feedback (Menulis ke aspirasi dan umpan_balik)
export const updateAspirasiStatus = async(req, res) => {
    const { status, feedback } = req.body;
    const aspirasiId = req.params.id;

    try {
        // Map status from frontend to backend
        let dbStatus = 'baru';
        if (status === 'Proses' || status === 'diproses') dbStatus = 'diproses';
        else if (status === 'Selesai' || status === 'selesai') dbStatus = 'selesai';
        else if (status === 'Ditolak' || status === 'ditolak') dbStatus = 'ditolak';

        // Update aspirasi status
        await Aspirasi.update({ status: dbStatus }, {
            where: { id_aspirasi: aspirasiId }
        });

        // Find Admin User to associate with Umpan Balik
        const adminUser = await User.findOne({ where: { level: 'admin' } });
        const adminId = adminUser ? adminUser.id_user : 1;

        // Create response in umpan_balik
        await UmpanBalik.create({
            id_aspirasi: aspirasiId,
            id_admin: adminId,
            isi_balasan: feedback || "Status diperbarui",
            tanggal_balasan: new Date(),
            progres: status === 'Selesai' ? '100%' : (status === 'Proses' ? '50%' : '0%')
        });

        // Record Activity Log
        await LogAktivitas.create({
            id_user: adminId,
            aktivitas: `Admin memperbarui status keluhan #${aspirasiId} menjadi ${dbStatus}`,
            waktu: new Date()
        });

        res.status(200).json({msg: "Status Aspirasi Diperbarui"});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}