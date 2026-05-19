export const authorize = (...allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: "Access denied: insufficient permissions"
      });
    }

    next();
  };
};