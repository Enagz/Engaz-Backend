import express from "express";
const router = express.Router();
import {authenticateUser} from "../middleware/Authentication.js"
import {getConditions , getPrivacy , getUsage} from "../Controller/termsController.js"


router.get("/terms/conditions" , authenticateUser , getConditions) ;
router.get("/terms/privacy" ,  authenticateUser ,getPrivacy) ;
router.get("/terms/usage" , authenticateUser, getUsage) ;


export default router ;
