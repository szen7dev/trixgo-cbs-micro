/**
 * CONSTANTS
 */
const { CF_DATA_DEMO_CHATTING }                       = require('../helper/chatting.data-demo-constant');

/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }                 = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CHATTING__CONVERSATION_MODEL                    = require('../model/chatting.conversation-model').MODEL;
// const CHATTING__CONVERSATION_DRAFT_MODEL              = require('../model/chatting.coversation_draft-model').MODEL;
const CHATTING__CONVERSATION_LINK_MODEL               = require('../model/chatring.conversation_link-model').MODEL;
const CHATTING__CONVERSATION_FILE_MODEL               = require('../model/chatting.conversation_file-model').MODEL;


module.exports = {

	/**
	 * ============================ ********************* ===============================
	 * ============================ 	CONVERSATION  	  ===============================
	 * ============================ ********************* ===============================
	 */

    /**
	 * Dev: MinhVH
	 * Func: Thêm cuộc hội thoại mới
	 * Date: 03/08/2021
	 */
    insertConversation: {
        params: {
            name        : { type: "string" },
            description : { type: "string", optional: true },
            isPrivate   : { type: "string" }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { name, description, membersID, isPrivate } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.insertConversation({
					name, description, authorID, membersID, isPrivate
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật cuộc hội thoại
	 * Date: 04/08/2021
	 */
	updateConversation: {
        params: {
            conversationID  : { type: "string" },
            name        	: { type: "string", optional: true },
            description 	: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, name, description, avatar } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.updateConversation({
					conversationID, userID, name, description, avatar, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Thêm thành viên cuộc hội thoại
	 * Date: 06/08/2021
	 */
	addMembersToConversation: {
        params: {
            conversationID: { type: "string" }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { conversationID, membersID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.addMembersToConversationByID({
					conversationID, authorID, membersID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Thêm thành viên cuộc hội thoại
	 * Date: 06/08/2021
	 */
	removeMemberInConversation: {
        params: {
            conversationID  : { type: "string" },
            memberID        : { type: "string" }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { conversationID, memberID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.removeMemberInConversation({
					conversationID, authorID, memberID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật admin cho cuộc hội thoại
	 * Date: 07/08/2021
	 */
	updateAdminConversation: {
        params: {
            conversationID  : { type: "string" },
            memberID        : { type: "string" },
            isSetAdmin      : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { conversationID, memberID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.updateAdminConversation({
					conversationID, authorID, memberID, isSetAdmin
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật cài đặt cho cuộc hội thoại (group chat)
	 * Date: 09/08/2021
	 */
	updateConfigConversation: {
        params: {
            conversationID  : { type: "string" },
            typeConfig      : { type: "string" },
            valueConfig     : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { conversationID, typeConfig, valueConfig } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.updateConfigConversation({
					conversationID, authorID, typeConfig, valueConfig
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật pin cuộc hội thoại
	 * Date: 09/08/2021
	 */
	updatePinConversation: {
        params: {
            conversationID  : { type: "string" },
            isPin        	: { type: "string" }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, isPin } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.updatePinConversation({
					conversationID, userID, isPin, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy thông tin một cuộc hội thoại theo ID
	 * Date: ...
	 * Updated: MinhVH - 04/08/2021
	 */
	 getInfoConversationByID: {
        params: {
            conversationID: { type: "string" }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				let { _id: userID }  	= ctx.meta.infoUser;
                let { conversationID } 	= ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getInfoConversationByID({ 
					conversationID, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Xem các nhóm chung với 1 thành viên
	 * Date: 11/08/2021
	 */
	getInfoGeneralGroupsByMember: {
        params: {
            memberID: { type: "string" }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				let { _id: userID } = ctx.meta.infoUser;
                let { memberID } 	= ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getInfoGeneralGroupsByMember({ 
					userID, memberID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách member cuộc hội thoại
	 * Date: ...
	 * Updated: 10/08/2021 - MinhVH
	 */
	getListMembersConversationByID: {
        params: {
            conversationID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID }  	= ctx.meta.infoUser;
                let { conversationID } 	= ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListMembersConversationByID({ 
					conversationID, userID
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Lấy danh sách tin nhắn cuộc hội thoại ( phân trang)
	 * Date: 11/08/2021
	 */
	getListMessagesConversationWithPage: {
        params: {
            conversationID	: { type: "string" },
			latestMessageID : { type: "string", optional: true },
            key				: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID }  		= ctx.meta.infoUser;
                let { conversationID, latestMessageID, key } = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListMessagesConversationWithPage({ 
					conversationID, latestMessageID, userID, key
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Lấy danh sách tin nhắn media cuộc hội thoại
	 * Date: 12/08/2021
	 */
	getListMessagesMediaConversation: {
        params: {
            conversationID	: { type: "string" },
            typeMessage		: { type: "string" },
            senderID		: { type: "string", optional: true },
            dateCreate		: { type: "string", optional: true },
            fromDate		: { type: "string", optional: true },
            toDate			: { type: "string", optional: true },
            isLoadAll		: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
                let { 
					conversationID, typeMessage, senderID, dateCreate, fromDate, toDate, isLoadAll 
				} = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListMessagesMediaConversation({ 
					conversationID, userID, typeMessage, senderID, dateCreate, fromDate, toDate, isLoadAll
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Lấy danh sách thành viên gửi tin nhắn media cuộc hội thoại
	 * Date: 13/08/2021
	 */
	getListMemberSendMessagesMediaConversation: {
        params: {
            conversationID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } 	= ctx.meta.infoUser;
                let { conversationID } 	= ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListMemberSendMessagesMediaConversation({ 
					conversationID, userID
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật trạng thái ẩn cuộc hội thoại của 1 user
	 * Date: 14/08/2021
	 */
	updateHideConversation: {
        params: {
            conversationID	: { type: "string" },
            isHide			: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
                let { conversationID, isHide } = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.updateHideConversation({ 
					conversationID, userID, isHide
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật on/off thông báo cuộc hội thoại của 1 user
	 * Date: 14/08/2021
	 */
	updateMuteConversation: {
        params: {
            conversationID	: { type: "string" },
            isMute			: { type: "string" },
            timeMute		: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
                let { conversationID, isMute, timeMute } = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.updateMuteConversation({ 
					conversationID, userID, isMute, timeMute, ctx
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Đánh dấu đã đọc cuộc hội thoại của 1 user
	 * Date: 14/08/2021
	 */
	markReadConversation: {
        params: {
            conversationID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
                let { conversationID } = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.markReadConversation({ 
					conversationID, userID
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Member rời khỏi cuộc hội thoại
	 * Date: 14/08/2021
	 */
	memberLeaveConversation: {
        params: {
            conversationID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
                let { conversationID } = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.memberLeaveConversation({ 
					conversationID, userID
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Giải tán cuộc hội thoại (xóa nhóm)
	 * Date: 14/08/2021
	 */
	deleteConversation: {
        params: {
            conversationID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
                let { conversationID } = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.deleteConversation({ 
					conversationID, userID
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Xoá lịch sử cuộc hội thoại
	 * Date: 15/08/2021
	 */
	deleteHistoryConversation: {
        params: {
            conversationID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
                let { conversationID } = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.deleteHistoryConversation({ 
					conversationID, userID
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },



	
	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách cuộc hội thoại (hoặc tìm theo key)
	 * Date: ...
	 * Updated: MinhVH - 03/08/2021
	 */
	 getListConversationByKey: {
        params: {
            userID	: { type: "string" },
            key		: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { userID, key } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListConversationByKey({
					userID, key
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách cuộc hội thoại của một người dùng
	 * Date: ...
	 * Updated: MinhVH - 03/08/2021
	 */
    getListConversationByUserID: {
        params: {
            userID					: { type: "string" },
			lastestConversationID 	: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                let { userID, lastestConversationID } = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListConversationByUserID({ 
					authorID: userID, lastestConversationID 
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách cuộc hội thoại chưa đọc
	 * Date: ...
	 * Updated: MinhVH - 03/08/2021
	 */
	 getListConversationMissMessageByUserID: {
        params: {
            userID       			: { type: "string" },
            lastestConversationID 	: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                let { userID, lastestConversationID } = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListConversationMissMessage({ 
					userID, lastestConversationID
				})

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy bản nháp đang soạn của user trong một cuộc hội thoại
	 * Date: ...
	 */
    // getConversationDraftByUserID: {
    //     params: {
    //         conversationID: { type: "string" },
    //     },
    //     async handler(ctx) {
    //         try {
    //             let { conversationID } = ctx.params;
    //             // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)
    //             // await this.validateEntity(name);

    //             let resultAfterCallHandler = await CHATTING__CONVERSATION_DRAFT_MODEL.getInfoByUserID({ 
	// 				conversationID, 
	// 				userID: CF_DATA_DEMO_CHATTING.userID_1 
	// 			});
    //             return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
    //         } catch (error) {
    //             return renderStatusCodeAndResponse({ ctx, error_message: error.message });
    //         }
    //     }
    // },

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách link trong một cuộc hội thoại
	 * Date: ...
	 */
    getLinkConversationByID: {
        params: {
            conversationID      : { type: "string" },
            currentPage         : { type: "string" },
            nextInfo            : { type: "string" },
        },
        async handler(ctx) {
            try {
                let { conversationID, currentPage, nextInfo } = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)
                // await this.validateEntity(name);
                let resultAfterCallHandler = await CHATTING__CONVERSATION_LINK_MODEL.getListWithPage({ 
					conversationID, 
					userID: CF_DATA_DEMO_CHATTING.userID_1, 
					currentPage, 
					nextInfo 
				})
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách file trong một cuộc hội thoại
	 * Date: ...
	 */
    getFileConversationByID: {
        params: {
            conversationID      : { type: "string" },
            currentPage         : { type: "string" },
            nextInfo            : { type: "string" },
        },
        async handler(ctx) {
            try {
                let { conversationID, currentPage, nextInfo } = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)
                // await this.validateEntity(name);

                let resultAfterCallHandler = await CHATTING__CONVERSATION_FILE_MODEL.getListWithPage({ 
					conversationID, 
					userID: CF_DATA_DEMO_CHATTING.userID_1, 
					currentPage, 
					nextInfo 
				})
				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    //========================= END CONVERSATION  ==============================
}
