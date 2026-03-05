/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code')
const { OPTION_SELLERS }                        = require('../../item/helper/item.keys-constant')
const moment = require('moment');

/**
 * MODELS
 */
const CRM_FAMILY_GROUP_MODEL            = require('../model/crm.family_group-model').MODEL

module.exports = {

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert: {
        params: {
            name                : { type: "string" },
            // contactID           : { type: "string" },
            note                : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, name } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                // console.log(ctx.params)

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                let resultAfterCallHandler = await CRM_FAMILY_GROUP_MODEL.insert({ userID, companyID, name, })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx })
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Update
     * Author: HiepNH
     * Code: 22/11/2023
     */
    update: {
        params: {
            groupID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { groupID, name, memberAddID, memberRemoveID } = ctx.params;

                // console.log(ctx.params)

				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await CRM_FAMILY_GROUP_MODEL.update({ userID, groupID, name, memberAddID, memberRemoveID });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Remove
     * Author: HiepNH
     * Code: 22/3/2024
     */
    remove: {
        params: {
            arraysRemove : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  arraysRemove } = ctx.params;
        				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await CRM_FAMILY_GROUP_MODEL.remove({
                    arraysRemove, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Get list
     * Author: HiepNH
     * Code: 22/11/2023
     */
    getInfoAndGetList: {
        params: {
            groupID         : { type: "string", optional: true },

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
                let { optionSeller, groupID, keyword, limit, lastestID, select, populates } = ctx.params;

				const { _id: userID, company } = ctx.meta.infoUser;
                
                // console.log(ctx.params)

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }
                
                let resultAfterCallHandler;
                if(groupID){
                    resultAfterCallHandler = await CRM_FAMILY_GROUP_MODEL.getInfo({
                        groupID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await CRM_FAMILY_GROUP_MODEL.getList({
                            companyID, userID, keyword, limit, lastestID, select, populates,
                        })
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}