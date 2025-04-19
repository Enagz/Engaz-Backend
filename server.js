import express from "express";
import pkg from "express-openid-connect";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
dotenv.config();
const prisma = new PrismaClient();
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import http from "http";
import { initializeSocket } from "./socket/socket.js";

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

initializeSocket(server);

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import AuthRouter from "./Routes/AuthRouter.js";
import ErrorHandler from "./middleware/ErrorHandler.js";
import OrdersRouter from "./Routes/OrdersRouter.js";
import AddressRouter from "./Routes/AddressRouter.js";
import LanguageRouter from "./Routes/langugeRouter.js";
import UserRouter from "./Routes/UserRouter.js";
import ConditionsRouter from "./dashboard/Routes/termsRouter.js";

// const config = {
//   authRequired: false,
//   auth0Logout: true,
//   secret: process.env.AUTH0_SECRET,
//   baseURL: 'https://wckb4f4m-3000.euw.devtunnels.ms',
//   clientID: '89zF9QTJkd5PsNU25Es4sWaXb7NwNd2Q',
//   issuerBaseURL: 'https://dev-0au4j672epupwqrf.us.auth0.com' ,
//   routes: {
//     login: '/api/login',
//     callback: '/api/callback',
//     logout: '/api/logout'
//   }
// };

// (async () => {
//   await prisma.languge.createMany({
//     data: [
//       { name: "English", Arabicname: "الإنجليزية", cost: 100 },
//       { name: "Arabic", Arabicname: "العربية", cost: 100 },
//       { name: "German", Arabicname: "الألمانية", cost: 100 },
//       { name: "French", Arabicname: "الفرنسية", cost: 100 },
//       { name: "Spanish", Arabicname: "الإسبانية", cost: 100 },
//       { name: "Italian", Arabicname: "الإيطالية", cost: 100 },
//       { name: "Portuguese", Arabicname: "البرتغالية", cost: 100 },
//       { name: "Dutch", Arabicname: "الهولندية", cost: 100 },
//       { name: "Russian", Arabicname: "الروسية", cost: 100 },
//       { name: "Chinese", Arabicname: "الصينية", cost: 100 },
//       { name: "Japanese", Arabicname: "اليابانية", cost: 100 },
//     ]
//   });
// })() ;

(async () => {})();

// app.use(auth(config));
app.use("/api", AuthRouter);
app.use("/api", OrdersRouter);
app.use("/api", AddressRouter);
app.use("/api", LanguageRouter);
app.use("/api", UserRouter);
app.use("/api/dashboard", ConditionsRouter);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/", (req, res, next) => {
  res.status(404).send("Page not found");
});

app.use(ErrorHandler);



server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
