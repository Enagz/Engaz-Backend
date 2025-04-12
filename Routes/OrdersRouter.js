import express from "express";
const router = express.Router();
import pkg from 'express-openid-connect';
const { auth , requiresAuth } = pkg;
import dotenv from 'dotenv';
dotenv.config();
import multer from "multer"
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const storage = multer.diskStorage({
    destination: path.join(__dirname, '../' , 'public' ,'files'), 
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  


const fileFilter = (req, file, cb) => {
    if (
        file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('application/') || 
        file.mimetype === 'text/plain'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});


const uploadFields = upload.fields([
    { name: 'idDocument', maxCount: 5 },    
    { name: 'passport', maxCount: 5 },       
    { name: 'profilePicture', maxCount: 5 }, 
    { name: 'otherDocs', maxCount: 10 }       
]);

import {newTranslationOrder , myorders , orderDetails , cancellOrder , rateOrder , newPrentingOrder} from "../Controller/OrdersController.js"
import {authenticateUser} from "../middleware/Authentication.js"

router.post('/order/printing', authenticateUser ,  uploadFields , newPrentingOrder );

router.post('/order/translation', authenticateUser ,  uploadFields , newTranslationOrder );
router.post('/order/:userId', authenticateUser ,   myorders );
router.get('/order/:orderId', authenticateUser , orderDetails  );
router.delete('/order/:orderId', authenticateUser , cancellOrder  );
router.post('/order/:orderId', authenticateUser , orderDetails  );
router.post('/order/:orderId/rate', authenticateUser , rateOrder  );




export default router;