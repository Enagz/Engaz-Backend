import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";


export const login = async (req , res , next) => {
    try {
        const {email , password} = req.body ;
        if(!email || !password) {
            return res.status(401).json({error : "Please fill all fields"})
        }

        const formatedemail = email.toLowerCase();
        const user = await prisma.employee.findUnique({
            where : {email : formatedemail}
        })
        if(!user) {
            return res.status(401).json({error : "Invalid email or password"})
        }
        const isMatch = await bcrypt.compare(password , user.password)
        if(!isMatch) {
            return res.status(401).json({error : "Invalid email or password"})
        }
        const JWTPayload = {
            userId : user.id ,
            username : user.name ,
            email : user.email ,
            title : user.title ,
        }
        const JWTsecretKey = process.env.JWT_SECRET_DASHBOARD;
        const token = jwt.sign(JWTPayload , JWTsecretKey);
        res.cookie("token" , token , {
            httpOnly : true ,
            secure : process.env.NODE_ENV === "production",
        });
        res.status(200).json({message : "Login successful" , token : token});

    }
    catch(error) {

    }
}

export const register = async (req , res , next) => {
    try {
        const {email , password , title , phone , name} = req.body ;
        const {title : userTitle} = req.user ;

        if(!email || !password || !title || !phone || !name) {
            return res.status(401).json({error : "Please fill all fields"})
        }
        if(title !== "admin" && title !== "superadmin" && title !== "employee") {
            return res.status(401).json({error : "Invalid title"  , allowedTitles : ["admin" , "superadmin" , "employee"]});
        }
        if(userTitle !== "admin" && userTitle !== "superadmin") {
            return res.status(401).json({error : "Unauthorized"})
        }
        if(title === "admin" && userTitle === "admin") {
            return res.status(401).json({error : "admin can create employee only"})
        }
        if(title === "superadmin" && userTitle === "admin") {
            return res.status(401).json({error : "Cannot create superadmin"})
        }

        if(userTitle === "admin" && title === "superadmin") {
            return res.status(401).json({error : "Cannot create superadmin"})
        }   

        const fromatedemail = email.toLowerCase() ;
        const user = await prisma.employee.findFirst({
            where: {
            OR: [
                { email: fromatedemail },
                { phone: phone }
            ]
            }
        });
        if(user) {
            return res.status(401).json({error : "User already exists"})
        }
        const hashedPassword = await bcrypt.hash(password , 12) ;
        const newUser = await prisma.employee.create({
            data : {
                email : fromatedemail ,
                password : hashedPassword ,
                title : title ,
                phone : phone ,
                name : name ,
            }
        });
        res.status(201).json({message : "User created successfully" , userId : newUser.id});
    }

    catch(error) {
        console.log(error)
        next(error)
    }
}

export const DeleteEmployee = async (req , res , next) => {
    try {
        const {id} = req.params ;
        const {title} = req.user ;

        if(title !== "admin" && title !== "superadmin") {
            return res.status(401).json({error : "Unauthorized" , message : "employees not allowed to delete any user" })
        }
        const user = await prisma.employee.findUnique({
            where : {id : id}
        })
        if(!user) {
            return res.status(401).json({error : "User not found"})
        }
        if(user.title === "superadmin") {
            return res.status(401).json({error : `${title} Cannot delete superadmin`})
        }
        if((user.title === "admin" && title === "admin")) {
            return res.status(401).json({error : "admin cannot delete another admin"})
        }
        await prisma.employee.update({
            where : {id : id} , data:{
                isDeleted : true ,
                email : `${user.email.split("@")[0]}-${Date.now()}@deleted`,
                phone : `${user.phone.split("@")[0]}-${Date.now()}@deleted`,
                name : `${user.name.split("@")[0]}-${Date.now()}@deleted`,
                password : `${user.password.split("@")[0]}-${Date.now()}@deleted`,
            }
        })
        res.status(200).json({message : "User deleted successfully"})
    }
    catch(error) {
        console.log(error)
        next(error)
    }
}

export const getAllEmployees = async (req , res , next) => {
    try {
        const {title} = req.user ;
        if(title !== "admin" && title !== "superadmin") {
            return res.status(401).json({error : "Unauthorized"})
        }
        const employees = await prisma.employee.findMany({where : {isDeleted:false} ,select: {
            id : true ,
            email : true ,
            title : true ,
            phone : true ,
            name : true ,
        }}) ;
        if(!employees || employees.length === 0) {
            return res.status(401).json({error : "No employees found"})
        }
        
        res.status(200).json({employees : employees})
    }
    catch(error) {
        console.log(error)
        next(error)
    }
}