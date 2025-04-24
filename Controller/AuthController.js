import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { z } from "zod";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";

export const GoogleLoign = async (req, res, next) => {
  res.oidc.login({
    returnTo: "/api/save-profile",
    authorizationParams: {
      connection: "google-oauth2",
    },
  });
};

export const saveProfile = async (req, res, next) => {
  try {
    let newUser;
    let verfied = true;
    const Authuser = req.oidc.user;
    if (!Authuser) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = await prisma.user.findUnique({
      where: { AuthID: Authuser.sub },
    });

    if (!user) {
      newUser = await prisma.user.create({
        data: {
          email: Authuser.email,
          name: Authuser.name,
          AuthID: Authuser.sub,
          password: null,
        },
      });
      verfied = false;
    }

    if (user && user.phone == null) {
      verfied = false;
    }

    const JWTPayload = {
      userId: user?.id || newUser.id,
      username: user?.name || newUser.name,
      email: user?.email || newUser.email,
      verfied: verfied,
    };

    const JWTsecretKey = process.env.JWT_SECRET;
    const token = jwt.sign(JWTPayload, JWTsecretKey);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res
      .status(200)
      .json({ message: "Login successful", token: token, verfied: verfied });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const verifyUser = async (req, res, next) => {
  try {
    const { phone, countrycode } = req.body;
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: phone,
        countrycode: countrycode,
      },
    });

    res.status(200).json({ message: "User is verified successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const signup = async (req, res, next) => {
  try {
    const { firstname, lastname, phone, email, countrycode } = req.body;
    const formatedemail = email.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
      OR: [
        { email: formatedemail },
        { phone: phone },
      ],
      },
    });

    if (user) {
      return res.status(400).json({ error: "Email or phone is already taken" });
    }

    const newUser = await prisma.user.create({
      data: {
        name: `${firstname} ${lastname}`,
        phone: phone,
        countrycode: countrycode,
        email: formatedemail,
      },
    });
    res
      .status(201)
      .json({ message: "User is created successfully", user: newUser.id });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { method, id } = req.body;
    let user;
    if (method == "PHONE") {
      user = await prisma.user.findUnique({ where: { phone: id , isDeleted: false} });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    } else if (method == "EMAIL") {
      const formatedemail = id.toLowerCase();
      user = await prisma.user.findUnique({ where: { email: formatedemail  , isDeleted:false} });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const loginCode = Math.floor(1000 + Math.random() * 9000)
      .toString()
      .padStart(4, "0");
    const loginExpire = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { loginCode: loginCode, loginexpire: loginExpire },
    });

    const msg = {
      to: user.email,
      from: process.env.SENDER_EMAIL,
      subject: "Login Code",
      text: `Your login code is ${loginCode}. It will expire in 5 minutes.`,
      html: `<p>Your login code is <strong>${loginCode}</strong>. It will expire in 5 minutes.</p>`,
    };

    // await sgMail.send(msg);
    res
      .status(200)
      .json({
        message: "Login code has been sent successfully",
        userId: user.id,
      });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const activationCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (new Date() > user.loginexpire) {
      return res.status(400).json({ error: "Code is expired" });
    }

    if (code !== user.loginCode) {
      return res.status(400).json({ error: "Invalid code" });
    }

    
    const JWTPayload = {
      userId: user.id  ,
      username: user.name ,
      email: user.email ,
      verfied: true,
    };

    const JWTsecretKey = process.env.JWT_SECRET;
    const token = jwt.sign(JWTPayload, JWTsecretKey);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ message: "Login successful", token: token });

  } catch (error) {
    console.log(error);
    next(error);
  }
};
