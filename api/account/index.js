

let ACCOUNT_MODEL    		= require('../../models/core/account').MODEL;
let APP_MODEL    		    = require('../../models/core/app').MODEL;
// const redis              = require("redis");
// const client             = redis.createClient();
const Redis                 = require("ioredis");
const redis                 = new Redis();
const USER_SESSION          = require('../../session/user-session');
module.exports = {

    /**
         * Get list account
         * 
         * @actions
         *
         * @returns {Object} 
    **/

    getList : {
        async handler(ctx) {
            try {
                let infoUser = await ACCOUNT_MODEL.getList();
                
                return infoUser;
            } catch (error) {
                return(error);
            }
        },
    },

    /**
         * Find account by id
         * 
         * @actions
         * @param {String} userID 
         *
         * @returns {Object} 
    **/

    findById : {
        params: {
            userID: {
                type: "string"
            },
        },
        async handler(ctx) {
            try {
                let {userID} = ctx.params

                let infoUser = await ACCOUNT_MODEL.findById({userID});

                return infoUser;
            } catch (error) {
                return(error);
            }
        },
    } ,

    /**
         * Register account
         * 
         * @actions
         * @param {Emai} email 
         * @param {String} password 
         * @param {String} fullName 
         *
         * @returns {Object} 
    **/

    register : {
        params: {
            // custom validation
            email: {
                type: "email"
            },
            
            password: { 
                type: "custom",
                // CHECK_PASSWORD(value, errors, schema)
                check(value, errors, schema) {
                    if (value.length < 5) errors.push({ type: "Short password", expected: 5, actual: parseInt(value) });
                    return value
                }
            },
            
            fullName: {
                type: "string",
                min: 2,
                messages: {
                    string: "Please check your fullName",
                    stringMin: "Your fullName is too short"
                }
            },
            
        },
        async handler(ctx) {
            try {
                let { email, password, fullName, role } = ctx.params;
        
                let infoUser = await ACCOUNT_MODEL.register({ email, fullName, password, role });
                if (infoUser.error) {
                    return infoUser
                }
                return infoUser;
            } catch (error) {
                return(error);
            }
        },
    },

    /**
         * Login
         * 
         * @actions
         * @param {Emai} email 
         * @param {String} password 
         *
         * @returns {Object} 
    **/

    login : {
        // Validator schema for params
        params: {
            email: { type: "string", min: 2 }
        },
        async handler(ctx) {
            try {
                let { email, password } = ctx.params;
        
                let infoUser = await ACCOUNT_MODEL.login({ email, password });
                if (infoUser.error) {
                    return infoUser
                }
                
                // redis.set('token', infoUser.data.token);
                
                return infoUser;
                
            } catch (error) {
                return(error);
            }
        }
    },
    
    /**
         * Logout
         * 
         * @actions
         *
         * @returns {Object} 
    **/

    logout : {
        async handler(ctx) {
            try {
                redis.del("token");
                return {
                    error: false,
                    message: 'logout_success',
                }
            } catch (error) {
                return(error);
            }
        }
    },

    /**
         * Update account
         * 
         * @actions
         * @param {String} accountID 
         * @param {String} fullName 
         *
         * @returns {Object} 
    **/

    updateInfo : {
       
        async handler(ctx) {
            let { accountID, fullName } = ctx.params;
            let infoUser = await ACCOUNT_MODEL.updateInfo({ accountID, fullName });
            if (infoUser.error) {
                return infoUser
            }
            return infoUser;
        }
    },

    /**
         * Create app
         * 
         * @actions
         * @param {String} adminID // từ header
         * @param {String} name  // tên App
         * 
         * @returns {Object} 
    **/

    createApp : {
       
        async handler(ctx) {
            let {_id : adminID} = ctx.meta.infoUser;
            let { name } = ctx.params;
            let infoApp = await APP_MODEL.insert({ name, userCreate: adminID });
            if (infoApp.error) {
                return infoApp
            }
            return infoApp;
        }
    },


    /**
         * Update app
         * 
         * @actions
         * @param {String} adminID // từ header
         * @param {String} appID // app cần cập nhập
         * @param {String} name  // tên App
         * 
         * @returns {Object} 
    **/

    updateApp : {
       
        async handler(ctx) {
            let {_id : adminID} = ctx.meta.infoUser;
            let { appID, name } = ctx.params;
            let infoApp = await APP_MODEL.update({ appID, name, userUpdate: adminID });
            if (infoApp.error) {
                return infoApp
            }
            return infoApp;
        }
    },

    /**
         * Add member into app
         * 
         * @actions
         * @param {String} adminID // từ header
         * @param {String} appID 
         * @param {String} users  // ID user muốn cho vào
         * 
         * @returns {Object} 
    **/

    insertMemberIntoApp : {
       
        async handler(ctx) {
            let {_id : adminID} = ctx.meta.infoUser;
            let { appID, users } = ctx.params;
            let infoApp = await APP_MODEL.insertSomeMember({ users, appID, userCreate: adminID });
            if (infoApp.error) {
                return infoApp
            }
            return infoApp;
        }
    } 
    
} 
