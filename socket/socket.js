import { Server } from "socket.io";
import axios from "axios";
import qs from "querystring";

import { PrismaClient } from "@prisma/client";
import { time } from "console";
const prisma = new PrismaClient();


export function initializeSocket(server) {
    console.log("🟢 Initializing WebSocket Server...");
  
    const io = new Server(server, {
      cors: {
        origin: "*", // ✅ Allow all origins (Change in production)
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"], // ✅ Use WebSocket + Polling fallback
    });
  
    io.on("connection", (socket) => {
      socket.on("userMessage", async (messagee, userid , chatid) => {
        console.log("User message:", messagee);
        console.log("User id:", userid);
        console.log("Chat id:", chatid);
  
        try {
          const data = qs.stringify({
            user_id: userid,
            query: `Answer this question "${messagee}" in the same language of the question. If the question is in English, respond in English. If the question is in Arabic, respond in Arabic.`,
          });
  
         
  
         
  
          const planmessage = await prisma.subscription.findFirst({where : {Isactive : true , userId : userid} , include : {Plan:{include:{Permissions:true}}}}) ;
          const User = await prisma.user.findUnique({where : {id:userid}});
  
          if(planmessage.Plan.Permissions.maximumMessages !== -1) {
          
            if(User.messageCounter >= planmessage.Plan.Permissions.maximumMessages) {
              const lastdate = User.lastMessgae ;
              const limitminits = planmessage.Plan.Permissions.resetMinutes ;
              const currentTime = new Date();
              const resetTime = new Date(lastdate);
              resetTime.setMinutes(resetTime.getMinutes() + limitminits);
  
              if (currentTime > resetTime) {
                await prisma.user.update({
                where: { id: User.id },
                data: { messageCounter: 1, lastMessgae: currentTime },
                });
              }else {
                const remainingTime = Math.max(0, Math.ceil((resetTime - currentTime) / 60000)); // Calculate remaining time in minutes
                return socket.emit("aiMessage", {error: "LIMIT_ERROR", time: remainingTime});
              }
            }
  
            if(User.messageCounter < planmessage.Plan.Permissions.maximumMessages) {
              await prisma.user.update({where : {id :User.id} , data : {messageCounter : {increment : 1}}}) ;
            }
  
          }
  
         
  
          
          const response = await axios.post(url, data, { headers });
          const answer = response.data.response;
  
          socket.emit("aiMessage", answer);
  
          let chatID = await prisma.chat.findUnique({where : {userId:userid , id : chatid}}) ;
  
          if(chatid === null || !chatID) {
  
            const summrize = qs.stringify({
              user_id: "Developer",
              query: `please summry this question "${messagee}" as a title of the qustion maximum 5 words in the same languge of the question If the question is in English, respond in English. If the question is in Arabic, respond in Arabic. `,
            });
  
          const response2 = await axios.post(url, summrize, { headers });
          const answer2 = response2.data.response;
          
  
            const newChat = await prisma.chat.create({data : {
              id:chatid , userId: userid , name: answer2 , Histories:{create : {question :messagee , answer:answer}}
            }});
          }else{
            const chat = await prisma.chat.findUnique({where : {id : chatid , userId:userid}}) ;
            if(chat) {
              console.log("Chat found:", chat); 
              const history = await prisma.history.create({data : {
                chatId: chat.id , question : messagee , answer:answer
              }});
            }
          }
  
  
        } catch (error) {
          console.error(
            "Error:",
            error.response ? error.response.data : error.message
          );
        }
      });
    });
  
    return io;
  }
  