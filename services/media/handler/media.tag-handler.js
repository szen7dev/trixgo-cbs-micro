/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } = require('../../../tools/utils/status_code.js');

/**
 * MODELS
 */
const MEDIA_TAG_MODEL = require('../model/media.tag-model.js').MODEL;

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
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { name, note, slug, expired } = ctx.params;

                console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await MEDIA_TAG_MODEL.insert({
                    companyID: company._id, userID, name, note, slug, expired
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
            tagID  : { type: "string" },
            name  : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { tagID, type, status, name, note, slug, expired, thumbnailID, imagesID } = ctx.params;
                console.log(ctx.params)

                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await MEDIA_TAG_MODEL.update({ userID, tagID, type, status, name, note, slug, expired, thumbnailID: imagesID[0], imagesID });
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
            tagID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);

                const { tagID } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await MEDIA_TAG_MODEL.remove({
                    tagID, userID
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
            tagID         : { type: "string", optional: true },

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
                let { tagID, keyword, limit, lastestID, populates, select, sortKey } = ctx.params;

                console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if (tagID) {
                    resultAfterCallHandler = await MEDIA_TAG_MODEL.getInfo({
                        tagID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await MEDIA_TAG_MODEL.getList({ companyID: company._id, keyword, limit, lastestID, select, populates, sortKey });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}