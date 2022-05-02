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
const BIDDING__BILL_WORK_COLL           				    = require('../database/bidding.bill_work-coll');
const BIDDING__BILL_WORKLINE_COLL           				= require('../database/bidding.bill_workline-coll');
const BIDDING__BILL_PRODUCT_COLL                            = require('../database/bidding.bill_product-coll');

class Model extends BaseModel {

    constructor() {
        super(BIDDING__BILL_PRODUCT_COLL);
    }
 
    insert({ task, product, authorID }) {
        return new Promise(async resolve => {
            try {
                if(!_isValid(task) || !_isValid(product) || !_isValid(authorID))
                    return resolve({ error: true, message: 'param_not_valid' })

                // Kiểm tra sự tồn tại của task, product
                let info = await BIDDING__BILL_PRODUCT_COLL.findOne({task: task, product: product})
                if(info){
                    return resolve({ error: true, message: 'data_exists' })
                }else{
                    // Giá vật tư của hệ thống
                    let unitprice = 0, type = 1
                    let infoProduct = await DATAHUB_PRODUCT_COLL.findById(product)
                    if(infoProduct){
                        unitprice = Number(infoProduct.unitprice)
                        type = Number(infoProduct.type)
                    }

                    // Khởi tạo dữ liệu
                    let dataInsert = {
                        task,
                        product,
                        type,
                        unitprice
                    }
    
                    let infoAfterInsert = await this.insertData(dataInsert, authorID)
                    if (!infoAfterInsert) 
                        return resolve({ error: true, message: 'cannot_insert' })
                    
                    return resolve({ error: false, data: infoAfterInsert })
                }
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    //__________Tạo danh mục vật tư cho gói thầu (nếu chưa có)
    // Author: HiepNH
    createBiddingAllProduct({ task, authorID }) {
        const that = this
        return new Promise(async resolve => {
            try {
                if(!_isValid(task) || !_isValid(authorID))
                    return resolve({ error: true, message: 'param_not_valid' })

                // Lấy danh sách các vật tư của gói thầu (theo Phân tích nguồn lực)
                let listData = await BIDDING_JOBLINE_COLL.aggregate([
                    {
                        $match: {
                            task: ObjectID(task)
                        }
                    }, 
                    {
                        $group: {
                            _id: { product: '$product' },
                        }
                    } 
                ])
                // console.log(task)

                // Thêm bổ sung nếu chưa có
                for(const item of listData){
                    // Kiểm tra xem tồn tại hay chưa
                    await that.insert({ task, product: item._id.product, authorID })
                }

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    //__________Cập nhật giá vật tư gói thầu
    // Author: HiepNH
    updatePrice({ task, product, unitprice, authorID }){
        return new Promise(async (resolve) => {
            try {
                if(!_isValid(task) || !_isValid(product) || !_isValid(authorID) )
                    return resolve({ error: true, message: 'param_not_valid' })

                /**
                 * BA
                 * B1. CẬP NHẬT GIÁ VẬT TƯ TRONG BIDDING_PRODUCT (phục vụ tổng hợp vật tư gói thầu)
                 * B2. CẬP NHẬT GIÁ VẬT TƯ TRONG BIDDING_JOBLINE (phục vụ kiểm tra phân tích vật tư)
                 * B3. CẬP NHẬT GIÁ CÔNG TÁC TRONG GÓI THẦU (phục vụ so sánh giá với nhà thầu)
                 */
                
                // B1. CẬP NHẬT GIÁ VẬT TƯ TRONG BIDDING_PRODUCT
                await BIDDING__BILL_PRODUCT_COLL.findOneAndUpdate(
                    {
                        task: ObjectID(task),
                        product: ObjectID(product),
                    }, 
                    {
                        unitprice: Number(unitprice).toFixed(3)
                    }, { new: true });

                //B2. CẬP NHẬT GIÁ VẬT TƯ TRONG BIDDING_JOBLINE
                await BIDDING_JOBLINE_COLL.updateMany(
                    { 
                        task: ObjectID(task),
                        product: ObjectID(product),
                    },
                    { $set: { "unitprice" : unitprice } }
                 );

                /**
                 * B3. CẬP NHẬT GIÁ CÔNG TÁC TRONG GÓI THẦU
                 * 1. Lấy danh sách các công tác có chứa vật tư
                 * 2. Lặp qua từng công tác để tính toán và update lại đơn giá
                 */
                //_________1. Lấy danh sách các công tác có chứa vật tư
                let listData = await BIDDING_JOBLINE_COLL.find({
                    task: task,
                    product: product,
                })
                // console.log(listData)

                let listDataJob = await BIDDING_JOB_COLL.find({
                   _id: {$in: listData.map(item=>item.job)}
                }).select('_id name')

                //_________2. Lặp qua từng công tác để tính toán và update lại đơn giá
                for(const item of listDataJob){
                    await BIDDING_JOB_MODEL.updateJobPrice({ jobID: item._id })
                }
              
                return resolve({ error: false, message: 'successfull' })
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    updateNote({ task, product, note, authorID }){
        return new Promise(async (resolve) => {
            try {
                if(!_isValid(task) || !_isValid(product) || !_isValid(authorID) )
                    return resolve({ error: true, message: 'param_not_valid' })

                await BIDDING__BILL_PRODUCT_COLL.findOneAndUpdate(
                    {
                        task: ObjectID(task),
                        product: ObjectID(product),
                    }, 
                    {
                        note: note,
                    }, { new: true });
              
                return resolve({ error: false, message: 'successfull' })
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model;