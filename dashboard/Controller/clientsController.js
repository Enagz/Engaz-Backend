import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { z } from "zod";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";
import e from "express";
import tocsv from "json2csv";
import ExcelJS from "exceljs";

export const clientTable = async (req, res, next) => {
  try {
    const { title } = req.user;
    const { page } = req.query;

    if (title !== "admin" && title !== "superAdmin") {
      return res.status(403).json({ message: "you are not authorized" });
    }
    const pageNumber = parseInt(page) || 1;
    const pageSize = 4;
    const skip = (pageNumber - 1) * pageSize;
    let clients = await prisma.user.findMany({
      where: { isDeleted: false },
      skip: skip,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        countrycode: true,
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
      if (
        client.lastOrder &&
        new Date(client.lastOrder) >=
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      ) {
        isActive = true;
      }
      client.createdAt = new Date(client.createdAt).toISOString().split("T")[0];
      if(client.lastOrder) {
      client.lastOrder = new Date(client.lastOrder).toISOString().split("T")[0];
      }
      return {
        ...client,
        isActive: isActive,
      };
    });

    res.status(200).json({
      clients: mappedclients,
      page: pageNumber,
      totalPages: Math.ceil((await prisma.user.count()) / pageSize),
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const clientsOverview = async (req, res, next) => {
  try {
    const { title } = req.user;
    if (title !== "admin" && title !== "superAdmin") {
      return res.status(403).json({ message: "you are not authorized" });
    }

    let clientsCounter = 0;
    let activeClintsCounter = 0;
    let newClintsCounter = 0;
    let avgRate = 0;
    let avgInteractionRate = 0;
    let ratedOreders = 0;

    const clients = await prisma.user.findMany({
      select: {
        lastOrder: true,
        createdAt: true,
        rateAvg: true,
        isDeleted: false,
      },
    });
    if (!clients || clients.length === 0) {
      return res.status(200).json({
        message: "No clients available",
        clientsCounter,
        activeClintsCounter,
        newClintsCounter,
        avgRate,
        avgInteractionRate,
      });
    }
    const orders = await prisma.orders.findMany({ select: { rate: true } });

    clientsCounter = clients.length;
    activeClintsCounter = clients.filter((client) => {
      return (
        client.lastOrder &&
        new Date(client.lastOrder) >=
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      );
    }).length;
    newClintsCounter = clients.filter((client) => {
      return (
        client.createdAt &&
        new Date(client.createdAt) >=
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
    }).length;
   

    ratedOreders = orders.filter((order) => order.rate !== null).length;
    avgInteractionRate = orders.length > 0 ? (ratedOreders / orders.length) * 100 : 0;

    avgRate =
    orders.length > 0
      ? orders.reduce((acc, order) => acc + order.rate, 0) / ratedOreders
      : 0;

    res.status(200).json({
      clientsCounter,
      activeClintsCounter,
      newClintsCounter,
      avgRate,
      InteractionPercentage:avgInteractionRate,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const { title } = req.user;
    const { id } = req.params;
    if (title !== "admin" && title !== "superAdmin") {
      return res.status(403).json({ message: "you are not authorized" });
    }
    const client = await prisma.user.findUnique({ where: { id } });
    if (!client) {
      return res.status(404).json({ message: "client not found or wrong id" });
    }

    const deletedClient = await prisma.user.update({
      where: { id },
      data: { isDeleted: true },
    });
    res.status(200).json({ message: "client deleted successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const editClient = async (req, res, next) => {
  try {
    const { title } = req.user;
    const { id } = req.params;
    const { name, email, phone, countrycode, joindate } = req.body;

    if (!name || !email || !phone || !countrycode || !joindate) {
      return res.status(400).json({ message: "please provide all fields" });
    }

    if (title !== "admin" && title !== "superAdmin") {
      return res.status(403).json({ message: "you are not authorized" });
    }
    const client = await prisma.user.findUnique({ where: { id } });
    if (!client) {
      return res.status(404).json({ message: "client not found or wrong id" });
    }

    const parsedDate = new Date(joindate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const editClient = await prisma.user.update({
      where: { id },
      data: {
        name: name,
        email: email,
        phone: phone,
        countrycode: countrycode,
        createdAt: parsedDate,
      },
    });

    if(req.body.type) {
      await prisma.user.update({
        where: { id },
        data: {
          type: req.body.type,
        },
      });
    }
    
    res.status(200).json({ message: "client updated successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const bestClients = async (req, res, next) => {
  try {
    const { title } = req.user;

    if (title !== "admin" && title !== "superAdmin") {
      return res.status(403).json({ message: "you are not authorized" });
    }

    const clients = await prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        name: true,
        phone: true,
        ordersCounter: true,
        createdAt: true,
        totalRevenue: true,
        rateAvg: true,
        email: true,
      },
      orderBy: {
        totalRevenue: "desc",
      },
      take: 3,
    });

    if (!clients || clients.length === 0) {
      return res.status(200).json({
        message: "No clients available",
        bestClients: [],
      });
    }
    const bestClients = clients.map((client) => {
      return {
        rank: clients.indexOf(client) + 1,
        name: client.name,
        phone: client.phone,
        email: client.email,
        ordersCounter: client.ordersCounter,
        createdAt: new Date(client.createdAt).toISOString().split("T")[0],
        totalRevenue: client.totalRevenue,
        rateAvg: client.rateAvg,
      };
    });
    res.status(200).json({
      bestClients: bestClients,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const downloadClientDetails = async (req, res, next) => {
  try {
    const {title} = req.user ;
    const { id } = req.params;

    if(title !== "admin" && title !== "superAdmin"){
        return res.status(403).json({message: "you are not authorized"});
    };

    const client = await prisma.user.findUnique({
      where: { id },
      include: { orders: true },
    });
    if (!client) {
      return res.status(404).json({ message: "client not found or wrong id" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Client Report");

    const clientDetails = {
      name: client.name,
      email: client.email,
      phone: client.phone,
      countrycode: client.countrycode,
      createdAt: new Date(client.createdAt).toISOString().split("T")[0],
      ordersCounter: client.ordersCounter,
      totalRevenue: client.totalRevenue,
      rateAvg: client.rateAvg,
      orders: client.orders.map((order) => {
        return {
          id: order.number,
          type: order.type,
          delivery: order.delivery,
          paymentstatus: order.paymentstatus,
          status: order.status,
          address: order.address ? order.address : "Office",
          notes: order.notes ? order.notes : "No notes",
          rate: order.rate ? order.rate : "No rate",
          cost: order.cost ? order.cost : "No decivded yet",
        };
      }),
    };

    // ========== CUSTOMER INFO ==========
    sheet.addRow(["Customer Details"]);
    const titleRow = sheet.getRow(1);
    titleRow.font = { bold: true, size: 14 };
    titleRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add some spacing
    sheet.addRow([]);

    const customerData = [
      ["Name", client.name],
      ["Phone", `${client.countrycode}${client.phone}`],
      ["Email", client.email],
      ["Created At", new Date(client.createdAt).toISOString().split("T")[0]],
      ["Orders Count", client.ordersCounter],
      ["Total Revenue", client.totalRevenue],
      ["Average Rate", client.rateAvg],
    ];

    // Styling customer data rows
    customerData.forEach((row, index) => {
      const newRow = sheet.addRow(row);
      newRow.eachCell((cell, colNumber) => {
        cell.font = { name: "Calibri", size: 12 };
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 1 ? "left" : "right",
        };
        if (colNumber === 1) {
          cell.font = { bold: true };
        }
      });
    });

    // Blank row before orders
    sheet.addRow([]);
    sheet.addRow(["Orders"]);
    const ordersTitleRow = sheet.getRow(sheet.lastRow.number);
    ordersTitleRow.font = { bold: true, size: 14 };
    ordersTitleRow.alignment = { vertical: "middle", horizontal: "center" };

    // ========== HEADER ROW FOR ORDERS ==========
    const headerRow = sheet.addRow([
      "Order Number",
      "Type",
      "Delivery Type",
      "Payment Status",
      "Status",
      "Address",
      "Notes",
      "Rate",
      "Cost",
    ]);

    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E78" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    // ========== ORDERS ==========
    client.orders.forEach((order, index) => {
      const orderRow = sheet.addRow([
        order.number,
        order.type,
        order.delivery,
        order.paymentStatus,
        order.status,
        order.address || "Office",
        order.notes || "No notes",
        order.rate || "No rate",
        order.cost || "Not decided yet",
      ]);

      // Zebra striping (optional)
      if (index % 2 === 0) {
        orderRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF3F3F3" },
          };
        });
      }

      orderRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.font = { name: "Calibri", size: 11 };
      });
    });

    // Auto-adjust column widths
    sheet.columns.forEach((col) => {
      let maxLength = 0;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const len = (cell.value || "").toString().length;
        if (len > maxLength) maxLength = len;
      });
      col.width = maxLength + 4;
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=client_${client.name}_${client.email}_details.xlsx`
    );
    res.send(buffer);
  } catch (error) {
    console.log(error);
    next(error);
  }
};


export const clientInfo = async (req, res, next) => {
  try {
    const {id} = req.params ;
    const {title} = req.user ;
    if(title !== "admin" && title !== "superAdmin"){
        return res.status(403).json({message: "you are not authorized"});
    };
    const client = await prisma.user.findUnique({
      where: { id },
      select: {name:true , email:true , countrycode:true , phone:true , createdAt:true , type:true}
    });
    if(!client){
        return res.status(404).json({message: "client not found or wrong id"});
    };
    const Mappedclient = {
        name: client.name,
        email: client.email,
        phone: client.phone,
        countrycode: client.countrycode,
        createdAt: new Date(client.createdAt).toISOString().split("T")[0],
        type: client.type,
    };
    res.status(200).json({client:Mappedclient});

  }
  catch (error) {
    console.log(error);
    next(error);
  }
  
}

export const clientStatistics = async (req, res, next) => {

  try{
    const {id} = req.params ;
    const {title} = req.user ;
    if(title !== "admin" && title !== "superAdmin"){
        return res.status(403).json({message: "you are not authorized"});
    };
    const client = await prisma.user.findUnique({
      where: { id },
      select: {orders:true}
    });
    if(!client){
        
        return res.status(404).json({message: "client not found or wrong id"});
    };
    let translationCounter = 0 ;
    let printingCounter = 0 ;
    let canceledCounter = 0 ;
    let completedCounter = 0 ;
    let inProgressCounter = 0 ;
    let ordersCounter = 0 ;

    ordersCounter = client.orders.length ;
    translationCounter = client.orders.filter((order) => order.type === "translation").length ;
    printingCounter = client.orders.filter((order) => order.type === "printing").length ;
    canceledCounter = client.orders.filter((order) => order.status === "Cancelled").length ;
    completedCounter = client.orders.filter((order) => order.status === "Finished").length ;
    inProgressCounter = ordersCounter - (canceledCounter  + completedCounter) ;

    const result = {
      translationOrders : translationCounter ,
      printingOrders: printingCounter ,
      completedOrders: completedCounter ,
      canceledOrders : canceledCounter ,
      inProggressOrders: inProgressCounter
    }
    res.status(200).json({statistics : result}) ;

  }
  catch(error){
    console.log(error);
    next(error);
  }

}


export const clientOrders = async (req , res , next) => {
  try {
    const {id} = req.params ;
    const {title} = req.user ;
    const {page} = req.query ;
    const pageNumber = parseInt(page) || 1;

    if(title !== "admin" && title !== "superAdmin"){
      return res.status(403).json({message: "you are not authorized"});
  };

    const client = await prisma.user.findUnique({
      where: { id },
      include:{orders:{include:{Employee:true}, skip: (pageNumber - 1) * 5 , take: 5}} ,
    });
    if(!client){
        return res.status(404).json({message: "client not found or wrong id"});
    };

    if(pageNumber > Math.ceil(client.orders.length / 5)){
      return res.status(400).json({message: "page number is out of range"});
    }

    if(client.orders.length === 0){
      return res.status(200).json({message: "No orders for this client"});
    };

   

    const orders = client.orders.map((order) => {
      return {
        id: order.number,
        createdAt: new Date(order.createdAt).toISOString().split("T")[0],
        type: order.type,
        status: order.status,
        cost: order.cost ? order.cost : "Not decided yet",
        employee: order.Employee ? order.Employee.name : "No employee yet",
        time : order.finishDate ? ( (order.finishDate - new Date(order.createdAt)) /(1000 *60 *60) ) : "Not finished yet",
        additionalNote: order.employeeNotes
      };
    });
    res.status(200).json({orders , page: pageNumber , totalPages: Math.ceil(client.orders.length / 5)}) ;


  }
  catch(error) {
    console.log(error) ;
    next(error) ;
  }
}

export const addClient = async (req, res, next) => {
  try {
    const {title} = req.user ;
    const {name , email , phone , countrycode , date , type} = req.body
    if(title !== "admin" && title !== "superAdmin"){
      return res.status(403).json({message: "you are not authorized"});
    }
    if(!name || !email || !phone || !countrycode || !date || !type){
      return res.status(400).json({message: "please provide all fields"});
    };
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    const client = await prisma.user.findFirst({where: {OR: [{email: email}, {phone: phone}]}});
    if(client){
      return res.status(400).json({message: "client already exists"});
    };
    const newClient = await prisma.user.create({
      data: {
        name: name,
        email: email,
        phone: phone,
        countrycode: countrycode,
        createdAt: parsedDate,
        type: type
      }
    });
    res.status(201).json({message: "client created successfully" }) ;

  }
  catch(error) {
    console.log(error) ;
    next(error) ;
  }
}