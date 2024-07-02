const responses = require('./response.json');


const responseMessage = (code,body)=>{
   const response = responses.find(response=>response.code===code);

   return {
            header:{
                        responseCode:code, 
                        customerMessage:response.meaning
                    }, 
                 body
            }
    
}


module.exports = responseMessage