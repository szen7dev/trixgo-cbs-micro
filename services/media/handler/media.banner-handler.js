/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code.js')
const { OPTION_SELLERS }                        = require('../../item/helper/item.keys-constant')

/**
 * MODELS
 */
const MEDIA_BANNER_MODEL = require('../model/media.banner-model.js').MODEL;

module.exports = {
    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 9/4/2022
     */
    insert: {
        auth: "required",
        params: {
            name: { type: "string" },
            slug: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, type, name, slug, thumbnailID } = ctx.params;

                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }                

                let resultAfterCallHandler = await MEDIA_BANNER_MODEL.insert({
                    companyID, userID, type, name, slug, thumbnailID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx })
            } catch (error) {
                return { error: true, message: error.message };
            }
        }

    },

    /**
     * Name: Update
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    update: {
        auth: "required",
        params: {
            bannerID  : { type: "string" },
            name: { type: "string" },
            link: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { bannerID, type, name, slug, thumbnailID, status } = ctx.params;
                // console.log(ctx.params)

                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await MEDIA_BANNER_MODEL.update({ userID, bannerID, type, name, slug, thumbnailID, status });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Remove
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    remove: {
        auth: "required",
        params: {
            bannerID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);

                const { bannerID } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await MEDIA_BANNER_MODEL.remove({
                    bannerID, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Get info and Get list
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getInfoAndGetList: {
        auth: "required",
        params: {
            bannerID          : { type: "string", optional: true },

            // Field mặc định
            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, type, bannerID, keyword, limit, lastestID, populates, select, sortKey } = ctx.params;

                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                let resultAfterCallHandler;
                if (bannerID) {
                    resultAfterCallHandler = await MEDIA_BANNER_MODEL.getInfo({
                        bannerID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await MEDIA_BANNER_MODEL.getList({ type, companyID, keyword, limit, lastestID, select, populates, sortKey });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}