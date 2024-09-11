"use strict";

const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const ObjectID                          = require('mongoose').Types.ObjectId;

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString, validateParamsObjectID }  = require('../../../tools/utils/utils');
const { compareTwoTime }  = require('../../../tools/utils/time_utils');
const { KEY_ERROR }			            = require('../../../tools/keys');
const { PCM_STATUS_TASK }			    = require('../../../tools/constants');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { uploadFileS3 }                  = require('../../../tools/s3');

const USER_COLL                         = require('../../auth/database/auth.user-coll')
const PCM_PLAN_REPORT_COLL              = require('../database/subject_pcm.pcm_plan_report-coll');

const PCM_PLAN_TASK_MODEL               = require('../model/subject_pcm.pcm_plan_task').MODEL;


class Model extends BaseModel {

    constructor() {
        super(PCM_PLAN_REPORT_COLL);
    }

    /**
     * Name: insert pcm_plan_report
     * Author: HiepNH
     * Code: 12/9/2024
     */
    insert({ companyID, projectID, type, name, description, conditionPin, parentID, userID }) {
        // console.log('============Tạo báo cáo động===============')
        // console.log({ companyID, projectID, type, name, description, conditionPin, parentID, userID })
        return new Promise(async (resolve) => {
            try {
                let dataInsert = { };

                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(!checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

                dataInsert = { 
                    company: companyID, 
                    author: userID, 
                    userUpdate: userID, 
                    members: [userID] 
                }

                if(type){
                    dataInsert.type = type;
                }

                if(name){
                    dataInsert.name = name;
                }

                if(description) {
                    dataInsert.description = description;
                }

                if(conditionPin){
                    dataInsert.conditionPin = conditionPin;
                }

                if(ObjectID.isValid(parentID)){
                    dataInsert.parent = parentID;
                }

                if(ObjectID.isValid(projectID)){
                    dataInsert.project = projectID;
                }

                let infoAfterInsert = await this.insertData(dataInsert)

                if(!infoAfterInsert)
                    return resolve({ error: true, message: KEY_ERROR.INSERT_FAILED, keyError: KEY_ERROR.INSERT_FAILED, status: 403 });

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

     /**
     * Name: update pcm_plan_report
     * Author: HiepNH
     * Code: 12/9/2024
     */
    update({ reportID, name, type, description, userID, select, members, conditionPin, option, taskID, reportsID, reportsRemoveID }) {
        // console.log('============Cập nhật báo cáo động===============')
        // console.log({ reportID, name, type, description, userID, select, members, conditionPin, option, taskID, reportsID, reportsRemoveID })
        return new Promise(async (resolve) => {
            try {
                if(!option){
                    let dataUpdate = { userUpdate: userID };

                    if(!checkObjectIDs(userID))
                        return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                    if(!checkObjectIDs(reportID))
                        return resolve({ error: true, message: 'Request params reportID invalid', status: 400 });

                    const infoReport = await PCM_PLAN_REPORT_COLL
                        .findById(reportID)
                        .select('author')
                        .lean();

                    if(!infoReport) {
                        return resolve({
                            error: true,
                            message: 'Report không tồn tại',
                            keyError: 'report_not_exists',
                            status: 403
                        });
                    }

                    if(infoReport.author?.toString() === userID.toString()) {
                        if(members && members.length) {
                            if(checkObjectIDs(members)) {
                                members = [...new Set(members)];
                                dataUpdate.members = members;
                            } else{
                                dataUpdate.members = [];
                            }
                        }
                    } else if(checkObjectIDs(members)){
                        return resolve({
                            error: true,
                            message: 'Bạn không có quyền chia sẻ',
                            keyError: "permission_denined",
                            status: 403
                        });
                    }

                    if(name){
                        dataUpdate.name = name;
                    }

                    if(description) {
                        dataUpdate.description = description;
                    }

                    if(type){
                        dataUpdate.type = type;
                    }

                    if(conditionPin){
                        // console.log(conditionPin) 
                        conditionPin.sortOption = 1 // Dùng để lọc dữ liệu
                        dataUpdate.conditionPin = conditionPin;
                    }

                    let infoAfterUpdate = await PCM_PLAN_REPORT_COLL
                        .findByIdAndUpdate(reportID, dataUpdate, { new: true })
                        .select(select);

                    if(!infoAfterUpdate)
                        return resolve({ error: true, message: "Can't update pcm plan report", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

                    return resolve({ error: false, data: infoAfterUpdate, status: 200 });
                }else{
                    for(const item of reportsID){
                        let info = await PCM_PLAN_REPORT_COLL.findByIdAndUpdate(item, {
                            $addToSet: {
                                subjects: taskID
                            }
                        }, { new: true })
                    }

                    for(const item of reportsRemoveID){
                        let info = await PCM_PLAN_REPORT_COLL.findByIdAndUpdate(item, {
                            $pull: {
                                subjects: taskID
                            }
                        }, { new: true })
                    }

                    return resolve({ error: false, data: {option, taskID, reportsID}, status: 200 });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

     /**
     * Name: Remove pcm_plan_report
     * Author: Depv
     * Code: F02503
     */
    remove({ reportsID, userID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(!reportsID.length || !checkObjectIDs(reportsID))
                    return resolve({ error: true, message: 'Request params reportsID invalid', status: 400 });

                const infoAfterUpdate = await PCM_PLAN_REPORT_COLL.deleteMany({
                    _id: {
                        $in: reportsID
                    },
                    author: userID
                });

                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Can't remove subject", keyError: KEY_ERROR.DELETE_FAILED, status: 403 });

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Get info pcm_plan_report
     * Author: Depv
     * Code: F02504
     */
    getInfo({ reportID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(reportID))
                    return resolve({ error: true, message: 'Request params reportID invalid', status: 400 });

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

                let infoData = await PCM_PLAN_REPORT_COLL.findById(reportID)
                                .select(select)
                                .populate(populates)
                                .lean();
                if(!infoData)
                    return resolve({ error: true, message: "Can't get info subject", keyError: KEY_ERROR.GET_INFO_FAILED, status: 403 })
                // console.log(infoData)

                return resolve({ error: false, data: infoData, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Danh sách pcm_plan_report
     * Author: Depv
     * Code:
     */
    getList({ keyword, limit = 50, lastestID, type, parentID, userID, select, populates= {} }) {
        // console.log('=================>>>>>>>>>>>>>>Báo cáo động================')
        // console.log({ keyword, limit, lastestID, type, parentID, userID, select, populates })
        return new Promise(async (resolve) => {
            try {
                if(limit > 50){
                    limit = 50
                }else{
                    limit = +limit;
                }

                let conditionObj = {  }
                conditionObj.$or = [
                    { author: userID },
                    { members: {$in: [userID]} },
                ]

                let sortBy;
                let keys	 = ['createAt__-1', '_id__-1'];

                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID;
                }else{
                    conditionObj.parent = null;
                }

                if(type){
                    conditionObj.type = type;
                }

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

                // SEARCH TEXT
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

                let conditionObjOrg = { ...conditionObj };

				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await PCM_PLAN_REPORT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
                    sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await PCM_PLAN_REPORT_COLL.find(conditionObj)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", keyError: KEY_ERROR.GET_LIST_FAILED, status: 403 });

                let totalRecord = await PCM_PLAN_REPORT_COLL.count(conditionObjOrg);
				let nextCursor	= null;
                let totalPage = Math.ceil(totalRecord/limit);

				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

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
     * Func: Export Task Report
     * Date: 28/05/2022
     */
    exportTaskReport({ reportID, userID }) {
        return new Promise(async resolve => {
            try {
                const validation = validateParamsObjectID({ reportID, userID });
                if(validation.error) return resolve(validation);

                const infoReport = await PCM_PLAN_REPORT_COLL
                    .findById(reportID)
                    .lean();

                if(!infoReport) 
                    return resolve({
                        error: true,
                        message: 'Report không tồn tại hoặc bạn không có quyền xem report',
                        keyError: 'report_not_exists',
                        status: 400
                    })
                

                const dataTaskByCondition = await PCM_PLAN_TASK_MODEL.getListByFilter({
                    ...infoReport.conditionPin,
                    select: 'assignee parent author name actualFinishTime percentage note status amountComment',
                    populates: JSON.stringify({
                        path: 'assignee parent author',
                        select: 'name sign fullname department',
                        populate: {
                            path: 'department',
                            select: 'name sign',
                        }
                    }),
                    unlimited: true,
                    userID
                })

                if(!dataTaskByCondition || !dataTaskByCondition?.data) {
                    return resolve({
                        error: true,
                        message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục',
                        keyError: 'error_occurred',
                        status: 422
                    });
                }

                const listTaskPin = dataTaskByCondition?.data || [];

                let listAssignee = await USER_COLL.find({_id: {$in: listTaskPin.map(item=>item.assignee._id)}})
                .select('fullname department')
                .populate({
                    path: 'department',
                    select: 'name sign',
                })

                // console.log(listAssignee)

                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/pcm_export_report.xlsx')))
                    .then(async workbook => {
                        
                        workbook.sheet("Data").row(1).cell(1).value(infoReport.name.toUpperCase());
                        workbook.sheet("Data").row(2).cell(1).value(infoReport.description);

                        const now = new Date();

                        var i = 4;
                        listTaskPin.map((item, index) => {
                            workbook.sheet("Data").row(i).cell(1).value(index+1)
                            workbook.sheet("Data").row(i).cell(2).value(item.name)
                            workbook.sheet("Data").row(i).cell(3).value(item?.parent?.name)
                            workbook.sheet("Data").row(i).cell(4).value(item?.actualFinishTime)
                            workbook.sheet("Data").row(i).cell(5).value(item.assignee?.fullname)
                            workbook.sheet("Data").row(i).cell(6).value(item.assignee?.department?.name)
                            workbook.sheet("Data").row(i).cell(7).value(Number(item.amountComment))

                            if( Number(item.status) != 3 && compareTwoTime(now, item?.actualFinishTime) == 1){
                                workbook.sheet("Data").row(i).cell(8).value('Quá hạn')
                            }

                            workbook.sheet("Data").row(i).cell(9).value(PCM_STATUS_TASK[item.status - 1].text)
                            workbook.sheet("Data").row(i).cell(10).value(item.author?.fullname)
                            if (item.note) {
                                workbook.sheet("Data").row(i).cell(11).value(item.note)
                            }

                            i++;
                        })

                        var i = 3;
                        listAssignee.map((item, index) => {
                            workbook.sheet("Report").row(i).cell(1).value(index+1)
                            workbook.sheet("Report").row(i).cell(2).value(item.fullname)
                            workbook.sheet("Report").row(i).cell(3).value(item.department?.name)

                            i++;
                        })
                        
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `pcm_report${now.getTime()}.xlsx`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);

                        const result = await uploadFileS3(pathWriteFile, fileName);
                        fs.unlinkSync(pathWriteFile);

                        return resolve({ error: false, data: result?.Location, status: 200 });
                    });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model