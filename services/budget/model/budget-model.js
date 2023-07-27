"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const { isValidDate }                   = require('../../../tools/utils/time_utils');

const ObjectID                          = require('mongoose').Types.ObjectId;
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ACCOUNTING } 		= require('../../accounting/helper/accounting.actions-constant');

/**
 * import inter-coll, exter-coll
 */
const BUDGET_COLL                      = require('../database/budget-coll');
const BUDGET__ITEM_COLL                = require('../database/budget.item-coll');
const BUDGET__GROUP_COLL               = require('../database/budget.group-coll');
const BUDGET__WORK_COLL                = require('../database/budget.work-coll');

const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index')
const { KEY_ERROR }                     = require('../../../tools/keys/index')

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {
    constructor() {
        super(BUDGET_COLL);
    }

    /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    insert({ userID, companyID, type, projectID, contractID, name, sign, description, date, note, revenue, vatRevenue, forecastRevenue, forecastVatRevenue, finalRevenue, finalVatRevenue }) {
        return new Promise(async (resolve) => {
            try {

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = { userCreate: userID, company: companyID, admins: [userID], members: [userID] };

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(checkObjectIDs(projectID)){
                    dataInsert.project = projectID
                }

                if(checkObjectIDs(contractID)){
                    dataInsert.contract = contractID
                }

                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                if(type && [1,2,3].includes(Number(type))){
                    dataInsert.type = type;
                }

                if(name){
                    dataInsert.name = name;
                }

                if(sign){
                    dataInsert.sign = sign;
                }

                if(description){
                    dataInsert.description = description;
                }

                if(date && isValidDate(date)){
                    dataInsert.date = new Date(date);
                }

                if(note){
                    dataInsert.note = note;
                }

                //______Giá trị
                if(!isNaN(revenue) && Number(revenue) >= 0){
                    dataInsert.revenue     = revenue;
                }
                if(!isNaN(vatRevenue) && Number(vatRevenue) >= 0){
                    dataInsert.vatRevenue     = vatRevenue;
                }
                if(!isNaN(forecastRevenue) && Number(forecastRevenue) >= 0){
                    dataInsert.forecastRevenue     = forecastRevenue;
                }
                if(!isNaN(forecastVatRevenue) && Number(forecastVatRevenue) >= 0){
                    dataInsert.forecastVatRevenue     = forecastVatRevenue;
                }
                if(!isNaN(finalRevenue) && Number(finalRevenue) >= 0){
                    dataInsert.finalRevenue     = finalRevenue;
                }
                if(!isNaN(finalVatRevenue) && Number(finalVatRevenue) >= 0){
                    dataInsert.finalVatRevenue     = finalVatRevenue;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại" , keyError: KEY_ERROR.INSERT_FAILED, status: 403 });

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Update 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    update({
        budgetID, type, projectID, contractID, name, sign, description, date, note, revenue, vatRevenue, forecastRevenue, forecastVatRevenue, finalRevenue, finalVatRevenue, userID
    }){
        return new Promise(async (resolve) => {
            try {

                if(!checkObjectIDs(budgetID))
                    return resolve({ error: true, message: "Mã không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID });

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(checkObjectIDs(projectID)){
                    dataUpdate.project = projectID
                }

                if(checkObjectIDs(contractID)){
                    dataUpdate.contract = contractID
                }

                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                if(type && [1,2,3].includes(Number(type))){
                    dataUpdate.type = type;
                }

                if(name){
                    dataUpdate.name = name;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(date){
                    dataUpdate.date = date;
                }

                if(note){
                    dataUpdate.note = note;
                }

                //______Giá trị
                if(!isNaN(revenue) && Number(revenue) >= 0){
                    dataUpdate.revenue     = revenue;
                }
                if(!isNaN(vatRevenue) && Number(vatRevenue) >= 0){
                    dataUpdate.vatRevenue     = vatRevenue;
                }
                if(!isNaN(forecastRevenue) && Number(forecastRevenue) >= 0){
                    dataUpdate.forecastRevenue     = forecastRevenue;
                }
                if(!isNaN(forecastVatRevenue) && Number(forecastVatRevenue) >= 0){
                    dataUpdate.forecastVatRevenue     = forecastVatRevenue;
                }
                if(!isNaN(finalRevenue) && Number(finalRevenue) >= 0){
                    dataUpdate.finalRevenue     = finalRevenue;
                }
                if(!isNaN(finalVatRevenue) && Number(finalVatRevenue) >= 0){
                    dataUpdate.finalVatRevenue     = finalVatRevenue;
                }

                let infoAfterUpdate = await BUDGET_COLL.findByIdAndUpdate(budgetID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     *
     */
    remove({ budgetsID, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs([userID])){
                    return resolve({
                        error: true,
                        message: "Tham số userID không hợp lệ",
                        keyError: "params_userID_invalid",
                        status: 400
                    });
                }

                if(!checkObjectIDs(budgetsID)){
                    return resolve({
                        error: true,
                        message: "Tham số budgetsID không hợp lệ",
                        keyError: "params_budgetsID_invalid",
                        status: 400
                    });
                }

                const infoAfterDelete = await BUDGET_COLL.deleteMany({
                    _id: {
                        $in: budgetsID
                    },
                    userCreate: userID
                })

                return resolve({ error: false, data: infoAfterDelete, status: 201 })
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

    /**
     * Name: Get info 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getInfo({ budgetID,
        select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(budgetID))
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

                let info = await BUDGET_COLL.findById(budgetID)
                                .select(select)
                                .populate(populates)

				if (!info) return resolve({ error: true, message: 'cannot_get' });

                return resolve({ error: false, data: info });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Get list 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getList({ isMember, companyID, projectID, contractID, type, userID,
        keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {

                if(limit > 20){
                    limit = 20
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
                if(type){
                    conditionObj.type = type
                }
                
                if(contractID){
                    conditionObj.contract = contractID
                }else{
                    if(projectID){
                        conditionObj.project = projectID
                    }else{
                        if(companyID){
                            conditionObj.company = companyID
                            conditionObj.members = { $in: [userID] }
                        }
                    }
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
					let infoData = await BUDGET_COLL.findById(lastestID);
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

                let infoDataAfterGet = await BUDGET_COLL.find(conditionObj)
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

                let totalRecord = await BUDGET_COLL.count(conditionObjOrg);
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
     * Name  : Cập nhật giá trị (ngân sách, thực hiện, dự báo) 
     * Author: Hiepnh
     * Date  : 10/4/2022
     */
    updateValue({
        option, budgetID, userID, ctx
    }){
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Cập nhật giá trị ngân sách
                 * 2-Cập nhật dự báo ngân sách
                 * 3-Cập nhật thực hiện ngân sách
                 */

                if(!checkObjectIDs(budgetID))
                    return resolve({ error: true, message: "Mã hiệu không đúng", keyError: "budgetID_invalid" });

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                // Cập nhật Ngân sách theo kế hoạch và dự báo ngân sách
                if(option && Number(option) === 1){
                    let listDataWork = await BUDGET__WORK_COLL.aggregate([
                        {
                            $match: {
                                budget: ObjectID(budgetID),
                            }
                        },
                        {
                            $group: {
                                _id: { },
                                amount: { $sum: "$amount" },
                                vatAmount: { $sum: "$vatAmount" },
                                forecastAmount: { $sum: "$forecastAmount" },
                                forecastVatAmount: { $sum: "$forecastVatAmount" },
                            }
                        },
                    ])
                    if(listDataWork && listDataWork.length){
                        dataUpdate.budget = Number(listDataWork[0].amount)
                        dataUpdate.vatBudget = Number(listDataWork[0].vatAmount)
                        dataUpdate.forecastBudget = Number(listDataWork[0].forecastAmount)
                        dataUpdate.forecastVatBudget = Number(listDataWork[0].forecastVatAmount)
                    }
                }

                // Cập nhật Ngân sách thực hiện
                if(option && Number(option) === 2){
                    const infoImpleBudget = await ctx.call(`${CF_DOMAIN_SERVICES.ACCOUNTING}.${CF_ACTIONS_ACCOUNTING.JOURNAL_CAL_IMPLE_BUDGET}`, {
                        budgetID
                    })
                    // console.log(infoImpleBudget)
                    if(infoImpleBudget){
                        dataUpdate.finalBudget = Number(infoImpleBudget.data.amount)
                    }
                }

                let infoAfterUpdate = await BUDGET_COLL.findByIdAndUpdate(budgetID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_budget", status: 403 });

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;