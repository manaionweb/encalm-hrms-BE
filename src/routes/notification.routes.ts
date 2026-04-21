import express from "express";
import {
  createNotification,
  getNotifications,
  markAsRead,
} from "../controllers/notification.controller";

const router = express.Router();

// create NF
router.post("/create", createNotification);

// Get 
router.get("/", getNotifications);

// read
router.put("/read/:id", markAsRead);

export default router;