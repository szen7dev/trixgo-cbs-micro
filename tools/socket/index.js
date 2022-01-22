// HUYNHVINH
exports.sendDataToMultilSocketsOfListUser = function ({ listUserConnected, arrReceiver, data, event, io }) {
   if(!listUserConnected || !event  || !io || !arrReceiver) {
       console.log('param invalid', listUserConnected, event, arrReceiver);
   }

   arrReceiver && arrReceiver.forEach(userID => {
       console.log({ user_connected: listUserConnected[userID] })
        if(listUserConnected[userID]){
            let listSocket = listUserConnected[userID].sockets;
            console.log({ listSocket, sockets: sockets.length })

            if(listSocket){
                let listIDSend = '';

                listSocket.forEach(socketID => {
                    if(!listIDSend.includes(socketID)){
                        io.to(`${socketID}`).emit(event, data);
                        listIDSend += ` , ${socketID} `;
                    }
                })
            }

        }
   })
};
