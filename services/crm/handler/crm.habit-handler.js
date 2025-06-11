/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code')
const { OPTION_SELLERS }                        = require('../../item/helper/item.keys-constant')
const moment = require('moment');

/**
 * MODELS
 */
const CRM_HABIT_MODEL            = require('../model/crm.habit-model').MODEL

module.exports = {

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert: {
        params: {
            name                : { type: "string" },
            contactID           : { type: "string" },
            note                : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, parentID, contactID, habitCateID, type, status, duration, name, note, startTime, dayOfChallenge, finishDate, color, resultType } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                // console.log(ctx.params)

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                let resultAfterCallHandler = await CRM_HABIT_MODEL.insert({ userID, companyID, parentID, contactID, habitCateID, type, status, duration, name, note, startTime, dayOfChallenge, finishDate, color, resultType })

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
            habitID             : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { habitID, status, duration, name, note, startTime, dayOfChallenge, finishDate, color, resultType, imagesID } = ctx.params;

                // console.log(ctx.params)

				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await CRM_HABIT_MODEL.update({ userID, habitID, status, duration, name, note, startTime, dayOfChallenge, finishDate, color, resultType, imagesID });

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

                let resultAfterCallHandler = await CRM_HABIT_MODEL.remove({
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
            habitID         : { type: "string", optional: true },

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
                let { optionSeller, optionTrack, option, habitID, contactID, status, userCreateID, startDate, endDate, date, keyword, limit, lastestID, select, populates } = ctx.params;

				const { _id: userID, company } = ctx.meta.infoUser;
                
                // console.log(ctx.params)

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }
                
                let resultAfterCallHandler;
                if(habitID){
                    resultAfterCallHandler = await CRM_HABIT_MODEL.getInfo({
                        habitID, userID, select, populates
                    });
                } else {
                    if(!optionTrack){
                        resultAfterCallHandler = await CRM_HABIT_MODEL.getList({
                            companyID, option, contactID, status, userCreateID, keyword, limit, lastestID, select, populates
                        })
                    }else{
                        startDate   = moment(startDate).startOf('day').format();// <=== fix ISODate here
                        endDate     = moment(endDate).endOf('day').format();// <=== fix ISODate here

                        resultAfterCallHandler = await CRM_HABIT_MODEL.getListWithTrack({
                            companyID, contactID, userCreateID, startDate, endDate, limit, lastestID, select, populates
                        })
                    }
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Get
     * Author: HiepNH
     * Code: 22/11/2023
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
                let { option, year, companyID, projectID, assigneeID, month } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler = await CRM_HABIT_MODEL.getListByProperty({
                        option, year, companyID, projectID, userID, assigneeID, month, ctx
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
                console.log(ctx.params)

                const resultAfterCallHandler = await CRM_HABIT_MODEL.exportExcel({
                    companyID: company._id, option, year, month, email, userID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}
