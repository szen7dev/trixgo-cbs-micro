/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
const { OPTION_SELLERS }                        = require('../../item/helper/item.keys-constant')

/**
 * MODELS
 */
const CRM_SURVEY_RESULT_MODEL            = require('../model/crm.survey_result-model').MODEL;

module.exports = {

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert: {
        params: {
            phone               : { type: "string", optional: true },
            name                : { type: "string", optional: true },
            contactID           : { type: "string", optional: true },
            birthday            : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            gender              : { type: "string", optional: true },
            height              : { type: "string", optional: true },
            weight              : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, contactID, cxID, name, phone, address, status, result, note, filesID } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                // console.log(ctx.params)

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                let resultAfterCallHandler = await CRM_SURVEY_RESULT_MODEL.insert({ userID, companyID, contactID, cxID, name, phone, address, status, result, note, filesID })

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
            // resultID            : { type: "string" },
            // members             : { type: "array", optional: true },
            // admins              : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, arrUpdate, resultID, contactID, cxID, name, phone, address, status, result, note, filesID } = ctx.params;

                // console.log(ctx.params)

				const { _id: userID, company } = ctx.meta.infoUser;

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                if(!arrUpdate){
                    let resultAfterCallHandler = await CRM_SURVEY_RESULT_MODEL.update({ resultID, userID, contactID, cxID, name, phone, address, status, result, note, filesID })
                    return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx })
                }else{
                    let resultAfterCallHandler = await CRM_SURVEY_RESULT_MODEL.updateMany({ companyID, userID, arrUpdate })
                    return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx })
                }
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
        auth: "required",
        params: {
            arraysRemove : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  arraysRemove } = ctx.params;
        	    const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await CRM_SURVEY_RESULT_MODEL.remove({
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
            resultID        : { type: "string", optional: true },

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
                let { optionSeller, resultID, keyword, limit, lastestID, select, populates } = ctx.params;

				const { _id: userID, company } = ctx.meta.infoUser;
                // console.log(ctx.params)

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }
                let resultAfterCallHandler;
                if(resultID){
                    resultAfterCallHandler = await CRM_SURVEY_RESULT_MODEL.getInfo({
                        resultID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await CRM_SURVEY_RESULT_MODEL.getList({
                        companyID, keyword, limit, lastestID, select, populates
                    })
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
     * Code: 6/7/2025
     */
    getListByProperty: {
        auth: "required",
        params: {
            option              : { type: "string", optional: true  },
            companyID           : { type: "string", optional: true  },
            projectID           : { type: "string", optional: true  },
            year                : { type: "string", optional: true  },
            month               : { type: "string", optional: true  },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, option, year, startDate, endDate } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                let resultAfterCallHandler = await CRM_SURVEY_RESULT_MODEL.getListByProperty({
                    option, year, companyID, userID, startDate, endDate
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Download Template Excel
     * Author: HiepNH
     * Code: 25/11/2024
     */
    exportExcel: {
        auth: 'required',
        params: {
            // companyID: { type: "string", optional: true },
            // option: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, email, company } = ctx.meta.infoUser;

                let { option, year, month } = ctx.params;
                // console.log(ctx.params)

                const resultAfterCallHandler = await CRM_SURVEY_RESULT_MODEL.exportExcel({
                    companyID: company._id, option, year, month, email, userID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}
