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
const BIDDING__DOC_COLL                         = require('../database/bidding.doc-coll');
const BIDDING__BILL_ITEM_COLL                   = require('../database/bidding.bill_item-coll');
const BIDDING__BILL_GROUP_COLL                  = require('../database/bidding.bill_group-coll');
const BIDDING__BILL_WORK_COLL                   = require('../database/bidding.bill_work-coll');
const BIDDING__BILL_WORKLINE_COLL               = require('../database/bidding.bill_workline-coll');
const BIDDING__BILL_PRODUCT_COLL                = require('../database/bidding.bill_product-coll');
const BIDDING__QUOTATION_COLL                   = require('../database/bidding.quotation-coll');

class Model extends BaseModel {

    constructor() {
        super(BIDDING__BILL_PRODUCT_COLL);
    }

     /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 02/5/2022
     */
    insert({ docID, productID, type, unitprice, userID }) {
        console.log('Insert Product in Package=========>>>>>>>>>>>>>')
        console.log({ docID, productID, type, unitprice, userID })
        return new Promise(async resolve => {
            try {
                if(!_isValid(docID) || !_isValid(productID) || !_isValid(userID))
                    return resolve({ error: true, message: 'param_not_valid' })

                // Kiểm tra sự tồn tại của task, product
                let info = await BIDDING__BILL_PRODUCT_COLL.findOne({doc: docID, product: productID})
                if(info){
                    console.log('Product: Vật tư đã tồn tại in Package=========>>>>>>>>>>>>>')
                    return resolve({ error: true, message: 'data_exists222222222222222' })
                }else{
                    console.log('Product: Vật tư chưa tồn tại in Package=========>>>>>>>>>>>>>')
                    let infoDoc = await BIDDING__DOC_COLL.findById(docID)
                    console.log({infoDoc: infoDoc})
                    if(infoDoc){
                        let dataInsert = {
                            area: infoDoc.area,
                            client: infoDoc.client,
                            project: infoDoc.project,
                            doc: docID,
                            product: productID,
                            type,
                            unitprice
                        }
        
                        let infoAfterInsert = await this.insertData(dataInsert)
                        if (!infoAfterInsert) 
                            return resolve({ error: true, message: 'cannot_insert' })
                        
                        return resolve({ error: false, data: infoAfterInsert })
                    }else{
                        return resolve({ error: true, message: 'cannot_insert' })
                    }
                }
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    // //__________Tạo danh mục vật tư cho gói thầu (nếu chưa có)
    // // Author: HiepNH
    // createBiddingAllProduct({ task, authorID }) {
    //     const that = this
    //     return new Promise(async resolve => {
    //         try {
    //             if(!_isValid(task) || !_isValid(authorID))
    //                 return resolve({ error: true, message: 'param_not_valid' })

    //             // Lấy danh sách các vật tư của gói thầu (theo Phân tích nguồn lực)
    //             let listData = await BIDDING_JOBLINE_COLL.aggregate([
    //                 {
    //                     $match: {
    //                         task: ObjectID(task)
    //                     }
    //                 }, 
    //                 {
    //                     $group: {
    //                         _id: { product: '$product' },
    //                     }
    //                 } 
    //             ])
    //             // console.log(task)

    //             // Thêm bổ sung nếu chưa có
    //             for(const item of listData){
    //                 // Kiểm tra xem tồn tại hay chưa
    //                 await that.insert({ task, product: item._id.product, authorID })
    //             }

    //             return resolve({ error: false, data: listData });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // updateNote({ task, product, note, authorID }){
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!_isValid(task) || !_isValid(product) || !_isValid(authorID) )
    //                 return resolve({ error: true, message: 'param_not_valid' })

    //             await BIDDING__BILL_PRODUCT_COLL.findOneAndUpdate(
    //                 {
    //                     task: ObjectID(task),
    //                     product: ObjectID(product),
    //                 }, 
    //                 {
    //                     note: note,
    //                 }, { new: true });
              
    //             return resolve({ error: false, message: 'successfull' })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }
}

exports.MODEL = new Model;