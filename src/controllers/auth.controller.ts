import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        // Note: checking globally first, assuming email is unique per login.
        // If system is strictly multi-tenant with same email allowed across tenants, we'd need tenantId or domain in login.
        // For this SaaS, we'll assume email is unique globally for simplicity or user selects tenant later.
        // Based on schema, user is unique on [email, tenantId].
        // Let's assume for now we allow login if we find ANY match, or assume email is unique enough.
        // Better approach: Find user by email. If multiple, asking for tenant is needed. 
        // For this MVP, let's just findFirst.
        const user = await prisma.user.findFirst({
            where: { email },
            include: { role: true, tenant: true }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Password check (TODO: Add hashing in production)
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                tenantId: user.tenantId,
                roleId: user.roleId,
                role: user.role?.name || 'EMPLOYEE'
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        // Return user info and token
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role?.name || 'EMPLOYEE',
                tenantId: user.tenantId,
                tenantName: user.tenant.name,
                accessibleModules: user.role?.accessibleModules ? user.role.accessibleModules.split(',') : []
            }
        });

    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', details: error.message, stack: error.stack });
    }
};
