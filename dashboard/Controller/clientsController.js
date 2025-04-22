import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { z } from "zod";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";


export const clientTable = async (req, res , next) => {
    try{
        const {title} = req.user ;
        const {page} = req.query;

        if(title !== "admin" && title !== "superAdmin"){
            return res.status(403).json({message: "you are not authorized"});
        };
        const pageNumber = parseInt(page) || 1;
        const pageSize = 4;
        const skip = (pageNumber - 1) * pageSize;
        const clients = await prisma.user.findMany({
            skip: skip,
            take: pageSize,
            select:{
                id: true,
                email: true,
                name: true,
                phone: true,
                ordersCounter: true,
                createdAt: true,
                lastOrder: true,
                totalRevenue: true,
            },
            orderBy: {
            totalRevenue: "desc",
            },
        });
        const mappedclients = clients.map((client) => {
            let isActive = false;
            if (client.lastOrder && new Date(client.lastOrder) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
            isActive = true;
            }
            return {
                ...client,
                isActive: isActive,
            };
        });

        res.status(200).json({
            clients: mappedclients,
            page: pageNumber,
            totalPages: Math.ceil(await prisma.user.count() / pageSize),
        });

    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

