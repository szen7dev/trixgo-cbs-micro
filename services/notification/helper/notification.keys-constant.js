//FILE CONFIG || VARIABLE CONSTANT
// exports.ONE_SIGNAL__APP_ID              = '79acfc09-966a-48f5-a9ea-44d90410014f';
exports.ONESIGNAL_APP_TEASER                = process.env.ONESIGNAL_APP_TEASER  || '79acfc09-966a-48f5-a9ea-44d90410014f';
exports.ONESIGNAL_APP_CBS                   = process.env.ONESIGNAL_APP_CBS     || '79acfc09-966a-48f5-a9ea-44d90410014f';

exports.NOTI_TYPE_MOBILE                = 'NOTI_TYPE_MOBILE';
exports.NOTI_TYPE_WEB                   = 'NOTI_TYPE_WEB';
exports.NOTI_TYPE_SMS                   = 'NOTI_TYPE_SMS';
exports.NOTI_TYPE_EMAIL                 = 'NOTI_TYPE_EMAIL';

exports.NOTI_TYPE = [1,2,3,4,5]


/**
 * LIST TYPE EVENT - KEY
 *  (chức năng dùng cho phần đa ngôn ngữ) (đồng bộ phía client-server)
 */

/**
 * LIST TYPE NOTIFICATIONS 
*/
let APP_MESSAGE                 = 'MESSAGE';
let APP_ACCOUNT                 = 'ACCOUNT';
let APP_SOCIAL                  = 'SOCIAL';
let APP_PCM                     = 'PCM';

// SOCIAL
exports.SOCIAL_POST_LIKE                      = `${APP_SOCIAL}.SOCIAL_POST_LIKE`;
exports.SOCIAL_COMMENT_LIKE                   = `${APP_SOCIAL}.SOCIAL_COMMENT_LIKE`;
exports.SOCIAL_SEND_NOTICE_COMMENT_TO_MEMBERS = `${APP_SOCIAL}.SOCIAL_SEND_NOTICE_COMMENT_TO_MEMBERS`;


/**
 * DANH SÁCH ENV THEO field devices TẠI AUTH.USER-COLL
 */
exports.ENV_DEVICE_WEB_CBS = 1;
exports.ENV_DEVICE_APP_CBS = 3;
exports.ENV_DEVICE_APP_TEASER = 2;