"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');


const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

/**s
 * import inter-coll, exter-coll
 */
const CMCS__CONTRACT_PRODUCTION_COLL    = require('../database/cmcs.contract_production-coll');
const { RANGE_BASE_PAGINATION } 	    = require('../../../tools/cursor_base/playground/index');
const { template }                      = require('lodash');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               

    constructor() {
        super(CMCS__CONTRACT_PRODUCTION_COLL);
    }
    
    /**
     * Name: insert contract production ✅
     * Author: Depv
     * Code: 
     */
    insert({ contractID, name, sign, description, date, produce, vatProduce, plusProduce, vatPlusProduce, userID, ctx  }) { 
        const that = this
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * Bước 1: Cập nhật thông tin vào IPC
                 * Bước 2: Cập nhật thông tin vào Hợp đồng
                 * Bước 3: Cập nhật thông tin vào Dự án => Nếu là dòng tiền của hợp đồng mua vào
                 */
                 const infoContract = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_GET_INFO_AND_GET_LIST}`, {
                    contractID
                })

                if(infoContract.error)
                    return resolve({ error: true, message: "Hợp đồng không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID });

                const { outin, real, field, chair, personInCharge, buyerInfo, sellerInfo, company, project } = infoContract.data;

                let dataInsert = { userCreate: userID, outin, real, field, chair, personInCharge, buyerInfo, sellerInfo, company, project, contract: contractID };

                if(name){
                    dataInsert.name = name
                }

                if(sign){
                    dataInsert.sign = sign
                }

                if(description){
                    dataInsert.description = description
                }

                if(date){
                    dataInsert.date = date
                }

                if(produce){
                    dataInsert.produce = produce
                }

                if(vatProduce){
                    dataInsert.vatProduce = vatProduce
                }

                if(plusProduce){
                    dataInsert.plusProduce = plusProduce
                }
                
                if(vatPlusProduce){
                    dataInsert.vatPlusProduce = vatPlusProduce
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: "can_not_insert_contract_production", status: 403 });

                /**
                 * CẬP NHẬT CHO PHẦN HỢP ĐỒNG
                 */    
                 await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE_VALUE}`, {
                    option: 1,
                    contractID,
                    userID
                })
                
                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: update contract production ✅
     * Author: Depv
     * Code: 
     */
    update({ 
        contractProductionID, name, sign, description, date, produce, vatProduce, plusProduce, vatPlusProduce, userID, ctx
    }){ 
        const that = this
        return new Promise(async (resolve) => {
            try {

                if(!checkObjectIDs(contractProductionID))
                    return resolve({ error: true, message: "Mã sản lượng hợp đồng không đúng", keyError: "contractProductionID_invalid" });
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };

                let infoContractProduction = await CMCS__CONTRACT_PRODUCTION_COLL.findById(contractProductionID);
                let contractID = infoContractProduction.contract;
                
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
                if(name){
                    dataUpdate.name = name
                }

                if(sign){
                    dataUpdate.sign = sign
                }

                if(description){
                    dataUpdate.description = description
                }

                if(date){
                    dataUpdate.date = date
                }

                if(produce){
                    dataUpdate.produce = produce
                }

                if(vatProduce){
                    dataUpdate.vatProduce = vatProduce
                }

                if(plusProduce){
                    dataUpdate.plusProduce = plusProduce
                }
                
                if(vatPlusProduce){
                    dataUpdate.vatPlusProduce = vatPlusProduce
                }

                let infoAfterUpdate = await CMCS__CONTRACT_PRODUCTION_COLL.findByIdAndUpdate(contractProductionID, dataUpdate, { new: true })
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_contract_ipc", status: 403 })
 
                /**
                 * CẬP NHẬT CHO PHẦN HỢP ĐỒNG
                 */    
                 await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE_VALUE}`, {
                    option: 1,
                    contractID: `${contractID}`,
                    userID
                })

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Remove contract production ✅
     * Author: Depv
     * Code: 
     */
    remove({ contractProductionID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(contractProductionID))
                    return resolve({ error: true, message: "contractProductionID không hợp lệ", keyError: "contractProductionID_invalid" });
                    
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoAterRemove = await CMCS__CONTRACT_PRODUCTION_COLL.findByIdAndDelete(contractProductionID);
                if(!infoAterRemove)
                    return resolve({ error: true, message: "can't_remove", status: 403 });
 
                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }


    /**
     * Name: get info contract production ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ contractProductionID, userID, 
        select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(contractProductionID))
                    return resolve({ error: true, message: "contractProductionID không hợp lệ", keyError: "contractProductionID_invalid" });

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

                let infoContractProduction = await CMCS__CONTRACT_PRODUCTION_COLL.findById(contractProductionID)
                                .select(select)
                                .populate(populates)

				if (!infoContractProduction) return resolve({ error: true, message: 'cannot_get' });

                return resolve({ error: false, data: infoContractProduction });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Danh sách contract production ✅
     * Author: Depv
     * Code  : 
     */
    getList({ projectID, contractID, userID,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { 
                    // state: 1,
                };

                let conditionFind = { };
                let sortBy   = { createAt: -1 };
				let objSort  = {};
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                 //__________B1: Get danh sách các nhóm dữ liệu mà userID là members
            
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

                // DỰ ÁN
                if(projectID && checkObjectIDs(projectID)){
                    conditionObj.project = projectID;
                }

                // HỢP ĐỒNG
                if(contractID && checkObjectIDs(contractID)){
                    conditionObj.contract = contractID;
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.$or = [
                        { name: regExpSearch },
                        { sign: regExpSearch }
                    ]
                }

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await CMCS__CONTRACT_PRODUCTION_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let nextInfo = `${infoData.createAt}_${infoData._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
					let keys	 = ['createAt__-1', '_id__-1'];
					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
					conditionFind = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				}
                
                let infoDataAfterGet = await CMCS__CONTRACT_PRODUCTION_COLL.find({...conditionObj, ...conditionFind })
                    .limit(+limit+1)
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

                let totalRecord = await CMCS__CONTRACT_PRODUCTION_COLL.count(conditionObj);
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
     * Name: Gom nhóm theo tháng trong năm✅
     * Author: Hiepnh
     * Date: 5/4/2022
     */
    getAmountByMonth({ userID, companyID, projectID, outin, year, ctx }){
        return new Promise(async resolve => {
            try {
                let conditionObj = {}, conditionGroup = {}, conditionObjYear = {}

                // Tính toán theo companyID
                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = ObjectID(companyID)

                    conditionGroup = {
                        _id: { month: "$month" },
                        amount: { $sum: "$amount" },
                    }
                }

                // Tính toán theo projectID: gom nhóm theo các tháng trong năm
                if(projectID && checkObjectIDs(projectID)){
                    conditionObj.project = ObjectID(projectID)

                    conditionGroup = {
                        _id: { month: "$month", year: "$year" },
                        amount: { $sum: "$amount" },
                    }
                }

                if(!isNaN(outin) && Number(outin) >= 0){
                    conditionObj.outin = outin
                }

                if(!isNaN(year) && Number(year) >= 0){
                    conditionObjYear = {
                        "year": Number(year),
                    }
                }

                let listData = await CMCS__CONTRACT_PRODUCTION_COLL.aggregate([
                    {
                        $match: conditionObj
                    }, 
                    {
                        $project : { 
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                            amount: { $sum: ["$produce", "$vatProduce", "$plusProduce", "$vatPlusProduce"] },
                        }
                    },
                    {
                        $match: conditionObjYear
                    }, 
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: {
                            "_id.year": 1,
                            "_id.month": 1,
                        }
                    } 
                ])

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Gom nhóm theo đối tượng ✅
     * Author: Hiepnh
     * Date: 15/04/2022
     */
    getAmountByObject({ userID, outin, companyID, projectID, contractID }){
        return new Promise(async resolve => {
            try {
                let produce=0, vatProduce=0, plusProduce=0, vatPlusProduce=0

                let conditionObj = { }

                if(!isNaN(outin) && Number(outin) >= 0){
                    conditionObj.outin = outin
                }

                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = ObjectID(companyID)
                }

                if(projectID && checkObjectIDs(projectID)){
                    conditionObj.project = ObjectID(projectID)
                }

                if(contractID && checkObjectIDs(contractID)){
                    conditionObj.contract = ObjectID(contractID)
                }

                let listData = await CMCS__CONTRACT_PRODUCTION_COLL.aggregate([
                    {
                        $match: conditionObj
                    }, 
                    {
                        $group: {
                            _id: { },
                            produce: { $sum: "$produce" },
                            vatProduce: { $sum: "$vatProduce" },
                            plusProduce: { $sum: "$plusProduce" },
                            vatPlusProduce: { $sum: "$vatPlusProduce" },
                        }
                    }, 
                ])

                if(listData && listData.length){
                    produce = Number(listData[0].produce)
                    vatProduce = Number(listData[0].vatProduce)
                    plusProduce = Number(listData[0].plusProduce)
                    vatPlusProduce = Number(listData[0].vatPlusProduce)
                }

                return resolve({ error: false, data: { produce, vatProduce, plusProduce, vatPlusProduce } });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

}

exports.MODEL = new Model;