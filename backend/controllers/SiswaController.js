import User from "../models/UserModel.js";
import bcrypt from "bcrypt";

// Mengambil semua data siswa
export const getSiswa = async (req, res) => {
    try {
        const response = await User.findAll({
            where: { level: 'siswa' },
            attributes: ['id_user', 'nis', 'nama_lengkap', 'kelas', 'email', 'no_telp']
        });
        const mapped = response.map(u => ({
            id: u.id_user,
            nis: u.nis,
            nama: u.nama_lengkap,
            kelas: u.kelas,
            email: u.email,
            no_telp: u.no_telp
        }));
        res.status(200).json(mapped);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Mengambil data satu siswa berdasarkan NIS
export const getSiswaByNis = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { nis: req.params.nis, level: 'siswa' }
        });
        if (!user) return res.status(404).json({ msg: "NIS tidak terdaftar!" });
        res.status(200).json({
            id: user.id_user,
            nis: user.nis,
            nama: user.nama_lengkap,
            kelas: user.kelas,
            email: user.email,
            no_telp: user.no_telp
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// MENAMBAH SISWA BARU dengan Hash Password
export const createSiswa = async (req, res) => {
    const { nama, nis, kelas, password, confPassword } = req.body;

    // Validasi kecocokan password
    if (password !== confPassword) return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok" });

    // Proses Hashing
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);

    try {
        await User.create({
            nama_lengkap: nama,
            username: nis, // Nis digunakan sebagai username default
            password: hashPassword,
            level: 'siswa',
            nis: nis,
            kelas: kelas
        });
        res.status(201).json({ msg: "Siswa Berhasil Dibuat!" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

// LOGIN SISWA dengan Verifikasi Hash
export const LoginSiswa = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { nis: req.body.nis, level: 'siswa' }
        });

        if (!user) return res.status(404).json({ msg: "NIS tidak terdaftar!" });

        // Bandingkan password input (plain text) dengan password di DB (hash)
        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) return res.status(400).json({ msg: "Password Salah!" });

        res.status(200).json({
            nis: user.nis,
            nama: user.nama_lengkap,
            role: "siswa"
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}