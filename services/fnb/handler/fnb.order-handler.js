/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const FNB_ORDER_MODEL            = require('../model/fnb.order-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv
	 * Func: insert Group
	 */
    insert: {
        auth: "required",
        params: {
            fundaID             : { type: "string" },
            parentID            : { type: "string", optional: true },
            mistakeID           : { type: "string", optional: true },
            customerID          : { type: "string", optional: true },
            shiftID             : { type: "string" },
            name                : { type: "string" },
            sign                : { type: "string" },
            appOrderSign        : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            salesChannel        : { type: "number" },
            paymentMethod       : { type: "number" },
            shiftType           : { type: "number", optional: true },
            amount              : { type: "number", optional: true },
            vatAmount           : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  fundaID, parentID, mistakeID, customerID, shiftID, name, sign, appOrderSign, note, shiftType, salesChannel, paymentMethod, amount, vatAmount } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_ORDER_MODEL.insert({
                    fundaID, parentID, mistakeID, customerID, shiftID, name, sign, appOrderSign, note, shiftType, salesChannel, paymentMethod, amount, vatAmount, userID
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
            groupID      : { type: "string" },
            contractID   : { type: "string", optional: true },
            parentID     : { type: "string", optional: true },
            name         : { type: "string", optional: true },
            sign         : { type: "string", optional: true },
            image        : { type: "string", optional: true },
            members      : { type: "array", optional: true },
            admins       : { type: "array", optional: true },
            membersRemove: { type: "array", optional: true },
            adminsRemove : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  groupID, name, sign, contractID, parentID, image, members, membersRemove, admins, adminsRemove } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_ORDER_MODEL.update({
                    groupID, name, sign, contractID, parentID, image, userID, members, membersRemove, admins, adminsRemove
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
            groupID   : { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  groupID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_ORDER_MODEL.remove({
                    groupID
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
            projectID               : { type: "string", optional: true },
            groupID                 : { type: "string", optional: true },
            parentID                : { type: "string", optional: true },
            isShowAll               : { type: "string", optional: true },
            isShowParentAndChild    : { type: "string", optional: true },

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
                let {  parentID, projectID, groupID, isShowAll, isShowParentAndChild, keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(groupID){
                    resultAfterCallHandler = await FNB_ORDER_MODEL.getInfo({
                        groupID, select, populates,
                    });
                }else{
                    resultAfterCallHandler = await FNB_ORDER_MODEL.getList({
                        parentID, keyword, isShowAll, isShowParentAndChild, limit, userID, lastestID, projectID, select, populates,
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
            // fromDate    : { type: "string", optional: true },
            // toDate      : { type: "string", optional: true },
            
            //_____________THÔNG SỐ MẶC ĐỊNH________________
            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                let { option, optionGroup, optionTime, fundasID, year,
                     keyword, limit, lastestID, select, populates, sortKey } = ctx.params;

                console.log('==========Danh sách theo phân loại================')

                let resultAfterCallHandler = await FNB_ORDER_MODEL.getListByProperty({
                    option, optionGroup, optionTime, fundasID, year,
                     keyword, limit, lastestID, select, populates, sortKey, 
                     userID
                    });
             
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}