/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
const { OPTION_SELLERS, OPTION_COMMON_HABITS }  = require('../../item/helper/item.keys-constant')

/**
 * MODELS
 */
const CRM_HABIT_TRACK_MODEL                     = require('../model/crm.habit_track-model').MODEL;

module.exports = {

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert: {
        auth: "required",
        params: {
            habitID             : { type: "string" },
            date                : { type: "string" },
            status              : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, habitID, contactID, status, date, name, note, duration, resultType, percentage } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                // console.log(ctx.params)

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                let resultAfterCallHandler = await CRM_HABIT_TRACK_MODEL.insert({ userID, companyID, habitID, contactID, status, date, name, note, duration, resultType, percentage})

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx })
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Update
     * Author: HiepNH
     * Code: 25/3/2025
     */
    update: {
        auth: "required",
        params: {
            // trackID             : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, habitID, trackID, date, status, name, note, duration, resultType, percentage, imagesID } = ctx.params;

                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let companyID, resultAfterCallHandler
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                    commonHabitID = OPTION_COMMON_HABITS[Number(optionSeller) - 1].habit

                    resultAfterCallHandler = await CRM_HABIT_TRACK_MODEL.updateByDay({ companyID, userID, habitID, date, status, resultType, percentage })
                }else{
                    companyID = company?._id

                    resultAfterCallHandler = await CRM_HABIT_TRACK_MODEL.update({ userID, trackID, status, name, note, duration, resultType, imagesID })
                }

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
        auth: "required",
        params: {
            arraysRemove : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  arraysRemove } = ctx.params;
        				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await CRM_HABIT_TRACK_MODEL.remove({
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
        auth: "required",
        params: {
            trackID       : { type: "string", optional: true },

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
                let { optionSeller, option, trackID, habitID, contactID, status, date, startDate, endDate, keyword, limit, lastestID, select, populates } = ctx.params;

				const { _id: userID, company } = ctx.meta.infoUser;
                
                // console.log(ctx.params)

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }
                
                let resultAfterCallHandler;
                if(trackID){
                    resultAfterCallHandler = await CRM_HABIT_TRACK_MODEL.getInfo({
                        trackID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await CRM_HABIT_TRACK_MODEL.getList({
                        option, companyID, habitID, contactID, status, date, startDate, endDate, keyword, limit, lastestID, select, populates
                    })
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
            optionSeller        : { type: "string" },
            option              : { type: "string", optional: true  },
            year                : { type: "string", optional: true  },
            month               : { type: "string", optional: true  },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { optionSeller, option, habitID, contactID, startDate, endDate } = ctx.params;
                
                console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                // console.log({commonHabitID})
                // /**
                //  * Convert dữ liệu ngày tháng để theo chuẩn chung
                //  */
                // fromDate   = moment(fromDate).startOf('day').format();// <=== fix ISODate here
                // toDate     = moment(toDate).endOf('day').format();// <=== fix ISODate here

                let resultAfterCallHandler = await CRM_HABIT_TRACK_MODEL.getListByProperty({
                    option, companyID, contactID, habitID, startDate, endDate
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Code:  HiepNH
     * Name Download Template Excel
     * Date: 9/12/2022
     */
    importExcel: {
        auth: 'required',
        // params: {
        //     dataImport: { type: 'string' }
        // },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { optionSeller, dataImport, option } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;
                // console.log(dataImport)

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                const resultAfterCallHandler = await CRM_HABIT_TRACK_MODEL.importFromExcel({
                    companyID: company._id, userID, dataImport, option
                })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
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

                const resultAfterCallHandler = await CRM_HABIT_TRACK_MODEL.exportExcel({
                    companyID: company._id, option, year, month, email, userID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}
