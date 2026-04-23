import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all employees for the tenant
export const getAllEmployees = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId;
        if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

        const employees = await prisma.user.findMany({
            where: { tenantId },
            include: {
                employeeProfile: true,
                role: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new employee (Onboarding)
export const createEmployee = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId;
        if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

        const {
            name, email, password, phone, roleId, 
            department, location, title, joiningDate,
            uan, pfNumber, esic, pan, aadhaar,
            bankName, accountNumber, ifsc
        } = req.body;

        // Basic validation
        if (!email || !name) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        // Check if user already exists in this tenant
        const existingUser = await prisma.user.findUnique({
            where: { email_tenantId: { email, tenantId } }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // If no roleId provided, find the default 'EMPLOYEE' role
        let targetRoleId = roleId;
        if (!targetRoleId) {
            const defaultRole = await prisma.role.findFirst({
                where: { name: 'EMPLOYEE', tenantId }
            });
            targetRoleId = defaultRole?.id;
        }

        const newUser = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: password || 'Welcome@123', // Default password
                    tenantId,
                    roleId: targetRoleId
                }
            });

            // 2. Create Employee Profile
            const profile = await tx.employeeProfile.create({
                data: {
                    userId: user.id,
                    tenantId,
                    phone,
                    department,
                    location,
                    title,
                    joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
                    status: 'Active'
                }
            });

            // 3. Create Statutory Details
            await tx.statutoryDetails.create({
                data: {
                    profileId: profile.id,
                    uan,
                    pfNumber,
                    esic,
                    pan,
                    aadhaar
                }
            });

            // 4. Create Bank Details
            await tx.bankDetails.create({
                data: {
                    profileId: profile.id,
                    bankName: bankName || 'Not Provided',
                    accountNumber: accountNumber || 'Not Provided',
                    ifsc: ifsc || 'Not Provided'
                }
            });

            return user;
        });

        res.status(201).json(newUser);
    } catch (error: any) {
        console.error('Error creating employee:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Employee Profile with all details
export const getEmployee = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = (req as any).user?.tenantId; // Assuming auth middleware attaches user

        if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

        const employee = await prisma.user.findFirst({
            where: {
                id: Number(id),
                tenantId
            },
            include: {
                employeeProfile: {
                    include: {
                        statutory: true,
                        bank: true,
                        documents: true,
                        salary: true
                    }
                },
                role: true,
                manager: true
            }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Employee Profile (Personal, Statutory, Bank)
export const updateEmployee = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            // Personal
            phone, dob, bloodGroup, address, location, department, title,
            // Statutory
            uan, pfNumber, esic, pan, aadhaar,
            // Bank
            bankName, accountNumber, ifsc
        } = req.body;

        const tenantId = (req as any).user?.tenantId;
        if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

        // Upsert Profile
        const updatedProfile = await prisma.employeeProfile.upsert({
            where: { userId: Number(id) },
            create: {
                userId: Number(id),
                tenantId,
                title, department, location, phone, dob: dob ? new Date(dob) : undefined, bloodGroup, address,
                statutory: {
                    create: { uan, pfNumber, esic, pan, aadhaar }
                },
                bank: {
                    create: { bankName, accountNumber, ifsc }
                }
            },
            update: {
                title, department, location, phone, dob: dob ? new Date(dob) : undefined, bloodGroup, address,
                statutory: {
                    upsert: {
                        create: { uan, pfNumber, esic, pan, aadhaar },
                        update: { uan, pfNumber, esic, pan, aadhaar }
                    }
                },
                bank: {
                    upsert: {
                        create: { bankName, accountNumber, ifsc },
                        update: { bankName, accountNumber, ifsc }
                    }
                }
            },
            include: {
                statutory: true,
                bank: true
            }
        });

        res.json(updatedProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add Document
export const addDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, url, type } = req.body;

        // Find Profile ID first
        const profile = await prisma.employeeProfile.findUnique({ where: { userId: Number(id) } });
        if (!profile) return res.status(404).json({ message: 'Profile not found. Create profile first.' });

        const doc = await prisma.document.create({
            data: {
                profileId: profile.id,
                name,
                url, // In real app, this comes from file upload middleware
                type
            }
        });

        res.status(201).json(doc);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete Document
export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { docId } = req.params;
        await prisma.document.delete({ where: { id: Number(docId) } });
        res.json({ message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get profile of the currently logged-in user
export const getCurrentEmployee = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const tenantId = (req as any).user?.tenantId;

        if (!userId || !tenantId) return res.status(401).json({ message: 'Unauthorized' });

        const employee = await prisma.user.findFirst({
            where: {
                id: userId,
                tenantId
            },
            include: {
                employeeProfile: {
                    include: {
                        statutory: true,
                        bank: true,
                        documents: true,
                        salary: true
                    }
                },
                role: true,
                manager: true
            }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        res.json(employee);
    } catch (error) {
        console.error('Error fetching current employee:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
