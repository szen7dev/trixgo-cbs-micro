"use strict";

const BaseModel                         = require('../../../tools/db/base_model.js');
const ObjectID                          = require('mongoose').Types.ObjectId;
const XlsxPopulate                      = require('xlsx-populate')
const fs                                = require('fs')
const path                              = require('path')
const { uploadFileS3 }                  = require('../../../tools/s3/index.js')

/**
 * DOMAIN AND ACTIONS
 */
// const { CF_DOMAIN_SERVICES } 		            = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_ANALYSIS }                   = require('../../analysis/helper/analysis.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const {
  checkObjectIDs,
  IsJsonString,
  validateParamsObjectID
}  = require('../../../tools/utils/utils.js');
const stringUtils					    = require('../../../tools/utils/string_utils.js')
const { CRM_PERMISSION }                = require('../helper/crm.keys-constant.js')
const { KEY_ERROR } = require("../../../tools/keys");

/**
 * COLLECTIONS
 */
// const AUTH__COMPANY_COLL                = require('../../auth/database/auth.company-coll')
const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll.js')
const ITEM__CONTACT_COLL                = require('../../item/database/item.contact-coll.js')
const CRM__VNG_FUND_COLL                = require('../database/crm.vng_fund-coll')
const CRM__VNG_EVENT_COLL               = require('../database/crm.vng_event-coll')

class Model extends BaseModel {

    constructor() {
        super(CRM__VNG_FUND_COLL);
    }

 /**
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert({ userID, companyID, type, date, name, eventID, address, amount, note, imagesID, status }) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(eventID) || !name)
                    return resolve({error: true, message: "eventID|name invalid", keyError: KEY_ERROR.PARAMS_INVALID})

                //__________Khai báo và validate dữ liệu
                let dataInsert = {
                    company: companyID,
                    userCreate: userID,
                    event: eventID,
                }

                if(!isNaN(type) && [1,2].includes(Number(type))){
                    dataInsert.type = type;
                }

                if(!isNaN(status) && [1,2].includes(Number(status))){
                    dataInsert.status = status;
                }

                if(!isNaN(amount)){
                    dataInsert.amount = amount;
                }

                if(date && date != ""){
                    dataInsert.date = date;
                }

                if(address && address != ""){
                    dataInsert.address = address;
                }

                let convertStr = ''
                if(name && name != ""){
                    dataInsert.name = name;
                    convertStr = stringUtils.removeAccents(name)
                }
                if(note && note != ""){
                    dataInsert.note = note;
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                if(convertStr != ""){
                    dataInsert.namecv = convertStr
                }

                let infoAfterInsert = await this.insertData(dataInsert)
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" })

                let listData = await CRM__VNG_FUND_COLL.aggregate([
                    {
                        $match: {
                            event: ObjectID(eventID),
                        }
                    },
                    {
                        $group: {
                            _id: { type: "$type",  },
                            amount: { $sum: "$amount" },
                        }
                    },
                ])

                if(listData && listData.length){
                    let income = 0, expense = 0
                    for(const item of listData){
                        if(item._id.type == 1){
                            income = Number(item.amount)
                        }else{
                            expense = Number(item.amount)
                        }
                    }

                    await CRM__VNG_EVENT_COLL.findByIdAndUpdate(eventID, {
                        userUpdate: userID,
                        modifyAt: Date.now(),
                        income, 
                        expense
                    }, { new: true })
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
     * Code: 22/11/2023
     */
    update({ userID, fundID, type, date, name, eventID, address, amount, note, status, imagesID }){
        return new Promise(async (resolve) => {
            try {
                let dataUpdate = {
                    userUpdate: userID,
                    modifyAt: Date.now(),
                }

                if(imagesID && imagesID.length) {
                    dataUpdate.$addToSet = {
                        images: imagesID,
                    }
                }

                if (checkObjectIDs(eventID)) {
                    dataInsert.event = eventID;
                }

                if(!isNaN(status) && [1,2].includes(Number(status))){
                    dataUpdate.status = status;
                }

                if(!isNaN(amount)){
                    dataUpdate.amount = amount;
                }

                if(date && date != ""){
                    dataUpdate.date = date;
                }

                if(address && address != ""){
                    dataUpdate.address = address;
                }

                let convertStr = ''
                if(name && name != ""){
                    dataUpdate.name = name;
                    convertStr = stringUtils.removeAccents(name)
                }
                if(note && note != ""){
                    dataUpdate.note = note;
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                if(convertStr != ""){
                    dataUpdate.namecv = convertStr
                }

                let infoAfterUpdate = await CRM__VNG_FUND_COLL.findByIdAndUpdate(fundID, dataUpdate, { new: true })
                if(!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Cannot update",
                        keyError: "cannot_update",
                    })
                }

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }


    /**
     * Name: get info expert timesheet
     * Author: Depv
     * Code:
     */
    getInfo({ fundID, userID, select, populates }) {
        return new Promise(async (resolve) => {
            try {                
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

                let infoAterGet = await CRM__VNG_FUND_COLL.findById(fundID)
                .select(select)
                .populate(populates)

                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", status: 403 })

                return resolve({ error: false, data: infoAterGet, status: 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Danh sách expert timesheet
     * Author: Depv
     * Code  :
     */
    getList({ companyID, eventID, type, status, keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = {};
                let nextCursor	= null;
                let sortBy      = null;
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

                if(!checkObjectIDs(eventID)){
                    conditionObj.event = eventID;
                }else{
                    conditionObj.company = companyID;
                }

                if(!isNaN(type) && [1,2].includes(Number(type))){
                    conditionObj.type = type;
                }

                if(!isNaN(status) && [1,2].includes(Number(status))){
                    conditionObj.status = status;
                }

                if(keyword){
                    keyword = stringUtils.removeAccents(keyword)
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');
                    conditionObj.namecv = regSearch
                }
                // console.log(conditionObj)

                let conditionObjOrg = { ...conditionObj }

				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await CRM__VNG_FUND_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });

					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await CRM__VNG_FUND_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await CRM__VNG_FUND_COLL.count(conditionObjOrg);
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

    /**
     * Name: Gom nhóm theo thuộc tính
     * Author: Hiepnh
     * Date: 21/9/2022
     */
    getListByProperty({ userID, option, year, month, companyID }){
        return new Promise(async resolve => {
            try {
                let yearFilter
                let currentYear = new Date().getFullYear()
                if(year && !isNaN(year)){
                    yearFilter = Number(year)
                }else{
                    yearFilter = Number(currentYear)
                }

                let listData 
                if(!option){
                    listData = await CRM__VNG_FUND_COLL.aggregate([
                        {
                            $match: {
                                company: ObjectID(companyID),
                            }
                        },
                        {
                            $group: {
                                _id: { type: "$type" },
                                amount: { $sum: "$amount" },
                            }
                        },
                    ])
                }else{
                    listData = await CRM__VNG_FUND_COLL.aggregate([
                        {
                            $match: {
                                company: ObjectID(companyID),
                            }
                        },
                        {
                            $group: {
                                _id: { type: "$type",  },
                                amount: { $sum: "$amount" },
                            }
                        },
                    ])
                }

                return resolve({ error: false, data: listData })

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Dev: HiepNH
     * Name: Download Template Excel
     * Date: 25/11/2024
     */
    exportExcel({ option, companyID, year, month, email, userID }) {
       return new Promise(async resolve => {
           try {


           } catch (error) {
               return resolve({ error: true, message: error.message, status: 500 });
           }
       })
    }
}

exports.MODEL = new Model