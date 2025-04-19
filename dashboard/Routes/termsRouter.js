import express from "express";
const router = express.Router();
import {authenticateUser} from "../../middleware/Authentication.js" ;
import {getConditions , getPrivacy , getUsage , updateConditions , updatePrivacy , updateUsage} from "../Controller/termsController.js" ;

router.get("/terms/conditions" , authenticateUser , getConditions) ;
router.get("/terms/privacy" ,  authenticateUser ,getPrivacy) ;
router.get("/terms/usage" , authenticateUser, getUsage) ;

router.put("/terms/conditions" , authenticateUser , updateConditions) ;
router.put("/terms/privacy" ,  authenticateUser , updatePrivacy ) ;
router.put("/terms/usage" , authenticateUser , updateUsage) ;


export default router ;