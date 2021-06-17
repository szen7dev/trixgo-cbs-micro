"use strict";
const ApiService            = require("moleculer-web");
const SocketIOService       = require('moleculer-io');
const redis                 = require('redis');
const redisAdapter          = require('socket.io-redis')
const express               = require('express');
const app                   = express();
const server                = require('http').Server(app);

const  USER_MODEL           = require('../../services/auth/model/auth.user-model').MODEL;


const { sign , verify }     = require('../../tools/jwt');
const { REDIS_SEPERATOR }   = require('../../tools/cache/cf_redis');
/**
 * mỗi service có thể có 1/n event socket -> cách đặt tên [service].[socket]
 */
const { CHATTING_SOCKET } = require('../chatting/chatting.socket');

let pub = redis.createClient({
    host: REDIS_SEPERATOR.HOST,
    port: REDIS_SEPERATOR.PORT,
    auth_pass: REDIS_SEPERATOR.PWD
});

let sub = redis.createClient({
    host: REDIS_SEPERATOR.HOST,
    port: REDIS_SEPERATOR.PORT,
    auth_pass: REDIS_SEPERATOR.PWD
});

let  { sendDataToMultilSocketsOfListUser }   = require('../../tools/socket/index')
/**
 * socket-io service
 */
module.exports = {
    name: "socket-io",
    mixins: [ApiService, SocketIOService], //Should after moleculer-web
    settings: {
        io:{
            options: {
                adapter: redisAdapter({   
                    pubClient: pub,
                    subClient: sub 
                })
            },
            namespaces: {
                '/':{
                    authorization: true,
                    middlewares:[async function(socket, next){
                        /**
                         * newUser: lấy resp từ socketAuthorize
                         */
                        let newUser             = socket.client.user;
                        let newSocketID         = socket.id;
                        let listUserConnected   = this.addNewUserIntoListConnected(newUser, newSocketID, socket);
                        let listAllUserIgnoreSender = listUserConnected.filter(user => user.socketID != newSocketID);
                        // listAllUserIgnoreSender.forEach(user => {
                        //     socket.to(user.socketID).emit("NEW_USER", {newUser, newSocketID});
                        // })
                        console.log({newUser})
                        this.userID = newUser;
                        
                        this.addNewUserIntoListConnectedV2(newSocketID);
                        // Xét user Online
                        let _infoUser =  await USER_MODEL.getDataById(newUser)
                        this.setUserOnline({ _infoUser  })

                        next();
                    }],
                    events:{
                        'call':{
                            whitelist: [
                                // 'users.*',
                                // 'rooms.*',
                                // 'io.*'
                            ],
                            aliases: {
                                // 'login': 'users.login'
                            },
                            onBeforeCall: async function(ctx, socket, action, params, callOptions){
                                console.log('before hook:', { action, params, callOptions });
                            },
                            onAfterCall:async function(ctx, socket, res){
                                console.log('after hook', res);
                            }
                            // callOptions:{}
                        },

                        /**
                         *  passing all event of all services
                         */
                        ...CHATTING_SOCKET,
                        'test1': function(data, ack) {
							let socket = this
							socket.emit('LOGIN_SUCCESS', data)
						},

                        'connect': async function(data, ack) { // write your handler function here.
                          console.log('connection')
                        },

                        // 'reconnect': async function(data, ack) { // write your handler function here.
                        //     console.log('reconnection')
                        // },

                        'disconnect': async function(data, ack) { // write your handler function here.
                            let socket                      = this;
                            let socketDisconnectID          = socket.id;
                            let listUserConnected           = socket.$service.listUserConnected;

                            socket.$service.removeUserDisconnectIntoListConnectedV2( socketDisconnectID)

                            socket.$service.removeUserDisconnectIntoListConnected(socketDisconnectID)

                            // Xét user Online
                            let userID             = socket.client.user;

                            let _infoUser =  await USER_MODEL.getDataById(userID)
                            socket.$service.setUserOffline({ _infoUser })

                            // ---> ví dụ emit
                            // socket.$service.io.to(user.socketID).emit("USER_LOGOUT", {listUserConnected, socketLogout});
                        },
                    }
                }
            }
        },
    },
    methods: {
        async socketAuthorize(socket, eventHandler){
            let accessToken = socket.handshake.query.token;
            console.log({userID : accessToken});
            this.userID = accessToken;
            return  Promise.resolve(this.userID)

            if (accessToken.length) {
                // try{
                //     let user = await this.broker.call("users.verifyToken", {accessToken});
                //     // return {id: user.id, email: user.email, token: accessToken} ; // valid credential, return the user
                //     return {id: user._id, email: user.email, fullname: user.fullName, token: accessToken}  ;
                // }catch(err){
                //     return err; // invalid credentials
                // }

                /**
                 * DEMO verify -> về sau thì đẩy về service auth
                 */
                try {
                    
                    let _data = await verify(accessToken);
                    if (_data) {
                        let { password } = _data;
                        if (password && password == '123456') {
                            return Promise.resolve({ id: 1, detail: "You are authorized using token.", name: "John Doe" })
                        } else {
                            return Promise.reject()
                        }
                    } else {
                        return Promise.reject()
                    }
                } catch (error) {
                    console.log({ error })
                }
            } else {
                  // anonymous user
                console.log("connect failed");
                return {
                    error: true
                };
            }
        },

        addNewUserIntoListConnected(user, socketID){
            let listUserConnected                   = this.listUserConnected;
            // console.log({ ['trước khi add vào connected']: listUserConnected })
            let listUserAfterInsertNewUserConnect   = [...listUserConnected, { user, socketID }];
            // console.log({ ['SAU add vào connected']: listUserAfterInsertNewUserConnect })

            this.listUserConnected = listUserAfterInsertNewUserConnect;
            return listUserAfterInsertNewUserConnect;
        },


        addNewUserIntoListConnectedV2( socketID){
            let listUserConnected2 = this.listUserConnected2;
            socketID = socketID.toString();
            let _userID = this.userID.toString();
            if(!listUserConnected2[_userID]){
                listUserConnected2[_userID]          = {};
                listUserConnected2[_userID].sockets  = [];
                listUserConnected2[_userID].sockets  = [...listUserConnected2[_userID].sockets, socketID ];
            }

            if(listUserConnected2[_userID] ){
                listUserConnected2[_userID].sockets = listUserConnected2[_userID].sockets.filter(_socketID => _socketID != socketID);
                listUserConnected2[_userID].sockets = [...listUserConnected2[_userID].sockets,  socketID ];
            }

              
            this.listUserConnected2 = listUserConnected2;
            return listUserConnected2;
        },

        removeUserDisconnectIntoListConnectedV2( socketDisconnectID){
            let listUserConnected2                              = this.listUserConnected2;
            socketDisconnectID                                  = socketDisconnectID && socketDisconnectID.toString();
            listUserConnected2[this.userID.toString()].sockets  = listUserConnected2[this.userID.toString()].sockets.filter(_socketID => _socketID != socketDisconnectID);
            // console.log(`---------list user connected sau khi disconnect  VVVV2------`);
            // console.log({ socketDisconnectID, listUserConnected2 });

            return listUserConnected2;
        },

        removeUserDisconnectIntoListConnected(socketDisconnectID){
            let listUserConnected   = this.listUserConnected;
            // TODO: xem lại trường hợp nếu user có nhiều socket -> cần xoá socket trong mảng socketID:[]
            let listUserAfterFilterUserDisconnect = listUserConnected.filter(user => user.socketID != socketDisconnectID);
            // console.log(`---------list user connected sau khi disconnect------`);
            // console.log({ socketDisconnectID, listUserAfterFilterUserDisconnect });

            this.listUserConnected = listUserAfterFilterUserDisconnect;
            return listUserAfterFilterUserDisconnect;
        },
        
        // Author : HUYNHVINH
        setUserOnline({_infoUser}){
            // Online
            // Khi vừa kết nối sẽ tìm ai đang online là bạn mình thì lấy ra và hiển thị
            if(!_infoUser)
                return 
            let friends             = _infoUser &&  _infoUser.friends;
            let listFriendOnline    = [];
            let listUserActive      = this.listUserConnected2 || [];
            let io                  = this.io;

            // Gửi tín hiệu kết nối cho những người bạn
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : friends , data : { listFriendOnline:[ _infoUser._id],  disconnect : false, arraymember : _infoUser._id, isFirstTime : false }, event :'SSC_ONLINE_USER', io })
          
            friends.forEach(friendID =>{
                if(friendID && listUserActive[friendID]){
                    listFriendOnline.push(friendID);
                }
            });
            // let timeOutMe = setTimeout(() =>{
                // Lấy các người bạn đang online gửi đến chính mình
                sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [ _infoUser._id ], data : { listFriendOnline,  disconnect : false, isFirstTime : true }, event :'SSC_ONLINE_USER', io })
                // clearTimeout(timeOutMe)
            // },200)


           
        },

        // Author : HUYNHVINH
        setUserOffline({ _infoUser }){
            // Khi user Mất kết nối 
            if(!_infoUser)
                return;

            let listUserActive      = this.listUserConnected2 || [];
            let io                  = this.io;

            //Xử lý hiển thị offline khi disconect
            if(listUserActive[_infoUser._id]){
                // let time = Date.now();
                // let infoUser = await USER_COLL.findById(userDisconnect.userID);
                // let updateTimeOffline = await DB_MESSAGE_CONVERSATION_MODEL.updateUserOffline({  userID : userDisconnect.userID, time });
                sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : _infoUser.friends , data : { friendOnline :  _infoUser._id,  disconnect : true, isFirstTime : false }, event :'SSC_ONLINE_USER', io })
            
            }
        }
        // Author : HUYNHVINH
        // 

        
    },
    /**
     * Service created lifecycle event handler
     */
    created() {
        this.initSocketIO(server);
        const listUserConnected = [];
        this.listUserConnected = listUserConnected;
        this.userID;
        this.listUserConnected2 = [];
    },
    /**
     * Service started lifecycle event handler
     */
    async started() {
        // this.app.listen(Number(this.settings.port), err => {
        //  if (err)
        //      return this.broker.fatal(err);
        //  this.logger.info(`WWW server started on port ${this.settings.port}`);
        // });
        
        server.listen(3003);
    },
    /**
     * Service stopped lifecycle event handler
     */
    async stopped() {
    }
};