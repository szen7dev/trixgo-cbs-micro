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
const FNB_ORDER_COLL                  = require('../database/fnb.order-coll');
const { ObjectId } = require('mongodb');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {

    constructor() {
        super(FNB_ORDER_COLL);
    }

    /**
     * Name: insert group 
     * Author: Depv
     * Code:
     */
    insert({ fundaID, parentID, mistakeID, customerID, shift, name, sign, appOrderSign, note, salesChannel, paymentMethod, amount, vatAmount, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(fundaID) || !name)
                    return resolve({ error: true, message: 'fundaID|name invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                // let checkExist = await FNB_ORDER_COLL.findOne({ funda: fundaID, name, sign });
                // if(checkExist)
                //     return resolve({ error: true, message: "Tên và mã hiệu đã tồn tại", keyError: KEY_ERROR.ITEM_EXISTED })

                let dataInsert = { funda: fundaID, name, sign, userCreate: userID };

                // if(sign){
                //     dataInsert.sign = sign;
                // }

                if(appOrderSign && appOrderSign != ""){
                    dataInsert.appOrderSign = appOrderSign;
                }

                if(note && note != ""){
                    dataInsert.note = note;
                }

                if(mistakeID && checkObjectIDs(mistakeID)){
                    dataInsert.mistake = mistakeID;
                }

                if(!isNaN(shift)){
                    dataInsert.shift = Number(shift);
                }

                if(!isNaN(salesChannel)){
                    dataInsert.salesChannel = Number(salesChannel);
                }

                if(!isNaN(paymentMethod)){
                    dataInsert.paymentMethod = Number(paymentMethod);
                }

                if(!isNaN(amount)){
                    dataInsert.amount = Number(amount);
                }

                if(!isNaN(vatAmount)){
                    dataInsert.vatAmount = Number(vatAmount);
                }

                if(parentID && checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }

                if(customerID && checkObjectIDs(customerID)){
                    dataInsert.customer = customerID;
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
    update({ groupID, name, sign, userID, parentID, contractID, image, members, membersRemove, admins, adminsRemove }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(groupID))
                    return resolve({ error: true, message: 'groupID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let checkExist = await FNB_ORDER_COLL.findOne({ _id: { $ne: groupID }, name, sign });
                if(checkExist)
                    return resolve({ error: true, message: "Tên và mã hiệu đã tồn tại", keyError: KEY_ERROR.ITEM_EXISTED });
                let dataInUpdate = { userUpdate: userID, modifyAt: new Date() };

                if(name){
                    dataInUpdate.name =name;
                }

                if(sign){
                    dataInUpdate.sign =sign;
                }

                if(checkObjectIDs(contractID)){
                    dataInUpdate.contract = contractID;
                }

                if(checkObjectIDs(members)){
                    dataInUpdate.$addToSet = { members };
                }

                if(checkObjectIDs(membersRemove)){
                    dataInUpdate.$pullAll = { members: membersRemove };
                }

                if(checkObjectIDs(admins)){
                    dataInUpdate.$addToSet = { admins };
                }

                if(checkObjectIDs(adminsRemove)){
                    dataInUpdate.$pullAll = { admins: adminsRemove };
                }

                if(checkObjectIDs(image)){
                    dataInUpdate.image = image;
                }
                
                /**
                 * Di chuyển thư mục
                 */
                if(checkObjectIDs(parentID)){
                    dataInUpdate.parent = parentID;
                }

                console.log({ dataInUpdate })
                let infoAfterUpdate = await FNB_ORDER_COLL.findByIdAndUpdate(groupID, dataInUpdate, { new: true });

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
    getInfo({ groupID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(groupID))
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

                let infoPlanGroup = await FNB_ORDER_COLL.findById(groupID)
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
    getList({ userID, parentID, projectID, lastestID, keyword, limit = 10, select, populates = {}, isShowAll, isShowParentAndChild }) {
        console.log({ userID, parentID, projectID, lastestID, keyword, limit, select, populates, isShowAll, isShowParentAndChild })
        return new Promise(async (resolve) => {
            try {
                if(limit > 20 || isNaN(limit)){
                    limit = 20;
                } else{
                    limit = +limit;
                }

                if(!checkObjectIDs(projectID))
                    return resolve({ error: true, message: "projectID_invalid", keyError: KEY_ERROR.PARAMS_INVALID });

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {
                    $or: [
                        { members: { $in: [userID] } },
                        { admins: { $in: [userID] } },
                    ]
                };

                let sortBy;
                let keys	 = ['actualFinishTime__-1', '_id__-1'];
                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
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

                /**
                 * Lấy tất cả group trong dự án
                 * Phục vụ cho việc Admin dự án
                 */
                if(isShowAll == 1){
                    delete conditionObj.$or;
                 }

                if(projectID){
                    conditionObj.project = projectID;
                }

                // Trường hợp show ở modal tạo task mới (show hết cha và con)
                if(!isShowParentAndChild) {
                    if(parentID && checkObjectIDs(parentID)){
                        conditionObj.parent = parentID;
                    } else{
                        conditionObj.parent = { $exists: false };
                    }
                }

                console.log(conditionObj)

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';

                    if(conditionObj.$or) {
                        conditionObj.$and = [
                            {
                                $or: conditionObj.$or
                            },
                            {
                                $or: [
                                    { name: new RegExp(keyword, 'i') },
                                    { sign: new RegExp(keyword, 'i') },
                                ]
                            }
                        ]
                    } else{
                        conditionObj.$or = [
                            { name: new RegExp(keyword, 'i') },
                            { sign: new RegExp(keyword, 'i') },
                        ]
                    }
                }

                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await FNB_ORDER_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await FNB_ORDER_COLL
                    .find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", keyError: KEY_ERROR.GET_LIST_FAILED, status: 200 });

				let nextCursor	= null;
				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

                let totalRecord = await FNB_ORDER_COLL.count(conditionObjOrg);
                let totalPage = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 })

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
                                _id: { funda: "$funda" },
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
                    let listData = await FNB_ORDER_COLL.aggregate([
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