import express from "express";
import {
  handleUpload,
  getEventTransactions
} from "../controllers/upload.controller.js";

import { upload } from "../middleware/upload.middleware.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/upload",
  protect,
  upload.fields([{ name: "payer" }, { name: "bank" }]),
  handleUpload
);

router.get("/event/:eventId", protect, getEventTransactions);

export default router;