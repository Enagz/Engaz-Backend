import express from "express";
const router = express.Router();
import {authenticateUser} from "../Middleware/Authentication.js";
import {clientTable} from "../Controller/clientsController.js";

router.get("/clients", authenticateUser,clientTable) ;

export default router ;