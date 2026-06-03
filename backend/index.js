import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import db from "./config/Database.js";

import bcrypt from "bcrypt";

// Import Routes
import SiswaRoute from "./routes/SiswaRoute.js";
import AspirasiRoute from "./routes/AspirasiRoute.js";
import AdminRoute from "./routes/AdminRoute.js";

// IMPORT MODELS (WAJIB: Agar tabel otomatis dibuat di MySQL)
import User from "./models/UserModel.js";
import Kategori from "./models/KategoriModel.js";
import Aspirasi from "./models/AspirasiModel.js";
import UmpanBalik from "./models/UmpanBalikModel.js";
import LogAktivitas from "./models/LogAktivitasModel.js";
import Siswa from "./models/SiswaModel.js";

const app = express();

// --- KONEKSI & SINKRONISASI DATABASE ---
(async () => {
    try {
        await db.authenticate();
        console.log('Database Connected...');

        /**
         * sync() akan mengecek semua model yang di-import di atas.
         * Jika tabel belum ada di MySQL, Sequelize akan membuatnya otomatis.
         */
        await db.sync();
        console.log('All 5 Tables Synchronized Successfully (users, kategori, aspirasi, umpan_balik, log_aktivitas)');

        // --- SEEDER KATEGORI ---
        const countKategori = await Kategori.count();
        if (countKategori === 0) {
            await Kategori.bulkCreate([
                { nama_kategori: 'Fasilitas', deskripsi: 'Keluhan tentang sarana & prasarana sekolah' },
                { nama_kategori: 'Kebersihan', deskripsi: 'Keluhan mengenai kebersihan lingkungan sekolah' },
                { nama_kategori: 'Keamanan', deskripsi: 'Keluhan mengenai keamanan & ketertiban sekolah' },
                { nama_kategori: 'Lainnya', deskripsi: 'Keluhan umum atau masalah lainnya' }
            ]);
            console.log('Categories Seeded Successfully.');
        }

        // --- SEEDER USERS (Admin & Siswa) ---
        const countUsers = await User.count();
        if (countUsers === 0) {
            const salt = await bcrypt.genSalt();
            const hashedAdminPass = await bcrypt.hash("admin123", salt);
            const hashedSiswaPass = await bcrypt.hash("siswa123", salt);

            await User.bulkCreate([
                {
                    nama_lengkap: 'Administrator',
                    username: 'admin',
                    password: hashedAdminPass,
                    level: 'admin',
                    email: 'admin@school.sch.id',
                    no_telp: '081234567890'
                },
                {
                    nama_lengkap: 'irfan',
                    username: '2223101',
                    password: hashedSiswaPass,
                    level: 'siswa',
                    nis: '2223101',
                    kelas: 'XII RPL 1',
                    email: 'irfan@student.sch.id',
                    no_telp: '081298765432'
                }
            ]);
            console.log('Default Users (Admin & Siswa) Seeded Successfully.');
        }
    } catch (error) {
        console.error('Connection error:', error);
    }
})();

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(express.static("public")); // Folder untuk akses foto/asset

// Penggunaan Routes
app.use(SiswaRoute);
app.use(AspirasiRoute);
app.use(AdminRoute);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Server up and running on port ${PORT}`);
    console.log(`=========================================`);
});