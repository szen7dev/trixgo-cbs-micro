"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const ObjectID                          = require('mongoose').Types.ObjectId;
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');
/**
 * import inter-coll, exter-coll
 */
const CMCS__CONTRACT_PAYMENT_COLL       = require('../database/cmcs.contract_payment-coll');
const CMCS__CONTRACT_IPC_COLL           = require('../database/cmcs.contract_ipc-coll');
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
        return new Promise(async (resolve) => {
            try {
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

                let infoAterInsert = await this.insertData(dataInsert);
                if(!infoAterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED });

                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: update contract payment ✅
     * Author: Depv
     */
    update({ contractPaymentID, ipc, date, name, sign, description, value, userID  }){
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };
                if(!checkObjectIDs(contractPaymentID))
                    return resolve({ error: true, message: "contractPaymentID không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID })

                if(ipc){
                    dataUpdate.ipc =ipc;
                    let infoIPC = await CMCS__CONTRACT_IPC_COLL.findById(ipc);
                    if(!infoIPC)
                        return resolve({ error: true, message: "IPC không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID });
                    dataUpdate.type =infoIPC.type;
                }

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

                if(value){
                    dataUpdate.value =value;
                }

                console.log({ contractPaymentID, dataUpdate })

                let infoAterUpdate = await CMCS__CONTRACT_PAYMENT_COLL.findByIdAndUpdate(contractPaymentID, dataUpdate, { new: true });
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Remove contract payment ✅
     * Author: Depv
     */
    remove({ contractPaymentID, userID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(contractPaymentID))
                    return resolve({ error: true, message: 'Request params contractPaymentID invalid' });

                let checkAuthor = await CMCS__CONTRACT_PAYMENT_COLL.findOne({ _id: contractPaymentID, userCreate: userID });
                if(!checkAuthor)
                    return resolve({ error: true, message: 'Bạn không có quyền xóa hoặc ID không tồn tại', keyError: KEY_ERROR.DELETE_FAILED });

                let infoAterRemove = await CMCS__CONTRACT_PAYMENT_COLL.findByIdAndDelete(contractPaymentID);
                if(!infoAterRemove)
                    return resolve({ error: true, message: "can't_remove", keyError: KEY_ERROR.DELETE_FAILED });

                return resolve({ error: false, message: "Xóa thành công" });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

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
        // console.log({ userID, companyID, outin, year })
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
     * Name: Danh sách theo tháng trong năm✅
     * Author: Hiepnh
     *  Date: 04/04/2022
     */
    getListByMonth({ userID, companyID, outin, month, year, 
        keyword, limit = 20, lastestID, select, populates= {} }){
        // console.log({ userID, companyID, outin, month, year, year })
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
                            amount: "value",
                            value : 1,
                            date : 1,
                            name: 1,
                            sign: 1,
                            note: 1,
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

                console.log(listData)
                if(listData.length){
                    conditionObjOrg._id = {$in: listData.map(item=>item._id)}
                }

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
	getAmountContractValueGroupByDate({ companyID, projectID, userID, ctx }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([userID])) {
					return resolve({
                        error: true,
                        message: "Tham số userID không hợp lệ",
                        keyError: "params_userID_invalid",
                        status: 400
                    });
                }

				let conditionObj = {};

				if(projectID){
                    if(!checkObjectIDs([projectID])) {
                        return resolve({
                            error: true,
                            message: "Tham số projectID không hợp lệ",
                            keyError: "params_projectID_invalid",
                            status: 400
                        });
                    }

                    let infoProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
                        departmentID: projectID,
                        // companyID,
                        // select: 'startTime'
                    })

                    if(infoProject.error) return resolve(infoProject);

					conditionObj.project = ObjectID(projectID);
                    conditionObj.createAt = {
						$gte: new Date(moment(infoProject.data?.startTime || Date.now()).startOf('day').format()),
					};
				}

				const groupObj = {
					_id: { $dateToString: { format: "%Y-%m", date: "$createAt" } },
					dataFormat: {
						$first: {
							$dateToString: { format: "%m/%Y", date: "$createAt" }
						}
					},
                    count: { $sum: "$value" }
				}

                const pipeline = [
                    {
                        $match: conditionObj
                    },
                    {
                        $group: groupObj
                    },
                ]

                const dataContractValueGroupByDate = await CMCS__CONTRACT_PAYMENT_COLL.aggregate(pipeline);

                if(!dataContractValueGroupByDate) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurred",
                        status: 422
                    });
                }

				return resolve({
					error: false,
					data: {
						listRecords: dataContractValueGroupByDate,
					},
					status: 200,
				})
			} catch (error) {
                console.error(error);
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}
}

exports.MODEL = new Model;