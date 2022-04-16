"use strict";

const ObjectID                          = require('mongoose').Types.ObjectId;
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

/**
 * import inter-coll, exter-coll
 */
const CMCS__CONTRACT_PAYMENT_COLL       = require('../database/cmcs.contract_payment-coll');
const CMCS__CONTRACT_IPC_COLL           = require('../database/cmcs.contract_ipc-coll');

const CMCS__CONTRACT_IPC_MODEL          = require('./cmcs.contract_ipc-model').MODEL;

const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { KEY_ERROR }                     = require('../../../tools/keys/index');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {
    constructor() {
        super(CMCS__CONTRACT_PAYMENT_COLL);
    }
    /**
     * Name: insert contract payment ✅
     * Author: Depv
     */
    insert({ contractID, ipc, date, name, sign, description, value, userID, ctx  }) {
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

                let infoIPC = await CMCS__CONTRACT_IPC_COLL.findById(ipc);
                if(!infoIPC)
                    return resolve({ error: true, message: "IPC không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID });

                let dataInsert = { userCreate: userID, type: infoIPC.type, outin, real, field, chair, personInCharge, buyerInfo, sellerInfo, company, project, contract: contractID };

                if(ipc){
                    dataInsert.ipc = ipc;
                }

                if(date){
                    dataInsert.date = date;
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

                if(value){
                    dataInsert.value = value;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED });

                /**
                 * CẬP NHẬT CHO PHẦN IPC
                 */    
                await CMCS__CONTRACT_IPC_MODEL.updateValue({ option: 3, ipcID: ipc, userID })

                /**
                 * CẬP NHẬT CHO PHẦN HỢP ĐỒNG
                 */   
                await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE_VALUE}`, {
                    option: 2,
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
     * Name: update contract payment ✅
     * Author: Depv
     */
    update({ contractPaymentID, ipc, date, name, sign, description, value, userID, ctx  }){
        const that = this
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * Bước 1: Cập nhật thông tin vào IPC
                 * Bước 2: Cập nhật thông tin vào Hợp đồng
                 * Bước 3: Cập nhật thông tin vào dự án => Nếu là dòng tiền của hợp đồng mua vào
                 */
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };
                if(!checkObjectIDs(contractPaymentID))
                    return resolve({ error: true, message: "contractPaymentID không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID })

                let infoPayment = await CMCS__CONTRACT_PAYMENT_COLL.findById(contractPaymentID);
                if(!infoPayment)
                    return resolve({ error: true, message: "Payment không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID });

                let infoIPC = await CMCS__CONTRACT_IPC_COLL.findById(infoPayment.ipc);    
                let contractID = infoPayment.contract;

                dataUpdate.type = Number(infoIPC.type);

                if(date){
                    dataUpdate.date =date;
                }

                if(name){
                    dataUpdate.name =name;
                }

                if(sign){
                    dataUpdate.sign =sign;
                }

                if(description){
                    dataUpdate.description = description;
                }

                // Cập nhật giá trị cho IPC, Hợp đồng và Dự án
                if(value){
                    dataUpdate.value = value;
                }

                let infoAfterUpdate = await CMCS__CONTRACT_PAYMENT_COLL.findByIdAndUpdate(contractPaymentID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED });

                /**
                 * CẬP NHẬT CHO PHẦN IPC
                 */    
                await CMCS__CONTRACT_IPC_MODEL.updateValue({ option: 3, ipcID: ipc, userID })

                /**
                 * CẬP NHẬT CHO PHẦN HỢP ĐỒNG
                 */   
                await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE_VALUE}`, {
                    option: 2,
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
     * Name: Remove contract payment ✅
     * Author: Depv
     */

    /**
     * Name: get info contract payment ✅
     * Author: Depv
     */
    getInfo({ contractPaymentID, select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(contractPaymentID))
                    return resolve({ error: true, message: 'param_invalid' });

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

                let infoContractIPC = await CMCS__CONTRACT_PAYMENT_COLL.findById(contractPaymentID)
                                .select(select)
                                .populate(populates)

				if (!infoContractIPC) return resolve({ error: true, message: 'cannot_get' });

                return resolve({ error: false, data: infoContractIPC });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Danh sách contract payment ✅
     * Author: Depv
     */
    getList({ contractID,
        keyword, limit = 10, lastestID, select, populates= {} }) {
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

                if(contractID && checkObjectIDs(contractID)){
                    conditionObj.contract = contractID;
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                }

                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await CMCS__CONTRACT_PAYMENT_COLL.findById(lastestID);
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

                let infoDataAfterGet = await CMCS__CONTRACT_PAYMENT_COLL.find(conditionObj)
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

                let totalRecord = await CMCS__CONTRACT_PAYMENT_COLL.count(conditionObjOrg);
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
     * Date: 04/04/2022
     */
    getAmountByMonth({ userID, companyID, outin, year, ctx }){
        return new Promise(async resolve => {
            try {
                let listData = await CMCS__CONTRACT_PAYMENT_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            outin: Number(outin),
                        }
                    },
                    {
                        $project : {
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                            value: 1
                        }
                    },
                    {
                        $match: {
                            "year": Number(year),
                        }
                    },
                    {
                        $group: {
                            _id: { month: "$month"},
                            amount: { $sum: "$value" }
                        }
                    },
                    {$sort: {"_id.month": 1}}
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
     * Date: 16/04/2022
     */
    getAmountByObject({ userID, outin, companyID, projectID, contractID, ipcID }){
        return new Promise(async resolve => {
            try {
                let value1 = 0
                let value2 = 0

                let conditionObj1 = { type: 1 }, conditionObj2 = { type: 2 }

                if(!isNaN(outin) && Number(outin) >= 0){
                    conditionObj1.outin = outin
                    conditionObj2.outin = outin
                }

                if(companyID && checkObjectIDs(companyID)){
                    conditionObj1.company = ObjectID(companyID)
                    conditionObj2.company = ObjectID(companyID)
                }

                if(projectID && checkObjectIDs(projectID)){
                    conditionObj1.project = ObjectID(projectID)
                    conditionObj2.project = ObjectID(projectID)
                }

                if(contractID && checkObjectIDs(contractID)){
                    conditionObj1.contract = ObjectID(contractID)
                    conditionObj2.contract = ObjectID(contractID)
                }

                if(ipcID && checkObjectIDs(ipcID)){
                    conditionObj1.ipc = ObjectID(ipcID)
                    conditionObj2.ipc = ObjectID(ipcID)
                }

                // Tạm ứng
                let listData1 = await CMCS__CONTRACT_PAYMENT_COLL.aggregate([
                    {
                        $match: conditionObj1
                    }, 
                    {
                        $group: {
                            _id: { },
                            value: { $sum: "$value" },
                        }
                    }, 
                ])
                console.log(listData1)
                
                // Thanh toán
                let listData2 = await CMCS__CONTRACT_PAYMENT_COLL.aggregate([
                    {
                        $match: conditionObj2
                    }, 
                    {
                        $group: {
                            _id: { },
                            value: { $sum: "$value" },
                        }
                    }, 
                ])
                console.log(listData2)

                if(listData1 && listData1.length){
                    value1 = Number(listData1[0].value)
                }

                if(listData2 && listData2.length){
                    value2 = Number(listData2[0].value)
                }

                return resolve({ error: false, data: { value1, value2 } });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Danh sách theo tháng trong năm✅
     * Author: Hiepnh
     *  Date: 04/04/2022
     */
    getListByMonth({ userID, companyID, outin, month, year, 
        keyword, limit = 20, lastestID, select, populates= {} }){
        return new Promise(async resolve => {
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

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                }

                // Danh sách các Payment trong tháng, năm của công ty
                let listData = await CMCS__CONTRACT_PAYMENT_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            outin: Number(outin),
                        }
                    },
                    {
                        $project : {
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                        }
                    },
                    {
                        $match: {
                            "year": Number(year),
                            "month": Number(month),
                        }
                    },
                    {$sort: {"date": 1}}
                ])
                conditionObj._id = {$in: listData.map(item=>item._id)}

                // Trả về danh sách mẩu tin
                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await CMCS__CONTRACT_PAYMENT_COLL.findById(lastestID);
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

                let infoDataAfterGet = await CMCS__CONTRACT_PAYMENT_COLL.find(conditionObj)
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

                let totalRecord = await CMCS__CONTRACT_PAYMENT_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Lấy danh sách contract value, group theo tháng năm
	 * Date: 05/04/2022
	 */
	getAmountContractValueGroupByDate({ projectID, userID, ctx }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs([projectID])) {
                    return resolve({
                        error: true,
                        message: "Tham số projectID không hợp lệ",
                        keyError: "params_projectID_invalid",
                        status: 400
                    });
                }

                const listData = await CMCS__CONTRACT_PAYMENT_COLL.aggregate([
                    {
                        $match: {
                            project: ObjectID(projectID),
                        }
                    },
                    {
                        $project : {
                            year : { $year : "$date" },
                            month : { $month : "$date" },
                            value: 1
                        }
                    },
                    {
                        $group: {
                            _id: { month: "$month", year: "$year" },
                            amount: { $sum: "$value" }
                        }
                    },
                    {
                        $sort: {
                            "_id.month": 1,
                            "_id.year": 1,
                        }
                    }
                ])

                return resolve({
                    error: false,
                    data: {
                        listRecords: listData
                    },
                    status: 200
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;