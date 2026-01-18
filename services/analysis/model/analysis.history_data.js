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
const { isValidVietnamPhoneNumber } 	= require("../../../tools/utils/utils");
const { 
    DEVICE_TYPES,
 }                = require('../helper/analysis.keys-constant')

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant')
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant')
const { CF_ACTIONS_CHATTING } 		    = require('../../chatting/helper/chatting.actions-constant')
const { CF_ACTIONS_ANALYSIS }           = require('../../analysis/helper/analysis.actions-constant')
const { CF_ACTIONS_ZALO }               = require("../../zalo_oa/helper/zalo.actions")
const { ITEM_ACCOUNTS }                 = require('../../item/helper/item.keys-constant')

/**
 * COLLECTIONS
 */
const ANALYSIS__HISTORY_DATA_COLL               = require('../database/analysis.history_data-coll')
const ANALYSIS__HISTORY_TRAFFIC_COLL            = require('../database/analysis.history_traffic-coll')
const USER_COLL                                 = require('../../auth/database/auth.user-coll')
const APP_COLL                                  = require('../../auth/database/permission/auth.app-coll')
const COMPANY_COLL                              = require('../../auth/database/auth.company-coll')
const BUDGET__WORK_COLL                         = require('../../budget/database/budget.work-coll');
const ITEM__ACCOUNT_COLL            		    = require('../../item/database/item.account-coll')
const ITEM__CONTACT_COLL            		    = require('../../item/database/item.contact-coll')
const ITEM__DOCTYPE_COLL            		    = require('../../item/database/item.doctype-coll')
const ITEM__FUNDA_COLL            		        = require('../../item/database/item.funda-coll')
const ITEM__WAREHOUSE_COLL            		    = require('../../item/database/item.warehouse-coll')
const ITEM__GOODS_COLL            		        = require('../../item/database/item.goods-coll')
const FNB_CUSTOMER_CARE_COLL                    = require('../../fnb/database/fnb.customer_care-coll');
const FNB_ORDER_COLL                            = require('../../fnb/database/fnb.order-coll');
const FNB_VOUCHER_COLL                          = require('../../fnb/database/fnb.voucher-coll');
const FNB_ORDER_PRODUCT_COLL                    = require('../../fnb/database/fnb.order_product-coll');
const FNB_PRODUCT_COLL                          = require('../../fnb/database/fnb.product-coll');
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
const CRM_HABIT_COLL                            = require('../../crm/database/crm.habit-coll');

const ITEM__FUNDA_MODEL                         = require('../../item/model/item.funda-model').MODEL;

// const PCM_PLAN_GROUP_MODEL                      = require('../../subject_pcm/model/subject_pcm.pcm_plan_group').MODEL
// const STORE_ORDER_MODEL                         = require('../../store/model/store.order-model.js').MODEL;
// const STORE_ORDER_PRODUCT_MODEL                 = require('../../store/model/store.order_product-model.js').MODEL;
// // const TIMESHEET__EXPERT_TIMESHEET_MODEL         = require('../../timesheet/model/timesheet.expert_timesheet-model.js').MODEL;
// const ITEM__ACCOUNT_MODEL                       = require('../../item/model/item.account-model').MODEL;

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
        return new Promise(async resolve => { 
            try {                
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
                
                // Tạo cây tài khoản Kế toán
                else if(option == 3){
                    for(const item of ITEM_ACCOUNTS){
                        // console.log(item)

                        // CẤP 1: Kiểm tra tên tồn tại trong công ty hay chưa
                        let infoAccount = await ITEM__ACCOUNT_COLL.findOne({ company: companyID, name: `${item.name}`.trim() })
                        if(infoAccount){
                            // console.log('1111111111111111111111')

                            // CẤP 2: Tạo các mẩu tin con
                            if(item.sub){
                                for(const sub of item.sub){
                                    let infoSub = await ITEM__ACCOUNT_COLL.findOne({ company: companyID, name: `${sub.name}`.trim() })
                                    if(infoSub){
                                        // console.log('2222222222222222222222222')
                                        // CẤP 3: 
                                        if(sub.sub2){
                                            for(const sub2 of sub?.sub2){
                                                let infoSub2 = await ITEM__ACCOUNT_COLL.findOne({ company: companyID, name: `${sub2.name}`.trim() })
                                                if(!infoSub2){
                                                    // console.log('33333333333333333')
                                                    let infoSub2New = await ITEM__ACCOUNT_MODEL.insert({
                                                        companyID,
                                                        parentID: infoSub._id, 
                                                        name: `${sub2.name}`.trim(), 
                                                        description: `${sub2.description}`.trim(), 
                                                        userID
                                                    })
                                                    // console.log(infoSub2New)
                                                }
                                            }
                                        }
                                    }
                                    
                                    else{
                                        // console.log('4444444444444444444')
                                        let infoSubNew = await ITEM__ACCOUNT_MODEL.insert({
                                            companyID,
                                            parentID: infoAccount._id, 
                                            name: `${sub.name}`.trim(), 
                                            description: `${sub.description}`.trim(), 
                                            userID
                                        })
                                        // console.log(infoSubNew)
    
                                        if(infoSubNew){
                                            // CẤP 3: 
                                            if(sub.sub2){
                                                for(const sub2 of sub?.sub2){
                                                    let infoSub2 = await ITEM__ACCOUNT_COLL.findOne({ company: companyID, name: `${sub2.name}`.trim() })
                                                    if(!infoSub2){
                                                        // console.log('55555555555555555555')
                                                        let infoSub2New = await ITEM__ACCOUNT_MODEL.insert({
                                                            companyID,
                                                            parentID: infoSubNew.data._id, 
                                                            name: `${sub2.name}`.trim(), 
                                                            description: `${sub2.description}`.trim(), 
                                                            userID
                                                        })
                                                        // console.log(infoSub2New)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        else{
                            // Tạo mẩu tin
                            let infoAccountNew = await ITEM__ACCOUNT_MODEL.insert({
                                companyID, 
                                name: `${item.name}`.trim(), 
                                description: `${item.description}`.trim(), 
                                userID
                            })
                            // console.log(infoAccountNew)

                            if(infoAccountNew){
                                // console.log('66666666666666666')
                                if(item.sub){
                                    for(const sub of item.sub){
                                        let infoSubNew = await ITEM__ACCOUNT_MODEL.insert({
                                            companyID,
                                            parentID: infoAccountNew.data._id, 
                                            name: `${sub.name}`.trim(), 
                                            description: `${sub.description}`.trim(), 
                                            userID
                                        })
                                        // console.log(infoSubNew)
        
                                        if(infoSubNew){
                                            // console.log('77777777777777777777')
                                            // CẤP 3: 
                                            if(sub.sub2){
                                                for(const sub2 of sub?.sub2){
                                                    let infoSub2New = await ITEM__ACCOUNT_MODEL.insert({
                                                        companyID,
                                                        parentID: infoSubNew.data._id, 
                                                        name: `${sub2.name}`.trim(), 
                                                        description: `${sub2.description}`.trim(), 
                                                        userID
                                                    })
                                                    // console.log(infoSub2New)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                     }
                }

                // Tạo đơn vị cơ sở mặc định của các phân vùng
                else if(option == 4){
                    let listCompany = await COMPANY_COLL.find({})
                    for(const item of listCompany){
                        let infoFunda = await ITEM__FUNDA_COLL.findOne({company: item._id}).select('name sign')
                        if(!infoFunda){
                            await ITEM__FUNDA_MODEL.insert({ 
                                companyID: item._id, 
                                userID,
                                name: item.name, 
                                sign: item.sign
                            })
                        }
                    }
                }

                return resolve({ error: false, data: 'Clone thành công' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    resetData({ option, companyID, page, unit, getNumber, newPassword, pass, salaryID, staffID, voucherIDs }){
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

                    // Reset nghỉ phép
                    else if(option == 5){
                        await USER_COLL.updateMany({company: companyID},{$set: {
                            numberOnLeave: 0, // Số ngày đã nghỉ phép trong năm
                        }})
                        await ITEM__CONTACT_COLL.updateMany({company: companyID, linkUser: {$exists: true, $ne: null}},{$set: {
                            numberOnLeave: 12, // Số ngày được nghỉ phép trong năm
                            numberOnLeavePlus: 0,
                        }})
                        return resolve({ error: false, data: 'Reset thành công' })
                    }

                    // Reset Voucher nhân viên khi nghỉ việc
                    else if(option == 6){
                        // Danh sách voucher của Nhân viên
                        let listData = await FNB_VOUCHER_COLL.find({company: companyID, type: 5 })
                        let listVouchers = []

                        if(checkObjectIDs(voucherIDs)){
                            listVouchers = voucherIDs
                        }else{
                            listVouchers = listData.map(item => item._id)
                        }
                        // console.log(listVouchers)

                        for(const item of listVouchers){
                            // Xóa nhân sự ra khỏi voucher
                            let info1 = await FNB_VOUCHER_COLL.findByIdAndUpdate(item,
                                {
                                    $pull: {
                                        receivers: staffID,
                                    },
                                },
                                { new: true })

                            // console.log(info1)

                            // Xóa voucher ra khỏi nhân sự
                            let info2 = await ITEM__CONTACT_COLL.findByIdAndUpdate(staffID,
                                {
                                    $pull: {
                                        getVouchers: item,
                                    },
                                },
                                { new: true })

                            // console.log(info2)
                        }

                        return resolve({ error: false, data: 'Reset thành công' })
                    }

                    // Reset phép nhân viên
                    else if(option == 7){
                        let listUser = await USER_COLL.find({numberOnLeave:{$gt: 0}})
                        for(const item of listUser){
                            let numberOnLeave = 0
                            let yearFilter = new Date().getFullYear() // Chỉ Xử lý nghỉ phép của năm hiện tại
    
                            let listData = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                                {
                                    $match: {
                                        assignee: ObjectID(item._id),
                                        subtype: 2,
                                    }
                                },
                                {
                                    $project: {
                                        year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                        hours: 1,
                                    }
                                },
                                {
                                    $match: {
                                        year: Number(yearFilter),
                                    }
                                },
                                {
                                    $group: {
                                        _id: { },
                                        hours: { $sum: "$hours" },
                                    }
                                },
                            ])
                            // console.log(listData)
    
                            if(listData.length){
                                numberOnLeave = Number(listData[0].hours)/8
                            }
                            
                            // Cập nhật nghỉ phép vào User
                            await USER_COLL.findByIdAndUpdate(item._id, {
                                numberOnLeave: numberOnLeave
                            }, { new: true })
                        }
                        return resolve({ error: false, data: 'Reset thành công' })
                    }
                     // Reset Habit
                    else if(option == 8){
                        const moment = require('moment');

                        // Thiết kế ngày Thứ 2 (start of week) và Chủ Nhật (end of week)
                        // .startOf('isoWeek') sẽ trả về Thứ 2 đầu tuần theo chuẩn ISO
                        const startOfWeek = moment().startOf('isoWeek').toDate(); 
                        const endOfWeek = moment().endOf('isoWeek').toDate();
                        // console.log(startOfWeek)
                        // console.log(endOfWeek)

                        await CRM_HABIT_COLL.updateMany(
                            {},
                            {$set: {
                                startDate: startOfWeek,
                                finishDate: endOfWeek,
                                total1: 0,
                                realityBonus1: 0,
                                total2: 0,
                                realityBonus2: 0,
                                total3: 0,
                                realityBonus3: 0,
                            }}
                        )

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

    convertData({ option, companyID, userID, page, unit, getNumber, newPassword, fundaID, warehouseID, contactID, fundasID, fromDate, toDate, month, year, docID, parentID, goodsID }){
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
                    console.log('=================3333333333333333')
                    /**
                     * B1. XỬ LÝ VỚI OLD_PARENT VÀ CÁC CẤP TRÊN CŨ
                     * B2. XỬ LÝ VỚI NEW_PARENT VÀ CÁC CẤP TRÊN MỚI
                     * B3. CẬP NHẬT LEVEL CHO CÁC PHẦN TỬ CON BÊN DƯỚI
                     */
                    if(checkObjectIDs(docID) && checkObjectIDs(parentID)){

                        let infoContact = await ITEM__CONTACT_COLL.findById(docID)
                        let infoParent = await ITEM__CONTACT_COLL.findById(parentID)

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

                // Bổ sung mã người giới thiệu
                else if(option == 21){
                    let listData = await ITEM__CONTACT_COLL.find({
                        company: companyID
                    })

                    for(const item of listData){
                        let suid = await stringUtils.randomAndCheckExists(ITEM__CONTACT_COLL, 'suid')

                        await ITEM__CONTACT_COLL.findByIdAndUpdate(item._id, {
                            suid
                        })
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

    exportExcel({ option, isPrivate, companyID, year, fromDate, toDate }){
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
                else if(option == 2){
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

                // Doanh số bán hàng theo sản phẩm
                else if(option == 3){
                    let yearFilter
                    let currentYear = new Date().getFullYear()
                    if(year && !isNaN(year)){
                        yearFilter = Number(year)
                    }else{
                        yearFilter = Number(currentYear)
                    }

                    let conditionObj = {
                        company: ObjectID(companyID),
                        funda: {$nin: [ObjectID("63dccfca4e334d0012d6f6de"),ObjectID("63dcd0802f92230012670b51")]}
                    }

                    let projectObj =  {
                        year: { $year: { date: "$createAt", timezone: "Asia/Ho_Chi_Minh" } },
                        month: { $month: { date: "$createAt", timezone: "Asia/Ho_Chi_Minh" } },
                        week: { $week: { date: "$createAt", timezone: "Asia/Ho_Chi_Minh" } },
                        company : 1,
                        funda : 1,
                        quantity : 1,
                        unitPrice : 1,
                        amount : 1,
                        createAt: 1,
                        product: 1,
                    }

                    let conditionGroup1 = {
                        _id: {  product: "$product", month: "$month" },
                        quantity: { $sum: "$quantity" },
                        amount: { $sum: "$amount" },
                    }

                    let conditionPopulate1 = {
                        path: '_id.product',
                        select: '_id name',
                        model: 'fnb_product',
                    }

                    let listData1 = await FNB_ORDER_PRODUCT_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project: projectObj
                        },
                        {
                            $match: {
                                year: Number(yearFilter)
                            }
                        },
                        {
                            $group: conditionGroup1
                        },
                    ])

                    let listProduct = await FNB_PRODUCT_COLL.find({_id: {$in: listData1.map(item=>item._id.product)}}).select('name unit')

                    if(listData1.length){
                        await TIMESHEET__EXPERT_SALARY_COLL.populate(listData1, conditionPopulate1)
                    }

                    // Modify the workbook.
                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fnb_export_product_report.xlsx')))
                    .then(async workbook => {
                   
                        var i = 4
                        listData1.forEach((item, index) =>{
                            workbook.sheet("Sheet1").row(i).cell(1).value(Number(index + 1))
                            workbook.sheet("Sheet1").row(i).cell(2).value(item?._id.product?.name)
                            workbook.sheet("Sheet1").row(i).cell(3).value(Number(item?._id.month))
                            workbook.sheet("Sheet1").row(i).cell(4).value(Number(yearFilter))
                            workbook.sheet("Sheet1").row(i).cell(5).value(Number(item.quantity))
                            workbook.sheet("Sheet1").row(i).cell(6).value(Number(item.amount/item.quantity))
                            workbook.sheet("Sheet1").row(i).cell(7).value(Number(item.amount))

                            i++
                        })        
                        
                        var i = 4
                        listProduct.forEach((item, index) =>{
                            workbook.sheet("Sheet2").row(i).cell(1).value(Number(index + 1))
                            workbook.sheet("Sheet2").row(i).cell(2).value(item?.name)

                            i++
                        }) 
            
                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `product_report${now.getTime()}.xlsx`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);
                        const result = await uploadFileS3(pathWriteFile, fileName);

                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 });
                    });

                    // return resolve({ error: false, data: listData1})
                }

                // Tổng hợp số sản phẩm/đơn hàng
                else if(option == 4){
                    let yearFilter
                    let currentYear = new Date().getFullYear()
                    if(year && !isNaN(year)){
                        yearFilter = Number(year)
                    }else{
                        yearFilter = Number(currentYear)
                    }

                    let conditionObj = {
                        company: ObjectID(companyID),
                        funda: {$nin: [ObjectID("63dccfca4e334d0012d6f6de"),ObjectID("63dcd0802f92230012670b51")]}
                    }

                    let projectObj =  {
                        year: { $year: { date: "$createAt", timezone: "Asia/Ho_Chi_Minh" } },
                        month: { $month: { date: "$createAt", timezone: "Asia/Ho_Chi_Minh" } },
                        company : 1,
                        funda : 1,
                        numberOfProducts : 1,
                        createAt: 1,
                    }

                    let conditionGroup1 = {
                        _id: {  numberOfProducts: "$numberOfProducts", month: "$month" },
                        // _id: {  numberOfProducts: "$numberOfProducts" },
                        quantity: { $sum: 1},
                    }

                    let listData1 = await FNB_ORDER_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project: projectObj
                        },
                        {
                            $match: {
                                year: Number(yearFilter)
                            }
                        },
                        {
                            $group: conditionGroup1
                        },
                        {
                            $sort: {"quantity": -1}
                        },
                    ])

                    // Modify the workbook.
                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fnb_export_product_report.xlsx')))
                    .then(async workbook => {
                   
                        var i = 4
                        listData1.forEach((item, index) =>{
                            workbook.sheet("Sheet3").row(i).cell(1).value(Number(item?._id.numberOfProducts))
                            workbook.sheet("Sheet3").row(i).cell(2).value(Number(item.quantity))
                            workbook.sheet("Sheet3").row(i).cell(3).value(Number(item?._id.month))
                            workbook.sheet("Sheet3").row(i).cell(4).value(Number(yearFilter))
                            
                            i++
                        })        
            
                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `combo_order_report${now.getTime()}.xlsx`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);
                        const result = await uploadFileS3(pathWriteFile, fileName);

                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 });
                    });

                    // return resolve({ error: false, data: listData1})
                }

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    sendZns({ option, companyID, userID, templateId, appId, start_date, expire, voucher_code, note, salesChannel, fromDate, toDate, min, max, quantity, isTest, phoneTest, page=1, limit=500, ctx }){
        return new Promise(async resolve => { 
            try {
                if (Number(limit) > 500) {
                    limit = 500;
                } else {
                    limit = +Number(limit);
                }

                /**
                 * BA
                 * 1. Lấy Danh sách các khách hàng mua hàng trong 30 ngày gần đây: doanh số cao nhất, kênh off/app....
                 * 2. Lấy khách đã quan tâm OA
                 * 3. Kiểm tra những khách hưa mua hàng 30 ngày gần đây
                 */
                // let listContactOA = await ITEM__CONTACT_COLL.find({
                //     company: ObjectID(companyID),
                //     usedVouchers: {$in: [
                //         ObjectID('64378d6618c77f00128abe93'), // ZOA
                //         ObjectID('66095d0a0b315f001249d158'), // ZOA
                //         ObjectID('66095d33c1da550011a6d2f8'), // ZOA
                //         ObjectID('66095d53dc469e00123ac585'), // ZOA
                //         ObjectID('66095d72dc469e00123ac586'), // ZOA
                //         ObjectID('66095d910b315f001249d15a'), // ZOA
                //         ObjectID('66095db6dc469e00123ac58a'), // ZOA
                //     ]},
                // })
                // .select('name phone')
                // .limit(9000)
                // .lean()
                // console.log(listContactOA.length)

                let infoVoucher = await FNB_VOUCHER_COLL.findOne({sign: voucher_code, company: ObjectID(companyID)})
                // console.log(infoVoucher)               

                if(infoVoucher){
                    let conditionObj = {
                        company: ObjectID(companyID),
                        // customer: {$in: listContactOA.map(item=>item._id)}
                    }
    
                    let conditionGroup = {
                        _id: { customer: "$customer"},
                        // number: { $sum: 1 },
                        amount: { $sum: "$amount" },
                        // total: { $sum: "$total" },
                    }
    
                    let conditionPopulate = {
                        path: '_id.customer',
                        select: '_id name phone',
                        model: 'contact',
                    }
    
                    let sortBy = {"amount": -1}
    
                    if(salesChannel){
                        conditionObj.salesChannel = +salesChannel
                    }
    
                    if(!isNaN(min)){
                        conditionObj.amount = {$gte: Number(min)}
                    }else{
                        if(!isNaN(max)){
                            conditionObj.amount = {$lte: Number(max)}
                        }
                    }
    
                    if (isValidDate(fromDate) && isValidDate(toDate)) {
                        conditionObj.createAt = {
                          $gte: new Date(fromDate),
                          $lte: new Date(toDate),
                        }
                    }
                    // console.log(conditionObj)

                    let listData

                    if(quantity){
                        listData = await FNB_ORDER_COLL.aggregate([
                            {
                                $match: conditionObj
                            },
                            {
                                $group: conditionGroup
                            },
                            {
                                $sort: sortBy
                            },
                            {
                                $limit: Number(quantity) // Giới hạn chỉ lấy 10,000 mẩu tin
                            },
                            // {
                            //     $group: {
                            //       _id: null, // Không cần nhóm thêm, chỉ tổng hợp toàn bộ
                            //       totalAmount: { $sum: "$amount" } // Tổng cộng tất cả các giá trị amount
                            //     }
                            // }
                        ])
                    }else{
                        listData = await FNB_ORDER_COLL.aggregate([
                            {
                                $match: conditionObj
                            },
                            {
                                $group: conditionGroup
                            },
                            {
                                $sort: sortBy
                            },
                            {
                                $skip: (page - 1) * limit // Bỏ qua số mẫu tin dựa trên trang
                            },
                            {
                                $limit: limit // Lấy đúng số lượng mẫu tin cho trang hiện tại
                            },
                        ])
                    }
                    console.log(listData.length)

                    await FNB_ORDER_COLL.populate(listData, conditionPopulate)

                    // return resolve({ error: false, data: listData })
                    
                    let arr = []
                    if(isTest){
                        let dataOA = {
                            phone: phoneTest,
                            templateData: {
                                customer_name: `Nguyễn Hữu Hiệp-Test`,
                                customer_id: `6688`,
                                start_date: moment(new Date(start_date)).format("HH:mm DD/MM/YYYY"),
                                expire: moment(new Date(expire)).format("HH:mm DD/MM/YYYY"),
                                voucher_code,
                                note,
                            },
                            templateId,
                            appId,
                        }
                        // console.log(dataOA)
    
                        let info = await ctx.call(
                            `${CF_DOMAIN_SERVICES.ZALO}.${CF_ACTIONS_ZALO.ZALO_SEND_MESSAGE_ZNS}`,
                            dataOA,
                        )
                        // console.log(info)

                        let dataOA2 = {
                            phone: "84985199295",
                            templateData: {
                              customer_name: `Khách 0985199295`,
                              order_code: `C666888`,
                              price: 100000,
                              date: moment(new Date()).format("HH:mm DD/MM/YYYY"),
                              note: "Test nhận thông báo",
                            },
                            templateId: '257162',
                            appId: '963380776351252177'
                        }
                        // console.log(dataOA2)

                        let info2 = await ctx.call(
                            `${CF_DOMAIN_SERVICES.ZALO}.${CF_ACTIONS_ZALO.ZALO_SEND_MESSAGE_ZNS}`,
                            dataOA2,
                        )
                        // console.log(info2)

                        // return resolve({ error: false, message: 'Xử lý thành công' })

                        for(const item of listData){
                            if(isValidVietnamPhoneNumber(item?._id?.customer?.phone)){     
                                arr.push(item)
                            }
                        }

                        if(arr.length){
                            await FNB_VOUCHER_COLL.findByIdAndUpdate(infoVoucher._id, {
                                $addToSet: {
                                    receivers: arr.map(sub=>sub?._id?.customer?._id)
                                }
                            }, { new: true })
                        }

                        XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/contact_zns.xlsx')))
                        .then(async workbook => {

                            var i = 2
                            arr.forEach((item, index) =>{
                                // console.log(item?._id?.customer)
                                workbook.sheet("Sheet1").row(i).cell(1).value(`${item?._id?.customer?._id}`)
                                workbook.sheet("Sheet1").row(i).cell(2).value(`${item?._id?.customer?._id.toString().substring(0, 6)}`)
                                workbook.sheet("Sheet1").row(i).cell(3).value(item?._id?.customer?.name)
                                workbook.sheet("Sheet1").row(i).cell(4).value(`${item?._id?.customer?.phone}`)

                                i++
                            })

                            const now = new Date();
                            const filePath = '../../../files/temporary_uploads/';
                            const fileName = `contact_zns${now.getTime()}.xlsx`;
                            const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                            await workbook.toFileAsync(pathWriteFile);
                            const result = await uploadFileS3(pathWriteFile, fileName);

                            fs.unlinkSync(pathWriteFile);
                            return resolve({ error: false, data: result?.Location, status: 200 });
                        })
                    }else{
                        for(const item of listData){
                            if(isValidVietnamPhoneNumber(item?._id?.customer?.phone)){ 
                                // let dataOA = {
                                //     phone: `84${item?._id?.customer?.phone.slice(1)}`,
                                //     templateData: {
                                //         customer_name: `${item?._id?.customer?.phone}`,
                                //         customer_id: `${item?._id?.customer?._id.toString().substring(0, 6)}`,
                                //         start_date: moment(new Date(start_date)).format("HH:mm DD/MM/YYYY"),
                                //         expire: moment(new Date(expire)).format("HH:mm DD/MM/YYYY"),
                                //         voucher_code,
                                //         note,
                                //     },
                                //     templateId,
                                //     appId,
                                // }
                                // // console.log(dataOA)
            
                                // let info = await ctx.call(
                                //     `${CF_DOMAIN_SERVICES.ZALO}.${CF_ACTIONS_ZALO.ZALO_SEND_MESSAGE_ZNS}`,
                                //     dataOA,
                                // )
                                // console.log(info)
    
                                arr.push(item)
                            }
                        }
                        // console.log(arr)
    
                        if(arr.length){
                            await FNB_VOUCHER_COLL.findByIdAndUpdate(infoVoucher._id, {
                                $addToSet: {
                                    receivers: arr.map(sub=>sub?._id?.customer?._id)
                                }
                            }, { new: true })
                        }

                        XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/contact_zns.xlsx')))
                        .then(async workbook => {

                            var i = 2
                            arr.forEach((item, index) =>{
                                // console.log(item?._id?.customer)
                                workbook.sheet("Sheet1").row(i).cell(1).value(`${item?._id?.customer?._id}`)
                                workbook.sheet("Sheet1").row(i).cell(2).value(`${item?._id?.customer?._id.toString().substring(0, 6)}`)
                                workbook.sheet("Sheet1").row(i).cell(3).value(item?._id?.customer?.name)
                                workbook.sheet("Sheet1").row(i).cell(4).value(`${item?._id?.customer?.phone}`)

                                i++
                            })

                            const now = new Date();
                            const filePath = '../../../files/temporary_uploads/';
                            const fileName = `contact_zns${now.getTime()}.xlsx`;
                            const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                            await workbook.toFileAsync(pathWriteFile);
                            const result = await uploadFileS3(pathWriteFile, fileName);

                            fs.unlinkSync(pathWriteFile);
                            return resolve({ error: false, data: result?.Location, status: 200 });
                        })
    
                        // return resolve({ error: false, message: 'Xử lý thành công' })
                    }
                }else{
                    return resolve({ error: true, message: 'Voucher không hợp lệ' })
                }

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model