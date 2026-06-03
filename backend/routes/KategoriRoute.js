import express from "express";
import Kategori from "../models/KategoriModel.js";

const router = express.Router();

router.get('/kategori', async (req, res) => {
    try {
        const response = await Kategori.findAll();
        res.json(response);
    } catch (error) {
        console.log(error.message);
    }
});

export default router;