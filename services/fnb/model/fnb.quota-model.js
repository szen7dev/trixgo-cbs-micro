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
    insert({ productID, goodsID, quantity, size, sugar, ice, note, userID }) {
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
                    size: Number(size),  
                    sugar: Number(sugar),  
                    ice: Number(ice),  
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
    update({ quotaID, userID, 
        note, quantity, size, sugar, ice }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(quotaID))
                    return resolve({ error: true, message: 'quotaID invalid', keyError: KEY_ERROR.PARAMS_INVALID });
                
                let infoQuota = await FNB_QUOTA_COLL.findById(quotaID)
                if(!infoQuota)
                    return resolve({ error: true, message: "quotaID invalid", keyError: KEY_ERROR.PARAMS_INVALID })

                /**
                 * Lấy thông tin của Nguyên liệu (giá căn bản)
                 */
                let goodsID = infoQuota.goods
                let infoGoods = await ITEM__GOODS_COLL.findById(goodsID)
                if(!infoGoods)
                    return resolve({ error: true, message: "goodsID invalid", keyError: KEY_ERROR.PARAMS_INVALID })

                let dataInUpdate = { 
                    userUpdate: userID,
                     modifyAt: new Date(),
                     size: Number(size),  
                     sugar: Number(sugar),  
                     ice: Number(ice),  
                     quantity: Number(quantity).toFixed(3), 
                     unitPrice: Number(infoGoods.unitprice).toFixed(3), 
                     amount: Number(quantity*infoGoods.unitprice).toFixed(3), 
                    
                };

                if(note && note != ""){
                    dataInUpdate.note = note;
                }
                // console.log({ dataInUpdate })
                
                let infoAfterUpdate = await FNB_QUOTA_COLL.findByIdAndUpdate(quotaID, dataInUpdate, { new: true });
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
    getInfo({ quotaID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(quotaID))
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

                let infoPlanGroup = await FNB_QUOTA_COLL.findById(quotaID)
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
    getList({ productID, keyword, limit = 10, lastestID, select, populates, sortKey, userID }) {
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = { product: productID }
                let sortBy;
                let keys	 = ['createAt__-1', '_id__-1'];

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
}

exports.MODEL = new Model;