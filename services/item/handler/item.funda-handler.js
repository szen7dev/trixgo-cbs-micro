/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code')
const { OPTION_SELLERS }                        = require('../../item/helper/item.keys-constant')

/**
 * MODELS
 */
const ITEM__FUNDA_MODEL                   = require('../model/item.funda-model').MODEL

module.exports = {

    /**
     * Dev: HiepNH ✅
     * Func: Thêm funda
     */
    insert:{
        auth: "required",
        params: {
            name                : { type: "string" },
            sign                : { type: "string", optional: true },
            description         : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID, company } = ctx.meta.infoUser;
                const { platform, name, sign, description, phone, bankAccount, address, initialDay, campaign, internal, area, parentID, materialExpenseRate,
                     materialExpense, planExpense, utilityExpense, humanExpense, otherExpense, activeCampaign, loyaltyPointsRate, trainStaffSalar, trialStaffSalary, officialStaffSalar, nightShiftStaffSalary, project, rating, numberOfRating } = ctx.params;

                const resultAfterCallHandler = await ITEM__FUNDA_MODEL.insert({ companyID: company._id, parentID, platform, name, sign, description, phone, bankAccount, address, initialDay, campaign, internal, area, materialExpenseRate, materialExpense, planExpense, utilityExpense, humanExpense, otherExpense, userID, activeCampaign, loyaltyPointsRate, trainStaffSalar, trialStaffSalary, officialStaffSalar, nightShiftStaffSalary, project, rating, numberOfRating });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        },
    },

        /**
     * Dev: HiepNH ✅
     * Func: Cập nhật funda
     */
    update:{
        auth: "required",
        params: {
            fundaID             : { type: "string" },
            name                : { type: "string", optional: true },
            sign                : { type: "string", optional: true },
            description         : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID, company } = ctx.meta.infoUser;
                const { fundaID, project, rating, numberOfRating, platform, name, sign, description, phone, bankAccount, bankQrcode, address, initialDay, members, admins, membersRemove, adminsRemove, getNotification, getNotificationRemove, campaign, internal, area, planExpense, utilityExpense, humanExpense, sellingExpenseRate, materialExpenseRate, otherExpenseRate, activeCampaign, loyaltyPointsRate, thumbnailID, imagesID, manager, trainStaffSalar, trialStaffSalary, officialStaffSalar, nightShiftStaffSalary, lunchStaffAllowance  } = ctx.params;

                    console.log(ctx.params)

                const resultAfterCallHandler = await ITEM__FUNDA_MODEL.update({ userID, fundaID, project, rating, numberOfRating, platform, name, sign, description, phone, bankAccount, bankQrcode, address, initialDay, members, admins, membersRemove, adminsRemove, getNotification, getNotificationRemove, campaign, internal, area, planExpense, utilityExpense, humanExpense, sellingExpenseRate, materialExpenseRate, otherExpenseRate, activeCampaign, loyaltyPointsRate, thumbnailID, imagesID, manager, trainStaffSalar, trialStaffSalary, officialStaffSalar, nightShiftStaffSalary, lunchStaffAllowance  });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        },
    },

   /**
	 * Dev: HiepNH
	 * Func: Danh sách funda
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            fundaID                     : { type: "string", optional: true },
            companyID                   : { type: "string", optional: true },
            parentID                    : { type: "string", optional: true },
            isListParentOfListChilds    : { type: "string", optional: true },
            isMember                    : { type: "string", optional: true },
            platform                    : { type: "string", optional: true },

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
                let { optionSeller, option, fundaID, keyword, limit, lastestID, select, populates, parentID, platform, isListParentOfListChilds, isMember } = ctx.params;
                console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                let resultAfterCallHandler;
                if(fundaID){
                    resultAfterCallHandler = await ITEM__FUNDA_MODEL.getInfo({
                        fundaID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__FUNDA_MODEL.getList({
                        option, companyID, lastestID, keyword, select, limit, populates, parentID, platform, isListParentOfListChilds, isMember, userID
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}