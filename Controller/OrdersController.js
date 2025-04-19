import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { z } from "zod";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";
import {
  orderMapper,
  orderDetailsMapper,
} from "../util/mappers/orderMapper.js";

export const newTranslationOrder = async (req, res, next) => {
  try {
    let {
      fileLanguge,
      translationLanguges,
      methodOfDelivery,
      notes,
      Address,
    } = req.body;
    const files = req.files;
    let filename;
    const { userId } = req.user;
    console.log(req.body);
    console.log("hh" , files);

    if (!fileLanguge || !translationLanguges || !methodOfDelivery || !files) {
      return res.status(400).json({
        message: "All inputs are required",
      });
    }
    translationLanguges = JSON.parse(translationLanguges);

    if (methodOfDelivery !== "Home" && methodOfDelivery !== "Office") {
      return res.status(400).json({
        message: "Method of delivery must be 'Home' or 'Office'",
      });
    }

    if (methodOfDelivery == "Home" && !Address) {
      return res.status(400).json({
        message: "AddressId is required when methodOfDelivery is 'Home'",
      });
    }

    filename = files.otherDocs.map((file) => {
      return file.filename;
    });

    const languges = await prisma.languge.findMany({ select: { name: true } });
    const languageNames = languges.map((lang) => lang.name);

    if (!languageNames.includes(fileLanguge)) {
      console.log(languageNames);
      return res.status(400).json({
        message: "The file language is not supported",
        supportedlanguge: languageNames,
      });
    }

    if (!translationLanguges.every((lang) => languageNames.includes(lang))) {
      return res.status(400).json({
        message: "The translation language is not supported",
        supportedlanguge: languageNames,
      });
    }

    const newOrder = await prisma.orders.create({
      data: {
        userid: userId,
        type: "translation",
        delivery: methodOfDelivery,
        paymentStatus: "no payment",
        status: "Under Review",
        files: filename,
        address: Address || null,
        notes: notes,
        translationfrom: fileLanguge,
        translationto: translationLanguges,
      },
    });

    res.status(201).json({
      message: "Order uploaded successfully!",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const myorders = async (req, res, next) => {
  try {
    let { userId } = req.params;
    let { type, status } = req.query;

    let allowedtype = ["translation", "printing"];

    let allowedstatus = ["new", "current", "finished", "cancelled"];
    // status = [ Under Review , Offer Sent ,  In Progress , In delivery , Finished ,Cancelled  ]

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (!type || !status) {
      return res.status(400).json({
        message: "Type and status are required",
      });
    }
    if (!allowedtype.includes(type)) {
      return res.status(400).json({
        message: "Type is not supported",
        supportedTypes: allowedtype,
      });
    }
    if (!allowedstatus.includes(status)) {
      return res.status(400).json({
        message: "Status is not supported",
        supportedstatus: allowedstatus,
      });
    }

    let fillter;

    if (status == "new") {
      fillter = {
        userid: userId,
        type: type,
        status: {
          in: ["Under Review", "Offer Sent"],
        },
      };
    } else if (status == "current") {
      fillter = {
        userid: userId,
        type: type,
        status: {
          in: ["In Progress", "In delivery"],
        },
      };
    } else if (status == "finished") {
      fillter = {
        userid: userId,
        type: type,
        status: {
          in: ["Finished"],
        },
      };
    } else if (status == "cancelled") {
      fillter = {
        userid: userId,
        type: type,
        status: {
          in: ["Cancelled"],
        },
      };
    }

    const orders = await prisma.orders.findMany({
      where: fillter,
      select: {
        status: true,
        number: true,
        createdAt: true,
        delivery: true,
        translationfrom: true,
        files: true,
        type: true,
        PrintingDetails: true,
      },
    });
    if (!orders) {
      return res.status(404).json({
        message: "No orders found",
      });
    }

    res.status(200).json(orderMapper(orders));
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const orderDetails = async (req, res, next) => {
  try {
    let { orderId } = req.params;
    orderId = parseInt(orderId);
    const { userId } = req.user;
    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    const order = await prisma.orders.findUnique({
      where: { number: orderId, userid: userId },
      include: { PrintingDetails: true },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const orderDetails = await orderDetailsMapper(order);

    res.status(200).json(orderDetails);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const cancellOrder = async (req, res, next) => {
  try {
    let { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }
    orderId = parseInt(orderId);
    const { userId } = req.user;
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({
        message: "Reason is required",
      });
    }
    const order = await prisma.orders.findUnique({
      where: { number: orderId, userid: userId },
    });
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    await prisma.orders.update({
      where: { number: orderId, userid: userId },
      data: { status: "Cancelled", cancelationreason: reason },
    });
    res.status(200).json({
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const rateOrder = async (req, res, next) => {
  try {
    let { orderId } = req.params;
    const { userId } = req.user;
    let { stars, comment } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }
    orderId = parseInt(orderId);

    if (!stars) {
      return res.status(400).json({
        message: "Stars are required",
      });
    }

    stars = parseInt(stars);

    if (stars < 1 || stars > 5) {
      return res.status(400).json({
        message: "Stars must be between 1 and 5",
      });
    }

    await prisma.orders.update({
      where: { number: orderId, userid: userId },
      data: { rate: stars, comment: comment },
    });
    res.status(200).json({
      message: "Order is rated successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const newPrentingOrder = async (req, res, next) => {
  try {
    const body = req.body;
    const bodyDetails = JSON.parse(body.details);
    const { methodOfDelivery, Address, notes } = body;
    const files = req.files;
    let filename;
    const { userId } = req.user;
    let cost = 0;

    if (!body || !files || !methodOfDelivery) {
      return res.status(400).json({
        message: "All inputs are required",
      });
    }

    if (methodOfDelivery !== "Home" && methodOfDelivery !== "Office") {
      return res.status(400).json({
        message: "Method of delivery must be 'Home' or 'Office'",
      });
    }

    if (methodOfDelivery == "Home" && !Address) {
      return res.status(400).json({
        message: "AddressId is required when methodOfDelivery is 'Home'",
      });
    }

    filename = files.otherDocs.map((file) => {
      return file.filename;
    });

    const newOrder = await prisma.orders.create({
      data: {
        userid: userId,
        type: "printing",
        delivery: methodOfDelivery,
        paymentStatus: "no payment",
        status: "Offer Sent",
        address: Address || null,
        notes: notes || null,
      },
    });

    const colors = await prisma.printingCollors.findMany({
      select: { color: true, cost: true },
    });
    const colorNames = colors.map((color) => color.color);
    const covers = await prisma.printingCovers.findMany({
      select: { name: true, cost: true },
    });
    const coverNames = covers.map((cover) => cover.name);

    for (let i = 0; i < bodyDetails.length; i++) {
      if (
        !bodyDetails[i].color ||
        !bodyDetails[i].cover ||
        !bodyDetails[i].copies ||
        !bodyDetails[i].pages
      ) {
        return res.status(400).json({
          message: "All inputs are required",
        });
      }
      if (!colorNames.includes(bodyDetails[i].color)) {
        return res.status(400).json({
          message: "Color is not supported",
          supportedcolors: colorNames,
        });
      }
      if (!coverNames.includes(bodyDetails[i].cover)) {
        return res.status(400).json({
          message: "Cover is not supported",
          supportedcovers: coverNames,
        });
      }
      if (bodyDetails[i].copies < 1) {
        return res.status(400).json({
          message: "Copies must be greater than 0",
        });
      }
      if (bodyDetails[i].pages < 1) {
        return res.status(400).json({
          message: "Pages must be greater than 0",
        });
      }

      if (!filename[i]) {
        return res.status(400).json({
          message: "File is required",
        });
      }

      await prisma.printingDetails.create({
        data: {
          orderId: newOrder.number,
          file: filename[i],
          color: bodyDetails[i].color,
          cover: bodyDetails[i].cover,
          copies: bodyDetails[i].copies,
          pages: bodyDetails[i].pages,
        },
      });

      cost =
        cost +
        bodyDetails[i].copies *
          bodyDetails[i].pages *
          colors.find((color) => color.color == bodyDetails[i].color).cost +
        covers.find((cover) => cover.name == bodyDetails[i].cover).cost;
      await prisma.orders.update({
        where: { number: newOrder.number },
        data: { cost: cost },
      });
    }

    res.status(201).json({
      message: "Order uploaded successfully!",
      cost: cost,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
