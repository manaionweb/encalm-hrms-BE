import { Request, Response, NextFunction } from 'express';

export const authorizeRoles = (roles: string[]) => {

    return (
        req: any,
        res: Response,
        next: NextFunction
    ) => {

        const userRole =
            req.user?.role?.name || req.user?.role;

        // Check role
        if (!roles.includes(userRole)) {

            return res.status(403).json({
                message: 'Access denied'
            });
        }

        next();
    };
};