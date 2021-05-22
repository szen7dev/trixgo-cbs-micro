const { EVENT_SOCKET_CONSTANT_CHATTING } = require('./helper/events.socket.constant.chatting');

exports.CHATTING_SOCKET = {
    [EVENT_SOCKET_CONSTANT_CHATTING.HELLO_WORLD]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        let listUserActive              = socket.$service.listUserConnected;
        
        socket.emit("LOGIN_SUCCESS", { message: 'data from server', listUserActive, socketSenderID: socketID });
    },
}