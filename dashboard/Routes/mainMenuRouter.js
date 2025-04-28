import express from "express";
const router = express.Router();
import {authenticateUser} from "../Middleware/Authentication.js" ;
import {overview , lastOrders , deleteOrder , getRevenue , topClinets } from "../Controller/mainMenuController.js"

router.get('/home/overview' , authenticateUser ,overview ) ;
router.get('/home/lastorders' , authenticateUser , lastOrders ) ;
router.delete('/home/order/:id' , authenticateUser , deleteOrder ) ;
router.get('/home/revenue' ,authenticateUser , getRevenue) ;
router.get('/home/topclients' , authenticateUser , topClinets) ;







export default router ;

