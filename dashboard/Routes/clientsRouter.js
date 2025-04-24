import express from "express";
const router = express.Router();
import {authenticateUser} from "../Middleware/Authentication.js";
import {clientTable , clientsOverview , deleteClient , editClient , bestClients , downloadClientDetails , clientInfo , clientStatistics , clientOrders , addClient} from "../Controller/clientsController.js";

router.get("/clients", authenticateUser,clientTable) ;
router.post("/clients", authenticateUser,addClient) ;
router.get("/clients/overview", authenticateUser,clientsOverview) ;
router.get("/clients/:id", authenticateUser,clientInfo) ;
router.delete("/clients/:id", authenticateUser , deleteClient ) ;
router.put("/clients/:id", authenticateUser , editClient ) ;
router.get("/clients/best", authenticateUser , bestClients ) ;
router.get("/clients/download/:id" , authenticateUser , downloadClientDetails ) ;
router.get("/clients/:id/statistcs" , authenticateUser , clientStatistics ) ;
router.get("/clients/:id/orders" , authenticateUser , clientOrders ) ;

export default router ;