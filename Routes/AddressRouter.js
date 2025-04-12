import express from "express";
const router = express.Router();
import {authenticateUser} from "../middleware/Authentication.js"
import {addAddress , getAddress , editAddress , deleteAddress} from "../Controller/addressController.js"

router.post("/address" , authenticateUser , addAddress) ;
router.put("/address/:addressId" , authenticateUser , editAddress) ;
router.get("/address/:userId" , authenticateUser , getAddress) ;
router.delete("/address/:addressId" , authenticateUser , deleteAddress) ;



export default router ;