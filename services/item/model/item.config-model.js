"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const ObjectID                          = require('mongoose').Types.ObjectId;

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../helper/item.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * COLLECTIONS
 */
const ITEM__CONFIG_COLL            				= require('../database/item.config-coll');

class Model extends BaseModel {

    constructor() {
        super(ITEM__CONFIG_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 19/9/2022
     */
    insert({ companyID, userID, name, type, status, active, channel, template, secretKey, tokenKey, metadata, hotline1, hotline2, hotline3, qrcode1, qrcode2, youtube, facebook, zalo, tiktok, shopee, address, phone, email, content, registration, note, email1, email2, email3, email4 }) {
        return new Promise(async resolve => {
            try {
                if(!name || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'param_not_valid' });

                let checkInfo = await ITEM__CONFIG_COLL.findOne({ type, company: companyID })
                if(checkInfo)
                    return resolve({ error: true, message: 'Cấu hình đã tồn tại' });  

                let dataInsert = {
                    company: companyID,
                    userCreate: userID,
                    name,
                }

                if(channel && channel != ""){
                    dataInsert.channel = channel
                }

                if(template && template != ""){
                    dataInsert.template = template
                }

                if(secretKey && secretKey != ""){
                    dataInsert.secretKey = secretKey
                }

                if(tokenKey && tokenKey != ""){
                    dataInsert.tokenKey = tokenKey
                }

                if(metadata && metadata != ""){
                    dataInsert.metadata = metadata
                }

                if(hotline1 && hotline1 != ""){
                    dataInsert.hotline1 = hotline1
                }

                if(hotline2 && hotline2 != ""){
                    dataInsert.hotline2 = hotline2
                }

                if(hotline3 && hotline3 != ""){
                    dataInsert.hotline3 = hotline3
                }

                if(qrcode1 && qrcode1 != ""){
                    dataInsert.qrcode1 = qrcode1
                }

                if(qrcode2 && qrcode2 != ""){
                    dataInsert.qrcode2 = qrcode2
                }

                if(youtube && youtube != ""){
                    dataInsert.youtube = youtube
                }

                if(facebook && facebook != ""){
                    dataInsert.facebook = facebook
                }

                if(zalo && zalo != ""){
                    dataInsert.zalo = zalo
                }

                if(tiktok && tiktok != ""){
                    dataInsert.tiktok = tiktok
                }

                if(shopee && shopee != ""){
                    dataInsert.shopee = shopee
                }

                if(address && address != ""){
                    dataInsert.address = address
                }

                if(phone && phone != ""){
                    dataInsert.phone = phone
                }

                if(email && email != ""){
                    dataInsert.email = email
                }
                
                if(email1 && email1 != ""){
                    dataInsert.email1 = email1
                }

                if(email2 && email2 != ""){
                    dataInsert.email2 = email2
                }

                if(email3 && email3 != ""){
                    dataInsert.email3 = email3
                }
                
                if(email4 && email4 != ""){
                    dataInsert.email4 = email4
                }

                if(content && content != ""){
                    dataInsert.content = content
                }

                if(registration && registration != ""){
                    dataInsert.registration = registration
                }

                if(note && note != ""){
                    dataInsert.note = note
                }

                if (!isNaN(status)) {
                    dataInsert.status = Number(status)
                }

                if (!isNaN(type)) {
                    dataInsert.type = Number(type)
                }

                if (!isNaN(active)) {
                    dataInsert.active = Number(active)
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert) {
                    return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurred",
						status: 422
					})
                }
                
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Update
     * Author: HiepNH
     * Code: 19/9/2022
     */
    update({ userID, configID, name, type, status, active, channel, template, secretKey, tokenKey, metadata, hotline1, hotline2, hotline3, qrcode1, qrcode2, youtube, facebook, zalo, tiktok, shopee, address, phone, email, content, registration, note, email1, email2, email3, email4 }){
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(userID) || !checkObjectIDs(configID) )
                    return resolve({ error: true, message: 'param_not_valid' });
                    
                let dataUpdate = {
                    userUpdate: userID,
                    modifyAt: Date.now(),
                }

                if(name && name != ""){
                    dataUpdate.name = name
                }

                if(channel && channel != ""){
                    dataUpdate.channel = channel
                }

                if(template && template != ""){
                    dataUpdate.template = template
                }

                if(secretKey && secretKey != ""){
                    dataUpdate.secretKey = secretKey
                }

                if(tokenKey && tokenKey != ""){
                    dataUpdate.tokenKey = tokenKey
                }

                if(metadata && metadata != ""){
                    dataUpdate.metadata = metadata
                }

                if(hotline1 && hotline1 != ""){
                    dataUpdate.hotline1 = hotline1
                }

                if(hotline2 && hotline2 != ""){
                    dataUpdate.hotline2 = hotline2
                }

                if(hotline3 && hotline3 != ""){
                    dataUpdate.hotline3 = hotline3
                }

                if(qrcode1 && qrcode1 != ""){
                    dataUpdate.qrcode1 = qrcode1
                }

                if(qrcode2 && qrcode2 != ""){
                    dataUpdate.qrcode2 = qrcode2
                }

                if(youtube && youtube != ""){
                    dataUpdate.youtube = youtube
                }

                if(facebook && facebook != ""){
                    dataUpdate.facebook = facebook
                }

                if(zalo && zalo != ""){
                    dataUpdate.zalo = zalo
                }

                if(tiktok && tiktok != ""){
                    dataUpdate.tiktok = tiktok
                }

                if(shopee && shopee != ""){
                    dataUpdate.shopee = shopee
                }

                if(address && address != ""){
                    dataUpdate.address = address
                }

                if(phone && phone != ""){
                    dataUpdate.phone = phone
                }

                if(email && email != ""){
                    dataUpdate.email = email
                }
                
                if(email1 && email1 != ""){
                    dataUpdate.email1 = email1
                }

                if(email2 && email2 != ""){
                    dataUpdate.email2 = email2
                }

                if(email3 && email3 != ""){
                    dataUpdate.email3 = email3
                }
                
                if(email4 && email4 != ""){
                    dataUpdate.email4 = email4
                }

                if(content && content != ""){
                    dataUpdate.content = content
                }

                if(registration && registration != ""){
                    dataUpdate.registration = registration
                }

                if(note && note != ""){
                    dataUpdate.note = note
                }

                if (!isNaN(status)) {
                    dataUpdate.status = Number(status)
                }

                if (!isNaN(type)) {
                    dataUpdate.type = Number(type)
                }

                if (!isNaN(active)) {
                    dataUpdate.active = Number(active)
                }

                let infoAfterUpdate = await ITEM__CONFIG_COLL.findByIdAndUpdate(configID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: get info area 
     * Author: Depv
     * Code: 
     */
    getInfo({ configID, isInfo, type, companyID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                // populates
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

                if(isInfo){
                    let infoAterGet = await ITEM__CONFIG_COLL.findOne({type, company: companyID})
                    .select(select)
                    .populate(populates)
                    if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", status: 403 });

                    return resolve({ error: false, data: infoAterGet, status: 200 });
                }else{

                    let infoAterGet = await ITEM__CONFIG_COLL.findById(configID)
                    .select(select)
                    .populate(populates)
                    if(!infoAterGet)
                        return resolve({ error: true, message: "can't_get_info", status: 403 });

                    return resolve({ error: false, data: infoAterGet, status: 200 });
                }

            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /**
     * Name  : Danh sách area 
     * Author: Depv
     * Code  : 
     */
    getList({ companyID, keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {
                if(limit > 20){
                    limit = 20
                }else{
                    limit = +limit;
                }

                let sortBy;
                let conditionObj = { company: companyID };
                let keys	 = ['createAt__-1', '_id__-1'];

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
               
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }
                // console.log(conditionObj)
                
                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__CONFIG_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }
                
                let infoDataAfterGet = await ITEM__CONFIG_COLL
                    .find(conditionObj)
                    .select(select)
                    .limit(limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean(); 

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await ITEM__CONFIG_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;