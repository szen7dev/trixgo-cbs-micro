/**
 * CONSTATNS
 */

/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const MEDIA_MODEL                               = require('../model/media-model').MODEL;
const COMMENT_MEDIA_MODEL                       = require('../model/media.comment-model').MODEL;
const COMMENT_MEDIA_IMAGE_MODEL                = require('../model/media.comment_image-model').MODEL;


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
                const { title, content, type, location, files, tagFriends, images, background, companyID, kind } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.insert({
					authorID, title, content, type, location, files, tagFriends, images, background, companyID, kind, ctx
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
            limit: { type: 'string', optional: true },
            type: { type: 'string', optional: true },
            companyID: { type: 'string', optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				let { _id: userID } = ctx.meta.infoUser;
                let { lastestID, limit, companyID, type } = ctx.params;

                let resultAfterCallHandler = await MEDIA_MODEL.getListMedia({ 
					userID, lastestID, limit, companyID, type, ctx
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
                let { mediaID, title, content, type, location, files, filesDelete, tagFriends, images, imageDelete, background, companyID } = ctx.params;
               
                let resultAfterCallHandler = await MEDIA_MODEL.update({ 
					mediaID, authorID, title, content, type, location, files, filesDelete, tagFriends, images, imageDelete, background, companyID, ctx
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
                let { mediaID } = ctx.params;

                let resultAfterCallHandler = await MEDIA_MODEL.remove({ 
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
	 * Func: ĐÁNH DẤU NGƯỜI XEM BÀI VIẾT	
	 */
    watchedMedia: {
        params: {
            mediaID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { mediaID } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.watchedMedia({
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
	 * Func: LẤY DANH SÁCH CÁC USER ĐÃ XEM BÀI VIẾT
	 */
    getListWatchedMedia: {
        params: {
            mediaID             : { type: 'string', optional: true },
            lastestID			: { type: 'string', optional: true },
			limit			    : { type: 'string', optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { mediaID, lastestID, limit } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.getListWatchedMedia({
					mediaID, lastestID, limit, ctx
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
        params: {
            lastestID 		: { type: "string", optional: true },
			limit			: { type: 'string', optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { lastestID, limit } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.getListPinMedia({
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
	 * Func: GHIM BÀI VIẾT
	 */
    pinMedia: {
        params: {
            mediaID     : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: author } = ctx.meta.infoUser;
                const { mediaID } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.pinMedia({
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
	 * Func: HỦY GHIM BÀI VIẾT
	 */
    deletePinMedia: {
        params: {
            mediaID     : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: author } = ctx.meta.infoUser;
                const { mediaID } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.deletePinMedia({
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
	 * Func: LẤY CHI TIẾT ẢNH TRONG BÀI VIẾT
	 */
    getInfoImage: {
        params: {
            imageID     : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: author } = ctx.meta.infoUser;
                const { imageID } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.getInfoImageMedia({
					imageID, ctx
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
            typeReaction    : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { mediaID, typeReaction } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.reactionMedia({
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
    getListReactionMedia: {
        params: {
            mediaID     : { type: "string" },
            lastestID 	: { type: "string", optional: true },
            limit 		: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { mediaID, lastestID, limit } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.getListReactionMedia({
					userID, mediaID, lastestID, limit
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
	 * Func: COMMENT TRONG BÀI VIẾT
	 */
    commentMedia: {
        params: {
            mediaID: { type: "string" },
            content: { type: "string" },
            parentID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { mediaID, parentID, content, images, files } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.commentMedia({
					authorID, mediaID, parentID, content, images, files, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH COMMENT TRONG BÀI VIẾT
	 */
    getListCommentMedia: {
        params: {
            mediaID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { mediaID, limit, lastestID } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.getListCommentMedia({
					mediaID, limit, lastestID
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
    getDetailCommentMedia: {
        params: {
            commentID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { commentID, limit, lastestID } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.getDetailCommentMedia({
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
	 * Func: CHỈNH SỬA COMMENT TRONG BÀI VIẾT
	 */
    updateCommentMedia: {
        params: {
            commentID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { _id: authorID } = ctx.meta.infoUser;
                const { commentID, content, images, files } = ctx.params;
                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.updateCommentMedia({
					authorID, commentID, content, images, files, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: NPNguyen 🐸
	 * Func: TRẢ LỜI COMMENT TRONG BÀI VIẾT
	 */
    replyCommentMedia: {
        params: {
            mediaID     : { type: "string" },
            commentID   : { type: "string" },
            content     : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { commentID, mediaID, content, files } = ctx.params;

                const resultAfterCallHandler = await COMMENT_MEDIA_MODEL.replyCommentMedia({
					authorID, commentID, mediaID, content, files, ctx
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
