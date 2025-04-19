import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";


export const getConditions = async (req , res , next) => {
    try {

        const terms = await prisma.terms.findFirst({select : {EnglishTerms: true , ArabicTerms : true}});
        if(!terms) {
            return res.status(404).json({message: "Terms not found"});
        }
        return res.status(200).json({terms});
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

export const getPrivacy = async (req , res , next) => {
    try {

        const privacy = await prisma.terms.findFirst({select : {EnglishPrivacy: true , ArabicPrivacy : true}});
        if(!privacy) {
            return res.status(404).json({message: "Privacy not found"});
        }
        return res.status(200).json({privacy});
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

export const getUsage = async (req , res , next) => {
    try {

        const usage = await prisma.terms.findFirst({select : {EnglishUsage: true , ArabicUsage : true}});
        if(!usage) {
            return res.status(404).json({message: "Usage privacy not found"});
        }
        return res.status(200).json({usage});
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}


export const updateConditions = async (req , res , next) => {
    try {
        const {arabicConditions , englishConditions} = req.body;
        if(!arabicConditions || !englishConditions) {
            return res.status(400).json({message: "Please provide arabic and english conditions"});
        }
        const conditions = await prisma.terms.findFirst({select : {id: true}}); ;
        if(!conditions) {
            return res.status(404).json({message: "Terms not found"});
        }
        const updatedConditions = await prisma.terms.update({
            where: { id: conditions.id },
            data: {
                ArabicTerms: arabicConditions,
                EnglishTerms: englishConditions,
            },
        });

    }
    catch(error) {
        console.log(error);
        next(error);
    }
}



export const updatePrivacy = async (req , res , next) => {
    try {
        const {arabicPrivacy , englishPrivacy} = req.body;
        if(!arabicPrivacy || !englishPrivacy) {
            return res.status(400).json({message: "Please provide arabic and english privacy"});
        }
        const privacy = await prisma.terms.findFirst({select : {id: true}}); ;
        if(!privacy) {
            return res.status(404).json({message: "Privacy not found"});
        }
        const updatedConditions = await prisma.terms.update({
            where: { id: privacy.id },
            data: {
                ArabicPrivacy: arabicPrivacy,
                EnglishPrivacy: englishPrivacy,
            },
        });

    }
    catch(error) {
        console.log(error);
        next(error);
    }
}



export const updateUsage = async (req , res , next) => {
    try {
        const {arabicUsage , englishUsage} = req.body;
        if(!arabicUsage || !englishUsage) {
            return res.status(400).json({message: "Please provide arabic and english usage privacy"});
        }
        const usage = await prisma.terms.findFirst({select : {id: true}}); ;
        if(!usage) {
            return res.status(404).json({message: "Usage privacy not found"});
        }
        const updatedUsage = await prisma.terms.update({
            where: { id: privacy.id },
            data: {
                ArabicUsage: arabicUsage,
                EnglishUsage: englishUsage,
            },
        });

    }
    catch(error) {
        console.log(error);
        next(error);
    }
}