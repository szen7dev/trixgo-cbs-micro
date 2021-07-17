// HUYNHVINH
exports.sendDataToMultilSocketsOfListUser = function ({ listUserConnected, arrReceiver, data, event, io }) {
   if(!listUserConnected || !event  || !io || !arrReceiver) {
       console.log('param invalid', listUserConnected, event, io, arrReceiver);
   }

   arrReceiver && arrReceiver.forEach(userID => {
        if(listUserConnected[userID]){
            let listSocket = listUserConnected[userID].sockets;

            if(listSocket){
                let listIDSend = '';

                listSocket.forEach(socketID => {
					console.log({ socketID })
                    if(!listIDSend.includes(socketID)){
                        io.to(`${socketID}`).emit(event, data);
                        listIDSend += ` , ${socketID} `;
                    }
                })
            }

        }
   })
};
