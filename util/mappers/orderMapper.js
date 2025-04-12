import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const orderMapper = (order) => {
    
    const mappedOrder = order.map((order => {
        let printingFilesCounter = 0 ;
        const formatDate = (date) => {
            if (!date || isNaN(new Date(date).getTime())) {
                return 'Invalid Date';
            }
            const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true };
            return new Intl.DateTimeFormat('en-US', options).format(new Date(date)).replace(',', '');
        };
        if(order.type == "translation"){
        order.files = Array.isArray(order.files) ? order.files : Object.values(order.files);
        }else if(order.type == "printing"){
            order.PrintingDetails.forEach((file) => {
                printingFilesCounter++ ;
            });       
        }
        console.log("printingFilesCounter", printingFilesCounter) ;
        
        const result = {
            number: order.number,
            createdAt: formatDate(order.createdAt),
            delivery: order.delivery,
             filescount: order.files ? order.files.length :printingFilesCounter ,
            status: order.status,
        };
        

        if (order.translationfrom != null) {
            result.translationfrom = order.translationfrom;
        }

        return result;
    }))
  
    return mappedOrder ;

}



export const orderDetailsMapper = async (order) => {
        
        
        let deliveryAddress = null;
        if(order.delivery == "Office"){
            const office = await prisma.officeAddress.findFirst();
            deliveryAddress = office.address;
        }else if(order.delivery == "Home"){
            deliveryAddress = order.address;
        }

      

        const formatDate = (date) => {
            if (!date || isNaN(new Date(date).getTime())) {
                return 'Invalid Date';
            }
            const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true };
            return new Intl.DateTimeFormat('en-US', options).format(new Date(date)).replace(',', '');
        };
        let result ;
        if(order.type == "translation"){
        order.files = Array.isArray(order.files) ? order.files : Object.values(order.files);
        const languges = await prisma.languge.findMany({where: {name: {in: order.translationto}}, select: { name: true , Arabicname:true , cost:true }});
        
        result = {
            number: order.number,
            date:formatDate(order.createdAt).split(" ")[0],
            time:formatDate(order.createdAt).split(" ")[1] +" " + formatDate(order.createdAt).split(" ")[2],
            status: order.status,
            delivery: {
                address: deliveryAddress,
                type: order.delivery,
            },
            translationfrom: order.translationfrom,
            translationto: languges ,
            notes: order.notes,
            files: order.files,
            cost: order.cost,

            }
        }else if(order.type == "printing"){

            result = {
                number: order.number,
                date:formatDate(order.createdAt).split(" ")[0],
                time:formatDate(order.createdAt).split(" ")[1] +" " + formatDate(order.createdAt).split(" ")[2],
                status: order.status,
                delivery: {
                    address: deliveryAddress,
                    type: order.delivery,
                },
                notes: order.notes,
                orderDetails: order.PrintingDetails,
                cost: order.cost,
                
            }
        }

        return result;
  
}