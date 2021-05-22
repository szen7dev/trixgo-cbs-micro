"use strict";
const ApiService        = require("moleculer-web");
const SocketIOService   = require('moleculer-io');
const redisAdapter      = require('socket.io-redis')
const express           = require('express');
const app               = express();
const server            = require('http').Server(app);
const { sign , verify }  = require('../../tools/jwt/jwt');
/**
 * socket-io service
 */
module.exports = {
    name: "socket-io",
    mixins: [ApiService, SocketIOService], //Should after moleculer-web
    settings: {
        io:{
            options: {
                adapter: redisAdapter({ host: 'localhost', port: 6379 })
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

                        let listAllUserIgnoreSender = listUserConnected.map(user => user.socketID != newSocketID);
                        // listAllUserIgnoreSender.forEach(user => {
                        //     socket.to(user.socketID).emit("NEW_USER", {newUser, newSocketID});
                        // })

                        next();
                    }],
                    // packetMiddlewares:[],
                    events:{
                        'call':{
                            whitelist: [
                                // 'users.*',
                                // 'say.*',
                                // 'accounts.*',
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
                        'REQUEST_LOGIN': async function(data, ack) { // write your handler function here.
                            let socket      = this;
                            let users       = this.$service.users;
                            let socketID    = socket.id;
                            
                            return console.log({ socket, users, socketID })

                            let _data = await verify(data.token);
                            console.log({_data});
                            // let infoUser = await socket.$service.broker.call('users.login', {
                            //  email: _data.data.email,
                            //  password: _data.data.password
                            // });
                            // console.log({infoUser});
                            // if (infoUser.code == 200){
                            //  users.push({infoUser, socketID});
                            // }
                            // let newUser = {
                            //  email: infoUser.data.email,
                            //  socket: socket.id
                            // };
                            socket.emit("LOGIN_SUCCESS", {_data});
                            // socket.$service.broker.call('io.broadcast', {
                            //  namespace:'/', //optional
                            //  event:'hello',
                            //  args: ['my', 'friends','!'], //optional
                            //  volatile: true, //optional
                            //  local: true, //optional
                            //  rooms: ['room1', 'room2'] //optional
                            // });
                            // socket.emit("NEW_USER", {infoUser});
                        },

                        'disconnect': async function(data, ack) { // write your handler function here.
                            let socket                      = this;
                            let listUserConnected           = socket.$service.listUserConnected;
                            let socketDisconnectID          = socket.id;

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
            console.log({ accessToken })
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
                    console.log({ _data })
                    if (_data) {
                        let { password } = _data;
                        if (password && password == '123456') {
                            return { message: 'auth_success' }
                        } else {
                            return { message: 'permission_denied' }
                        }
                    } else {
                        return { message: 'permission_denied' }
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
            return listUserConnected;
        },

        removeUserDisconnectIntoListConnected(socketDisconnectID){
            let listUserConnected = this.listUserConnected;
            // TODO: xem lại trường hợp nếu user có nhiều socket -> cần xoá socket trong mảng socketID:[]
            let listUserAfterFilterUserDisconnect = listUserConnected.filter(user => user.socketID != socketDisconnectID);
            console.log(`---------list user connected sau khi disconnect------`);
            console.log({ socketDisconnectID, listUserAfterFilterUserDisconnect });

            this.listUserConnected = listUserAfterFilterUserDisconnect;
            return listUserConnected;
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