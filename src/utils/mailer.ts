// import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';
// dotenv.config();

// const createTransporter = () =>
//     nodemailer.createTransport({
//         host: 'smtp.gmail.com',
//         port: 587,
//         secure: false,
//         requireTLS: true,
//         auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS,
//         },
//         tls: { rejectUnauthorized: false },
//     });

// export const sendForgotPasswordEmail = async (
//     toEmail: string,
//     tempPassword: string
// ) => {
//     const loginUrl = `${process.env.APP_URL || 'http://localhost:5173'}/signin`;
//     await createTransporter().sendMail({
//         from: `"EnCalm HRX" <${process.env.EMAIL_USER}>`,
//         to: toEmail,
//         subject: 'EnCalm HRX — Your Temporary Password',
//         html: `
//         <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
//             <div style="background: #4f46e5; padding: 24px 32px;">
//                 <h1 style="color: white; margin: 0; font-size: 22px;">Password Reset</h1>
//             </div>
//             <div style="padding: 32px;">
//                 <p style="color: #374151; font-size: 15px;">We received a password reset request for your account.</p>
//                 <p style="color: #374151; font-size: 15px;">Here is your temporary password:</p>
//                 <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
//                     <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Temporary Password</p>
//                     <p style="margin: 0; color: #4f46e5; font-size: 24px; font-weight: bold; letter-spacing: 0.15em;">${tempPassword}</p>
//                 </div>
//                 <p style="color: #ef4444; font-size: 13px;">This password is valid until you change it. Please update it after logging in.</p>
//                 <div style="text-align: center; margin: 28px 0;">
//                     <a href="${loginUrl}" style="background: #4f46e5; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">Login to EnCalm HRX</a>
//                 </div>
//                 <p style="color: #6b7280; font-size: 12px; text-align: center;">Or copy this link: <a href="${loginUrl}" style="color: #4f46e5;">${loginUrl}</a></p>
//             </div>
//         </div>
//         `,
//     });
// };
//     toEmail: string,
//     employeeName: string,
//     password: string
// ) => {
//     const loginUrl = `${process.env.APP_URL || 'http://localhost:5173'}/signin`;
//     await createTransporter().sendMail({
//         from: `"EnCalm HRX" <${process.env.EMAIL_USER}>`,
//         to: toEmail,
//         subject: 'Welcome to EnCalm HRX — Your Login Credentials',
//         html: `
//         <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
//             <div style="background: #4f46e5; padding: 24px 32px;">
//                 <h1 style="color: white; margin: 0; font-size: 22px;">Welcome to EnCalm HRX</h1>
//             </div>
//             <div style="padding: 32px;">
//                 <p style="color: #374151; font-size: 15px;">Hi <strong>${employeeName}</strong>,</p>
//                 <p style="color: #374151; font-size: 15px;">Your employee account has been created. Here are your login credentials:</p>
//                 <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
//                     <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Login Email</p>
//                     <p style="margin: 0 0 20px; color: #111827; font-size: 16px; font-weight: bold;">${toEmail}</p>
//                     <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Temporary Password</p>
//                     <p style="margin: 0; color: #4f46e5; font-size: 20px; font-weight: bold; letter-spacing: 0.1em;">${password}</p>
//                 </div>
//                 <p style="color: #ef4444; font-size: 13px;">Please change your password after your first login.</p>
//                 <div style="text-align: center; margin: 28px 0;">
//                     <a href="${loginUrl}" style="background: #4f46e5; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">Login to EnCalm HRX</a>
//                 </div>
//                 <p style="color: #6b7280; font-size: 12px; text-align: center;">Or copy this link: <a href="${loginUrl}" style="color: #4f46e5;">${loginUrl}</a></p>
//                 <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">If you have any issues, contact your HR administrator.</p>
//             </div>
//         </div>
//         `,
//     });
// };



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

        tls: {
            rejectUnauthorized: false,
        },
    });



// ========================================
// FORGOT PASSWORD EMAIL
// ========================================

export const sendForgotPasswordEmail = async (
    toEmail: string,
    tempPassword: string
) => {

    const loginUrl =
        `${process.env.APP_URL || 'http://localhost:5173'}/signin`;

    await createTransporter().sendMail({

        from: `"EnCalm HRX" <${process.env.EMAIL_USER}>`,

        to: toEmail,

        subject: 'EnCalm HRX — Your Temporary Password',

        html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">

            <div style="background: #4f46e5; padding: 24px 32px;">
                <h1 style="color: white; margin: 0; font-size: 22px;">
                    Password Reset
                </h1>
            </div>

            <div style="padding: 32px;">

                <p style="color: #374151; font-size: 15px;">
                    We received a password reset request for your account.
                </p>

                <p style="color: #374151; font-size: 15px;">
                    Here is your temporary password:
                </p>

                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">

                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: bold;">
                        Temporary Password
                    </p>

                    <p style="margin: 0; color: #4f46e5; font-size: 24px; font-weight: bold;">
                        ${tempPassword}
                    </p>

                </div>

                <p style="color: #ef4444; font-size: 13px;">
                    Please change your password after login.
                </p>

                <div style="text-align: center; margin: 28px 0;">

                    <a
                        href="${loginUrl}"
                        style="background: #4f46e5; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold;"
                    >
                        Login to EnCalm HRX
                    </a>

                </div>

            </div>
        </div>
        `,
    });
};



// ========================================
// WELCOME EMAIL
// ========================================

export const sendWelcomeEmail = async (
    toEmail: string,
    employeeName: string,
    password: string
) => {

    const loginUrl =
        `${process.env.APP_URL || 'http://localhost:5173'}/signin`;

    await createTransporter().sendMail({

        from: `"EnCalm HRX" <${process.env.EMAIL_USER}>`,

        to: toEmail,

        subject: 'Welcome to EnCalm HRX — Your Login Credentials',

        html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">

            <div style="background: #4f46e5; padding: 24px 32px;">
                <h1 style="color: white; margin: 0; font-size: 22px;">
                    Welcome to EnCalm HRX
                </h1>
            </div>

            <div style="padding: 32px;">

                <p style="color: #374151; font-size: 15px;">
                    Hi <strong>${employeeName}</strong>,
                </p>

                <p style="color: #374151; font-size: 15px;">
                    Your employee account has been created successfully.
                </p>

                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">

                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: bold;">
                        Login Email
                    </p>

                    <p style="margin: 0 0 20px; color: #111827; font-size: 16px; font-weight: bold;">
                        ${toEmail}
                    </p>

                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: bold;">
                        Temporary Password
                    </p>

                    <p style="margin: 0; color: #4f46e5; font-size: 20px; font-weight: bold;">
                        ${password}
                    </p>

                </div>

                <p style="color: #ef4444; font-size: 13px;">
                    Please change your password after first login.
                </p>

                <div style="text-align: center; margin: 28px 0;">

                    <a
                        href="${loginUrl}"
                        style="background: #4f46e5; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold;"
                    >
                        Login to EnCalm HRX
                    </a>

                </div>

            </div>
        </div>
        `,
    });
};