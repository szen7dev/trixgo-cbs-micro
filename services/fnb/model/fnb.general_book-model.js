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

class Model extends BaseModel {

    constructor() {
        super(FNB_GENERAL_BOOK_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert({ fundaID, shiftID, parentID, outin, plan, revenueType, expenseType, appExpenseType, date, name, note, customerID, goodsID, quantity, unitPrice, amount, vatAmount, userID, sign, campaignName }) {
        // console.log({ fundaID, parentID, outin, plan, revenueType, expenseType, date, name, note, customerID, goodsID, quantity, unitPrice, amount, vatAmount, userID })
        const that = this
        return new Promise(async resolve => {
            try {
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

                if(customerID && checkObjectIDs(customerID)){
                    dataInsert.customer = customerID;
                }

                if(goodsID && checkObjectIDs(goodsID)){
                    dataInsert.goods = goodsID;
                }

                if(campaignName && checkObjectIDs(campaignName)){
                    dataInsert.campaignName = campaignName;
                }

                if(shiftID && checkObjectIDs(shiftID)){
                    dataInsert.shift = shiftID;
                }

                // if(date && date != ""){
                //     dataInsert.date = date;
                // }

                if(note && note != ""){
                    dataInsert.note = note;
                }

                if(sign && sign != ""){
                    dataInsert.sign = sign;
                }

                if(!isNaN(outin)){
                    dataInsert.outin = Number(outin);
                }

                if(!isNaN(plan)){
                    dataInsert.plan = Number(plan);
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

                /**
                 * BỔ SUNG CÁC THUỘC TÍNH THEO PARENT
                 */
                if(parentID && checkObjectIDs(parentID)){
                    let infoParent = await FNB_GENERAL_BOOK_COLL.findById(parentID)
                    if (!infoParent)
                        return resolve({ error: true, message: 'cannot_get_info_parent' });
                    
                    dataInsert.parent = parentID
                    dataInsert.level = infoParent.level + 1;

                    dataInsert.funda            = infoParent.funda
                    dataInsert.campaignName     = infoParent.campaignName
                    dataInsert.date             = infoParent.date
                    dataInsert.outin            = infoParent.outin
                    dataInsert.plan             = infoParent.plan
                    dataInsert.revenueType      = infoParent.revenueType
                    dataInsert.expenseType      = infoParent.expenseType
                    dataInsert.appExpenseType   = infoParent.appExpenseType
                }

                // Nếu có ngày tháng riêng => Lấy theo ngày tháng
                if(date && date != ""){
                    dataInsert.date = date;
                }

                if(!isNaN(revenueType)){
                    dataInsert.revenueType = Number(revenueType);
                }

                if(!isNaN(expenseType)){
                    dataInsert.expenseType = Number(expenseType);
                }

                if(!isNaN(appExpenseType)){
                    dataInsert.appExpenseType = Number(appExpenseType);
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

                return resolve({ error: false, data: infoAfterInsert })
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    updateFromShift({ shiftID, fundaID, companyID, userID }) {
        // console.log({ shiftID, fundaID, companyID, userID })
        const that = this
        return new Promise(async resolve => {
            try {
                /**
                 * Kiểm tra xem phần tử tồn tại chưa
                 * - Nếu tồn tại rồi thì update
                 * - Nếu chưa thì tạo mới, check parent đưa vào trong
                 */
                let infoBook = await FNB_GENERAL_BOOK_COLL.findOne({ shift: shiftID, parent: { $exists: true, $ne: null }, funda: fundaID, expenseType: 4 })

                if(!infoBook){
                    console.log('=================TH1')
                    let infoRandomParent = await FNB_GENERAL_BOOK_COLL.findOne({ funda: fundaID, parent: { $exists: false }, expenseType: 4 })
                    // console.log(infoRandomParent)
    
                    if(!infoRandomParent){
                        console.log('=================TH1.1')
                        // Tạo phần tử cha
                        let infoParent = await that.insertData({
                            company: companyID,
                            funda: fundaID,
                            name: 'Chi phí Nhân viên điểm bán',
                            userCreate: userID,
                            expenseType: 4, // Chi phí nhân viên
                        })

                        if(!infoParent)
                            return resolve({ error: true, message: 'Thêm thất bại', keyError: KEY_ERROR.INSERT_FAILED })

                        let infoShift = await FNB_SHIFT_COLL.findById(shiftID).select('_id company funda name expenseType createAt staffSalaryTotal')
                        let dataInsert = {
                            fundaID: infoShift.funda,
                            shiftID,
                            parentID: infoParent._id,
                            name: infoShift.name,
                            userID,
                            expenseType: 4, // Chi phí nhân viên
                            date: infoShift.createAt,
                            quantity: 1,
                            unitPrice: infoShift.staffSalaryTotal,
                            amount: infoShift.staffSalaryTotal,
                            // vatAmount,
                        }
    
                        let infoAfterInsert = await that.insert(dataInsert)
                        if (!infoAfterInsert)
                            return resolve({ error: true, message: 'Thêm thất bại', keyError: KEY_ERROR.INSERT_FAILED })
    
                        return resolve({ error: false, data: infoAfterInsert })
                    }else{
                        console.log('=================TH1.2')
                        // Đưa vào trong phần tử cha
                        let infoShift = await FNB_SHIFT_COLL.findById(shiftID).select('_id company funda name expenseType createAt staffSalaryTotal')
        
                        let dataInsert = {
                            fundaID: infoShift.funda,
                            shiftID,
                            parentID: infoRandomParent._id,
                            name: infoShift.name,
                            userID,
                            expenseType: 4, // Chi phí nhân viên
                            date: infoShift.createAt,
                            quantity: 1,
                            unitPrice: infoShift.staffSalaryTotal,
                            amount: infoShift.staffSalaryTotal,
                            // vatAmount,
                        }
    
                        let infoAfterInsert = await that.insert(dataInsert)
                        if (!infoAfterInsert)
                            return resolve({ error: true, message: 'Thêm thất bại', keyError: KEY_ERROR.INSERT_FAILED })
    
                        return resolve({ error: false, data: infoAfterInsert })
                    }
                }else{
                    console.log('=================TH2')
                    let infoShift = await FNB_SHIFT_COLL.findById(shiftID).select('_id company funda name expenseType createAt staffSalaryTotal')

                    // Cập nhật thông tin
                    let dataUpdate = {
                        userID,
                        bookID: infoBook._id,
                        quantity: 1,
                        unitPrice: infoShift.staffSalaryTotal,
                        // amount: infoShift.staffSalaryTotal,
                        // vatAmount,
                    }

                    let infoAfterUpdate = await that.update(dataUpdate)
                    if (!infoAfterUpdate)
                        return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED })

                    // console.log(infoAfterUpdate)

                    // Cập nhật phần tử cha
                    await that.updateValue({ bookID: infoBook.parent, userID }) 

                    return resolve({ error: false, data: infoAfterUpdate })
                }
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
        bookID, outin, plan, revenueType, expenseType, appExpenseType, date, name, note, customerID, goodsID, quantity, unitPrice, vatAmount, sign, campaignName }) {
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

                let dataUpdate = { userUpdate: userID, modifyAt: new Date() };

                if(name && name != ""){
                    dataUpdate.name =name;
                }
                if(customerID && checkObjectIDs(customerID)){
                    dataUpdate.customer = customerID;
                }

                if(goodsID && checkObjectIDs(goodsID)){
                    dataUpdate.goods = goodsID;
                }

                if(date && date != ""){
                    dataUpdate.date = date;
                }

                if(note && note != ""){
                    dataUpdate.note = note;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }
                
                if(campaignName){
                    dataUpdate.campaignName = campaignName;
                }
                 
                if(appExpenseType){
                    dataUpdate.appExpenseType = appExpenseType;
                }

                if(!isNaN(outin)){
                    dataUpdate.outin = Number(outin);
                }

                if(!isNaN(plan)){
                    dataUpdate.plan = Number(plan);
                }

                if(!isNaN(revenueType)){
                    dataUpdate.revenueType = Number(revenueType);
                }

                if(!isNaN(expenseType)){
                    dataUpdate.expenseType = Number(expenseType);
                }

                if(!isNaN(quantity)){
                    dataUpdate.quantity = Number(quantity);
                }

                if(!isNaN(unitPrice)){
                    dataUpdate.unitPrice = Number(unitPrice);
                }

                if(!isNaN(quantity && !isNaN(unitPrice))){
                    dataUpdate.amount = quantity * unitPrice;
                }

                if(!isNaN(vatAmount)){
                    dataUpdate.vatAmount = Number(vatAmount);
                }

                let infoAfterUpdate = await FNB_GENERAL_BOOK_COLL.findByIdAndUpdate(bookID, dataUpdate, { new: true });

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
     * Name: Cập nhật mẩu tin cha
     * Author: HiepNH
     * Code: 24/11/2022
     */
    updateValue({ bookID, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(bookID))
                    return resolve({ error: true, message: 'bookID invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let dataUpdate = { userUpdate: userID, modifyAt: new Date() };

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

                dataUpdate.amount = Number(amount)

                let infoAfterUpdate = await FNB_GENERAL_BOOK_COLL.findByIdAndUpdate(bookID, dataUpdate, { new: true });
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
    getList({ option, companyID, fundasID, fromDate, toDate, keyword, limit = 10, lastestID, select, populates, sortKey, userID, parentID, outin, plan, revenueType, expenseType, appExpenseType }) {
        // console.log({ companyID, fundasID, fromDate, toDate, keyword, limit, lastestID, select, populates, sortKey, userID, parentID, outin, plan, revenueType, expenseType, appExpenseType })
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = { company: companyID }
                let sortBy;
                let keys	 = ['createAt__1', '_id__1'];

                const validation = validateParamsObjectID({
                    fundasID            : { value: fundasID, isRequire: false },
                });
                if(validation.error) return resolve(validation);

                // Gom nhóm theo đơn vị cơ sở
                if(fundasID && fundasID.length ){
                    let arrFun = fundasID.map(item=>ObjectID(item))

                    if(arrFun.length) {
                        conditionObj.funda = { $in: arrFun };
                    }
                }else{
                    let listFundaIsMember = await ITEM__FUNDA_COLL.find({members: {$in: [userID]}});
                    let fundasIDIsMember = listFundaIsMember.map(item=>ObjectID(item._id));
                    if(fundasIDIsMember.length) {
                        conditionObj.funda = { $in: fundasIDIsMember };
                    }else{
                        conditionObj.funda = { $in: [] }
                    }
                }

                // Phân loại theo thời khoảng
                if(fromDate && toDate){
                    conditionObj.date = {
                        $gte: new Date(fromDate),
                        $lte: new Date(toDate),
                    }
                }

                // Theo mẩu tin cha
                if(parentID){
                    conditionObj.parent = parentID;
                }else{
                    if(!option){
                        conditionObj.parent = { $exists: false }
                    }else{
                        if(option && Number(option) == 1){
                            conditionObj.parent = { $exists: true, $ne: null }
                        }
                    }
                }

                // Phân loại theo Mua vào bán ra
                if(outin && outin > 0){
                    conditionObj.outin = Number(outin)
                }

                // Phân loại theo Kế hoạch, thực tế
                if(plan && plan > 0){
                    conditionObj.plan = Number(plan)
                }

                if(revenueType && revenueType > 0){
                    conditionObj.revenueType = Number(revenueType)
                }

                if(expenseType && expenseType > 0){
                    conditionObj.expenseType = Number(expenseType)
                }

                if(appExpenseType && appExpenseType > 0){
                    conditionObj.appExpenseType = Number(appExpenseType)
                }
                // console.log({conditionObj});

                // Làm rõ mục đích để làm gì?
                if (sortKey && typeof sortKey === 'string') {
                    if (!IsJsonString(sortKey))
                        return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                    keys = JSON.parse(sortKey);
                }

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
    getListByProperty({ companyID, userID, option, optionTime, optionGroup, fundasID, year, month, fromDate, toDate, outin, plan, fundaID }) {
        // console.log({ companyID, userID, option, optionTime, optionGroup, fundasID, year, month, fromDate, toDate, outin, plan })
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

                    // Chỉ lấy các mẩu tin con
                    let conditionObj = { 
                        company: ObjectID(companyID),
                        parent: { $exists: true, $ne: null },
                    }
                    
                    let conditionGroup = {}
                    let conditionObjYear = {}, conditionPopulate = {}, sortBy = {"amount": -1}

                    const validation = validateParamsObjectID({
                        fundasID            : { value: fundasID, isRequire: false },
                    });
                    if(validation.error) return resolve(validation);
    
                    // Gom nhóm theo đơn vị cơ sở
                    if(fundasID && fundasID.length ){
                        let arrFun = fundasID.map(item=>ObjectID(item))
    
                        if(arrFun.length) {
                            conditionObj.funda = { $in: arrFun };
                        }
                    }else{
                        let listFundaIsMember = await ITEM__FUNDA_COLL.find({members: {$in: [userID]}});
                        let fundasIDIsMember = listFundaIsMember.map(item=>ObjectID(item._id));
                        if(fundasIDIsMember.length) {
                            conditionObj.funda = { $in: fundasIDIsMember };
                        }else{
                            conditionObj.funda = { $in: [] }
                        }
                    }

                    // Phân loại theo thời khoảng
                    if(fromDate && toDate){
                        conditionObj.date = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate),
                        }
                    }

                    // Phân loại theo Mua vào bán ra
                    if(outin && outin > 0){
                        conditionObj.outin = Number(outin)
                    }

                    // Phân loại theo Kế hoạch, thực tế
                    if(plan && plan > 0){
                        conditionObj.plan = Number(plan)
                    }

                    /**
                     * Gom nhóm theo PHÂN LOẠI căn bản
                     */
                    if(option && Number(option) == 1){
                        if(optionGroup && Number(optionGroup) == 1){
                            conditionGroup = {
                                _id: { plan: "$plan", outin: "$outin" },
                                amount: { $sum: "$amount" },
                                vatAmount: { $sum: "$vatAmount" },
                            }
                        }
                    }

                    /**
                     * Gom nhóm theo THỜI GIAN năm/tháng
                     */
                    if(option && Number(option) == 2){
                        conditionObjYear = {
                            "year": Number(yearFilter),
                        }

                        if(month && !isNaN(month)){
                            conditionObjYear = {
                                "year": Number(yearFilter),
                                "month": Number(month),
                            }
                        }

                        // Gom nhóm theo tháng trong năm
                        if(optionGroup && Number(optionGroup) == 1){
                            conditionGroup = {
                                _id: { month: "$month" },
                                amount: { $sum: "$amount" },
                                vatAmount: { $sum: "$vatAmount" },
                            }
                        }
                    }

                    /**
                     * Gom nhóm theo ĐƠN VỊ CƠ SỞ/THỜI GIAN
                     */
                    if(option && Number(option) == 3){
                        conditionObjYear = {
                            "year": Number(yearFilter),
                        }

                        if(month && !isNaN(month)){
                            conditionObjYear = {
                                "year": Number(yearFilter),
                                "month": Number(month),
                            }
                        }

                        // Gom nhóm tổng hợp theo Cơ sở
                        if(optionGroup && Number(optionGroup) == 1){
                            conditionGroup = {
                                _id: { month: "$month", funda: "$funda" },
                                amount: { $sum: "$amount" },
                                vatAmount: { $sum: "$vatAmount" },
                            }
                        }
                    }

                    /**
                     * Gom nhóm theo 01 ĐƠN VỊ CƠ SỞ/THỜI GIAN
                     */
                    if(option && Number(option) == 4){
                        conditionObjYear = {
                            "year": Number(yearFilter),
                        }

                        if(month && !isNaN(month)){
                            conditionObjYear = {
                                "year": Number(yearFilter),
                                "month": Number(month),
                            }
                        }

                        if(fundaID && checkObjectIDs(fundaID)){
                            conditionObj.funda = ObjectID(fundaID)
                        }
                       
                        if(optionGroup && Number(optionGroup) == 1){
                            conditionGroup = {
                                _id: { expenseType: "$expenseType" },
                                amount: { $sum: "$amount" },
                                vatAmount: { $sum: "$vatAmount" },
                            }
                        }

                        sortBy = {"_id.expenseType" : 1 }
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
                                year : {$year : "$date"},
                                month : {$month : "$date"},
                                funda : 1,
                                parent : 1,
                                plan : 1,
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
                                date : 1,
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

                    // if(!isNaN(option) && [3].includes(Number(option))){
                    //     await FNB_GENERAL_BOOK_COLL.populate(listData, conditionPopulate)
                    // }

                    return resolve({ error: false, data: listData });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model