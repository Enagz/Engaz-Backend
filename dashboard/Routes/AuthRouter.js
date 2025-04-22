import express from "express";
const router = express.Router();
import {authenticateUser} from "../Middleware/Authentication.js";
import {login , register , DeleteEmployee ,getAllEmployees} from "../Controller/AuthController.js";

router.post("/register" , authenticateUser , register) ;
router.post("/login" , login) ;
router.delete("/delete/:id" , authenticateUser , DeleteEmployee) ;
router.get("/employees" , authenticateUser , getAllEmployees) ;





export default router ;