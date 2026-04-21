import { Request, Response } from "express";
import prisma from "../../prisma/client";

// Create
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { message, type, userId, tenantId } = req.body;

    const notification = await prisma.notification.create({
      data: {
        message,
        type, // ADMIN | EMPLOYEE | BOTH
        userId: userId || null,
        tenantId,
      },
    });

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
};

// Get 
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { role, userId, tenantId } = req.query;

    let notifications;

    if (role === "ADMIN") {
      notifications = await prisma.notification.findMany({
        where: {
          tenantId: tenantId as string,
          OR: [
            { type: "ADMIN" },
            { type: "BOTH" },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      notifications = await prisma.notification.findMany({
        where: {
          tenantId: tenantId as string,
          OR: [
            { type: "EMPLOYEE" },
            { type: "BOTH" },
            { userId: Number(userId) },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    }

    res.json({ notifications });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to update notification" });
  }
};