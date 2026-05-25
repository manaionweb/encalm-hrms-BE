import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { notifyAdmins, createNotification } from '../utils/notification';

const prisma = new PrismaClient();

// ======================================================
// HELPER FUNCTION
// CALCULATE LEAVE DAYS
// ======================================================

const calculateLeaveDays = async ({
    startDate,
    endDate,
    tenantId,
    sandwichRule
}: {
    startDate: Date;
    endDate: Date;
    tenantId: string;
    sandwichRule: boolean;
}) => {

    let leaveDays = 0;

    // Clone start date
    const currentDate = new Date(startDate);

    // Fetch holidays between dates
    const holidays = await prisma.holiday.findMany({
        where: {
            tenantId,
            date: {
                gte: startDate,
                lte: endDate
            }
        }
    });

    // Convert holidays into lookup set
    const holidaySet = new Set(
        holidays.map(h =>
            new Date(h.date).toISOString().split('T')[0]
        )
    );

    // Iterate all dates
    while (currentDate <= endDate) {

        const day = currentDate.getDay();

        const formattedDate =
            currentDate.toISOString().split('T')[0];

        const isWeekend =
            day === 0 || day === 6;

        const isHoliday =
            holidaySet.has(formattedDate);

        // Sandwich Rule Enabled
        if (sandwichRule) {

            leaveDays++;

        }

        // Normal Leave Logic
        else {

            // Count only working days
            if (!isWeekend && !isHoliday) {
                leaveDays++;
            }
        }

        // Move next day
        currentDate.setDate(
            currentDate.getDate() + 1
        );
    }

    return leaveDays;
};

// ======================================================
// GET LEAVE BALANCES
// ======================================================

export const getLeaveBalances = async (
    req: Request,
    res: Response
) => {

    try {

        const userId = (req as any).user?.id;

        const tenantId = (req as any).user?.tenantId;

        if (!userId || !tenantId) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        // Fetch leave types
        const leaveTypes =
            await prisma.leaveType.findMany({
                where: {
                    tenantId,
                    code: {
                        in: ['CL', 'SL', 'EL']
                    }
                },
                distinct: ['code']
            });

        // Current year
        const currentYear =
            new Date().getFullYear();

        const startOfYear =
            new Date(currentYear, 0, 1);

        const endOfYear =
            new Date(currentYear, 11, 31);

        // Approved leaves
        const approvedLeaves =
            await prisma.leave.findMany({
                where: {
                    userId,
                    status: 'APPROVED',
                    startDate: {
                        gte: startOfYear,
                        lte: endOfYear
                    }
                }
            });

        // Calculate balances
        const balances = await Promise.all(

            leaveTypes.map(async (type) => {

                const filteredLeaves =
                    approvedLeaves.filter(
                        l => l.leaveTypeId === type.id
                    );

                let taken = 0;

                for (const leave of filteredLeaves) {

                    const leaveDays =
                        await calculateLeaveDays({
                            startDate: leave.startDate,
                            endDate: leave.endDate,
                            tenantId,
                            sandwichRule:
                                type.sandwichRule
                        });

                    taken += leaveDays;
                }

                return {
                    id: type.id,
                    name: type.name,
                    code: type.code,
                    total: type.daysPerYear,
                    taken,
                    balance:
                        type.daysPerYear - taken
                };
            })

        );

        res.json(balances);

    } catch (error) {

        console.error(
            'Error fetching leave balances:',
            error
        );

        res.status(500).json({
            message: 'Server error'
        });
    }
};

// ======================================================
// GET LEAVE HISTORY
// ======================================================

export const getLeaveHistory = async (
    req: Request,
    res: Response
) => {

    try {

        const userId = (req as any).user?.id;

        const tenantId =
            (req as any).user?.tenantId;

        const userRole =
            (req as any).user?.role;

        const { all } = req.query;

        if (!userId || !tenantId) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        // HR_ADMIN can view all leaves
        const whereClause =
            (userRole === 'HR_ADMIN'
                && all === 'true')

                ? { tenantId }

                : { userId, tenantId };

        const leaves =
            await prisma.leave.findMany({
                where: whereClause,

                include: {
                    leaveType: true,

                    user: {
                        select: {
                            name: true
                        }
                    }
                },

                orderBy: {
                    createdAt: 'desc'
                }
            });

        res.json(leaves);

    } catch (error) {

        console.error(
            'Error fetching leave history:',
            error
        );

        res.status(500).json({
            message: 'Server error'
        });
    }
};

// ======================================================
// APPLY LEAVE
// ======================================================

export const applyLeave = async (
    req: Request,
    res: Response
) => {

    try {

        const userId = (req as any).user?.id;

        const tenantId =
            (req as any).user?.tenantId;

        if (!userId || !tenantId) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        const {
            leaveTypeCode,
            startDate,
            endDate,
            reason
        } = req.body;

        if (
            !leaveTypeCode ||
            !startDate ||
            !endDate ||
            !reason
        ) {

            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        // Find leave type
        const leaveType =
            await prisma.leaveType.findFirst({
                where: {
                    code: leaveTypeCode,
                    tenantId
                }
            });

        if (!leaveType) {
            return res.status(404).json({
                message: 'Leave type not found'
            });
        }

        // Calculate leave days
        const calculatedLeaveDays =
            await calculateLeaveDays({
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                tenantId,
                sandwichRule:
                    leaveType.sandwichRule
            });

        console.log(
            "Calculated Leave Days:",
            calculatedLeaveDays
        );

        // Create leave request
        const newLeave =
            await prisma.leave.create({
                data: {
                    userId,
                    tenantId,
                    leaveTypeId: leaveType.id,

                    startDate:
                        new Date(startDate),

                    endDate:
                        new Date(endDate),

                    reason,

                    status: 'PENDING'
                }
            });

        // Employee details
        const employee =
            await prisma.user.findFirst({
                where: {
                    id: userId,
                    tenantId
                },

                select: {
                    name: true
                }
            });

        // Notify admins
        await notifyAdmins({
            tenantId,

            title: 'New Leave Request',

            message:
                `${employee?.name || 'Employee'} requested ${leaveType.name} from ${startDate} to ${endDate}.`,

            type: 'leave',
        });

        res.status(201).json(newLeave);

    } catch (error) {

        console.error(
            'Error applying for leave:',
            error
        );

        res.status(500).json({
            message: 'Server error'
        });
    }
};

// ======================================================
// UPDATE LEAVE STATUS
// ======================================================

export const updateLeaveStatus = async (
    req: Request,
    res: Response
) => {

    try {

        const { id } = req.params;

        const { status } = req.body;

        const tenantId =
            (req as any).user?.tenantId;

        if (!tenantId) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        const updatedLeave =
            await prisma.leave.update({

                where: {
                    id: Number(id),
                    tenantId
                },

                data: {
                    status
                },

                include: {
                    leaveType: true,

                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

        // Notify employee
        await createNotification({
            tenantId,

            userId: updatedLeave.userId,

            title: 'Leave Status Updated',

            message:
                `Your ${updatedLeave.leaveType?.name || 'leave'} request has been ${status}.`,

            type: 'leave',
        });

        res.json(updatedLeave);

    } catch (error) {

        console.error(
            'Error updating leave status:',
            error
        );

        res.status(500).json({
            message: 'Server error'
        });
    }
};