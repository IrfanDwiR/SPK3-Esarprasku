import Aspirasi from "../models/AspirasiModel.js";
import User from "../models/UserModel.js";
import Kategori from "../models/KategoriModel.js";
import LogAktivitas from "../models/LogAktivitasModel.js";
import UmpanBalik from "../models/UmpanBalikModel.js";
import path from "path";

// Fungsi untuk mengambil semua data (untuk tabel History & Admin)
export const getAllAspirasi = async (req, res) => {
    try {
        const response = await Aspirasi.findAll({
            include: [
                {
                    model: User,
                    as: 'siswa',
                    attributes: ['nis', 'nama_lengkap']
                },
                {
                    model: Kategori,
                    as: 'kategoriObj',
                    attributes: ['nama_kategori']
                },
                {
                    model: UmpanBalik,
                    as: 'umpanBalik',
                    limit: 1,
                    order: [['created_at', 'DESC']],
                    attributes: ['isi_balasan']
                }
            ]
        });

        // Map data agar kompatibel penuh dengan kode frontend Anda
        const mapped = response.map(item => {
            let frontendStatus = 'Menunggu';
            if (item.status === 'diproses') frontendStatus = 'Proses';
            else if (item.status === 'selesai') frontendStatus = 'Selesai';
            else if (item.status === 'ditolak') frontendStatus = 'Ditolak';

            const latestFeedback = item.umpanBalik && item.umpanBalik.length > 0 
                ? item.umpanBalik[0].isi_balasan 
                : null;

            return {
                id_pelaporan: item.id_aspirasi,
                id: item.id_aspirasi,
                kode_aspirasi: item.kode_aspirasi,
                nis: item.siswa ? item.siswa.nis : '',
                nama_siswa: item.siswa ? item.siswa.nama_lengkap : '',
                id_kategori: item.id_kategori,
                kategori: item.kategoriObj ? item.kategoriObj.nama_kategori : 'Fasilitas',
                lokasi: item.lokasi,
                ket: item.deskripsi,
                keterangan: item.deskripsi,
                image: item.gambar,
                url: item.gambar ? `${req.protocol}://${req.get("host")}/images/${item.gambar}` : '',
                status: frontendStatus,
                feedback: latestFeedback,
                createdAt: item.tanggal_pengajuan,
                updatedAt: item.updated_at
            };
        });

        res.status(200).json(mapped);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Fungsi untuk membuat laporan baru
export const createAspirasi = async (req, res) => {
    if (req.files === null) return res.status(400).json({ msg: "No File Uploaded" });
    
    console.log("createAspirasi received body:", req.body);
    const { nis, kategori, lokasi, keterangan } = req.body;
    const file = req.files.file;
    const fileSize = file.data.length;
    const ext = path.extname(file.name);
    const fileName = file.md5 + ext;
    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;

    if (fileSize > 5000000) return res.status(422).json({ msg: "Image must be less than 5 MB" });

    // Cari User Siswa berdasarkan NIS
    const student = await User.findOne({ where: { nis: nis, level: 'siswa' } });
    if (!student) {
        console.log(`Student lookup failed for NIS: "${nis}"`);
        return res.status(404).json({ msg: "Nomor NIS Anda tidak terdaftar di sistem!" });
    }

    // Cari Kategori berdasarkan Nama Kategori
    let categoryObj = await Kategori.findOne({ where: { nama_kategori: kategori } });
    if (!categoryObj) {
        categoryObj = await Kategori.findOne(); // Fallback ke kategori pertama jika tidak ditemukan
    }
    const categoryId = categoryObj ? categoryObj.id_kategori : 1;

    // Generate kode_aspirasi unik (e.g. ASP-20260520-4929)
    const today = new Date();
    const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const kodeAspirasi = `ASP-${yyyymmdd}-${randomNum}`;

    file.mv(`./public/images/${fileName}`, async (err) => {
        if (err) return res.status(500).json({ msg: err.message });
        
        try {
            await Aspirasi.create({
                kode_aspirasi: kodeAspirasi,
                id_siswa: student.id_user,
                id_kategori: categoryId,
                judul: `Laporan ${kategori} - ${lokasi}`,
                deskripsi: keterangan,
                lokasi: lokasi,
                gambar: fileName,
                status: "baru",
                tanggal_pengajuan: new Date()
            });

            // Catat ke Log Aktivitas
            await LogAktivitas.create({
                id_user: student.id_user,
                aktivitas: `Siswa mengirimkan keluhan baru (${kodeAspirasi}) di lokasi ${lokasi}`,
                waktu: new Date()
            });

            res.status(201).json({ msg: "Aspirasi Berhasil Dibuat" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    });
}