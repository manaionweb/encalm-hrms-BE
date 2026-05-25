import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createNotification } from '../utils/notification';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: any;
}

export const getPunchStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const record = await prisma.attendanceRecord.findFirst({
            where: {
                userId,
                date: today
            }
        });

        if (record) {
            return res.json({
                isPunchedIn: record.inTime && !record.outTime,
                punchInTime: record.inTime,
                punchOutTime: record.outTime,
                status: record.status
            });
        }

        return res.json({
            isPunchedIn: false,
            punchInTime: null,
            punchOutTime: null,
            status: null
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching punch status', error: error.message });
    }
};

export const punchToggle = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const tenantId = req.user.tenantId;

        // Current time
        const now = new Date(
            new Date().toLocaleString("en-US", {
                timeZone: "Asia/Kolkata"
            })
        );

        // YYYY-MM-DD
        const today = now.toISOString().split('T')[0];

        // Find today's attendance record
        let record = await prisma.attendanceRecord.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: today
                }
            }
        });

        // ====================================
        // NIGHT SHIFT SUPPORT
        // ====================================

        if (!record) {

            // Check employee shift
            const employeeProfile = await prisma.employeeProfile.findUnique({
                where: {
                    userId
                },
                include: {
                    shiftRef: true
                }
            });

            // If employee has night shift
            if (employeeProfile?.shiftRef?.isNightShift) {

                // Get yesterday date
                const yesterday = new Date(now);

                yesterday.setDate(yesterday.getDate() - 1);

                const yesterdayDate =
                    yesterday.toISOString().split('T')[0];

                // Search yesterday attendance
                record = await prisma.attendanceRecord.findUnique({
                    where: {
                        userId_date: {
                            userId,
                            date: yesterdayDate
                        }
                    }
                });
            }
        }

        // ===============================
        // PUNCH IN
        // ===============================
        if (!record) {

            // ===============================
            // FETCH EMPLOYEE PROFILE + SHIFT
            // ===============================

            const employeeProfile = await prisma.employeeProfile.findUnique({
                where: {
                    userId
                },
                include: {
                    shiftRef: true
                }
            });

            // Default status
            let status = 'Present';

            // ===============================
            // SHIFT FALLBACK LOGIC
            // ===============================

            // Use assigned shift first
            let shift = employeeProfile?.shiftRef;

            // If no shift assigned → use tenant default shift
            if (!shift) {
                shift = await prisma.shift.findFirst({
                    where: {
                        tenantId
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                });
            }

            // ===============================
            // LATE MARK CALCULATION
            // ===============================

            if (shift) {

                // Example: "09:00"
                const [shiftHour, shiftMinute] = shift.startTime
                    .split(':')
                    .map(Number);

                // Create shift start datetime
                const shiftStartTime = new Date(now);

                // Add grace time
                shiftStartTime.setHours(
                    shiftHour,
                    shiftMinute + shift.graceTime,
                    0,
                    0
                );

                // Debug logs
                console.log("SHIFT NAME:", shift.name);
                console.log("SHIFT START:", shift.startTime);
                console.log("GRACE TIME:", shift.graceTime);
                console.log("CURRENT TIME:", now);
                console.log("LATE THRESHOLD:", shiftStartTime);

                // Compare punch time
                if (now > shiftStartTime) {
                    status = 'Late';
                }
            }

            console.log("FINAL STATUS:", status);

            // ===============================
            // CREATE ATTENDANCE RECORD
            // ===============================

            record = await prisma.attendanceRecord.create({
                data: {
                    userId,
                    tenantId,
                    date: today,
                    inTime: now,
                    status
                }
            });

            // ===============================
            // LATE NOTIFICATION
            // ===============================

            if (status === 'Late') {
                await createNotification({
                    tenantId,
                    userId,
                    title: 'Attendance Alert',
                    message: 'You were marked late today. Please regularize your attendance if needed.',
                    type: 'attendance',
                });
            }

            return res.json({
                message: 'Punched in successfully',
                record
            });

        }

        // ===============================
        // PUNCH OUT
        // ===============================
        else if (record.inTime && !record.outTime) {

            // ===============================
            // CALCULATE WORKING HOURS
            // ===============================

            const inTime = new Date(record.inTime);

            const hours =
                (now.getTime() - inTime.getTime()) /
                (1000 * 60 * 60);

            const workedHours = parseFloat(hours.toFixed(2));

            // ===============================
            // FETCH ATTENDANCE POLICY
            // ===============================

            const attendancePolicy =
                await prisma.attendancePolicy.findUnique({
                    where: {
                        tenantId
                    }
                });

            // Default values
            const minHalfDayHours =
                attendancePolicy?.minHalfDayHours || 4;

            const minFullDayHours =
                attendancePolicy?.minFullDayHours || 8;

            // ===============================
            // DETERMINE FINAL STATUS
            // ===============================

            let finalStatus = record.status;

            // If employee worked less than half-day
            if (workedHours < minHalfDayHours) {

                finalStatus = 'Absent';

            }

            // Half Day
            else if (
                workedHours >= minHalfDayHours &&
                workedHours < minFullDayHours
            ) {

                finalStatus = 'Half Day';

            }

            // Full Day
            else {

                // Keep Late if already marked Late
                if (record.status === 'Late') {
                    finalStatus = 'Late';
                } else {
                    finalStatus = 'Present';
                }
            }

            console.log("WORKED HOURS:", workedHours);
            console.log("FINAL STATUS:", finalStatus);

            // ===============================
            // UPDATE ATTENDANCE RECORD
            // ===============================

            record = await prisma.attendanceRecord.update({
                where: {
                    id: record.id
                },

                data: {
                    outTime: now,
                    hours: workedHours,
                    status: finalStatus
                }
            });

            return res.json({
                message: 'Punched out successfully',
                record
            });
        }

        // ===============================
        // ALREADY PUNCHED OUT
        // ===============================

        else {
            return res.status(400).json({
                message: 'Already punched out for today'
            });
        }

    } catch (error: any) {

        console.error("Punch toggle error:", error);

        res.status(500).json({
            message: 'Error during punch toggle',
            error: error.message
        });
    }
};
export const getAttendanceHistory = async (req: AuthRequest, res: Response) => {
    try {
        const loggedInUser = req.user;
        const employeeIdQuery = req.query.employeeId ? Number(req.query.employeeId) : null;

        // Security: Only HR_ADMIN can view other employees' attendance
        let userId = loggedInUser.id;
        if (
            employeeIdQuery &&
            (loggedInUser.role?.name === 'HR_ADMIN'
                || loggedInUser.role === 'HR_ADMIN')
        ) {
            userId = employeeIdQuery;
        }

        const now = new Date(
            new Date().toLocaleString("en-US", {
                timeZone: "Asia/Kolkata"
            })
        );
        const year = req.query.year || now.getFullYear().toString();
        const month = req.query.month || (now.getMonth() + 1).toString();

        const datePrefix = `${year}-${String(month).padStart(2, '0')}`;

        const records = await prisma.attendanceRecord.findMany({
            where: {
                userId,
                date: {
                    startsWith: datePrefix
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        res.json(records);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching attendance history', error: error.message });
    }
};

export const getAttendanceStats = async (req: AuthRequest, res: Response) => {
    try {
        const loggedInUser = req.user;
        const employeeIdQuery = req.query.employeeId ? Number(req.query.employeeId) : null;

        // Security: Only HR_ADMIN can view other employees' attendance
        let userId = loggedInUser.id;
        if (employeeIdQuery && loggedInUser.role?.name === 'HR_ADMIN'
            || loggedInUser.role === 'HR_ADMIN') {
            userId = employeeIdQuery;
        }

        const now = new Date(
            new Date().toLocaleString("en-US", {
                timeZone: "Asia/Kolkata"
            })
        );
        const year = req.query.year || now.getFullYear().toString();
        const month = req.query.month || (now.getMonth() + 1).toString();

        const datePrefix = `${year}-${String(month).padStart(2, '0')}`;

        const records = await prisma.attendanceRecord.findMany({
            where: {
                userId,
                date: {
                    startsWith: datePrefix
                }
            }
        });

        const stats = {
            present: records.filter(r => r.status === 'Present' || r.status === 'Late').length,
            absent: records.filter(r => r.status === 'Absent').length,
            late: records.filter(r => r.status === 'Late').length,
            halfDay: records.filter(r => r.status === 'Half Day').length,
            holiday: records.filter(r => r.status === 'Holiday').length,
            weekend: records.filter(r => r.status === 'Weekend').length,
        };

        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching attendance stats', error: error.message });
    }
};
