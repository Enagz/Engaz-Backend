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

export const overview = async (req, res, next) => {
  try {
    const { title, employeeId } = req.user;

    if (title === "admin" || title === "superAdmin") {
      let ordersCounter = 0;
      let lastOrdersCounter = 0;
      let completedOrdersCounter = 0;
      let lastCompletedOrdersCounter = 0;
      let inProgressOrdersCounter = 0;
      let lastInProgressOrdersCounter = 0;
      let revenue = 0;
      let lastrevenue = 0;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const orders = await prisma.orders.findMany({
        select: { number: true, paid: true, createdAt: true, status: true },
      });

      const lastOrders = orders.filter(
        (order) => order.createdAt < oneMonthAgo
      );

      ordersCounter = orders.length;
      lastOrdersCounter = lastOrders.length;

      completedOrdersCounter = orders.filter(
        (order) => order.status == "Finished"
      ).length;

      lastCompletedOrdersCounter = lastOrders.filter(
        (order) => order.status == "Finished"
      ).length;

      inProgressOrdersCounter = orders.filter(
        (order) => order.status !== "Finished" && order.status !== "Cancelled"
      ).length;
      lastInProgressOrdersCounter = lastOrders.filter(
        (order) => order.status !== "Finished" && order.status !== "Cancelled"
      ).length;

      revenue = orders.reduce((acc, order) => acc + order.paid, 0);
      lastrevenue = lastOrders.reduce((acc, order) => acc + order.paid, 0);

      const result = {
        allOrders: {
          counter: ordersCounter,
          percentage:
            ((ordersCounter - lastOrdersCounter) / lastOrdersCounter) * 100,
        },
        completedOrders: {
          counter: completedOrdersCounter,
          percentage:
            ((completedOrdersCounter - lastCompletedOrdersCounter) /
              lastCompletedOrdersCounter) *
            100,
        },
        inProgress: {
          counter: inProgressOrdersCounter,
          percentage:
            ((inProgressOrdersCounter - lastInProgressOrdersCounter) /
              lastInProgressOrdersCounter) *
            100,
        },
        revenue: {
          current: revenue,
          percentage: ((revenue - lastrevenue) / lastrevenue) * 100,
        },
      };

      res.status(200).json(result);
    } else if (title === "employee") {
      let recivedOrdersCounter = 0;
      let completedOrdersCounter = 0;
      let inProgressOrdersCounter = 0;
      let avgTime = 0;
      let oldAvgTime = 0;
      let completedOrders;
      let oldCompletedOrdersCounter;
      let oldrecivedOrdersCounter;
      let oldinProgressOrdersCounter;
      let inProgressOrders;
      let oldCompletedOrders;
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);

      const orders = await prisma.orders.findMany({
        where: { employeeId: employeeId, status: { not: "Cancelled" } },
      });
      recivedOrdersCounter = orders.length;
      completedOrders = orders.filter((order) => order.status === "Finished");
      completedOrdersCounter = completedOrders.length;
      inProgressOrders = orders.filter((order) => order.status !== "Finished");
      inProgressOrdersCounter = inProgressOrders.length;

      oldCompletedOrders = completedOrders.filter(
        (order) => order.finishDate > oneMonthAgo && order.finishDate < now
      );
      oldCompletedOrdersCounter = oldCompletedOrders.length;
      oldrecivedOrdersCounter = orders.filter(
        (order) => order.createdAt > oneMonthAgo && order.createdAt < now
      ).length;
      oldinProgressOrdersCounter = inProgressOrders.filter(
        (order) => order.createdAt > oneMonthAgo && order.createdAt < now
      ).length;

      if (completedOrders) {
        completedOrders.forEach(
          (order) => (avgTime += order.finishDate - order.createdAt)
        );
        avgTime = avgTime / completedOrdersCounter;
      }

      if (oldCompletedOrders) {
        oldCompletedOrders.forEach(
          (order) => (oldAvgTime += order.finishDate - order.createdAt)
        );
        oldAvgTime = oldAvgTime / oldCompletedOrdersCounter;
      }

      const result = {
        totalorders: {
          count: recivedOrdersCounter,
          percentage:
            ((recivedOrdersCounter - oldrecivedOrdersCounter) /
              oldrecivedOrdersCounter) *
              100 -
            100,
        },
        completedorders: {
          count: completedOrdersCounter,
          percentage:
            ((completedOrdersCounter - oldCompletedOrdersCounter) /
              oldCompletedOrdersCounter) *
              100 -
            100,
        },
        inprogress: {
          count: inProgressOrdersCounter,
          percentage:
            ((inProgressOrdersCounter - oldinProgressOrdersCounter) /
              oldinProgressOrdersCounter) *
              100 -
            100,
        },
        avgtime: {
          time: avgTime / (1000 * 60 * 60),
          percentage: ((avgTime - oldAvgTime) / oldAvgTime) * 100,
        },
      };

      res.status(200).json(result);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const lastOrders = async (req, res, next) => {
  try {
    let { view } = req.query;
    if (!view) {
      view = "overview";
    }
    const { title, employeeId } = req.user;

    if (title == "admin" || title == "superAdmin") {
      if (view !== "overview" && view !== "all") {
        return res
          .status(400)
          .json({
            message:
              "Invalid view parameter. It should be either 'overview' or 'all'.",
          });
      }

      let orders;
      if (view == "overview") {
        orders = await prisma.orders.findMany({
          where: { isDeleted: false },
          select: {
            number: true,
            user: true,
            type: true,
            status: true,
            createdAt: true,
            Employee: true,
          },
          take: 4,
          orderBy: { createdAt: "desc" },
        });
      } else {
        orders = await prisma.orders.findMany({
          where: { isDeleted: false },
          select: {
            number: true,
            user: true,
            type: true,
            status: true,
            createdAt: true,
            Employee: true,
          },
          orderBy: { createdAt: "desc" },
        });
      }

      const timeAgo = (date) => {
        const now = new Date();
        const diff = Math.floor((now - new Date(date)) / 1000);

        if (diff < 60) return `${diff} seconds ago`;
        const minutes = Math.floor(diff / 60);
        if (minutes < 60) return `${minutes} minutes ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        return `${days} days ago`;
      };

      const result = orders.map((order) => {
        return {
          number: order.number,
          client: order.user.name,
          service: order.type,
          status: order.status,
          date: timeAgo(order.createdAt),
          employee: order.Employee ? order.Employee.name : null,
        };
      });
      res.status(200).json(result);
    } else if (title == "employee") {
      let orders;
      if (view == "overview") {
        orders = await prisma.orders.findMany({
          where: { employeeId: employeeId },
          include: { user: true },
          take: 4,
          orderBy: { createdAt: "desc" },
        });
      } else {
        orders = await prisma.orders.findMany({
          where: { employeeId: employeeId },
          include: { user: true },
          orderBy: { createdAt: "desc" },
        });
      }

      const MappedOrders = orders.map((order) => {
        return {
          number: order.number,
          client: order.user.name,
          service: order.type,
          litternumber: order.numberofletters,
          status: order.status,
          date: order.createdAt / (1000 * 60 * 60),
          cost: order.cost,
        };
      });

      res.status(200).json(MappedOrders);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.user;
    if (title !== "admin" && title !== "superAdmin") {
      return res.status(403).json({ message: "you are not authorized" });
    }

    const intID = parseInt(id);

    const order = await prisma.orders.findUnique({
      where: { number: intID },
      select: { number: true },
    });
    if (!order) {
      return res
        .status(404)
        .json({ message: "Order can not be found maybe wrong id" });
    }
    await prisma.orders.update({
      where: { number: intID },
      data: { isDeleted: true },
    });

    res.status(201).json({ message: "Order is deleted Sucssefully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const getRevenue = async (req, res, next) => {
  try {
    const { title } = req.user;
    if (title !== "admin" && title !== "superAdmin") {
      return res.status(403).json({ message: "you are not authorized" });
    }
    const orders = await prisma.orders.findMany({ select: { paid: true } });
    const revenue = orders.reduce(
      (acc, value) => acc + (Number(value.paid) || 0),
      0
    );
    const margin = await prisma.margin.findMany({
      orderBy: { createdAt: "desc" },
    });
    const revenueOfMonth = margin[0].revenue;
    const balance = await prisma.balance.findFirst();
    const withdrawnBalance = balance.withdrawn;
    const balanceHistory = margin.map((value) => {
      return {
        month: value.month,
        revenue: value.revenue,
      };
    });

    const result = {
      currentbalance: revenue,
      marginofmonth: revenueOfMonth,
      totalwithdraw: withdrawnBalance,
      history: balanceHistory,
    };

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const topClinets = async (req, res, next) => {
  try {
    const { title } = req.user;
    if (title !== "admin" && title !== "superAdmin") {
      return res.status(403).json({ message: "you are not authorized" });
    }
    const clients = await prisma.user.findMany({
      select: { totalRevenue: true, orders: true, name: true },
      orderBy: { totalRevenue: "desc" },
      take: 4,
    });
    const topClinets = clients.map((client) => {
      return {
        name: client.name,
        orders: client.orders.length,
      };
    });

    res.status(200).json(topClinets);
  } catch (error) {
    console.log(error);
    next(error);
  }
};
