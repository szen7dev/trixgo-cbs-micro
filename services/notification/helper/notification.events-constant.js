/**
 * MODELS
*/
const NOTIFICATION__LOG_MODEL            = require('../model/notification.log-model').MODEL;
const { NOTI_TYPE_MOBILE }               = require('./notification.keys-constant')
 /*-------------------------------------
 * file định nghĩa các constant EVENT của SERVICE (EXAMPLE) emit đi
 */
/**
 * @TARGET: (những service sẽ subscribe event của EXAMPLE service)
 *      - service notification (mail, cloud messaging)
 *      - service user
 */
 exports.EXAMPLE__CASE1_SUCCESS    = `EXAMPLE__CASE1_SUCCESS`;
 /**
  * @TARGET: (những service sẽ subscribe event của EXAMPLE service)
  *      - service notification (mail, cloud messaging)
  *      - service user
  *      - //TODO service reminder: nhắc sau bao lâu không thanh toán (chỉ là ví dụ)
  */
 exports.EXAMPLE__CASE1_FAIL       = `EXAMPLE__CASE1_FAIL`;
 
 // ----------------------------------------------------------------------------------------------- //
 
 /**
  * định nghĩa các EVENT mà SERVICE(EXAMPLE) sẽ subscribe (nhận job từ các service khác)
  */
 exports.LIST_EVENTS_SUBSCRIBE = {
     // VD: khi có user nào đó request tạo đơn hàng mới order.create (chỉ là ví dụ)
     /**
      * @target:
      *  - user_service: nhận event và cập nhật thông tin  (thông tin gói sử dụng)
      *  - mail_service: nhận event và gửi mail
      */
    //  loại noti: CLOUD MESSAGING
     "NOTIFICATION__LOG_CREATE:MOBILE": {
        async handler(ctx) {
             console.log(`------------------NOTIFICATION__LOG_CREATE:MOBILE----------------------`)
             console.log("Payload:", ctx.params);
             console.log("Sender:", ctx.nodeID);
             console.log("Metadata:", ctx.meta);
             console.log("The called event name:", ctx.eventName);

            let { users: listRecievers } = ctx.params;

             // ctx.emit("accounts.created", { user: ctx.params.user });
            let infoSendNoti = await NOTIFICATION__LOG_MODEL.sendNotiMobilePush({ users: listRecievers, title: 'Thử tiếng việt nào', description: 'from LDK TEAM', objDataForSend: { screenkey: 'DETAIL_PAGE' }, ctx })
         }
     },
     //  loại noti: CLOUD MESSAGING
     "NOTIFICATION__LOG_CREATE:SMS": {
        handler(ctx) {
            console.log(`------------------NOTIFICATION__LOG_CREATE----------------------`)
            console.log("Payload:", ctx.params);
            console.log("Sender:", ctx.nodeID);
            console.log("Metadata:", ctx.meta);
            console.log("The called event name:", ctx.eventName);
            // ctx.emit("accounts.created", { user: ctx.params.user });
        }
    }
 }