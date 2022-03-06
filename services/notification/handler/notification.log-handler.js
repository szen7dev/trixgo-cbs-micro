/**
 * CONSTATNS
 */

/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }          = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
const NOTIFICATION_LOG_MODEL                    = require('../model/notification.log-model').MODEL;
 
 
module.exports = {
 
     /**
      * ============================ ***************** ===============================
      * ============================    NOTIFICATION   ===============================
      * ============================ ***************** ===============================
      */
 
     /**
      * Dev: MinhVH 🐸
      * Func: Thêm thông báo
      * Date: 16/12/2021
      */
    insertNotification: {
        params: {
            content     : { type: "string" },
            receivers   : { type: "array" },
            type        : { type: "number" },
            languageKey : { type: "string" },
            path        : { type: "string", optional: true },
            project     : { type: "string", optional: true },
            contract    : { type: "string", optional: true },
            app         : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: sender } = ctx.meta.infoUser;
                const { type, content, path, receivers, languageKey, project, contract, app, mainColl, subColl } = ctx.params;

                const resultAfterCallHandler = await NOTIFICATION_LOG_MODEL.insert({
                    type, content, path, sender, receivers, languageKey, project, contract, app, mainColl, subColl
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
      * Dev: MinhVH 🐸
      * Func: Cập nhật trạng thái gửi thông báo
      * Date: 16/12/2021
      */
    update: {
        params: {
            notificationID  : { type: "string" },
            status          : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { notificationID, status } = ctx.params;

                const resultAfterCallHandler = await NOTIFICATION_LOG_MODEL.update({
                    notificationID, status
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
      * Dev: MinhVH 🐸
      * Func: Lấy danh sách thông báo
      * Date: 16/12/2021
      */
    getInfoAndGetList: {
        params: {
            lastestID 		: { type: "string", optional: true },
			keyword 		: { type: "string", optional: true },
			limit 			: { type: "string", optional: true },
			select 			: { type: "string", optional: true },
			populates 	    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: authorID } = ctx.meta.infoUser;
                const { lastestID, keyword, limit, populates, select } = ctx.params;

                const resultAfterCallHandler = await NOTIFICATION_LOG_MODEL.getList({
                    authorID, lastestID, keyword, limit: +limit, select, populates
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    }

}