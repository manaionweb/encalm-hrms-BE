// import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';
// import jwt from 'jsonwebtoken';

// const prisma = new PrismaClient();

// export const login = async (req: Request, res: Response) => {
//     try {
//         const { email, password } = req.body;

//         // Basic validation
//         if (!email || !password) {
//             return res.status(400).json({ message: 'Email and password are required' });
//         }

//         // Find user
//         // Note: checking globally first, assuming email is unique per login.
//         // If system is strictly multi-tenant with same email allowed across tenants, we'd need tenantId or domain in login.
//         // For this SaaS, we'll assume email is unique globally for simplicity or user selects tenant later.
//         // Based on schema, user is unique on [email, tenantId].
//         // Let's assume for now we allow login if we find ANY match, or assume email is unique enough.
//         // Better approach: Find user by email. If multiple, asking for tenant is needed. 
//         // For this MVP, let's just findFirst.
//         const user = await prisma.user.findFirst({
//             where: { email },
//             include: { role: true, tenant: true }
//         });

//         if (!user) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//         // Password check (TODO: Add hashing in production)
//         if (user.password !== password) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//         // Generate Token
//         const token = jwt.sign(
//             {
//                 id: user.id,
//                 email: user.email,
//                 tenantId: user.tenantId,
//                 roleId: user.roleId,
//                 role: user.role?.name || 'EMPLOYEE'
//             },
//             process.env.JWT_SECRET || 'secret',
//             { expiresIn: '24h' }
//         );

//         // Return user info and token
//         res.json({
//             token,
//             user: {
//                 id: user.id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role?.name || 'EMPLOYEE',
//                 tenantId: user.tenantId,
//                 tenantName: user.tenant.name,
//                 accessibleModules: user.role?.accessibleModules ? user.role.accessibleModules.split(',') : []
//             }
//         });

//     } catch (error: any) {
//         console.error('Login error:', error);
//         res.status(500).json({ message: 'Server error', details: error.message, stack: error.stack });
//     }
// };


import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
// import  Jwt  from "jsonwebtoken";
import * as jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, tenantId } = req.body;

    // 1. Validate
    if (!name || !email || !password || !tenantId) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 2. Check existing user (same tenant)
    const existingUser = await prisma.user.findFirst({
      where: { email, tenantId }
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 3. Hash password 
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Get default role
    const role = await prisma.role.findFirst({
      where: { name: "EMPLOYEE" }
    });

    if (!role) {
      return res.status(500).json({ message: "Role not found" });
    }

    // 5. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tenantId,
        roleId: role.id
      },
      include: { role: true, tenant: true }
    });

    // 6. Response (no password)
    res.json({
      message: "Signup successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role?.name || "EMPLOYEE"
      }
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Signup error" });
  }
};



// ================= LOGIN =================

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. find user
    const user = await prisma.user.findFirst({
      where: { email },
      include: { role: true, tenant: true }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2. compare password
    const isMatch = await bcrypt.compare(password, user.password as string);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. check JWT_SECRET ( FIX 2)
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET not defined" });
    }

    // 4. create token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role?.name || "EMPLOYEE"
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 5. send response
    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role?.name || "EMPLOYEE"
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login error" });
  }
};

//tenant creation.....................

export const createTenant = async (req: Request, res: Response) => {
  try {
    const { name, domain, logo, plan } = req.body;

    // validation
    if (!name || !domain) {
      return res.status(400).json({
        message: "Name and domain are required"
      });
    }

    // check duplicate domain
    const existingTenant = await prisma.tenant.findUnique({
      where: { domain }
    });

    if (existingTenant) {
      return res.status(400).json({
        message: "Tenant with this domain already exists"
      });
    }

    //  create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        domain,
        logo: logo || null,
        plan: plan || "FREE"
      }
    });

    return res.status(201).json({
      message: "Tenant created successfully",
      tenant
    });

  } catch (error: any) {
    console.error("Tenant creation error:", error);

    return res.status(500).json({
      message: "Error creating tenant",
      error: error.message
    });
  }
};