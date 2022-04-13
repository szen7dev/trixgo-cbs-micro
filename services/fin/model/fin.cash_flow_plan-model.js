"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const ObjectID                          = require('mongoose').Types.ObjectId;
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

/**
 * import inter-coll, exter-coll
 */
const FIN__CASH_FLOW_PLAN_COLL          = require('../database/fin.cash_flow_plan-coll');

const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index')
const { KEY_ERROR }                     = require('../../../tools/keys/index')

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {
    constructor() {
        super(FIN__CASH_FLOW_PLAN_COLL);
    }

    /**
     * Name: Insert ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    insert({ companyID, fundaID, projectID, contractID, parentID, type, property, priority, outin, name, sign, note, date, value, realDate, realValue, userID, ctx }) {
        return new Promise(async (resolve) => {
            try {
                if(!name || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'param_not_valid' })

                let dataInsert = { userCreate: userID, company: companyID, outin, name, date, value, admins: [userID], members: [userID] };

                if(checkObjectIDs(projectID)){
                    dataInsert.project = projectID
                }

                if(checkObjectIDs(contractID)){
                    const infoContract = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_GET_INFO_AND_GET_LIST}`, {
                        contractID
                    })

                    // Trường hợp lập kế hoạch cho Hợp đồng của Dự án thuộc công ty khác
                    if(infoContract){
                        const { outin, real, field, chair, personInCharge, buyerInfo, sellerInfo, company, project } = infoContract.data;

                        dataInsert.outin = outin
                        dataInsert.real = real
                        dataInsert.field = field
                        dataInsert.chair = chair
                        dataInsert.personInCharge = personInCharge
                        dataInsert.buyerInfo = buyerInfo
                        dataInsert.sellerInfo = sellerInfo
                        dataInsert.company = company
                        dataInsert.project = project
                        dataInsert.contract = contractID
                    }
                }

                if(checkObjectIDs(fundaID)){
                    dataInsert.funda = funda;
                }

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }

                if(!isNaN(type)){
                    dataInsert.type = Number(type);
                }

                if(!isNaN(property)){
                    dataInsert.property = Number(property);
                }

                if(!isNaN(priority) && [1,2].includes(priority)) {
                    dataInsert.priority = priority;
                }

                if(sign){
                    dataInsert.sign = sign;
                }

                if(note){
                    dataInsert.note = note;
                }

                if(realDate){
                    dataInsert.realDate = realDate;
                }

                if(!isNaN(realValue) && Number(realValue) >= 0){
                    dataInsert.realValue = realValue;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 });

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Update ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    update({ cashFlowID, contractID, name, sign, note, date, value, realDate, realValue, priority, userID, ctx }){
        return new Promise(async (resolve) => {
            try {
                if(!name || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'param_not_valid' })

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID, name };

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(cashFlowID))
                    return resolve({ error: true, message: "Mã không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID })

                if(checkObjectIDs(contractID)){
                    const infoContract = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_GET_INFO_AND_GET_LIST}`, {
                        contractID
                    })

                    // Trường hợp lập kế hoạch cho Hợp đồng của Dự án thuộc công ty khác
                    if(infoContract){
                        const { outin, real, field, chair, personInCharge, buyerInfo, sellerInfo, company, project } = infoContract.data;
                        dataUpdate.outin = outin
                        dataUpdate.real = real
                        dataUpdate.field = field
                        dataUpdate.chair = chair
                        dataUpdate.personInCharge = personInCharge
                        dataUpdate.buyerInfo = buyerInfo
                        dataUpdate.sellerInfo = sellerInfo
                        dataUpdate.company = company
                        dataUpdate.project = project
                        dataInsert.contract = contractID
                    }
                }

                if(date){
                    dataUpdate.date =date;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(!isNaN(priority) && [1,2].includes(priority)) {
                    dataUpdate.priority = priority;
                }

                if(!isNaN(value) && Number(value) >= 0){
                    dataUpdate.value     = value;
                }

                if(realDate){
                    dataUpdate.realDate =realDate;
                }

                if(!isNaN(realValue) && Number(realValue) >= 0){
                    dataUpdate.realValue     = realValue;
                }

                let infoAfterUpdate = await FIN__CASH_FLOW_PLAN_COLL.findByIdAndUpdate(cashFlowID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Remove
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    remove({ cashFlowsID, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(cashFlowsID))
                    return resolve({ error: true, message: 'param_cashFlowsID_invalid', status: 400 });

                if(!checkObjectIDs([userID]))
                    return resolve({ error: true, message: 'param_userID_invalid', status: 400 });

                const infoAfterDelete = await FIN__CASH_FLOW_PLAN_COLL.deleteMany({
                    _id: {
                        $in: cashFlowsID
                    },
                    userCreate: userID
                })

                return resolve({ error: false, data: infoAfterDelete, status: 201 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Get info ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
     getInfo({ cashFlowID,
        select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(cashFlowID))
                    return resolve({ error: true, message: 'param_invalid' });

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

                let info = await FIN__CASH_FLOW_PLAN_COLL.findById(cashFlowID)
                    .select(select)
                    .populate(populates)
                    .lean();

				if (!info) return resolve({ error: true, message: 'cannot_get' });

                return resolve({ error: false, data: info });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Get list ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getList({ companyID, projectID, contractID, parentID, outin, type, property, priority,
        keyword, limit = 50, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {

                if(limit > 50){
                    limit = 50
                }else{
                    limit = +limit;
                }

                /**
                 * DECALARTION VARIABLE (1)
                 */
                 let sortBy;
                 let conditionObj = {};
                 let keys	     = ['createAt__-1', '_id__-1'];

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                // POPULATE
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
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                if(outin){
                    conditionObj.outin = outin
                }
                if(!isNaN(type)){
                    conditionObj.type = Number(type);
                }
                if(!isNaN(property)){
                    conditionObj.property = Number(property);
                }
                if(!isNaN(priority)){
                    conditionObj.priority = Number(priority);
                }

                if(checkObjectIDs(companyID)){
                    conditionObj.company = companyID
                }
                if(checkObjectIDs(projectID)){
                    conditionObj.project = projectID
                }
                if(checkObjectIDs(contractID)){
                    conditionObj.contract = contractID
                }
                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                }
                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
                if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await FIN__CASH_FLOW_PLAN_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await FIN__CASH_FLOW_PLAN_COLL.find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                // GET TOTAL RECORD
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await FIN__CASH_FLOW_PLAN_COLL.count(conditionObjOrg);
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