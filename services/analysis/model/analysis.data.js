"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs }                = require('../../../tools/utils/utils');
const moment                            = require('moment')
const ObjectID                          = require('mongoose').Types.ObjectId

/**
 * DOMAIN AND ACTIONS
 */

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index')

/**
 * COLLECTIONS
 */
const ANALYSIS__DATA_COLL                       = require('../database/analysis.data-coll')
const ITEM__FUNDA_COLL            			    = require('../../item/database/item.funda-coll');
const ITEM__CONTACT_COLL            		    = require('../../item/database/item.contact-coll');

class Model extends BaseModel {

    constructor() {
        super(ANALYSIS__DATA_COLL);
    }

    getData({ option, email, userID, companyID, page, unit, getNumber }) {
        // console.log({ option, email, userID, companyID, page, unit, getNumber })
        const that = this
        return new Promise(async resolve => {
            try {
                let conditionObj = {}, selectObj = '_id name sign description note phone email identity taxid bankAccount'
                
                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = ObjectID(companyID)
                }

                // CONVERT DANH BẠ
                if(option == 1){
                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
                        // console.log(listData.length)
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        // console.log({infoBegin})
                        // let infoEnd = listData[limit - 1]
                        let infoEnd = listData.slice(-1)
                        // console.log({infoEnd})

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertContact({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await ITEM__CONTACT_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }
               
                // CONVERT
                else{
                    //
                }

            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    convertData({ option, email, userID, companyID, page, unit, getNumber }) {
        // console.log({ option, email, userID, companyID, page, unit, getNumber })
        const that = this
        return new Promise(async resolve => {
            try {
                let conditionObj = {}, selectObj = '_id name sign description note phone email identity taxid bankAccount'
                
                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = ObjectID(companyID)
                }

                // CONVERT DANH BẠ
                if(option == 1){
                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
                        // console.log(listData.length)
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        // console.log({infoBegin})
                        // let infoEnd = listData[limit - 1]
                        let infoEnd = listData.slice(-1)
                        // console.log({infoEnd})

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertContact({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await ITEM__CONTACT_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // CONVERT HỒ SƠ
                else if(option == 2){
                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertContact({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await ITEM__CONTACT_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // CONVERT HỢP ĐỒNG
                else if(option == 3){
                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertContact({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await ITEM__CONTACT_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // CONVERT PCM
                else if(option == 4){
                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertContact({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await ITEM__CONTACT_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // CONVERT PCM COMMENT
                else if(option == 5){
                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertContact({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await ITEM__CONTACT_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // CONVERT ACCOUNTING VOUCHER
                else if(option == 6){
                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertContact({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await ITEM__CONTACT_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }
                
                // CONVERT
                else{
                    //
                }

            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    resetData({ option, email, userID, companyID, page, unit, getNumber }) {
        // console.log({ option, email, userID, companyID, page, unit, getNumber })
        const that = this
        return new Promise(async resolve => {
            try {
                let conditionObj = {}, selectObj = '_id name sign description note phone email identity taxid bankAccount'
                
                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = ObjectID(companyID)
                }

                // CONVERT DANH BẠ
                if(option == 1){
                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
                        // console.log(listData.length)
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        // console.log({infoBegin})
                        // let infoEnd = listData[limit - 1]
                        let infoEnd = listData.slice(-1)
                        // console.log({infoEnd})

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertContact({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await ITEM__CONTACT_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }
               
                // CONVERT
                else{
                    //
                }

            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }
	
}

exports.MODEL = new Model