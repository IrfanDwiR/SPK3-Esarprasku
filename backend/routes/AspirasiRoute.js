import express from "express";
import {
    getAllAspirasi,
    createAspirasi
} from "../controllers/AspirasiController.js";

const router = express.Router();

router.get('/aspirasi', getAllAspirasi);
router.post('/aspirasi', createAspirasi);

export default router;