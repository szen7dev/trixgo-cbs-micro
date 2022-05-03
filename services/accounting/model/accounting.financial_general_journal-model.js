"use strict";

/**
 * EXTERNAL PACKAGE
 */
 const ObjectID                                         = require('mongoose').Types.ObjectId;
 const moment                                           = require('moment');

/**
 * CONSTANTS
 */
 const { CF_DOMAIN_SERVICES } 	                        = require('../../gateway/helper/domain.constant');
 const { VOUCHER_TYPES }                                = require('../config/accounting.financial_config');
 const { CF_ACTIONS_ITEM }                              = require('../../item/helper/item.actions-constant');
 const { CF_ACTIONS_BUDGET } 		                    = require('../../budget/helper/budget.actions-constant');

/**
 * TOOLS
 */
 const BaseModel                                        = require('../../../tools/db/base_model')
 const { checkObjectIDs, _isValid, IsJsonString }       = require('../../../tools/utils/utils')
 const { RANGE_BASE_PAGINATION_V2 }                     = require('../../../tools/cursor_base/playground/index')
 const { KEY_ERROR }                                    = require('../../../tools/keys/index')

/**
 * COLLECTIONS
 */
 const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL       = require('../database/accounting.financial_general_journal-coll');
 const BUDGET_WORK_COLL                                 = require('../../budget/database/budget.work-coll'); // Kiểm tra fix lại, không Import trực tiếp

/**
 * MODELS
 */

class Model extends BaseModel {
    constructor() {
        super(ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL);
    }

    /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    insert({ authorID, companyID, fundaID, voucherID,
        date, forward, forwardIs, returning, advancePayment, cancel, vat, type, source, orderNew, pricePolicy,
        debit, credit, customerDebit, customerCredit, updown,
        quantity, unitprice, amount, fcuExRate, fcuAmount,
        goods, warehouse, contract, project, budgetWork,
        note, 
        ctx 
    }) { 
        const that = this
        return new Promise(async (resolve) => {
            try {
                /**
                 * VALIDATE DỮ LIỆU
                 * 1-Kiểm tra ObjectID
                 * 2-Kiểm tra Danh mục thuộc công ty
                 * 3-Kiểm tra khác
                 */
                if(!checkObjectIDs([authorID, companyID, fundaID, voucherID, debit, credit, customerDebit,
                    customerCredit]))
                    return { error: true, message: 'params_invalid', status: 400 };

                // Kiểm tra để đảm bảo "debit, credit, customerDebit, customerCredit, goods, warehouse, contract" thuộc companyID

                // Kiểm tra check trùng tài khoản đối ứng
                if(debit && credit && debit.toString() === credit.toString())
                    return resolve({ error: false, message: 'debit/credit is duplicated', status: 400 });

                // Lấy thông tin của hợp đồng => Gán kèm dự án
                
                // TẠO CHI TIẾT CHỨNG TỪ
                const dataInsert = {
                    userCreate: authorID, 
                    company: companyID, 
                    funda: fundaID, 
                    voucher: voucherID,
                    date, forward, forwardIs, returning, advancePayment, cancel, vat, type, source, orderNew, pricePolicy,
                    debit, credit, customerDebit, customerCredit, updown,
                    quantity, unitprice, amount, fcuExRate, fcuAmount,
                    goods, warehouse, contract, project, budgetWork,
                    note, 
                }

                /**
                 * GÁN MÃ NGÂN SÁCH
                 */
                let budget, budgetProject, budgetContract, budgetItem, budgetGroup
                if(budgetWork && _isValid(budgetWork)){
                    let infoWork = await BUDGET_WORK_COLL.findById(budgetWork)

                    if(infoWork){
                        if(infoWork.budget){
                            budget = infoWork.budget;
                            dataInsert.budget = infoWork.budget;
                        }
                        if(infoWork.project){
                            budgetProject = infoWork.project;
                            dataInsert.budgetProject = infoWork.project;
                        }
                        if(infoWork.contract){
                            budgetContract = infoWork.contract;
                            dataInsert.budgetContract = infoWork.contract;
                        }
                        if(infoWork.item){
                            budgetItem = infoWork.item;
                            dataInsert.budgetItem = infoWork.item;
                        }
                        if(infoWork.group){
                            budgetGroup = infoWork.group;
                            dataInsert.budgetGroup = infoWork.group;
                        }
                    }
                }

                let infoAfterInsert = await that.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm bút toán thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

                /**
                 * CẬP NHẬT LẠI THÔNG TIN NGÂN SÁCH
                 * (CẦN PHẢI XÓA ĐI KHI UPDATE journals SANG JOB MỚI)
                 * 1. Cập nhật ngân sách công việc
                 * 2. Cập nhật ngân sách Nhóm
                 * 3. Cập nhật ngân sách Hạng mục
                 * 4. Cập nhật ngân sách Tổng
                 */
                if(budgetWork && _isValid(budgetWork)){
                    let infoBudgetWork = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_WORK_UPDATE_VALUE}`, {
                        option: 2,
                        workID: `${budgetWork}`
                    })
                    console.log('1. Update Budget Work==========================>>>>>')
                    // console.log(infoBudgetWork)

                    if(infoBudgetWork){
                        let infoBudgetGroup = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_GROUP_UPDATE_VALUE}`, {
                            option: 2,
                            groupID: `${budgetGroup}`
                        })

                        console.log('2. Update Budget Group==========================>>>>>')
                        // console.log(infoBudgetGroup)

                        if(infoBudgetGroup){
                            let infoBudgetItem = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_ITEM_UPDATE_VALUE}`, {
                                option: 2,
                                itemID: `${budgetItem}`
                            })

                            console.log('3. Update Budget Item==========================>>>>>')
                            // console.log(infoBudgetItem)

                            if(infoBudgetItem){
                                let infoBudget = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_UPDATE_VALUE}`, {
                                    option: 2,
                                    budgetID: `${budget}`
                                })

                                console.log('4. Update Budget==========================>>>>>')
                                // console.log(infoBudget)
                            }
                        }
                    }
                }

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Update 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    update({ 
        authorID, journalID,
        date, forward, forwardIs, returning, advancePayment, cancel, vat, type, source, orderNew, pricePolicy,
        debit, credit, customerDebit, customerCredit, updown,
        quantity, unitprice, amount, fcuExRate, fcuAmount,
        goods, warehouse, contract, project, budgetWork,
        note, 
        ctx
     }) {
        const that = this
        return new Promise(async (resolve) => {
            try {
                /**
                 * VALIDATE DỮ LIỆU
                 * 1-Kiểm tra ObjectID
                 * 2-Kiểm tra Danh mục thuộc công ty
                 * 3-Kiểm tra khác
                 */
                 if(!checkObjectIDs([authorID, journalID, debit, credit, customerDebit,
                    customerCredit]))
                    return { error: true, message: 'params_invalid', status: 400 };

                // Kiểm tra để đảm bảo "debit, credit, customerDebit, customerCredit, goods, warehouse, contract" thuộc companyID

                // Kiểm tra check trùng tài khoản đối ứng
                if(debit && credit && debit.toString() === credit.toString())
                    return resolve({ error: false, message: 'debit/credit is duplicated', status: 400 });

                let infoJournal = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findById(journalID)
                if(!infoJournal)
                    return resolve({ error: false, message: 'finacial_journal_exit', status: 400 })

                let voucherID = infoJournal.voucher
                
                /**
                 * CẬP NHẬT CHI TIẾT CHỨNG TỪ
                 */
                const dataUpdate = {
                    userUpdate: authorID, 
                    date, forward, forwardIs, returning, advancePayment, cancel, vat, type, source, orderNew, pricePolicy,
                    debit, credit, customerDebit, customerCredit, updown,
                    quantity, unitprice, amount, fcuExRate, fcuAmount,
                    goods, warehouse, contract, project, budgetWork,
                    note, 
                }

                /**
                 * LẤY THÔNG TIN NGÂN SÁCH CŨ
                 */
                let budgetOld, budgetProjectOld, budgetContractOld, budgetItemOld, budgetGroupOld, budgetWorkOld
                if(infoJournal.budgetWork){
                    budgetOld = infoJournal.budget
                    budgetProjectOld = infoJournal.budgetProject
                    budgetContractOld = infoJournal.budgetContract
                    budgetItemOld = infoJournal.budgetItem
                    budgetGroupOld = infoJournal.budgetGroup
                    budgetWorkOld = infoJournal.budgetWork
                }   

                /**
                 * GÁN MÃ NGÂN SÁCH: MỚI VÀ CŨ
                 */
                let budget, budgetProject, budgetContract, budgetItem, budgetGroup
                if(budgetWork && _isValid(budgetWork)){
                    let infoWork = await BUDGET_WORK_COLL.findById(budgetWork)

                    if(infoWork){
                        if(infoWork.budget){
                            budget = infoWork.budget;
                            dataUpdate.budget = infoWork.budget;
                        }
                        if(infoWork.project){
                            budgetProject = infoWork.project;
                            dataUpdate.budgetProject = infoWork.project;
                        }
                        if(infoWork.contract){
                            budgetContract = infoWork.contract;
                            dataUpdate.budgetContract = infoWork.contract;
                        }
                        if(infoWork.item){
                            budgetItem = infoWork.item;
                            dataUpdate.budgetItem = infoWork.item;
                        }
                        if(infoWork.group){
                            budgetGroup = infoWork.group;
                            dataUpdate.budgetGroup = infoWork.group;
                        }
                    }
                }

                let infoAfterUpdate = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findByIdAndUpdate(journalID, dataUpdate , { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "cannot_update", status: 400 });

                /**
                 * CẬP NHẬT LẠI THÔNG TIN NGÂN SÁCH
                 * (CẦN PHẢI XÓA ĐI KHI UPDATE journals SANG JOB MỚI)
                 * 1. Cập nhật ngân sách công việc
                 * 2. Cập nhật ngân sách Nhóm
                 * 3. Cập nhật ngân sách Hạng mục
                 * 4. Cập nhật ngân sách Tổng
                 */
                // Ngân sách mới
                if(budgetWork && _isValid(budgetWork)){
                    console.log('===================CẬP NHẬT NGÂN SÁCH MỚI===================')
                    console.log({ budgetWork, budgetGroup, budgetItem, budget })

                    let infoBudgetWork = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_WORK_UPDATE_VALUE}`, {
                        option: 2,
                        workID: `${budgetWork}`
                    })
                    console.log('1. Update Budget Work==========================>>>>>')
                    // console.log(infoBudgetWork)

                    if(infoBudgetWork){
                        let infoBudgetGroup = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_GROUP_UPDATE_VALUE}`, {
                            option: 2,
                            groupID: `${budgetGroup}`
                        })

                        console.log('2. Update Budget Group==========================>>>>>')
                        // console.log(infoBudgetGroup)

                        if(infoBudgetGroup){
                            let infoBudgetItem = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_ITEM_UPDATE_VALUE}`, {
                                option: 2,
                                itemID: `${budgetItem}`
                            })

                            console.log('3. Update Budget Item==========================>>>>>')
                            // console.log(infoBudgetItem)

                            if(infoBudgetItem){
                                let infoBudget = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_UPDATE_VALUE}`, {
                                    option: 2,
                                    budgetID: `${budget}`
                                })

                                console.log('4. Update Budget==========================>>>>>')
                                // console.log(infoBudget)
                            }
                        }
                    }
                }

                // Ngân sách cũ
                if(budgetWorkOld && _isValid(budgetWorkOld)){
                    console.log('===================CẬP NHẬT NGÂN SÁCH CŨ===================')
                    console.log({ budgetWorkOld, budgetGroupOld, budgetItemOld, budgetOld })
                    let infoBudgetWorkOld = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_WORK_UPDATE_VALUE}`, {
                        option: 2,
                        workID: `${budgetWorkOld}`
                    })
                    console.log('1. Update Budget Work Old==========================>>>>>')
                    // console.log(infoBudgetWorkOld)

                    if(infoBudgetWorkOld){
                        let infoBudgetGroupOld = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_GROUP_UPDATE_VALUE}`, {
                            option: 2,
                            groupID: `${budgetGroupOld}`
                        })

                        console.log('2. Update Budget Group Old==========================>>>>>')
                        // console.log(infoBudgetGroupOld)

                        if(infoBudgetGroupOld){
                            let infoBudgetItemOld = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_ITEM_UPDATE_VALUE}`, {
                                option: 2,
                                itemID: `${budgetItemOld}`
                            })

                            console.log('3. Update Budget Item Old==========================>>>>>')
                            // console.log(infoBudgetItemOld)

                            if(infoBudgetItemOld){
                                let infoBudget = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_UPDATE_VALUE}`, {
                                    option: 2,
                                    budgetID: `${budgetOld}`
                                })

                                console.log('4. Update Budget Old==========================>>>>>')
                                // console.log(infoBudgetItemOld)
                            }
                        }
                    }
                }

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Remove
     * Author: Hiepnh
     * Date: 9/4/2022
     */

    /**
     * Name: Get info 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getInfo({ journalID, select, populates }) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(journalID))
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

                let info = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findById(journalID)
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
     * Name  : Get list 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getList({ companyID, fundaID, projectID, contractID, voucherID, userID,
        keyword, limit = 50, lastestID, select, populates = {}, sortKey }) {
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
                // Chỉ hiển thị sổ quỹ mà user là member
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
                if (checkObjectIDs(voucherID)) {
                    conditionObj.voucher = voucherID
                } else {
                    if (checkObjectIDs(contractID)) {
                        conditionObj.contract = contractID
                    }else{
                        if (checkObjectIDs(projectID)) {
                            conditionObj.project = projectID
                        }else{
                            if (checkObjectIDs(fundaID)) {
                                conditionObj.funda = fundaID
                            }else{
                                conditionObj.company = companyID
                            }
                        }
                    }
                }

                if (keyword) {
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                }
                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
                if (lastestID && checkObjectIDs(lastestID)) {
                    let infoData = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findById(lastestID);
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

                let infoDataAfterGet = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.find(conditionObj)
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

                let totalRecord = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.count(conditionObjOrg);
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
    
    /**
     * Name  : Tổng hợp ngân sách đã thực hiện 
     * Author: Hiepnh
     * Date  : 10/4/2022 
     */
    calImpleBudget({ 
        workID, groupID, itemID, budgetID, userID, ctx
    }){ 
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Tổng hợp ngân sách đã thực hiện của công việc-budgetWork
                 * 2-Tổng hợp ngân sách đã thực hiện của nhóm-budgetGroup
                 * 3-Tổng hợp ngân sách đã thực hiện của hạng mục-budgetItem
                 * 4-Tổng hợp ngân sách đã thực hiện của ngân sách-budget
                 */
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataBudget = {
                    quantity: 0,
                    amount: 0
                }

                let conditionObjUp = { updown: 1 }
                let conditionObjDown = { updown: -1 }

                if(workID){
                    conditionObjUp.budgetWork = ObjectID(workID)
                    conditionObjDown.budgetWork = ObjectID(workID)
                }
                if(groupID){
                    conditionObjUp.budgetGroup = ObjectID(groupID)
                    conditionObjDown.budgetGroup = ObjectID(groupID)
                }
                if(itemID){
                    conditionObjUp.budgetItem = ObjectID(itemID)
                    conditionObjDown.budgetItem = ObjectID(itemID)
                }
                if(budgetID){
                    conditionObjUp.budget = ObjectID(budgetID)
                    conditionObjDown.budget = ObjectID(budgetID)
                }
                
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
             
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                // Dữ liệu tăng ngân sách thực hiện
                let listDataUp = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $match: conditionObjUp
                    }, 
                    {
                        $group: {
                            _id: { },
                            quantity: { $sum: "$quantity" },
                            amount: { $sum: "$amount" },
                        }
                    }, 
                ])

                // Dữ liệu giảm ngân sách thực hiện
                let listDataDown = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $match: conditionObjDown
                    }, 
                    {
                        $group: {
                            _id: { },
                            quantity: { $sum: "$quantity" },
                            amount: { $sum: "$amount" },
                        }
                    }, 
                ])
                // console.log(conditionObjUp)
                // console.log(conditionObjDown)
                // console.log(listDataUp)
                // console.log(listDataDown)

                // Tổng hợp giá trị tăng, giảm
                if(listDataUp && listDataUp.length){
                    dataBudget.quantity = Number(dataBudget.quantity) + Number(listDataUp[0].quantity)
                    dataBudget.amount = Number(dataBudget.amount) + Number(listDataUp[0].amount)
                }

                if(listDataDown && listDataDown.length){
                    dataBudget.quantity = Number(dataBudget.quantity) - Number(listDataDown[0].quantity)
                    dataBudget.amount = Number(dataBudget.amount) - Number(listDataDown[0].amount)
                }

                return resolve({ error: false, data: dataBudget, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;