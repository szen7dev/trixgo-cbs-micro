/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } 			= require('../../../tools/utils/status_code')

/**
 * MODEL
 */
const AUTH__USER_MODEL                         	= require('../model/auth.user-model').MODEL;

module.exports = {
    /**
     *  Code: F0011
     *  Author: Depv
     */
    register: {
        params: {
            email           : { type: "string" },
            fullname        : { type: "string" },
            //username        : { type: "string" },
            level           : { type: "string" },
            companyID       : { type: "string" },
            platform        : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { email, fullname, level, companyID, platform }        = ctx.params;
                console.log({ email, fullname, level, companyID, platform } )

                let infoUser = await AUTH__USER_MODEL.register({ email, fullname, level, companyID, platform });
                return infoUser;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
    
    /**
     * Code: F0012
     * Author: Depv
     * Name: Đăng nhập
     */
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
                // console.log({ email, password, platform })
                let infoUser = await AUTH__USER_MODEL.login({ email, password, platform });
                return infoUser;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Code: F0013
     * Author: Depv
     * Name: Cập nhật thông tin thiết bị truy cập (cập nhật sau khi login thành công, hiện tại dùng cho Mobile)
     */
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

    /**
     * Code: F0014
     * Author: Depv
     * Name: Lấy thông tin người dùng
     */
    getInfo: { //(lấy thông tin chính user - owner) 
        auth: "required",
        async handler(ctx) {
            try {
                let infoUser = ctx.meta.infoUser;
                if (!infoUser) 
                    return { error: true, message: 'cannot_get_info_from_token' }

                let { _id: userID } = infoUser;
                let infoUserAfterFind = await AUTH__USER_MODEL.getInfo({ userID });
                console.log({ infoUserAfterFind });
                return infoUserAfterFind;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

	getInfoById: {
        auth: "required",
		params: {
			userID: { type: "string" },
			select: { type: "string", optional: true },
		},
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                let { userID, select } = ctx.params;

                let infoUserAfterFind = await AUTH__USER_MODEL.getInfoById({ userID, select });

                return infoUserAfterFind;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

	getListUserWithCondition: {
        auth: "required",
		params: {
			select: { type: "string", optional: true },
		},
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                let { condition, select } = ctx.params;

                let infoUserAfterFind = await AUTH__USER_MODEL.getListUserWithCondition({ condition, select });

                return infoUserAfterFind;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Code: F0015
     * Author: Depv
     * Name: Get user by JWT token (for API GW authentication)
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
    /**
     * Code: F0016
     * Author: Depv
     * Name: Tìm kiếm tất cả user theo fullname (cơ chế full text search, sort theo point full_text)
     */
    searchWithFullText: {
        cache: {
            keys: ["key"],
            ttl: 60 * 60 //1 hour
        },			
        params: {
            key: { type: "string", optional: true }
        },
        async handler(ctx) {
            await this.validateEntity(ctx.params);
            let { key }        = ctx.params;
            /**
             * TODO cấu hình 1 function như list (mongoose adapter)
             */
            let listUsers = await AUTH__USER_MODEL.searchWithFullText({ fullnameKey: key })
            return listUsers;
        }
    },

    /**
     * Code: F0017
     * Author: Depv
     * Name: Thay đổi mật khẩu
     */
    changePassword: {
        auth: "required",
        params: {
            currentPass        : { type: "string" },
            newPass            : { type: "string" },
        },
        async handler(ctx) {
            try {
                let infoUser = ctx.meta.infoUser;
                let { _id: userID } = infoUser;

                await this.validateEntity(ctx.params);
                let { currentPass, newPass }        = ctx.params;
                // console.log({ email, password, platform })
                let infoUserAfterUpdate = await AUTH__USER_MODEL.updatePassword({ userID, currentPass, newPass});
                return infoUserAfterUpdate;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

     /**
     * Code: F0018
     * Name: Cập nhật họ và tên
     * Author: Depv
     */
    changeFullname: {
        auth: "required",
        params: {
            firstname : { type: "string" },
            lastname : { type: "string" },
            fullname : { type: "string" },
        },
        async handler(ctx) {
            try {
                let infoUser = ctx.meta.infoUser;
                let { _id: userID } = infoUser;
                await this.validateEntity(ctx.params);
                let { firstname, lastname, fullname }        = ctx.params;
                let infoUserAfterUpdate = await AUTH__USER_MODEL.updateFullname({ userID, firstname, lastname, fullname });
                return infoUserAfterUpdate;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Code: F0019
     * Name: Cập nhật email
     * Author: Depv
     */
    changeEmail: {
        auth: "required",
        params: {
            email : { type: "string" },
        },
        async handler(ctx) {
            try {
                let infoUser = ctx.meta.infoUser;
                let { _id: userID } = infoUser;
                await this.validateEntity(ctx.params);
                let { email }        = ctx.params;
                let infoUserAfterUpdate = await AUTH__USER_MODEL.updateEmail({ userID, email });
                return infoUserAfterUpdate;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Code: F0020
     * Name: Cập nhật phone
     * Author: Depv
     */
    changePhone: {
        auth: "required",
        params: {
            phone : { type: "string" },
        },
        async handler(ctx) {
            try {
                let infoUser = ctx.meta.infoUser;
                let { _id: userID } = infoUser;
                await this.validateEntity(ctx.params);
                let { phone }        = ctx.params;
                let infoUserAfterUpdate = await AUTH__USER_MODEL.updatePhone({ userID, phone });
                return infoUserAfterUpdate;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Code: F0021
     * Name: Cập nhật language
     * Author: Depv
     */
    changeLanguage: {
        auth: "required",
        params: {
            lang : { type: "string" },
        },
        async handler(ctx) {
            try {
                let infoUser = ctx.meta.infoUser;
                let { _id: userID } = infoUser;
                await this.validateEntity(ctx.params);
                let { lang }        = ctx.params;
                let infoUserAfterUpdate = await AUTH__USER_MODEL.updateLanguage({ userID, lang });
                return infoUserAfterUpdate;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Code: F0022
     * Author: Depv
     * Date: 19/08/2021
     */
    changeBirthDay: {
        auth: "required",
        params: {
            birthDay : { type: "string" },
        },
        async handler(ctx) {
            try {
                let infoUser = ctx.meta.infoUser;
                let { _id: userID } = infoUser;
                await this.validateEntity(ctx.params);
                let { birthDay }        = ctx.params;
                let infoUserAfterUpdate = await AUTH__USER_MODEL.updateBirthDay({ userID, birthDay });
                return infoUserAfterUpdate;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Code: F0023
     * Name: Gửi OTP quên mật khẩu
     * Author: Depv
     */
    sendOTPResetPassword: {
        params: {
            email : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { email }        = ctx.params;
                let infoUserAfterUpdate = await AUTH__USER_MODEL.sendOTPResetPassword({ email });
                return infoUserAfterUpdate;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Code: F0024
     * Name: Xác thực code reset password
     * Author: Depv
     */
    confirmCodeResetPassword: {
        params: {
            email : { type: "string" },
            code : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { email, code }        = ctx.params;
                let infoUserAfterUpdate = await AUTH__USER_MODEL.confirmCodeResetPassword({ email, code });
                return infoUserAfterUpdate;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Code: F0024
     * Author: Depv
     * Date: 19/08/2021 
     */
    updatePasswordAfterForget: {
        params: {
            email : { type: "string" },
            code : { type: "string" },
            password : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { email, code, password }        = ctx.params;
                let infoUserAfterUpdate = await AUTH__USER_MODEL.updatePasswordAfterReset({ email, code, password });
                return infoUserAfterUpdate;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
    /**
     * Perform a textual search with 'find' method
     *  phương án này chỉ dùng cho các trường hợp đơn giản (ko có tìm kiếm+phân trang)
     *  -> tối ưu: cần dùng text search riêng
     * 
     *  db.message_messages.find(
            { $text: { $search: "TRX Khánh Duy" } },
            { score: { $meta: "textScore" } }
            ).sort( { score: { $meta: "textScore" } } )

            .projection({
                content: 1
        })
     */
    searchWithFind: {
        cache: {
            keys: ["key"],
            ttl: 60 * 60 //1 hour
        },			
        params: {
            key: { type: "string", optional: true }
        },
        async handler(ctx) {
            await this.validateEntity(ctx.params);
            let { key }        = ctx.params;
			
            return ctx.call("auth.list", {
                search: key,
                searchFields: ["fullname"],
                fields: ["fullname", "username"],
                page: 1,
                limit: 10,
            });
        }
    },

  

	updatePinConversation: {			
        params: {
            conversationID	: { type: "string" },
            userID			: { type: "string" },
            isPin			: { type: "boolean" }
        },
        async handler(ctx) {
			try {
                await this.validateEntity(ctx.params);
                let { conversationID, userID, isPin } = ctx.params;

                let resultAfterCallHandler = await AUTH__USER_MODEL.updatePinConversation({ 
					conversationID, userID, isPin
				});

				return resultAfterCallHandler;
            } catch (error) {
				return { error: true, message: error.message, status: 500 };
            }
        }
    },

	getListPinConversation: {			
        params: {
            userID: { type: "string" },
        },
        async handler(ctx) {
			try {
                await this.validateEntity(ctx.params);
                let { userID, select } = ctx.params;

                let resultAfterCallHandler = await AUTH__USER_MODEL.getListPinConversation({ 
					userID, select
				});

				return resultAfterCallHandler;
            } catch (error) {
				return { error: true, message: error.message, status: 500 };
            }
        }
    }

}
