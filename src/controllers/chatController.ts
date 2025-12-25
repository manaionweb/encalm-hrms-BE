
import { Request, Response } from 'express';
import { prisma } from '../app';

export const chatHandler = async (req: Request, res: Response) => {
    const { message, userId } = req.body;

    if (!message) {
        res.status(400).json({ reply: "Please say something." });
        return;
    }

    const lowerMsg = message.toLowerCase();
    const uid = userId || 1; // Default for demo

    try {
        // 1. Pending Leaves / Status
        if (lowerMsg.includes('pending leave') || lowerMsg.includes('leave status') || lowerMsg.includes('my leaves')) {
            const leaves = await prisma.leave.findMany({
                where: { userId: uid, status: 'PENDING' },
                include: { leaveType: true }
            });

            if (leaves.length === 0) {
                res.json({ reply: "You have no pending leaves." });
                return;
            }

            const leaveDetails = leaves.map(l => `${l.leaveType?.name || 'Leave'} from ${new Date(l.startDate).toLocaleDateString()} to ${new Date(l.endDate).toLocaleDateString()}`).join(', ');
            res.json({ reply: `You have ${leaves.length} pending leave(s): ${leaveDetails}` });
            return;
        }

        // 2. Policy / Entitlement
        if (lowerMsg.includes('policy') || lowerMsg.includes('entitlement')) {
            const policies = await prisma.leaveType.findMany();
            if (policies.length === 0) {
                res.json({ reply: "Leave policies are not yet configured. Generally, you get 1.5 PL per month." });
                return;
            }
            const policyText = policies.map(p => `${p.name}: ${p.daysPerYear} days/year`).join('\n');
            res.json({ reply: `Here are your leave entitlements:\n${policyText}` });
            return;
        }

        // 3. Holidays
        if (lowerMsg.includes('holiday')) {
            const today = new Date();
            const holidays = await prisma.holiday.findMany({
                where: { date: { gte: today } },
                take: 3,
                orderBy: { date: 'asc' }
            });

            if (holidays.length === 0) {
                res.json({ reply: "There are no upcoming holidays listed for the near future." });
                return;
            }

            const holidayText = holidays.map(h => `${h.name} on ${new Date(h.date).toLocaleDateString()}`).join(', ');
            res.json({ reply: `Upcoming Holidays:\n${holidayText}` });
            return;
        }

        // 4. Salary / Payroll
        if (lowerMsg.includes('salary') || lowerMsg.includes('pay') || lowerMsg.includes('ctc')) {
            const employee = await prisma.employeeProfile.findUnique({
                where: { userId: uid },
                include: { salary: true }
            });

            if (!employee || !employee.salary) {
                res.json({ reply: "Your salary structure details are not available. Please contact HR." });
                return;
            }

            const s = employee.salary;
            res.json({
                reply: `Your Salary Structure:\nBasic: ₹${s.basic}\nHRA: ₹${s.hra}\nSpecial: ₹${s.special}\n\nDeductions:\nPF: ₹${s.pf}\nTax: ₹${s.tax}`
            });
            return;
        }

        // 5. Tax / IT Declaration
        if (lowerMsg.includes('tax') || lowerMsg.includes('investment')) {
            res.json({ reply: "You can submit 80C and 80D proofs in the Tax Declaration portal by March 31st. Navigate to 'Salary' -> 'declarations'." });
            return;
        }

        // Default Fallback
        res.json({
            reply: "I'm not sure about that. I can help with:",
            options: [
                { label: 'My Leaves', query: 'pending leaves' },
                { label: 'Holidays', query: 'upcoming holidays' },
                { label: 'Leave Policy', query: 'leave policy' },
                { label: 'Salary Info', query: 'my salary info' }
            ]
        });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ reply: "I encountered an error looking that up. Please try again." });
    }
};
