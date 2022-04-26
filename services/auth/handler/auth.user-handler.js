/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } 			= require('../../../tools/utils/status_code')
const { validateDomainAndPlatform }             = require('../helper/auth.keys-constant')

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
            domain          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { email, password, platform, domain } = ctx.params;

                /**
                 * validate code platform-domain
                 */
                let isValidatePlatform = validateDomainAndPlatform.find(item => item.platform == platform && item.domain == domain);
                if (!isValidatePlatform) {
                    return {
                        error: true,
                        data: {
                            message: 'platform_login_invalid',
                            keyError: 'platform_login_invalid'
                        }
                    }
                }
                let infoUser = await AUTH__USER_MODEL.login({ email, password, platform });
                // ctx.emit("NOTIFICATION__LOG_CREATE:MOBILE", { users: '5e60f595f63b8a4e196a1943' });
                return infoUser;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

     /**
     * Func: Thêm bạn bè
     * Author: MinhVH
     * Date: 12/10/2021
     */
    addFriend: {
        auth: "required",
        params: {
            friendID: { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let userID       = ctx.meta.infoUser && ctx.meta.infoUser._id;
                let { friendID } = ctx.params;

                let resultAfterCallHandler = await AUTH__USER_MODEL.addFriend({ userID, friendID });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

     /**
     * Func: Hủy kết bạn
     * Author: MinhVH
     * Date: 12/10/2021
     */
    removeFriend: {
        auth: "required",
        params: {
            friendID: { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let userID       = ctx.meta.infoUser && ctx.meta.infoUser._id;
                let { friendID } = ctx.params;

                let resultAfterCallHandler = await AUTH__USER_MODEL.removeFriend({ userID, friendID });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
     * Func: Lấy danh sách bạn bè
     * Author: MinhVH
     * Date: 12/10/2021
     */
    getListFriend: {
        auth: "required",
        params: {
            lastestID : { type: "string", optional: true },
			keyword   : { type: "string", optional: true },
			select    : { type: "string", optional: true },
			limit     : { type: "string", optional: true },
			populates : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
				let { lastestID, keyword, filter, select, limit, populates } = ctx.params;
                let resultAfterCallHandler = await AUTH__USER_MODEL.getListFriend({
                    userID, lastestID, keyword, filter, limit, select, populates
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
     * Func: Lấy danh user mà gửi lời mời kết bạn cho mình
     * Author: Depv
     * Date: 12/10/2021
     */
    getListUserReceiveFromFriends: {
        auth: "required",
        params: {
            lastestID : { type: "string", optional: true },
			keyword   : { type: "string", optional: true },
			select    : { type: "string", optional: true },
			limit     : { type: "string", optional: true },
			populates : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
				let { lastestID, keyword, select, limit, populates } = ctx.params;
                let resultAfterCallHandler = await AUTH__USER_MODEL.getListUserReceiveFromFriends({
                    userID, lastestID, keyword, limit, select, populates
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
     * Func: Lấy danh user mà mình gửi lời mời kết bạn
     * Author: Depv
     * Date: 12/10/2021
     */
    getListUserSendToFriends: {
        auth: "required",
        params: {
            lastestID : { type: "string", optional: true },
			keyword   : { type: "string", optional: true },
			select    : { type: "string", optional: true },
			limit     : { type: "string", optional: true },
			populates : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
				let { lastestID, keyword, filter, select, limit, populates } = ctx.params;
                let resultAfterCallHandler = await AUTH__USER_MODEL.getListUserSendToFriends({
                    userID, lastestID, keyword, filter, limit, select, populates
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
    /**
     * Func: Lấy danh sách user
     * Author: MinhVH
     * Date: 12/11/2021
     */
    getListUser: {
        auth: "required",
        params: {
            lastestID       : { type: "string", optional: true },
			keyword         : { type: "string", optional: true },
			limit 	        : { type: "string", optional: true },
			departmentID 	: { type: "string", optional: true },
			filter 	        : { type: "string", optional: true },
			select 	        : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
				let { lastestID, limit, keyword, filter, select, departmentID } = ctx.params;

                let resultAfterCallHandler = await AUTH__USER_MODEL.getListUser({
                    userID, lastestID, limit, keyword, filter, select, departmentID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    // send noti via cloudmessaging
    getListUserByIdForPushMobile: {
        auth: "required",
        params: {},
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				let { users } = ctx.params;

                let resultAfterCallHandler = await AUTH__USER_MODEL.getListUsersForPushMobile({
                    users
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
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
            oneSignalID         : { type: "string" },
            isRemove            : { type: "boolean", optional: true },
            env                 : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let infoUser = ctx.meta.infoUser;
                let { platform, deviceID, deviceName, registrationID, oneSignalID, isRemove, env } = ctx.params;

                let userID = infoUser._id;

                let infoUserAfterUpdate = await AUTH__USER_MODEL.updateDeviceLogin({
                    userID, platform, deviceID, deviceName, registrationID, oneSignalID, isRemove, env
                });
                return infoUserAfterUpdate;
            } catch (error) {
                return { error: true, message: error.message };
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
        params: {
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                let infoUser = ctx.meta.infoUser;
				let { populates, select } = ctx.params;

                let { _id: userID } = infoUser;
                let infoUserAfterFind = await AUTH__USER_MODEL.getInfoV2({ userID, select, populates });

                return infoUserAfterFind;
            } catch (error) {
                return { error: true, message: error.message };
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
                return { error: true, message: error.message };
            }
        }
    },

	getListUserWithCondition: {
        auth: "required",
		params: {
			select: { type: "string", optional: true },
			filter: { type: "string", optional: true },
		},
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                let { condition, select, filter } = ctx.params;

                let infoUserAfterFind = await AUTH__USER_MODEL.getListUserWithCondition({
                    condition, select, filter
                });

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
            console.log("🚀 ~ file: auth.user-handler.js ~ line 374 ~ handler ~ token", token)

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
        // cache: {
        //     keys: ["key"],
        //     ttl: 60 * 60 //1 hour
        // },
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
	 * Dev: MinhVH
	 * Func: Hàm tạo mới user
	 * Date: 03/03/2022
	 */
    insert: {
        auth: "required",
        params: {
            email           : { type: "string" },
            fullname        : { type: "string" },
            level           : { type: "number" },
            departmentID    : { type: "string" },
            positionID      : { type: "string" },
            companyID       : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { email, fullname, level, departmentID, positionID, companyID } = ctx.params;

                const resultAfterCallHandler = await AUTH__USER_MODEL.insert({
                    email, fullname, level, departmentID, positionID, companyID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Code: F0017
     * Author: Depv
     * Name: Cập nhật thông tin user
     */
    update: {
        auth: "required",
        params: {
            currentPass   : { type: "string", optional: true },
            newPass       : { type: "string", optional: true },
            email         : { type: "string", optional: true },
            fullname      : { type: "string", optional: true },
            phone         : { type: "string", optional: true },
            birthDay      : { type: "string", optional: true },
            gender        : { type: "string", optional: true },
            lang          : { type: "string", optional: true },
            image         : { type: "string", optional: true },
            signature     : { type: "string", optional: true },
            level         : { type: "number", optional: true },
            status        : { type: "number", optional: true },
            userID        : { type: "string", optional: true },
            companyID     : { type: "string", optional: true },
            positionID    : { type: "string", optional: true },
            departmentID  : { type: "string", optional: true },
            groupDefault  : { type: "string", optional: true },
            sendRequestToFriendID   : { type: "string", optional: true },
            acceptFriendRequestID   : { type: "string", optional: true },
            removeFriendRequestID   : { type: "string", optional: true },
            unFriendID              : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {
                    userID, currentPass, newPass, email, fullname, phone, birthDay, gender, lang, image, signature,
                    sendRequestToFriendID, acceptFriendRequestID, removeFriendRequestID, unFriendID, groupDefault,
                    companyID, departmentID, positionID, level, status
                } = ctx.params;
				let { _id: currentUserID, company } = ctx.meta.infoUser;

                if(!userID) {
                    userID = currentUserID;
                }

                let resultAfterCallHandler = await AUTH__USER_MODEL.update({
                    userID, currentPass, newPass, email, fullname, phone, birthDay, gender, lang, image, signature,
                    sendRequestToFriendID, acceptFriendRequestID, removeFriendRequestID, unFriendID, groupDefault,
                    companyID, departmentID, positionID, level, status, company, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Hàm xóa user
	 * Date: 03/03/2022
	 */
    delete: {
        auth: "required",
        params: {
            usersID: { type: "array" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { usersID } = ctx.params;

                const resultAfterCallHandler = await AUTH__USER_MODEL.delete({ usersID });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
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
            userID: { type: "string", optional: true },
        },
        async handler(ctx) {
			try {
				let userID = ctx.meta?.infoUser?._id;

                if(!ctx.meta?.infoUser) {
                    userID = ctx.params.userID;
                }

                let resultAfterCallHandler = await AUTH__USER_MODEL.getListPinConversation({
					userID
				});

				return resultAfterCallHandler;
            } catch (error) {
				return { error: true, message: error.message, status: 500 };
            }
        }
    },

    updatePinMedia: {
        params: {
            mediaID	: { type: "string" },
            isPin   : { type: "boolean" }
        },
        async handler(ctx) {
			try {
                await this.validateEntity(ctx.params);
				let { _id: userID } = ctx.meta.infoUser;
                let { mediaID, isPin } = ctx.params;

                let resultAfterCallHandler = await AUTH__USER_MODEL.updatePinMedia({
					mediaID, userID, isPin
				});

				return resultAfterCallHandler;
            } catch (error) {
				return { error: true, message: error.message, status: 500 };
            }
        }
    },

    getListPinMedia: {
        params: {},
        async handler(ctx) {
			try {
				let { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await AUTH__USER_MODEL.getListPinMedia({
					userID
				});

				return resultAfterCallHandler;
            } catch (error) {
				return { error: true, message: error.message, status: 500 };
            }
        }
    },

    /**
     * KHU VỰC ĐỆ VIẾT THEO CÁCH MỚI
     */

    /**
	 * Dev: Depv 
	 * Func: getList and getInfo user
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            userID      : { type: "string", optional: true },
            projectID   : { type: "string", optional: true },
            companyID   : { type: "string", optional: true },
            arrayID     : { type: "string",  optional: true },

            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {
                    userID, projectID, companyID, arrayID,
                    keyword, limit, lastestID, select, populates, isLoadAll
                } = ctx.params;
                let resultAfterCallHandler;

                if(userID){
                    resultAfterCallHandler = await AUTH__USER_MODEL.getInfoV2({
                        userID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await AUTH__USER_MODEL.getListV2({
                        arrayID, projectID, companyID, keyword, limit, lastestID, select, populates, ctx, isLoadAll
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log({ error })
                return { error: true, message: error.message };
            }
        }
    },

}