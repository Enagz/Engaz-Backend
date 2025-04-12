import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


export const getLanguage = async (req, res) => {
    try {
        const language = await prisma.languge.findMany();
        if (!language) {
            return res.status(404).json({ message: "Language not found" });
        }
        res.status(200).json(language);
    }
    catch (error) {
        console.log(error);
        next(error);

    }
}