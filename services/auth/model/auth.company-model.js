"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const ObjectID                          = require('mongoose').Types.ObjectId;
const { _isValid }                      = require('../../../tools/utils/utils');
const { KEY_ERROR }                     = require('../../../tools/keys');

const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');

const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const { RANGE_BASE_PAGINATION } 	    = require('../../../tools/cursor_base/playground/index');

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');
/**
 * COLLECTION
 */
const AUTH__COMPANY_COLL                = require('../database/auth.company-coll');

class Model extends BaseModel {

    constructor() {
        super(require('../database/auth.company-coll'));
    }
    
    insert({ name, sign, taxid, address, area, phone, email, userID }) {
        return new Promise(async (resolve) => {
            try {
                let info = await AUTH__COMPANY_COLL.findOne({
                    $or: [
                        { name: name },
                        { sign: sign },
                    ]
                }).select('_id name sign')

                if(info)
                    return resolve({ error: true, message: `Tên/Mã hiệu đã tồn tại: ${info.name}` }); 

                let dataInsert = {
                    name, sign, taxid, address, area, phone, email, userCreate: userID, userUpdate: userID, 
                }

                let infoCompanyAfterSave = await this.insertData(dataInsert);
                if(!infoCompanyAfterSave)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED });

                return resolve({ error: false, data: infoCompanyAfterSave });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    update({ companyID, name, sign, taxid, address, area, phone, email, userID }) {
        return new Promise(async (resolve) => {
            try {
                let infoCompany = await AUTH__COMPANY_COLL.findById(companyID);
                if(!infoCompany)
                    return resolve({ error: true, message: "company_not_exist" });

                // Kiểm tra tên công ty mới thay đổi đã tồn tại mã hiệu hay không ngoại trừ chính nó.
                let info = await AUTH__COMPANY_COLL.findOne({ 
                    _id: { $ne: companyID },
                    $or: [
                        { name: name },
                        { sign: sign },
                    ] 
                });
                if(info)
                    return resolve({ error: true, message: "company_existed" })

                let dataUpdate = {
                    name, sign, taxid,  address, phone, email, userUpdate: userID, modifyAt: new Date()
                }
                if(area && _isValid(area)){
                    dataUpdate.area = area;
                } 

                let infoCompanyAfterUpdate = await AUTH__COMPANY_COLL.findByIdAndUpdate(companyID, dataUpdate, { new: true })

                if(!infoCompanyAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoCompanyAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    getInfo({ companyID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });
                
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
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoAterGet = await AUTH__COMPANY_COLL.findById(companyID)
                                    .select(select)
                                    .populate(populates)
                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info",  keyError: KEY_ERROR.GET_INFO_FAILED, status: 200 });
 
                return resolve({ error: false, data: infoAterGet, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    /**
     * Name  : Danh sách company ✅
     * Author: Depv
     * Code  : 20/12/2021
     */
    getList({ 
        userID, 
        keyword, limit = 10, lastestID, select, populates={} }) { 
        return new Promise(async (resolve) => {
            try {

                if(limit > 20){
                    limit = 20;
                }else{
                    limit = +limit
                }
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {
                };
                let conditionObjOrg = {
                };
                
                let conditionFind = {};
                let sortBy   = { createAt: -1 };
                let objSort  = {};
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
             
                // populate
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
                    conditionObj.$or  = [
                        { name: new RegExp(keyword, 'i') },
                        { sign: new RegExp(keyword, 'i') },
                        { phone: new RegExp(keyword, 'i') },
                    ]
                }

                conditionObjOrg = { ...conditionObj };
                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                // GET CONDITION PAGINATION
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await AUTH__COMPANY_COLL.findById(lastestID);
                    if(!infoData)
                        return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let nextInfo = `${infoData.createAt}_${infoData._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
                    let keys	 = ['createAt__-1', '_id__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    
                    conditionFind = dataPagingAndSort.data.find;
                    sortBy = dataPagingAndSort.data.sort;

                    if(conditionObj.$or){
                        conditionObj.$and = [
                            { $or: conditionObj.$or },
                            { $or: conditionFind.$or },
                        ]
                        delete conditionObj.$or;
                        delete conditionFind.$or;
                    }
                }

                let infoDataAfterGet = await AUTH__COMPANY_COLL.find({ ...conditionObj, ...conditionFind })
                    .select(select)
                    .limit(+limit+1)
                    .populate(populates)
                    .sort(sortBy) 
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
    
                    let totalRecord = await AUTH__COMPANY_COLL.count(conditionObjOrg);
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