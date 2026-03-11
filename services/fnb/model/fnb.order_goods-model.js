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
const moment = require("moment");
const { getTimeBetween }                            = require('../../../tools/utils/time_utils')

/**s
 * import inter-coll, exter-coll
 */
const FNB_ORDER_COLL                           = require('../database/fnb.order-coll');
const ITEM__FUNDA_COLL            			   = require('../../item/database/item.funda-coll'); 
// const FNB_PRODUCT_COLL                         = require('../database/fnb.product-coll');
const FNB_ORDER_GOODS_COLL                     = require('../database/fnb.order_goods-coll');
const ITEM__CONFIG_COLL = require("../../item/database/item.config-coll");

/**
 * import inter-model, exter-model
 */
const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const { uploadFileS3 }                  = require('../../../tools/s3');

const {
    FNB_FACTOR,
    FNB_SHIFT_TYPES,
    FNB_SALES_CHANNEL,
    FNB_PAYMENT_METHOD,
    FNB_STATUS
 } = require('../helper/fnb.keys-constant')

class Model extends BaseModel {

    constructor() {
        super(FNB_ORDER_GOODS_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert({ orderID, goodsID, size, sugar, ice, subGoodsID, quantity, unitPrice, note, rating, userID }) {
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * Bước 1: Khởi tạo đơn hàng
                 * Bước 2: Thêm sản phẩm vào đơn hàng => cập nhật giá đơn hàng
                 * Bước 3: Tính Chiết khấu, giảm giá => cập nhật giá đơn hàng
                 * Bước 4: Khởi tạo nguyên liệu sử dụng cho đơn hàng
                 */
                if(!checkObjectIDs(orderID))
                    return resolve({ error: true, message: 'orderID invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let infoOrder = await FNB_ORDER_COLL.findById(orderID)
                if(!infoOrder)
                    return resolve({ error: true, message: "Đơn hàng không tồn tại", keyError: KEY_ERROR.ITEM_EXISTED })

                // let infoProduct = await FNB_ORDER_GOODS_COLL.findById(goodsID)
                // if(!infoProduct)
                //     return resolve({ error: true, message: "Sản phẩm không tồn tại", keyError: KEY_ERROR.ITEM_EXISTED })

                let dataInsert = {
                    userCreate: userID,
                    company: infoOrder.company,
                    funda: infoOrder.funda,
                    order: orderID,
                    goods: goodsID,
                    size,
                    sugar,
                    ice,
                    customer: infoOrder.customer,
                    assignee: infoOrder.assignee,
                    campaign: infoOrder.campaign,
                    internal: infoOrder.internal,
                    area1: infoOrder.area1,
                    area2: infoOrder.area2,
                    area3: infoOrder.area3,
                    seasons: infoOrder.seasons,
                    shift: infoOrder.shift,
                    shiftType: infoOrder.shiftType,
                    business: infoOrder.business,
                    channel: infoOrder.channel,
                    salesChannel: infoOrder.salesChannel,
                    paymentMethod: infoOrder.paymentMethod,
                    service: infoOrder.service
                }

                if(subGoodsID && checkObjectIDs(subGoodsID)){
                    dataInsert.subGoods = [...new Set(subGoodsID)];
                }

                if(rating && !isNaN(rating)){
                    dataInsert.rating = Number(rating);
                }

                if(unitPrice && !isNaN(unitPrice)){
                    dataInsert.unitPrice = Number(unitPrice);
                    if(quantity && !isNaN(quantity)){
                        dataInsert.quantity = Number(quantity);
                        dataInsert.amount = Number(quantity)*Number(unitPrice);
                    }
                }

                if(note && note != ""){
                    dataInsert.note = note;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: 'Thêm thất bại', keyError: KEY_ERROR.INSERT_FAILED });

                /**
                 * CẬP NHẬT NGUYÊN LIỆU HAO PHÍ VÀO ĐƠN HÀNG
                 */
                // const listQuota = await FNB_QUOTA_COLL.find({ product: goodsID })
                // const orderMaterialAsync = listQuota.map(item => 
                //     FNB_ORDER_MATERIAL_MODEL.insert({
                //         orderID,
                //         goodsID,
                //         quantityOfProduct: quantity,
                //         goodsID: item.goods,
                //         quantity: item.quantity,
                //         unitPrice: item.unitPrice,
                //         userID
                //     })
                // );
                // await Promise.all(orderMaterialAsync);

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    /**
     * Name: update group
     * Author: Depv
     * Code:
     */
    update({ goodsID, userID, parentID, name, sign, unit, note, quantity, unitPrice, amount  }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(goodsID))
                    return resolve({ error: true, message: 'goodsID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let dataUpdate = { userUpdate: userID, modifyAt: new Date() };

                if(checkObjectIDs(parentID)){
                    dataUpdate.parent = parentID;
                }

                if(name){
                    dataUpdate.name =name;
                }

                if(unit && unit != ""){
                    dataUpdate.unit = unit;
                }

                if(note && note != ""){
                    dataUpdate.note = note;
                }

                if(!isNaN(quantity)){
                    dataUpdate.quantity = Number(quantity);
                }

                if(!isNaN(unitPrice)){
                    dataUpdate.unitPrice = Number(unitPrice);
                }

                if(!isNaN(amount)){
                    dataUpdate.amount = Number(amount);
                }

                console.log({ dataUpdate })
                let infoAfterUpdate = await FNB_ORDER_GOODS_COLL.findByIdAndUpdate(goodsID, dataUpdate, { new: true });

                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: get info
     * Author: Depv
     * Code:
     */
    getInfo({ goodsID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(goodsID))
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

                let infoPlanGroup = await FNB_ORDER_GOODS_COLL.findById(goodsID)
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
    getList({ companyID, fundaID, orderID, keyword, limit = 10, lastestID, select, populates, sortKey, userID }) {
        // console.log({ companyID, keyword, limit, lastestID, select, populates, sortKey, userID })
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 10){
                    limit = 10;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = {}
                let sortBy;
                let keys	 = ['createAt__1', '_id__1'];

                // Gom nhóm theo đơn vị cơ sở
                if(orderID ){
                    conditionObj.order = ObjectID(orderID)
                }else{
                    if(fundaID ){
                        conditionObj.funda = ObjectID(fundaID)
                    }else{
                        conditionObj.company = ObjectID(companyID)
                    }
                }

                // Làm rõ mục đích để làm gì?
                if (sortKey && typeof sortKey === 'string') {
                    if (!IsJsonString(sortKey))
                        return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                    keys = JSON.parse(sortKey);
                }

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
                    let infoData = await FNB_ORDER_GOODS_COLL.findById(lastestID);
                    if(!infoData)
                        return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort.data.find;
                    sortBy        = dataPagingAndSort.data.sort;
                }else{
                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy                = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await FNB_ORDER_GOODS_COLL.find(conditionObj)
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
                let totalRecord = await FNB_ORDER_GOODS_COLL.count(conditionObjOrg);
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
    getListByProperty({ option, optionGroup, optionTime, fundasID, year, fromDate, toDate }) {
            // console.log({fundasID, fromDate, toDate})
        return new Promise(async (resolve) => {
            try {
                let duration = getTimeBetween(toDate, fromDate)
                // console.log({duration:duration/86400})
                if(Number(duration/86400) > 90){
                    // return resolve({ error: true, message: 'Chỉ tra cứu được trong khoảng thời gian <= 90 ngày', keyError: KEY_ERROR.PARAMS_INVALID })
                }else{
                    let conditionObj = {}
                    let conditionGroup = {}
                    let conditionObjYear = {}, conditionPopulate = {}, sortBy = {"quantity": -1}

                    const validation = validateParamsObjectID({
                        fundasID            : { value: fundasID, isRequire: false },
                    });
                    if(validation.error) return resolve(validation);

                    // Gom nhóm theo đơn vị cơ sở
                    if(fundasID && fundasID.length ){
                        let arrFun = fundasID.map(item=>ObjectID(item))
                        conditionObj.funda = { $in: arrFun }
                    }

                    // Phân loại theo thời khoảng
                    if(fromDate && toDate){
                        conditionObj.createAt = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate),
                        }
                    }

                    /**
                     * Gom nhóm theo sản phẩm
                     */
                    if(option && Number(option) == 1){
                        conditionGroup = {
                            _id: { product: "$product" },
                            quantity: { $sum: "$quantity" },
                        }

                        conditionPopulate = {
                            path: '_id.product',
                            select: '_id name sign',
                            model: 'fnb_product'
                        }
                    }

                    // Danh sách đang triển khai
                    let listData = await FNB_ORDER_GOODS_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project : {
                                year : {$year : "$createAt"},
                                month : {$month : "$createAt"},
                                hour : {$hour : "$createAt"},
                                funda : 1,
                                order : 1,
                                product : 1,
                                quantity : 1,
                                unitPrice : 1,
                                amount : 1,
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

                    if(!isNaN(option) && [1].includes(Number(option))){
                        await FNB_ORDER_GOODS_COLL.populate(listData, conditionPopulate)
                    }

                    return resolve({ error: false, data: listData })
                    // return resolve({ error: false, data: [] })
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: HiepNH
     * Func: Tải excel
     * Date: 4/2/2023
     */
    exportExcel2({ companyID, option, year, month, filterParams, email, userID }) {
        return new Promise(async resolve => {
            try {
                let configEmails = []
                let infoCF = await ITEM__CONFIG_COLL.findOne({company: companyID, type: 4})
                if(infoCF){
                    let arr1 = [], arr2 = [], arr3 = [], arr4 = []
                    if(infoCF.email1){
                    arr1 = infoCF.email1.split(',').map(item => item.trim());
                    }
                    if(infoCF.email2){
                    arr2 = infoCF.email2.split(',').map(item => item.trim());
                    }
                    if(infoCF.email3){
                    arr3 = infoCF.email3.split(',').map(item => item.trim());
                    }
                    if(infoCF.email4){
                    arr4 = infoCF.email4.split(',').map(item => item.trim());
                    }
                    configEmails = [...arr2]
                }

                if (configEmails.includes(email.toString())) {
                    let conditionObj = { company: companyID }

                    let obj = JSON.parse(filterParams);

                    let fundasID = obj.fundasID
                    let shiftTypes = obj.shiftTypes
                    let fromDate = obj.fromDate
                    let toDate = obj.toDate
                    let keyword = obj.keyword
                    let salesChannels = obj.salesChannels
                    let statuss = obj.statuss
                    let isMistake = obj.isMistake
                    let isDiscount = obj.isDiscount
                    let isSalesoff = obj.isSalesoff
                    let isCredit = obj.isCredit
                    let isOffer = obj.isOffer
                    let isNonResident = obj.isNonResident
                    let isCustomerType = obj.isCustomerType

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

                    shiftTypes && shiftTypes.length             && (conditionObj.shiftType = { $in: shiftTypes });
                    salesChannels && salesChannels.length       && (conditionObj.salesChannel = { $in: salesChannels });
                    statuss && statuss.length                   && (conditionObj.status = { $in: statuss });

                    // Phân loại khác
                    if(isMistake && isMistake == 1){
                        conditionObj.numberOfMistakes = { $gt: 0 }
                    }

                    if(isNonResident && isNonResident == 1){
                        conditionObj.nonResident = 2
                    }

                    if(isDiscount && isDiscount == 1){
                        conditionObj.discount = { $gt: 0 }
                    }

                    if(isSalesoff && isSalesoff == 1){
                        conditionObj.salesoff = { $gt: 0 }
                    }

                    if(isCredit && isCredit == 1){
                        conditionObj.credit = { $gt: 0 }
                    }

                    if(isOffer && isOffer == 1){
                        conditionObj.offer = { $gt: 0 }
                    }

                    if(isCustomerType && isCustomerType == 1){
                        conditionObj.customerType = 1
                    }
                    if(isCustomerType && isCustomerType == 2){
                        conditionObj.customerType = 2
                    }
                    // console.log(conditionObj)

                    // Phân loại theo thời khoảng
                    if(fromDate && toDate){
                        conditionObj.createAt = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate),
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
                    // console.log(conditionObj)

                    let listData  = await FNB_ORDER_COLL.find(conditionObj)
                    .populate({
                        path: "campaignType",
                        select: "name",
                    })
                    .populate({
                        path: "referrer",
                        select: "name phone",
                    })
                    .populate({
                        path: "customer",
                        select: "name phone",
                    })
                    .populate({
                        path: "funda",
                        select: "name sign",
                    })
                    .populate({
                        path: "shift",
                        select: "name sign",
                    })
                    .limit(2000)
                    .sort({createAt: -1})
                    // console.log(listData)

                    let listData2 = await FNB_ORDER_GOODS_COLL.aggregate([
                            {
                                $match: {
                                    order: {$in: listData.map(item => ObjectID(item._id))}
                                }
                            },
                            {
                                $group: {
                                    _id: { funda: '$funda', product: '$product' },
                                    quantity: { $sum: "$quantity" }
                                }
                            },
                            {
                                $sort: {
                                    '_id.product': 1
                                }
                            }
                        ])

                    let conditionPopulate1 = {
                        path: '_id.product',
                        select: '_id name',
                        model: 'fnb_product'
                    }

                    let conditionPopulate2 = {
                        path: '_id.funda',
                        select: '_id name',
                        model: 'funda'
                    }

                    await FNB_ORDER_GOODS_COLL.populate(listData2, conditionPopulate1)
                    await FNB_ORDER_GOODS_COLL.populate(listData2, conditionPopulate2)
                    // console.log(listData2)

                    let listData3 = await FNB_ORDER_GOODS_COLL.aggregate([
                        {
                            $match: {
                                order: {$in: listData.map(item => ObjectID(item._id))}
                            }
                        },
                        {
                            $group: {
                                _id: { product: '$product' },
                                quantity: { $sum: "$quantity" }
                            }
                        },
                        {
                            $sort: {
                                '_id.product': 1
                            }
                        }
                    ])
                    await FNB_ORDER_GOODS_COLL.populate(listData3, conditionPopulate1)

                    // Modify the workbook.
                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fnb_export_order.xlsx')))
                    .then(async workbook => {
                        var i = 3;
                        
                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `DanhSachDonHang_${now.getTime()}.xlsx`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);
                        const result = await uploadFileS3(pathWriteFile, fileName);

                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 });
                    })
                }else{
                    return resolve({ error: true, message: 'Bạn không có quyền', status: 500 })
                }
            } catch (error) {
                // console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model