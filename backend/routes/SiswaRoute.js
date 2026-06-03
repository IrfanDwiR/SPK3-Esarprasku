import express from "express";
import { 
    getSiswa, 
    getSiswaByNis,
    createSiswa, 
    LoginSiswa 
} from "../controllers/SiswaController.js";

const router = express.Router();

router.get('/siswa', getSiswa);
router.get('/siswa/:nis', getSiswaByNis);
router.post('/siswa', createSiswa); // Jalur untuk tambah data
router.post('/siswa/login', LoginSiswa);   // Jalur untuk login

export default router;