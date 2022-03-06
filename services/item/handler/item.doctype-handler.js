/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__DOCTYPE_MODEL                       = require('../model/item.doctype-model').MODEL;

module.exports = {

    /**
	 * Dev: MinhVH
	 * Func: Insert doctype
     * Date: 22/02/2022
	 */
    insert: {
        params: {
            name        : { type: "string" },
            description : { type: "string" },
            type        : { type: "number" },
            companyID   : { type: "string", optional: true },
            parent      : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                let { type, name, description, companyID, parent } = ctx.params;

                if(!companyID){
                    companyID = company._id;
                }

                const resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.insert({
                    type, name, description, companyID, parent, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Update doctype
     * Date: 22/02/2022
	 */
    update: {
        params: {
            doctypeID   : { type: "string" },
            name        : { type: "string", optional: true },
            description : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { doctypeID, name, description } = ctx.params;

                const resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.update({
                    doctypeID, name, description, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Remove doctype
     * Date: 22/02/2022
	 */
    remove: {
        params: {
            doctypeID: { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { doctypeID } = ctx.params;

                const resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.remove({
                    doctypeID, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Get list and get info doctype
	 */
    getInfoAndGetList: {
        params: {
            // Field bổ sung
            projectID       : { type: "string", optional: true },
            type            : { type: "string", optional: true },
            doctypeID       : { type: "string", optional: true },
            companyID       : { type: "string", optional: true },

            // Field mặc định
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { companyID, doctypeID, projectID, type, keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id;
                }
                
                let resultAfterCallHandler;
                if(doctypeID){
                    resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.getInfo({
                        doctypeID, select, populates
                    });
                } else{
                    resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.getList({
                        companyID, projectID, lastestID, userID, type, keyword, limit: +limit, select, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}