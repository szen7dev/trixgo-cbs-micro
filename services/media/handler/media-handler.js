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
     * Updated: 24/02/2022
	 */
    insertMedia: {
        auth: "required",
        params: {
            title           : { type: "string" },
            content         : { type: "string" },
            thumbnailID     : { type: "string", optional: true },
            tags            : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                const { categoryID, title, content, tags, summary, description, thumbnailID, status } = ctx.params;

                console.log(ctx.params)

                const resultAfterCallHandler = await MEDIA_MODEL.insert({ companyID: company._id, userID, categoryID, title, content, tags, summary, description, thumbnailID, status });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: CHỈNH SỬA BÀI VIẾT
     * Updated: 24/02/2022
	 */
	updateMedia: {
        auth: "required",
        params: {
            mediaID         : { type: "string" },
            title           : { type: "string" },
            content         : { type: "string" },
            thumbnailID     : { type: "string", optional: true },
            tags            : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const {
                    mediaID, categoryID, title, content, tags, summary, description, thumbnailID, status
                } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.update({
                    userID, mediaID, categoryID, title, content, tags, summary, description, thumbnailID, status
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
     * Updated: 24/02/2022
	 */
    deleteMedia: {
        auth: "required",
        params: {
            mediaID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				let { _id: authorID } = ctx.meta.infoUser;
                let { mediaID } = ctx.params;

                let resultAfterCallHandler = await MEDIA_MODEL.deleteMedia({
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
     * Updated: 24/02/2022
	 */
    getInfoMedia: {
        auth: "required",
        params: {
            mediaID     : { type: "string" },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID, company } = ctx.meta.infoUser;

                const { companyID, mediaID, slug, select, populates } = ctx.params;

                if(!companyID){
                    companyID = company._id
                }

                const resultAfterCallHandler = await MEDIA_MODEL.getInfo({
					companyID, mediaID, slug, select, populates
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
     * Updated: 24/02/2022
	 */
    getListMedia: {
        auth: "required",
        params: {
            categoryID      : { type: 'string', optional: true },
            lastestID       : { type: 'string', optional: true },
            limit           : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { company } = ctx.meta.infoUser;
                const {
                    categoryID, menuSlug, keyword, limit, lastestID, select, populates, sortKey
                } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.getList({
					companyID: company._id, categoryID, menuSlug,
                    keyword, limit, lastestID, select, populates, sortKey
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
     * Updated: 24/02/2022
	 */
	updateView: {
        auth: "required",
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
	 * Func: LẤY DANH SÁCH NGƯỜI XEM BÀI VIẾT
	 */
    getListUsersSeen: {
        auth: "required",
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

    /**
	 * Dev: MinhVH
	 * Func: LƯU BÀI VIẾT
     * Date: 24/02/2022
	 */
    saveMedia: {
        auth: "required",
        params: {
            mediaID : { type: "string" },
            isSave  : { type: "boolean" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { mediaID, isSave } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.saveMedia({
					authorID, mediaID, isSave
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: LẤY DANH SÁCH LƯU BÀI VIẾT
     * Date: 24/02/2022
	 */
    getListSaveMedia: {
        auth: "required",
        params: {
            limit       : { type: 'string', optional: true },
            lastestID   : { type: 'string', optional: true },
            select      : { type: 'string', optional: true },
            populates   : { type: 'string', optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { lastestID, limit, select, populates } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.getListSaveMedia({
					authorID, lastestID, limit, select, populates
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: LẤY DANH SÁCH BÀI VIẾT ĐÃ PIN
     * Date: 24/02/2022
	 */
    getListPinMedia: {
        auth: "required",
        params: {
            limit       : { type: 'string', optional: true },
            lastestID   : { type: 'string', optional: true },
            select      : { type: 'string', optional: true },
            populates   : { type: 'string', optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { limit, lastestID, select, populates } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.getListPinMedia({
					authorID, limit, lastestID, select, populates, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: PIN BÀI VIẾT
     * Date: 24/02/2022
	 */
    pinMedia: {
        auth: "required",
        params: {
            mediaID : { type: "string" },
            isPin   : { type: "boolean" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { mediaID, isPin } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.pinMedia({
					userID, mediaID, isPin, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}
