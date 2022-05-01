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
 
    /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 01/5/2022
     */
    insert({ parentID, type, sign, name, description, unit, note, unitprice, userID }) {
        const that = this
        return new Promise(async resolve => {
            try {
                if(!name || !sign || !_isValid(userID))
                    return resolve({ error: true, message: 'param_not_valid' })

                let dataInsert = {
                    userCreate: userID,
                    sign,
                    name, 
                    description, 
                    unit, 
                    note, 
                    type: (type && !isNaN(type)) ? Number(type) : 1,
                    unitprice: (unitprice && !isNaN(unitprice)) ? Number(unitprice).toFixed(3) : 0
                }

                if(parentID && _isValid(parentID)){
                    dataInsert.parent = parentID
                }

                let infoAfterInsert = await that.insertData(dataInsert)
                if (!infoAfterInsert) 
                    return resolve({ error: true, message: 'cannot_insert' })
                
                return resolve({ error: false, data: infoAfterInsert })
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    /**
     * Name: Get info 
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    getInfo({ productID, select, populates }) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(productID))
                    return resolve({ error: true, message: 'param_invalid' });

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

                let info = await BIDDING__BILL_PRODUCT_COLL.findById(productID)
                    .select(select)
                    .populate(populates)

                if (!info) return resolve({ error: true, message: 'cannot_get' });

                return resolve({ error: false, data: info });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    
    /**
     * Name: Update unit price
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    updateJobPrice({ jobID }){
        return new Promise(async (resolve) => {
            try {
                //_________Danh sách các vật tư thuộc công tác đang xét
                let listDataJobline = await BIDDING__BILL_WORKLINE_COLL.find({
                    job: jobID
                }) 

                //_________Tính toán lại đơn giá công tác
                let total = 0
                for(const item of listDataJobline){
                    total = Number(total) + Number(item.quantity*item.unitprice)
                }

                //_________Cập nhật đơn giá công tác
                let infoAfterUpdate = await BIDDING__BILL_WORK_COLL.findByIdAndUpdate(jobID, {
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

    // //__________Cập nhật (nhiều mẩu tin/excel)
    // // Author: HiepNH
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
                        await BIDDING__BILL_PRODUCT_COLL.findByIdAndUpdate(item.id, dataUpdate, { new: true })

                        /**
                         * CẬP NHẬT GIÁ CÔNG TÁC
                         */
                        //_________Cập nhật giá vật tư trong định mức
                        await BIDDING__BILL_WORKLINE_COLL.updateMany(
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
                        let listData = await BIDDING__BILL_WORKLINE_COLL.find({
                            product: item.id
                        })

                        let listDataJob = await BIDDING__BILL_WORK_COLL.find({
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

    /**
     * Name: Update 
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    update({ productID, sign, name, description, unit, note, unitprice, userID }) {
        const that = this
        return new Promise(async resolve => {
            try {
                if(!name || !sign || !_isValid(userID))
                    return resolve({ error: true, message: 'param_not_valid' })

                let dataUpdate = { 
                    modifyAt: Date.now(),
                    userUpdate: userID, 
                    sign, 
                    name 
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(unit){
                    dataUpdate.unit = unit;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if (!isNaN(unitprice) && Number(unitprice) >= 0) {
                    dataUpdate.unitprice = unitprice;
                }

                let infoAfterUpdate = await BIDDING__BILL_PRODUCT_COLL.findByIdAndUpdate(productID, dataUpdate, { new: true });
                if (!infoAfterUpdate) 
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: 'cannot_update' });

                /**
                 * CẬP NHẬT GIÁ CÔNG TÁC TRONG DATAHUB
                 */
                //_________Cập nhật giá vật tư trong định mức
                await BIDDING__BILL_WORKLINE_COLL.updateMany(
                    { 
                        product: ObjectID(productID),
                    },
                    { $set: { "unitprice" : unitprice } }
                );

                /**
                 * Cập nhật giá công tác trong gói thầu
                 * 1. Lấy danh sách các công tác có chứa vật tư
                 * 2. Lặp qua từng công tác để tính toán và update lại đơn giá
                 */
                //_________1. Lấy danh sách các công tác có chứa vật tư
                let listData = await BIDDING__BILL_WORKLINE_COLL.find({
                    product: productID
                })

                let listDataJob = await BIDDING__BILL_WORK_COLL.find({
                _id: {$in: listData.map(item=>item.job)}
                }).select('_id name')

                //_________2. Lặp qua từng công tác để tính toán và update lại đơn giá
                for(const job of listDataJob){
                    await that.updateJobPrice({ jobID: job._id })
                }                    
                
                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Get list 
     * Author: Hiepnh
     * Date: 30/4/2022
     */
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
                    let infoData = await BIDDING__BILL_PRODUCT_COLL.findById(lastestID);
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

                let infoDataAfterGet = await BIDDING__BILL_PRODUCT_COLL.find(conditionObj)
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

                let totalRecord = await BIDDING__BILL_PRODUCT_COLL.count(conditionObjOrg);
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