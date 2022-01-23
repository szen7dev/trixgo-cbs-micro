exports.sendDataToMultilSocketsOfListUser = function ({ listUserConnected, arrReceiver, data, event, io }) {
    if(!listUserConnected || !event  || !io || !arrReceiver) {
        console.log('param invalid', listUserConnected, event, arrReceiver);
    }

   arrReceiver && arrReceiver.forEach(userID => {
        if(listUserConnected[userID]){
            let listSocket = listUserConnected[userID].sockets;
            // console.log({ [userID]: listSocket })

            if(listSocket && listSocket.length){
                let listIDSend = [];

                listSocket.forEach(socketID => {
                    if(!listIDSend.includes(socketID)){
                        console.log({ socketID: `${socketID}`, event });
                        io.to(`${socketID}`).emit(event, data);
                        listIDSend.push(socketID);
                    }
                })
            }

        }
   })
};
