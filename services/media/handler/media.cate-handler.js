/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } = require('../../../tools/utils/status_code.js');

/**
 * MODELS
 */
const MEDIA_CATE_MODEL = require('../model/media.cate-model.js').MODEL;

module.exports = {
    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 9/4/2022
     */
    insert: {
        auth: "required",
        params: {
            menuID: { type: "string" },
            productID: { type: "string", optional: true },
            postID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { type, menuID, productID, postID } = ctx.params;

                console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await MEDIA_CATE_MODEL.insert({
                    companyID: company._id, userID, type, menuID, productID, postID
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
            cateID  : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { cateID } = ctx.params;
                console.log(ctx.params)

                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await MEDIA_CATE_MODEL.update({ userID, cateID });
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
            cateID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);

                const { cateID } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await MEDIA_CATE_MODEL.remove({
                    cateID, userID
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
            cateID         : { type: "string", optional: true },

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
                let { type, cateID, menuID, keyword, limit, lastestID, populates, select, sortKey } = ctx.params;

                console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if (cateID) {
                    resultAfterCallHandler = await MEDIA_CATE_MODEL.getInfo({
                        cateID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await MEDIA_CATE_MODEL.getList({ type, companyID: company._id, menuID, keyword, limit, lastestID, select, populates, sortKey });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}