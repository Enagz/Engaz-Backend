import express from "express";
const router = express.Router();
import pkg from 'express-openid-connect';
const { auth , requiresAuth } = pkg;
import dotenv from 'dotenv';
dotenv.config();
import multer from "multer"
import path from 'path';
import { fileURLToPath } from 'url';

import {getUserName , changephone , emailchangerequest , emailchangecode , changeemail , userDelete} from "../Controller/UserController.js"
import {authenticateUser} from "../middleware/Authentication.js"

router.get('/user/:user_Id', authenticateUser , getUserName );
router.put('/user/:user_Id/changephone', authenticateUser , changephone );
router.post('/user/:user_Id/chgnageemail/request' , authenticateUser ,emailchangerequest );
router.post('/user/:user_Id/chgnageemail/code' , authenticateUser ,emailchangecode );
router.post('/user/:user_Id/chgnageemail' , authenticateUser ,changeemail );
router.delete("/user/:user_Id/delete" , authenticateUser ,userDelete ) ;


export default router; 