"use strict";

const BaseModel = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString } = require('../../../tools/utils/utils');
const ObjectID = require('mongoose').Types.ObjectId;

// const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_AUTH } 		        = require('../../auth/helper/auth.actions-constant');

const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const { uploadFileS3 }                  = require('../../../tools/s3');
const { RANGE_BASE_PAGINATION_V2 } = require('../../../tools/cursor_base/playground/index');
const { KEY_ERROR } = require('../../../tools/keys/index');

/**
 * import inter-coll, exter-coll
 */
const FIN__CASH_PAYMENT_COLL             = require('../database/fin.cash_payment-coll');
const CONTACT_COLL                       = require('../../item/database/item.contact-coll')

/**
 * import inter-model, exter-model
 */
const FNB_ORDER_MODEL                   = require('../../fnb/model/fnb.order-model').MODEL;

class Model extends BaseModel {
    constructor() {
        super(FIN__CASH_PAYMENT_COLL);
    }

    /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    insert({ companyID, userID, customerID, name, note, amount }) {
        const that = this
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1. Tạo data Ví payment
                 * 2. Tính toán: tổng tích điểm, tổng còn lại theo BE
                 * 3. Cộng thêm Payment vào Tích điểm
                 * 4. Khi khách sử dụng mua hàng từ Tích điểm thì trừ tiền như bình thường
                 */
                if(!name || !checkObjectIDs(userID) || !checkObjectIDs(customerID) || !checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'param_not_valid' })
            
                let dataInsert = { company: companyID, userCreate: userID, userUpdate: userID, modifyAt: new Date(), customer: customerID, name }

                if (note) {
                    dataInsert.note = note;
                }

                if (!isNaN(amount)) {
                    dataInsert.amount = amount;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })
            
                await FNB_ORDER_MODEL.updateCustomer({ customerID, userID })
    
                return resolve({ error: false, data: infoAfterInsert, status: 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

    /**
     * Name: Update 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    update({ cashPaymentID, userID, name, note, amount, active }) {
        // console.log({ cashPaymentID, userID, name, note, amount })
        const that = this
        return new Promise(async (resolve) => {
            try {
                if(!name || !checkObjectIDs(userID) || !checkObjectIDs(cashPaymentID))
                    return resolve({ error: true, message: 'param_not_valid' })

                let dataUpdate = { userUpdate: userID, modifyAt: new Date(), name };
                
                if (note) {
                    dataUpdate.note = note;
                }

                if (!isNaN(amount)) {
                    dataUpdate.amount = amount;
                }

                if (!isNaN(active) && [1,2].includes(Number(active))) {
                    dataUpdate.active = active;
                }

                let infoAfterUpdate = await FIN__CASH_PAYMENT_COLL.findByIdAndUpdate(cashPaymentID, dataUpdate, { new: true })
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 })

                // Cập nhật Tích điểm + Gói trả trước
                if (!isNaN(active) && [1,2].includes(Number(active))) {
                    await FNB_ORDER_MODEL.updateCustomer({ customerID: infoAfterUpdate.customer, userID })
                }

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Cập nhật giá trị khi chi tiết thay đổi 
     * Code: Hiepnh
     * Date  : 14/4/2022
     */
    updateValue({
        cashBookID, userID
    }){
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(cashBookID))
                    return resolve({ error: true, message: "Mã hiệu không đúng", keyError: "cashBookID_invalid" })
                let infoCashBook = await FIN__CASH_PAYMENT_COLL.findById(cashBookID)

                let dataUpdate = { userUpdate: userID };

                let listData = await FIN__CASH_PAYMENT_COLL.aggregate([
                    {
                        $match: {
                            parent: ObjectID(cashBookID),
                        }
                    },
                    {
                        $group: {
                            _id: { },
                            income: { $sum: "$income" },
                            expense: { $sum: "$expense" },
                        }
                    },
                ])
                if(listData && listData.length){

                    let arising = Number(listData[0].income) - Number(listData[0].expense)
                    let closingBalance = Number(infoCashBook.openingBalance) + Number(arising)

                    dataUpdate.arising = Number(arising)
                    dataUpdate.closingBalance = Number(closingBalance)
                    dataUpdate.income = Number(listData[0].income)
                    dataUpdate.expense = Number(listData[0].expense)
                }

                let infoAfterUpdate = await FIN__CASH_PAYMENT_COLL.findByIdAndUpdate(cashBookID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_budget", status: 403 });

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Get info 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getInfo({ cashPaymentID, select, populates }) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(cashPaymentID))
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

                let infoContractIPC = await FIN__CASH_PAYMENT_COLL.findById(cashPaymentID)
                    .select(select)
                    .populate(populates)

                if (!infoContractIPC) return resolve({ error: true, message: 'cannot_get' });

                return resolve({ error: false, data: infoContractIPC });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Get list 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getList({ companyID, active, customerID, userCreateID,
        keyword, limit = 30, lastestID, select, populates = {}, sortKey }) {
        return new Promise(async (resolve) => {
            try {
                let sortBy;
                let conditionObj = {company: companyID};
                let keys = ['createAt__-1', '_id__-1'];

                if (limit > 30) {
                    limit = 30
                } else {
                    limit = +limit;
                }

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

                if (checkObjectIDs(customerID)) {
                    conditionObj.customer = customerID;
                }

                if (checkObjectIDs(userCreateID)) {
                    conditionObj.userCreate = userCreateID;
                }

                if(active){
                    conditionObj.active = Number(active)
                }

                if (keyword) {
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = RegExp(keyword, 'i');
                }

                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
                if (lastestID && checkObjectIDs(lastestID)) {
                    let infoData = await FIN__CASH_PAYMENT_COLL.findById(lastestID);
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

                let infoDataAfterGet = await FIN__CASH_PAYMENT_COLL.find(conditionObj)
                    .limit(limit + 1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if (!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor = null;
                if (infoDataAfterGet && infoDataAfterGet.length) {
                    if (infoDataAfterGet.length > limit) {
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await FIN__CASH_PAYMENT_COLL.count(conditionObjOrg);
                let totalPage = Math.ceil(totalRecord / limit);

                return resolve({
                    error: false, data: {
                        listRecords: infoDataAfterGet,
                        limit,
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

    /*
     * Name: Gom nhóm theo thuộc tính 
     * Code: Hiepnh
     * Date: 17/04/2022
     */
    getAmountByProperty({ companyID, customerID, option }){
        // console.log({ companyID, customerID, option })
        return new Promise(async resolve => {
            try {
                let conditionObj = {}, conditionGroup = {}

                if (!option || isNaN(option) || ![1,2,3,4].includes(Number(option)))
                    return resolve({ error: true, message: "Tham số option không hợp lệ", keyError: "option_invalid" })

                // Cấu hình gom nhóm mặc định
                conditionGroup = {
                    _id: {},
                    amount: { $sum: "$amount" },
                }
                
                if(Number(option) === 1){
                    conditionObj.active = 1
                    conditionObj.customer = ObjectID(customerID)
                }

                let listData = await FIN__CASH_PAYMENT_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $group: conditionGroup
                    }
                ])
                // console.log(conditionObj)
                // console.log(listData)

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Download Template Excel
     * Code: Hiepnh
     * Date: 25/7/2023
     */
    downloadTemplateExcel({ option, companyID, parentID, year, userID }) {
        // console.log({ option, companyID, parentID, userID })
        return new Promise(async resolve => {
            try {
                // let option = 3
                /**
                 * IMPORT SỔ QUỸ
                 */
                if(!option){
                    let listItems1 = await ACCOUNT_COLL.find({company: companyID})
                    .limit(200)
                    .select('name')
                    // .populate({
                    //     path: 'members',
                    //     select: 'fullname'
                    // })
                    // console.log(listItems1)
    
                    let listItems2 = await CONTACT_COLL.find({company: companyID})
                    .limit(200)
                    .select('name phone taxid')
    
                    let listItems3 = await CONTRACT_COLL.find({company: companyID})
                    .limit(200)
                    .select('name sign')
    
                    /**
                     * DỮ LIỆU SỔ QUỸ
                     */
                    let listData = await FIN__CASH_PAYMENT_COLL.find({parent: parentID})
                    .limit(2000)
                    .select('date name account customer contract income expense note')
                    .populate({
                        path: 'account customer contract',
                        select: 'name phone'
                    })
                    .sort({date: 1})
                    // console.log(listData)
    
                    // Modify the workbook.
                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fin_cashbook_import.xlsm')))
                    .then(async workbook => {
                        var i = 3
                        listItems1?.forEach((item, index) => {
                            workbook.sheet("Export").row(i).cell(1).value(`${item._id}`)
                            workbook.sheet("Export").row(i).cell(2).value(`${item.name}`)
                            i++
                        })
    
                        var i = 3
                        listItems2?.forEach((item, index) => {
                            workbook.sheet("Export").row(i).cell(3).value(`${item._id}`)
                            workbook.sheet("Export").row(i).cell(4).value(`${item.name}_${item?.phone}_${item?.taxid}`)
                            i++
                        })
    
                        var i = 3
                        listItems3?.forEach((item, index) => {
                            workbook.sheet("Export").row(i).cell(5).value(`${item._id}`)
                            workbook.sheet("Export").row(i).cell(6).value(`${item.name}_${item?.sign}`)
                            i++
                        })
    
                        var i = 3
                        listData?.forEach((item, index) => {
                            workbook.sheet("DataImport").row(i).cell(1).value(Number(index+1))
                            workbook.sheet("DataImport").row(i).cell(2).value(item.date)
                            workbook.sheet("DataImport").row(i).cell(3).value(`${item.name}`)
                            workbook.sheet("DataImport").row(i).cell(4).value(`${item?.account?.name}`)
                            workbook.sheet("DataImport").row(i).cell(5).value(`${(item?.customer && item?.customer != null) ? item.customer.name : ""}`)
                            workbook.sheet("DataImport").row(i).cell(6).value(`${(item?.contract && item?.contract != null) ? item.contract.name : ""}`)
                            workbook.sheet("DataImport").row(i).cell(7).value(Number(item.income))
                            workbook.sheet("DataImport").row(i).cell(8).value(Number(item.expense))
                            workbook.sheet("DataImport").row(i).cell(9).value(`${(item?.note && item?.note != "") ? item?.note : ""}`)
                            i++
                        })
    
                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `fin_cashbook_import_${now.getTime()}.xlsm`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);
    
                        await workbook.toFileAsync(pathWriteFile);
                        const result = await uploadFileS3(pathWriteFile, fileName);
    
                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 });
                    })
                }else{
                    /**
                     * TẢI BẢNG CHẤM CÔNG
                     */
                    if(option == 1){
                        let infoParent = await TIMESHEET__EXPERT_TIMESHEET_COLL.findById(parentID).select('name hours unitprice amount status date note')

                        let listData = await TIMESHEET__EXPERT_TIMESHEET_COLL.find({parent: parentID})
                        .populate({
                            path: 'work assignee',
                            select:'fullname name unit unitPrice'
                        })
                        .select('name hours unitprice amount status date note')
                        // console.log(listData)

                        // Tổng hợp theo Sản lượng
                        let listData1 = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                            {
                                $match: {
                                    work: { $exists: true, $ne: null },
                                    company: ObjectID(companyID),
                                }
                            },
                            {
                                $group: {
                                    _id: { work: "$work" },
                                    quantity: { $sum: "$hours" },
                                }
                            },
                        ])
                        let  conditionPopulate1 = {
                            path: '_id.work',
                            select: '_id name unit unitPrice',
                            model: 'budget_work'
                        }
                        await TIMESHEET__EXPERT_TIMESHEET_COLL.populate(listData1, conditionPopulate1)
                        // console.log(listData1)

                        // Tổng hợp theo người thực hiện
                        let listData2 = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                            {
                                $match: {
                                    assignee: { $exists: true, $ne: null },
                                    parent: ObjectID(parentID),
                                }
                            },
                            {
                                $group: {
                                    _id: { assignee: "$assignee" },
                                    quantity: { $sum: "$hours" },
                                    amount: { $sum: "$amount" },
                                }
                            },
                        ])
                        let  conditionPopulate2 = {
                            path: '_id.assignee',
                            select: '_id fullname',
                            model: 'user'
                        }
                        await TIMESHEET__EXPERT_TIMESHEET_COLL.populate(listData2, conditionPopulate2)
                        // console.log(listData2)

                        // Tổng hợp theo Sản lượng-Tháng
                        let yearFilter
                        let currentYear = new Date().getFullYear()
                        if(year && !isNaN(year)){
                            yearFilter = Number(year)
                        }else{
                            yearFilter = Number(currentYear)
                        }

                        let listData3 = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                            {
                                $match: {
                                    work: { $exists: true, $ne: null },
                                    company: ObjectID(companyID),
                                }
                            },
                            {
                                $project : {
                                    year : {$year : "$date"},
                                    month : {$month : "$date"},
                                    work: 1,
                                    hours: 1,
                                    amount: 1,
                                    date: 1,
                                }
                            },
                            {
                                $match: {
                                    year: Number(yearFilter)
                                }
                            },
                            {
                                $group: {
                                    _id: { work: "$work", month: "$month"},
                                    quantity: { $sum: "$hours" },
                                    amount: { $sum: "$amount" },
                                }
                            },
                        ])
                        // console.log(listData3)

                         // Modify the workbook.
                         XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/timesheet_report.xlsx')))
                         .then(async workbook => {

                            workbook.sheet("Data").row(2).cell(1).value(infoParent.name)
 
                             // NHẬT KÝ CHUNG
                             var i = 4
                             listData.forEach((item, index) =>{
                                let amountBudget = 0
                                if(item?.work?.unitPrice){
                                    amountBudget = Number(item?.work?.unitPrice * item.hours)
                                }
                                 workbook.sheet("Data").row(i).cell(1).value(item.date)
                                 workbook.sheet("Data").row(i).cell(2).value(item.name)
                                 workbook.sheet("Data").row(i).cell(3).value(item?.assignee?.fullname)

                                 workbook.sheet("Data").row(i).cell(4).value(Number(item.hours))
                                 workbook.sheet("Data").row(i).cell(5).value(Number(item.unitprice))
                                 workbook.sheet("Data").row(i).cell(6).value(Number(item.amount))
                                 workbook.sheet("Data").row(i).cell(7).value(item?.note)
                                 workbook.sheet("Data").row(i).cell(8).value(item?.work?.name)
                                 workbook.sheet("Data").row(i).cell(9).value(item?.work?.unit)
                                 workbook.sheet("Data").row(i).cell(10).value(Number(item?.work?.unitPrice) | 0)
                                 workbook.sheet("Data").row(i).cell(11).value(Number(amountBudget))
                                 i++
                             })

                             var i = 4
                             listData1.forEach((item, index) =>{
                                 workbook.sheet("Report1").row(i).cell(1).value(Number(index+1))
                                 workbook.sheet("Report1").row(i).cell(2).value(item._id.work?.name)
                                 workbook.sheet("Report1").row(i).cell(3).value(item._id.work?.unit)
                                 workbook.sheet("Report1").row(i).cell(4).value(Number(item.quantity))
                                 workbook.sheet("Report1").row(i).cell(5).value(Number(item._id.work?.unitPrice))
                                 workbook.sheet("Report1").row(i).cell(6).value(Number(item.quantity * item._id.work?.unitPrice))

                                 workbook.sheet("Report3").row(i).cell(1).value(Number(index+1))
                                 workbook.sheet("Report3").row(i).cell(2).value(item._id.work?.name)
                                 workbook.sheet("Report3").row(i).cell(3).value(`${item._id.work?._id}`)
                                 workbook.sheet("Report3").row(i).cell(4).value(item._id.work?.unit)
                                 workbook.sheet("Report3").row(i).cell(5).value(Number(item.quantity))
                                 workbook.sheet("Report3").row(i).cell(6).value(Number(item._id.work?.unitPrice))
                                 workbook.sheet("Report3").row(i).cell(7).value(Number(item.quantity * item._id.work?.unitPrice))

                                 i++
                             })

                             listData3?.forEach((item, index) => {
                                for(var m = 1; m<=12; m++){
                                    if(Number(item._id.month) === Number(m)){
                                        for(let i=4; i<=Number(listData1.length + 3); i++){

                                            let workID = workbook.sheet(`Report3`).row(i).cell(3).value()
                                            
                                            if(item._id.work.toString() === workID.toString()){

                                                workbook.sheet(`Report3`).row(i).cell(Number(m+7)).value(Number(item.amount))
                                            }
                                        }
                                    }
                                }
                            })

                             var i = 4
                             listData2.forEach((item, index) =>{
                                 workbook.sheet("Report2").row(i).cell(1).value(Number(index+1))
                                 workbook.sheet("Report2").row(i).cell(2).value(item._id.assignee?.fullname)
                                 workbook.sheet("Report2").row(i).cell(3).value(Number(item.quantity))
                                 workbook.sheet("Report2").row(i).cell(4).value(Number(item.amount))

                                 i++
                             })
                   
                             const now = new Date();
                             const filePath = '../../../files/temporary_uploads/';
                             const fileName = `timesheet_report${now.getTime()}.xlsx`;
                             const pathWriteFile = path.resolve(__dirname, filePath, fileName);
 
                             await workbook.toFileAsync(pathWriteFile);
                             const result = await uploadFileS3(pathWriteFile, fileName);
 
                             fs.unlinkSync(pathWriteFile);
                             return resolve({ error: false, data: result?.Location, status: 200 });
                         });
                    }

                     /**
                     * TẢI BẢNG TÍNH LƯƠNG
                     */
                    if(option == 2){
                        let infoParent = await TIMESHEET__EXPERT_SALARY_COLL.findById(parentID).select('name status date note salary')
                        
                        // Danh sách các phòng ban mà user được quyền truy cập
                        let listDepartment = await ITEM__DEPARTMENT_COLL.find({company:companyID, members: { $in: [userID] }}).select('_id name')

                        let listData = await TIMESHEET__EXPERT_SALARY_COLL.find({
                            parent: parentID,
                            project: { $in: listDepartment.map(item=>item.id) }
                        })
                        .populate({
                            path: 'human project position',
                            select:'fullname name',
                        })
                        .select('name status date note salary revenueBonus reward mealAllowance punishment insurance pitax advance remaining paid convertFactor')
                        // console.log(listData)

                         // Modify the workbook.
                         XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/salary_report.xlsx')))
                         .then(async workbook => {

                            workbook.sheet("Data").row(1).cell(1).value(infoParent.name)
 
                             // NHẬT KÝ CHUNG
                             var i = 4
                             listData.forEach((item, index) =>{
                                let hs = item.convertFactor

                                workbook.sheet("Data").row(i).cell(1).value(Number(index + 1))
                                workbook.sheet("Data").row(i).cell(2).value(item?.human?.fullname)
                                workbook.sheet("Data").row(i).cell(3).value(item?.project?.name)
                                workbook.sheet("Data").row(i).cell(4).value(Number(item.salary))
                                workbook.sheet("Data").row(i).cell(5).value(Number(hs))
                                workbook.sheet("Data").row(i).cell(6).value(Number(item.revenueBonus))
                                workbook.sheet("Data").row(i).cell(7).value(Number(item.reward))
                                workbook.sheet("Data").row(i).cell(8).value(Number(item.mealAllowance))
                                workbook.sheet("Data").row(i).cell(9).value(Number(item.punishment))
                                workbook.sheet("Data").row(i).cell(10).value(Number(item.insurance))
                                workbook.sheet("Data").row(i).cell(11).value(Number(item.pitax))
                                workbook.sheet("Data").row(i).cell(12).value(Number(item.salary + item.revenueBonus + item.reward*hs + item.mealAllowance - item.punishment*hs - item.insurance - item.pitax))
                                workbook.sheet("Data").row(i).cell(13).value(Number(item.advance))
                                workbook.sheet("Data").row(i).cell(14).value(Number(item.salary + item.revenueBonus + item.reward*hs + item.mealAllowance - item.punishment*hs - item.insurance - item.pitax - item.advance))
                                workbook.sheet("Data").row(i).cell(16).value(Number(item.paid))
                                workbook.sheet("Data").row(i).cell(17).value(item?.note)
                                
                                i++
                             })
                       
                             const now = new Date();
                             const filePath = '../../../files/temporary_uploads/';
                             const fileName = `salary_report${now.getTime()}.xlsx`;
                             const pathWriteFile = path.resolve(__dirname, filePath, fileName);
 
                             await workbook.toFileAsync(pathWriteFile);
                             const result = await uploadFileS3(pathWriteFile, fileName);
 
                             fs.unlinkSync(pathWriteFile);
                             return resolve({ error: false, data: result?.Location, status: 200 });
                         });
                    }

                    // BẢNG CÂN ĐỐI TÀI KHOẢN
                    if(option == 3){
                        /**
                         * NHẬT KÝ CHUNG
                         */
                        let listData = await FINANCIAL_GENERAL_JOURNAL_COLL.find({ company: companyID })
                        // .select('')
                        .populate({
                            path: 'funda contract debit credit customerDebit customerCredit goods warehouse budgetWork',
                            select: 'name'
                        })


                        /**
                         * DANH SÁCH CÂY TÀI KHOẢN
                         */
                        let listAccounts = await ACCOUNT_MODEL.getListRecursive({ companyID })
                        let listAppMenuParent = listAccounts.data

                        let option = 4, optionTerm = 1, fromDate = '2023-07-20', toDate = '2023-12-31'
                        let listDataCombine = await FINANCIAL_GENERAL_JOURNAL_MODEL.getListByProperty({ option, optionTerm, companyID, fromDate, toDate, userID })
                        // console.log(listDataCombine)
                        // console.log(listDataCombine.data.debitO)
                        // console.log(listDataCombine.data.creditO)
                        // console.log('=====================')
                        // console.log(listDataCombine.data.debitFT)
                        // console.log(listDataCombine.data.creditFT)

                        let arrDebitO = [], arrCreditO = [], arrDebitOF = [], arrCreditOF = [], arrDebitFT = [], arrCreditFT = []

                        listDataCombine.data.debitO.forEach(element=>{
                            let key = element._id.account;
                            if (!Array.isArray(arrDebitO[key])) {
                                arrDebitO[key] = [];
                            }
                            arrDebitO[key].push(element)
                        })

                        listDataCombine.data.creditO.forEach(element=>{
                            let key = element._id.account;
                            if (!Array.isArray(arrCreditO[key])) {
                                arrCreditO[key] = [];
                            }
                            arrCreditO[key].push(element)
                        })

                        listDataCombine.data.debitOF.forEach(element=>{
                            let key = element._id.account;
                            if (!Array.isArray(arrDebitOF[key])) {
                                arrDebitOF[key] = [];
                            }
                            arrDebitOF[key].push(element)
                        })

                        listDataCombine.data.creditOF.forEach(element=>{
                            let key = element._id.account;
                            if (!Array.isArray(arrCreditOF[key])) {
                                arrCreditOF[key] = [];
                            }
                            arrCreditOF[key].push(element)
                        })

                        listDataCombine.data.debitFT.forEach(element=>{
                            let key = element._id.account;
                            if (!Array.isArray(arrDebitFT[key])) {
                                arrDebitFT[key] = [];
                            }
                            arrDebitFT[key].push(element)
                        })

                        listDataCombine.data.creditFT.forEach(element=>{
                            let key = element._id.account;
                            if (!Array.isArray(arrCreditFT[key])) {
                                arrCreditFT[key] = [];
                            }
                            arrCreditFT[key].push(element)
                        })

                        // console.log(arrDebitO)
                        // console.log(arrCreditO)
                        // console.log(arrDebitOF)
                        // console.log(arrCreditOF)
                        // console.log(arrDebitFT)
                        // console.log(arrCreditFT)

                        // return resolve({ error: false, data: { arrDebitO, arrCreditO, arrDebitOF, arrCreditOF, arrDebitFT, arrCreditFT } });

                        // Modify the workbook.
                        XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fin_financial_report.xlsm')))
                        .then(async workbook => {

                            // NHẬT KÝ CHUNG
                            var i = 4
                            listData.forEach((item, index) =>{
                                workbook.sheet("NhatKyChung").row(i).cell(1).value(Number(index+1))
                                workbook.sheet("NhatKyChung").row(i).cell(2).value(`${item?.funda?.name}`)
                                workbook.sheet("NhatKyChung").row(i).cell(3).value()
                                workbook.sheet("NhatKyChung").row(i).cell(4).value(item.date)
                                workbook.sheet("NhatKyChung").row(i).cell(5).value(item.name)
                                workbook.sheet("NhatKyChung").row(i).cell(6).value(item?.debit?.name)
                                workbook.sheet("NhatKyChung").row(i).cell(7).value(item?.credit?.name)
                                workbook.sheet("NhatKyChung").row(i).cell(8).value(item?.customerDebit?.name)
                                workbook.sheet("NhatKyChung").row(i).cell(9).value(item?.customerCredit?.name)
                                workbook.sheet("NhatKyChung").row(i).cell(10).value(item?.goods?.name)
                                workbook.sheet("NhatKyChung").row(i).cell(11).value(item?.warehouse?.name)
                                workbook.sheet("NhatKyChung").row(i).cell(12).value(item?.contract?.name)
                                workbook.sheet("NhatKyChung").row(i).cell(13).value(item?.goods?.unit)
                                workbook.sheet("NhatKyChung").row(i).cell(14).value(Number(item.quantity))
                                workbook.sheet("NhatKyChung").row(i).cell(15).value(Number(item.unitprice))
                                workbook.sheet("NhatKyChung").row(i).cell(16).value(Number(item.amount))
                                workbook.sheet("NhatKyChung").row(i).cell(17).value(item?.budgetWork?.name)
                                workbook.sheet("NhatKyChung").row(i).cell(18).value(Number(item.updown))
                                workbook.sheet("NhatKyChung").row(i).cell(19).value(item?.note)
                                i++
                            })

                            // BẢNG CÂN ĐỐI TÀI KHOẢN
                            var i = 4
                            let recursive = (arr) => {
                                arr.forEach(item => {
                                    workbook.sheet("BangCDTaiKhoan").row(i).cell(1).value(`${item.name}`)
                                    workbook.sheet("BangCDTaiKhoan").row(i).cell(2).value(`${item._id}`)
                                    workbook.sheet("BangCDTaiKhoan").row(i).cell(3).value(`${item.description}`)
                                    // console.log(item.nestedChilds)

                                    // Định dạng bôi đậm nhạt

                                    // Bổ sung tính tổng các phần tử con
                                    let debitFT = 0, allSubDebitFT = 0, totalDebitFT = 0
                                    for(const element of item.nestedChilds){
                                        if(arrDebitFT[`${element}`]){
                                            // console.log('========yessssssssssss')
                                            allSubDebitFT = allSubDebitFT + Number(arrDebitFT[element][0].amount)
                                        }
                                    }
                                    // console.log(allSubDebitFT)

                                    // Hiển thị giá trị
                                    if(arrDebitO[item._id]){
                                        workbook.sheet("BangCDTaiKhoan").row(i+1).cell(4).value(Number(arrDebitO[item._id][0].amount))
                                    }
                                    if(arrCreditO[item._id]){
                                        workbook.sheet("BangCDTaiKhoan").row(i+1).cell(5).value(Number(arrCreditO[item._id][0].amount))
                                    }
                                    if(arrDebitOF[item._id]){
                                        workbook.sheet("BangCDTaiKhoan").row(i+1).cell(6).value(Number(arrDebitOF[item._id][0].amount))
                                    }
                                    if(arrCreditOF[item._id]){
                                        workbook.sheet("BangCDTaiKhoan").row(i+1).cell(7).value(Number(arrCreditOF[item._id][0].amount))
                                    }

                                    if(arrDebitFT[item._id]){
                                        workbook.sheet("BangCDTaiKhoan").row(i+1).cell(8).value(Number(arrDebitFT[item._id][0].amount))
                                        debitFT = Number(arrDebitFT[item._id][0].amount)
                                    }

                                    if(arrCreditFT[item._id]){
                                        workbook.sheet("BangCDTaiKhoan").row(i+1).cell(9).value(Number(arrCreditFT[item._id][0].amount))
                                    }

                                    totalDebitFT = debitFT + allSubDebitFT

                                    // console.log(`${item.name}-${item.description}`)
                                    // console.log({allSubDebitFT})
                                    // console.log({totalDebitFT})
                                    // console.log('===================')

                                    workbook.sheet("BangCDTaiKhoan").row(i).cell(8).value(Number(totalDebitFT))
                                    workbook.sheet("BangCDTaiKhoan").row(i+2).cell(8).value(Number(allSubDebitFT))

                                    if(item.childs.length){
                                        workbook.sheet("BangCDTaiKhoan").row(i).cell(1).style({bold : true, fill: "0000ff"})
                                    }

                                    i = i + 3
            
                                    if (item.childs && item.childs.length) {
                                        recursive(item.childs)
                                    }
                                })
                            }
                            recursive(listAppMenuParent)

                            const now = new Date();
                            const filePath = '../../../files/temporary_uploads/';
                            const fileName = `fin_financial_report${now.getTime()}.xlsm`;
                            const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                            await workbook.toFileAsync(pathWriteFile);
                            const result = await uploadFileS3(pathWriteFile, fileName);

                            fs.unlinkSync(pathWriteFile);
                            return resolve({ error: false, data: result?.Location, status: 200 });
                        });
                    }
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Import Excel
     * Code: Hiepnh
     * Date: 25/7/2023
     */
    importFromExcel({ option, companyID, parentID, dataImport, userID, ctx }) {
        // console.log({option, companyID, parentID, userID})
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(parentID))
                    return resolve({ error: true, message: 'parentID_invalid', status: 400 })

                const dataImportJSON = JSON.parse(dataImport);
                let index = 0;
                let errorNumber = 0;
                
                for (const data of dataImportJSON) {
                    if(index > 0){
                        // console.log('===================')
                        // console.log(data)
                        let dataInsert = {
                            companyID, 
                            userID, 
                            parentID, 
                            accountID: data?.__EMPTY_14,
                            customerID: data?.__EMPTY_15, 
                            contractID: data?.__EMPTY_16, 
                            name: data?.__EMPTY_1,
                            note: data?.__EMPTY_7, 
                            date: data?.__EMPTY_13, 
                            income: data?.__EMPTY_5, 
                            expense: data?.__EMPTY_6
                        }
                        // console.log(dataInsert)

                        let infoAfterInsert = await this.insert(dataInsert);
                        // console.log(infoAfterInsert)
                        if(infoAfterInsert.error){
                            errorNumber++;
                        }
                    }
                    index ++;
                }

                if(errorNumber != 0)
                    return resolve({ error: true, message: "import field" });

                // Update timeImportExcel trick reload việc con
                // await FIN__CASH_PAYMENT_COLL.findByIdAndUpdate(parentID, { $set: { timeImportExcel: new Date() }}, { new: true });

                return resolve({ error: false, message: "import success" });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;