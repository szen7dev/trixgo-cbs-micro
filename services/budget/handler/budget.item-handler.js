/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
 const BUDGET__ITEM_MODEL                 = require('../model/budget.item-model').MODEL;
 
 module.exports = {
    /**
     * Dev: Hiepnh ✅
     * Func: Thêm
     * Date: 9/4/2022
     */
    insert: {
        auth: "required",
        params: {
        budgetID                : { type: "string" },
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
                let { budgetID, plus, reasonID, name, sign, unit, description, note, quantity, unitPrice, vatUnitPrice, amount, vatAmount, forecastQuantity, forecastUnitPrice, forecastVatUnitPrice, forecastAmount, forecastVatAmount } = ctx.params;

                const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await BUDGET__ITEM_MODEL.insert({
                ctx, userID, budgetID, plus, reasonID, name, sign, unit, description, note, quantity, unitPrice, vatUnitPrice, amount, vatAmount, forecastQuantity, forecastUnitPrice, forecastVatUnitPrice, forecastAmount, forecastVatAmount
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
            budgetID                : { type: "string" },
        //  type                    : { type: "number" },
        //  projectID               : { type: "string", optional: true },
        //  contractID              : { type: "string", optional: true },
            name                    : { type: "string" },
            sign                    : { type: "string", optional: true },
            description             : { type: "string", optional: true },
            date                    : { type: "string", optional: true },
            note                    : { type: "string", optional: true },
            revenue                 : { type: "number", optional: true },
            vatRevenue              : { type: "number", optional: true },
            forecastRevenue         : { type: "number", optional: true },
            forecastVatRevenue      : { type: "number", optional: true },
            finalRevenue            : { type: "number", optional: true },
            finalVatRevenue         : { type: "number", optional: true },
            budget                  : { type: "number", optional: true },
            vatBudget               : { type: "number", optional: true },
            forecastBudget          : { type: "number", optional: true },
            forecastVatBudget       : { type: "number", optional: true },
            finalBudget             : { type: "number", optional: true },
            finalVatBudget          : { type: "number", optional: true },
        },
        async handler(ctx) {  
            try {
                await this.validateEntity(ctx.params);
                let { budgetID, name, sign, description, date, note, revenue, vatRevenue, forecastRevenue, forecastVatRevenue, finalRevenue, finalVatRevenue, budget, vatBudget, forecastBudget, forecastVatBudget, finalBudget, finalVatBudget } = ctx.params;
            
                const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler = await BUDGET__ITEM_MODEL.update({
                budgetID, name, sign, description, date, note, revenue, vatRevenue, forecastRevenue, forecastVatRevenue, finalRevenue, finalVatRevenue, budget, vatBudget, forecastBudget, forecastVatBudget, finalBudget, finalVatBudget, ctx
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
        budgetID       : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { budgetID } = ctx.params;

                const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler = await BUDGET__ITEM_MODEL.remove({
                    budgetID
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
        budgetID : { type: "string", optional: true },
            type          : { type: "number", optional: true },

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
                let { budgetID, type, keyword, limit, lastestID, populates, select } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(budgetID){
                    resultAfterCallHandler = await BUDGET__ITEM_MODEL.getInfo({
                    budgetID, userID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await BUDGET__ITEM_MODEL.getList({
                        type, userID, keyword, limit, lastestID, select, populates
                    });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Dev: Hiepnh ✅
     * Func: Cập nhật giá trị (ngân sách, thực hiện, dự báo)
     * Date: 9/4/2022
     */
    updateValue: {
        auth: "required",
        params: {
            option : { type: "number" },
            itemID : { type: "string" },
        },
        async handler(ctx) {  
            try {
                await this.validateEntity(ctx.params);
                let { option, itemID } = ctx.params;
            
                const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await BUDGET__ITEM_MODEL.updateValue({
                    option, itemID, userID, ctx
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

}