/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const FNB_GENERAL_BOOK_MODEL            = require('../model/fnb.general_book-model').MODEL;

module.exports = {
    /**
     * Name: Insert 
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert: {
        auth: "required",
        params: {
            fundaID             : { type: "string" },
            parentID            : { type: "string", optional: true },
            name                : { type: "string", optional: true },
            sign                : { type: "string", optional: true },
            campaignName        : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            outin               : { type: "number", optional: true },
            revenueType         : { type: "number", optional: true },
            expenseType         : { type: "number", optional: true },
            appExpenseType      : { type: "number", optional: true },
            date                : { type: "string", optional: true },
            customerID          : { type: "string", optional: true },
            goodsID             : { type: "string", optional: true },
            quantity            : { type: "number", optional: true },
            unitPrice           : { type: "number", optional: true },
            amount              : { type: "number", optional: true },
            vatAmount           : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { fundaID, parentID, outin, revenueType, expenseType, appExpenseType, date, name, note,
                     customerID, goodsID, quantity, unitPrice, amount, vatAmount, sign, campaignName } = ctx.params;

                const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_GENERAL_BOOK_MODEL.insert({
                    fundaID, parentID, outin, revenueType, expenseType, appExpenseType, date, name, note, customerID, goodsID, quantity, unitPrice, amount, vatAmount, userID, sign, campaignName 
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
            bookID              : { type: "string" },
            parentID            : { type: "string", optional: true },
            name                : { type: "string", optional: true },
            sign                : { type: "string", optional: true },
            campaignName        : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            outin               : { type: "number", optional: true },
            revenueType         : { type: "number", optional: true },
            expenseType         : { type: "number", optional: true },
            appExpenseType      : { type: "number", optional: true },
            date                : { type: "string", optional: true },
            customerID          : { type: "string", optional: true },
            goodsID             : { type: "string", optional: true },
            quantity            : { type: "number", optional: true },
            unitPrice           : { type: "number", optional: true },
            amount              : { type: "number", optional: true },
            vatAmount           : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { bookID, outin, revenueType, expenseType, appExpenseType, date, name, note, customerID, goodsID, quantity, unitPrice, amount, vatAmount, sign, campaignName } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_GENERAL_BOOK_MODEL.update({
                    userID,
                    bookID, outin, revenueType, expenseType, appExpenseType, date, name, note, customerID, goodsID, quantity, unitPrice, amount, vatAmount, sign, campaignName
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
            bookID   : { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  bookID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_GENERAL_BOOK_MODEL.remove({
                    bookID
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
            bookID              : { type: "string", optional: true },
            fundasID            : { type: "array", optional: true },
            fromDate            : { type: "string", optional: true },
            toDate              : { type: "string", optional: true },
            parentID            : { type: "string", optional: true },
            // mistakeID           : { type: "string", optional: true },
            // orderMistakeID      : { type: "string", optional: true },
            // salesChannel        : { type: "string", optional: true },

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
                let { bookID, fundasID, fromDate, toDate, keyword, limit, lastestID, select, populates, sortKey, parentID } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(bookID){
                    resultAfterCallHandler = await FNB_GENERAL_BOOK_MODEL.getInfo({
                        bookID, select, populates,
                    });
                }else{
                    resultAfterCallHandler = await FNB_GENERAL_BOOK_MODEL.getList({
                        companyID: company._id, fundasID, fromDate, toDate, keyword, limit, lastestID, select, populates, sortKey, userID, parentID
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Danh sách theo phân loại
     * Author: HiepNH
     * Code: 14/10/2022
     */
    getListByProperty: {
        params: {
            fundasID        : { type: "array", optional: true },
            option          : { type: "string", optional: true },
            optionGroup     : { type: "string", optional: true },
            optionTime      : { type: "string", optional: true },
            year            : { type: "string", optional: true },
            fromDate        : { type: "string", optional: true },
            toDate          : { type: "string", optional: true },
            
            //_____________THÔNG SỐ MẶC ĐỊNH________________
            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;

                let { undasID, option, optionGroup, optionTime, year, fromDate, toDate,
                     keyword, limit, lastestID, select, populates, sortKey } = ctx.params;

                let resultAfterCallHandler = await FNB_GENERAL_BOOK_MODEL.getListByProperty({
                    companyID: company._id, fundasID, option, optionGroup, optionTime, year, fromDate, toDate,
                     keyword, limit, lastestID, select, populates, sortKey, 
                     userID
                    });
             
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

     /**
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 8/12/2022
     */
     downloadTemplateExcel: {
        auth: 'required',
        params: {
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;

                // console.log('====================HERE===================')
                // console.log('====================HERE===================')
                // console.log('====================HERE===================')
                const resultAfterCallHandler = await FNB_GENERAL_BOOK_MODEL.downloadTemplateExcel({
                    companyID: company._id, userID 
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 9/12/2022
     */
    importFromExcel: {
        auth: 'required',
        params: {
            dataImport: { type: 'string' }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { dataImport } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                // console.log(dataImport)

                console.log('====================HERE===================')
                console.log('====================HERE===================')
                console.log('====================HERE===================')

                console.log(dataImport)

                const resultAfterCallHandler = await FNB_GENERAL_BOOK_MODEL.importFromExcel({
                    taskID, dataImport, userID, ctx
                })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 9/12/2022
     */
    exportExcel: {
        auth: 'required',
        params: {
            companyID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                let { companyID, filterParams } = ctx.params;

                if(!companyID) {
                    companyID = company._id;
                }

                const resultAfterCallHandler = await FNB_GENERAL_BOOK_MODEL.exportExcel({
                    userID, companyID, filterParams, ctx
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
    
}