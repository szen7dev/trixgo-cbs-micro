let AUTH__USER_MODEL                         = require('../model/auth.user-model').MODEL;

module.exports = {
    register: {
        params: {
            email           : { type: "string" },
            fullname        : { type: "string" },
            username        : { type: "string" },
            level           : { type: "string" },
            companyID       : { type: "string" },
            platform        : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { email, fullname, username, level, companyID, platform }        = ctx.params;

                let infoUser = await AUTH__USER_MODEL.register({ email, fullname, username, level, companyID, platform });
                return infoUser;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    login: {
        params: {
            email           : { type: "string" },
            password        : { type: "string" },
            platform        : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { email, password, platform }        = ctx.params;

                let infoUser = await AUTH__USER_MODEL.login({ email, password, platform });
                return infoUser;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    updateDeviceLogin: {
        params: {
            platform            : { type: "string" },
            deviceID            : { type: "string" },
            deviceName          : { type: "string" },
            registrationID      : { type: "string" },

            userID          : { type: "string" }, //TODO update userID fake
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { userID, platform, deviceID, deviceName, registrationID }        = ctx.params;

                let infoUser = await AUTH__USER_MODEL.updateDeviceLogin({ userID, platform, deviceID, deviceName, registrationID });
                return infoUser;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    getInfo: { //(lấy thông tin chính user - owner) 
        auth: "required",
        async handler(ctx) {
            try {
                let infoUser = ctx.meta.infoUser;
                if (!infoUser) 
                    return { error: true, message: 'cannot_get_info_from_token' }

                let { _id: userID } = infoUser;
                let infoUserAfterFind = await AUTH__USER_MODEL.getInfo({ userID });
                return infoUserAfterFind;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Get user by JWT token (for API GW authentication)
     * 
     * @actions
     * @param {String} token - JWT token
     * 
     * @returns {Object} Resolved user
     */
    resolveToken: {
        cache: {
            keys: ["token"],
            ttl: 60 * 60 //1 hour
        },			
        params: {
            token: "string"
        },
        async handler(ctx) {
            await this.validateEntity(ctx.params);
            let { token }        = ctx.params;

            let infoUser = await AUTH__USER_MODEL.resolveToken({ token });
            return infoUser;
        }
    },
}