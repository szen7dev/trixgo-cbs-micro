/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const MEDIA_MODEL                               = require('../model/media-model').MODEL;


module.exports = {

	/**
	 * ============================ ********************* ===============================
	 * ============================     	MEDIA  	      ===============================
	 * ============================ ********************* ===============================
	 */

    /**
	 * Dev: MinhVH
	 * Func: THÊM BÀI VIẾT MỚI
	 */
    insertMedia: {
        params: {
            title           : { type: "string" },
            content         : { type: "string" },
            type            : { type: "string" },
            kind            : { type: "string", optional: true },
            background      : { type: "string", optional: true },
            files           : { type: "array", optional: true },
            images          : { type: "array", optional: true },
            tagFriends      : { type: "array", optional: true },
            companyID       : { type: "string", optional: true },
            departmentID    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { 
                    title, content, type, companyID, departmentID, location, 
                    tagFriends, files, images, background, kind
                } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.insert({
                    title, content, type, companyID, departmentID, location, 
                    tagFriends, files, images, background, kind, authorID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: CHỈNH SỬA BÀI VIẾT
	 */
	updateMedia: {
        params: {
            title           : { type: "string" },
            mediaID         : { type: "string" },
            content         : { type: "string" },
            type            : { type: "string" },
            background      : { type: "string", optional: true },
            files           : { type: "array", optional: true },
            images          : { type: "array", optional: true },
            tagFriends      : { type: "array", optional: true },
            companyID       : { type: "string", optional: true },
            departmentID    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				let { _id: authorID } = ctx.meta.infoUser;
                let { 
                    mediaID, title, content, type, companyID, departmentID, location, 
                    tagFriends, files, images, background
                } = ctx.params;
               
                let resultAfterCallHandler = await MEDIA_MODEL.update({ 
                    mediaID, title, content, type, companyID, departmentID, location, 
                    tagFriends, files, images, background, authorID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: CẬP NHẬT LƯỢT XEM BÀI VIẾT
	 */
	updateView: {
        params: {
            mediaID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                // let { ipAddr } = ctx.meta;
				let { _id: authorID } = ctx.meta.infoUser;
                let { mediaID } = ctx.params;

                let resultAfterCallHandler = await MEDIA_MODEL.updateView({ 
					mediaID, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
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
	 * Dev: MinhVH
	 * Func: CHI TIẾT BÀI VIẾT	
	 */
    getInfoMedia: {
        params: {
            mediaID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				let { _id: authorID } = ctx.meta.infoUser;
                let { mediaID } = ctx.params;

                let resultAfterCallHandler = await MEDIA_MODEL.getInfo({ 
					mediaID, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
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
	 * Dev: MinhVH
	 * Func: LẤY DANH SÁCH NGƯỜI XEM BÀI VIẾT 	
	 */
    getListUsersSeen: {
        params: {
            mediaID     : { type: 'string' },
            limit       : { type: 'string', optional: true },
            lastestID   : { type: 'string', optional: true },
            select      : { type: 'string', optional: true },
            populates   : { type: 'string', optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				let { _id: authorID } = ctx.meta.infoUser;
                let { mediaID, lastestID, limit, select, populates } = ctx.params;

                let resultAfterCallHandler = await MEDIA_MODEL.getListUsersSeen({ 
					authorID, mediaID, lastestID, limit, select, populates
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },



    // NPNguyen

    /**
	 * Dev: NPNguyen
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
	 * Dev: NPNguyen
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
	 * Dev: NPNguyen
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
	 * Dev: NPNguyen
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
	 * Dev: NPNguyen
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
	 * Dev: NPNguyen
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
}
