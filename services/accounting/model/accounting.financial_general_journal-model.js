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
const ITEM_ACCOUNT_COLL                                 = require('../../item/database/item.account-coll')
const ITEM__FUNDA_COLL            			            = require('../../item/database/item.funda-coll')
const ITEM__CONTACT_COLL            			        = require('../../item/database/item.contact-coll')
const FINANCIAL_GENERAL_JOURNAL_COLL                    = require('../database/accounting.financial_general_journal-coll')
const BUDGET_WORK_COLL                                  = require('../../budget/database/budget.work-coll')

/**
 * MODELS
 */

class Model extends BaseModel {
    constructor() {
        super(FINANCIAL_GENERAL_JOURNAL_COLL);
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
                if(!checkObjectIDs([authorID, companyID, fundaID, voucherID, customerDebit, customerCredit]))
                // if(!checkObjectIDs([authorID, companyID, fundaID, voucherID, debit, credit, customerDebit, customerCredit]))
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
                    // console.log('1. Update Budget Work==========================>>>>>')
                    // console.log(infoBudgetWork)

                    if(infoBudgetWork){
                        let infoBudgetGroup = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_GROUP_UPDATE_VALUE}`, {
                            option: 2,
                            groupID: `${budgetGroup}`
                        })

                        // console.log('2. Update Budget Group==========================>>>>>')
                        // console.log(infoBudgetGroup)

                        if(infoBudgetGroup){
                            let infoBudgetItem = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_ITEM_UPDATE_VALUE}`, {
                                option: 2,
                                itemID: `${budgetItem}`
                            })

                            // console.log('3. Update Budget Item==========================>>>>>')
                            // console.log(infoBudgetItem)

                            if(infoBudgetItem){
                                let infoBudget = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_UPDATE_VALUE}`, {
                                    option: 2,
                                    budgetID: `${budget}`
                                })

                                // console.log('4. Update Budget==========================>>>>>')
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
        return new Promise(async (resolve) => {
            try {
                /**
                 * VALIDATE DỮ LIỆU
                 * 1-Kiểm tra ObjectID
                 * 2-Kiểm tra Danh mục thuộc công ty
                 * 3-Kiểm tra khác
                 */
                 if(!checkObjectIDs([authorID, journalID, customerDebit, customerCredit]))
                //  if(!checkObjectIDs([authorID, journalID, debit, credit, customerDebit, customerCredit]))
                    return { error: true, message: 'params_invalid', status: 400 };

                // Kiểm tra để đảm bảo "debit, credit, customerDebit, customerCredit, goods, warehouse, contract" thuộc companyID

                // Kiểm tra check trùng tài khoản đối ứng
                if(debit && credit && debit.toString() === credit.toString())
                    return resolve({ error: false, message: 'debit/credit is duplicated', status: 400 });

                let infoJournal = await FINANCIAL_GENERAL_JOURNAL_COLL.findById(journalID)
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

                let infoAfterUpdate = await FINANCIAL_GENERAL_JOURNAL_COLL.findByIdAndUpdate(journalID, dataUpdate , { new: true });
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
     * Name: Info
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

                let info = await FINANCIAL_GENERAL_JOURNAL_COLL.findById(journalID)
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
    getList({ option, companyID, fundaID, projectID, contractID, accountID, contactID, voucherID, budgetID, budgetItemID, budgetGroupID, budgetWorkID, fromDate, toDate, forward, cancel, userID, contacts,
        keyword, limit = 50, lastestID, select, populates = {}, sortKey }) {
            // console.log({ option, companyID, fundaID, projectID, contractID, accountID, contactID, voucherID, budgetID, budgetItemID, budgetGroupID, budgetWorkID, fromDate, toDate, userID, keyword, limit, lastestID, select, populates, contacts})
        return new Promise(async (resolve) => {
            try {
                if (limit > 50) {
                    limit = 50
                } else {
                    limit = +limit;
                }

                let sortBy;
                // let conditionObj = { forward: 0, cancel: 0 };
                let conditionObj = {  };
                // let keys = ['createAt__1', '_id__1'];
                let keys = ['date__1'];

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
                 * BA
                 */
                if(fromDate && toDate){
                    conditionObj.date = {
                        $gte: moment(fromDate).toDate(),
                        $lte: moment(toDate).toDate(),
                    }
                }

                if(fromDate && toDate){
                    conditionObj.date = {
                        $gte: moment(fromDate).toDate(),
                        $lte: moment(toDate).toDate(),
                    }
                }

                /**
                 * THEO PHIẾU/HỢP ĐỒNG/DỰ ÁN/ĐƠN VỊ/CÔNG TY
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

                /**
                 * THEO NGÂN SÁCH
                 */
                if(checkObjectIDs(budgetID)){
                    conditionObj = {
                        budget: budgetID
                    }
                }
                if(checkObjectIDs(budgetItemID)){
                    conditionObj = {
                        budgetItem: budgetItemID
                    }
                }
                if(checkObjectIDs(budgetGroupID)){
                    conditionObj = {
                        budgetGroup: budgetGroupID
                    }
                }
                if(checkObjectIDs(budgetWorkID)){
                    conditionObj = {
                        budgetWork: budgetWorkID
                    }
                }

                /**
                 * THEO TÀI KHOẢN
                 */
                if(checkObjectIDs(accountID) && checkObjectIDs(contactID)){
                    // console.log('=================1111111111111111')
                    let arrObjectID = []
                    let infoAccount = await ITEM_ACCOUNT_COLL.findById(accountID)
                    if(!infoAccount)
                        return resolve({ error: true, message: 'cannot_get_account_info' })

                    arrObjectID.push(accountID)
                    arrObjectID = [...arrObjectID,...infoAccount.nestedChilds]
                    // console.log(arrObjectID)

                    conditionObj.$or = [
                        { debit: { $in: arrObjectID }, customerDebit: contactID },
                        { credit: { $in: arrObjectID }, customerCredit: contactID },
                    ]
                    // console.log(conditionObj)

                }else{
                    if(checkObjectIDs(accountID)){
                        // console.log('=================22222222222222222')
                        let arrObjectID = []
                        let infoAccount = await ITEM_ACCOUNT_COLL.findById(accountID)
                        if(!infoAccount)
                            return resolve({ error: true, message: 'cannot_get_account_info' })
    
                        arrObjectID.push(accountID)
                        arrObjectID = [...arrObjectID,...infoAccount.nestedChilds]
                        // console.log(arrObjectID)
    
                        conditionObj.$or = [
                            { debit:   {
                                $in: arrObjectID
                            }},
                            { credit:  {
                                $in: arrObjectID
                            } }
                        ]
                        // console.log(conditionObj)
                    }

                    if(checkObjectIDs(contactID)){
                        // console.log('=================333333333333333333333')
                        conditionObj.$or = [
                            { customerDebit: contactID },
                            { customerCredit: contactID },
                        ]
                        // console.log(conditionObj)
                    }
                }

                // Báo cáo theo Tài khoản-Mã khách
                if(option == 1){
                    // console.log('=================1111111111111111')
                    let arrObjectID = []
                    let infoAccount = await ITEM_ACCOUNT_COLL.findById(accountID)
                    if(!infoAccount)
                        return resolve({ error: true, message: 'cannot_get_account_info' })

                    arrObjectID.push(accountID)
                    arrObjectID = [...arrObjectID,...infoAccount.nestedChilds]
                    // console.log(arrObjectID)

                    if(contacts){
                        conditionObj.$or = [
                            { debit: { $in: arrObjectID }, customerDebit: {$in: contacts.map(item=>ObjectID(item._id))} },
                            { credit: { $in: arrObjectID }, customerCredit: {$in: contacts.map(item=>ObjectID(item._id))} },
                        ]
                    }else{
                        conditionObj.$or = [
                            { debit: { $in: arrObjectID }, customerDebit: null },
                            { credit: { $in: arrObjectID }, customerCredit: null },
                        ]
                    }
                    // console.log(conditionObj)
                }
         
                /**
                 * THEO KEYWORD
                 */
                if (keyword) {
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                }
                let conditionObjOrg = { ...conditionObj };
                // console.log(conditionObj)

                // PHÂN TRANG KIỂU MỚI
                if (lastestID && checkObjectIDs(lastestID)) {
                    let infoData = await FINANCIAL_GENERAL_JOURNAL_COLL.findById(lastestID);
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

                let infoDataAfterGet = await FINANCIAL_GENERAL_JOURNAL_COLL.find(conditionObj)
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

                let totalRecord = await FINANCIAL_GENERAL_JOURNAL_COLL.count(conditionObjOrg);
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
                let listDataUp = await FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
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
                let listDataDown = await FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
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

    /**
     * Name  : getListByProperty
     * Author: Hiepnh
     * Date  : 10/4/2022
     */
    getListByProperty({ option, optionAccount, optionTerm, arrAccNames, arrAccIDs, arrCompanyIDs, arrFundaIDs, name, companyID, fundaID, projectID, contractID, contactID, fromDate, toDate, userID, contacts }) {
        // console.log({option, optionAccount, arrAccNames, arrAccIDs, arrCompanyIDs, arrFundaIDs, name, companyID, fundaID, projectID, contractID, contactID, fromDate, toDate, userID, contacts})
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * Kỳ tra cứu: 30/5/2020 (fromDate) - 15/6/2020 (toDate) - Incurred
                 * Đầu kỳ: Tính từ 1/1 của năm tới ngày [fromDate]
                 * Cuối kỳ: Tính từ [fromDate] tới [toDate]
                 * 1. Lấy mảng chứa Tài khoản + Con cháu
                 * 2. Lấy năm của ngày đầu kỳ
                 * 3. Đầu kỳ = Kết chuyển cuối kỳ năm trước (31/12/2019) + Đầu năm nay đến ngày đầu kỳ (1/1/2020-30/5/2020)
                 */
                let conditionObj = {}, conditionDebitObj = {}, conditionCreditObj = {}, conditionProject = {}
                let conditionGroup = {}, conditionGroupDebit = {}, conditionGroupCredit = {}
                let conditionMatch = {}, conditionMatchO = {}, conditionMatchOF = {}, conditionMatchFT = {}, conditionMatchIn = {}
                let listDataO, listDataOF, listDataFT, listDataIn
                let conditionObjYear = {}
                let conditionPopulate = {}
                let sortBy = {"amount": -1}

                let arrObjectID = [], listAccounts = []
                // Truyền theo ID tài khoản
                if(!optionAccount){
                    // console.log('============zzzzzzzzzzzz1111111111111111111111')
                    listAccounts = await ITEM_ACCOUNT_COLL.find({_id: {$in: arrAccIDs}})
                    // .select('name description nestedChilds')
                    if(listAccounts){
                        for(const item of listAccounts){
                            arrObjectID.push(item._id)
                            arrObjectID = [...arrObjectID,...item.nestedChilds]
                        }
                    }
                }else{
                    // Theo tên tài khoản
                    if(optionAccount == 1){
                        if(!arrCompanyIDs){
                            // console.log('============zzzzzzzzzzzz2222222222222222222')
                            listAccounts = await ITEM_ACCOUNT_COLL.find({ company: companyID, name: {$in: arrAccNames} })
                            // .select('name description nestedChilds')
                            if(listAccounts){
                                for(const item of listAccounts){
                                    arrObjectID.push(item._id)
                                    arrObjectID = [...arrObjectID,...item.nestedChilds]
                                }
                            }
                        }else{
                            // console.log('============zzzzzzzzzzzz333333333333333333')
                            listAccounts = await ITEM_ACCOUNT_COLL.find({ company: {$in: arrCompanyIDs}, name: {$in: arrAccNames} })
                            // .select('name description nestedChilds')
                            if(listAccounts){
                                for(const item of listAccounts){
                                    arrObjectID.push(item._id)
                                    arrObjectID = [...arrObjectID,...item.nestedChilds]
                                }
                            }
                        }
                    }

                    // Theo toàn bộ tài khoản của công ty
                    if(optionAccount == 2){
                        listAccounts = await ITEM_ACCOUNT_COLL.find({ company: companyID })
                            // .select('name description nestedChilds')
                        if(listAccounts){
                            for(const item of listAccounts){
                                arrObjectID.push(item._id)
                                arrObjectID = [...arrObjectID,...item.nestedChilds]
                            }
                        }
                    }
                }

                if(contractID && checkObjectIDs(contractID)){
                    // console.log('============1')
                    conditionDebitObj.contract = ObjectID(contractID)
                    conditionCreditObj.contract = ObjectID(contractID)
                }else{
                    if (projectID && checkObjectIDs(projectID)) {
                        // console.log('============2')
                        conditionDebitObj.project = ObjectID(projectID)
                        conditionCreditObj.project = ObjectID(projectID)
                    }else{
                        if(fundaID && checkObjectIDs(fundaID)){
                            // console.log('============3')
                            conditionDebitObj.funda = ObjectID(fundaID)
                            conditionCreditObj.funda = ObjectID(fundaID)
                        }else{
                            if(arrCompanyIDs && checkObjectIDs(arrCompanyIDs)){
                                // console.log('============4')
                                conditionDebitObj.company = {$in: arrCompanyIDs.map( item => ObjectID(item))}
                                conditionCreditObj.company =  {$in: arrCompanyIDs.map( item => ObjectID(item))}
                            }else{
                                // console.log('============5')
                                conditionDebitObj.company = ObjectID(companyID)
                                conditionCreditObj.company = ObjectID(companyID)
                            }
                        }
                    }
                }
                // console.log(conditionDebitObj)
                // console.log(conditionCreditObj)

                /**
                 * Lấy năm của ngày đầu kỳ
                 */
                let year = moment(fromDate).toDate().getFullYear()
                let firstDayOfYear = `${Number(year)}-01-01T00:00:00.000Z`

                conditionProject = {
                    forward: '$forward',
                    cancel: '$cancel',
                    year : {$year : "$date"},
                    amount: 1,
                }

                // Kết chuyển cuối kỳ năm trước sang đầu kỳ năm sau (Original)
                conditionMatchO = {
                    "forward": 1,
                    "cancel": 0,
                    "year": Number(year)
                }

                // Từ đầu năm tới ngày đầu kỳ
                conditionMatchOF = {
                    "forward": 0,
                    "cancel": 0,
                    "date": {
                        $gte: moment(firstDayOfYear).toDate(),
                        $lt: moment(fromDate).toDate(), // $lte (<=), $lt (<)
                    },
                }

                // Từ đầu kỳ tới cuối kỳ
                conditionMatchFT = {
                    "forward": 0,
                    "cancel": 0,
                    "date": {
                        $gte: moment(fromDate).toDate(),
                        $lte: moment(toDate).toDate(),
                    }
                }

                // Từ đầu năm tới đầu kỳ***
                conditionMatchIn = {
                    "forward": 0,
                    "cancel": 0,
                    "date": {
                        $gte: moment(firstDayOfYear).toDate(), // Tính từ firstDayOfYear | fromDate
                        $lte: moment(toDate).toDate(),
                    },
                }

                // Gom nhóm theo công ty -> Báo cáo tổng hợp mô hình công ty thành viên
                if(!arrCompanyIDs){
                    conditionGroup =  {
                        _id: { },
                        amount: { $sum: "$amount" }
                    }
                }else{
                    conditionGroup =  {
                        _id: { company: "$company" },
                        amount: { $sum: "$amount" }
                    }
                }

                // 1 tài khoản - Không mã khách
                if(!option){
                    conditionProject = {
                        year : {$year : "$date"},
                        forward: '$forward',
                        cancel: '$cancel',
                        date: 1,
                        amount: 1
                    }

                    conditionDebitObj.debit = {
                        $in: arrObjectID
                    }
                    conditionCreditObj.credit = {
                        $in: arrObjectID
                    }

                    conditionGroupDebit = {
                        _id: { },
                        amount: { $sum: "$amount" }
                    }
                    conditionGroupCredit = {
                        _id: { },
                        amount: { $sum: "$amount" }
                    }
                }else{
                    // Nhiều tài khoản - Không mã khách
                    if(option == 1){
                        conditionProject = {
                            year : {$year : "$date"},
                            forward: '$forward',
                            cancel: '$cancel',
                            date: 1,
                            amount: 1,
                            debit: 1,
                            credit: 1
                        }

                        conditionDebitObj.debit = {
                            $in: arrObjectID
                        }
                        conditionCreditObj.credit = {
                            $in: arrObjectID
                        }

                        conditionGroupDebit = {
                            _id: { account: "$debit" },
                            amount: { $sum: "$amount" }
                        }
                        conditionGroupCredit = {
                            _id: { account: "$credit" },
                            amount: { $sum: "$amount" }
                        }
                    }

                    /**
                     * BÁO CÁO TÀI KHOẢN - MÃ KHÁCH => ÁP DỤNG MOBILE
                     * 1 tài khoản - Nhiều mã khách
                     */
                    if(option == 2){
                        conditionProject = {
                            year : {$year : "$date"},
                            forward: '$forward',
                            cancel: '$cancel',
                            date: 1,
                            amount: 1,
                            customerDebit: 1,
                            customerCredit: 1,
                            debit: 1,
                            credit: 1
                        }

                        // conditionGroupDebit = {
                        //     _id: { contact: "$customerDebit", account: "$debit" },
                        //     amount: { $sum: "$amount" }
                        // }
                        // conditionGroupCredit = {
                        //     _id: { contact: "$customerCredit", account: "$credit" },
                        //     amount: { $sum: "$amount" }
                        // }

                        conditionDebitObj.debit = {
                            $in: arrObjectID
                        }
                        conditionCreditObj.credit = {
                            $in: arrObjectID
                        }

                        conditionGroupDebit = {
                            _id: { contact: "$customerDebit" },
                            amount: { $sum: "$amount" }
                        }
                        conditionGroupCredit = {
                            _id: { contact: "$customerCredit" },
                            amount: { $sum: "$amount" }
                        }
                    }

                    // Báo cáo theo Tài khoản - Mã khách (quan hệ 1-1)
                    if(option == 3){
                        conditionDebitObj.debit = {
                            $in: arrObjectID
                        }
                        conditionCreditObj.credit = {
                            $in: arrObjectID
                        }

                        conditionDebitObj.customerDebit = ObjectID(contactID)
                        conditionCreditObj.customerCredit = ObjectID(contactID)
        
                        conditionProject = {
                            year : {$year : "$date"},
                            forward: '$forward',
                            cancel: '$cancel',
                            date: 1,
                            amount: 1,
                            customerDebit: 1,
                            customerCredit: 1,
                            debit: 1,
                            credit: 1
                        }

                        conditionGroupDebit = {
                            _id: { },
                            amount: { $sum: "$amount" }
                        }
                        
                        conditionGroupCredit = {
                            _id: {  },
                            amount: { $sum: "$amount" }
                        }
                    }

                    
                    // Báo cáo Bảng cân đối tài khoản
                    if(option == 4){
                        conditionProject = {
                            year : {$year : "$date"},
                            forward: '$forward',
                            cancel: '$cancel',
                            date: 1,
                            amount: 1,
                            debit: 1,
                            credit: 1
                        }

                        conditionGroupDebit = {
                            _id: { account: "$debit" },
                            amount: { $sum: "$amount" }
                        }
                        conditionGroupCredit = {
                            _id: { account: "$credit" },
                            amount: { $sum: "$amount" }
                        }
                    }

                    // Công nợ userID đang truy cập
                    if(option == 5){
                        conditionDebitObj.debit = {
                            $in: arrObjectID
                        }
                        conditionCreditObj.credit = {
                            $in: arrObjectID
                        }

                        if(contacts){
                            conditionDebitObj.customerDebit = {$in: contacts.map(item=>ObjectID(item._id))}
                            conditionCreditObj.customerCredit = {$in: contacts.map(item=>ObjectID(item._id))}
                        }else{
                            conditionDebitObj.customerDebit = null
                            conditionCreditObj.customerCredit = null
                        }
                    
                        conditionProject = {
                            company: 1,
                            year : {$year : "$date"},
                            forward: '$forward',
                            cancel: '$cancel',
                            date: 1,
                            amount: 1,
                            debit: 1,
                            credit: 1,
                            customerDebit: 1,
                            customerCredit: 1,
                        }

                        conditionGroupDebit = {
                            _id: { company: "$company", account: "$debit" },
                            amount: { $sum: "$amount" }
                        }
                        conditionGroupCredit = {
                            _id: { company: "$company", account: "$credit" },
                            amount: { $sum: "$amount" }
                        }
                    }

                    // Công nợ userID đang truy cập
                    if(option == 6){
                        conditionDebitObj.debit = {
                            $in: arrObjectID
                        }
                        conditionCreditObj.credit = {
                            $in: arrObjectID
                        }

                        if(contacts){
                            conditionDebitObj.customerDebit = {$in: contacts.map(item=>ObjectID(item._id))}
                            conditionCreditObj.customerCredit = {$in: contacts.map(item=>ObjectID(item._id))}
                        }else{
                            conditionDebitObj.customerDebit = {$in: []}
                            conditionCreditObj.customerCredit = {$in: []}
                        }
        
                        conditionProject = {
                            year : {$year : "$date"},
                            forward: '$forward',
                            cancel: '$cancel',
                            date: 1,
                            amount: 1,
                            customerDebit: 1,
                            customerCredit: 1,
                            debit: 1,
                            credit: 1
                        }

                        conditionGroupDebit = {
                            _id: { },
                            amount: { $sum: "$amount" }
                        }
                        
                        conditionGroupCredit = {
                            _id: {  },
                            amount: { $sum: "$amount" }
                        }
                    }
                    // console.log(conditionDebitObj)
                    // console.log(conditionCreditObj)
                    // console.log(conditionProject)
                    // console.log(conditionMatchO)
                    // console.log(conditionMatchIn)

                    // Tổng hợp Tài khoản-Tháng
                    if(option == 7){
                        conditionProject = {
                            year : { $year : "$date" },
                            month : { $month : "$date" },
                            forward: '$forward',
                            cancel: '$cancel',
                            date: 1,
                            amount: 1
                        }
    
                        conditionDebitObj.debit = {
                            $in: arrObjectID
                        }
                        conditionCreditObj.credit = {
                            $in: arrObjectID
                        }
    
                        conditionGroupDebit = {
                            _id: { month: "$month" },
                            amount: { $sum: "$amount" }
                        }
                        conditionGroupCredit = {
                            _id: { month: "$month" },
                            amount: { $sum: "$amount" }
                        }
                    }
                }

                /**
                 * DATA KẾT CHUYỂN/ĐẦU NĂM
                 */
                listDataO = await FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionDebitObj
                                },
                                {
                                    $project: conditionProject
                                },
                                {
                                    $match: conditionMatchO
                                },
                                {
                                    $group: conditionGroupDebit
                                }
                            ],
                            _credit:[
                                {
                                    $match: conditionCreditObj
                                },
                                {
                                    $project: conditionProject
                                },
                                {
                                    $match: conditionMatchO
                                },
                                {
                                    $group: conditionGroupCredit
                                }
                            ],

                        }
                    }
                ])
                // console.log('=========MỐC ĐẦU NĂM=========')
                // console.log(listDataO)
                // console.log({_____No: listDataO[0]._debit})
                // console.log({_____Co: listDataO[0]._credit})

                if(!optionTerm){
                    listDataIn = await FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                        {
                            $facet: {
                                _debit:[
                                    {
                                        $match: conditionDebitObj
                                    },
                                    {
                                        $project: conditionProject
                                    },
                                    {
                                        $match: conditionMatchIn
                                    },
                                    {
                                        $group: conditionGroupDebit
                                    }
                                ],
    
                                _credit:[
                                    {
                                        $match: conditionCreditObj
                                    },
                                    {
                                        $project: conditionProject
                                    },
                                    {
                                        $match: conditionMatchIn
                                    },
                                    {
                                        $group: conditionGroupCredit
                                    }
                                ],
    
                            }
                        }
                    ])
                    // console.log('=========ĐẦU NĂM-CUỐI KỲ=========')
                    // console.log({_____No: listDataIn[0]._debit})
                    // console.log({_____Co: listDataIn[0]._credit})
                }else{
                    // console.log(conditionDebitObj)
                    // console.log(conditionCreditObj)
                    // console.log(conditionProject)
                    listDataOF = await FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                        {
                            $facet: {
                                _debit:[
                                    {
                                        $match: conditionDebitObj
                                    },
                                    {
                                        $project: conditionProject
                                    },
                                    {
                                        $match: conditionMatchOF
                                    },
                                    {
                                        $group: conditionGroupDebit
                                    }
                                ],
                                _credit:[
                                    {
                                        $match: conditionCreditObj
                                    },
                                    {
                                        $project: conditionProject
                                    },
                                    {
                                        $match: conditionMatchOF
                                    },
    
                                    {
                                        $group: conditionGroupCredit
                                    }
                                ],
    
                            }
                        }
                    ])
                    // console.log('=========ĐẦU NĂM - ĐẦU KỲ=========')
                    // console.log({_____No: listDataOF[0]._debit})
                    // console.log({_____Co: listDataOF[0]._credit})

                    listDataFT = await FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                        {
                            $facet: {
                                _debit:[
                                    {
                                        $match: conditionDebitObj
                                    },
                                    {
                                        $project: conditionProject
                                    },
                                    {
                                        $match: conditionMatchFT
                                    },
                                    {
                                        $group: conditionGroupDebit
                                    }
                                ],
                                _credit:[
                                    {
                                        $match: conditionCreditObj
                                    },
                                    {
                                        $project: conditionProject
                                    },
                                    {
                                        $match: conditionMatchFT
                                    },
    
                                    {
                                        $group: conditionGroupCredit
                                    }
                                ],
    
                            }
                        }
                    ])
                    // console.log('=========ĐẦU KỲ - CUỐI KỲ=========')
                    // console.log({_____No: listDataFT[0]._debit})
                    // console.log({_____Co: listDataFT[0]._credit})
                }

                if(!option){
                    let totalDebitO = 0, totalCreditO = 0, totalDebitOF = 0, totalCreditOF = 0, totalDebitFT = 0, totalCreditFT = 0
    
                    // Số liệu đầu năm
                    if(listDataO[0]._debit.length > 0){
                        totalDebitO = listDataO[0]._debit[0].amount
                    }
                    if(listDataO[0]._credit.length > 0){
                        totalCreditO = listDataO[0]._credit[0].amount
                    }

                    // Số liệu từ đầu năm tới đầu kỳ đang xét
                    if(listDataOF[0]._debit.length > 0){
                        totalDebitOF = listDataOF[0]._debit[0].amount
                    }
                    if(listDataOF[0]._credit.length > 0){
                        totalCreditOF = listDataOF[0]._credit[0].amount
                    }

                    // Số liệu đầu kỳ tới cuối kỳ đang xét
                    if(listDataFT[0]._debit.length > 0){
                        totalDebitFT = listDataFT[0]._debit[0].amount
                    }
                    if(listDataFT[0]._credit.length > 0){
                        totalCreditFT = listDataFT[0]._credit[0].amount
                    }

                    return resolve({ error: false, data: { 
                        listAccounts,
                        totalDebitO,
                        totalCreditO,
                        totalDebitOF,
                        totalCreditOF,
                        totalDebitFT,
                        totalCreditFT,
                    }})
                }else{
                     // Nhiều tài khoản - Không mã khách
                    if(option == 1){
                        return resolve({ error: false, data: { 
                            listAccounts,
                            debitO: listDataO[0]._debit,
                            creditO: listDataO[0]._credit,
                            debitIn: listDataIn[0]._debit,
                            creditIn: listDataIn[0]._credit,
                        }})
                    }

                    /**
                     * BÁO CÁO TÀI KHOẢN - MÃ KHÁCH => ÁP DỤNG MOBILE
                     */
                    if(option == 2){
                        let arrCustomers = []
                        if(listDataO[0]._debit.length > 0){
                            arrCustomers = [...arrCustomers,...listDataO[0]._debit.map(item=>item._id.contact)]
                        }
                        if(listDataO[0]._credit.length > 0){
                            arrCustomers = [...arrCustomers,...listDataO[0]._credit.map(item=>item._id.contact)]
                        }
                        if(listDataIn[0]._debit.length > 0){
                            arrCustomers = [...arrCustomers,...listDataIn[0]._debit.map(item=>item._id.contact)]
                        }
                        if(listDataIn[0]._credit.length > 0){
                            arrCustomers = [...arrCustomers,...listDataIn[0]._credit.map(item=>item._id.contact)]
                        }

                        let listCustomers = await ITEM__CONTACT_COLL.find({_id: {$in: arrCustomers}}).select('name phone address image')
                        // console.log(listCustomers)

                        /**
                         * XỬ LÝ LOGIC DATA
                         */
                        let arrDebitO = [], arrCreditO = [], arrDebitIn = [], arrCreditIn = []

                        listDataO[0]._debit.forEach(element=>{
                            let key = element._id.contact;
                            if (!Array.isArray(arrDebitO[key])) {
                                arrDebitO[key] = [];
                            }
                            arrDebitO[key].push(element)
                        })

                        listDataO[0]._credit.forEach(element=>{
                            let key = element._id.contact;
                            if (!Array.isArray(arrCreditO[key])) {
                                arrCreditO[key] = [];
                            }
                            arrCreditO[key].push(element)
                        })

                        listDataIn[0]._debit.forEach(element=>{
                            let key = element._id.contact;
                            if (!Array.isArray(arrDebitIn[key])) {
                                arrDebitIn[key] = [];
                            }
                            arrDebitIn[key].push(element)
                        })

                        listDataIn[0]._credit.forEach(element=>{
                            let key = element._id.contact;
                            if (!Array.isArray(arrCreditIn[key])) {
                                arrCreditIn[key] = [];
                            }
                            arrCreditIn[key].push(element)
                        })
                        // console.log(arrDebitO)
                        // console.log(arrCreditO)
                        // console.log(arrDebitIn)
                        // console.log(arrCreditIn)

                        for(var i=0; i < listCustomers.length; i++ ){
                            listCustomers[i].total = 0
                        }
                        // console.log(listCustomers)

                        listCustomers.forEach((item, index)=>{
                            if(arrDebitO[item._id]){
                                listCustomers[index].total = listCustomers[index].total + Number(arrDebitO[item._id][0].amount)
                            }
                            if(arrCreditO[item._id]){
                                listCustomers[index].total = listCustomers[index].total - Number(arrCreditO[item._id][0].amount)
                            }
                            if(arrDebitIn[item._id]){
                                listCustomers[index].total = listCustomers[index].total + Number(arrDebitIn[item._id][0].amount)
                            }
                            if(arrCreditIn[item._id]){
                                listCustomers[index].total = listCustomers[index].total - Number(arrCreditIn[item._id][0].amount)
                            }
                        })

                        // return resolve({ error: false, data: { 
                        //     listAccounts,
                        //     listCustomers,
                        //     debitO: listDataO[0]._debit,
                        //     creditO: listDataO[0]._credit,
                        //     debitIn: listDataIn[0]._debit,
                        //     creditIn: listDataIn[0]._credit
                        // }})
                        return resolve({ error: false, data: listCustomers })
                    }

                    // Báo cáo theo Tài khoản - Mã khách (quan hệ 1-1)
                    if(option == 3){
                        return resolve({ error: false, data: { 
                            listAccounts,
                            debitO: listDataO[0]._debit,
                            creditO: listDataO[0]._credit,
                            debitOF: listDataOF[0]._debit,
                            creditOF: listDataOF[0]._credit,
                            debitFT: listDataFT[0]._debit,
                            creditFT: listDataFT[0]._credit,
                        }})
                    }

                    // Báo cáo Bảng cân đối tài khoản
                    if(option == 4){
                        return resolve({ error: false, data: { 
                            debitO: listDataO[0]._debit,
                            creditO: listDataO[0]._credit,
                            debitOF: listDataOF[0]._debit,
                            creditOF: listDataOF[0]._credit,
                            debitFT: listDataFT[0]._debit,
                            creditFT: listDataFT[0]._credit,
                        }})
                    }

                    // Công nợ userID đang truy cập
                    if(option == 5){
                        let listAccountNew = []

                        listAccounts.forEach(item => {
                            item.total = 0

                            if([1,2,6,8].includes(Number(item.name.charAt(0)))){
                                listDataO[0]._debit.forEach(element=>{
                                    let key = element._id.account;
                                    if(item?._id.toString() === key.toString() || item?.nestedChilds.includes(key)){
                                        item.total = item.total + Number(element.amount)
                                    }
                                })
        
                                listDataO[0]._credit.forEach(element=>{
                                    let key = element._id.account;
                                    if(item?._id.toString() === key.toString() || item?.nestedChilds.includes(key)){
                                        item.total = item.total - Number(element.amount)
                                    }
                                })
        
                                listDataIn[0]._debit.forEach(element=>{
                                    let key = element._id.account;
                                    if(item?._id.toString() === key.toString() || item?.nestedChilds.includes(key)){
                                        item.total = item.total + Number(element.amount)
                                    }
                                })
        
                                listDataIn[0]._credit.forEach(element=>{
                                    let key = element._id.account;
                                    if(item?._id.toString() === key.toString() || item?.nestedChilds.includes(key)){
                                        item.total = item.total - Number(element.amount)
                                    }
                                })
                            }else{
                                listDataO[0]._debit.forEach(element=>{
                                    let key = element._id.account;
                                    if(item?._id.toString() === key.toString() || item?.nestedChilds.includes(key)){
                                        item.total = item.total - Number(element.amount)
                                    }
                                })
        
                                listDataO[0]._credit.forEach(element=>{
                                    let key = element._id.account;
                                    if(item?._id.toString() === key.toString() || item?.nestedChilds.includes(key)){
                                        item.total = item.total + Number(element.amount)
                                    }
                                })
        
                                listDataIn[0]._debit.forEach(element=>{
                                    let key = element._id.account;
                                    if(item?._id.toString() === key.toString() || item?.nestedChilds.includes(key)){
                                        item.total = item.total - Number(element.amount)
                                    }
                                })
        
                                listDataIn[0]._credit.forEach(element=>{
                                    let key = element._id.account;
                                    if(item?._id.toString() === key.toString() || item?.nestedChilds.includes(key)){
                                        item.total = item.total + Number(element.amount)
                                    }
                                })
                            }

                            listAccountNew.push({_id: item._id, name: item.name, description: item.description, total: item.total})
                        })
                        
                        // console.log(arrDebitO)
                        // console.log(arrCreditO)
                        // console.log(arrDebitIn)
                        // console.log(arrCreditIn)

                        return resolve({ error: false, data: { 
                            listAccountNew,
                            // listAccounts,
                            // debitO: listDataO[0]._debit,
                            // creditO: listDataO[0]._credit,
                            // debitIn: listDataIn[0]._debit,
                            // creditIn: listDataIn[0]._credit,
                        }})
                    }

                    // Chi tiết công nợ theo tài khoản-mã khách
                    if(option == 6){
                        return resolve({ error: false, data: { 
                            listAccounts,
                            debitO: listDataO[0]._debit,
                            creditO: listDataO[0]._credit,
                            debitOF: listDataOF[0]._debit,
                            creditOF: listDataOF[0]._credit,
                            debitFT: listDataFT[0]._debit,
                            creditFT: listDataFT[0]._credit,
                        }})
                    }

                      // Tổng hợp Tài khoản-Tháng
                    if(option == 7){
                        return resolve({ error: false, data: { 
                            listAccounts,
                            debitO: listDataO[0]._debit,
                            creditO: listDataO[0]._credit,
                            debitIn: listDataIn[0]._debit,
                            creditIn: listDataIn[0]._credit,
                        }})
                    }
                }
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }


}

exports.MODEL = new Model