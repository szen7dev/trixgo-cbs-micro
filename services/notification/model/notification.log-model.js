"use strict";

const NOTIFICATION__LOG_COLL                    = require('../database/notification.log-coll');
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs }                        = require('../../../tools/utils/utils');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../../auth/helper/auth.actions-constant');
const { sendNotificationviaOneSignal }          = require('../../../tools/cloudmsg/noti.send');
const { 
    NOTI_TYPE,
    ONESIGNAL_APP_CBS,
    ONESIGNAL_APP_TEASER 
} = require('../helper/notification.keys-constant');

class Model extends BaseModel {
    constructor() {
        super(NOTIFICATION__LOG_COLL);

        this.NOT_SEND = -1;
        this.SEND_SUCCESS = 1;
        this.SEND_FAILED = 2;
    }

    /**
	 * Dev: MinhVH
	 * Func: Thêm thông báo
	 * Date: 17/12/2021
	 */
    insertNotification({ type, title, content, path, sender, receivers }){
        return new Promise(async resolve => {
            try {
                const dataInsert = {
                    title,
                    content,
                    type,
                    path,
                    sender,
                    status: this.SEND_SUCCESS
                };

                if(!title) {
                    return resolve({
                        error: true,
                        message: 'Request params title invalid',
                        keyError: 'params_title_invalid',
                        status: 400
                    });
                }

                if(!content) {
                    return resolve({
                        error: true,
                        message: 'Request params content invalid',
                        keyError: 'params_content_invalid',
                        status: 400
                    });
                }

                if(!NOTI_TYPE.includes(type)) {
                    return resolve({
                        error: true,
                        message: 'Request params type notification invalid',
                        keyError: 'params_type_notification_invalid',
                        status: 400
                    });
                }

                if(!checkObjectIDs(sender)) {
                    return resolve({
                        error: true,
                        message: 'Request params sender invalid',
                        keyError: 'params_sender_invalid',
                        status: 400
                    });
                }
                
                if(!checkObjectIDs(receivers)){
                    return resolve({
                        error: true,
                        message: 'Request params receivers invalid',
                        keyError: 'params_receivers_invalid',
                        status: 400,
                    })
                }

                const infoInsertNotiAsync = receivers.map(receiver => this.insertData({
                    ...dataInsert,
                    receiver
                }))

                const infoAfterInsertNoti = await Promise.all(infoInsertNotiAsync);
                
                if(!infoAfterInsertNoti) {
                    return resolve({
                        error: true,
                        message: 'Create notification failed',
                        keyError: 'failed_create_notification',
                        status: 422
                    });
                }

                return resolve({ error: false, data: infoAfterInsertNoti, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Cập nhật trạng thái thông báo
	 * Date: 17/12/2021
	 */
    updateStatus({ notificationID, status }){
        return new Promise(async resolve => {
            try {
                const statusValid = [this.SEND_SUCCESS, this.SEND_FAILED];

                if(!statusValid.includes(status)) {
                    return resolve({
                        error: true,
                        message: 'Request params status invalid',
                        keyError: 'params_status_invalid',
                        status: 400
                    });
                }

                if(!checkObjectIDs(notificationID)) {
                    return resolve({
                        error: true,
                        message: 'Request params notificationID invalid',
                        keyError: 'params_notificationID_invalid',
                        status: 400
                    });
                }

                const infoAfterUpdateStatus = await NOTIFICATION__LOG_COLL.findByIdAndUpdate(notificationID, { status }, { new: true });

                if(!infoAfterUpdateStatus) {
                    return resolve({
                        error: true,
                        message: 'Update status notification faled',
                        keyError: 'failed_update_status_notification',
                        status: 422
                    });
                }
                
                return resolve({ error: false, data: infoAfterUpdateStatus, status: 200 });
            } catch(error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Lấy danh sách thông báo
	 * Date: 17/12/2021
	 */
    getListNotification({ authorID, lastestID, keyword, limit = 15, filter = {}, select = {} }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs(authorID)) {
					return resolve({
                        error: true,
                        message: "Request param authorID invalid",
                        keyError: 'param_authorID_invalid',
                        status: 400
                    });
                }

				if(isNaN(limit)) {
					limit = 15;
				} else{
					limit = +limit;
				}

				if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}

				// Init condition object
				let conditionObj 	= { 
                    status: this.SEND_SUCCESS,
                    receiver: authorID
                };
				let conditionFind 	= {};
				let objSort 	 	= {};
				let sortBy = {
                    _id: -1,
					createAt: -1,
					modifyAt: -1
				};

				// GET CONDITION PAGINATION
				if(lastestID && checkObjectIDs(lastestID)){
					let infoNotification = await NOTIFICATION__LOG_COLL.findById(lastestID);
					if(!infoNotification)
						return resolve({ error: true, message: "Can't get info last notification", status: 400 });

					let nextInfo = `${infoNotification._id}_${infoNotification.createAt}`;
					let keys	 = ['_id__-1', 'createAt__-1'];

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}

				// SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

				let listNotifications = await NOTIFICATION__LOG_COLL.find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
					.populate('sender', select.sender)
					.populate('receiver', select.receiver)
					.sort(sortBy)
					.limit(limit + 1)
					.lean();

				// GET TOTAL RECORD
				let totalRecord = await NOTIFICATION__LOG_COLL.countDocuments(conditionObj);
				let nextCursor  = null;

				if(listNotifications && listNotifications.length){
					if(listNotifications.length > limit){
						nextCursor = listNotifications[limit - 1]._id;
						listNotifications.length = limit;
					}
				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listNotifications,
						limit: +limit,
						totalRecord,
						nextCursor
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}
   
    // sendNotiMobilePush({ users, title, description, objDataForSend, ctx }) {
    sendNotiMobileAndWebPush({ users, title, description, objDataForSend, web_url, ctx }) {
        return new Promise(async (resolve) => {
             try {
                const WEB_CBS           = 1;
                const MOBILE_TEARSER    = 2;
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

                    /**
                     * @param listDeviceFromMobile "danh sách device ENV: TEASER"
                     * @param listDeviceFromWebBrowser  "danh sách device ENV: CBS"
                     */
                    let listDeviceFromMobile        = [];
                    let listDeviceFromWebBrowser    = [];


                    if (listRecords && Array.isArray(listRecords)) {
                        listRecords.forEach(user => {
                            let { devices } = user;
                            listDeviceFromMobile = [
                                ...listDeviceFromMobile,
                                ...devices.filter(item => item.env == WEB_CBS && item.oneSignalID).map(item => item.oneSignalID)
                            ]
                            listDeviceFromWebBrowser = [
                                ...listDeviceFromWebBrowser,
                                ...devices.filter(item => item.env == MOBILE_TEARSER && item.oneSignalID).map(item => item.oneSignalID)
                            ]

                        });

                        // định nghĩa obj onesignal dùng chung cho web và app
                        let dataForSend = {
                            headings: { "en": title },
                            contents: { "en": description },
                        }
                        console.log("🚀 ~ file: notification.log-model.js ~ line 308 ~ Model ~ returnnewPromise ~ listDeviceFromWebBrowser", listDeviceFromWebBrowser)

                        if (listDeviceFromMobile.length > 0) {
                            // MOBILE PUSH
                            let dataForMobilePush = {
                                ...dataForSend,
                                data: objDataForSend,
                                app_id: ONESIGNAL_APP_TEASER,
                                ios_sound: 'teaser.wav',
                                android_sound: 'teaser',
                                ios_badgeType: 'Increase',
                                ios_badgeCount: 1,
                                include_player_ids: listDeviceFromMobile
                            }
                            
                            sendNotificationviaOneSignal(dataForMobilePush)
                        } 
                        if (listDeviceFromWebBrowser.length > 0) {
                            // WEB PUSH
                            let dataForWebPush = {
                                ...dataForSend,
                                app_id: ONESIGNAL_APP_CBS,
                                web_url,
                                include_player_ids: listDeviceFromMobile
                            }
                            sendNotificationviaOneSignal(dataForWebPush)
                            console.log("🚀 ~ file: notification.log-model.js ~ line 347 ~ Model ~ returnnewPromise ~ dataForWebPush", dataForWebPush)
                        }

                    }
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model;
