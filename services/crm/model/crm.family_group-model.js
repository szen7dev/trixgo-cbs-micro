"use strict";

const BaseModel                         = require('../../../tools/db/base_model.js');
const ObjectID                          = require('mongoose').Types.ObjectId;
const XlsxPopulate                      = require('xlsx-populate')
const fs                                = require('fs')
const path                              = require('path')
const { uploadFileS3 }                  = require('../../../tools/s3/index.js')
const moment                            = require('moment');

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		            = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_REMINDER }                   = require('../../reminder/helper/reminder.actions-constant');
// const { CF_ACTIONS_ANALYSIS }                   = require('../../analysis/helper/analysis.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const {
  checkObjectIDs,
  IsJsonString,
}  = require('../../../tools/utils/utils.js');
const stringUtils					    = require('../../../tools/utils/string_utils.js')
// const { CRM_PERMISSION }                = require('../helper/crm.keys-constant.js')

const { TEMPLATE_NOTIFICATION } = require('../../../tools/constants/index.js');

/**
 * COLLECTIONS
 */
const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll.js')
const CRM_FAMILY_GROUP_COLL             = require('../database/crm.family_group-coll')
const ITEM__CONTACT_COLL                = require('../../item/database/item.contact-coll')

class Model extends BaseModel {

    constructor() {
        super(CRM_FAMILY_GROUP_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 19/12/2025
     */
    insert({
        userID, companyID, name,
    }) {
        return new Promise(async resolve => {
            try {
                if(!name)
                    return resolve({ error: true, message: "Dữ liệu không hợp lệ", keyError: "Request params name invalid" })

                let dataInsert = {
                    userCreate: userID,
                    company: companyID,
                    name,
                    admins: [userID],
                    members: [userID]
                }

                let infoAfterInsert = await this.insertData(dataInsert)
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" })

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Update
     * Author: HiepNH
     * Code: 19/12/2025
     */
    update({ userID, groupID, name, memberAddID, memberRemoveID }){
        return new Promise(async (resolve) => {
            try {
                let dataUpdate = {
                    userUpdate: userID,
                    modifyAt: Date.now(),
                }

                if(name && name != ""){
                    dataUpdate.name = name;
                }

                if(memberAddID && checkObjectIDs(memberAddID)){
                    dataUpdate.$addToSet = {
                        members: memberAddID,
                    }
                }

                if(memberRemoveID && checkObjectIDs(memberRemoveID)){
                    dataUpdate.$pull = {
                        members: memberRemoveID,
                    }
                }
    
                let infoAfterUpdate = await CRM_FAMILY_GROUP_COLL.findByIdAndUpdate(groupID, dataUpdate, { new: true })
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
     * Name: get info
     * Author: HiepNH
     * Code: 19/12/2025
     */
    getInfo({ groupID, select, populates }) {
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

                let infoAterGet = await CRM_FAMILY_GROUP_COLL.findById(groupID)
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
     * Name  : Danh sách
     * Author: HiepNH
     * Code  : 19/12/2025
     */
    getList({ companyID, userID, keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = { company: companyID };
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

				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }
                // console.log(conditionObj)

                let conditionObjOrg = { ...conditionObj }

				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await CRM_FAMILY_GROUP_COLL.findById(lastestID);
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

                let infoDataAfterGet = await CRM_FAMILY_GROUP_COLL.find(conditionObj)
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

                let totalRecord = await CRM_FAMILY_GROUP_COLL.count(conditionObjOrg);
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

exports.MODEL = new Model