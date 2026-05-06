import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  getEventSummary
} from "../controllers/event.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createEvent);
router.get("/", protect, getEvents);

router.get("/:id", protect, getEventById);

// 🔥 NEW
router.get("/:id/summary", protect, getEventSummary);

export default router;