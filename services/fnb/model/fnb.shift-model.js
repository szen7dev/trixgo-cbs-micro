"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString, validateParamsObjectID }
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const { KEY_ERROR }			            = require('../../../tools/keys');

const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { template } = require('lodash');

/**s
 * import inter-coll, exter-coll
 */
const ITEM__FUNDA_COLL            			   = require('../../item/database/item.funda-coll');
const FNB_ORDER_COLL                           = require('../database/fnb.order-coll');
const FNB_PRODUCT_COLL                         = require('../database/fnb.product-coll');
const FNB_ORDER_PRODUCT_COLL                   = require('../database/fnb.order_product-coll');
const FNB_SHIFT_COLL                           = require('../database/fnb.shift-coll');
const FNB_MISTAKE_COLL                         = require('../database/fnb.mistake-coll');
const FNB_QUOTA_COLL                           = require('../database/fnb.quota-coll');
const FNB_ORDER_MATERIAL_COLL                  = require('../database/fnb.order_material-coll');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {

    constructor() {
        super(FNB_SHIFT_COLL);
    }

    /**
     * Name: Insert 
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert({ fundaID, name, note, campaign, seasons, shiftType, workingHours, staffsID, openingCash, incurredCash, closingCash, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(fundaID) || !name)
                    return resolve({ error: true, message: 'fundaID|name invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                // Thông tin cửa hàng
                let infoFunda = await ITEM__FUNDA_COLL.findById(fundaID)
                if (!infoFunda) 
                    return resolve({ error: true, message: 'cannot_get_info_funda' });

                let dataInsert = { 
                    company: infoFunda.company, 
                    funda: fundaID, 
                    name, 
                    userCreate: userID 
                };

                if(note && note != ""){
                    dataInsert.note = note;
                }

                if(staffsID && checkObjectIDs(staffsID)){
                    dataInsert.staffs = staffsID;
                }

                if(campaign && !isNaN(campaign)){
                    dataInsert.campaign = Number(campaign)
                }

                if(seasons && !isNaN(seasons)){
                    dataInsert.seasons = Number(seasons)
                }

                if(shiftType && !isNaN(shiftType)){
                    dataInsert.shiftType = Number(shiftType)
                }

                if(workingHours && !isNaN(workingHours)){
                    dataInsert.workingHours = Number(workingHours)
                }

                if(openingCash && !isNaN(openingCash)){
                    dataInsert.openingCash = Number(openingCash)
                }

                if(incurredCash && !isNaN(incurredCash)){
                    dataInsert.incurredCash = Number(incurredCash)
                }

                if(closingCash && !isNaN(closingCash)){
                    dataInsert.closingCash = Number(closingCash)
                }
                
                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: 'Thêm thất bại', keyError: KEY_ERROR.INSERT_FAILED });

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: update group 
     * Author: Depv
     * Code:
     */
    update({ shiftID, staffsID, name, note, campaign, seasons, shiftType, workingHours, openingCash, incurredCash, closingCash, userID }) {
        console.log({ shiftID, staffsID, name, note, campaign, seasons, shiftType, workingHours, openingCash, incurredCash, closingCash, userID })
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(shiftID))
                    return resolve({ error: true, message: 'shiftID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let dataInUpdate = { userUpdate: userID, modifyAt: new Date() };

                if(name && name != ""){
                    dataInUpdate.name =name;
                }

                if(note && note != ""){
                    dataInUpdate.note =note;
                }

                if(campaign && !isNaN(campaign)){
                    dataInUpdate.campaign = Number(campaign)
                }

                if(seasons && !isNaN(seasons)){
                    dataInUpdate.seasons = Number(seasons)
                }

                if(shiftType && !isNaN(shiftType)){
                    dataInUpdate.shiftType = Number(shiftType)
                }

                if(workingHours && !isNaN(workingHours)){
                    dataInUpdate.workingHours = Number(workingHours)
                }

                if(staffsID && checkObjectIDs(staffsID)){
                    dataInUpdate.staffs = staffsID;
                }

                if(openingCash && !isNaN(openingCash)){
                    dataInUpdate.openingCash = Number(openingCash)
                }

                if(incurredCash && !isNaN(incurredCash)){
                    dataInUpdate.incurredCash = Number(incurredCash)
                }

                if(closingCash && !isNaN(closingCash)){
                    dataInUpdate.closingCash = Number(closingCash)
                }

                console.log({ dataInUpdate })

                let infoAfterUpdate = await FNB_SHIFT_COLL.findByIdAndUpdate(shiftID, dataInUpdate, { new: true });

                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: remove group 
     * Author: Depv
     * Code:
     */

    /**
     * Name: remove many 
     * Author: Depv
     * Code:
     */

    /**
     * Name: get info user_pcm_plan_group 
     * Author: Depv
     * Code:
     */
    getInfo({ shiftID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(shiftID))
                    return resolve({ error: true, message: 'param_invalid' });

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

                let infoPlanGroup = await FNB_SHIFT_COLL.findById(shiftID)
                                    .select(select)
                                    .populate(populates)

                if (!infoPlanGroup) return resolve({ error: true, message: 'cannot_get', keyError: KEY_ERROR.GET_INFO_FAILED });

                return resolve({ error: false, data: infoPlanGroup });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name  : Danh sách user_pcm_plan_group 
     * Author: Depv
     * Code  :
     */
     getList({ companyID, fundaID, keyword, limit = 10, lastestID, select, populates, sortKey, userID }) {
        console.log({ companyID, fundaID, keyword, limit, lastestID, select, populates, sortKey, userID })
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = { company: ObjectID(companyID) }
                let sortBy;
                let keys	 = ['createAt__-1', '_id__-1'];

                // Gom nhóm theo đơn vị cơ sở
                if(fundaID ){
                    conditionObj.funda = ObjectID(fundaID)
                }else{
                    conditionObj.company = ObjectID(companyID)
                }

                // Làm rõ mục đích để làm gì?
                if (sortKey && typeof sortKey === 'string') {
                    if (!IsJsonString(sortKey))
                        return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                    keys = JSON.parse(sortKey);
                }
                console.log(conditionObj)

                /**
                 * ĐIỀU KIỆN KHÁC
                 */
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

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');

                    conditionObj.$or = [
                        { name: regSearch },
                        { sign: regSearch },
                    ]
                }

                if(select && typeof select === 'string'){
                    if(!IsJsonString(select))
                        return resolve({ error: true, message: 'Request params select invalid', status: 400 });

                    select = JSON.parse(select);
                }
 
                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await FNB_SHIFT_COLL.findById(lastestID);
                    if(!infoData)
                        return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort.data.find;
                    sortBy        = dataPagingAndSort.data.sort;
                }else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy                = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await FNB_SHIFT_COLL.find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]?._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await FNB_SHIFT_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: limit,
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
     * Name: Danh sách
     * - Theo gói thầu (hợp đồng)
     * - Theo ngày tháng tạo/hoàn thành (from-to)
     * - Theo Nhóm công tác con-khu vực con
     * Author: HiepNH
     * Code: 2/10/2022
     */
    getListByProperty({ option, optionGroup, optionTime, fundasID, year,
        keyword, limit, lastestID, select, populates, sortKey, userID }) { 
        // console.log({ option, fundasID,
        //     keyword, limit, lastestID, select, populates, sortKey, userID })
        return new Promise(async (resolve) => {
            try {
                if(!option){
                    
                }else{
                    
                    /**
                     * VALIDATION (1)
                     */
                    const validation = validateParamsObjectID({
                        fundasID            : { value: fundasID, isRequire: false },
                    });
                    if(validation.error) return resolve(validation);

                    let conditionObj = {}
                    let conditionGroup = {}
                    let conditionObjYear = {}, conditionPopulate = {}, sortBy = {"amount": 1}

                    // Gom nhóm theo đơn vị cơ sở
                    if(fundasID && fundasID.length ){
                        let arrFun = fundasID.map(item=>ObjectID(item))
                        conditionObj.funda = { $in: arrFun }
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

                    /**
                     * Tính tổng
                     */
                    if(option && Number(option) == 1){
                        if(optionGroup && Number(optionGroup) == 1){
                            conditionGroup = {
                                _id: { funda: "$funda", hour: "$hour", shift: "$shift", mistake: "$mistake", internal: "$internal", salesChannel: "$salesChannel", paymentMethod: "$paymentMethod", customer: "$customer" },
                                quantity: { $sum: 1 },
                                amount: { $sum: "$amount" },
                                numberOfProducts: { $sum: "$numberOfProducts" },
                            }

                        }
                    }

                    /**
                     * Gom nhóm theo thời gian
                     */
                    if(option && Number(option) == 2){
                        // Theo năm
                        if(optionTime && Number(optionTime) == 1){
                            conditionGroup = {
                                _id: { year: "$year" },
                                quantity: { $sum: 1 },
                                amount: { $sum: "$amount" },
                                numberOfProducts: { $sum: "$numberOfProducts" },
                            }
                        }
                        
                        // Theo tháng
                        if(optionTime && Number(optionTime) == 2){
                            if(!isNaN(year) && Number(year) >= 0){
                                conditionObjYear = {
                                    "year": Number(year),
                                }
                            }
    
                            conditionGroup = {
                                _id: { month: "$month", year: "$year" },
                                quantity: { $sum: 1 },
                                amount: { $sum: "$amount" },
                                numberOfProducts: { $sum: "$numberOfProducts" },
                            }
                        }  

                        // Theo giờ
                        if(optionTime && Number(optionTime) == 3){
                            if(!isNaN(year) && Number(year) >= 0){
                                conditionObjYear = {
                                    "year": Number(year),
                                }
                            }
    
                            conditionGroup = {
                                _id: { funda: "$funda", hour: "$hour" },
                                quantity: { $sum: 1 },
                                amount: { $sum: "$amount" },
                                numberOfProducts: { $sum: "$numberOfProducts" },
                            }
                        } 
                    }
                
                    console.log(conditionObj)
                    console.log(conditionObjYear)
                    console.log(conditionGroup)

                    // Danh sách đang triển khai
                    let listData = await FNB_SHIFT_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project : {
                                year : {$year : "$createAt"},
                                month : {$month : "$createAt"},
                                hour : {$hour : "$createAt"},
                                funda : 1,
                                amount : 1,
                                vatAmount : 1,
                                numberOfProducts : 1,
                                internal : 1,
                                shift : 1,
                                mistake : 1,
                                salesChannel : 1,
                                paymentMethod : 1,
                                customer : 1,
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

                    // if(!isNaN(option) && [3,4].includes(Number(option))){
                    //     await INSPECTION__DOC_COLL.populate(listData, conditionPopulate)
                    // }

                    return resolve({ error: false, data: listData });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;