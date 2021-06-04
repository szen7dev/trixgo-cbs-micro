// HUYNHVINH
exports.sendDataToMultilSocketsOfListUser = function ({ listUserConnected,  arrReceiver , data ,event ,io }) {
   if(!listUserConnected || !event  || !io || !arrReceiver) {
       console.log('param invalid', listUserConnected, event ,io, arrReceiver);
   }
  
   arrReceiver && arrReceiver.forEach(userID => {
        if(listUserConnected[userID]){
            let  listSocket =  listUserConnected[userID].sockets;
            if(listSocket){
                let listIDSendt = '';
                listSocket.forEach((socketID, index) =>{
                    if(!listIDSendt.includes(socketID)){
                        io.to(`${socketID}`).emit(event, data);
                        listIDSendt += ` , ${socketID} `;
                    }
                })
            }
        }
   })
};
