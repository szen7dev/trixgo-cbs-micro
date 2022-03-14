"use strict";

const PromisePool								= require('@supercharge/promise-pool');
const NOTIFICATION__LOG_COLL                    = require('../database/notification.log-coll');
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }          = require('../../../tools/utils/utils');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../../auth/helper/auth.actions-constant');
const { sendNotificationviaOneSignal }          = require('../../../tools/cloudmsg/noti.send');
const { RANGE_BASE_PAGINATION_V2 } 	            = require('../../../tools/cursor_base/playground/index');
const { ENV_DEVICE_APP_CBS, ENV_DEVICE_APP_TEASER, ENV_DEVICE_WEB_CBS } = require('../helper/notification.keys-constant')
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

        this.WEB_CBS           = 1;
        this.MOBILE_TEARSER    = 2;
        this.MOBILE_CBS        = 3;
    }

    /**
	 * Dev: MinhVH
	 * Func: Thêm thông báo
	 * Date: 17/12/2021
	 */
    insert({ type, content, path, sender, receivers, languageKey, project, contract, app, mainColl, subColl }){
        return new Promise(async resolve => {
            try {
                // console.log({ type, content, path, sender, receivers, languageKey, project, contract, app, mainColl, subColl })
                const dataInsert = {
                    content,
                    type,
                    path,
                    sender,
                    languageKey,
                    status: this.SEND_SUCCESS
                };

                (project    && checkObjectIDs(project))         && (dataInsert.project  = project);
                (contract   && checkObjectIDs(contract))        && (dataInsert.contract = contract);
                (app        && checkObjectIDs(app))             && (dataInsert.app      = app);
                (mainColl   && checkObjectIDs(mainColl.item))   && (dataInsert.mainColl = mainColl);
                (subColl    && checkObjectIDs(subColl.item))    && (dataInsert.subColl  = subColl);

                if(!content) {
                    return resolve({
                        error: true,
                        message: 'Tham số content không hợp lệ',
                        keyError: 'params_content_invalid',
                        status: 400
                    });
                }

                if(!NOTI_TYPE.includes(type)) {
                    return resolve({
                        error: true,
                        message: 'Tham số type không hợp lệ',
                        keyError: 'params_type_invalid',
                        status: 400
                    });
                }

                if(!checkObjectIDs([sender])) {
                    return resolve({
                        error: true,
                        message: 'Tham số sender không hợp lệ',
                        keyError: 'params_sender_invalid',
                        status: 400
                    });
                }
                
                if(!checkObjectIDs(receivers)){
                    return resolve({
                        error: true,
                        message: 'Tham số receivers không hợp lệ',
                        keyError: 'params_receivers_invalid',
                        status: 400,
                    })
                }

                const { results } = await PromisePool
					.for(receivers)
					.withConcurrency(2)
					.process(async receiver => {
						const infoAfterInsert = await this.insertData({
                            ...dataInsert,
                            receiver
                        });

                        return infoAfterInsert;
					})

                if(!results || !results.length) {
                    return resolve({
                        error: true,
                        message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục',
                        keyError: 'error_occurred',
                        status: 422
                    });
                }

                return resolve({ error: false, data: results, status: 200 });
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
                        message: 'Tham số status không hợp lệ',
                        keyError: 'params_status_invalid',
                        status: 400
                    });
                }

                if(!checkObjectIDs([notificationID])) {
                    return resolve({
                        error: true,
                        message: 'Tham số notificationID không hợp lệ',
                        keyError: 'params_notificationID_invalid',
                        status: 400
                    });
                }

                const infoAfterUpdateStatus = await NOTIFICATION__LOG_COLL.findByIdAndUpdate(notificationID, { status }, { new: true });

                if(!infoAfterUpdateStatus) {
                    return resolve({
                        error: true,
                        message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục',
                        keyError: 'error_occurred',
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
	 * Updated: 22/02/2022
	 */
    getList({ authorID, lastestID, keyword, limit = 20, select, populates }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([authorID])) {
					return resolve({
                        error: true,
                        message: "Tham số authorID không hợp lệ",
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
				} else{
					populates = {
                        path: "", 
                        select: ""
                    }
                }
				let conditionObj 	= { 
                    // status: this.SEND_SUCCESS,
                    receiver: authorID,
                    status: { $ne: 3 }
                };
                let keys	        = ['_id__-1', 'createAt__-1'];
				let sortBy;
                let conditionObjOrg = { ...conditionObj }

				// GET CONDITION PAGINATION
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await NOTIFICATION__LOG_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last notification", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });

					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
                    sortBy       = dataPagingAndSort.data.sort;
				} else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy                = dataPagingAndSort.data.sort;
                }

				// SEARCH TEXT
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.content = new RegExp(keyword, 'i');
                }

				let listNotifications = await NOTIFICATION__LOG_COLL
                    .find(conditionObj)
					.limit(limit + 1)
					.select(select)
                    .populate({
                        path: "receiver sender",
                        select: "_id bizfullname email image"
                    })
					.populate(populates)
					.sort(sortBy)
					.lean();

				// GET TOTAL RECORD
				let totalRecord = await NOTIFICATION__LOG_COLL.countDocuments(conditionObjOrg);
				let totalRecordNotSeen = await NOTIFICATION__LOG_COLL.countDocuments({ status: { $ne: 3 } });
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
						limit,
						totalRecord,
                        totalRecordNotSeen,
						nextCursor
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

    /**
	 * Dev: KhanhLD
	 * Func: Gửi noti đến mobile và web
	 * Date: ...
     * --------------
     * env là loại app sẽ push tới
     * VD: env = 1 hoặc = 3 => chỉ push tới app CBS
     *     env = 2 => chỉ push tới app Teaser
	 */
    sendNotiMobileAndWebPush({ users, title, description, objDataForSend, web_url, env, ctx }) {
        return new Promise(async resolve => {
             try {
                /**
                 * từ env là giá trị
                 *      1/ WEB_CBS          
                        2/ MOBILE_TEARSER   
                        3/ MOBILE_CBS      

                        -> CẦN TÌM ra
                            VD: env = 1 => listEnvReceiveNoti = [1, 3]. Vì 1 và 3 là 2 giá trị của CBS nên cần đẩy về cho app và web
                            VD: env = 2 => listEnvReceiveNoti = [1, 2]. vì 2 là ứng dụng teaser, nên sẽ đẩy về CBS web(có chứa app chatting), và App Teaser
                 */
                let listEnvReceiveNoti = [ENV_DEVICE_WEB_CBS, ENV_DEVICE_APP_CBS].includes(+env) ? [ENV_DEVICE_WEB_CBS, ENV_DEVICE_APP_CBS] : [ENV_DEVICE_WEB_CBS, ENV_DEVICE_APP_TEASER];
                console.log("🚀 ~ file: notification.log-model.js ~ line 301 ~ Model ~ returnnewPromise ~ listEnvReceiveNoti")
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
                    console.log("🚀 ~ file: notification.log-model.js ~ line 309 ~ Model ~ returnnewPromise ~ listRecords")

                    /**
                     * @param listDeviceFromMobile "danh sách device ENV: TEASER"
                     * @param listDeviceFromWebBrowser  "danh sách device ENV: CBS"
                     */
                    let listDeviceFromMobile        = [];
                    let listDeviceFromWebBrowser    = [];

                    /**
                     * cần tìm app_id_with_env
                     *  - nếu là env của devices(auth.user-coll) =  1 hoặc 3 => ONESIGNAL_APP_CBS ('8d5db406-1628-4a23-bf40-8bb53bf582ba)
                     *  - nếu là MOBILE_TEARSER -> ONESIGNAL_APP_TEASER  (79acfc09-966a-48f5-a9ea-44d90410014f)
                     */
                    let _findAppIdWithEnv = envItem => [this.WEB_CBS, this.MOBILE_CBS].includes(+envItem) ? ONESIGNAL_APP_CBS : ONESIGNAL_APP_TEASER;

                    if (listRecords && Array.isArray(listRecords)) {
                        listRecords.forEach(user => {
                            let { devices } = user;

                            if(devices && devices.length) {
                                listDeviceFromMobile = [
                                    ...listDeviceFromMobile,
                                    /**
                                     * item.oneSignalID: là điều kiện chắc chắn obj trong devices phải có key để onesignal push noti
                                     * listEnvReceiveNoti.includes(item.env): tùy vào ACTION mà sẽ push noti theo từng loại app
                                     * (item.env == this.MOBILE_TEARSER || item.env == this.MOBILE_CBS): kiểm tra rẽ nhánh theo WEB và APP theo 2 arr khác nhau
                                     * 
                                     */
                                    ...devices.filter(item => item.oneSignalID && listEnvReceiveNoti.includes(item.env) && (item.env == this.MOBILE_TEARSER || item.env == this.MOBILE_CBS)).map(itemReturn => {
                                        return {
                                            oneSignalID: itemReturn.oneSignalID,
                                            app_id: _findAppIdWithEnv(itemReturn.env),
                                        }
                                    })
                                ]
                                listDeviceFromWebBrowser = [
                                    ...listDeviceFromWebBrowser,
                                    ...devices.filter(item => item.oneSignalID  && listEnvReceiveNoti.includes(item.env) && item.env == +env && item.env == this.WEB_CBS).map(itemReturn => {
                                        return {
                                            oneSignalID: itemReturn.oneSignalID,
                                            app_id: _findAppIdWithEnv(itemReturn.env),
                                        }
                                    })
                                ]
                            }
                        });
                      
                        // định nghĩa obj onesignal dùng chung cho web và app
                        let dataForSend = {
                            // headings: { "en": title },
                            contents: { "en": description },
                        }

                        if (listDeviceFromMobile && listDeviceFromMobile.length) {
                            /**
                             * chia mảng listDeviceFromMobile thành 2 nhóm để push theo app_id của (CBS và TEASER)
                             */
                            let listDeviceFromMobileWith_CBS        = listDeviceFromMobile.filter(item => item.app_id == ONESIGNAL_APP_CBS);
                            console.log("🚀 ~ file: notification.log-model.js ~ line 353 ~ Model ~ returnnewPromise ~ listDeviceFromMobileWith_CBS")

                            let listDeviceFromMobileWith_TEASER     = listDeviceFromMobile.filter(item => item.app_id == ONESIGNAL_APP_TEASER);
                            console.log("🚀 ~ file: notification.log-model.js ~ line 355 ~ Model ~ returnnewPromise ~ listDeviceFromMobileWith_TEASER")

                            // =================== MOBILE PUSH (CBS) ===================
                            let dataForMobilePushCBS = {
                                ...dataForSend,
                                // data: objDataForSend,
                                app_id: ONESIGNAL_APP_CBS,
                                included_segments: ["Subscribed Users"]
                                // ios_sound: 'teaser.wav',
                                // android_sound: 'teaser',
                                // ios_badgeType: 'Increase',
                                // ios_badgeCount: 1,
                                // include_player_ids: listDeviceFromMobileWith_CBS.map(item => item.oneSignalID)
                            }
                            if(objDataForSend.amountNoti) {
                                dataForMobilePushCBS.ios_badgeType = 'SetTo';
                                dataForMobilePushCBS.ios_badgeCount = objDataForSend.amountNoti;
                            }
                            console.info('MOBILE PUSH (CBS)')
                            console.log({ include_player_ids: dataForMobilePushCBS.include_player_ids })

                            // sendNotificationviaOneSignal(dataForMobilePushCBS)

                            listDeviceFromMobileWith_CBS.map(item => {
                                console.log({
                                    ...dataForMobilePushCBS,
                                    include_player_ids: [item.oneSignalID]
                                })
                                sendNotificationviaOneSignal({
                                    ...dataForMobilePushCBS,
                                    include_player_ids: [item.oneSignalID]
                                })
                            })
                            

                            //  =================== MOBILE PUSH (TEASER) ===================
                            let dataForMobilePushTeaser = {
                                ...dataForSend,
                                data: objDataForSend,
                                app_id: ONESIGNAL_APP_TEASER,
                                ios_sound: 'teaser.wav',
                                android_sound: 'teaser',
                                ios_badgeType: 'Increase',
                                ios_badgeCount: 1,
                                include_player_ids: listDeviceFromMobileWith_TEASER.map(item => item.oneSignalID)
                            }
                            if(objDataForSend.amountNoti) {
                                dataForMobilePushTeaser.ios_badgeType = 'SetTo';
                                dataForMobilePushTeaser.ios_badgeCount = objDataForSend.amountNoti;
                            }
                            console.info('MOBILE PUSH (TEASER)')
                            console.log({ include_player_ids: dataForMobilePushTeaser.include_player_ids })
                            sendNotificationviaOneSignal(dataForMobilePushTeaser)

                            // console.log("🚀 ~ file: notification.log-model.js ~ line 347 ~ Model ~ returnnewPromise ~ dataFoMobilebPush", dataForMobilePush)
                        }

                        if (listDeviceFromWebBrowser.length) {
                            let listDeviceFromWebBrowserWith_CBS        = listDeviceFromWebBrowser.filter(item => item.app_id == ONESIGNAL_APP_CBS);
                            console.log("🚀 ~ file: notification.log-model.js ~ line 395 ~ Model ~ returnnewPromise ~ listDeviceFromWebBrowserWith_CBS", listDeviceFromWebBrowserWith_CBS.length)

                            let listDeviceFromWebBrowserWith_TEASER     = listDeviceFromWebBrowser.filter(item => item.app_id == ONESIGNAL_APP_TEASER);
                            console.log("🚀 ~ file: notification.log-model.js ~ line 397 ~ Model ~ returnnewPromise ~ listDeviceFromWebBrowserWith_TEASER", listDeviceFromWebBrowserWith_TEASER.length)

                            // WEB PUSH = CBS
                            let dataForWebPushCBS = {
                                ...dataForSend,
                                data: objDataForSend,
                                app_id: ONESIGNAL_APP_CBS,
                                ios_sound: 'teaser.wav',
                                android_sound: 'teaser',
                                web_url,
                                include_player_ids: listDeviceFromWebBrowserWith_CBS.map(item => item.oneSignalID)
                            }
                            console.info('WEB PUSH = CBS')
                            console.log({ include_player_ids: dataForWebPushCBS.include_player_ids })
                            sendNotificationviaOneSignal(dataForWebPushCBS)

                            // WEB PUSH = TEASER
                            let dataForWebPushTeaser = {
                                ...dataForSend,
                                data: objDataForSend,
                                app_id: ONESIGNAL_APP_TEASER,
                                ios_sound: 'teaser.wav',
                                android_sound: 'teaser',
                                web_url,
                                include_player_ids: listDeviceFromWebBrowserWith_TEASER.map(item => item.oneSignalID)
                            }
                            console.info('WEB PUSH = TEASER')
                            console.log({ include_player_ids: dataForWebPushTeaser.include_player_ids })
                            sendNotificationviaOneSignal(dataForWebPushTeaser)
                        }

                    }
                }
            } catch (error) {
                console.info('==========sendNotiMobileAndWebPush==========');
                console.error(error);
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model;
