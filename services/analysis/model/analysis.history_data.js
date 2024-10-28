"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs }                = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const ObjectID                          = require('mongoose').Types.ObjectId;
const moment                            = require('moment')
const { hash, compare }                 = require('../../../tools/bcrypt');
const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const { uploadFileS3 }                  = require('../../../tools/s3');
const {
    isValidDate,
}                                       = require('../../../tools/utils/time_utils')
const { 
    DEVICE_TYPES,
 }                = require('../helper/analysis.keys-constant')

/**
 * COLLECTIONS
 */
const USER_COLL                                 = require('../../auth/database/auth.user-coll')
const APP_COLL                                  = require('../../auth/database/permission/auth.app-coll')
const COMPANY_COLL                              = require('../../auth/database/auth.company-coll')
const ANALYSIS__HISTORY_DATA_COLL               = require('../database/analysis.history_data-coll')
const ANALYSIS__HISTORY_TRAFFIC_COLL            = require('../database/analysis.history_traffic-coll')
const BUDGET__WORK_COLL                         = require('../../budget/database/budget.work-coll');
const ITEM__CONTACT_COLL            		    = require('../../item/database/item.contact-coll')
const ITEM__DOCTYPE_COLL            		    = require('../../item/database/item.doctype-coll')
const ITEM__FUNDA_COLL            		        = require('../../item/database/item.funda-coll')
const ITEM__WAREHOUSE_COLL            		    = require('../../item/database/item.warehouse-coll')
const ITEM__GOODS_COLL            		        = require('../../item/database/item.goods-coll')
const FNB_CUSTOMER_CARE_COLL                    = require('../../fnb/database/fnb.customer_care-coll');
const FNB_MISTAKE_COLL                          = require('../../fnb/database/fnb.mistake-coll');
const DOCUMENT__DOC_COLL               			= require('../../document/database/document.doc-coll');
const HUMAN__CONTACT_DOCUMENT_COLL              = require('../../human/database/human.contact_document-coll');
const TIMESHEET__EXPERT_TIMESHEET_COLL          = require('../../timesheet/database/timesheet.expert_timesheet-coll')
const TIMESHEET__EXPERT_SALARY_COLL             = require('../../timesheet/database/timesheet.expert_salary-coll')
const PCM_PLAN_GROUP_COLL            		    = require('../../subject_pcm/database/subject_pcm.pcm_plan_group-coll');
const FIN__CASH_BOOK_COLL                       = require('../../fin/database/fin.cash_book-coll');
// const STORE_ORDER_PRODUCT_COLL                  = require('../../store/database/store.order_product-coll');
// const STORE_ORDER_COLL                          = require("../../store/database/store.order-coll");
const MEDIA_COLL					        	= require('../../media/database/media-coll');

const PCM_PLAN_GROUP_MODEL                      = require('../../subject_pcm/model/subject_pcm.pcm_plan_group').MODEL
const STORE_ORDER_MODEL                         = require('../../store/model/store.order-model.js').MODEL;
const STORE_ORDER_PRODUCT_MODEL                 = require('../../store/model/store.order_product-model.js').MODEL;
const TIMESHEET__EXPERT_TIMESHEET_MODEL         = require('../../timesheet/model/timesheet.expert_timesheet-model.js').MODEL;

class Model extends BaseModel {

    constructor() {
        super(ANALYSIS__HISTORY_DATA_COLL)
    }

	/**
	 * Dev: HiepNH
	 * Func: Tạo history traffic
	 * Date: 13/12/2021
	 */
	insert({ type, userCreate }){
        // console.log({ type, userCreate })
        return new Promise(async resolve => { 
            try {
                let dataInsert = { userCreate}; 
                if(type){
                    dataInsert.type = type;
                }
                let infoAfterInsert = await this.insertData(dataInsert);
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getData({ option, companyID, page, unit, getNumber, newPassword }){
        // console.log({ option, companyID, page, unit, getNumber, newPassword })
        return new Promise(async resolve => { 
            try {
                return resolve({ error: false, data: 'Get data thành công' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    cloneData({ option, companyID, userID, orgProjectID, targetProjectID, copyPermission }){
        // console.log({ option, companyID, userID, orgProjectID, targetProjectID, copyPermission })
        const that = this
        return new Promise(async resolve => { 
            try {
                let conditionObj = {}
                
                // Cấu trúc dữ liệu công việc Dự án
                if(option == 1){
                    let orgList = await PCM_PLAN_GROUP_COLL.find({project: orgProjectID}).select('name sign admins members')
                    if(copyPermission == 1){
                        for(const item of orgList){
                            await PCM_PLAN_GROUP_MODEL.insert({ 
                                 projectID: targetProjectID, 
                                 name: item.name, 
                                 sign: item.sign, 
                                 admins: item.admins, 
                                 members: item.members, 
                                 userID 
                             })
                         }
                    }else{
                        for(const item of orgList){
                            await PCM_PLAN_GROUP_MODEL.insert({ 
                                 projectID: targetProjectID, 
                                 name: item.name, 
                                 sign: item.sign, 
                                 userID 
                             })
                         }
                    }
                    
                }

                // Copy quyền truy cập dữ liệu
                else if(option == 2){
                    let orgList1 = await PCM_PLAN_GROUP_COLL.find({project: orgProjectID}).select('sign admins members')
                    let orgList2 = await PCM_PLAN_GROUP_COLL.find({project: targetProjectID}).select('sign')
                    for(const item of orgList1){
                        for(const subitem of orgList2){
                            if(item.sign === subitem.sign){
                                await PCM_PLAN_GROUP_COLL.findByIdAndUpdate(subitem._id,
                                    {
                                        admins: item.admins, 
                                        members: item.members, 
                                    },
                                    { new: true })
                            }
                        }
                     }
                }

                return resolve({ error: false, data: 'Clone thành công' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    convertData({ option, companyID, userID, page, unit, getNumber, newPassword, fundaID, warehouseID, contactID, fundasID, fromDate, toDate, month, year, docID, parentID, goodsID }){
        // console.log({ option, companyID, page, unit, getNumber, newPassword })
        const that = this
        return new Promise(async resolve => { 
            try {
                let conditionObj = {}
                
                if(option == 1){
                    let selectObj = '_id name sign description note phone email identity taxid bankAccount'
                
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                    }

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

                // convertDoctype
                else if(option == 2){
                    let selectObj = '_id name sign description'
                
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                    }

                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await ITEM__DOCTYPE_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await ITEM__DOCTYPE_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertDoctype({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await ITEM__DOCTYPE_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // convertBudget
                else if(option == 3){
                    let selectObj = '_id name sign description note'
                
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                    }

                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await BUDGET__WORK_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await BUDGET__WORK_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertBudget({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await BUDGET__WORK_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // Link fundaID với warehouseID
                else if(option == 4){
                  let info1 = await ITEM__FUNDA_COLL.findByIdAndUpdate(fundaID, {warehouse: warehouseID}, { new: true } )
                  let info2 = await ITEM__WAREHOUSE_COLL.findByIdAndUpdate(warehouseID, {funda: fundaID}, { new: true } )
                //   console.log(info1)
                //   console.log(info2)
                }

                else if(option == 5){
                    let info = await ITEM__FUNDA_COLL.findByIdAndUpdate(fundaID, {contact: contactID}, { new: true } )
                    // console.log(info)
                }

                else if(option == 6){
                    let info = await ITEM__CONTACT_COLL.findByIdAndUpdate(contactID, {isDefault: 2}, { new: true } )
                    // console.log(info)
                }

                // Convert Item Goods
                else if(option == 7){
                    let conditionObj = {company : ObjectID(companyID)}
                    if(fromDate && toDate){
                        // Convert dữ liệu ngày tháng để theo chuẩn chung
                        fromDate   = moment(fromDate).startOf('day').format();// <=== fix ISODate here
                        toDate     = moment(toDate).endOf('day').format();// <=== fix ISODate here

                        conditionObj.createAt = {
                            $gte: moment(fromDate).toDate(),
                            $lte: moment(toDate).toDate(),
                        }
                    }

                    // console.log(conditionObj)

                    await ITEM__GOODS_COLL.updateMany(
                        conditionObj,
                        {$set: {fundas: fundasID}}
                        )
                }

                // Convert Contact Parent
                else if(option == 8){
                    /**
                     * B1. XỬ LÝ VỚI OLD_PARENT VÀ CÁC CẤP TRÊN CŨ
                     * B2. XỬ LÝ VỚI NEW_PARENT VÀ CÁC CẤP TRÊN MỚI
                     * B3. CẬP NHẬT LEVEL CHO CÁC PHẦN TỬ CON BÊN DƯỚI
                     */
                    if(checkObjectIDs(docID) && checkObjectIDs(parentID)){

                        let infoContact = await ITEM__CONTACT_COLL.findById(docID)
                        let infoParent = await ITEM__CONTACT_COLL.findById(parentID)
                        // console.log(infoParent.nestedParents)

                        /**
                         * B1. XỬ LÝ VỚI OLD_PARENT VÀ CÁC CẤP TRÊN CŨ
                         * - Xóa docID ra khỏi childs và nestedChilds
                         * - Xóa subDocID ra khỏi nestedChilds
                         */
                        for(const item of infoContact?.nestedParents){
                            // Với docID
                            await ITEM__CONTACT_COLL.findByIdAndUpdate(item,
                                {
                                    $pull: {
                                        childs: docID,
                                        nestedChilds: docID
                                    },
                                },
                                { new: true })

                            await ITEM__CONTACT_COLL.findByIdAndUpdate(docID,
                                {
                                    $pull: {
                                        nestedParents: item,
                                    }
                                },
                                { new: true })

                            // Với các phần tử con của docID
                            for(const subitem of infoContact?.nestedChilds){
                                await ITEM__CONTACT_COLL.findByIdAndUpdate(item,
                                    {
                                        $pull: {
                                            childs: subitem,
                                            nestedChilds: subitem
                                        },
                                    },
                                    { new: true })

                                await ITEM__CONTACT_COLL.findByIdAndUpdate(subitem,
                                    {
                                        $pull: {
                                            nestedParents: item,
                                        }
                                    },
                                    { new: true })
                            }
                        }

                        /**
                         * B2. XỬ LÝ VỚI NEW_PARENT VÀ CÁC CẤP TRÊN MỚI
                         */
                        if(parentID && checkObjectIDs(parentID)){

                            /**
                            * Phần tử cha cấp 1
                            */
                            // Với docID
                            await ITEM__CONTACT_COLL.findByIdAndUpdate(parentID,
                            {
                                $addToSet: { 
                                    childs: docID,
                                    nestedChilds: docID
                                },
                            },
                            { new: true })

                            await ITEM__CONTACT_COLL.findByIdAndUpdate(docID,
                                { 
                                    userUpdate: userID, 
                                    modifyAt: new Date(),
                                    level: infoParent.level + 1,
                                    parent: parentID,
                                    nestedParents: [parentID],
                                },
                                { new: true })

                            // Với các phần tử con của docID
                            for(const subitem of infoContact?.nestedChilds){
                                await ITEM__CONTACT_COLL.findByIdAndUpdate(parentID,
                                    {
                                        $addToSet: {
                                            nestedChilds: subitem
                                        }
                                    },
                                    { new: true })

                                await ITEM__CONTACT_COLL.findByIdAndUpdate(subitem,
                                    {
                                        $addToSet: { nestedParents: parentID },
                                    },
                                    { new: true })
                            }

                            /**
                             * Phần tử cha cấp 2 trở lên
                             */
                            for(const item of infoParent?.nestedParents){

                                // Với docID
                                await ITEM__CONTACT_COLL.findByIdAndUpdate(item,
                                    {
                                        $addToSet: { nestedChilds: docID },
                                    },
                                    { new: true })


                                await ITEM__CONTACT_COLL.findByIdAndUpdate(docID,
                                    {
                                        $addToSet: { nestedParents: item },
                                    },
                                    { new: true })
                                
                                // Với các phần tử con của docID
                                for(const subitem of infoContact?.nestedChilds){
                                    await ITEM__CONTACT_COLL.findByIdAndUpdate(item,
                                        {
                                            $addToSet: {
                                                nestedChilds: subitem
                                            }
                                        },
                                        { new: true })

                                    await ITEM__CONTACT_COLL.findByIdAndUpdate(subitem,
                                        {
                                            $addToSet: { nestedParents: item },
                                        },
                                        { new: true })
                                }
                            }

                            /**
                             * B3. CẬP NHẬT LEVEL CHO CÁC PHẦN TỬ CON BÊN DƯỚI
                             */
                            for(const subitem of infoContact?.nestedChilds){
                                let infoSubChild = await ITEM__CONTACT_COLL.findById(subitem)
                                .populate({
                                    path: 'parent',
                                    select: 'level'
                                })
                                .select('parent')
                                if(infoSubChild.parent){
                                    await ITEM__CONTACT_COLL.findByIdAndUpdate(subitem,
                                        {
                                            level: Number(infoSubChild.parent.level) + 1,
                                        },
                                        { new: true })
                                }
                            }
                        }
                    }
                }

                else if(option == 9){
                    let selectObj = '_id namecv'
                
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                    }

                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await FNB_CUSTOMER_CARE_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await FNB_CUSTOMER_CARE_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertCustomerCare({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await FNB_CUSTOMER_CARE_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                else if(option == 10){
                    // console.log({companyID,goodsID, fundasID})
                    await ITEM__GOODS_COLL.updateMany({company: companyID, _id: {$in: goodsID}},{$set: {fundas: fundasID}})
                }

                // convert Timesheet
                else if(option == 11){
                    let selectObj = '_id name note'
                
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                    }

                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await TIMESHEET__EXPERT_TIMESHEET_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await TIMESHEET__EXPERT_TIMESHEET_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertTimesheet({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await TIMESHEET__EXPERT_TIMESHEET_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // convert Salary
                else if(option == 12){
                    let selectObj = '_id name note'
                
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                    }

                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await TIMESHEET__EXPERT_SALARY_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await TIMESHEET__EXPERT_SALARY_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertSalary({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await TIMESHEET__EXPERT_SALARY_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // convert Document
                else if(option == 13){
                    let selectObj = '_id name sign storeSign description note approver'
                
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                    }

                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await DOCUMENT__DOC_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await DOCUMENT__DOC_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertDocument({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await DOCUMENT__DOC_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // convert expert_timesheets namecv cho Bảng chấm công cha
                else if(option == 14){
                    let selectObj = '_id name note'
                
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                        conditionObj.parent = {$exists: false}
                        conditionObj.namecv = ""
                    }

                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await TIMESHEET__EXPERT_TIMESHEET_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await TIMESHEET__EXPERT_TIMESHEET_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertTimesheet({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await TIMESHEET__EXPERT_TIMESHEET_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // convert Goods namecv
                else if(option == 15){
                    let selectObj = '_id name sign unit note'
                
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                    }

                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await ITEM__GOODS_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await ITEM__GOODS_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertGoods({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await ITEM__GOODS_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                /**
                 * Convert Cashbook to Store order/product
                 * => Ứng dụng được chuyển từ Kho sang Kế toán
                 */
                else if(option == 16){
                    // let selectObj = '_id name sign unit note amount date'

                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                    }

                    conditionObj.parent = { $exists: false }
                    conditionObj.active = 1 // Chỉ lấy phiếu đã hoàn thành

                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await FIN__CASH_BOOK_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await FIN__CASH_BOOK_COLL.find(conditionObj)
                        // .select(selectObj)
                        .sort({_id: 1})
                        .lean()

                        // console.log(listDataConvert)
    
                        for(const item of listDataConvert){
                            let listData = await FIN__CASH_BOOK_COLL.find({ parent: item._id })
                            
                            // console.log(item)
                            // Tạo phiếu
                            let infoOrder = await STORE_ORDER_MODEL.insert({
                                companyID: item.company, 
                                userID: item.userCreate, 
                                outin: item.outin, 
                                type: item.type, 
                                projectID: item.project, 
                                warehouseID: item.warehouse, 
                                customerID: item.customer, 
                                contractID: item.contract, 
                                date: item.date, 
                                name: item.name, 
                                sign: item.sign, 
                                note: item.note 
                            })
                            // console.log(infoOrder)

                            // Tạo chi tiết
                            if(infoOrder){
                                for(const subitem of listData){
                                    await STORE_ORDER_PRODUCT_MODEL.insert({ 
                                        userID: item.userCreate, 
                                        orderID: infoOrder.data._id, 
                                        accountID: subitem.account, 
                                        customerID: subitem.customer, 
                                        contractID: subitem.contract, 
                                        goodsID: subitem.goods, 
                                        assetsID: subitem.assets, 
                                        name: subitem.name, 
                                        note: subitem.note, 
                                        quantity: subitem.quantity, 
                                        unitPrice: subitem.unitPrice 
                                    })
                                }
                            }
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await FIN__CASH_BOOK_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                /**
                 * Chuẩn hóa bảng lương về đơn giá quy định của ngày làm việc thông thường
                 */
                // else if(option == 17){
                //     let listHuman = await USER_COLL.find({ company: companyID, status: 1 })
                //     .select('contacts fullname')
                //     .populate({
                //         path: 'contacts',
                //         select: 'sallary'
                //     })

                //     for(const item of listHuman){
                //         if(item.contacts && item.contacts.length){
                //             let listDataTimeSheet = await TIMESHEET__EXPERT_TIMESHEET_COLL.find({
                //                 assignee: ObjectID(item._id),
                //                 subtype: 1,
                //                 $where: `return this.date.getMonth() === ${Number(month - 1)} && this.date.getFullYear() === ${Number(year)}`
                //             })
                //             // console.log(listDataTimeSheet)
    
                //             for(const subitem of listDataTimeSheet){

                //                 // Đang không chuẩn với các đơn giá giao khoán của công nhân
                //                 if(Number(Number(item.contacts[0].sallary * 12 / 2504)).toFixed(0) != Number(subitem.unitprice)){
                //                     // console.log({ name:item.fullname, date: subitem.date, unitprice: subitem.unitprice})
                                    
                //                     await TIMESHEET__EXPERT_TIMESHEET_MODEL.update({
                //                             userID,
                //                             expertTimesheetID: subitem._id,
                //                             hours: subitem.hours,
                //                             unitprice: Number(Number(item.contacts[0].sallary * 12 / 2504)).toFixed(0)
                //                     })
                //                 }
                //             }
                //         }
                //     }
                // }

                 /**
                 * Chuẩn hóa lại số ngày phép trong năm
                 */
                else if(option == 18){
                    let listHuman = await USER_COLL.find({ company: companyID, status: 1 })
                    .select('_id fullname numberOnLeave')
                    
                    for(const item of listHuman){
                        let dataOnLeave = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                            {
                                $match: {
                                    assignee: ObjectID(item._id),
                                    subtype: 2,
                                }
                            },
                            {
                                $project: {
                                    year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                    // month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                    hours: 1,
                                    amount: 1,
                                    date: 1
                                }
                            },
                            {
                                $match: {
                                    year: Number(year)
                                }
                            },
                            {
                                $group: {
                                    _id: { },
                                    hours: { $sum: "$hours" },
                                }
                            },
                        ])

                        if(dataOnLeave && dataOnLeave.length){
                            await USER_COLL.findByIdAndUpdate(item._id, {
                                numberOnLeave: Number(dataOnLeave[0].hours / 8).toFixed(2)
                            }, { new: true })
                        }
                    }
                }

                 /**
                 * Cập nhật Thumbnail cho Media
                 */
                else if(option == 19){
                    let listData = await MEDIA_COLL.find({})
                    for(const item of listData){
                        if(item.images.length){
                            await MEDIA_COLL.findByIdAndUpdate(item, {
                                thumbnail: item.images[0]
                            }, { new: true })
                        }
                    }
                }

                /**
                 * Cập nhật Hồ sơ nhân sự
                 */
                else if(option == 20){
                    let listData = await HUMAN__CONTACT_DOCUMENT_COLL.find({}).select('_id contact')
                    for(const item of listData){
                        await ITEM__CONTACT_COLL.findByIdAndUpdate(item.contact, {
                            $addToSet: {
                                documents: item
                            }
                        }, { new: true })
                    }
                }

                return resolve({ error: false, data: 'Convert thành công' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    convertContact({ docID, selectObj }) {
        return new Promise(async resolve => {
            try {
                let info = await ITEM__CONTACT_COLL.findById(docID).select(`${selectObj}`)

                let convertStr = ''
                if(info.name && info.name != ""){
                    convertStr = stringUtils.removeAccents(info.name)
                }
                if(info.sign && info.sign != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.sign)
                }
                if(info.description && info.description != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.description)
                }
                if(info.note && info.note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.note)
                }
                if(info.phone && info.phone != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.phone)
                }
                if(info.email && info.email != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.email)
                }
                if(info.identity && info.identity != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.identity)
                }
                if(info.taxid && info.taxid != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.taxid)
                }
                if(info.bankAccount && info.bankAccount != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.bankAccount)
                }

                await ITEM__CONTACT_COLL.findByIdAndUpdate(docID, {namecv: convertStr}, { new: true })
              
                return resolve({ error: false})
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    convertCustomerCare({ docID, selectObj }) {
        return new Promise(async resolve => {
            try {
                let info = await FNB_CUSTOMER_CARE_COLL.findById(docID)
                .populate({
                    path: 'customer',
                    select: 'name sign description note phone email identity taxid bankAccount',
                })
                .select(`${selectObj}`)
                // console.log(info?.customer)

                let convertStr = stringUtils.removeAccents(info.name) + stringUtils.removeAccents(info.note)
                // console.log(convertStr)

                if(info?.customer?.name && info?.customer?.name != "" && info?.customer?.name != 'undefined'){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info?.customer?.name)
                }
                if(info?.customer?.sign && info?.customer?.sign != "" && info?.customer?.sign != 'undefined'){
                    // console.log(info?.customer?.sign)
                    convertStr = convertStr + " " + stringUtils.removeAccents(info?.customer?.sign)
                }
                if(info?.customer?.description && info?.customer?.description != "" && info?.customer?.description != 'undefined'){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info?.customer?.description)
                }
                if(info?.customer?.note && info?.customer?.note != "" && info?.customer?.note != 'undefined'){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info?.customer?.note)
                }
                if(info?.customer?.phone && info?.customer?.phone != "" && info?.customer?.phone != 'undefined'){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info?.customer?.phone)
                }
                if(info?.customer?.email && info?.customer?.email != "" && info?.customer?.email != 'undefined'){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info?.customer?.email)
                }
                if(info?.customer?.identity && info?.customer?.identity != "" && info?.customer?.identity != 'undefined'){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info?.customer?.identity)
                }
                if(info?.customer?.taxid && info?.customer?.taxid != "" && info?.customer?.taxid != 'undefined'){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info?.customer?.taxid)
                }
                if(info?.customer?.bankAccount && info?.customer?.bankAccount != "" && info?.customer?.bankAccount != 'undefined'){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info?.customer?.bankAccount)
                }

                await FNB_CUSTOMER_CARE_COLL.findByIdAndUpdate(docID, {namecv: convertStr}, { new: true })
              
                return resolve({ error: false})
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    convertDoctype({ docID, selectObj }) {
        return new Promise(async resolve => {
            try {
                let info = await ITEM__DOCTYPE_COLL.findById(docID).select(`${selectObj}`)

                let convertStr = ''
                if(info.name && info.name != ""){
                    convertStr = stringUtils.removeAccents(info.name)
                }
                if(info.sign && info.sign != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.sign)
                }
                if(info.description && info.description != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.description)
                }

                await ITEM__DOCTYPE_COLL.findByIdAndUpdate(docID, {namecv: convertStr}, { new: true })
              
                return resolve({ error: false})
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    convertBudget({ docID, selectObj }) {
        return new Promise(async resolve => {
            try {
                let info = await BUDGET__WORK_COLL.findById(docID).select(`${selectObj}`)

                let convertStr = ''
                if(info.name && info.name != ""){
                    convertStr = stringUtils.removeAccents(info.name)
                }
                if(info.sign && info.sign != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.sign)
                }
                if(info.description && info.description != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.description)
                }
                if(info.note && info.note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.note)
                }

                await BUDGET__WORK_COLL.findByIdAndUpdate(docID, {namecv: convertStr}, { new: true })
              
                return resolve({ error: false})
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    convertTimesheet({ docID, selectObj }) {
        return new Promise(async resolve => {
            try {
                let info = await TIMESHEET__EXPERT_TIMESHEET_COLL.findById(docID).select(`${selectObj}`)

                let convertStr = ''
                if(info.name && info.name != ""){
                    convertStr = stringUtils.removeAccents(info.name)
                }

                if(info.note && info.note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.note)
                }

                await TIMESHEET__EXPERT_TIMESHEET_COLL.findByIdAndUpdate(docID, {namecv: convertStr}, { new: true })
              
                return resolve({ error: false})
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    convertSalary({ docID, selectObj }) {
        return new Promise(async resolve => {
            try {
                let info = await TIMESHEET__EXPERT_SALARY_COLL.findById(docID).select(`${selectObj}`)

                let convertStr = ''
                if(info.name && info.name != ""){
                    convertStr = stringUtils.removeAccents(info.name)
                }
                
                if(info.note && info.note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.note)
                }

                await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(docID, {namecv: convertStr}, { new: true })
              
                return resolve({ error: false})
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    convertDocument({ docID, selectObj }) {
        return new Promise(async resolve => {
            try {
                let info = await DOCUMENT__DOC_COLL.findById(docID).select(`${selectObj}`)

                let convertStr = ''
                if(info.name && info.name != ""){
                    convertStr = stringUtils.removeAccents(info.name)
                }
                if(info.sign && info.sign != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.sign)
                }
                if(info.storeSign && info.storeSign != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.storeSign)
                }
                if(info.description && info.description != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.description)
                }
                if(info.note && info.note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.note)
                }
                if(info.approver && info.approver != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.approver)
                }

                await DOCUMENT__DOC_COLL.findByIdAndUpdate(docID, {namecv: convertStr}, { new: true })
              
                return resolve({ error: false})
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    convertGoods({ docID, selectObj }) {
        return new Promise(async resolve => {
            try {
                let info = await ITEM__GOODS_COLL.findById(docID).select(`${selectObj}`)

                let convertStr = ''
                if(info.name && info.name != ""){
                    convertStr = stringUtils.removeAccents(info.name)
                }
                if(info.sign && info.sign != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.sign)
                }
                if(info.unit && info.unit != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.unit)
                }
                if(info.note && info.note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.note)
                }

                await ITEM__GOODS_COLL.findByIdAndUpdate(docID, {namecv: convertStr}, { new: true })
              
                return resolve({ error: false})
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    resetData({ option, companyID, page, unit, getNumber, newPassword, pass, salaryID }){
        // console.log({ option, companyID, page, unit, getNumber, newPassword })
        return new Promise(async resolve => { 
            try {
                if(pass && pass == 'Hiepnh1985@#'){
                    if(option == 1){
                        return resolve({ error: false, data: 'Reset thành công' });
                    }else if(option == 2){
                        if(companyID && checkObjectIDs(companyID)){
                            const newPassHash = await hash(newPassword, 8)
                            await USER_COLL.updateMany({company: companyID},{$set: {password: newPassHash}})
                            return resolve({ error: false, data: 'Reset thành công' })
                        }else{
                            return resolve({ error: false, data: 'Reset thất bại' })
                        }
                    }
                    // else if(option == 3){
                    //     if(salaryID && checkObjectIDs(salaryID)){    
                    //         await TIMESHEET__EXPERT_SALARY_COLL.deleteMany({parent: salaryID})
                    //         await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndDelete(salaryID);
                    //         return resolve({ error: false, data: 'Reset thành công' })
                    //     }else{
                    //         if(companyID && checkObjectIDs(companyID)){    
                    //             await TIMESHEET__EXPERT_SALARY_COLL.deleteMany({company: companyID})
                    //             return resolve({ error: false, data: 'Reset thành công' })
                    //         }
                    //     }
                    // }
                    else if(option == 4){
                        await FNB_MISTAKE_COLL.deleteMany({company: companyID})
                        await ITEM__FUNDA_COLL.updateMany({company: companyID},{$set: {
                            numberOfMistakes: 0,
                            amountOfBonus: 0,
                            amountOfMistakes: 0,
                        }})
                        return resolve({ error: false, data: 'Reset thành công' })
                    }
                }else{
                    return resolve({ error: false, data: 'Pass không đúng, Reset thất bại' })
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    exportExcel({ option, isPrivate, companyID, year, fromDate, toDate }){
        // console.log({ option, isPrivate, companyID, year, fromDate, toDate })
        return new Promise(async resolve => { 
            try {
                let yearFilter
                let currentYear = new Date().getFullYear()
                if(year && !isNaN(year)){
                    yearFilter = Number(year)
                }else{
                    yearFilter = Number(currentYear)
                }

                let conditionObj = {
                    userCreate: { $exists: true, $ne: null }, 
                    companyOfAuthor: { $exists: true, $ne: null },
                    app: { $exists: true, $ne: null },
                }, 
                    conditionObjYear = {}

                if(isValidDate(fromDate) && isValidDate(toDate)){
                    conditionObj.createAt = {
                        $gte: new Date(fromDate),
                        $lte: new Date(toDate),
                    }
                }else{
                    conditionObjYear.year = Number(yearFilter)
                }

                if(isPrivate && isPrivate == 1){
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.companyOfAuthor = ObjectID(companyID)
                    }
                }
                
                // Dữ liệu truy cập
                if(option == 1){
                    let listData = await ANALYSIS__HISTORY_TRAFFIC_COLL.find(conditionObj)
                    .limit(5000)
                    .populate({
                        path: 'companyOfAuthor userCreate app menu',
                        select:'fullname name sign'
                    })
                    .sort({createAt: -1})
                    // .select('name hours unitprice amount status date note')
                    
                    // console.log(listData)
    
                    let listData1 = await ANALYSIS__HISTORY_TRAFFIC_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project : {
                                year : {$year : "$createAt"},
                                month : {$month : "$createAt"},
                                companyOfAuthor : 1,
                                createAt : 1,
                                userCreate : 1,
                                type : 1,
                                app : 1,
                                menu : 1,
                                note : 1,
                            }
                        },
                        {
                            $match: conditionObjYear
                        },
                        {
                            $group: {
                                _id: { app: "$app", month: "$month" },
                                quantity: { $sum: 1 },
                            }
                        },
                    ])
                    // console.log(listData1)
                    let listApp = await APP_COLL.find({_id: {$in: listData1.map(item => item._id.app)}}).sort({_id: 1}).select('name')

                    let listData2 = await ANALYSIS__HISTORY_TRAFFIC_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project : {
                                year : {$year : "$createAt"},
                                month : {$month : "$createAt"},
                                companyOfAuthor : 1,
                                createAt : 1,
                                userCreate : 1,
                                type : 1,
                                app : 1,
                                menu : 1,
                                note : 1,
                            }
                        },
                        {
                            $match: {
                                year: Number(yearFilter)
                            }
                        },
                        {
                            $group: {
                                _id: { companyOfAuthor: "$companyOfAuthor", month: "$month" },
                                quantity: { $sum: 1 },
                            }
                        },
                    ])
                    // console.log(listData2)
                    let listCompany = await COMPANY_COLL.find({_id: {$in: listData2.map(item => item._id.companyOfAuthor)}}).sort({_id: 1}).select('name')

                    let listData3 = await ANALYSIS__HISTORY_TRAFFIC_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project : {
                                year : {$year : "$createAt"},
                                month : {$month : "$createAt"},
                                companyOfAuthor : 1,
                                createAt : 1,
                                userCreate : 1,
                                type : 1,
                                app : 1,
                                menu : 1,
                                note : 1,
                            }
                        },
                        {
                            $match: {
                                year: Number(yearFilter)
                            }
                        },
                        {
                            $group: {
                                _id: { userCreate: "$userCreate", month: "$month" },
                                quantity: { $sum: 1 },
                            }
                        },
                    ])
                    // console.log(listData3)
                    let listUser = await USER_COLL.find({_id: {$in: listData3.map(item => item._id.userCreate)}}).sort({_id: 1}).select('fullname company')
                    .populate({
                        path: 'company',
                        select: 'name',
                    })
                    // console.log(listUser)
    
                     // Modify the workbook.
                     XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/analysis_export_traffic.xlsx')))
                     .then(async workbook => {
    
                         var i = 3
                         listData.forEach((item, index) =>{
                             workbook.sheet("Data").row(i).cell(1).value(Number(index + 1))
                             workbook.sheet("Data").row(i).cell(2).value(item.createAt)
                             workbook.sheet("Data").row(i).cell(3).value(item?.companyOfAuthor?.name)
                             workbook.sheet("Data").row(i).cell(4).value(item?.userCreate?.fullname)
                             workbook.sheet("Data").row(i).cell(5).value(DEVICE_TYPES[Number(item.type - 1)].text)
                             workbook.sheet("Data").row(i).cell(6).value(item?.app?.name)
                             workbook.sheet("Data").row(i).cell(7).value(item?.menu?.name)
                             workbook.sheet("Data").row(i).cell(8).value(item?.note)

                             i++
                         })
    
                         var i = 3
                         listApp.forEach((item, index) =>{
                             workbook.sheet("DashBoard").row(i).cell(1).value(Number(index+1))
                             workbook.sheet("DashBoard").row(i).cell(2).value(`${item.name}`)
                             workbook.sheet("DashBoard").row(i).cell(3).value(`${item._id}`)
    
                             i++
                         })

                         listData1?.forEach((item, index) => {
                            for (var i = 3; i <= listApp.length + 2; i++) {
                                for(var j = 4; j <= 15; j ++){
                                    let appID = workbook.sheet(`DashBoard`).row(i).cell(3).value()

                                    if(appID.toString() === item._id.app.toString() && Number(j - 3) === Number(item._id.month)){
                                        workbook.sheet("DashBoard").row(i).cell(j).value(Number(item.quantity))
                                    }
                                }
                            }
                         })

                         var i = 3
                         listCompany.forEach((item, index) =>{
                             workbook.sheet("DashBoard2").row(i).cell(1).value(Number(index+1))
                             workbook.sheet("DashBoard2").row(i).cell(2).value(`${item.name}`)
                             workbook.sheet("DashBoard2").row(i).cell(3).value(`${item._id}`)
    
                             i++
                         })

                         listData2?.forEach((item, index) => {
                            for (var i = 3; i <= listCompany.length + 2; i++) {
                                for(var j = 4; j <= 15; j ++){
                                    let companyID = workbook.sheet(`DashBoard2`).row(i).cell(3).value()

                                    if(companyID.toString() === item._id.companyOfAuthor.toString() && Number(j - 3) === Number(item._id.month)){
                                        workbook.sheet("DashBoard2").row(i).cell(j).value(Number(item.quantity))
                                    }
                                }
                            }
                         })

                         var i = 3
                         listUser.forEach((item, index) =>{
                             workbook.sheet("DashBoard3").row(i).cell(1).value(Number(index+1))
                             workbook.sheet("DashBoard3").row(i).cell(2).value(`${item.fullname}`)
                             workbook.sheet("DashBoard3").row(i).cell(3).value(`${item.company.name}`)
                             workbook.sheet("DashBoard3").row(i).cell(4).value(`${item._id}`)
    
                             i++
                         })

                         listData3?.forEach((item, index) => {
                            for (var i = 3; i <= listUser.length + 2; i++) {
                                for(var j = 5; j <= 16; j ++){
                                    let userID = workbook.sheet(`DashBoard3`).row(i).cell(4).value()

                                    if(userID.toString() === item._id.userCreate.toString() && Number(j - 4) === Number(item._id.month)){
                                        workbook.sheet("DashBoard3").row(i).cell(j).value(Number(item.quantity))
                                    }
                                }
                            }
                         })
               
                         const now = new Date();
                         const filePath = '../../../files/temporary_uploads/';
                         const fileName = `traffic_report${now.getTime()}.xlsx`;
                         const pathWriteFile = path.resolve(__dirname, filePath, fileName);
    
                         await workbook.toFileAsync(pathWriteFile);
                         const result = await uploadFileS3(pathWriteFile, fileName);
    
                         fs.unlinkSync(pathWriteFile);
                         return resolve({ error: false, data: result?.Location, status: 200 });
                     });
                }

                // Dữ liệu nhập liệu hồ sơ
                if(option == 2){
                    let conditionObj1 = { company: ObjectID(companyID), author: { $exists: true, $ne: null } }
                    let conditionObj2 = { company: ObjectID(companyID), userCreate: { $exists: true, $ne: null } }
                    let conditionObj3 = { company: ObjectID(companyID), userUpdate: { $exists: true, $ne: null } }

                    if(isValidDate(fromDate) && isValidDate(toDate)){
                        conditionObj1.createAt = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate),
                        }
                        conditionObj1.modifyAt = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate),
                        }
                    }
                    
                    // Hồ sơ văn bản
                    let listData1 = await DOCUMENT__DOC_COLL.aggregate([
                        {
                            $match: conditionObj1
                        },
                        {
                            $group: {
                                _id: { author: "$author" },
                                quantity: { $sum: 1 },
                            }
                        },
                    ])
                    .sort({"quantity": -1})

                    let listData2 = await DOCUMENT__DOC_COLL.aggregate([
                        {
                            $match: conditionObj3
                        },
                        {
                            $group: {
                                _id: { author: "$userUpdate" },
                                quantity: { $sum: 1 },
                            }
                        },
                    ])

                    // Hồ sơ nhân sự
                    let listData3 = await HUMAN__CONTACT_DOCUMENT_COLL.aggregate([
                        {
                            $match: conditionObj2
                        },
                        {
                            $group: {
                                _id: { author: "$userCreate" },
                                quantity: { $sum: 1 },
                            }
                        },
                    ])

                    let listData4 = await HUMAN__CONTACT_DOCUMENT_COLL.aggregate([
                        {
                            $match: conditionObj3
                        },
                        {
                            $group: {
                                _id: { author: "$userUpdate" },
                                quantity: { $sum: 1 },
                            }
                        },
                    ])

                    await DOCUMENT__DOC_COLL.populate(listData1, {  
                        path: '_id.author',
                        select: 'fullname',
                        model: 'user' 
                    })

                    await HUMAN__CONTACT_DOCUMENT_COLL.populate(listData3, {  
                        path: '_id.author',
                        select: 'fullname',
                        model: 'user' 
                    })
                    // console.log(listData1)
                    // console.log(listData2)
                    // console.log(listData3)
                    // console.log(listData4)

                     // Modify the workbook.
                     XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/common_input_report.xlsx')))
                     .then(async workbook => {
                        if(isValidDate(fromDate) && isValidDate(toDate)){
                            workbook.sheet("Data").row(2).cell(1).value(`Từ ${moment(fromDate).format('DD/MM/YYYY')} đến ${moment(toDate).format('DD/MM/YYYY')}`)
                            workbook.sheet("Data1").row(2).cell(1).value(`Từ ${moment(fromDate).format('DD/MM/YYYY')} đến ${moment(toDate).format('DD/MM/YYYY')}`)
                        }
    
                        var i = 4
                        listData1.forEach((item, index) =>{
                         workbook.sheet("Data").row(i).cell(1).value(Number(index + 1))
                         workbook.sheet("Data").row(i).cell(2).value(`${item?._id.author?._id}`)
                         workbook.sheet("Data").row(i).cell(3).value(item?._id.author?.fullname)
                         workbook.sheet("Data").row(i).cell(4).value(Number(item?.quantity))

                            i++
                        })

                        for(var j = 4; j <= Number(listData1.length + 3); j++ ){
                            let userID = workbook.sheet("Data").row(j).cell(2).value()
                            for(const item of listData2){
                                if(userID.toString() === item._id.author.toString()){
                                    workbook.sheet("Data").row(j).cell(5).value(Number(item?.quantity))
                                }
                            }
                        }

                        var i = 4
                        listData3.forEach((item, index) =>{
                         workbook.sheet("Data1").row(i).cell(1).value(Number(index + 1))
                         workbook.sheet("Data1").row(i).cell(2).value(`${item?._id.author?._id}`)
                         workbook.sheet("Data1").row(i).cell(3).value(item?._id.author?.fullname)
                         workbook.sheet("Data1").row(i).cell(4).value(Number(item?.quantity))

                            i++
                        })

                        for(var j = 4; j <= Number(listData3.length + 3); j++ ){
                            let userID = workbook.sheet("Data1").row(j).cell(2).value()
                            for(const item of listData4){
                                if(userID.toString() === item._id.author.toString()){
                                    workbook.sheet("Data1").row(j).cell(5).value(Number(item?.quantity))
                                }
                            }
                        }
               
                         const now = new Date();
                         const filePath = '../../../files/temporary_uploads/';
                         const fileName = `common_input_report${now.getTime()}.xlsx`;
                         const pathWriteFile = path.resolve(__dirname, filePath, fileName);
    
                         await workbook.toFileAsync(pathWriteFile);
                         const result = await uploadFileS3(pathWriteFile, fileName);
    
                         fs.unlinkSync(pathWriteFile);
                         return resolve({ error: false, data: result?.Location, status: 200 });
                     });
                }

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    // Tham khảo cũ
    // resetAllData({ option, email, password, userID, fundaID, companyID, page, arrCustomers }) {
    //     const that = this
    //     // console.log({ option, email, password, userID, fundaID, companyID, arrCustomers })
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(password.toString() != `noPass12345${email}`)
    //                 return resolve({ error: true, message: 'Mật hiệu không chính xác', status: 403 })
    //             /**
    //              * CẬP NHẬT TÍCH ĐIỂM
    //              * Convert dữ liệu cũ, mới
    //              * Từ đơn hàng sẽ tính ra được Credit mà khách đã sử dụng -> Tổng hợp theo mã khách -> Cập nhật vào danh bạ
    //              */
    //             // if(option == 1){
    //             //     await FNB_ORDER_COLL.updateMany(
    //             //         {
    //             //             company: companyID,
    //             //             status: 5, // Chỉ đơn hoàn thành
    //             //             salesChannel: 1, // Kênh offline
    //             //          },
    //             //         [{
    //             //             $set: {loyaltyPoints: {$multiply: [FNB_FACTOR.credit.level1.factor/100, "$amount"]}}
    //             //         }],
    //             //         {"multi": true}
    //             //     )

    //             //     // Reset về 0 -> Bắt đầu từ đầu
    //             //     await ITEM__CONTACT_COLL.updateMany({ company: companyID },
    //             //         [{
    //             //             $set: {
    //             //                 purchasedOffValue: 0,
    //             //                 totalLoyaltyPoints: 0,
    //             //                 usedLoyaltyPoints: 0,
    //             //                 remainLoyaltyPoints: 0,
    //             //             }
    //             //         }],
    //             //         {"multi": true}
    //             //     )
    //             // }

    //             /**
    //              * CẬP NHẬT TÍCH ĐIỂM THEO TỪNG CƠ SỞ
    //              * Convert dữ liệu cũ, mới
    //              */
    //             // if(option == 2 && fundaID){
    //             //     // Chỉ lấy các khách hàng đã mua hàng
    //             //     let listData = await ITEM__CONTACT_COLL.find({ funda: fundaID, purchasedValue: {$gt: 0} }).select('_id').sort({_id: 1})
    //             //     var i = 1
    //             //     for(const item of listData){
    //             //         if(page && Number(page)>0){
    //             //             if(page == 1){
    //             //                 if(i<=500){
    //             //                     await that.convertDataCustomer({ customerID: item._id, userID })
    //             //                 }
    //             //             }
    //             //             if(page == 2){
    //             //                 if(i>500 && i<=1000){
    //             //                     await that.convertDataCustomer({ customerID: item._id, userID })
    //             //                 }
    //             //             }
    //             //             if(page == 3){
    //             //                 if(i>1000 && i<=1500){
    //             //                     await that.convertDataCustomer({ customerID: item._id, userID })
    //             //                 }
    //             //             }
    //             //             if(page == 4){
    //             //                 if(i>1500 && i<=2000){
    //             //                     await that.convertDataCustomer({ customerID: item._id, userID })
    //             //                 }
    //             //             }
    //             //             if(page == 5){
    //             //                 if(i>2000 && i<=2500){
    //             //                     await that.convertDataCustomer({ customerID: item._id, userID })
    //             //                 }
    //             //             }
    //             //             if(page == 6){
    //             //                 if(i>2500){
    //             //                     await that.convertDataCustomer({ customerID: item._id, userID })
    //             //                 }
    //             //             }

    //             //             i++
    //             //         }else{
    //             //             await that.convertDataCustomer({ customerID: item._id, userID })
    //             //         }
    //             //     }
    //             // }

    //              /**
    //              * CẬP NHẬT LỖI
    //              */
    //             // if(option == 3){
    //             //     // Cập nhật cho Điểm bán
    //             //     await ITEM__FUNDA_COLL.updateMany(
    //             //         {
    //             //             company: ObjectID(companyID),
    //             //         },
    //             //         {$set: {numberOfMistakes: 0 } }
    //             //      )
    //             //     let listData = await FNB_MISTAKE_COLL.aggregate([
    //             //         {
    //             //             $match: {
    //             //                 company: ObjectID(companyID)
    //             //             }
    //             //         },
    //             //         {
    //             //             $group: {
    //             //                 _id: { funda: "$funda" },
    //             //                 quantity: { $sum: 1 },
    //             //             }
    //             //         }
    //             //     ])
    //             //     for(const item of listData){
    //             //         let infoFunda = await ITEM__FUNDA_COLL.findByIdAndUpdate(item._id.funda, {
    //             //             numberOfMistakes: Number(item.quantity)
    //             //         })
    //             //     }
    //             // }

    //             /**
    //              * CẬP NHẬT LƯƠNG CĂN BẢN
    //              */
    //             // if(option == 4){
    //             //     // Cập nhật cho Điểm bán
    //             //     await ITEM__FUNDA_COLL.updateMany(
    //             //         {
    //             //             company: ObjectID(companyID),
    //             //         },
    //             //         {$set: {
    //             //             trainStaffSalar: 10000,
    //             //             trialStaffSalary: 15000,
    //             //             officialStaffSalar: 20000,
    //             //             lunchStaffAllowance: 30000,
    //             //         } }
    //             //      )
    //             // }

    //             /**
    //              * CẬP NHẬT DANH BẠ => BỔ SUNG SUID
    //              */
    //             // if(option == 5){
    //             //     /**
    //             //      * db.contacts.updateMany({company: {$ne: ObjectId("6046bedeb55525368b11c5c3")}},{$set:{email:"",phone:""}})
    //             //      */
    //             //     let listContacts = await ITEM__CONTACT_COLL.find({funda: fundaID}).select('_id').sort({_id: 1})

    //             //     var i = 1
    //             //     for(const item of listContacts){
    //             //         let suid = await stringUtils.randomAndCheckExists(ITEM__CONTACT_COLL, 'suid')

    //             //         if(page && Number(page)>0){
    //             //             if(page == 1){
    //             //                 if(i<=500){
    //             //                     await ITEM__CONTACT_COLL.findByIdAndUpdate(item._id, { suid: suid })
    //             //                 }
    //             //             }
    //             //             if(page == 2){
    //             //                 if(i>500 && i<=1000){
    //             //                     await ITEM__CONTACT_COLL.findByIdAndUpdate(item._id, { suid: suid })
    //             //                 }
    //             //             }
    //             //             if(page == 3){
    //             //                 if(i>1000 && i<=1500){
    //             //                     await ITEM__CONTACT_COLL.findByIdAndUpdate(item._id, { suid: suid })
    //             //                 }
    //             //             }
    //             //             if(page == 4){
    //             //                 if(i>1500 && i<=2000){
    //             //                     await ITEM__CONTACT_COLL.findByIdAndUpdate(item._id, { suid: suid })
    //             //                 }
    //             //             }
    //             //             if(page == 5){
    //             //                 if(i>2000 && i<=2500){
    //             //                     await ITEM__CONTACT_COLL.findByIdAndUpdate(item._id, { suid: suid })
    //             //                 }
    //             //             }
    //             //             if(page == 6){
    //             //                 if(i>2500 && i<=3000){
    //             //                     await ITEM__CONTACT_COLL.findByIdAndUpdate(item._id, { suid: suid })
    //             //                 }
    //             //             }
    //             //             if(page == 7){
    //             //                 if(i>3000 && i<=3500){
    //             //                     await ITEM__CONTACT_COLL.findByIdAndUpdate(item._id, { suid: suid })
    //             //                 }
    //             //             }
    //             //             if(page == 8){
    //             //                 if(i>3500 && i<=4000){
    //             //                     await ITEM__CONTACT_COLL.findByIdAndUpdate(item._id, { suid: suid })
    //             //                 }
    //             //             }
    //             //             if(page == 9){
    //             //                 if(i>4000 && i<=4500){
    //             //                     await ITEM__CONTACT_COLL.findByIdAndUpdate(item._id, { suid: suid })
    //             //                 }
    //             //             }

    //             //             i++
    //             //         }else{
    //             //             await ITEM__CONTACT_COLL.findByIdAndUpdate(item._id, { suid: suid })
    //             //         }
    //             //     }

    //             //     return resolve({ error: false, message: 'Reset thành công', data: listContacts.length });
    //             // }

    //             /**
    //              * UPDATE CÁC SỐ ĐIỆN THOẠI TRÙNG
    //              */
    //             // if(option == 6){
    //             //     let listDataPhone = await ITEM__CONTACT_COLL.aggregate([
    //             //         {"$match": {company: ObjectID(companyID)} },
    //             //         {"$group" : { "_id": "$phone", "count": { "$sum": 1 } } },
    //             //         {"$match": {"_id" :{ "$ne" : null } , "count" : {"$gt": 1} } },
    //             //         {"$project": {"phone" : "$_id", "_id" : 0} }
    //             //     ])
    //             //     return resolve({ error: false, listDataPhone })
    //             // }

    //             // if(option == 7){
    //             //     await ITEM__CONTACT_COLL.updateMany(
    //             //         { _id: {$in: arrCustomers }},
    //             //         { $set: {type: 2} }
    //             //      );

    //             //      return resolve({ error: false, message: 'Reset thành công'})
    //             // }

    //             // Update Người thực hiện bảng chấm công
    //             if(option == 8){
    //                 let listData = await TIMESHEET__EXPERT_TIMESHEET_COLL.find({
    //                     company: ObjectID(companyID),
    //                     parent: { $exists: true, $ne: null },
    //                     assignee: { $exists: false } // Chưa gán người thực hiện
    //                 })
    //                 // console.log(listData)
                    
    //                 for(const item of listData){
    //                     let info = await TIMESHEET__EXPERT_TIMESHEET_COLL.findById(item)
    //                     .select('parent')
    //                     .populate('parent')
    //                     // console.log(info)

    //                     await TIMESHEET__EXPERT_TIMESHEET_COLL.findByIdAndUpdate(item, {
    //                             assignee: info.parent.assignee
    //                         }, { new: true });
    //                 }

    //                 return resolve({ error: false })
    //             }


    //             // return resolve({ error: false, message: 'Reset thành công'})
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message, status: 500 });
    //         }
    //     })
    // }
}

exports.MODEL = new Model