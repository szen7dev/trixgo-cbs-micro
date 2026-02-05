/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
const { OPTION_SELLERS }                        = require('../../item/helper/item.keys-constant')

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
            type        : { type: "number" },
            name        : { type: "string" },
            description : { type: "string", optional: true },
            sign        : { type: "string", optional: true },
            level       : { type: "number", optional: true },
            companyID   : { type: "string", optional: true },
            parent      : { type: "string", optional: true },
            linkItemID  : { type: "string", optional: true },
            salesChannel: { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                let { type, subType, name, description, sign, unit, amount, alert, companyID, parent, linkItemID, level, salesChannel, grade } = ctx.params;

                if(!companyID){
                    companyID = company._id;
                }

                // console.log(ctx.params)

                const resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.insert({
                    type, subType, name, description, sign, unit, amount, alert, companyID, parent, linkItemID, level, userID, salesChannel, grade
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
            sign        : { type: "string", optional: true },
            salesChannel: { type: "number", optional: true },
            linkItemID  : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { doctypeID, parent, type, subType, name, description, sign, unit, amount, alert, salesChannel, grade, linkItemID } = ctx.params;

                // console.log(ctx.params)

                const resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.update({
                    doctypeID, parent, type, subType, name, description, sign, unit, amount, alert, userID, salesChannel, grade, linkItemID
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
            doctypesID: { type: "array" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { doctypesID } = ctx.params;

                const resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.remove({
                    doctypesID, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: HiepNH
	 * Func: Get list and get info doctype
	 */
    getInfoAndGetList: {
        params: {
            // Field bổ sung
            projectID       : { type: "string", optional: true },
            type            : { type: "string", optional: true },
            doctypeID       : { type: "string", optional: true },
            companyID       : { type: "string", optional: true },
            parentID        : { type: "string", optional: true },

            // Field mặc định
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
            isShowParentAndChild: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, companyID, doctypeID, projectID, parentID, type, subType, keyword, limit, lastestID, select, populates } = ctx.params;
        		
                 const { _id: userID, company } = ctx.meta.infoUser
                // console.log(ctx.params)

                // let companyID
                if(!companyID){
                    if(optionSeller){
                        companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                    }else{
                        companyID = company?._id
                    }
                }
                                
                let resultAfterCallHandler;
                if(doctypeID){
                    resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.getInfo({
                        doctypeID, select, populates
                    });
                } else{
                    resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.getList({
                        companyID, projectID, parentID, lastestID, userID, type, subType, keyword, limit, select, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Code:  HiepNH
     * Name Download Template Excel
     * Date: 9/12/2022
     */
    importFromExcel: {
        auth: 'required',
        params: {
            type    : { type: 'number' },
            dataImport: { type: 'string' }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { type, dataImport } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;
                // console.log(dataImport)

                const resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.importFromExcel({
                    companyID: company._id, dataImport, userID, type
                })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}
