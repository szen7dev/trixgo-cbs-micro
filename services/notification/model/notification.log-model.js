"use strict";

const NOTIFICATION__LOG_COLL                    = require('../database/notification.log-coll');
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }          = require('../../../tools/utils/utils');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../../auth/helper/auth.actions-constant');
const { sendNotificationviaOneSignal }          = require('../../../tools/cloudmsg/noti.send');
const { RANGE_BASE_PAGINATION_V2 } 	            = require('../../../tools/cursor_base/playground/index');

const { 
    NOTI_TYPE,
    ONESIGNAL_APP_CBS,
    ONESIGNAL_APP_TEASER 
} = require('../helper/notification.keys-constant');

class Model extends BaseModel {
    constructor() {
        super(NOTIFICATION__LOG_COLL);

        this.NOT_SEND     =-1;
        this.SEND_SUCCESS = 1;
        this.SEND_FAILED  = 2;
        this.SEEN         = 3;
    }

    /**
	 * Dev: MinhVH
	 * Func: Thêm thông báo
	 * Date: 17/12/2021
	 */
    insert({ type, title, content, path, sender, receivers }){
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
    update({ notificationID, status }){
        return new Promise(async resolve => {
            try {
                const statusValid = [this.SEND_SUCCESS, this.SEND_FAILED, this.SEEN];

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
                        keyError: 'failed_UPDATE_NOTIFICATION',
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
    getList({ authorID, lastestID, keyword, limit = 20, select, populates }){
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

				if(isNaN(limit) || limit > 20) {
					limit = 20;
				} else{
					limit = +limit;
				}

				if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });
					populates = JSON.parse(populates);
				}else{
					populates = {
                        path: "", 
                        select: ""
                    }
                }

				// Init condition object
				let conditionObj 	= { 
                    status: this.SEND_SUCCESS,
                    receiver: authorID
                };

                let keys	        = ['_id__-1', 'createAt__-1'];
				let sortBy;
                let conditionObjOrg = { ...conditionObj }

				// GET CONDITION PAGINATION
				if(lastestID && checkObjectIDs(lastestID)){
					let infoNotification = await NOTIFICATION__LOG_COLL.findById(lastestID);
					if(!infoNotification)
						return resolve({ error: true, message: "Can't get info last notification", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });

					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
                    sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy                = dataPagingAndSort.data.sort;
                }

				// SEARCH TEXT
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regSearch = new RegExp(keyword, 'i');
                    conditionObj.title = regSearch;
                }

				let listNotifications = await NOTIFICATION__LOG_COLL.find(conditionObj)
					.limit(limit + 1)
					.select(select)
					.populate(populates)
					.sort(sortBy)
					.lean();

				// GET TOTAL RECORD
				let totalRecord = await NOTIFICATION__LOG_COLL.count(conditionObjOrg);
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
   

    sendNotiMobileAndWebPush({ users, title, description, objDataForSend, web_url, ctx }) {
        return new Promise(async (resolve) => {
             try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                const WEB_CBS           = 1;
                const MOBILE_TEARSER    = 2;

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
                                ...devices.filter(item => item.env == MOBILE_TEARSER && item.oneSignalID).map(item => item.oneSignalID)
                            ]
                            listDeviceFromWebBrowser = [
                                ...listDeviceFromWebBrowser,
                                ...devices.filter(item => item.env == WEB_CBS && item.oneSignalID).map(item => item.oneSignalID)
                            ]
                        });
                        console.log({ listDeviceFromMobile: listDeviceFromMobile.length, listDeviceFromWebBrowser: listDeviceFromWebBrowser.length })

                        // định nghĩa obj onesignal dùng chung cho web và app
                        let dataForSend = {
                            headings: { "en": title },
                            contents: { "en": description },
                        }

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

                            if(objDataForSend.amountNoti) {
                                dataForMobilePush.ios_badgeType = 'SetTo';
                                dataForMobilePush.ios_badgeCount = objDataForSend.amountNoti;
                            }

                            sendNotificationviaOneSignal(dataForMobilePush)
                            console.log("🚀 ~ file: notification.log-model.js ~ line 347 ~ Model ~ returnnewPromise ~ dataFoMobilebPush", dataForMobilePush)
                        }

                        if (listDeviceFromWebBrowser.length > 0) {
                            // WEB PUSH
                            let dataForWebPush = {
                                ...dataForSend,
                                data: objDataForSend,
                                app_id: ONESIGNAL_APP_CBS,
                                ios_sound: 'teaser.wav',
                                android_sound: 'teaser',
                                web_url,
                                include_player_ids: listDeviceFromWebBrowser
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
