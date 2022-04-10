/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
 const BUDGET__WORK_MODEL                 = require('../model/budget.work-model').MODEL;
 
 module.exports = {
    /**
     * Dev: Hiepnh ✅
     * Func: Thêm
     * Date: 9/4/2022
     */
    insert: {
        auth: "required",
        params: {
        groupID                 : { type: "string" },
        plus                    : { type: "number", optional: true },
        reasonID                : { type: "string", optional: true },
        name                    : { type: "string" },
        sign                    : { type: "string", optional: true },
        unit                    : { type: "string", optional: true },
        description             : { type: "string", optional: true },
        note                    : { type: "string", optional: true },
        quantity                : { type: "number", optional: true },
        unitPrice               : { type: "number", optional: true },
        vatUnitPrice            : { type: "number", optional: true },
        amount                  : { type: "number", optional: true },
        vatAmount               : { type: "number", optional: true },
        forecastQuantity        : { type: "number", optional: true },
        forecastUnitPrice       : { type: "number", optional: true },
        forecastVatUnitPrice    : { type: "number", optional: true },
        forecastAmount          : { type: "number", optional: true },
        forecastVatAmount       : { type: "number", optional: true },
    },
    async handler(ctx) {
        try {
            await this.validateEntity(ctx.params);
            let { groupID, plus, reasonID, name, sign, unit, description, note, quantity, unitPrice, vatUnitPrice, amount, vatAmount, forecastQuantity, forecastUnitPrice, forecastVatUnitPrice, forecastAmount, forecastVatAmount } = ctx.params;

            const { _id: userID } = ctx.meta.infoUser;

            let resultAfterCallHandler = await BUDGET__WORK_MODEL.insert({
            ctx, userID, groupID, plus, reasonID, name, sign, unit, description, note, quantity, unitPrice, vatUnitPrice, amount, vatAmount, forecastQuantity, forecastUnitPrice, forecastVatUnitPrice, forecastAmount, forecastVatAmount
            });

            return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
        } catch (error) {
            return { error:  true, message: error.message };
        }
    }
    },
 
     /**
      * Dev: Hiepnh ✅
      * Func: Sửa
      * Date: 9/4/2022
      */
     update: {
         auth: "required",
         params: {
             contractIpcID       : { type: "string" },
             type                : { type: "number", optional: true },
             name                : { type: "string", optional: true },
             sign                : { type: "string", optional: true },
             description         : { type: "string", optional: true },
             date                : { type: "string", optional: true  },
             note                : { type: "string", optional: true },
             acceptance          : { type: "number", optional: true },
             vatAcceptance       : { type: "number", optional: true },
             plusAcceptance      : { type: "number", optional: true },
             vatPlusAcceptance   : { type: "number", optional: true },
             retainedValue       : { type: "number", optional: true },
             advancePaymentDeduction: { type: "number", optional: true },
             otherDeduction         : { type: "number", optional: true },
             timeForPayment         : { type: "string", optional: true },
             amountPaid             : { type: "number", optional: true },
             remainingPayment       : { type: "number", optional: true },
         },
         async handler(ctx) {  
             try {
                 await this.validateEntity(ctx.params);
                 let { contractIpcID, type, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment } = ctx.params;
                
                 const { _id: userID } = ctx.meta.infoUser;
                 let resultAfterCallHandler = await BUDGET__WORK_MODEL.update({
                     contractIpcID, type, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment, userID, ctx
                 });
                 
                 return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
             } catch (error) {
                 return { error:  true, message: error.message };
             }
         }
     },
 
     /**
      * Dev: Hiepnh ✅
      * Func: Xóa
      * Date: 9/4/2022
      */
     remove: {
         auth: "required",
         params: {
             contractIpcID       : { type: "string" },
         },
         async handler(ctx) {
             try {
                 await this.validateEntity(ctx.params);
                 let { contractIpcID } = ctx.params;
                 const { _id: userID } = ctx.meta.infoUser;
                 let resultAfterCallHandler = await BUDGET__WORK_MODEL.remove({
                     contractIpcID
                 });
                 
                 return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
             } catch (error) {
                 return { error:  true, message: error.message };
             }
         }
     },
 
     /**
      * Dev: Hiepnh ✅
      * Func: get info and get list
      * Date: 9/4/2022
      */
     getInfoAndGetList: {
         auth: "required",
         params: {
             contractIpcID : { type: "string", optional: true },
             type          : { type: "number", optional: true },
             contractID    : { type: "string", optional: true },
 
             // Field mặc định
             keyword     : { type: "string", optional: true },
             limit       : { type: "string", optional: true },
             lastestID   : { type: "string", optional: true },
             select      : { type: "string", optional: true },
             populates   : { type: "string", optional: true },
         },
         async handler(ctx) {
             try {
                 await this.validateEntity(ctx.params);
                 let { contractIpcID, type, contractID, keyword, limit, lastestID, populates, select } = ctx.params;
                 const { _id: userID } = ctx.meta.infoUser;
 
                 let resultAfterCallHandler;
                 if(contractIpcID){
                     resultAfterCallHandler = await BUDGET__WORK_MODEL.getInfo({
                         contractIpcID, userID, select, populates
                     });
                 }else{
                     resultAfterCallHandler = await BUDGET__WORK_MODEL.getList({
                         type, contractID, userID, keyword, limit, lastestID, select, populates
                     });
                 }
                 
                 return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
             } catch (error) {
                 return { error:  true, message: error.message };
             }
         }
     },
 }