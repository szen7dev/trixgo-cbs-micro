"use strict";
const ApiService            = require("moleculer-web");
const SocketIOService       = require('moleculer-io');
const redis                 = require('redis');
const redisAdapter          = require('socket.io-redis')
const express               = require('express');
const app                   = express();
const server                = require('http').Server(app);
const { sign , verify }     = require('../../tools/jwt/jwt');
const { REDIS_SEPERATOR }   = require('../../tools/redis/cf_redis');
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
                        let listUserConnected   = this.addNewUserIntoListConnected(newUser, newSocketID);
                        let listAllUserIgnoreSender = listUserConnected.filter(user => user.socketID != newSocketID);
                        // listAllUserIgnoreSender.forEach(user => {
                        //     socket.to(user.socketID).emit("NEW_USER", {newUser, newSocketID});
                        // })
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

                        'disconnect': async function(data, ack) { // write your handler function here.
                            let socket                      = this;
                            let socketDisconnectID          = socket.id;
                            let listUserConnected           = socket.$service.listUserConnected;

                            socket.$service.removeUserDisconnectIntoListConnected(socketDisconnectID)
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
            let listUserConnected = this.listUserConnected;
            console.log({ ['trước khi add vào connected']: listUserConnected })
            let listUserAfterInsertNewUserConnect = [...listUserConnected, { user, socketID }];
            console.log({ ['SAU add vào connected']: listUserAfterInsertNewUserConnect })

            this.listUserConnected = listUserAfterInsertNewUserConnect;
            return listUserAfterInsertNewUserConnect;
        },

        removeUserDisconnectIntoListConnected(socketDisconnectID){
            let listUserConnected = this.listUserConnected;
            // TODO: xem lại trường hợp nếu user có nhiều socket -> cần xoá socket trong mảng socketID:[]
            let listUserAfterFilterUserDisconnect = listUserConnected.filter(user => user.socketID != socketDisconnectID);
            console.log(`---------list user connected sau khi disconnect------`);
            console.log({ socketDisconnectID, listUserAfterFilterUserDisconnect });

            this.listUserConnected = listUserAfterFilterUserDisconnect;
            return listUserAfterFilterUserDisconnect;
        }
    },
    /**
     * Service created lifecycle event handler
     */
    created() {
        this.initSocketIO(server);
        const listUserConnected = [];
        this.listUserConnected = listUserConnected;
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
        server.listen(4000);
    },
    /**
     * Service stopped lifecycle event handler
     */
    async stopped() {
    }
};