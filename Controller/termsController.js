import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { date, z } from "zod";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";
import e from "express";
import tocsv from "json2csv";
import ExcelJS from "exceljs";
import { count } from "console";




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
