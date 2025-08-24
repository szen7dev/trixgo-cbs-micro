/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
const { OPTION_SELLERS }                        = require('../../item/helper/item.keys-constant')

/**
 * MODELS
 */
const CRM__GROW_TRACK_MODEL            = require('../model/crm.grow_track-model').MODEL;

module.exports = {

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert: {
        auth: "required",
        params: {
            // phone               : { type: "string" },
            // name                : { type: "string", optional: true },
            // contactID           : { type: "string", optional: true },
            // birthday            : { type: "string", optional: true },
            // note                : { type: "string", optional: true },
            // gender              : { type: "string", optional: true },
            // height              : { type: "string", optional: true },
            // weight              : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                const { scopes } = ctx.meta;
                const actionName = ctx.action.name;
                console.log(`CALLED ACTION: ${actionName}`);

                if (scopes && !scopes.includes(actionName)) {
                    return { error: true, message: `You don't have permission to access this action` };
                }

                await this.validateEntity(ctx.params);
                let { optionSeller, phone, contactID, status, birthday, gender, height, weight, name, note, facebook, tiktok, filesID, parentName, email, fatherHeight, motherHeight, date, desiredHeight, routine } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                // console.log(ctx.params)

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                let resultAfterCallHandler = await CRM__GROW_TRACK_MODEL.insert({ userID, companyID, phone, contactID, status, birthday, gender, height, weight, name, note, facebook, tiktok, filesID, parentName, email, fatherHeight, motherHeight, date, desiredHeight, routine })

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
        auth: "required",
        params: {
            trackID             : { type: "string" },
        },
        async handler(ctx) {
            try {
                const { scopes } = ctx.meta;
                const actionName = ctx.action.name;
                console.log(`CALLED ACTION: ${actionName}`);

                if (scopes && !scopes.includes(actionName)) {
                    return { error: true, message: `You don't have permission to access this action` };
                }

                await this.validateEntity(ctx.params);
                let { trackID, phone, contactID, status, birthday, date, gender, height, weight, name, note, facebook, tiktok, thumbnailID, imagesID } = ctx.params;

                // console.log(ctx.params)

				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await CRM__GROW_TRACK_MODEL.update({ trackID, userID, phone, contactID, status, birthday, date, gender, height, weight, name, note, facebook, tiktok, thumbnailID, imagesID });

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
                const { scopes } = ctx.meta;
                const actionName = ctx.action.name;
                console.log(`CALLED ACTION: ${actionName}`);

                if (scopes && !scopes.includes(actionName)) {
                    return { error: true, message: `You don't have permission to access this action` };
                }

                await this.validateEntity(ctx.params);
                let {  arraysRemove } = ctx.params;
        				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await CRM__GROW_TRACK_MODEL.remove({
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
            trackID         : { type: "string", optional: true },
            contactID       : { type: "string", optional: true },

            // Field mặc định
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                const { scopes } = ctx.meta;
                const actionName = ctx.action.name;
                console.log(`CALLED ACTION: ${actionName}`);

                if (scopes && !scopes.includes(actionName)) {
                    return { error: true, message: `You don't have permission to access this action` };
                }

                await this.validateEntity(ctx.params);
                let { optionSeller, trackID, contactID, phone, userCreateID, keyword, limit, lastestID, select, populates } = ctx.params;

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
                    resultAfterCallHandler = await CRM__GROW_TRACK_MODEL.getInfo({
                        trackID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await CRM__GROW_TRACK_MODEL.getList({
                        companyID, userID, contactID, phone, userCreateID, keyword, limit, lastestID, select, populates
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

                let resultAfterCallHandler = await CRM__GROW_TRACK_MODEL.getListByProperty({
                        option, year, companyID, projectID, userID, assigneeID, month, ctx
                    });

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
                const { optionSeller, dataImport } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;
                // console.log(dataImport)

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                const resultAfterCallHandler = await CRM__GROW_TRACK_MODEL.importFromExcel({
                    companyID, userID, dataImport
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
				const { _id: userID, company } = ctx.meta.infoUser;

                let { option} = ctx.params;
                // console.log(ctx.params)

                const resultAfterCallHandler = await CRM__GROW_TRACK_MODEL.exportExcel({
                    companyID: company._id, option, userID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}
