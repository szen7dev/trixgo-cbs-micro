
"use strict";
const ObjectID                                  = require('mongoose').Types.ObjectId;
const NOTIFICATION__LOG_COLL                    = require('../database/notification.log-coll');
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs }                        
                                                = require('../../../tools/utils/utils');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../../auth/helper/auth.actions-constant');
const { sendNotificationviaCloudMessaging }     = require('../../../tools/cloudmsg/noti.send');
const { ONE_SIGNAL__APP_ID }                    = require('../helper/notification.keys-constant')
 
class Model extends BaseModel {
    constructor() {
        super(NOTIFICATION__LOG_COLL);
    }
   
    sendNotiMobilePush({ users, title, description, objDataForSend, ctx }) {
        return new Promise(async (resolve) => {
             try {
                 console.log({ users, title, description, objDataForSend })
                /**
                 * DECALARTION VARIABLE (1)
                 */
                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(users))
                    return resolve({ error: true, message: "users_invalid" });

                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */   
                let infoAfterCall = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_LIST_USERS_BY_ID_FOR_MOBILE_PUSH}`, {
					users
				});
                if (!infoAfterCall.error) {
                    let { data: { listRecords } } = infoAfterCall;

                    let listOneSignalIDForMobilePush = [];
                    if (listRecords && Array.isArray(listRecords)) {
                        listRecords.forEach(user => {
                            let { devices } = user;
                            // console.log({ devices })

                            listOneSignalIDForMobilePush = [...listOneSignalIDForMobilePush, ...devices.map(item => item.oneSignalID)]
                        })

                        let dataForSend = {
                            app_id: ONE_SIGNAL__APP_ID,
                            headings: {
                                "en": title
                            },
                            contents: {
                                "en": description
                            },
                            data: objDataForSend,
                            ios_sound: 'teaser.wav',
                            android_sound: 'teaser',
                            ios_badgeType: 'Increase',
                            ios_badgeCount: 1,
                            // android_channel_id: 'xxxxxxx-4462-xxxx-884a-xxxxxxxxxx',
                            include_player_ids: listOneSignalIDForMobilePush
                        }
                        // console.log({ dataForSend })
                        sendNotificationviaCloudMessaging(dataForSend)
                    }
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}
exports.MODEL = new Model;