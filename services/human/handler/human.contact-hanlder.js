/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CONTACT_MODEL                   	        = require('../model/human.contact-model').MODEL;


module.exports = {

    /**
	 * Dev: MinhVH
	 * Func: Danh sách contact
	 * Date: ...
	 */
    getListContact: {
        params: {
            lastestID           : { type: "string", optional: true },
            limit               : { type: "number", optional: true },
            keyword             : { type: "string", optional: true },
            companyID           : { type: "string" },
            departmentID        : { type: "string", optional: true },
            positionID          : { type: "string", optional: true },
            contractTypeID      : { type: "string", optional: true },
            isExpireContract    : { type: "boolean", optional: true },
            isUpcomingBirthday  : { type: "boolean", optional: true },
            insuranceStatus     : { type: "number", optional: true },
            gender              : { type: "number", optional: true },
            filter              : { type: "string", optional: true },
            select              : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                const { 
                    lastestID, companyID, departmentID, positionID, contractTypeID, insuranceStatus, gender, keyword, 
                    isExpireContract, isUpcomingBirthday, limit, filter, select
                } = ctx.params;

                const resultAfterCallHandler = await CONTACT_MODEL.getListContact({
                    lastestID, userID, companyID, departmentID, positionID, contractTypeID, insuranceStatus, gender, keyword, 
                    isExpireContract, isUpcomingBirthday, limit, filter, select
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Chi tiết contact
	 * Date: 26/11/2021
	 */
    getInfoContact: {
        params: {
			contactID  : { type: "string" },
			select     : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { contactID, select } = ctx.params;

                const resultAfterCallHandler = await CONTACT_MODEL.getInfoContact({
                    userID, contactID, select
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
