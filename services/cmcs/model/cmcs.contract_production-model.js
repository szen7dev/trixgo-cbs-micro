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
        return new Promise(async (resolve) => {
            try {
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = { userCreate: userID, contract: contractID };

                // Trường để update các giá trị vào hợp đồng
                let updateContract = {};

                let companyID;
                let projectID;
                if(!checkObjectIDs(contractID))
                    return resolve({ error: true, message: "Mã hợp đồng không đúng", keyError: "contractID_invalid" });

                // call service department để lấy thông tin
                
                let infoContract = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_GET_INFO_AND_GET_LIST}`, {
                    contractID
                })
                /**
                 * Company lấy theo company của project
                 * Chứ không phải lấy theo company của user tạo task
                 */ 
                companyID = infoContract.data.company;
                projectID = infoContract.data.project;
                if(!companyID)
                    return resolve({ error: true, message: "Mã công ty không đúng", keyError: "company_invalid" });

                if(!projectID)
                    return resolve({ error: true, message: "Mã dự án không đúng", keyError: "project_invalid" });
                

                if(companyID){
                    dataInsert.company = companyID
                }

                if(projectID){
                    dataInsert.project = projectID
                }

                if(name){
                    dataInsert.name = name;
                }

                if(sign){
                    dataInsert.sign = sign;
                }

                if(description){
                    dataInsert.description = description;
                }

                if(date){
                    dataInsert.date = date;
                }

                if(produce){
                    dataInsert.produce     = produce;
                    updateContract.produce = produce;
                }

                if(vatProduce){
                    dataInsert.vatProduce     = vatProduce;
                    updateContract.vatProduce = vatProduce;
                }

                if(plusProduce){
                    dataInsert.plusProduce     = plusProduce;
                    updateContract.plusProduce = plusProduce;
                }
                
                if(vatPlusProduce){
                    dataInsert.vatPlusProduce     = vatPlusProduce;
                    updateContract.vatPlusProduce = vatPlusProduce;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: "can_not_insert_contract_production", status: 403 });

                // update contract precalculated
                let infoContractAfterUpdate = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE}`, {
                    contractID, dataInc: updateContract
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
        return new Promise(async (resolve) => {
            try {

                if(!checkObjectIDs(contractProductionID))
                    return resolve({ error: true, message: "Mã sản lượng hợp đồng không đúng", keyError: "contractProductionID_invalid" });
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };

                // Object update contract ($inc)
                let updateContract = {};
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
                    dataUpdate.name = name;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(date){
                    dataUpdate.date = date;
                }

                if(produce){
                    dataUpdate.produce = produce;
                    // Giá trị produce hiện tại lúc chưa thay đổi
                    let produceCurrent = infoContractProduction.produce;
            
                    // Giá trị chênh lệch khi thay đổi
                    let produceAfter   = produce - produceCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.produce = produceAfter;
                }

                if(vatProduce){
                    dataUpdate.vatProduce = vatProduce;

                    // Giá trị vatProduce hiện tại lúc chưa thay đổi
                    let vatProduceCurrent = infoContractProduction.vatProduce;
        
                    // Giá trị chênh lệch khi thay đổi
                    let vatProduceAfter   = vatProduce - vatProduceCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.vatProduce = vatProduceAfter;
                }

                if(plusProduce){
                    dataUpdate.plusProduce = plusProduce;

                    // Giá trị plusProduce hiện tại lúc chưa thay đổi
                    let plusProduceCurrent = infoContractProduction.plusProduce;
    
                    // Giá trị chênh lệch khi thay đổi
                    let plusProduceAfter   = plusProduce - plusProduceCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.plusProduce = plusProduceAfter;
                }
                
                if(vatPlusProduce){
                    dataUpdate.vatPlusProduce = vatPlusProduce;

                    // Giá trị vatPlusProduce hiện tại lúc chưa thay đổi
                    let vatPlusProduceCurrent = infoContractProduction.vatPlusProduce;

                    // Giá trị chênh lệch khi thay đổi
                    let vatPlusProduceAfter   = vatPlusProduce - vatPlusProduceCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.vatPlusProduce = vatPlusProduceAfter;
                }

                let infoAterUpdate = await CMCS__CONTRACT_PRODUCTION_COLL.findByIdAndUpdate(contractProductionID, dataUpdate, { new: true });
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_contract_ipc", status: 403 });

                // Cập nhật Hợp đồng (Precaculate)
                let infoContractAfterUpdate = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE}`, {
                    contractID: `${contractID}`, dataInc: updateContract
                })

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
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
}

exports.MODEL = new Model;