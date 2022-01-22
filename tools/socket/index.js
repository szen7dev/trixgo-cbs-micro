exports.sendDataToMultilSocketsOfListUser = function ({ listUserConnected, arrReceiver, data, event, io }) {
    if(!listUserConnected || !event  || !io || !arrReceiver) {
        console.log('param invalid', listUserConnected, event, arrReceiver);
    }

   arrReceiver && arrReceiver.forEach(userID => {
        if(listUserConnected[userID]){
            let listSocket = listUserConnected[userID].sockets;
            console.log({ [userID]: listSocket })

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
