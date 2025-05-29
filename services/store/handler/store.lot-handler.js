/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 const { OPTION_SELLERS }              = require('../../item/helper/item.keys-constant')

 /**
  * MODELS
  */
 const STORE_LOT_MODEL            = require('../model/store.lot-model').MODEL;

 module.exports = {
    /**
     * Name: Insert
     * Author: HiepNH
     * Date: 21/3/2023
     */
     insert: {
         auth: "required",
         params: {
            name                : { type: "string" },
            sign                : { type: "string" },
            note                : { type: "string", optional: true },
         },
         async handler(ctx) {
             try {
                await this.validateEntity(ctx.params);
                let { optionSeller, date, expired, name, sign, note } = ctx.params;

                // console.log(ctx.params)
                const { _id: userID, company } = ctx.meta.infoUser;

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                let resultAfterCallHandler = await STORE_LOT_MODEL.insert({
                    userID, companyID, date, expired, name, sign, note
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
             } catch (error) {
                 return { error:  true, message: error.message };
             }
         }
     },

    /**
     * Name: Update
     * Author: HiepNH
     * Date: 21/3/2023
     */
     update: {
         auth: "required",
         params: {
            lotID           : { type: "string" },
            name                : { type: "string", optional: true  },
            sign                : { type: "string", optional: true  },
            note                : { type: "string", optional: true },
         },
         async handler(ctx) {
             try {
                await this.validateEntity(ctx.params);
                let { lotID, date, name, sign, note } = ctx.params;
                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await STORE_LOT_MODEL.update({
                    userID, lotID, date, expired, name, sign, note
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
             } catch (error) {
                 return { error:  true, message: error.message };
             }
         }
     },

    /**
     * Name: Remove
     * Author: HiepNH
     * Date: 21/3/2023
     */
     remove: {
         auth: "required",
         params: {
            lotID   : { type: "string" }
         },
         async handler(ctx) {
             try {
                await this.validateEntity(ctx.params);
                let {  lotID } = ctx.params;
                // console.log(ctx.params)

                let resultAfterCallHandler = await STORE_LOT_MODEL.remove({
                    lotID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
             } catch (error) {
                 return { error:  true, message: error.message };
             }
         }
     },

    /**
     * Name: Get
     * Author: HiepNH
     * Date: 21/3/2023
     */
     getInfoAndGetList: {
         auth: "required",
         params: {
            lotID       : { type: "string", optional: true },
            sign        : { type: "string", optional: true },
            customerID  : { type: "string", optional: true },
            template    : { type: "string", optional: true },
            type        : { type: "string", optional: true },
            status      : { type: "string", optional: true },

            //==============================================
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
         },
         async handler(ctx) {
             try {
                await this.validateEntity(ctx.params);
                let { optionSeller, lotID, keyword, limit, lastestID, select, populates } = ctx.params;

                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company._id
                }

                let resultAfterCallHandler
                if(lotID){
                    resultAfterCallHandler = await STORE_LOT_MODEL.getInfo({
                    lotID, select, populates,
                    })
                }else{
                    resultAfterCallHandler = await STORE_LOT_MODEL.getList({
                        companyID, keyword, limit, lastestID, select, populates
                    })
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx })
             } catch (error) {
                 return { error:  true, message: error.message };
             }
         }
     },

     /**
     * Name: Download Template Excel
     * Author: HiepNH
     * Date: 21/3/2023
     */
    downloadTemplateExcel: {
        auth: 'required',
        params: {
            option     : { type: "string", optional: true }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { option } = ctx.params;

				const { _id: userID, company } = ctx.meta.infoUser;

                const resultAfterCallHandler = await STORE_LOT_MODEL.downloadTemplateExcel({
                    option, companyID: company._id, userID 
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
     * Date: 21/3/2023
     */
    importFromExcel: {
        auth: 'required',
        params: {
            // taskID    : { type: 'string', optional: true },
            dataImport: { type: 'string' }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { dataImport } = ctx.params;
				const { _id: userID, company, email } = ctx.meta.infoUser;

                const resultAfterCallHandler = await STORE_LOT_MODEL.importFromExcel({
                    companyID: company._id, dataImport, userID, email
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
     * Date: 21/3/2023
     */
    exportExcel: {
        auth: 'required',
        params: {
            companyID: { type: "string", optional: true },
            option: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                let { companyID, filterParams } = ctx.params;
                // console.log({ companyID, option, filterParams })

                if(!companyID) {
                    companyID = company._id;
                }

                const resultAfterCallHandler = await STORE_LOT_MODEL.exportExcel({
                    userID, companyID, filterParams, ctx
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    }
 }