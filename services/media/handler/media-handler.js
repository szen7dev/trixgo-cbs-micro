/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code')
const { OPTION_SELLERS }                        = require('../../item/helper/item.keys-constant')

/**
 * MODELS
 */
const MEDIA_MODEL                               = require('../model/media-model').MODEL;

module.exports = {
    /**
	 * Dev: MinhVH
	 * Func: THÊM BÀI VIẾT MỚI
     * Updated: 24/02/2022
	 */
    insert: {
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
                const { categoryID, title, content, tags, summary, description, thumbnailID, video, status } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.insert({ companyID: company._id, userID, categoryID, title, content, tags, summary, description, thumbnailID, video, status });

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
	update: {
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
                    mediaID, categoryID, title, content, tags, summary, description, thumbnailID, video, status
                } = ctx.params;

                const resultAfterCallHandler = await MEDIA_MODEL.update({
                    userID, mediaID, categoryID, title, content, tags, summary, description, thumbnailID, video, status
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
    delete: {
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
     * Name: getInfoAndGetList
     * Author: HiepNH
     * Code: 29/3/2025
     */
    getInfoAndGetList: {
        params: {
            mediaID         : { type: "string", optional: true },
            companyID       : { type: "string", optional: true },
            categoryID      : { type: "string", optional: true },

            // Field mặc định
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
            sortDirection   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, option, mediaID, type, categoryID, menuSlug, slug, keyword, limit, lastestID, select, populates, sortKey } = ctx.params;

                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                let resultAfterCallHandler;
                if(mediaID || slug){
                    resultAfterCallHandler = await MEDIA_MODEL.getInfo({
                        companyID, mediaID, slug, select, populates
                    });
                } else{
                    resultAfterCallHandler = await MEDIA_MODEL.getList({
                        option, companyID, type, categoryID, menuSlug, keyword, limit, lastestID, select, populates, sortKey
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: getListByProperty
     * Author: HiepNH
     * Code: 29/3/2025
     */
    getListByProperty: {
        auth: "required",
        params: {
            option              : { type: "string", optional: true  },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, option, menuSlug } = ctx.params;

                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                let resultAfterCallHandler = await MEDIA_MODEL.getListByProperty({
                        option, companyID, menuSlug
                    })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}