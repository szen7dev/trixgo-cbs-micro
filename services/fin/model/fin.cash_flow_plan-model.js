"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const ObjectID                          = require('mongoose').Types.ObjectId;
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');
const { CF_ACTIONS_AUTH } 		        = require('../../auth/helper/auth.actions-constant');

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
    insert({ companyID, fundaID, projectID, contractID, parentID, type, property, priority, outin, name, openingBalance, arising, closingBalance, sign, note, date, value, realDate, realValue, userID, ctx }) {
        const that = this
        return new Promise(async (resolve) => {
            try {
                if(!name || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'param_not_valid' })

                let dataInsert = { userCreate: userID, company: companyID, outin, name, date, value, admins: [userID], members: [userID] };

                if(checkObjectIDs(projectID)){
                    let infoProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
                        departmentID: projectID
                    })
                    // console.log(infoProject)

                    // Trường hợp lập kế hoạch cho Dự án thuộc công ty khác
                    if(infoProject){
                        dataInsert.project = projectID
                        dataInsert.company = infoProject.data.company
                    }
                }

                if(checkObjectIDs(contractID)){
                    let infoContract = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_GET_INFO_AND_GET_LIST}`, {
                        contractID
                    })

                    // Trường hợp lập kế hoạch cho Hợp đồng của Dự án thuộc công ty khác
                    if(infoContract){
                        let { outin, real, field, chair, personInCharge, buyerInfo, sellerInfo, company, project } = infoContract.data;

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

                // Nếu được tạo từ phần tử cha => lấy company theo phần tử cha
                if(checkObjectIDs(parentID)){
                    let infoParent = await FIN__CASH_FLOW_PLAN_COLL.findById(parentID)
                    console.log(infoParent)
                    if(infoParent){
                        let { company } = infoParent;

                        dataInsert.parent = parentID;
                        dataInsert.company = company;
                    }
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

                // Cập nhật lại phần tử cha
                if(checkObjectIDs(parentID)){
                    await that.updateValue({cashFlowID: parentID, userID})
                }

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
        const that = this
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'param_not_valid' })

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };

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
                    if(infoContract && !infoContract.error){
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
                        dataUpdate.contract = contractID
                    }
                }

                if(name) {
                    dataUpdate.name = name;
                }

                if(date){
                    dataUpdate.date = date;
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
                    dataUpdate.realDate = realDate;
                }

                if(!isNaN(realValue) && Number(realValue) >= 0){
                    dataUpdate.realValue     = realValue;
                }

                let infoAfterUpdate = await FIN__CASH_FLOW_PLAN_COLL.findByIdAndUpdate(cashFlowID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

                infoAfterUpdate = await FIN__CASH_FLOW_PLAN_COLL.populate(infoAfterUpdate, {
                    path: 'contract',
                    select: '_id sellerInfo',
                    populate: {
                        path: 'sellerInfo',
                        select: '_id name',
                    }
                })

                // Cập nhật lại phần tử cha
                if(checkObjectIDs(infoAfterUpdate.parent)){
                    await that.updateValue({cashFlowID: infoAfterUpdate.parent, userID})
                }

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
    // remove({ cashFlowsID, userID }) {
    //     return new Promise(async resolve => {
    //         try {
    //             if(!checkObjectIDs(cashFlowsID))
    //                 return resolve({ error: true, message: 'param_cashFlowsID_invalid', status: 400 });

    //             if(!checkObjectIDs([userID]))
    //                 return resolve({ error: true, message: 'param_userID_invalid', status: 400 });

    //             const infoAfterDelete = await FIN__CASH_FLOW_PLAN_COLL.deleteMany({
    //                 _id: {
    //                     $in: cashFlowsID
    //                 },
    //                 userCreate: userID
    //             })

    //             return resolve({ error: false, data: infoAfterDelete, status: 201 });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message, status: 500 });
    //         }
    //     })
    // }

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
    getList({ userID, companyID, projectID, contractID, parentID, outin, type, property, priority,
        keyword, limit = 50, lastestID, select, populates= {} }) {
        console.log({ userID, companyID, projectID, contractID, parentID, outin, type, property, priority })
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
                 let keys	     = ['createAt__1', '_id__1'];

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

                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID
                } else{
                    conditionObj = { members: { $in: [userID] } }
                    conditionObj.parent = { $exists: false }

                    if(checkObjectIDs(contractID)){
                        // conditionObj = { members: { $in: [userID] } }
                        // conditionObj.parent = { $exists: false }
                        conditionObj.contract = contractID
                    }else{
                        if(checkObjectIDs(projectID)){
                            // conditionObj = { members: { $in: [userID] } }
                            // conditionObj.parent = { $exists: false }
                            conditionObj.project = projectID
                        }else{
                            // conditionObj = { members: { $in: [userID] } }
                            // conditionObj.parent = { $exists: false }
                            conditionObj.company = companyID
                        }
                    }
                }
                console.log(conditionObj)

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
                    limit,
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
     * Name  : Cập nhật giá trị khi chi tiết thay đổi ✅
     * Author: Hiepnh
     * Date  : 14/4/2022
     */
    updateValue({
        cashFlowID, userID
    }){
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Cập nhật kế hoạch
                 * 2-Cập nhật thực tế
                 */
                if(!checkObjectIDs(cashFlowID))
                    return resolve({ error: true, message: "Mã hiệu không đúng", keyError: "cashFlowID_invalid" });

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
                 let listData = await FIN__CASH_FLOW_PLAN_COLL.aggregate([
                    {
                        $match: {
                            parent: ObjectID(cashFlowID),
                        }
                    },
                    {
                        $group: {
                            _id: { },
                            value: { $sum: "$value" },
                            realValue: { $sum: "$realValue" },
                        }
                    },
                ])
                if(listData && listData.length){
                    dataUpdate.value = Number(listData[0].value)
                    dataUpdate.realValue = Number(listData[0].realValue)
                }

                let infoAfterUpdate = await FIN__CASH_FLOW_PLAN_COLL.findByIdAndUpdate(cashFlowID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_budget", status: 403 });

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /*
     * Name: Gom nhóm theo thuộc tính ✅
     * Author: Hiepnh
     * Date: 17/04/2022
     */
    getAmountByProperty({ userID, companyID, parentID, projectID, contractID, outin, year, type, property, option, ctx }){
        console.log('=========>Tham số đầu vào')
        console.log({ userID, companyID, parentID, projectID, outin, year, type, property, option })
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * Tham số của option:
                 * 1-Tổng hợp các công ty mà user được quyền truy cập báo cáo quản trị
                 * 2-Tổng hợp của công ty user
                 * 3-Tổng hợp theo kế hoạch cụ thể
                 * 4-Tổng hợp theo dự án
                 * 5-Tổng hợp theo hợp đồng
                 */
                let conditionObj = {}, conditionGroup = {}, conditionObjYear = {}, conditionPopulate = {}, sortBy = {"_id.realValue": -1}

                if (isNaN(type) || isNaN(property) || isNaN(Number(option)) || ![1,2,3,4,5].includes(Number(option)))
                    return resolve({ error: true, message: "Tham số type|property|option không hợp lệ", keyError: "option_invalid" })

                // Cấu hình gom nhóm mặc định
                conditionGroup = {
                    _id: { outin: "$outin" },
                    value: { $sum: "$value" },
                    realValue: { $sum: "$realValue" }
                }               

                // 1-Tổng hợp các công ty mà user được quyền truy cập báo cáo quản trị
                if(Number(option) === 1){
                    console.log('1-Tổng hợp các công ty mà user được quyền truy cập báo cáo quản trị')
                    let listCompany = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.APP_MENU_GET_LIST_COMPANY}`, {
                        appID: "5dfe4bc751dc622100bb9d8a", menuID: "623f2465e998e94feda0cdaa", type: "1"
                    })

                    console.log(listCompany)

                    if(listCompany){
                        let listActiveParent = await FIN__CASH_FLOW_PLAN_COLL.find({ 
                            type: Number(type), 
                            property: Number(property), 
                            parent: {$exists: false}, // Không lấy các phần tử cha-Kế hoạch tổng
                            company: {$in: listCompany.data.map(item=>item._id.company._id)} 
                        })
                        
                        conditionObj.parent = {$in: listActiveParent.map(item=>item._id)}
    
                        conditionGroup = {
                            _id: { outin: "$outin", company: "$company" },
                            value: { $sum: "$value" },
                            realValue: { $sum: "$realValue" }
                        }
                    }
                }

                // 2-Tổng hợp của công ty user
                if(Number(option) === 2){
                    console.log('2-Tổng hợp của công ty user')
                    let listActiveParent = await FIN__CASH_FLOW_PLAN_COLL.find({ 
                        type: Number(type), 
                        property: Number(property), 
                        parent: {$exists: false},// Không lấy các phần tử cha-Kế hoạch tổng
                        company: companyID 
                    })
                    console.log(listActiveParent)
                    
                    conditionObj.parent = {$in: listActiveParent.map(item=>item._id)}
                }

                // 3-Tổng hợp theo kế hoạch cụ thể
                if(Number(option) === 3 && parentID && checkObjectIDs(parentID)){
                    console.log('3-Tổng hợp theo kế hoạch cụ thể')
                    if(parentID && checkObjectIDs(parentID)){
                        conditionObj.parent = ObjectID(parentID)
                    }
                }

                // 4-Tổng hợp theo dự án
                if(Number(option) === 4 && projectID && checkObjectIDs(projectID)){
                    console.log('4-Tổng hợp theo dự án')
                    if(projectID && checkObjectIDs(projectID)){
                        conditionObj.project = ObjectID(projectID)
                    }
                }

                // 5-Tổng hợp theo hợp đồng
                if(Number(option) === 5 && contractID && checkObjectIDs(contractID)){
                    console.log('5-Tổng hợp theo hợp đồng')
                    if(contractID && checkObjectIDs(contractID)){
                        conditionObj.contract = ObjectID(contractID)
                    }
                }

                // Thống kê theo biểu đồ (tháng/năm)
                if(!isNaN(year) && Number(year) > 0){
                    conditionObjYear = {
                        "year": Number(year),
                    }

                    conditionGroup = {
                        _id: {outin: "$outin", month: "$month", year: "$year" },
                        value: { $sum: "$value" },
                        realValue: { $sum: "$realValue" }
                    }
                }

                console.log(conditionObj)
                console.log(conditionGroup)

                let listData = await FIN__CASH_FLOW_PLAN_COLL.aggregate([
                    {
                        $match: conditionObj
                    }, 
                    {
                        $project : { 
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                            parent: 1,
                            company: 1,
                            value: 1,
                            realValue: 1,
                            type: 1,
                            property: 1,
                            outin: 1,
                        }
                    },
                    {
                        $match: conditionObjYear
                    }, 
                    {
                        $group: conditionGroup
                    }, 
                    {
                        $sort: sortBy
                    } 
                ])

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model;