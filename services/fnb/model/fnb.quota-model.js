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
const FNB_ORDER_COLL                           = require('../database/fnb.order-coll');
const FNB_PRODUCT_COLL                         = require('../database/fnb.product-coll');
const FNB_ORDER_PRODUCT_COLL                   = require('../database/fnb.order_product-coll');
const FNB_SHIFT_COLL                           = require('../database/fnb.shift-coll');
const FNB_MISTAKE_COLL                         = require('../database/fnb.mistake-coll');
const FNB_QUOTA_COLL                           = require('../database/fnb.quota-coll');
const FNB_ORDER_MATERIAL_COLL                  = require('../database/fnb.order_material-coll');

const ITEM__GOODS_COLL            			   = require('../../item/database/item.goods-coll');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {

    constructor() {
        super(FNB_QUOTA_COLL);
    }

    /**
     * Name: Insert 
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert({ productID, goodsID, quantity, note, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(productID) || !checkObjectIDs(goodsID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'productID|goodsID|userID invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                // Kiểm tra sự tồn tại của định mức
                let checkExist = await FNB_QUOTA_COLL.findOne({ product: productID, goods: goodsID });
                if(checkExist)
                    return resolve({ error: true, message: "Định mức đã tồn tại", keyError: KEY_ERROR.ITEM_EXISTED })

                /**
                 * Lấy thông tin của Nguyên liệu (giá căn bản)
                 */
                let infoGoods = await ITEM__GOODS_COLL.findById(goodsID)
                if(!infoGoods)
                    return resolve({ error: true, message: "goodsID invalid", keyError: KEY_ERROR.PARAMS_INVALID })

                let dataInsert = { 
                    product: productID, 
                    goods: goodsID, 
                    quantity: Number(quantity).toFixed(3), 
                    unitPrice: Number(infoGoods.unitprice).toFixed(3), 
                    amount: Number(quantity*infoGoods.unitprice).toFixed(3), 
                    userCreate: userID 
                };

                if(note && note != ""){
                    dataInsert.note = note;
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
     * Name: Update 
     * Author: HiepNH
     * Code: 24/11/2022
     */
    update({ orderID, userID, 
        mistakeID, customerID, shiftID, name, sign, appOrderSign, note, shiftType, salesChannel, paymentMethod, total, discount, salesoff, amount, vatAmount }) {
        // console.log({ mistakeID, customerID, shiftID, name, sign, appOrderSign, note, shiftType, salesChannel, paymentMethod, total, discount, salesoff, amount, vatAmount })
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(orderID))
                    return resolve({ error: true, message: 'orderID invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let dataInUpdate = { userUpdate: userID, modifyAt: new Date() };

                if(name && name != ""){
                    dataInUpdate.name =name;
                }

                if(appOrderSign && appOrderSign != ""){
                    dataInUpdate.appOrderSign = appOrderSign;
                }

                if(note && note != ""){
                    dataInUpdate.note = note;
                }

                if(customerID && checkObjectIDs(customerID)){
                    dataInUpdate.customer = customerID;
                }

                if(shiftID && checkObjectIDs(shiftID)){
                    dataInUpdate.shift = shiftID;
                }

                if(mistakeID && checkObjectIDs(mistakeID)){
                    dataInUpdate.mistake = mistakeID;
                }

                if(!isNaN(shiftType)){
                    dataInUpdate.shiftType = Number(shiftType);
                }

                if(!isNaN(salesChannel)){
                    dataInUpdate.salesChannel = Number(salesChannel);
                }

                if(!isNaN(paymentMethod)){
                    dataInUpdate.paymentMethod = Number(paymentMethod);
                }

                if(!isNaN(total)){
                    dataInUpdate.total = Number(total);
                }

                if(!isNaN(discount)){
                    dataInUpdate.discount = Number(discount);
                }

                if(!isNaN(salesoff)){
                    dataInUpdate.salesoff = Number(salesoff);
                }

                dataInUpdate.amount = Number(total)-Number(discount)-Number(salesoff);

                if(!isNaN(vatAmount)){
                    dataInUpdate.vatAmount = Number(vatAmount);
                }
                console.log({ dataInUpdate })

                let infoAfterUpdate = await FNB_QUOTA_COLL.findByIdAndUpdate(orderID, dataInUpdate, { new: true });

                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

                /**
                 * THÔNG BÁO SOCKET VÀ CLOUD MSS
                 */

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
    getInfo({ orderID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(orderID))
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

                let infoPlanGroup = await FNB_QUOTA_COLL.findById(orderID)
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
    getList({ fundasID, fromDate, toDate, salesChannel, keyword, limit = 10, lastestID, select, populates, sortKey, userID }) {
        console.log({fromDate, toDate})
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = {}
                let sortBy;
                let keys	 = ['createAt__-1'];

                const validation = validateParamsObjectID({
                    fundasID            : { value: fundasID, isRequire: false },
                });
                if(validation.error) return resolve(validation);

                // Gom nhóm theo đơn vị cơ sở
                if(fundasID && fundasID.length ){
                    let arrFun = fundasID.map(item=>ObjectID(item))
                    conditionObj.funda = { $in: arrFun }
                }

                // Phân loại kênh bán hàng
                if(salesChannel && Number(salesChannel) > 0){
                    conditionObj.salesChannel = Number(salesChannel)
                }

                // Phân loại theo thời khoảng
                if(fromDate && toDate){
                    conditionObj.createAt = {
                        $gte: new Date(fromDate),
                        $lte: new Date(toDate),
                    }
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
                    let infoData = await FNB_QUOTA_COLL.findById(lastestID);
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

                let infoDataAfterGet = await FNB_QUOTA_COLL.find(conditionObj)
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
                let totalRecord = await FNB_QUOTA_COLL.count(conditionObjOrg);
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
    getListByProperty({ option, optionGroup, optionTime, fundasID, year, fromDate, toDate,
        keyword, limit, lastestID, select, populates, sortKey, userID }) { 
        console.log({fromDate, toDate})
        return new Promise(async (resolve) => {
            try {
                if(!option){
                    // Danh sách
                }else{
                    let conditionObj = {}
                    let conditionGroup = {}
                    let conditionObjYear = {}, conditionPopulate = {}, sortBy = {"amount": 1}

                    /**
                     * VALIDATION (1)
                     */
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
                     * Gom nhóm theo các phân loại căn bản
                     */
                    if(option && Number(option) == 1){
                        conditionGroup = {
                            _id: { shiftType: "$shiftType", mistake: "$mistake", internal: "$internal", salesChannel: "$salesChannel", paymentMethod: "$paymentMethod" },
                            quantity: { $sum: 1 },
                            total: { $sum: "$total" },
                            discount: { $sum: "$discount" },
                            salesoff: { $sum: "$salesoff" },
                            amount: { $sum: "$amount" },
                            vatAmount: { $sum: "$vatAmount" },
                            numberOfProducts: { $sum: "$numberOfProducts" },
                        }
                    }

                    /**
                     * Gom nhóm theo thời gian
                     * - Số lượng đơn hàng
                     * - Giá trị đơn hàng
                     * - Số lượng sản phẩm
                     */
                    if(option && Number(option) == 2){
                        // Theo năm
                        if(optionTime && Number(optionTime) == 1){
                            conditionGroup = {
                                _id: { year: "$year" },
                                quantity: { $sum: 1 },
                                total: { $sum: "$total" },
                                discount: { $sum: "$discount" },
                                salesoff: { $sum: "$salesoff" },
                                amount: { $sum: "$amount" },
                                vatAmount: { $sum: "$vatAmount" },
                                numberOfProducts: { $sum: "$numberOfProducts" },
                            }
                        }
                        
                        // Theo tháng trong năm
                        if(optionTime && Number(optionTime) == 2){
                            if(!isNaN(year) && Number(year) >= 0){
                                conditionObjYear = {
                                    "year": Number(year),
                                }
                            }
    
                            conditionGroup = {
                                _id: { month: "$month", year: "$year" },
                                quantity: { $sum: 1 },
                                total: { $sum: "$total" },
                                discount: { $sum: "$discount" },
                                salesoff: { $sum: "$salesoff" },
                                amount: { $sum: "$amount" },
                                vatAmount: { $sum: "$vatAmount" },
                                numberOfProducts: { $sum: "$numberOfProducts" },
                            }
                        }  

                        // Theo giờ trong ngày
                        if(optionTime && Number(optionTime) == 3){    
                            conditionGroup = {
                                _id: { hour: "$hour" },
                                quantity: { $sum: 1 },
                                total: { $sum: "$total" },
                                discount: { $sum: "$discount" },
                                salesoff: { $sum: "$salesoff" },
                                amount: { $sum: "$amount" },
                                vatAmount: { $sum: "$vatAmount" },
                                numberOfProducts: { $sum: "$numberOfProducts" },
                            }
                        } 
                    }

                    /**
                     * Gom nhóm theo đơn vị cơ sở
                     */
                    if(option && Number(option) == 3){
                        conditionGroup = {
                            _id: { funda: "$funda" },
                            quantity: { $sum: 1 },
                            total: { $sum: "$total" },
                            discount: { $sum: "$discount" },
                            salesoff: { $sum: "$salesoff" },
                            amount: { $sum: "$amount" },
                            vatAmount: { $sum: "$vatAmount" },
                            numberOfProducts: { $sum: "$numberOfProducts" },
                        }

                        conditionPopulate = {
                            path: '_id.funda',
                            select: '_id name sign image',
                            model: 'funda'
                        }
                    }

                     /**
                     * Gom nhóm theo các lỗi hay gặp
                     */
                    if(option && Number(option) == 4){
                        conditionGroup = {
                            _id: { mistake: "$mistake" },
                            quantity: { $sum: 1 },
                            total: { $sum: "$total" },
                            discount: { $sum: "$discount" },
                            salesoff: { $sum: "$salesoff" },
                            amount: { $sum: "$amount" },
                            vatAmount: { $sum: "$vatAmount" },
                            numberOfProducts: { $sum: "$numberOfProducts" },
                        }

                        conditionPopulate = {
                            path: '_id.mistake',
                            select: '_id name sign image',
                            model: 'doctype'
                        }
                    }
                
                    console.log(conditionObj)
                    console.log(conditionObjYear)
                    console.log(conditionGroup)

                    // Danh sách đang triển khai
                    let listData = await FNB_QUOTA_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project : {
                                year : {$year : "$createAt"},
                                month : {$month : "$createAt"},
                                hour : {$hour : "$createAt"},
                                funda : 1,
                                total : 1,
                                salesoff : 1,
                                discount : 1,
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

                    if(!isNaN(option) && [3,4].includes(Number(option))){
                        await FNB_QUOTA_COLL.populate(listData, conditionPopulate)
                    }

                    return resolve({ error: false, data: listData });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;