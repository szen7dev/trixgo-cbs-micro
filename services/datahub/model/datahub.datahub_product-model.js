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
} = require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const DATAHUB_JOBLINE_COLL           				= require('../database/datahub_jobline-coll');
const DATAHUB_PRODUCT_COLL                          = require('../database/datahub_product-coll') 
const DATAHUB_PRODUCT_COLL           				= require('../database/datahub_product-coll');

class Model extends BaseModel {

    constructor() {
        super(DATAHUB_PRODUCT_COLL);
    }
 
    insert({ parent, type, sign, name, description, unit, note, unitprice, authorID }) {
        return new Promise(async resolve => {
            try {
                if(!name || !sign || !_isValid(authorID))
                    return resolve({ error: true, message: 'param_not_valid' })

                let dataInsert = {
                    sign,
                    name, 
                    description, 
                    unit, 
                    note, 
                    type: (type && !isNaN(type)) ? Number(type) : 1,
                    unitprice: (unitprice && !isNaN(unitprice)) ? Number(unitprice).toFixed(3) : 0
                }

                if(parent && _isValid(parent)){
                    dataInsert.parent = parent
                }

                let infoAfterInsert = await this.insertData(dataInsert, authorID)
                if (!infoAfterInsert) 
                    return resolve({ error: true, message: 'cannot_insert' })
                
                return resolve({ error: false, data: infoAfterInsert })
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    updateFromExcel({ parentID, pathFileInternal, authorID,  }) {
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
                    console.log('File deleted!');
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
                                unitprice: (item[5] && !isNaN(item[5])) ? Number(item[5]).toFixed(3): 0,
                                note: item[6], 
                                type: (item[7] && !isNaN(item[7])) ? Number(item[7]).toFixed(0) : 1, 
                            }

                            await DATAHUB_PRODUCT_COLL.findByIdAndUpdate(id, dataUpdate, { new: true })
                        }else{
                            let dataInsert = { 
                                authorID, 
                                sign: item[1],
                                name: item[2],
                                description: item[3],
                                unit: item[4],
                                unitprice: (item[5] && !isNaN(item[5])) ? Number(item[5]).toFixed(3) : 0,
                                note: item[6],
                                type: (item[7] && !isNaN(item[7])) ? Number(item[7]).toFixed(0) : 1, 
                            }
    
                            // Nếu tồn tại phần tử cha
                            if(parentID && _isValid(parentID)){
                                dataInsert.parent = parentID;
                            }
    
                            await that.insert(dataInsert)
                        }
                    }

                    return resolve({ error: false, message: 'read_successfull' });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    //__________Get thông tin
    // Author: HiepNH
    getInfo({ productID }) {
        return new Promise(async resolve => {
            try {
                let info = await DATAHUB_PRODUCT_COLL.findById(productID).populate('parent')
                if (!info) 
                    return resolve({ error: true, message: 'cannot_get_info' });

                return resolve({ error: false, data: info });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    
    //__________Cập nhật lại giá công tác
    // Author: HiepNH
    updateJobPrice({ jobID }){
        return new Promise(async (resolve) => {
            try {
                //_________Danh sách các vật tư thuộc công tác đang xét
                let listDataJobline = await DATAHUB_JOBLINE_COLL.find({
                    job: jobID
                }) 

                //_________Tính toán lại đơn giá công tác
                let total = 0
                for(const item of listDataJobline){
                    total = Number(total) + Number(item.quantity*item.unitprice)
                }

                //_________Cập nhật đơn giá công tác
                let infoAfterUpdate = await DATAHUB_JOB_COLL.findByIdAndUpdate(jobID, {
                    unitprice: Number(total).toFixed(0)
                }, { new: true })

                if (!infoAfterUpdate) 
                    return resolve({ error: true, message: 'cannot_update' })
                
                return resolve({ error: false, data: infoAfterUpdate })
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

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
                            type: (item.type && !isNaN(item.type)) ? Number(item.type) : 1,
                            sign: item.sign, 
                            name: item.name, 
                            description: item.description, 
                            unit: item.unit, 
                            note: item.note, 
                            unitprice: (item.unitprice && !isNaN(item.unitprice)) ? Number(item.unitprice).toFixed(3) : 0
                        }

                        // Cập nhật product
                        await DATAHUB_PRODUCT_COLL.findByIdAndUpdate(item.id, dataUpdate, { new: true })

                        /**
                         * CẬP NHẬT GIÁ CÔNG TÁC
                         */
                        //_________Cập nhật giá vật tư trong định mức
                        await DATAHUB_JOBLINE_COLL.updateMany(
                            { 
                                product: ObjectID(item.id),
                            },
                            { $set: { "unitprice" : item.unitprice } }
                        );

                        /**
                         * Cập nhật giá công tác trong gói thầu
                         * 1. Lấy danh sách các công tác có chứa vật tư
                         * 2. Lặp qua từng công tác để tính toán và update lại đơn giá
                         */
                        //_________1. Lấy danh sách các công tác có chứa vật tư
                        let listData = await DATAHUB_JOBLINE_COLL.find({
                            product: item.id
                        })

                        let listDataJob = await DATAHUB_JOB_COLL.find({
                        _id: {$in: listData.map(item=>item.job)}
                        }).select('_id name')

                        //_________2. Lặp qua từng công tác để tính toán và update lại đơn giá
                        for(const job of listDataJob){
                            await that.updateJobPrice({ jobID: job._id })
                        }

                    }else{
                        await that.insert({
                            parent: item.parent, 
                            type: item.type,
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
    getList({ selectObj, conditionObj, sort, page = 1, limit = 15 }) {
        return new Promise(async resolve => {
            try {
                let listData = await DATAHUB_PRODUCT_COLL.find(conditionObj)
                    .select(selectObj)
                    .limit(limit * 1)
                    .skip((page - 1) * limit)
                    .sort(sort)

                if (!listData) 
                    return resolve({ error: true, message: 'cannot_get_info_data' })

                // Tổng số lượng mẩu tin
                let count = await DATAHUB_PRODUCT_COLL.count(conditionObj)

                return resolve({ 
                    error: false, 
                    listData,
                    count,
                	totalPages: Math.ceil(count / limit), 
                	perPage: limit,
                	currentPage: +page
                })
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model;