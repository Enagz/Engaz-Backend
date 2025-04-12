import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { z } from "zod";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";

export const getUserName = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { user_Id } = req.params;
    if (userId !== user_Id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      firstname: user.name.split(" ")[0],
      lastname: user.name.split(" ")[1],
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const changephone = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { user_Id } = req.params;
    if (userId !== user_Id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { phone, countrycode } = req.body;

    if (!phone || !countrycode) {
      return res
        .status(400)
        .json({ message: "Phone number and country code are required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, countrycode: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { phone, countrycode },
    });
    return res
      .status(200)
      .json({ message: "Phone number updated successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const emailchangerequest = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { user_Id } = req.params;
    const { email } = req.body;
    let formatedemail ;
    if (userId !== user_Id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    formatedemail = email.toLowerCase();
    const isexict = await prisma.user.findUnique({where: { email: formatedemail }});
    if(isexict) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const emailchangecode = Math.floor(1000 + Math.random() * 9000)
      .toString()
      .padStart(4, "0");
    const emailchangeexpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await prisma.user.update({
      where: { id: userId },
      data: {
        chabgeemailCode: emailchangecode,
        changeemailexpire: emailchangeexpire,
      },
    });
    //send email
    res.status(200).json({ message: "Email change code sent successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const emailchangecode = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { user_Id } = req.params;
    const { code } = req.body;
    if (userId !== user_Id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!code) {
      return res.status(400).json({ message: "Email change code is required" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { chabgeemailCode: true, changeemailexpire: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.chabgeemailCode !== code) {
      return res.status(400).json({ message: "Invalid email change code" });
    }

    if (user.changeemailexpire < new Date()) {
      return res.status(400).json({ message: "Email change code expired" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        chabgeemailCode: null,
        changeemailexpire: null,
        changeemailpermession: true,
      },
    });
    return res
      .status(200)
      .json({ message: "Email change code verified successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const changeemail = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { user_Id } = req.params;
    const { email } = req.body;
    if (userId !== user_Id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, changeemailpermession: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.changeemailpermession) {
      return res
        .status(400)
        .json({ message: "Email change permission not granted" });
    }
    const formatedemail = email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: formatedemail },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { email: formatedemail, changeemailpermession: false },
    });
    return res.status(200).json({ message: "Email changed successfully" });
  }
  catch(error) {
    console.error(error);
    next(error);
  }
}


export const userDelete = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { user_Id } = req.params;
    if (userId !== user_Id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const now = new Date() ;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, Isactive: true , email: true , phone: true },
    });
    await prisma.user.update({ where: { id: userId } , data: { Isactive: false , email: user.email + now , phone: user.phone + "_" + now } });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
}