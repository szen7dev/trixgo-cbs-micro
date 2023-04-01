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
const FNB_GENERAL_BOOK_COLL                    = require('../database/fnb.general_book-coll');
const { takeRight } = require('lodash');

/**
 * import inter-model, exter-model
 */
const FNB_ORDER_PRODUCT_MODEL                  = require('./fnb.order_product-model').MODEL;

class Model extends BaseModel {

    constructor() {
        super(FNB_GENERAL_BOOK_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert({ fundaID, parentID, outin, revenueType, expenseType, appExpenseType, date, name, note, customerID, goodsID, quantity, unitPrice, amount, vatAmount, userID, sign, campaignName }) {
        // console.log({ fundaID, parentID, outin, revenueType, expenseType, date, name, note, customerID, goodsID, quantity, unitPrice, amount, vatAmount, userID })
        const that = this
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * Bước 1: Khởi tạo đơn hàng
                 * Bước 2: Thêm sản phẩm vào đơn hàng => cập nhật giá đơn hàng
                 * Bước 3: Tính Chiết khấu, giảm giá => cập nhật giá đơn hàng
                 * Bước 4: Khởi tạo nguyên liệu sử dụng cho đơn hàng
                 */

                if(!checkObjectIDs(fundaID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'fundaID|name|userID invalid', keyError: KEY_ERROR.PARAMS_INVALID });

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

                if(parentID && checkObjectIDs(parentID)){
                    let infoParent = await FNB_GENERAL_BOOK_COLL.findById(parentID)
                    
                    dataInsert.parent = parentID
                    dataInsert.level = infoParent.level + 1;

                    dataInsert.date = infoParent.date
                }

                if(customerID && checkObjectIDs(customerID)){
                    dataInsert.customer = customerID;
                }

                if(goodsID && checkObjectIDs(goodsID)){
                    dataInsert.goods = goodsID;
                }

                if(date && date != ""){
                    dataInsert.date = date;
                }

                if(note && note != ""){
                    dataInsert.note = note;
                }

                if(!isNaN(outin)){
                    dataInsert.outin = Number(outin);
                }

                if(!isNaN(revenueType)){
                    dataInsert.revenueType = Number(revenueType);
                }

                if(!isNaN(expenseType)){
                    dataInsert.expenseType = Number(expenseType);
                }

                if(!isNaN(quantity)){
                    dataInsert.quantity = Number(quantity);
                }

                if(!isNaN(unitPrice)){
                    dataInsert.unitPrice = Number(unitPrice);
                }

                if(!isNaN(amount)){
                    dataInsert.amount = Number(amount);
                }

                if(!isNaN(vatAmount)){
                    dataInsert.vatAmount = Number(vatAmount);
                }

                if(sign){
                    dataInsert.sign = sign;
                }

                if(campaignName){
                    dataInsert.campaignName = campaignName;
                }

                if(appExpenseType){
                    dataInsert.appExpenseType = appExpenseType;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: 'Thêm thất bại', keyError: KEY_ERROR.INSERT_FAILED });

                /**
                 * CẬP NHẬT GIÁ TRỊ CHO MẨU TIN CHA HOẶC CÁC MẨU TIN CON (KHI UPDATE CHA)
                 */

                /**
                 * CẬP NHẬT GIÁ TRỊ CHO MẨU TIN CHA (KHI UPDATE CON)
                 */
                if(parentID && checkObjectIDs(parentID)){
                    await that.updateValue({ bookID: parentID, userID }) 
                }

                //______Cập nhật amountChilds cho phần tử cha
                if(parentID && checkObjectIDs(parentID)){
                    await FNB_GENERAL_BOOK_COLL.findByIdAndUpdate(parentID, { $inc: { amountChilds: 1 }}, { new: true })
                }    
                
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: Update
     * Author: HiepNH
     * Code: 24/11/2022
     */
    update({ userID,
        bookID, outin, revenueType, expenseType, appExpenseType, date, name, note, customerID, goodsID, quantity, unitPrice, vatAmount, sign, campaignName }) {
        const that = this
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * - Nếu cập nhật Đơn hàng sang trạng thái hủy: status = 5 (Hoàn thành) -> 4 (Hủy)
                 * => Xóa định mức hao phí (fnb_order_material)
                 * => Cập nhật status cho order_product
                 * => Cập nhật khối lượng giao ca...
                 */
                if(!checkObjectIDs(bookID))
                    return resolve({ error: true, message: 'bookID invalid', keyError: KEY_ERROR.PARAMS_INVALID })
                
                let infoBook = await FNB_GENERAL_BOOK_COLL.findById(bookID)

                let dataInUpdate = { userUpdate: userID, modifyAt: new Date() };

                if(name && name != ""){
                    dataInUpdate.name =name;
                }
                if(customerID && checkObjectIDs(customerID)){
                    dataInUpdate.customer = customerID;
                }

                if(goodsID && checkObjectIDs(goodsID)){
                    dataInUpdate.goods = goodsID;
                }

                if(date && date != ""){
                    dataInUpdate.date = date;
                }

                if(note && note != ""){
                    dataInUpdate.note = note;
                }

                if(sign){
                    dataInUpdate.sign = sign;
                }
                
                if(campaignName){
                    dataInUpdate.campaignName = campaignName;
                }
                 
                if(appExpenseType){
                    dataInUpdate.appExpenseType = appExpenseType;
                }

                if(!isNaN(outin)){
                    dataInUpdate.outin = Number(outin);
                }

                if(!isNaN(revenueType)){
                    dataInUpdate.revenueType = Number(revenueType);
                }

                if(!isNaN(expenseType)){
                    dataInUpdate.expenseType = Number(expenseType);
                }

                if(!isNaN(quantity)){
                    dataInUpdate.quantity = Number(quantity);
                }

                if(!isNaN(unitPrice)){
                    dataInUpdate.unitPrice = Number(unitPrice);
                }

                if(!isNaN(quantity && !isNaN(unitPrice))){
                    dataInUpdate.amount = quantity * unitPrice;
                }

                if(!isNaN(vatAmount)){
                    dataInUpdate.vatAmount = Number(vatAmount);
                }

                let infoAfterUpdate = await FNB_GENERAL_BOOK_COLL.findByIdAndUpdate(bookID, dataInUpdate, { new: true });

                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

                /**
                 * CẬP NHẬT GIÁ TRỊ CHO MẨU TIN CHA HOẶC CÁC MẨU TIN CON (KHI UPDATE CHA)
                 */

                /**
                 * CẬP NHẬT GIÁ TRỊ CHO MẨU TIN CHA (KHI UPDATE CON)
                 */
                if(infoBook && infoBook.parent){
                    await that.updateValue({ bookID: infoBook.parent, userID }) 
                }

                /**
                 * Cập nhật tổng chi phí cho Điểm bán
                 * Xây dựng lại hàm tính chi phí (phân biệt chi phí kho, chi phí khác)
                 */
                // let info = await ITEM__FUNDA_COLL.findByIdAndUpdate(infoBook.funda, { $inc: { totalAccExpense: Number(quantity * unitPrice) }}, { new: true })   
                // console.log(info)

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: Update value
     * Author: HiepNH
     * Code: 24/11/2022
     */
    updateValue({ bookID, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(bookID))
                    return resolve({ error: true, message: 'bookID invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let infoBook = await FNB_GENERAL_BOOK_COLL.findById(bookID)
                // console.log('=============>>>>>>>>>>>>>>>>>>')
                // console.log(infoBook)

                let dataInUpdate = { userUpdate: userID, modifyAt: new Date() };

                let amount = 0;
                let listData = await FNB_GENERAL_BOOK_COLL.aggregate([
                    {
                        $match: {
                            parent: ObjectID(bookID)
                        }
                    },
                    {
                        $group: {
                            _id: { },
                            amount: { $sum: "$amount" },
                        }
                    }
                ])
                // console.log('=============>>>>>>>>>>>>>>>>>>')
                // console.log(listData)

                if(listData && listData[0]){
                    amount = Number(listData[0].amount)
                    // console.log({amount})
                }

                dataInUpdate.amount = Number(amount)

                let infoAfterUpdate = await FNB_GENERAL_BOOK_COLL.findByIdAndUpdate(bookID, dataInUpdate, { new: true });
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: Remove
     * Author: HiepNH
     * Code: 24/11/2022
     */

    /**
     * Name: Get info
     * Author: HiepNH
     * Code: 24/11/2022
     */
    getInfo({ bookID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(bookID))
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

                let infoPlanGroup = await FNB_GENERAL_BOOK_COLL.findById(bookID)
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
     * Name  : Get list
     * Author: HiepNH
     * Code: 24/11/2022
     */
    getList({ companyID, fundasID, fromDate, toDate, keyword, limit = 10, lastestID, select, populates, sortKey, userID, parentID }) {
        // console.log({fundasID, fromDate, toDate, keyword, limit, lastestID, select, populates, sortKey, userID, parentID})
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = {}
                let sortBy;
                let keys	 = ['createAt__1', '_id__1'];

                const validation = validateParamsObjectID({
                    fundasID            : { value: fundasID, isRequire: false },
                });
                if(validation.error) return resolve(validation);

                // Gom nhóm theo đơn vị cơ sở
                if(fundasID && fundasID.length ){
                    let arrFun = fundasID.map(item=>ObjectID(item))
                    conditionObj.funda = { $in: arrFun }
                }else{
                    let listFundaIsMember = await ITEM__FUNDA_COLL.find({members: {$in: [userID]}})
                    // console.log(listFundaIsMember)
                    conditionObj.funda = { $in: listFundaIsMember.map(item=>ObjectID(item._id)) }
                }

                // Phân loại theo thời khoảng
                if(fromDate && toDate){
                    conditionObj.createAt = {
                        $gte: new Date(fromDate),
                        $lte: new Date(toDate),
                    }
                }

                if(parentID){
                    conditionObj.parent = parentID;
                }else{
                    conditionObj.parent = { $exists: false };
                }
                console.log({conditionObj});
                // Làm rõ mục đích để làm gì?
                if (sortKey && typeof sortKey === 'string') {
                    if (!IsJsonString(sortKey))
                        return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                    keys = JSON.parse(sortKey);
                }
                // console.log('==================TÌM KIẾM ĐƠN HÀNG===================')
                // console.log(conditionObj)

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
                    let infoData = await FNB_GENERAL_BOOK_COLL.findById(lastestID);
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

                let infoDataAfterGet = await FNB_GENERAL_BOOK_COLL.find(conditionObj)
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
                let totalRecord = await FNB_GENERAL_BOOK_COLL.count(conditionObjOrg);
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
     * Name: Danh sách theo phân loại
     * Author: HiepNH
     * Code: 24/11/2022
     */
    getListByProperty({ companyID, userID, option, optionTime, optionGroup, fundasID, year, fromDate, toDate }) {
        // console.log({companyID, userID, option, optionTime, fundasID, year, fromDate, toDate})
        return new Promise(async (resolve) => {
            try {
                if(!option){
                    // Danh sách
                }else{
                    let yearFilter
                    let currentYear = new Date().getFullYear()
                    if(year && !isNaN(year)){
                        yearFilter = Number(year)
                    }else{
                        yearFilter = Number(currentYear)
                    }

                    let conditionObj = {}
                    let conditionGroup = {}
                    let conditionObjYear = {}, conditionPopulate = {}, sortBy = {"amount": -1}

                    conditionObj.company = ObjectID(companyID) 

                    const validation = validateParamsObjectID({
                        fundasID            : { value: fundasID, isRequire: false },
                    });
                    if(validation.error) return resolve(validation);
    
                    // Gom nhóm theo đơn vị cơ sở
                    if(fundasID && fundasID.length ){
                        // console.log('==============Trường hợp 2222222222===============>')
                        let arrFun = fundasID.map(item=>ObjectID(item))
    
                        if(arrFun.length) {
                            conditionObj.funda = { $in: arrFun };
                        }
                    }else{
                        let listFundaIsMember = await ITEM__FUNDA_COLL.find({members: {$in: [userID]}});
                        let fundasIDIsMember = listFundaIsMember.map(item=>ObjectID(item._id));
                        if(fundasIDIsMember.length) {
                            // console.log('==============Trường hợp 33333333333===============>')
                            conditionObj.funda = { $in: fundasIDIsMember };
                        }else{
                            // console.log('==============Trường hợp 44444444444===============>')
                            conditionObj.funda = { $in: [] }
                        }
                    }

                    // Phân loại theo thời khoảng
                    if(fromDate && toDate){
                        conditionObj.createAt = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate),
                        }
                    }

                    /**
                     * Gom nhóm theo các phân loại căn bản
                     */
                    if(option && Number(option) == 1){
                        if(optionGroup && Number(optionGroup) == 1){
                            conditionGroup = {
                                _id: { },
                                quantity: { $sum: "$quantity" },
                                amount: { $sum: "$amount" }
                            }
                        }

                        if(optionGroup && Number(optionGroup) == 2){
                            conditionGroup = {
                                _id: { outin: "$outin" },
                                quantity: { $sum: "$quantity" },
                                amount: { $sum: "$amount" }
                            }
                        }

                        if(optionGroup && Number(optionGroup) == 3){
                            conditionGroup = {
                                _id: { outin: "$outin", revenueType: "$revenueType", expenseType: "$expenseType", appExpenseType: "$appExpenseType" },
                                quantity: { $sum: "$quantity" },
                                amount: { $sum: "$amount" }
                            }
                        }
                    }

                    /**
                     * Gom nhóm theo thời gian
                     */
                    if(option && Number(option) == 2){
                        // Theo năm
                        if(optionTime && Number(optionTime) == 1){
                            if(optionGroup && Number(optionGroup) == 1){
                                conditionGroup = {
                                    _id: { year: "$year" },
                                    quantity: { $sum: "$quantity" },
                                    amount: { $sum: "$amount" }
                                }
                            }

                            if(optionGroup && Number(optionGroup) == 2){
                                conditionGroup = {
                                    _id: { year: "$year", outin: "$outin" },
                                    quantity: { $sum: "$quantity" },
                                    amount: { $sum: "$amount" }
                                }
                            }
    
                            if(optionGroup && Number(optionGroup) == 3){
                                conditionGroup = {
                                    _id: {  year: "$year", outin: "$outin", revenueType: "$revenueType", expenseType: "$expenseType", appExpenseType: "$appExpenseType" },
                                    quantity: { $sum: "$quantity" },
                                    amount: { $sum: "$amount" }
                                }
                            }
                        }

                        // Theo tháng trong năm
                        if(optionTime && Number(optionTime) == 2){
                            conditionObjYear = {
                                "year": Number(yearFilter),
                            }

                            if(optionGroup && Number(optionGroup) == 1){
                                conditionGroup = {
                                    _id: { month: "$month", year: "$year" },
                                    quantity: { $sum: "$quantity" },
                                    amount: { $sum: "$amount" }
                                }
                            }

                            if(optionGroup && Number(optionGroup) == 2){
                                conditionGroup = {
                                    _id: { month: "$month", year: "$year", outin: "$outin" },
                                    quantity: { $sum: "$quantity" },
                                    amount: { $sum: "$amount" }
                                }
                            }
    
                            if(optionGroup && Number(optionGroup) == 3){
                                conditionGroup = {
                                    _id: {  month: "$month", year: "$year", outin: "$outin", revenueType: "$revenueType", expenseType: "$expenseType", appExpenseType: "$appExpenseType" },
                                    quantity: { $sum: "$quantity" },
                                    amount: { $sum: "$amount" }
                                }
                            }
                        }
                    }

                    /**
                     * Gom nhóm theo đơn vị cơ sở
                     */
                    if(option && Number(option) == 3){
                        if(optionGroup && Number(optionGroup) == 1){
                            conditionGroup = {
                                _id: { funda: "$funda" },
                                quantity: { $sum: "$quantity" },
                                amount: { $sum: "$amount" }
                            }
                        }

                        if(optionGroup && Number(optionGroup) == 2){
                            conditionGroup = {
                                _id: { funda: "$funda", outin: "$outin" },
                                quantity: { $sum: "$quantity" },
                                amount: { $sum: "$amount" }
                            }
                        }

                        if(optionGroup && Number(optionGroup) == 3){
                            conditionGroup = {
                                _id: { funda: "$funda", outin: "$outin", revenueType: "$revenueType", expenseType: "$expenseType", appExpenseType: "$appExpenseType" },
                                quantity: { $sum: "$quantity" },
                                amount: { $sum: "$amount" }
                            }
                        }

                        conditionPopulate = {
                            path: '_id.funda',
                            select: '_id name sign image',
                            model: 'funda'
                        }
                    }

                    // console.log(conditionObj)
                    // console.log(conditionObjYear)
                    // console.log(conditionGroup)

                    // Danh sách đang triển khai
                    let listData = await FNB_GENERAL_BOOK_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project : {
                                year : {$year : "$createAt"},
                                month : {$month : "$createAt"},
                                funda : 1,
                                outin : 1,
                                revenueType : 1,
                                expenseType : 1,
                                appExpenseType : 1,
                                campaignName : 1,
                                date : 1,
                                customer : 1,
                                goods : 1,
                                quantity : 1,
                                amount : 1,
                                createAt : 1,
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

                    if(!isNaN(option) && [3].includes(Number(option))){
                        await FNB_GENERAL_BOOK_COLL.populate(listData, conditionPopulate)
                    }

                    return resolve({ error: false, data: listData });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model