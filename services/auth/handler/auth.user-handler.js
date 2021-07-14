let AUTH__COMPANY_MODEL                         = require('../model/auth.user-model').MODEL;

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

                let infoUser = await AUTH__COMPANY_MODEL.register({ email, fullname, username, level, companyID, platform });
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

                let infoUser = await AUTH__COMPANY_MODEL.login({ email, password, platform });
                return infoUser;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    updateDeviceLogin: {
        params: {
            email           : { type: "string" },
            password        : { type: "string" },
            platform        : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { userID, platform, deviceID, deviceName, registrationID }        = ctx.params;

                let infoUser = await AUTH__COMPANY_MODEL.updateDeviceLogin({ userID, platform, deviceID, deviceName, registrationID });
                return infoUser;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    getInfo: { //(lấy thông tin chính user - owner) 
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { userID, status }        = ctx.params;

                let infoUser = await AUTH__COMPANY_MODEL.getInfo({ userID, status });
                return infoUser;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}