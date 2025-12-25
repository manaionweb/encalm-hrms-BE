import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generic handler for fetching all records of a master
export const getAll = (model: string) => async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.user as any;
        // @ts-ignore
        const data = await prisma[model].findMany({
            where: { tenantId }
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
};

// Generic handler for creating a record
export const create = (model: string) => async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.user as any;
        // @ts-ignore
        const data = await prisma[model].create({
            data: { ...req.body, tenantId }
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create record' });
    }
};

// COMPANY
export const getCompany = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.user as any;
        const company = await prisma.company.findFirst({
            where: { tenantId },
            include: { locations: true, departments: true, designations: true }
        });
        res.json(company);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch company" });
    }
}

export const updateCompany = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.user as any;
        const { legalName, cin, pan, tan, gstin, regAddress, website, logo, primaryColor, secondaryColor } = req.body;

        // Upsert company
        const company = await prisma.company.findFirst({ where: { tenantId } });

        if (company) {
            const updated = await prisma.company.update({
                where: { id: company.id },
                data: { legalName, cin, pan, tan, gstin, regAddress, website, logo, primaryColor, secondaryColor }
            });
            res.json(updated);
        } else {
            const newCompany = await prisma.company.create({
                data: {
                    tenantId, legalName, cin, pan, tan, gstin, regAddress, website, logo, primaryColor, secondaryColor
                }
            });
            res.json(newCompany);
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update company" });
    }
}


// SPECIFIC CONTROLLERS FOR NESTED LOGIC

export const createLocation = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.user as any;
        const { companyId, ...data } = req.body;
        // Ensure company belongs to tenant
        const company = await prisma.company.findFirst({ where: { id: companyId, tenantId } });
        if (!company) return res.status(404).json({ error: "Company not found" });

        const location = await prisma.location.create({
            data: { ...data, companyId, tenantId }
        });
        res.json(location);
    } catch (error) {
        res.status(500).json({ error: "Failed to create location" });
    }
}

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.user as any;
        const { companyId, ...data } = req.body;
        const company = await prisma.company.findFirst({ where: { id: companyId, tenantId } });
        if (!company) return res.status(404).json({ error: "Company not found" });

        const dept = await prisma.department.create({
            data: { ...data, companyId, tenantId }
        });
        res.json(dept);
    } catch (error) {
        res.status(500).json({ error: "Failed to create department" });
    }
}

// STATUTORY SETTINGS
export const getStatutorySettings = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.user as any;
        const settings = await prisma.statutorySettings.findUnique({ where: { tenantId } });
        res.json(settings || {});
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch statutory settings" });
    }
}

export const updateStatutorySettings = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.user as any;
        const settings = await prisma.statutorySettings.upsert({
            where: { tenantId },
            update: req.body,
            create: { ...req.body, tenantId }
        });
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: "Failed to update statutory settings" });
    }
}

// GEO MASTERS
export const getStates = async (req: Request, res: Response) => {
    try {
        const states = await prisma.state.findMany({ orderBy: { name: 'asc' } });
        res.json(states);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch states" });
    }
}

export const getCities = async (req: Request, res: Response) => {
    try {
        const { stateId } = req.query;
        if (!stateId) return res.status(400).json({ error: "State ID is required" });

        const cities = await prisma.city.findMany({
            where: { stateId: Number(stateId) },
            orderBy: { name: 'asc' }
        });
        res.json(cities);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch cities" });
    }
}

// ATTENDANCE & LEAVE MASTERS

// Attendance Polcy
export const getAttendancePolicy = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.user as any;
        const policy = await prisma.attendancePolicy.findUnique({ where: { tenantId } });
        res.json(policy || {});
    } catch (error) { res.status(500).json({ error: "Failed to fetch policy" }); }
}

export const updateAttendancePolicy = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.user as any;
        const policy = await prisma.attendancePolicy.upsert({
            where: { tenantId },
            update: req.body,
            create: { ...req.body, tenantId }
        });
        res.json(policy);
    } catch (error) { res.status(500).json({ error: "Failed to update policy" }); }
}

// ACCESS CONTROL
export const getPermissions = async (req: Request, res: Response) => {
    try {
        const permissions = await prisma.permission.findMany();
        res.json(permissions);
    } catch (error) { res.status(500).json({ error: "Failed to fetch permissions" }); }
}

export const getRoles = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.user as any;
        const roles = await prisma.role.findMany({
            where: { tenantId },
            include: { permissions: true }
        });
        res.json(roles);
    } catch (error) { res.status(500).json({ error: "Failed to fetch roles" }); }
}

export const createRole = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.user as any;
        const { name, permissionIds, accessibleModules } = req.body;

        const role = await prisma.role.create({
            data: {
                name,
                tenantId,
                accessibleModules: accessibleModules ? accessibleModules.join(',') : "",
                permissions: {
                    connect: permissionIds.map((id: string) => ({ id }))
                }
            },
            include: { permissions: true }
        });
        res.json(role);
    } catch (error) { res.status(500).json({ error: "Failed to create role" }); }
}

export const updateRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, permissionIds, accessibleModules } = req.body;

        const role = await prisma.role.update({
            where: { id: Number(id) },
            data: {
                name,
                accessibleModules: accessibleModules ? accessibleModules.join(',') : "",
                permissions: {
                    set: [],
                    connect: permissionIds.map((pid: string) => ({ id: pid }))
                }
            },
            include: { permissions: true }
        });
        res.json(role);
    } catch (error) { res.status(500).json({ error: "Failed to update role" }); }
}
