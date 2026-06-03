import express from "express";
import { 
    LoginAdmin, 
    updateAspirasiStatus 
} from "../controllers/AdminController.js";

const router = express.Router();

router.post('/login', LoginAdmin);
router.patch('/aspirasi/:id', updateAspirasiStatus);
router.patch('/aspirasi/status/:id', updateAspirasiStatus); // Fallback endpoint as seen in admin.js

export default router;
