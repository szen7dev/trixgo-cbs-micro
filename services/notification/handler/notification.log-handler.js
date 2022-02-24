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
            title       : { type: "string" },
            content     : { type: "string" },
            receivers   : { type: "array" },
            path        : { type: "string", optional: true },
            type        : { type: "number" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: authorID } = ctx.meta.infoUser;
                const { type, title, content, path, receivers } = ctx.params;

                const resultAfterCallHandler = await NOTIFICATION_LOG_MODEL.insert({
                    type, title, content, path, sender: authorID, receivers
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
                    authorID, lastestID, keyword, limit, select, populates
                });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    }

}