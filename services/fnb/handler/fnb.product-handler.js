/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
 const FNB_PRODUCT_MODEL            = require('../model/fnb.product-model').MODEL;
 
 module.exports = {
    /**
     * Name: Insert 
     * Author: HiepNH
     * Code: 24/11/2022
     */
     insert: {
         auth: "required",
         params: {
            fundaID             : { type: "string", optional: true },
            parentID            : { type: "string", optional: true },
            name                : { type: "string" },
            sign                : { type: "string", optional: true },
            unit                : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            quantity            : { type: "number", optional: true },
            unitPrice           : { type: "number", optional: true },
            amount              : { type: "number", optional: true },
         },
         async handler(ctx) {
             try {
                await this.validateEntity(ctx.params);
                let {  fundaID, parentID, name, sign, unit, note, quantity, unitPrice, amount } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;
            
                let resultAfterCallHandler = await FNB_PRODUCT_MODEL.insert({
                    userID, companyID: company._id, fundaID, parentID, name, sign, unit, note, quantity, unitPrice, amount
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
             } catch (error) {
                 return { error:  true, message: error.message };
             }
         }
     },
 
     /**
      * Dev: Depv
      * Func: update Group
      */
     update: {
         auth: "required",
         params: {
            productID       : { type: "string" },
            parentID        : { type: "string", optional: true },
            name            : { type: "string" },
            sign            : { type: "string", optional: true },
            unit            : { type: "string", optional: true },
            note            : { type: "string", optional: true },
            quantity        : { type: "number", optional: true },
            unitPrice       : { type: "number", optional: true },
            amount          : { type: "number", optional: true },
         },
         async handler(ctx) {
             try {
                 await this.validateEntity(ctx.params);
                 let {  productID, parentID, name, sign, unit, note, quantity, unitPrice, amount } = ctx.params;
                 const { _id: userID } = ctx.meta.infoUser;
 
                 let resultAfterCallHandler = await FNB_PRODUCT_MODEL.update({
                     productID, userID, parentID, name, sign, unit, note, quantity, unitPrice, amount 
                 });
 
                 return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
             } catch (error) {
                 return { error:  true, message: error.message };
             }
         }
     },
 
     /**
      * Dev: Depv
      * Func: remove Group
      */
     remove: {
         auth: "required",
         params: {
            productID   : { type: "string" }
         },
         async handler(ctx) {
             try {
                 await this.validateEntity(ctx.params);
                 let {  productID } = ctx.params;
                 const { _id: userID } = ctx.meta.infoUser;
 
                 let resultAfterCallHandler = await FNB_PRODUCT_MODEL.remove({
                    productID
                 });
 
                 return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
             } catch (error) {
                 return { error:  true, message: error.message };
             }
         }
     },
 
     /**
      * Dev: Depv
      * Func: getList and getInfo pcm_plan_report
      */
     getInfoAndGetList: {
         auth: "required",
         params: {
            productID               : { type: "string", optional: true },

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
                 let {  productID, keyword, limit, lastestID, select, populates } = ctx.params;

                 const { _id: userID, company } = ctx.meta.infoUser;
 
                 let resultAfterCallHandler;
                 if(productID){
                     resultAfterCallHandler = await FNB_PRODUCT_MODEL.getInfo({
                        productID, select, populates,
                     });
                 }else{
                     resultAfterCallHandler = await FNB_PRODUCT_MODEL.getList({
                         companyID: company._id, keyword, limit, lastestID, select, populates, userID
                     });
                 }
 
                 return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
             } catch (error) {
                 return { error:  true, message: error.message };
             }
         }
     },
 }