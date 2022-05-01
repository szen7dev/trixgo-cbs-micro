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

const DATAHUB_JOB_MODEL                             = require('./datahub.datahub_job-model').MODEL
const DATAHUB_PRODUCT_MODEL                         = require('./datahub.datahub_product-model').MODEL

class Model extends BaseModel {

    constructor() {
        super(DATAHUB_JOBLINE_COLL);
    }
 
    /**
     * Thêm định mức
     * Author: HiepNH
     * Date: 11/9/2021
     */
     insert({ job, product, quantity, note, authorID }) {
        return new Promise(async resolve => {
            try {
                if(!_isValid(job) || !_isValid(product) || !_isValid(authorID))
                    return resolve({ error: true, message: 'param_not_valid' })
                
                // Kiểm tra sự tồn tại của product trong job
                let info = await DATAHUB_JOBLINE_COLL.findOne({job: job, product: product})
                if(info){
                    return resolve({ error: true, message: 'data_exists' })
                }else{
                    // Lấy giá của vật tư
                    let infoProduct = await DATAHUB_PRODUCT_COLL.findById(product)

                    let dataInsert = {
                        job,
                        product, 
                        quantity: (quantity && !isNaN(quantity)) ? Number(quantity).toFixed(3) : 0,
                        unitprice: Number(infoProduct.unitprice).toFixed(3),
                        type: Number(infoProduct.type),
                        note
                    }
    
                    let infoAfterInsert = await this.insertData(dataInsert, authorID)
                    if (!infoAfterInsert) 
                        return resolve({ error: true, message: 'cannot_insert' })

                    // Cập nhật lại giá các công tác chứa Nguồn lực
                    await DATAHUB_PRODUCT_MODEL.updateJobPrice({ jobID: job })

                    return resolve({ error: false, data: infoAfterInsert })
                }
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    /**
     * Cập nhật dữ liệu từ excel
     * Author: HiepNH
     * Date: 11/9/2021
     */
     updateFromExcel({ parentID, pathFileInternal, authorID }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                let list = readFileExcel(pathFileInternal);
                list.splice(0, 1);
                // console.log(list)

                // Đánh dấu lỗi
                let checkIllegal = 0;

                if(!parentID || !_isValid(parentID)){
                    checkIllegal++
                }

                if(Number(checkIllegal) > 0){
                    return resolve({ error: true, message: 'Dữ liệu không hợp lệ', status: 400 });
                }else{
                    let job; // Lưu ý chỉ đúng khi đặt ngoài vòng for để nhận giá trị toàn cục
                    for (const item of list){
                        /**
                         * Business Analyst
                         * 1-Vòng lặp đầu tiên => tạo Công tác => tồn tại job = jobID1
                         * 2-Vòng lặp tiếp theo...cho tới khi chưa tới công tác mới => luôn tồn tại:
                         * +++jobID1
                         * +++Dữ liệu công tác rỗng, dữ liệu nguồn lực tồn tại => tạo định mức hao phí => gán với jobID1
                         * 3-Vòng lặp tới công tác tiếp theo thì job => jobID2 và quá trình lại tiếp tục
                         */

                        // Kiểm tra chỉ lấy các hàng có dữ liệu (không lấy Danh mục con - item[0] != null)
                        if(item[2] != null && item[2] != ''){

                            // Lấy tên và mô tả của danh mục cha
                            let sign = item[1], name = item[2], description = item[8], unit = item[4], note = item[9], unitprice = item[7]
                            
                            // Tạo công tác
                            let infoAfterInsert = await DATAHUB_JOB_MODEL.insert({ parent: parentID, sign, name, description, unit, note, unitprice, authorID })
                            job = infoAfterInsert.data._id
                        }

                        // Tạo nguồn lực
                        if(item[3] != null && item[3] != ''){

                            // Lấy tên và mô tả của danh mục cha
                            let quantity = item[5], product = item[10], note = item[9]

                            // Tạo định mức
                            await that.insert({ job, product, quantity, note, authorID })
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
    getInfo({ joblineID }) {
        return new Promise(async resolve => {
            try {
                let info = await DATAHUB_JOBLINE_COLL.findById(joblineID).populate({
                    path: 'product',
                    select: '_id sign name note'
                })
                if (!info) 
                    return resolve({ error: true, message: 'cannot_get_info' })
                    // console.log(info)

                return resolve({ error: false, data: info });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    //__________Cập nhật lại định mức
    // Author: HiepNH
    bulkUpdate({ data, authorID }){
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!_isValid(authorID))
                    return resolve({ error: true, message: 'param_not_valid' });

                for(const item of data){
                    if(item.id && _isValid(item.id)){
                        let info = await DATAHUB_JOBLINE_COLL.findById(item.id)

                        let dataUpdate = {
                            userUpdate: authorID,
                            modifyAt: Date.now(),
                            note: item.note,
                            quantity: (item.quantity && !isNaN(item.quantity)) ? Number(item.quantity).toFixed(3) : 0
                        }

                        // Cập nhật lại định mức
                        await DATAHUB_JOBLINE_COLL.findByIdAndUpdate(item.id, dataUpdate, { new: true })

                        // Cập nhật lại giá công tác
                        await DATAHUB_PRODUCT_MODEL.updateJobPrice({ jobID: info.job })
                    }else{
                        await that.insert({
                            job: item.job, 
                            product: item.product,
                            quantity: item.quantity, 
                            note: item.note, 
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

    //__________Xóa
    // Author: HiepNH
    remove({ arr, authorID }){
        return new Promise(async (resolve) => {
            try {
                if(!_isValid(authorID))
                    return resolve({ error: true, message: 'param_not_valid' })

                for(const item of arr){
                    let info = await DATAHUB_JOBLINE_COLL.findById(item.joblineID)

                    // Xóa định mức
                    await DATAHUB_JOBLINE_COLL.findByIdAndDelete(item.joblineID)

                    // Cập nhật giá công tác
                    await DATAHUB_PRODUCT_MODEL.updateJobPrice({ jobID: info.job })
                }

                return resolve({ error: false, message: 'Done' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    //__________Lấy danh sách (phân trang)
    // Auth: HiepNH
    getList({ selectObj, conditionObj, sort, populate }) {
        return new Promise(async resolve => {
            try {
                let listData = await DATAHUB_JOBLINE_COLL.find(conditionObj)
                    .populate(populate)
                    .select(selectObj)
                    .sort(sort)

                if (!listData) 
                    return resolve({ error: true, message: 'cannot_get_info_data' });

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model;