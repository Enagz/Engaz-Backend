import express from "express";
const router = express.Router();
import {authenticateUser} from "../middleware/Authentication.js"
import {getLanguage} from "../Controller/langugeController.js"

router.get("/language", authenticateUser, getLanguage);


export default router ;