import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const addAddress = async (req, res, next) => {
  try {
    const { name, address, location } = req.body;
    const { userId } = req.user;

    const Address = await prisma.address.findUnique({
      where: { name: name, userid: userId },
    });
    if (Address) {
      return res.status(400).json({ message: "Name is already taken" });
    }
    const newAddress = await prisma.address.create({
      data: { name: name, address: address, location: location || null , userid: userId },
    });

    return res
      .status(201)
      .json({ message: "Address added successfully", data: newAddress });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const getAddress = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if(!userId || userId.length === 0) {
      return res.status(400).json({ message: "UserId is required" });
    }

    const Address = await prisma.address.findMany({
      where: { userid: userId },
      select: { address: true, name: true, location: true, id: true },
    });
    if (!Address) {
      return res.status(404).json({ message: "No address found" });
    }
    res.status(200).json({ addresses: Address });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const editAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const { userId } = req.user;
    const { name, address, location } = req.body;

    const getAddress = await prisma.address.findUnique({
      where: { id: addressId, userid: userId },
    });
    if (!getAddress) {
      return res
        .status(404)
        .json({ message: "Address not found or does not belong to the user" });
    }

    const duplicatedName = await prisma.address.findFirst({
      where: { name: name, userid: userId, id: { not: addressId } },
    });
    if (duplicatedName) {
      return res.status(400).json({ message: "Name is already taken" });
    }
    const updateAddress = await prisma.address.update({
      where: { id: getAddress.id },
      data: {
        name: name,
        address: address,
        location: location || null,
      },
    });
    return res
        .status(201)
        .json({ message: "Address updated successfully"});
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const { userId } = req.user;

    const getAddress = await prisma.address.findUnique({
      where: { id: addressId, userid: userId },
    });
    if (!getAddress) {
      return res
        .status(404)
        .json({ message: "Address not found or does not belong to the user" });
    }

    await prisma.address.delete({
      where: { id: getAddress.id },
    });
    
    return res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
}
