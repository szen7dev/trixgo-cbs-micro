"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const ObjectID                          = require('mongoose').Types.ObjectId;
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

/**
 * import inter-coll, exter-coll
 */
const FIN__CASH_FLOW_PLAN_COLL          = require('../database/fin.cash_flow_plan-coll');

const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { KEY_ERROR }                     = require('../../../tools/keys/index');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               
    constructor() {
        super(FIN__CASH_FLOW_PLAN_COLL);
    }
    /**
     * Name: insert cash flow ✅
     * Author: Depv
     */
    insert({ companyID, contractID, fundaID, parentID, type, property, outin, name, sign, note, date, value, userID, ctx }) { 
        return new Promise(async (resolve) => {
            try {
                let dataInsert = { userCreate: userID, company: companyID, outin, name, date, value };

                if(checkObjectIDs(contractID)){
                    const infoContract = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_GET_INFO_AND_GET_LIST}`, {
                        contractID
                    })
                    // console.log('===========================')
                    // console.log(infoContract)
                    if(infoContract){
                        const { outin, real, field, chair, personInCharge, buyerInfo, sellerInfo, company, project } = infoContract.data;
                        dataInsert.outin = outin
                        dataInsert.real = real
                        dataInsert.field = field
                        dataInsert.chair = chair
                        dataInsert.personInCharge = personInCharge
                        dataInsert.buyerInfo = buyerInfo
                        dataInsert.sellerInfo = sellerInfo
                        dataInsert.company = company
                        dataInsert.project = project
                    }
                }

                if(checkObjectIDs(fundaID)){
                    dataInsert.funda = funda;
                }

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }

                if(!isNaN(type)){
                    dataInsert.type = Number(type);
                }

                if(!isNaN(property)){
                    dataInsert.property = Number(property);
                }

                if(name){
                    dataInsert.name = name;
                }

                if(sign){
                    dataInsert.sign = sign;
                }

                if(note){
                    dataInsert.note = note;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED });

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: update cash flow ✅
     * Author: Depv
     */
    // update({ contractPaymentID, ipc, date, name, sign, description, value, userID  }){
    //     return new Promise(async (resolve) => {
    //         try {
    //             /**
    //              * DECALARTION VARIABLE (1)
    //              */
    //             let dataUpdate = { userUpdate: userID };
    //             if(!checkObjectIDs(contractPaymentID))
    //                 return resolve({ error: true, message: "contractPaymentID không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID })

    //             if(ipc){
    //                 dataUpdate.ipc =ipc;
    //                 let infoIPC = await CMCS__CONTRACT_IPC_COLL.findById(ipc);
    //                 if(!infoIPC)
    //                     return resolve({ error: true, message: "IPC không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID });
    //                 dataUpdate.type =infoIPC.type;
    //             }

    //             if(date){
    //                 dataUpdate.date =date;
    //             }

    //             if(name){
    //                 dataUpdate.name =name;
    //             }

    //             if(sign){
    //                 dataUpdate.sign =sign;
    //             }

    //             if(description){
    //                 dataUpdate.description = description;
    //             }
                
    //             if(value){
    //                 dataUpdate.value =value;
    //             }

    //             console.log({ contractPaymentID, dataUpdate })
             
    //             let infoAterUpdate = await FIN__CASH_FLOW_PLAN_COLL.findByIdAndUpdate(contractPaymentID, dataUpdate, { new: true });
    //             if(!infoAterUpdate)
    //                 return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED });
              
    //             return resolve({ error: false, data: infoAterUpdate, status: 200 });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message, status: 500 });
    //         }
    //     })
    // }

    /**
     * Name: Remove cash flow ✅
     * Author: Depv
     */
    // remove({ contractPaymentID, userID }) { 
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!checkObjectIDs(contractPaymentID))
    //                 return resolve({ error: true, message: 'Request params contractPaymentID invalid' });

    //             let checkAuthor = await FIN__CASH_FLOW_PLAN_COLL.findOne({ _id: contractPaymentID, userCreate: userID });
    //             if(!checkAuthor)
    //                 return resolve({ error: true, message: 'Bạn không có quyền xóa hoặc ID không tồn tại', keyError: KEY_ERROR.DELETE_FAILED }); 
                
    //             let infoAterRemove = await FIN__CASH_FLOW_PLAN_COLL.findByIdAndDelete(contractPaymentID);
    //             if(!infoAterRemove)
    //                 return resolve({ error: true, message: "can't_remove", keyError: KEY_ERROR.DELETE_FAILED });
 
    //             return resolve({ error: false, message: "Xóa thành công" });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message, status: 500 });
    //         }
    //     })
    // }

    /**
     * Name: get info cash flow ✅
     * Author: Depv
     */
    // getInfo({ contractPaymentID, select, populates }){
    //     return new Promise(async resolve => {
    //         try {
    //             if (!checkObjectIDs(contractPaymentID))
    //                 return resolve({ error: true, message: 'param_invalid' });

    //             if(populates && typeof populates === 'string'){
	// 				if(!IsJsonString(populates))
	// 					return resolve({ error: true, message: 'Request params populates invalid', status: 400 });
	// 				populates = JSON.parse(populates);
	// 			}else{
	// 				populates = {
    //                     path: "",
    //                     select: ""
    //                 }
    //             }

    //             let infoContractIPC = await FIN__CASH_FLOW_PLAN_COLL.findById(contractPaymentID)
    //                             .select(select)
    //                             .populate(populates)

	// 			if (!infoContractIPC) return resolve({ error: true, message: 'cannot_get' });

    //             return resolve({ error: false, data: infoContractIPC });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }

    /**
     * Name  : Danh sách cash flow ✅
     * Author: Depv
     */
    getList({ companyID, projectID, contractID, outin, type, property, priority,
        keyword, limit = 20, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {
                if(limit > 20){
                    limit = 20;
                } else{
                    limit = +limit;
                }

                let sortBy;
                let conditionObj = {};
                let keys	     = ['createAt__-1', '_id__-1'];
              
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

                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = companyID;
                }

                if(projectID && checkObjectIDs(projectID)){
                    conditionObj.project = projectID;
                }

                if(contractID && checkObjectIDs(contractID)){
                    conditionObj.contract = contractID;
                }

                if(!isNaN(outin)){
                    conditionObj.outin = Number(outin);
                }

                if(!isNaN(type)){
                    conditionObj.type = Number(type);
                }

                if(!isNaN(property)){
                    conditionObj.property = Number(property);
                }

                if(!isNaN(priority)){
                    conditionObj.priority = Number(priority);
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                }

                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await FIN__CASH_FLOW_PLAN_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }
                
                let infoDataAfterGet = await FIN__CASH_FLOW_PLAN_COLL.find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean(); 

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data" });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await FIN__CASH_FLOW_PLAN_COLL.count(conditionObjOrg);
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