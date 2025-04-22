import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import 'dotenv/config';
import jwt from "jsonwebtoken"


export const authenticateUser = (req, res, next) => {
    const token = req.cookies.token || req.header("Authorization")?.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_DASHBOARD);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};
