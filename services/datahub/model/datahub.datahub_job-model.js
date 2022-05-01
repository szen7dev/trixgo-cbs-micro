"use strict";

/**
 * EXTERNAL PACKAGE
 */
const stringUtils						 = require('../../../tools/utils/string_utils');
const ObjectID                           = require('mongoose').Types.ObjectId;

/**
 * CONSTANTS
 */

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');
const {
    checkObjectIDs,
    IsJsonString,
    _isValid
} = require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const DATAHUB_JOB_COLL           				= require('../database/datahub_job-coll');

class Model extends BaseModel {

    constructor() {
        super(DATAHUB_JOB_COLL);
    }

     /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 01/5/2022
     */
    insert({ parentID, sign, name, description, unit, note, unitprice, authorID }) {
        const that = this
        return new Promise(async resolve => {
            try {
                if(!name || !sign || !_isValid(authorID))
                    return resolve({ error: true, message: 'param_not_valid' })

                let dataInsert = {
                    name, 
                    sign, 
                    description, 
                    unit, 
                    note, 
                    unitprice: (unitprice && !isNaN(unitprice)) ? Number(unitprice).toFixed(0) : 0
                }

                // Công tác cha
                if(parentID && _isValid(parentID)){
                    dataInsert.parent = parentID
                }

                let infoAfterInsert = await that.insertData(dataInsert, authorID)
                if (!infoAfterInsert) 
                    return resolve({ error: true, message: 'cannot_insert' })
                
                return resolve({ error: false, data: infoAfterInsert })
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    /**
     * Cập nhật dữ liệu excel
     * - Thêm mới (nếu không có ID hệ thống)
     * - Cập nhật (nếu có ID hệ thống)
     * - Date: 01/5/2022
     */
    updateFromExcel({ parentID, pathFileInternal, authorID }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                let wb      = XLSX.readFile(pathFileInternal);
                let list    = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
                list.splice(0, 1);
                // console.log(list)

                if(Number(list.length) > 500)
                    return resolve({ error: true, message: "the_number_is_limited_>500" });

                // Đánh dấu lỗi
                let checkIllegal = 0;
                let notice = '';

                // Kiểm tra dữ liệu hợp lệ

                // Xóa file trong thư mục upload đi
                fs.unlink(pathFileInternal, function(err){
                    if (err) throw err;
                    console.log('File deleted!2');
                })

                if(Number(checkIllegal) > 0){
                    return resolve({ error: true, message: notice });
                }else{
                    for(const item of list){
                        let id = item[0]
                        if(id && _isValid(id)){
                            let dataUpdate = {
                                userUpdate: authorID,
                                modifyAt: Date.now(),
                                sign: item[1], 
                                name: item[2], 
                                description: item[3], 
                                unit: item[4], 
                                unitprice: (item[5] && !isNaN(item[5])) ? Number(item[5]).toFixed(0) : 0,
                                note: item[6], 
                            }

                            await DATAHUB_JOB_COLL.findByIdAndUpdate(id, dataUpdate, { new: true })
                        }else{
                            let dataInsert = { 
                                authorID, 
                                sign: item[1],
                                name: item[2],
                                description: item[3],
                                unit: item[4],
                                unitprice: (item[5] && !isNaN(item[5])) ? Number(item[5]).toFixed(0) : 0,
                                note: item[6],
                            }
    
                            // Nếu tồn tại phần tử cha
                            if(parentID && _isValid(parentID)){
                                dataInsert.parent = parentID;
                            }
    
                            await that.insert(dataInsert)
                        }
                    }

                    return resolve({ error: false, message: 'read_successfull' })
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    //__________Get thông tin
    // Author: HiepNH
    getInfo({ jobID }) {
        return new Promise(async resolve => {
            try {
                let info = await DATAHUB_JOB_COLL.findById(jobID).populate('parent')
                if (!info) 
                    return resolve({ error: true, message: 'cannot_get_info' });               

                return resolve({ error: false, data: info });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    //__________Cập nhật (nhiều mẩu tin/excel)
    // Author: HiepNH
    bulkUpdate({ data, authorID }){
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!_isValid(authorID))
                    return resolve({ error: true, message: 'param_not_valid' });

                for(const item of data){
                    if(item.id && _isValid(item.id)){
                        let dataUpdate = {
                            userUpdate: authorID,
                            modifyAt: Date.now(),
                            sign: item.sign, 
                            name: item.name, 
                            description: item.description, 
                            unit: item.unit, 
                            note: item.note, 
                            unitprice: (item.unitprice && !isNaN(item.unitprice)) ? Number(item.unitprice).toFixed(0) : 0
                        }
                        await DATAHUB_JOB_COLL.findByIdAndUpdate(item.id, dataUpdate, { new: true })
                    }else{
                        await that.insert({
                            parent: item.parent, 
                            sign: item.sign, 
                            name: item.name, 
                            description: item.description, 
                            unit: item.unit, 
                            note: item.note, 
                            unitprice: item.unitprice, 
                            authorID
                        })
                    }
                }

                return resolve({ error: false, message: 'Done' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    //__________Lấy danh sách (phân trang)
    // Auth: HiepNH
    getList({ parentID,
        userID, keyword, limit = 50, lastestID, select, populates = {}, sortKey }) {
        return new Promise(async (resolve) => {
            try {
                if (limit > 50) {
                    limit = 50
                } else {
                    limit = +limit;
                }

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let sortBy;
                let conditionObj = { };
                let keys = ['createAt__-1', '_id__-1'];

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if (populates && typeof populates === 'string') {
                    if (!IsJsonString(populates))
                        return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

                    populates = JSON.parse(populates);
                } else {
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                if (sortKey && typeof sortKey === 'string') {
                    if (!IsJsonString(sortKey))
                        return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                    keys = JSON.parse(sortKey);
                }

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                if (checkObjectIDs(parentID)) {
                    conditionObj.parent = parentID
                }
                console.log(conditionObj)

                if (keyword) {
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                }

                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
                if (lastestID && checkObjectIDs(lastestID)) {
                    let infoData = await DATAHUB_JOB_COLL.findById(lastestID);
                    if (!infoData)
                        return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if (!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
                    sortBy = dataPagingAndSort.data.sort;
                } else {
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await DATAHUB_JOB_COLL.find(conditionObj)
                    .limit(limit + 1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                // GET TOTAL RECORD
                if (!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor = null;
                if (infoDataAfterGet && infoDataAfterGet.length) {
                    if (infoDataAfterGet.length > limit) {
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await DATAHUB_JOB_COLL.count(conditionObjOrg);
                let totalPage = Math.ceil(totalRecord / limit);

                return resolve({
                    error: false, data: {
                        listRecords: infoDataAfterGet,
                        limit: +limit,
                        totalRecord,
                        totalPage,
                        nextCursor,
                    }, status: 200
                });

            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;