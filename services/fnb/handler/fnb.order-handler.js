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
            projectID : { type: "string" },
            parentID  : { type: "string", optional: true },
            name      : { type: "string" },
            sign      : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  projectID, parentID, name, sign } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_ORDER_MODEL.insert({
                    projectID, parentID, name, sign, userID
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
}