/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 const { OPTION_SELLERS }              = require('../../item/helper/item.keys-constant')

 /**
  * MODELS
  */
 const STORE_ITEM_MODEL            = require('../model/store.item-model').MODEL;

 module.exports = {
    /**
     * Name: Insert
     * Author: HiepNH
     * Date: 21/3/2023
     */
    insert: {
        auth: "required",
        params: {
            lotID               : { type: "string" },
            goodsID             : { type: "string" },
            sign                : { type: "string" },
            customerName        : { type: "string" },
            customerPhone       : { type: "string" },
            // area1               : { type: "string" },
            // area2               : { type: "string" },
            // area3               : { type: "string" },
        },
        async handler(ctx) {
            try {
            await this.validateEntity(ctx.params);
            let { optionSeller, lotID, goodsID, name, sign, note, status, customerName, customerPhone, amount, area3, channelType, reasonType } = ctx.params;

            // console.log(ctx.params)
            const { _id: userID, company } = ctx.meta.infoUser;

            let companyID
            if(optionSeller){
                companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
            }else{
                companyID = company?._id
            }

            let resultAfterCallHandler = await STORE_ITEM_MODEL.insert({
                    userID, companyID, lotID, goodsID, name, sign, note, status, customerName, customerPhone, amount, area3, channelType, reasonType
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
            itemID           : { type: "string" },
            name                : { type: "string", optional: true  },
            sign                : { type: "string", optional: true  },
            note                : { type: "string", optional: true },
         },
         async handler(ctx) {
             try {
                await this.validateEntity(ctx.params);
                let { itemID, name, sign, note, status, activationDate, customerName, customerPhone, amount, area1, area2, area3  } = ctx.params;
                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await STORE_ITEM_MODEL.update({
                    userID, itemID, name, sign, note, status, activationDate, customerName, customerPhone, amount, area1, area2, area3 
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
            itemID   : { type: "string" }
         },
         async handler(ctx) {
             try {
                await this.validateEntity(ctx.params);
                let {  itemID } = ctx.params;
                // console.log(ctx.params)

                let resultAfterCallHandler = await STORE_ITEM_MODEL.remove({
                    itemID
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
            itemID       : { type: "string", optional: true },
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
                let { optionSeller, itemID, sign, status, keyword, limit, lastestID, select, populates } = ctx.params;

                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company._id
                }

                let resultAfterCallHandler
                if(itemID || sign){
                    resultAfterCallHandler = await STORE_ITEM_MODEL.getInfo({
                        companyID, itemID, sign, select, populates,
                    })
                }else{
                    resultAfterCallHandler = await STORE_ITEM_MODEL.getList({
                        companyID, status, keyword, limit, lastestID, select, populates
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

                const resultAfterCallHandler = await STORE_ITEM_MODEL.downloadTemplateExcel({
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

                const resultAfterCallHandler = await STORE_ITEM_MODEL.importFromExcel({
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

                const resultAfterCallHandler = await STORE_ITEM_MODEL.exportExcel({
                    userID, companyID, filterParams, ctx
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    }
 }