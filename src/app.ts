
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import notificationRoutes from "./routes/notification.routes";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

import chatRoutes from './routes/chatRoutes';
import employeeRoutes from './routes/employee.routes';
import authRoutes from './routes/auth.routes';
import mastersRoutes from './routes/masters.routes';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.use('/api/chat', chatRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/masters', mastersRoutes);
app.use("/api/notifications", notificationRoutes);

export { app, prisma };
