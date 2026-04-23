import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In a real multi-tenant app, you'd extract tenantId from req.user
// Assuming the user token middleware sets req.user

export const getStats = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const tenantId = user?.tenantId;

        if (!tenantId) {
            return res.status(400).json({ message: 'Tenant ID required' });
        }

        // 1. Total Headcount
        const headcount = await prisma.employeeProfile.count({
            where: { tenantId, status: 'Active' }
        });

        // 2. On Leave Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        const onLeaveToday = await prisma.leave.count({
            where: {
                tenantId,
                status: 'APPROVED',
                startDate: { lte: endOfToday },
                endDate: { gte: today }
            }
        });

        // 3. New Joiners (Joined this month)
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const newJoiners = await prisma.employeeProfile.count({
            where: {
                tenantId,
                joiningDate: { gte: startOfMonth }
            }
        });

        // 4. Avg Attendance (Calculate from AttendanceRecord for the current month)
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const attendanceCount = await prisma.attendanceRecord.count({
            where: {
                tenantId,
                date: { gte: firstDayOfMonth.toISOString().split('T')[0] },
                status: 'Present'
            }
        });

        const totalExpectedDays = headcount * (today.getDate()); // Rough estimate: days passed * headcount
        const avgAttendance = totalExpectedDays > 0 
            ? Math.round((attendanceCount / totalExpectedDays) * 100) 
            : 0;

        res.json({
            headcount,
            onLeaveToday,
            newJoiners,
            avgAttendance: avgAttendance || 0
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getLiveAttendance = async (req: Request, res: Response) => {
    try {
        // Mock data since no raw punches table exists in schema yet
        const data = [
            { name: '09:00', visitors: 40 },
            { name: '10:00', visitors: 120 },
            { name: '11:00', visitors: 180 },
            { name: '12:00', visitors: 150 },
            { name: '13:00', visitors: 90 },
            { name: '14:00', visitors: 160 },
            { name: '15:00', visitors: 140 },
        ];
        
        // Simulating some dynamic variance
        const dynamicData = data.map(d => ({
            name: d.name,
            visitors: d.visitors + Math.floor(Math.random() * 20 - 10)
        }));

        res.json(dynamicData);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPendingApprovals = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const tenantId = user?.tenantId;

        if (!tenantId) return res.status(400).json({ message: 'Tenant ID required' });

        const pendingLeaves = await prisma.leave.findMany({
            where: {
                tenantId,
                status: 'PENDING'
            },
            include: {
                user: {
                    select: { name: true, employeeProfile: { select: { avatar: true } } }
                },
                leaveType: {
                    select: { name: true }
                }
            },
            take: 5
        });

        const formatted = pendingLeaves.map(leave => ({
            id: leave.id,
            userName: leave.user.name,
            type: leave.leaveType.name,
            duration: Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 3600 * 24)) + 1,
            avatar: leave.user.employeeProfile?.avatar || null
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getEmployeeOverview = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const tenantId = user?.tenantId;

        if (!tenantId) return res.status(400).json({ message: 'Tenant ID required' });

        const employees = await prisma.employeeProfile.findMany({
            where: { tenantId },
            include: {
                user: { select: { id: true, name: true } }
            },
            take: 5,
            orderBy: { id: 'desc' }
        });

        const formatted = employees.map(emp => ({
            id: emp.user.id, // Use userId instead of profileId
            name: emp.user.name,
            role: emp.title || 'Employee',
            status: emp.status
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching employee overview:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
