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
            receiver    : { type: "string" },
            type        : { type: "number" },
        },
        async handler(ctx) {
             try {
                await this.validateEntity(ctx.params);
                const { _id: authorID } = ctx.meta.infoUser;
                const { type, title, content, receiver } = ctx.params;

                const resultAfterCallHandler = await NOTIFICATION_LOG_MODEL.insertNotification({
                    type, title, content, sender: authorID, receiver
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
    updateStatus: {
        params: {
            notificationID  : { type: "string" },
            status          : { type: "number" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { notificationID, status } = ctx.params;

                const resultAfterCallHandler = await NOTIFICATION_LOG_MODEL.updateStatus({
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
    getListNotification: {
        params: {
            lastestID 		: { type: "string", optional: true },
			keyword 		: { type: "string", optional: true },
			limit 			: { type: "string", optional: true }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: authorID } = ctx.meta.infoUser;
                const { lastestID, keyword, limit, filter, select } = ctx.params;

                const resultAfterCallHandler = await NOTIFICATION_LOG_MODEL.getListNotification({
                    authorID, lastestID, keyword, limit, filter, select
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    }

}