"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }
                                        = require('../../../tools/utils/utils');
// const stringUtils					    = require('../../../tools/utils/string_utils');
// const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const { KEY_ERROR }			            = require('../../../tools/keys');

// const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;

// const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');

/**s
 * import inter-coll, exter-coll
 */
const ITEM__FUNDA_COLL            			   = require('../../item/database/item.funda-coll');
const FNB_PRODUCT_COLL                         = require('../database/fnb.product-coll');
// const FNB_ORDER_COLL                           = require('../database/fnb.order-coll');
// const FNB_ORDER_PRODUCT_COLL                   = require('../database/fnb.order_product-coll');
// const FNB_SHIFT_COLL                           = require('../database/fnb.shift-coll');
// const FNB_MISTAKE_COLL                         = require('../database/fnb.mistake-coll');
// const FNB_QUOTA_COLL                           = require('../database/fnb.quota-coll');
// const FNB_ORDER_MATERIAL_COLL                  = require('../database/fnb.order_material-coll');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {

    constructor() {
        super(FNB_PRODUCT_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert({ userID, companyID, fundaID, parentID, name, sign, unit, note, quantity, unitPrice, type }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(companyID) || !name)
                    return resolve({ error: true, message: 'companyID|fundaID|name invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let dataInsert = { name, type, userCreate: userID };
                if(sign && sign != ""){
                    let checkExist = await FNB_PRODUCT_COLL.findOne({ company: companyID, sign });
                    if(checkExist)
                        return resolve({ error: true, message: "Mã hiệu đã tồn tại", keyError: KEY_ERROR.ITEM_EXISTED })

                    dataInsert.sign = sign
                }

                if(fundaID && checkObjectIDs(fundaID)){
                    let infoFunda = await ITEM__FUNDA_COLL.findById(fundaID)
                    if (!infoFunda)
                        return resolve({ error: true, message: 'cannot_get_info_funda' });

                    dataInsert.funda = fundaID
                    dataInsert.company = infoFunda.company
                }else{
                    dataInsert.company = companyID
                }

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }

                if(unit && unit != ""){
                    dataInsert.unit = unit;
                }

                if(note && note != ""){
                    dataInsert.note = note;
                }

                if(!isNaN(unitPrice)){
                    dataInsert.unitPrice = Number(unitPrice);

                    if(!isNaN(quantity)){
                        dataInsert.quantity = Number(quantity);
                        dataInsert.amount = Number(quantity*unitPrice);
                    }else{
                        dataInsert.amount = Number(unitPrice);
                    }
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
    update({ productID, userID, parentID, name, sign, unit, note, quantity, unitPrice, imagesID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(productID))
                    return resolve({ error: true, message: 'productID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let dataInUpdate = { userUpdate: userID, modifyAt: new Date() };

                if(checkObjectIDs(parentID)){
                    dataInUpdate.parent = parentID;
                }

                if(name){
                    dataInUpdate.name =name;
                }

                if(sign){
                    dataInUpdate.sign =sign;
                }

                if(imagesID && imagesID.length) {
                    dataInUpdate.$addToSet = {
                        images: imagesID,
                    }
                }

                if(unit && unit != ""){
                    dataInUpdate.unit = unit;
                }

                if(note && note != ""){
                    dataInUpdate.note = note;
                }

                if(!isNaN(quantity)){
                    dataInUpdate.quantity = Number(quantity);
                }

                if(!isNaN(unitPrice)){
                    dataInUpdate.unitPrice = Number(unitPrice);
                    dataInUpdate.amount = Number(quantity*unitPrice);
                }

                let infoAfterUpdate = await FNB_PRODUCT_COLL.findByIdAndUpdate(productID, dataInUpdate, { new: true });

                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: get info user_pcm_plan_group
     * Author: Depv
     * Code:
     */
    getInfo({ productID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(productID))
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

                let infoPlanGroup = await FNB_PRODUCT_COLL.findById(productID)
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
    getList({ companyID, type, keyword, limit = 10, lastestID, select, populates, sortKey, userID }) {
        console.log({ companyID, type, keyword, limit, lastestID, select, populates, sortKey, userID })
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

                // Gom nhóm theo đơn vị cơ sở
                if(companyID ){
                    conditionObj.company = ObjectID(companyID)
                }

                if(type && !isNaN(type)){
                    conditionObj.type = Number(type)
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
                    let infoData = await FNB_PRODUCT_COLL.findById(lastestID);
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

                let infoDataAfterGet = await FNB_PRODUCT_COLL.find(conditionObj)
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
                let totalRecord = await FNB_PRODUCT_COLL.count(conditionObjOrg);
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