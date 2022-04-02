"use strict";

/**
 * External
 */
const ObjectID                          = require('mongoose').Types.ObjectId;
const moment                            = require('moment');

/**
 * Tools
 */
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const { KEY_ERROR }			            = require('../../../tools/keys');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

/**
 * import inter-coll, exter-coll
 */
const PCM_FILE_COLL = require('../database/subject_pcm.pcm_file-coll');

class Model extends BaseModel {

    constructor() {
        super(PCM_FILE_COLL);
    }

    /**
     * Thêm pcm_file: DePV ✅
     */
    insert({
        companyID, projectID, groupID, contractID, taskID, commentID, fileID,
        type, nameOrg, name, description, path, size, mimeType, authorID
    }) {
        return new Promise(async (resolve) => {
            try {
                let dataInsert = { author: authorID };

                if(checkObjectIDs(companyID)){
                    dataInsert.company = companyID;
                }

                if(checkObjectIDs(projectID)){
                    dataInsert.project = projectID;
                }

                if(checkObjectIDs(groupID)){
                    dataInsert.group = groupID;
                }

                if(checkObjectIDs(contractID)){
                    dataInsert.contract = contractID;
                }

                if(checkObjectIDs(taskID)){
                    dataInsert.task = taskID;
                }

                if(checkObjectIDs(commentID)){
                    dataInsert.comment = commentID;
                }

                if(checkObjectIDs(fileID)){
                    dataInsert.file = fileID;
                }

                type        && (dataInsert.type         = type);
                nameOrg     && (dataInsert.nameOrg      = nameOrg);
                name        && (dataInsert.name         = name);
                path        && (dataInsert.path         = path);
                size        && (dataInsert.size         = size);
                mimeType    && (dataInsert.mimeType     = mimeType);
                description && (dataInsert.description  = description);

                let infoDataAfterInserted = await this.insertData(dataInsert);
                if(!infoDataAfterInserted)
                    return resolve({ error: true, keyError: KEY_ERROR.INSERT_FAILED, status: 403 });

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Danh sách file pcm: Depv ✅
     */
    getList({
        companyID, projectID, groupID, taskID, type,
        limit = 10, lastestID, select, populates }) {
        return new Promise(async (resolve) => {
            try {
                if(!companyID && !projectID && !groupID && !taskID) {
					return resolve({
                        error: true,
                        message: 'Request params require companyID || projectID || groupID || taskID',
                        status: 400
                    });
                }

                if(limit > 20){
                    limit = 20
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
				} else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                if(checkObjectIDs(companyID)){
                    conditionObj.company = companyID;
                }

                if(checkObjectIDs(projectID)){
                    conditionObj.project = projectID;
                }

                if(checkObjectIDs(groupID)){
                    conditionObj.group = groupID;
                }

                if(checkObjectIDs(taskID)){
                    conditionObj.task = taskID;
                }

                if(type){
                    conditionObj.type = type;
                }

                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await PCM_FILE_COLL.findById(lastestID);
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

                let infoDataAfterGet = await PCM_FILE_COLL
                    .find(conditionObj)
                    .select(select)
                    .limit(limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 422 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await PCM_FILE_COLL.countDocuments(conditionObjOrg);
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
	 * Dev: MinhVH
	 * Func: Lấy danh sách file, group theo tháng năm
	 * Date: 12/08/2021
	 */
	getListFilesGroupByDate({ companyID, projectID, userID, ctx }){
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

				let conditionObj = { type: 1 }; // Hình ảnh (type = 1)

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
                        companyID,
                        // select: 'startTime'
                    })

                    if(infoProject.error) return resolve(infoProject);

					conditionObj.project = ObjectID(projectID);
                    conditionObj.createAt = {
						$gte: new Date(moment(infoProject.data?.startTime).startOf('day').format()),
					};
				}

				const groupObj = {
					_id: { $dateToString: { format: "%Y-%m", date: "$createAt" } },
					dataFormat: {
						$first: {
							$dateToString: { format: "%m/%Y", date: "$createAt" }
						}
					},
                    count: { $sum: 1 }
				}

                const pipeline = [
                    {
                        $match: conditionObj
                    },
                    {
                        $group: groupObj
                    },
                ]

                const dataFilesGroupByDate = await PCM_FILE_COLL.aggregate(pipeline);
                console.log({ dataFilesGroupByDate, conditionObj });

                if(!dataFilesGroupByDate || !dataFilesGroupByDate.length) {
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
						listRecords: dataFilesGroupByDate,
					},
					status: 200,
				})
			} catch (error) {
                console.error(error);
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

    /**
	 * Dev: MinhVH
	 * Func: Lấy danh sách file, group theo hợp đồng
	 * Date: 12/08/2021
	 */
	getListFilesGroupByContract({ keyword, userID }){
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

                // Hình ảnh (type = 1)
				let conditionObj = {
                    type: 1,
                    contract: { $exists: true }
                };
                let conditionKeyword = {};

				const groupObj = {
					_id: "$contract",
                    contract: { $first: '$contract' },
                    count: { $sum: 1 }
				}

                const pipeline = [
                    {
                        $match: conditionObj
                    },
                    {
                        $group: groupObj
                    },
                ]

                const dataFilesGroupByContract = await PCM_FILE_COLL.aggregate(pipeline);

                if(!dataFilesGroupByContract || !dataFilesGroupByContract.length) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurred",
                        status: 422
                    });
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionKeyword['contract.name'] = new RegExp(keyword, 'i');
                }

                await PCM_FILE_COLL.populate(dataFilesGroupByContract, {
                    path: "contract",
                    select: "_id name photos",
                    match: conditionKeyword,
                    populate: {
                        path: "photos",
                        select: "nameOrg path"
                    }
                })

				return resolve({
					error: false,
					data: {
						listRecords: dataFilesGroupByContract,
					},
					status: 200,
				})
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

}

exports.MODEL = new Model;