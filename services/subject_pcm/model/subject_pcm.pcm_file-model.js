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
const PCM_FILE__COLL                    = require('../database/subject_pcm.pcm_file-coll');
const PCM_PLAN_TASK__COLL               = require('../database/subject_pcm.pcm_plan_task-coll');
const PCM_PLAN_GROUP__COLL              = require('../database/subject_pcm.pcm_plan_group-coll');

class Model extends BaseModel {

    constructor() {
        super(PCM_FILE__COLL);
    }

    /**
	 * Dev: MinhVH
	 * Func: Thêm pcm file
	 * Date: ...
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
	 * Func: Lấy danh sách file
     * Dev: MinhVH
     * Update: Hiepnh
	 * Date: 26/4/2022
	 */
    getList({
        companyID, projectID, groupID, taskID, authorID, keyword, type, fromDate, toDate,
        limit = 10, lastestID, select, populates, isFileOfProject, isSearchFile, userID, ctx
    }) {
        console.log({
            companyID, projectID, groupID, taskID, authorID, keyword, type, fromDate, toDate,
            isFileOfProject, isSearchFile, userID
        })
        return new Promise(async (resolve) => {
            try {
                /**
                 * Kiểm tra bắt buộc phải có companyID hoặc projectID hoặc groupID hoặc taskID, Nếu không thuộc trường hợp:
                 * - Tìm kiếm file (VIAS)
                 * - Lấy danh sách file của tất cả dự án mà user là member
                 */
                if(!isFileOfProject && !isSearchFile) {
                    if(!companyID && !projectID && !groupID && !taskID) {
                        return resolve({
                            error: true,
                            message: "Tham số companyID || projectID || groupID || taskID là cần thiết",
                            keyError: "params_invalid",
                            status: 400
                        });
                    }
                }

                if(limit > 20){
                    limit = 20;
                } else{
                    limit = +limit;
                }

                let sortBy;

                let conditionObj = {}
                let conditionObjTask = {} // Tìm kiếm task
                let conditionObjGroup = {} // Tìm kiếm group

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

                /**
                 * KIỂM TRA ĐIỀU KIỆN
                 * Về nguyên tắc các taskID/groupID/projectID/companyID chỉ được lấy hoặc, không thể diễn ra đồng thời
                 */
                if(taskID && checkObjectIDs(taskID)){
                    conditionObj.task = ObjectID(taskID)
                }else{
                    if(groupID && checkObjectIDs(groupID)){
                        conditionObj.group = ObjectID(groupID)
                    }else{
                        if(projectID && checkObjectIDs(projectID)){
                            conditionObj.project = ObjectID(projectID)
                        }else{
                            if(companyID && checkObjectIDs(companyID)){
                                conditionObj.company = ObjectID(companyID)
                            }
                        }
                    }
                }

                if(checkObjectIDs(authorID)) {
                    conditionObj.author = ObjectID(authorID)
                }

                if(type){
                    conditionObj.type = type;
                }

                if(fromDate && toDate) {
                    conditionObj.createAt = {
                        $gte: moment(fromDate).startOf('days').toDate(),
                        $lte: moment(toDate).endOf('days').toDate()
                    }
                }
                // console.log(conditionObj)

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.nameOrg = new RegExp(keyword, 'i');
                }

                /***
                 * Lấy danh sách file của dự án mà user là Members
                 * Phục vụ lấy file từ ngoài trang chủ, từ tất cả các dự án
                 */
                if(isFileOfProject) {
                    const dataProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST_IS_MEMBERS}`, {
                        unLimit: true,
                        select: '_id'
                    });
                    const { error, data } = dataProject;

                    if(!error) {
                        const projectsID = data?.listRecords?.map(item => item._id) ?? [];

                        if(projectsID.length) {
                            conditionObj.project = {
                                $in: projectsID
                            }
                        }
                    }
                }

                // Tìm kiếm file (VIAS)
                if(isSearchFile) {
                    console.log('isSearchFile============>>>>>>>>>>>>>>>>>>>>>')

                    // Danh sách các Group mà user là members hoặc amdins
                    if(projectID && checkObjectIDs(projectID)){
                        // Điều kiện tìm kiếm task
                        conditionObjTask.project = ObjectID(projectID)

                        // Điều kiện tìm kiếm Group
                        conditionObjGroup.project = ObjectID(projectID)
                        conditionObjGroup.$or = [
                            { admins: { $in: [userID] } },
                            { members: { $in: [userID] } },
                        ]
                    }else{
                        conditionObjGroup.$or = [
                            { admins: { $in: [userID] } },
                            { members: { $in: [userID] } },
                        ]
                    }
                    // console.log('conditionObjGroup===========>>>>>>>>>>>>>>>>>>>>>')
                    // console.log(conditionObjGroup)

                    const listGroupUserIsMember = await PCM_PLAN_GROUP__COLL
                        .find(conditionObjGroup)
                        .select('_id')
                        .lean();

                    // console.log('List Group===========>>>>>>>>>>>>>>>>>>>>>')
                    // console.log(listGroupUserIsMember)

                    const groupsID = listGroupUserIsMember.map(item => item._id)

                    conditionObjTask.$or = [
                        { author: userID },
                        { assignee: userID },
                        { related: { $in: [userID] } },
                        { group: { $in: groupsID } }
                    ]

                    // console.log('conditionObjTask===========>>>>>>>>>>>>>>>>>>>>>')
                    // console.log(conditionObjTask)

                    // Danh sách các Task mà user có quyền truy cập
                    const listTaskUserIsMember = await PCM_PLAN_TASK__COLL
                        .find(conditionObjTask)
                        .select('_id project')
                        .lean()
                    // console.log(listTaskUserIsMember.length)

                    const projectsID    = [];
                    const tasksID       = [];

                    listTaskUserIsMember.map(task => {
                        // projectsID[projectsID.length] = task.project;
                        tasksID[tasksID.length] = task._id;
                    })

                    conditionObj.task = { $in: tasksID }

                    // Mẹo xử lý phân trang của Minh
                    // conditionObj.$or = [
                    //     {
                    //         $and: [
                    //             { task: { $in: tasksID } },
                    //         ]
                    //     },
                    //     {
                    //         $and: [
                    //             { task: { $in: tasksID } },
                    //         ]
                    //     }
                    // ]

                    // console.log('Final==============>conditionObj')
                    // console.log(conditionObj)
                }

                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await PCM_FILE__COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				} else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await PCM_FILE__COLL
                    .find(conditionObj)
                    .select(select)
                    .limit(limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet) {
                    return resolve({
                        error: true,
                        message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục',
                        keyError: 'error_occurred',
                        status: 422
                    });
                }

                let nextCursor	= null;

                if(infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await PCM_FILE__COLL.countDocuments(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({
                    error: false,
                    data: {
                        listRecords: infoDataAfterGet,
                        limit,
                        totalRecord,
                        totalPage,
                        nextCursor,
                    },
                    status: 200
                });
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
                        select: 'startTime'
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
                    count: { $sum: 1 }
				}

                const pipeline = [
                    {
                        $match: conditionObj
                    },
                    {
                        $group: groupObj
                    },
                    {
                        $sort: {
                            _id: -1
                        }
                    }
                ]

                const dataFilesGroupByDate = await PCM_FILE__COLL.aggregate(pipeline);

                if(!dataFilesGroupByDate) {
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
	getListFilesGroupByContract({ keyword, projectID, userID }){
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
                    project: ObjectID(projectID),
                    contract: { $exists: true, $ne: null }
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
                    {
                        $sort: {
                            _id: -1
                        }
                    }
                ]

                const dataFilesGroupByContract = await PCM_FILE__COLL.aggregate(pipeline);

                if(!dataFilesGroupByContract) {
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

                await PCM_FILE__COLL.populate(dataFilesGroupByContract, {
                    path: "contract",
                    select: "_id name photos",
                    // match: conditionKeyword,
                    populate: {
                        path: "photos",
                        select: "nameOrg path description"
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