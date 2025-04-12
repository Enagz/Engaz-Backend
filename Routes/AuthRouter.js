import express from "express";
const router = express.Router();
import pkg from 'express-openid-connect';
const { auth , requiresAuth } = pkg;
import dotenv from 'dotenv';
dotenv.config();

import {GoogleLoign , saveProfile , verifyUser , signup , login , activationCode} from "../Controller/AuthController.js"


router.get('/login-google' , GoogleLoign) ;
router.get('/save-profile' , saveProfile ) ;
router.post('/user/:userId/verify' , verifyUser ) ;
router.post('/signup' , signup ) ;
router.post('/login-account' , login) ;
router.post('/login-account/:userId/code' , activationCode) ; 



export default router;