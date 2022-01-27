/**
 * CONSTATNS
 */
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../../auth/helper/auth.actions-constant');

/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const MEDIA_MODEL                               = require('../model/media-model').MODEL;
const COMMENT_MEDIA_MODEL                       = require('../model/media.comment-model').MODEL;


module.exports = {

	/**
	 * ============================ ********************* ===============================
	 * ============================     	MEDIA  	      ===============================
	 * ============================ ********************* ===============================
	 */

    /**
	 * Dev: NPNguyen 🐸
	 * Func: THÊM BÀI VIẾT MỚI
	 */
    insertMedia: {
        params: {
            title       : { type: "string" },
            content     : { type: "string" },
            type        : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { title, content, type, location, files, tagFriends, images, background, companyID, departmentID, kind } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.insert({
					authorID, title, content, type, location, files, tagFriends, images, background, companyID, departmentID, kind, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH BÀI VIẾT 	
	 */
    getListMedia: {
        params: {
            type: { type: 'string', optional: true },
            mediaID: { type: 'string', optional: true },
            isRelated: { type: 'string', optional: true },
            companyID: { type: 'string', optional: true },
            departmentID: { type: 'string', optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				let { _id: userID } = ctx.meta.infoUser;
                let { lastestID, companyID, departmentID, mediaID, isRelated, type } = ctx.params;

                let resultAfterCallHandler = await MEDIA_MODEL.getListMedia({ 
					userID, lastestID, companyID, departmentID, mediaID, isRelated, type, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: CHỈNH SỬA BÀI VIẾT
	 */
	updateMedia: {
        params: {
            title       : { type: "string" },
            mediaID     : { type: "string" },
            content     : { type: "string" },
            type        : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				let { _id: authorID } = ctx.meta.infoUser;
                let { mediaID, title, content, type, location, files, tagFriends, images, background, companyID } = ctx.params;
               
                let resultAfterCallHandler = await MEDIA_MODEL.update({ 
					mediaID, authorID, title, content, type, location, files, tagFriends, images, background, companyID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: XÓA BÀI VIẾT	
	 */
    deleteMedia: {
        params: {
            mediaID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				let { _id: authorID } = ctx.meta.infoUser;
                let { mediaID } = ctx.params;

                let resultAfterCallHandler = await MEDIA_MODEL.remove({ 
					mediaID, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: CHI TIẾT BÀI VIẾT	
	 */
    getInfoMedia: {
        params: {
            mediaID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                let { mediaID } = ctx.params;

                let resultAfterCallHandler = await MEDIA_MODEL.getInfo({ 
					mediaID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: LƯU BÀI VIẾT
	 */
    saveMedia: {
        params: {
            mediaID     : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: author } = ctx.meta.infoUser;
                const { mediaID } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.saveMedia({
					author, mediaID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

     /**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH BÀI VIẾT ĐÃ LƯU
	 */
    getListSaveMedia: {
        params: {
            lastestID 		: { type: "string", optional: true },
			limit			: { type: 'string', optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { lastestID, limit } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.getListSaveMedia({
					userID, lastestID, limit, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: XÓA BÀI VIẾT ĐÃ LƯU
	 */
    deleteSaveMedia: {
        params: {
            mediaID     : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: author } = ctx.meta.infoUser;
                const { mediaID } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.deleteSaveMedia({
					author, mediaID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH BÀI VIẾT ĐÃ GHIM
	 */
    getListPinMedia: {
        params: {},
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await MEDIA_MODEL.getListPinMedia({
					userID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: GHIM BÀI VIẾT
	 */
    pinMedia: {
        params: {
            mediaID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { mediaID } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.pinMedia({
					userID, mediaID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
    
    /**
	 * Dev: NPNguyen 🐸
	 * Func: HỦY GHIM BÀI VIẾT
	 */
    deletePinMedia: {
        params: {
            mediaID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { mediaID } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.deletePinMedia({
					userID, mediaID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: THẢ CẢM XÚC TRONG BÀI VIẾT
	 */
    reactionMedia: {
        params: {
            mediaID         : { type: "string" },
            typeReaction    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { mediaID, typeReaction } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.reactionMedia({
					authorID, mediaID, typeReaction, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH USER ĐÃ THẢ CẢM XÚC TRONG BÀI VIẾT
	 */
    getListReaction: {
        params: {
            mediaID     : { type: "string" },
            lastestID 	: { type: "string", optional: true },
            limit 	    : { type: "string", optional: true },
            select 	    : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { mediaID, lastestID, limit, select, populates } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.getListReaction({
					userID, mediaID, lastestID, limit, select, populates
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

     /**
	 * Dev: NPNguyen 🐸
	 * Func: THẢ CẢM XÚC TRONG ẢNH CỦA BÀI VIẾT
	 */
    reactionImageMedia: {
        params: {
            imageID         : { type: "string" },
            typeReaction    : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { imageID, typeReaction } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.reactionImageMedia({
					authorID, imageID, typeReaction, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH USER ĐÃ THẢ CẢM XÚC TRONG ẢNH CỦA BÀI VIẾT
	 */
    getListReactionImageMedia: {
        params: {
            imageID     : { type: "string" },
            lastestID 	: { type: "string", optional: true },
            limit 		: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { imageID, lastestID, limit } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.getListReactionImageMedia({
					userID, imageID, lastestID, limit
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

      /**
	 * Dev: NPNguyen 🐸
	 * Func: THẢ CẢM XÚC VÀO COMMENT TRONG BÀI VIẾT
	 */
    reactionComment: {
        params: {
            commentID       : { type: "string" },
            typeReaction    : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { commentID, typeReaction } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.reactionComment({
					authorID, commentID, typeReaction, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

     /**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH CÁC USER ĐÃ THẢ CẢM XÚC VÀO COMMENT
	 */
    getListReactionComment: {
        params: {
            commentID   : { type: "string" },
            lastestID 	: { type: "string", optional: true },
            limit 		: { type: "string", optional: true }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { commentID, lastestID, limit } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.getListReactionComment({
					userID, commentID, lastestID, limit
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: COMMENT ẢNH TRONG BÀI VIẾT
	 */
    commentImageMedia: {
        params: {
            imageID: { type: "string" },
            content: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { imageID, content, files } = ctx.params;
                const resultAfterCallHandler = await COMMENT_MEDIA_IMAGE_MODEL.commentImageMedia({
					authorID, imageID, content, files, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH COMMENT ẢNH TRONG BÀI VIẾT
	 */
    getListCommentImageMedia: {
        params: {
            imageID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { imageID, limit, lastestID } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_IMAGE_MODEL.getListCommentImageMedia({
					imageID, limit, lastestID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

     /**
	 * Dev: NPNguyen 🐸
	 * Func: CHỈNH SỬA COMMENT ẢNH TRONG BÀI VIẾT
	 */
    updateCommentImageMedia: {
        params: {
            commentID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { _id: authorID } = ctx.meta.infoUser;
                const { commentID, content, files } = ctx.params;
                const resultAfterCallHandler = await COMMENT_MEDIA_IMAGE_MODEL.updateCommentImageMedia({
					authorID, commentID, content, files, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY CHI TIẾT COMMENT TRONG BÀI VIẾT
	 */
    getDetailCommentImageMedia: {
        params: {
            commentID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { commentID, limit, lastestID } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_IMAGE_MODEL.getDetailCommentImageMedia({
					commentID, limit, lastestID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

     /**
	 * Dev: NPNguyen 🐸
	 * Func: XÓA COMMENT ẢNH TRONG BÀI VIẾT
	 */
    deleteCommentImageMedia: {
        params: {
            commentID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { _id: authorID } = ctx.meta.infoUser;
                const { commentID } = ctx.params;
                console.log('commentID: ', commentID);
                const resultAfterCallHandler = await COMMENT_MEDIA_IMAGE_MODEL.deleteCommentImageMedia({
					authorID, commentID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
    
    /**
	 * Dev: NPNguyen 🐸
	 * Func: TRẢ LỜI COMMENT ẢNH TRONG BÀI VIẾT
	 */
    replyCommentImageMedia: {
        params: {
            imageID     : { type: "string" },
            commentID   : { type: "string" },
            content     : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { commentID, imageID, content, files } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_IMAGE_MODEL.replyCommentImageMedia({
					authorID, commentID, imageID, content, files, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: THẢ CẢM XÚC VÀO TRONG COMMENT ẢNH CỦA BÀI VIẾT
	 */
    reactionCommentImage: {
        params: {
            commentID       : { type: "string" },
            typeReaction    : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { commentID, typeReaction } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.reactionComment({
					authorID, commentID, typeReaction, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH USER ĐÃ THẢ CẢM XÚC VÀO TRONG COMMENT ẢNH CỦA BÀI VIẾT
	 */
    getListReactionCommentImage: {
        params: {
            commentID   : { type: "string" },
            lastestID 	: { type: "string", optional: true },
            limit 		: { type: "string", optional: true }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { commentID, lastestID, limit } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.getListReactionComment({
					userID, commentID, lastestID, limit
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    //========================= END MEDIA ==============================
}
