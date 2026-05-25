import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const createTransporter = () =>
    nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
    });

export const sendWelcomeEmail = async (
    toEmail: string,
    employeeName: string,
    password: string
) => {
    await createTransporter().sendMail({
        from: `"EnCalm HRX" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Welcome to EnCalm HRX — Your Login Credentials',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            <div style="background: #4f46e5; padding: 24px 32px;">
                <h1 style="color: white; margin: 0; font-size: 22px;">Welcome to EnCalm HRX</h1>
            </div>
            <div style="padding: 32px;">
                <p style="color: #374151; font-size: 15px;">Hi <strong>${employeeName}</strong>,</p>
                <p style="color: #374151; font-size: 15px;">Your employee account has been created. Here are your login credentials:</p>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Login Email</p>
                    <p style="margin: 0 0 20px; color: #111827; font-size: 16px; font-weight: bold;">${toEmail}</p>
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Temporary Password</p>
                    <p style="margin: 0; color: #4f46e5; font-size: 20px; font-weight: bold; letter-spacing: 0.1em;">${password}</p>
                </div>
                <p style="color: #ef4444; font-size: 13px;">Please change your password after your first login.</p>
                <p style="color: #6b7280; font-size: 13px; margin-top: 32px;">If you have any issues, contact your HR administrator.</p>
            </div>
        </div>
        `,
    });
};
