"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const ObjectID                                  = require('mongoose').Types.ObjectId;
const moment                                = require('moment');
const { checkObjectIDs, _isValid, IsJsonString, _getLevelMaxInRecursive, _constructForAny, _getLevelMaxInRecursiveByCompany
}                                           = require('../../../tools/utils/utils');

/**
 * DOMAIN AND ACTIONS
*/

/**
 * CONSTANTS
*/
const { CF_DOMAIN_SERVICES } 	        = require('../../gateway/helper/domain.constant');
const { VOUCHER_TYPES }                 = require('../config/accounting.financial_config');
const { CF_ACTIONS_ITEM }               = require('../../item/helper/item.actions-constant');
const { CF_ACTIONS_BUDGET } 		    = require('../../budget/helper/budget.actions-constant');

/**
 * TOOLS
*/
const connection  = require('../helper/transaction-demo/connectionMongo');
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');

/**
 * COLLECTIONS
*/
// const ACCOUNTING__FINANCIAL_VOUCHER_COLL        = require('../database/accounting.financial_voucher-coll');
// const FUNDA_COLL                                = require('../../item/database/item.funda-coll');
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL     = require('../database/accounting.financial_general_journal-coll');

/**
 * MODELS
*/
// const ACCOUNTING__FINANCIAL_VOUCHER     = require('../model/accounting.financial_voucher').MODEL;


class Model extends BaseModel {

    constructor() {
        super(require('../database/accounting.financial_general_journal-coll'))
    }
    // -------------------- start function check params for add, update, remove, search -----------
    checkInputInputJournal({ authorID }){
        if(!_isValid(authorID))
            return { error: true, message: 'authorID_invalid', status: 400 };
    }

    checkInputInsertFull({ amount, voucher, companyID, authorID, fundaID, customerDebit, customerCredit }){
        // if(Number.isNaN(Number(amount)) || !_isValid(journalID) || !_isValid(authorID)){
        this.checkInputInputJournal({  authorID });
       
        if(!_isValid(authorID))
            return { error: true, message: 'authorID_invalid', status: 400 };
            
        if(!_isValid(voucher))
            return { error: true, message: 'voucher_invalid', status: 400 };

        if(!_isValid(companyID))
            return { error: true, message: 'companyID_invalid', status: 400 };

        if(!_isValid(fundaID))
            return { error: true, message: 'fundaID_invalid', status: 400 };

        if(!_isValid(customerDebit))
            return { error: true, message: 'customerDebit_invalid', status: 400 };
        
        if(!_isValid(customerCredit))
            return { error: true, message: 'customerCredit_invalid', status: 400 };

        return { error: false }
    }

    checkInputUpdate({  authorID, journalID }){
        // if(Number.isNaN(Number(amount)) || !_isValid(journalID) || !_isValid(authorID)){
        this.checkInputInputJournal({  authorID });
        if(!_isValid(journalID))
            return { error: true, message: 'journalID_invalid', status: 400 };

        return { error: false }
    }

 
    // --------------------   end function check params for add, update, remove, search -----------

    // -------------------- start function collect data for add, update, search -----------------

    // -------------------- end function check params for add, update, remove, search -----------
    collectDataForInsert({
        companyID, fundaID, authorID, voucher, customerDebit,
        customerCredit, quantityCalculate, unitpriceCalculate,
        amountCalculate, fcuExRate, fcuAmountCalculate,
        cash, vat, note, date, subtype,
        updown, advancePayment, debit, credit, contract, warehouse, 
        budget, budgetProject, budgetContract, budgetItem, budgetGroup, budgetWork
    }){
        let dataInsert = {
            company: companyID, 
            funda: fundaID, 
            userCreate: authorID, 
            voucher,
            customerDebit,
            customerCredit,
            quantity: quantityCalculate,
            unitprice: unitpriceCalculate,
            amount: Number(quantityCalculate) *  Number(unitpriceCalculate),
            fcuExRate: Number(fcuExRate || 0),
            fcuAmount: fcuAmountCalculate,
            cash,
            vat,
            note,
            date,
            subtype,
            updown: (!isNaN(updown) && [1,-1].includes(Number(updown))) ? Number(updown) : 1,
            advancePayment: (!isNaN(advancePayment) && [0,1].includes(Number(advancePayment))) ? Number(advancePayment) : 0,
            budget, budgetProject, budgetContract, budgetItem, budgetGroup, budgetWork
        }

        if(debit && _isValid(debit)){
            dataInsert.debit = debit
        }

        if(credit && _isValid(credit)){
            dataInsert.credit = credit
        }

        if(goods && _isValid(goods) && warehouse && _isValid(warehouse)){
            dataInsert.goods = goods
            dataInsert.warehouse = warehouse
        }

        //_________Kiểm tra xem có Hợp đồng hay không
        if(contract && _isValid(contract)) {
            dataInsert.contract = contract
        }

        return dataInsert;
    }

    async collectDataForUpdate({
        authorID, customerDebit,
        customerCredit, quantityCalculate, unitpriceCalculate,
        amountCalculate, fcuExRate, fcuAmountCalculate,
        note, project,
        updown, advancePayment, debit, credit,
        goods, contract, job, journalID, amount, warehouse, group
    }){
        // TẠO CHI TIẾT CHỨNG TỪ
        let dataUpdate = {
            userUpdate: authorID, 
            quantity: quantityCalculate,
            unitprice: unitpriceCalculate,
            fcuExRate: Number(fcuExRate),
            fcuAmount: fcuAmountCalculate,
            note,
            updown: (!isNaN(updown) && [1,-1].includes(Number(updown))) ? Number(updown) : 1,
            advancePayment: (!isNaN(advancePayment) && [0,1].includes(Number(advancePayment))) ? Number(advancePayment) : 0,
            customerDebit,
            customerCredit,
        }
        if(unitpriceCalculate && quantityCalculate){
            dataUpdate.amount = Number(quantityCalculate) *  Number(unitpriceCalculate)
        }
        //_________Kiểm tra xem có tài khoản nợ/có không
        //_________Nếu không thì lấy giá trị null
        if(debit && _isValid(debit)){
            dataUpdate.debit = debit
        }else{
            dataUpdate.debit = null;
        }
        if(credit && _isValid(credit)){
            dataUpdate.credit = credit
        }else{
            dataUpdate.credit = null;
        }

        //_________Kiểm tra xem có hàng hóa/kho hay không
        //_________Nếu không  có thì lấy theo mã khách trên phiếu
        //_________Chỉ insert khi có cả thông tin goods và warehouse  
        if(goods && _isValid(goods) && warehouse && _isValid(warehouse)){
            dataUpdate.goods = goods
            dataUpdate.warehouse = warehouse
        }else{
            dataUpdate.goods = null;
            dataUpdate.warehouse = null;
        }
        
        //_________Kiểm tra xem có Hợp đồng hay không
        if(contract && _isValid(contract)) {
            dataUpdate.contract = contract
        }else{
            dataUpdate.contract = null;
        }

        //_________Kiểm tra xem có Dự án hay không ________
        if(project && _isValid(project)) {
            dataUpdate.project = project
        }else{
            dataUpdate.project = null;
        }

        //_________Ứng dụng quản lý chi phí ________
        if(job && _isValid(job) && group && _isValid(group)) {
            dataUpdate.job = job
            dataUpdate.group = group

            //_________Xóa khoải khoản mục phí cũ ________
            // await BUDGET_JOB_COLL.findByIdAndUpdate(infoJournal.job, {
            //     $pull: { journals: journalID } 
            // }, { new: true });

        }else{
            dataUpdate.job = null;
            dataUpdate.group = null;

            //_________Xóa khoải khoản mục phí cũ ________
            let infoJournal = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findById(journalID);
            
            // await BUDGET_JOB_COLL.findByIdAndUpdate(infoJournal.job, {
            //     $pull: { journals: journalID }
            // }, { new: true });
        }
        return dataUpdate;
    }

    /**
     * Name  : Tạo chi tiết chứng từ 
     * Author: Hiepnh
     * Date  : 10/4/2022 
     */
    insertFull({ 
        authorID, companyID, fundaID, voucher, debit, credit, customerDebit,
        customerCredit, goods, quantity, amount, fcuExRate, contract, cash, vat, note, updown, advancePayment, 
        date, subtype, warehouse, unitprice, budget, budgetProject, budgetContract, budgetItem, budgetGroup, budgetWork
    }) {
        console.log({ 
            authorID, companyID, fundaID, voucher, debit, credit, customerDebit,
        customerCredit, goods, quantity, amount, fcuExRate, contract, cash, vat, note, updown, advancePayment, 
        date, subtype, warehouse, unitprice, budget, budgetProject, budgetContract, budgetItem, budgetGroup, budgetWork
        })

        const that = this;
        return new Promise(async (resolve) => {
            console.log('Budget1==========================>>>>>')

            let responseResultInsert = {};

            const session = await connection.startSession(); // có poolconnect --> relase() cấu hình trong file: connectionMongo.js. Đang tạm đóng lại để đỡ tốn tài nguyên
            await session.startTransaction(); 
            
            try {
                console.log('Budget2==========================>>>>>')

                const checkInput = this.checkInputInsertFull({  voucher, companyID, authorID, fundaID, customerDebit, customerCredit });
                if(checkInput.error)
                    return resolve(checkInput)

                // Kiểm tra để đảm bảo "debit, credit, customerDebit, customerCredit, goods, warehouse, contract" thuộc companyID

                // Kiểm tra check trùng tài khoản đối ứng
                if(debit && credit && debit.toString() === credit.toString())
                    return resolve({ error: false, message: 'debit/credit is duplicated', status: 400 });

                // Fix: nếu amount == 0 -> result = NaN (insert into db throw error)
                const quantityCalculate       = Number(Number(quantity).toFixed(3)) || 0;
                const unitpriceCalculate      = Number(Number(unitprice).toFixed(3)) || 0;
                const amountCalculate         = Number(Number(amount).toFixed(3)) || 0;
                const fcuAmountCalculate      = Number(Number((amount || 0)/(fcuExRate || 1)).toFixed(0)) || 0;
                
                // TẠO CHI TIẾT CHỨNG TỪ
                const dataInsert = this.collectDataForInsert({
                    companyID, fundaID, authorID, voucher, customerDebit,
                    customerCredit, quantityCalculate, unitpriceCalculate,
                    amountCalculate, fcuExRate, fcuAmountCalculate,
                    cash, vat, note, date, subtype,
                    updown, advancePayment, debit, credit,
                    goods, contract, warehouse, budget, budgetProject, budgetContract, budgetItem, budgetGroup, budgetWork
                })
               
                // console.log(dataInsert)
                let infoAfterInsert = await that.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "ERROR [ACCOUNTING_JOURNAL][ADD_JOURNAL] cannot_insert", status: 400 });
                
                //Todos
                //___________CẬP NHẬT LẠI THÔNG TIN PHIẾU
                // Cập nhật: amount, fcuAmount
                const resultUpdate = await ACCOUNTING__FINANCIAL_VOUCHER.updateWithChangingJournal({ voucherId: voucher, journalAmount : infoAfterInsert.amount , journalFcuAmount: fcuAmountCalculate })
                // await session.commitTransaction();
                //---- Không cần check kĩ --> sẽ đưa qua trasaction//
                if(resultUpdate.error){
                    responseResultInsert = { error: false, data: infoAfterInsert, status: 400 }
                    await session.abortTransaction();
                }else{
                    responseResultInsert = { error: false, data: infoAfterInsert, status: 200}
                }

                /**
                 * CẬP NHẬT LẠI THÔNG TIN NGÂN SÁCH
                 * (CẦN PHẢI XÓA ĐI KHI UPDATE journals SANG JOB MỚI)
                 * 1. Cập nhật ngân sách công việc
                 * 2. Cập nhật ngân sách Nhóm
                 * 3. Cập nhật ngân sách Hạng mục
                 * 4. Cập nhật ngân sách Tổng
                 */
                if(budgetWorkID && _isValid(budgetWorkID)){
                    const infoBudgetWork = await ctx.call(`${CF_DOMAIN_SERVICES.BUDGET}.${CF_ACTIONS_BUDGET.BUDGET_WORK_UPDATE_VALUE}`, {
                        workID: budgetWorkID
                    })
                    console.log('Budget==========================>>>>>')
                    console.log(infoBudgetWork)
                }

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOURNAL][ADD_JOURNAL]: ${error}`);

                // Roll back lại nếu hành động thất bại
                await session.abortTransaction();

                responseResultInsert = { error: true, message: `error jounal services: ${error.message}`, status: 400 };
                // return resolve({ error: true, message: error.message });
            }

            finally {
                session.endSession();
                const resultC = await connection.close();
                return resolve(responseResultInsert);
            }
        })
    }

    update({
        journalID, debit, credit, customerDebit,
        customerCredit, goods, quantity, 
        amount, fcuExRate, note, updown, advancePayment,
        contract, project, job, authorID, warehouse, group, unitprice
    }){
        return new Promise(async (resolve) => {
            let responseResultUpdate = {};
            const session = await connection.startSession();
            await session.startTransaction();
            try {
                const info = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findById(journalID);
                if (!info) 
                    return resolve({ error: true, message: 'cannot_get_info', status: 400 });

                const checkInputUpdate = this.checkInputUpdate({ amount, journalID, authorID })
                if(checkInputUpdate.error)
                    return resolve(checkInputUpdate);


                // Kiểm tra check trùng tài khoản đối ứng
                if(debit && credit && debit.toString() === credit.toString())
                    return resolve({ error: false, message: 'debit/credit is duplicated', status: 400 });
            
                const infoJournal = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findById(journalID);
                if(!infoJournal)
                    return resolve({ error: false, message: 'finacial_journal_exit', status: 400 });

                // Fix: Nếu amount == 0 -> result = NaN (insert into db throw error)
                const quantityCalculate       = Number(Number(quantity).toFixed(3)) || 0;
                const unitpriceCalculate      = Number(Number(unitprice).toFixed(3)) || 0;
                const amountCalculate         = Number(Number(amount).toFixed(3)) || 0;
                const fcuAmountCalculate      = Number(Number(amount/fcuExRate).toFixed(0)) || 0;
                const dataUpdate = await this.collectDataForUpdate({
                    authorID, customerDebit, customerCredit,
                    quantityCalculate, unitpriceCalculate,
                    amountCalculate, fcuExRate, fcuAmountCalculate,
                    note, project, updown, advancePayment, debit, credit,
                    goods, contract, job, journalID, amount, warehouse, group
                });
                console.log({dataUpdate})

                const infoAfterUpdate = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findByIdAndUpdate(journalID, dataUpdate , { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "cannot_update", status: 400 });
                
                const journalAmount = Number(dataUpdate.amount ||0)  -  Number(infoJournal.amount || 0) || 0;
                const journalFcuAmount = Number(dataUpdate.fcuAmount || 0) - Number(infoJournal.fcuAmount ||0) || 0;

                // step 1: update --> voucher info 
                // step 2: transaction (after...)
                const resultUpdateVoucher = await ACCOUNTING__FINANCIAL_VOUCHER.updateWithChangingJournal({  voucherId: `${infoAfterUpdate.voucher}`,journalAmount, journalFcuAmount })
                console.log({resultUpdateVoucher,journalAmount, journalFcuAmount})
                if(resultUpdateVoucher.error){
                    responseResultUpdate = { error: false, data: infoAfterUpdate, status: 400 }
                    await session.abortTransaction();
                }else{
                    responseResultUpdate = { error: false, data: infoAfterUpdate, status: 200 }
                }
                //___________UPDATE VÀO KHOẢN MỤC PHÍ MỚI
                if(job && _isValid(job)){
                    // await BUDGET_JOB_COLL.findByIdAndUpdate(job, {
                    //     $addToSet: { journals: journalID } 
                    // }, { new: true });
                }
            
            } catch (error) {
                await session.abortTransaction();
                console.log(`ERROR [ACCOUNTING_JOURNAL][UPDATE_JOURNAL]: ${error}`);
                responseResultUpdate = { error: true, message: error.message, status: 400 };
            }
            finally {
                session.endSession();
                await connection.close();
                return resolve(responseResultUpdate);
            }
        })
    }

    //_________Xóa chi tiết chứng từ
    // Author: HiepNH
    remove({ journalID }){
        return new Promise(async (resolve) => {
            let responseResultRemove = {};
            const session = await connection.startSession();
            await session.startTransaction();
            try {
                if( !ObjectID.isValid(journalID))
                    return resolve({ error: true, message: 'param_invalid', status: 400 });

                let info = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findById(journalID);
                if (!info) 
                    return resolve({ error: true, message: 'cannot_get_info', status: 400 });

                //_________Xóa chi tiết
                let infoAfterRemove = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findByIdAndDelete(journalID);
                if(!infoAfterRemove)
                    return resolve({ error: true, message: "cannot_remove", status: 400 });

                //Cập nhật thông tin trong phiếu
                const journalAmount =   0 - (Number(infoAfterRemove.amount || 0) || 0);
                const journalFcuAmount = 0  - (Number(infoAfterRemove.fcuAmount || 0) || 0);

                // step 1: update --> voucher info 
                // step 2: transaction (after...)
                const resultUpdateVoucher = await ACCOUNTING__FINANCIAL_VOUCHER.updateWithChangingJournal({  voucherId: `${infoAfterRemove.voucher}`,journalAmount, journalFcuAmount })
                if(resultUpdateVoucher.error){
                    responseResultRemove = { error: true, data: infoAfterRemove, message: resultUpdateVoucher.message, status: 400 }
                    await session.abortTransaction();
                }else{
                    responseResultRemove = { error: false, data: infoAfterRemove, message: "Remove success", status: 200 }
                }
                //_________Xóa trong Ứng dụng quản lý chi phí
                if(info.job && _isValid(info.job)){
                    await BUDGET_JOB_COLL.findByIdAndUpdate(info.job, {
                        $pull: { journals: journalID } 
                    }, { new: true });
                }
            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOURNAL][REMOVE_JOURNAL]: ${error}`);
                return resolve({ error: true, message: error.message, status: 400 })
            }
            finally {
                session.endSession();
                await connection.close();
                return resolve(responseResultRemove);
            }
        })
    } 

    // Chi tiết một tài khoản
    getInfo({ journalID }) {
        return new Promise(async resolve => {
            try {
                if(!_isValid(journalID))
                    return { error: true, message: 'journalID_invalid', status: 400 };
                
                const infoJournal = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findById(journalID)
                .populate({
                    path: 'files',
                    populate: {
                        path: 'author'
                    }
                })
                .populate({
                    path: 'customerCredit customerDebit contact  contract  warehouse ipc',
                    select:'_id  name'
                })
                // .populate({
                //     path: 'goods',
                //     select:'_id name unit'
                // })
                .populate({
                    path: 'debit credit ',
                    select:'_id description sign'
                });
                if(!infoJournal)
                    return resolve({ error: true, message: 'cant_get_info_journal', status: 400 })
                    
                return resolve({ error: false, data: infoJournal, status: 200 })
            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOUNRAL][getInfo]: ${error} `);
                return resolve({ error: true, message: error.message, status: 400 })
            }
        });
    }

    /**
     * Name  : Tổng hợp ngân sách đã thực hiện 
     * Author: Hiepnh
     * Date  : 10/4/2022 
     */
    calImpleBudget({ 
        option, workID, groupID, itemID, budgetID, userID, ctx
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

    //_________SỐ DƯ ĐẦU KỲ CỦA 1 TÀI KHOẢN (OK)
    // Tính năng sử dụng: Sổ chi tiết tài khoản
    // Author: HiepNH
    getOpeningBalanceOfCompany({ ctx, companyID, fundaID, contractID, accountID, fromDate }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                /**
                 * Business Analyst (BA)
                 * 1. Lấy mảng chứa tài khoản và các con cháu của nó
                 * 2. Lấy năm của ngày đầu kỳ
                 * 3. Lấy số liệu đầu kỳ = Số liệu của phiếu kết chuyển cuối kỳ năm trước (31/12/2019) + Số liệu đầu năm nay cho đến ngày đầu kỳ đang xét (1/1/2020-13/5/2020)
                 */

                //_________Get nestedArray of account
                // let arrObjectID = await that.getListNestedItem({accountID});
                let arrObjectID = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{ accountID, isNestedOfCompany: true }); 
               
                arrObjectID = arrObjectID.data || []
                //ACCOUNT_GET_LIST_NESTED
                // const arrObjectID =  [ ObjectID("5efc0e3ebf8da144aecfe585") ] //arrAccountObjectID.data.map(item=>ObjectID(item))

                let conditionObj1;
                let conditionObj2;
                
                if(!fundaID){
                    if(!contractID){
                        conditionObj1 = {
                            company: ObjectID(companyID),
                            debit: {
                                $in: arrObjectID
                            }
                        }
                        conditionObj2 = {
                            company: companyID,
                            credit: {
                                $in: arrObjectID
                            }
                        }
                    }else{
                        conditionObj1 = {
                            company: ObjectID(companyID),
                            contract: ObjectID(contractID),
                            debit: {
                                $in: arrObjectID
                            }
                        }
                        conditionObj2 = {
                            company: ObjectID(companyID),
                            contract: ObjectID(contractID),
                            credit: {
                                $in: arrObjectID
                            }
                        }
                    }
                }else{
                    if(!contractID){
                        conditionObj1 = {
                            funda: ObjectID(fundaID),
                            debit: {
                                $in: arrObjectID
                            }
                        }
                        conditionObj2 = {
                            funda: ObjectID(fundaID),
                            credit: {
                                $in: arrObjectID
                            }
                        }
                    }else{
                        conditionObj1 = {
                            funda: ObjectID(fundaID),
                            contract: ObjectID(contractID),
                            debit: {
                                $in: arrObjectID
                            }
                        }
                        conditionObj2 = {
                            funda: ObjectID(fundaID),
                            contract: ObjectID(contractID),
                            credit: {
                                $in: arrObjectID
                            }
                        }
                    }
                }
                //____________Lấy năm của ngày đầu kỳ
                let year = moment(fromDate).toDate().getFullYear() //!!!!Xem xét sao không lấy năm của ngày bắt đầu (sẽ áp dụng được cho kỳ kéo dài nhiều năm)
                let firstDayOfYear = `${Number(year)}-01-01T00:00:00.000Z`;
                //____________Số liệu của các phiếu kết chuyển cuối kỳ năm trước sang đầu kỳ năm sau (31/12/2019-1/1/2020)

                let listDataS = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionObj1
                                }, 
                                {
                                    $project : { 
                                        year : {$year : "$date"},
                                        forward: '$forward',
                                        cancel: '$cancel',
                                        amount: 1,
                                    }
                                },
                                {
                                    $match: {
                                        "year": Number(year), //Number(year-1) THEO CẤU HÌNH CŨ
                                        "forward": 1,
                                        "cancel": 0
                                    }
                                }, 
                                {
                                    $group: {
                                        _id: { },
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }                    
                            ],
                            
                            _credit:[
                                {
                                    $match: conditionObj2
                                }, 
                                {
                                    $project : { 
                                        year : {$year : "$date"},
                                        forward: '$forward',
                                        cancel: '$cancel',
                                        amount: 1,
                                    }
                                },
                                {
                                    $match: {
                                        "year": Number(year), //Number(year-1) THEO CẤU HÌNH CŨ
                                        "forward": 1,
                                        "cancel": 0
                                    }
                                },
 
                                {
                                    $group: {
                                        _id: { },
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }   
                            ],            
                            
                        }
                    } 
                ]);

                //____________Số liệu của các phiếu từ ngày 1/1/2020 tới fromDate và không phải là phiếu kết chuyển
                let listData = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionObj1
                                }, 
                                {
                                    $project : { 
                                        date : '$date',
                                        forward: '$forward',
                                        cancel: '$cancel',
                                        amount: 1,
                                    }
                                },
                                {
                                    $match: {
                                        "forward": 0,
                                        "cancel": 0,
                                        "date": { 
                                            $gte: moment(firstDayOfYear).toDate(),
                                            $lt: moment(fromDate).toDate(), // $lte (<=), $lt (<)
                                        },
                                    }
                                }, 
                                {
                                    $group: {
                                        _id: { },
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }                    
                            ],
                            
                            _credit:[
                                {
                                    $match: conditionObj2
                                }, 
                                {
                                    $match: {
                                        "forward": 0,
                                        "cancel": 0,
                                        "date": { 
                                            $gte: moment(firstDayOfYear).toDate(),
                                            $lt: moment(fromDate).toDate(), // $lte (<=), $lt (<)
                                        },
                                    }
                                }, 
                                {
                                    $project : { 
                                        date : '$date',
                                        forward: '$forward',
                                        cancel: '$cancel',
                                        amount: 1,
                                    }
                                },
                                {
                                    $group: {
                                        _id: { },
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }   
                            ],            
                            
                        }
                    } 
                ]);
                
                let openingBalanceS = listDataS[0], openingBalance = listData[0]
                let totalOpeningDebitS = 0, totalOpeningCreditS = 0, totalOpeningDebit = 0, totalOpeningCredit = 0;

                if(openingBalance._debit.length > 0){
                    totalOpeningDebit = openingBalance._debit[0].amountPrice;
                }
                if(openingBalance._credit.length > 0){
                    totalOpeningCredit = openingBalance._credit[0].amountPrice;
                }
                if(openingBalanceS._debit.length > 0){
                    totalOpeningDebitS = openingBalanceS._debit[0].amountPrice;
                }
                if(openingBalanceS._credit.length > 0){
                    totalOpeningCreditS = openingBalanceS._credit[0].amountPrice;
                }
                return resolve({ error: false, data: (Number(totalOpeningDebit + totalOpeningDebitS - totalOpeningCreditS - totalOpeningCredit)) });

            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOUNRAL][getOpeningBalanceOfCompany]: ${error} `);
                return resolve({ error: true, message: error.message });
            }
        });
    } 

    //_________CHI TIẾT TÀI KHOẢN CHỮ T (OK)
    // Tính năng sử dụng: Sổ chi tiết tài khoản chữ T
    // Author: HiepNH
    getListBalanceOfCompanyGroupByAccount({ ctx, companyID, fundaID, accountID, fromDate, toDate }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                /**
                 * Business Analyst (BA)
                 * 1. Lấy mảng chứa tài khoản và các con cháu của nó
                 * 2. Số liệu trong kỳ không gồm các Phiếu kết chuyển+Phiếu hủy
                 * 3. Tổng hợp các số liệu phát sinh Nợ/Có theo các tài khoản phát sinh trực tiếp
                 * 4. Lấy danh mục tài khoản của toàn bộ công ty
                 * 5. Lần lượt qua từng tài khoản, sử dụng đệ quy để đưa dữ liệu vào theo tất cả các tài khoản
                 */

                // Get nestedArray of account
                // let arrObjectID = await that.getListNestedItem({accountID});           
                const arrObjectID  =  await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{  accountID, isNestedOfCompany: true });//ACCOUNT_MODEL.getListByCompany({ companyID, status : 1 });
                let conditionObj1;
                let conditionObj2;
                let conditionObjDate;
                
                if(!fundaID){
                    conditionObj1 = {
                        company: ObjectID(companyID),
                        debit: {
                            $in: arrObjectID.data
                        },
                        credit: { $exists: true, $ne: null }
                    }
                    conditionObj2 = {
                        company: ObjectID(companyID),
                        credit: {
                            $in: arrObjectID.data
                        },
                        debit: { $exists: true, $ne: null }
                    }
                }else{
                    conditionObj1 = {
                        funda: ObjectID(fundaID),
                        debit: {
                            $in: arrObjectID.data
                        },
                        credit: { $exists: true, $ne: null }
                    }
                    conditionObj2 = {
                        funda: ObjectID(fundaID),
                        credit: {
                            $in: arrObjectID.data
                        },
                        debit: { $exists: true, $ne: null }
                    }
                }

                if(!toDate){
                    conditionObjDate = {
                        "forward": 0,
                        "cancel": 0,
                        "date": { $lt: moment(fromDate).toDate() }
                    }
                }else{
                    conditionObjDate = {
                        "forward": 0,
                        "cancel": 0,
                        "date": { 
                            $gte: moment(fromDate).toDate(),
                            $lte: moment(toDate).toDate(),
                        },
                    }
                }

                const listData = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $facet: {
                            //_________Số liệu phát sinh Nợ
                            _debit:[
                                {
                                    $match: conditionObj1
                                }, 
                                {
                                    $match: conditionObjDate
                                }, 
                                {
                                    $project : { 
                                        credit: '$credit',
                                        debit:'$debit',
                                        amount: 1,
                                        date : '$date',
                                        forward: '$forward',
                                        cancel: '$cancel',
                                    }
                                },
                                {
                                    $group: {
                                        _id: { credit: '$credit' },
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }                    
                            ],
                            
                            //_________Số liệu phát sinh Có
                            _credit:[
                                {
                                    $match: conditionObj2
                                }, 
                                {
                                    $match: conditionObjDate
                                }, 
                                {
                                    $project : { 
                                        debit:'$debit',
                                        credit: '$credit',
                                        amount: 1,
                                        date : '$date',
                                        forward: '$forward',
                                        cancel: '$cancel',
                                    }
                                },
                                {
                                    $group: {
                                        _id: { debit: '$debit' },
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }   
                            ],            
                        }
                    } 
                ])
                if (!listData) return resolve({ error: true, message: 'cannot_get_list_data' });
                //_________Khai báo mảng có Key là các accountID của công ty
                // Giá trị là các cặp debit, credit của các tài khoản
                let arrDebit = [], arrCredit = [];

                //_________Danh sách tài khoản của công ty
                // let listAccounts = await ACCOUNT_COLL.find({ company: companyID });
                let listAccounts  =  await  ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_AND_GET_LIST}`,
                { limit: '20', companyID, isAccountingService: true });

                //_________Lặp qua từng tài khoản (gồm cả mẹ, con) và tổng hợp số liệu theo tài khoản đang xét
                for(let item of listAccounts.data.listRecords){
                    //_________Lấy mảng arrObjectID gồm ID tài khoản và con cháu của tài khoản
                    let _arrObjectID  =  await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{  accountID: `${item._id}`, isNestedOfCompany: true });//ACCOUNT_MODEL.getListByCompany({ companyID, status : 1 });
                    if(_arrObjectID.error) {
                        console.log(`ERROR [ACCOUNTING_JOUNRAL][getListBalanceOfCompanyGroupByAccount] tbook: ${error} `);
                        return resolve({ error: true, message: _arrObjectID.message});
                    }
                    _arrObjectID = _arrObjectID.data.map(item => item.toString())
                    
                    //_________Tạo phần tử của arr có Key là account
                    let key = item._id;
                    if (!Array.isArray(arrDebit[key])) {
                        arrDebit[key] = [{ total: 0 }];
                    }
                    if (!Array.isArray(arrCredit[key])) {
                        arrCredit[key] = [{ total: 0 }];
                    }

                    //_________Xử lý dữ liệu bên Nợ
                    listData[0]._debit.forEach(element=>{
                        //_________Kiểm tra xem nếu accountID thuộc về _arrObjectID thì cộng vào
                        if(_arrObjectID.includes(element._id.credit.toString())){
                            arrDebit[key][0].total = Number(arrDebit[key][0].total) + Number(element.amountPrice);
                        }
                    });

                    //_________Xử lý dữ liệu bên Có
                    listData[0]._credit.forEach(element=>{
                        //_________Kiểm tra xem nếu accountID thuộc về _arrObjectID thì cộng vào
                        if(_arrObjectID.includes(element._id.debit.toString())){
                            arrCredit[key][0].total = Number(arrCredit[key][0].total) + Number(element.amountPrice);
                        }
                    });
                }
                return resolve({ error: false, data: { arrDebit, arrCredit } });
            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOUNRAL][getListBalanceOfCompanyGroupByAccount] tbook: ${error} `);
                return resolve({ error: true, message: error.message });
            }
        });
    } 
  
    // Danh sách chi tiết phiếu của một account
    getListJournalOfAccount({ ctx, accountID, fromDate, toDate,fundaID }){
        return new Promise(async resolve => {
            try {
                if(!_isValid(accountID))
                    return { error: true, message: 'accountID_invalid' };
               
                const [ infoAccount, listNestedAccount ] = await Promise.all([
                    ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_WITH_ID}`,{ accountID }),
                    ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{ accountID, isNestedOfCompany: true }),
                ]);
                [infoAccount, listNestedAccount ].forEach(item=>{
                    if(item.error){
                        return resolve(item);
                    }
                })
                const nestedAccount = listNestedAccount.data.map(item => item.toString());
                // const [ openingBalance, listJournals ] = await Promise.all([
                //     this.getOpeningBalanceOfCompany({ ctx, fundaID, accountID, fromDate, arrAccountObjectID: listNestedAccount }),
                //     this.getList({ fundaID, accountID, fromDate, toDate, arrAccountObjectID: listNestedAccount, isGetForAccountDetails: true })
                // ]);
                const openingBalance = await this.getOpeningBalanceOfCompany({ ctx, fundaID, accountID, fromDate });
                // [ openingBalance, listJournals ].forEach(item=>{
                //     if(item.error){
                //         return resolve(item);
                //     }
                // })
                return resolve({
                    error: false,
                    data:{
                        fromDate, toDate,
                        nestedAccount,
                        accountID,
                        openingBalance: openingBalance.data,
                        // listJournals: listJournals.data
                    }
                });

            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOUNRAL][getListJournalOfAccount]: ${error} `);
                return resolve({ error: true, message: error.message })
            }
        });  
    }

    // [core] Lấy danh sách chi tiết phiếu 
    getList({ option, companyID, fundaID, voucherID, contractID, budgetID, budgetItemID, budgetGroupID, budgetWorkID, isGetForAccountDetails, arrAccountObjectID, fromDate, toDate, keyword, limit = 10, lastestID, select, populates= {} }){
        // console.log({ companyID, fundaID, voucherID, contractID, budgetID, budgetItemID, budgetGroupID, budgetWorkID, isGetForAccountDetails, arrAccountObjectID, fromDate, toDate})
        return new Promise(async resolve => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                */
                let conditionObj = {
                    company: companyID
                }

                if(!option){
                    
                }else{
                    // Bút toán của Phiếu
                    if(Number(option) == 1){
                        conditionObj = {
                            voucher: voucherID
                        }
                    }

                    // Bút toán của Hợp đồng
                    // if(Number(option) == 2){

                    // }

                    // Bút toán của Thực hiện ngân sách
                    if(Number(option) == 3){
                        if(_isValid(budgetID)){
                            conditionObj = {
                                budget: budgetID
                            }
                        }  
        
                        if(_isValid(budgetItemID)){
                            conditionObj = {
                                budgetItem: budgetItemID
                            }
                        }  
        
                        if(_isValid(budgetGroupID)){
                            conditionObj = {
                                budgetGroup: budgetGroupID
                            }
                        }  
        
                        if(_isValid(budgetWorkID)){
                            conditionObj = {
                                budgetWork: budgetWorkID
                            }
                        } 
                    }
                }  

                if(limit > 20){
                    limit = 20
                }

                let sortBy   = { createAt: -1, _id: -1 };

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
				
                // POPULATE
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                console.log('================>>>>>>>>>>>>>>>>>>>')
                console.log(conditionObj)

                // Lấy danh sách phiếu cho một tài khoản vd : tk :  111 có các chi tiết phiếu trong kì 9/2021
                if(isGetForAccountDetails){
                    const arrObjectID = JSON.parse(arrAccountObjectID);
                    let conditionObj1;
                    if(!fundaID){
                        if(!contractID){
                            conditionObj1 = {
                                company: companyID,
                                $or: [
                                    { debit:   {
                                        $in: arrObjectID
                                    }},
                                    { credit:  {
                                        $in: arrObjectID
                                    } },
                                ],
                            }
                        }else{
                            conditionObj1 = {
                                company: companyID,
                                contract: contractID,
                                $or: [
                                    { debit:   {
                                        $in: arrObjectID
                                    }},
                                    { credit:  {
                                        $in: arrObjectID
                                    } },
                                ],
                            }
                        }
                    }else{
                        if(!contractID){
                            conditionObj1 = {
                                funda: fundaID,
                                $or: [
                                    { debit:   {
                                        $in: arrObjectID
                                    }},
                                    { credit:  {
                                        $in: arrObjectID
                                    } },
                                ],
                            }
                        }else{
                            conditionObj1 = {
                                funda: fundaID,
                                contract: contractID,
                                $or: [
                                    { debit:   {
                                        $in: arrObjectID
                                    }},
                                    { credit:  {
                                        $in: arrObjectID
                                    } },
                                ],
                            }
                        }
                    }
                    conditionObj = { 
                        $and: [
                            conditionObj1,
                            {
                                "date": { 
                                    $gte: moment(fromDate).toDate(),
                                    $lte: moment(toDate).toDate()
                                }
                            }
                        ]
                    }
                }
           
                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

					let keys	 = ['createAt__-1', '_id__-1'];
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });

					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}

                let infoDataAfterGet = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean(); 
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);
                
                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
                
            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOUNRAL][getListJournalOfAccount]: ${error} `);
                return resolve({ error: true, message: error.message, status: 500 });
            }
        });  
    }

    // Số liệu ĐẦU KỲ cho Bảng cân đối tài khoản
    getDataGroupByAccountAndContactS({ companyID, fundaID, contractID, fromDate }) {
        const that = this;
        return new Promise(async resolve => {
            try {
            /**
                 * BA
                 * - Ví dụ ngày đầu kỳ: fromDate = 12/5/2020:
                 * --- A1: Lấy các phiếu Kết chuyển đầu kỳ năm trước sang: 1/1/2020 (forward = 1)
                 * --- A2: Lấy các phiếu Thông thường tính từ ngày 1/1/2020->12/5/2020
                 * --- Số đầu kỳ tính tới trước 12/5/2020: A = A1 + A2
                 */
                let conditionObjS, conditionObj

                //____________Lấy năm của ngày đầu kỳ
                let year = moment(fromDate).toDate().getFullYear()
                let firstDayOfYear = `${Number(year)}-01-01T00:00:00.000Z`

                if(!fundaID){
                    if(!contractID){
                        conditionObjS = {
                            company: ObjectID(companyID),
                            $expr: {$eq: [{$year: "$date"}, Number(year)]},
                            forward: 1,
                            cancel: 0,
                        }
                        conditionObj = {
                            company: ObjectID(companyID),
                            date : { 
                                $gte: moment(firstDayOfYear).toDate(),
                                $lt: moment(fromDate).toDate(), // $lte (<=), $lt (<)
                            },
                            forward: 0,
                            cancel: 0,
                        }
                    }else{
                        conditionObjS = {
                            contract: ObjectID(contractID),
                            $expr: {$eq: [{$year: "$date"}, Number(year)]},
                            forward: 1,
                            cancel: 0,
                        } 
                        conditionObj = {
                            contract: ObjectID(contractID),
                            date : { 
                                $gte: moment(firstDayOfYear).toDate(),
                                $lt: moment(fromDate).toDate(), // $lte (<=), $lt (<)
                            },
                            forward: 0,
                            cancel: 0,
                        } 
                    }
                }else{
                    if(!contractID){
                        conditionObjS = {
                            funda: ObjectID(fundaID),
                            $expr: {$eq: [{$year: "$date"}, Number(year)]},
                            forward: 1,
                            cancel: 0,
                        }
                        conditionObj = {
                            funda: ObjectID(fundaID),
                            date : { 
                                $gte: moment(firstDayOfYear).toDate(),
                                $lt: moment(fromDate).toDate(), // $lte (<=), $lt (<)
                            },
                            forward: 0,
                            cancel: 0,
                        }
                    }else{
                        conditionObjS = {
                            contract: ObjectID(contractID),
                            $expr: {$eq: [{$year: "$date"}, Number(year)]},
                            forward: 1,
                            cancel: 0,
                        } 
                        conditionObj = {
                            contract: ObjectID(contractID),
                            date : { 
                                $gte: moment(firstDayOfYear).toDate(),
                                $lt: moment(fromDate).toDate(), // $lte (<=), $lt (<)
                            },
                            forward: 0,
                            cancel: 0,
                        } 
                    }
                }

           
                // Tổng hợp số liệu theo các bút toán
                let _listDataS =  ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionObjS,
                                }, 
                                {
                                    $group: {
                                        _id: { customerDebit: "$customerDebit", debit: "$debit"},
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }                    
                            ],
                            
                            _credit:[
                                {
                                    $match: conditionObjS,
                                },
                                {
                                    $group: {
                                        _id: { customerCredit: "$customerCredit", credit: "$credit"},
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }   
                            ],            
                        }
                    } 
                ]);

                let _listData =  ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionObj,
                                }, 
                                {
                                    $group: {
                                        _id: { customerDebit: "$customerDebit", debit: "$debit"},
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }                    
                            ],
                            
                            _credit:[
                                {
                                    $match: conditionObj,
                                },
                                {
                                    $group: {
                                        _id: { customerCredit: "$customerCredit", credit: "$credit"},
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }   
                            ],            
                        }
                    } 
                ]);
                
                let [ listDataS,  listData ]  = await Promise.all([  _listDataS , _listData])

                return resolve({ error: false, dataS: listDataS[0], data: listData[0] });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    } 

    // Số liệu TRONG KỲ cho Bảng cân đối tài khoản
    getDataGroupByAccountAndContact({ companyID, fundaID, contractID, fromDate, toDate }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * - Ví dụ ngày đầu kỳ: fromDate = 12/5/2020 => Trong kỳ sẽ tính từ 12/5/2020 => 31/12/2020
                 */
                let conditionObj

                if(!fundaID){
                    if(!contractID){
                        conditionObj = {
                            company: ObjectID(companyID),
                            date : { 
                                $gte: moment(fromDate).toDate(),
                                $lte: moment(toDate).toDate()
                            },
                            forward: 0,
                            cancel: 0,
                        }
                    }else{
                        conditionObj = {
                            contract: ObjectID(contractID),
                            date : { 
                                $gte: moment(fromDate).toDate(),
                                $lte: moment(toDate).toDate()
                            },
                            forward: 0,
                            cancel: 0,
                        } 
                    }
                }else{
                    if(!contractID){
                        conditionObj = {
                            funda: ObjectID(fundaID),
                            date : { 
                                $gte: moment(fromDate).toDate(),
                                $lte: moment(toDate).toDate()
                            },
                            forward: 0,
                            cancel: 0,
                        }
                    }else{
                        conditionObj = {
                            contract: ObjectID(contractID),
                            date : { 
                                $gte: moment(fromDate).toDate(),
                                $lte: moment(toDate).toDate()
                            },
                            forward: 0,
                            cancel: 0,
                        } 
                    }
                }

                // Tổng hợp số liệu theo các bút toán
                let listData = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionObj,
                                }, 
                                {
                                    $group: {
                                        _id: { customerDebit: "$customerDebit", debit: "$debit"},
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }                    
                            ],
                            
                            _credit:[
                                {
                                    $match: conditionObj,
                                },
                                {
                                    $group: {
                                        _id: { customerCredit: "$customerCredit", credit: "$credit"},
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }   
                            ],            
                        }
                    } 
                ]);

                return resolve({ error: false, data: listData[0] });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    } 

    // Bảng báo cáo tài chính 
    financialReport({ ctx, companyID, fundaID, fromDate, toDate }){
        return new Promise(async resolve => {
            try {
                let listAccountsAsync    =  ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{  isNestedOfCompany: false, status : 1 }) // ACCOUNT_MODEL.getListByCompany({ companyID, status : 1 });
                let listDataSAsyn        = this.getDataGroupByAccountAndContactS({ companyID, fundaID, fromDate });

                //  * - LẤY DỮ LIỆU TRONG KỲ.
                let listDataAsyn         = this.getDataGroupByAccountAndContact({ companyID, fundaID, fromDate, toDate })
                
                let [  listAccounts, listDataS, listData ] = await Promise.all([ listAccountsAsync, listDataSAsyn, listDataAsyn ]);
                // Chuẩn bị các mãn
                let arrayAccountDK            = []; //  Danh sách thông tin giá trị tài khoản vào đầu kì :  đầu kì 1/1/năm_đang_xét + từ 1/1/năm_đang_xét -> date đang xét
                let arrayAccountTK            = []; //  Danh sách thông tin giá trị tài khoản trong kì : theo ngày đang xét 
                let arrayAccountCK            = []; //  Danh sách thông tin giá trị tài khoản cuối kì : Lưu ý tính toán phải dựa vào từng cập giá trị theo khách hàng

            
                // Tính toán số liệu đầu kì + tách công nợ theo từng khách hàng đầu kì
                function ToltalDK({ newDebit, newCredit, isLastPoint }){

                    //TK nợ
                    newDebit.forEach(async item=>{
                        
                        //  1.Tách theo từng đầu tài khoản sau đó gọp tổng lại
                        if( item && item._id && item._id.debit){
                        
                            let accountDebit = arrayAccountDK[item._id.debit];

                            // Nếu mà mãn đầu kì  có đầu tài khoản này thì cộng tiếp 
                            // Lưu vào  arrayAccountDK để sau này dễ lấy ra

                            let  customerID  = item._id.customerDebit;
                            if(accountDebit){
                                if(accountDebit[customerID]){
                                    accountDebit[customerID].amountPriceDebit = Number( accountDebit[customerID].amountPriceDebit || 0 ) + Number(item.amountPrice || 0);    
                                }else{
                                    accountDebit[customerID] = {};
                                    accountDebit[customerID].amountPriceDebit = Number(item.amountPrice || 0);
                                    accountDebit[customerID].customer = customerID;
                                }
                                // accountDebit.amountPrice        = Number(accountDebit.amountPrice || 0)  + Number(item.amountPrice || 0);
                                // accountDebit.amountPriceDebit   = Number(accountDebit.amountPriceDebit || 0) + Number(item.amountPrice || 0);
                            }else{
                            // Nếu chưa có thì khởi tạo thông tin cho tài khoản
                            //Llưu vào  arrayAccountDK để sau này dễ lấy ra
                            
                                arrayAccountDK[item._id.debit]                    = {};
                                arrayAccountDK[item._id.debit][customerID]        = {};

                                // arrayAccountDK[item._id.debit][customerID].amountPrice        = Number(item.amountPrice || 0);
                                arrayAccountDK[item._id.debit][customerID].amountPriceDebit   = Number(item.amountPrice || 0);
                                arrayAccountDK[item._id.debit][customerID].customerDebit      = item._id.customerDebit;
                                arrayAccountDK[item._id.debit][customerID].debit              = item._id.debit;
                            }
                            

                            // Tách tài khoản theo từng đầu công nợ theo từng khách hàng
                            // Xử lý mãng khách hàng theo từng đầu tài khoảng cho tính toán cuối kỳ 
                            // Cách thức tương tự chạy kế chuyển : [CF_ROUTINGS_FINANCIAL.FORWORD_UPDATE_22]
                            // Xử dụng một mãn : arrayAccountCK  cuối kỳ để lưu thông tin của khách hàng sau này tiện tính toán

                            let accountCK = arrayAccountCK[item._id.debit];

                            // Nếu đầu tài khoản đã có 
                            if(accountCK){
                                let  customerID  = item._id.customerDebit;

                                // Nếu đầu tài khoản này đã có khách hàng này 
                                if(accountCK[customerID]){
                                    accountCK[customerID].amountPriceDebit = Number( accountCK[customerID].amountPriceDebit || 0) + Number(item.amountPrice || 0);    
                                }else{
                                    
                                    // Nếu chưa có thì tạo mới thông tin khách hàng trong tài khoản này theo bên nợ vì đang duyệt mãng debitx
                                    accountCK[customerID] = {};
                                    accountCK[customerID].amountPriceDebit = Number(item.amountPrice || 0);
                                    accountCK[customerID].customer = customerID;
                                }

                            }else{

                                // Nếu đầu tài khoản chưa có thì tạo đầu tài khoản kèm theo khách hàng đang xét
                                arrayAccountCK[item._id.debit] = {};
                                arrayAccountCK[item._id.debit][item._id.customerDebit] = {};
                                arrayAccountCK[item._id.debit][item._id.customerDebit].customer = item._id.customerDebit;
                                arrayAccountCK[item._id.debit][item._id.customerDebit].amountPriceDebit = Number(item.amountPrice || 0); //  openingS + Dk
                            }
                    
                        }
                    })

                    // Tương tự phần debit nhưng đổi các gía trị lưu thành creadit
                    newCredit.forEach(async item=>{
                    
                        if( item && item._id && item._id.credit){
                        
                            let accountCrebit = arrayAccountDK[item._id.credit]
                        

                            // if(accountCrebit){
                            //     accountCrebit.amountPrice             =  Number(accountCrebit.amountPrice  || 0) - Number(item.amountPrice || 0);
                            //     accountCrebit.amountPriceCredit       =  Number(accountCrebit.amountPriceCredit || 0 ) + Number(item.amountPrice || 0);
                            // }else{
                            //     arrayAccountDK[item._id.credit]                    = {};
                            //     arrayAccountDK[item._id.credit].amountPrice        = Number(item.amountPrice || 0);
                            //     arrayAccountDK[item._id.credit].amountPriceCredit  = Number(item.amountPrice || 0);
                            //     arrayAccountDK[item._id.credit].customerCredit     = item._id.customerCredit;
                            //     arrayAccountDK[item._id.credit].credit             = item._id.credit;
                            // }

                            let  customerID  = item._id.customerCredit;
                            if(arrayAccountDK[item._id.credit]){
                                if(arrayAccountDK[item._id.credit][customerID]){
                                    arrayAccountDK[item._id.credit][customerID].accountCrebit = Number( arrayAccountDK[item._id.credit][customerID].accountCrebit || 0 ) + Number(item.amountPrice || 0);    
                                }else{
                                    arrayAccountDK[item._id.credit][customerID] = {};
                                    arrayAccountDK[item._id.credit][customerID].accountCrebit = Number(item.amountPrice || 0);
                                    arrayAccountDK[item._id.credit][customerID].customer = customerID;
                                }
                                // accountCrebit.amountPrice        = Number(accountCrebit.amountPrice || 0)  + Number(item.amountPrice || 0);
                                // accountCrebit.amountPriceDebit   = Number(accountCrebit.amountPriceDebit || 0) + Number(item.amountPrice || 0);
                            }else{
                            // Nếu chưa có thì khởi tạo thông tin cho tài khoản
                            //Llưu vào  arrayAccountDK để sau này dễ lấy ra
                            
                                arrayAccountDK[item._id.credit]                    = {};
                                arrayAccountDK[item._id.credit][customerID]        = {};

                                arrayAccountDK[item._id.credit][customerID].amountPrice        =  0 - Number(item.amountPrice || 0);
                                arrayAccountDK[item._id.credit][customerID].accountCrebit   = Number(item.amountPrice || 0);
                                arrayAccountDK[item._id.credit][customerID].customerCredit      = item._id.customerCredit;
                                arrayAccountDK[item._id.credit][customerID].credit              = item._id.credit;
                            }

                            // Xử lý mãng khách hàng theo từng đầu tài khoảng cho tính toán cuối kỳ
                            let accountCK = arrayAccountCK[item._id.credit];
                            if(accountCK){
                                let  customerID  = item._id.customerCredit;
                                if(accountCK[customerID]){
                                    accountCK[customerID].amountPriceCredit = Number(accountCK[customerID].amountPriceCredit || 0) + Number(item.amountPrice || 0);    
                                }else{
                                    accountCK[customerID] = {};
                                    accountCK[customerID].amountPriceCredit = Number(item.amountPrice || 0);
                                    accountCK[customerID].customer = customerID;
                                }

                            }else{
                                arrayAccountCK[item._id.credit] = {};
                                arrayAccountCK[item._id.credit][item._id.customerCredit] = {};
                                arrayAccountCK[item._id.credit][item._id.customerCredit].customer          = item._id.customerCredit;
                                arrayAccountCK[item._id.credit][item._id.customerCredit].amountPriceCredit = Number(item.amountPrice || 0); //  openingS + Dk
                            }
                    
                        }
                    });
                }
            
                // Xử lý trong kì tương tự đầu kì
                function ToltalTK({ newDebit, newCredit }){
            
                    newDebit.forEach(item=>{

                        //  1.Nếu đã có customer đó rồi thì xử lý cộng thêm số
                        if( item && item._id && item._id.debit){
                            let accountDebit = arrayAccountTK[item._id.debit];

                            if(accountDebit){
                                accountDebit.amountPrice        = Number(accountDebit.amountPrice || 0) + Number(item.amountPrice || 0);
                                accountDebit.amountPriceDebit   = Number(accountDebit.amountPriceDebit || 0) + Number(item.amountPrice || 0);
                            }else{
                                arrayAccountTK[item._id.debit]                    = {};
                                arrayAccountTK[item._id.debit].amountPrice        = Number(item.amountPrice || 0);
                                arrayAccountTK[item._id.debit].amountPriceDebit   = Number(item.amountPrice || 0);
                                arrayAccountTK[item._id.debit].customerDebit      = item._id.customerDebit;
                                arrayAccountTK[item._id.debit].debit              = item._id.debit;
                            }

                            // Xử lý mãng khách hàng theo từng đầu tài khoảng cho tính toán cuối kỳ
                            let accountCK = arrayAccountCK[item._id.debit];

                            if(accountCK){
                                let  customerID  = item._id.customerDebit;

                                if(accountCK[customerID]){
                                    accountCK[customerID].amountPriceDebit = Number( accountCK[customerID].amountPriceDebit || 0 ) + Number(item.amountPrice || 0);    
                                }else{
                                    accountCK[customerID] = {};
                                    accountCK[customerID].amountPriceDebit = Number(item.amountPrice || 0);
                                    accountCK[customerID].customer = customerID;
                                }
                            }else{
                                arrayAccountCK[item._id.debit] = {};
                                arrayAccountCK[item._id.debit][item._id.customerDebit] = {};
                                arrayAccountCK[item._id.debit][item._id.customerDebit].customer = item._id.customerDebit;
                                arrayAccountCK[item._id.debit][item._id.customerDebit].amountPriceDebit = Number(item.amountPrice || 0); //  openingS + Dk
                            }
                        }
                    })

                    newCredit.forEach(item=>{

                        if( item && item._id && item._id.credit){

                            let accountCrebit = arrayAccountTK[item._id.credit]

                            if(accountCrebit){
                                accountCrebit.amountPrice             =  Number(accountCrebit.amountPrice  || 0) - Number(item.amountPrice || 0);
                                accountCrebit.amountPriceCredit       =  Number(accountCrebit.amountPriceCredit || 0 ) + Number(item.amountPrice || 0);
                            }else{
                                arrayAccountTK[item._id.credit]                    = {};
                                arrayAccountTK[item._id.credit].amountPrice        = Number(item.amountPrice || 0);
                                arrayAccountTK[item._id.credit].amountPriceCredit  = Number(item.amountPrice || 0);
                                arrayAccountTK[item._id.credit].customerCredit     = item._id.customerCredit;
                                arrayAccountTK[item._id.credit].credit             = item._id.credit;
                            }

                            // Xử lý mãng khách hàng theo từng đầu tài khoảng cho tính toán cuối kỳ
                            let accountCK = arrayAccountCK[item._id.credit];

                            if(accountCK){
                                let  customerID  = item._id.customerCredit;

                                if(accountCK[customerID]){
                                    accountCK[customerID].amountPriceCredit = Number(accountCK[customerID].amountPriceCredit || 0 ) + Number(item.amountPrice || 0);    
                                }else{
                                    accountCK[customerID] = {};
                                    accountCK[customerID].amountPriceCredit = Number(item.amountPrice || 0);
                                    accountCK[customerID].customer = customerID;
                                }
                            }else{
                                arrayAccountCK[item._id.credit] = {};
                                arrayAccountCK[item._id.credit][item._id.customerCredit] = {};
                                arrayAccountCK[item._id.credit][item._id.customerCredit].customer          = item._id.customerCredit;
                                arrayAccountCK[item._id.credit][item._id.customerCredit].amountPriceCredit = Number(item.amountPrice || 0); //  openingS + Dk
                            }
                        }else{
                            // console.log({s : arrayAccount[ item._id.credit]})
                        }
                    
                    })
                }

                // Xử dụng để tính toán giá trị cuối kì cho các tài khoản có  tài khoản con
                function getValueCK({  accountInfo, parentID, parentName  }){

                    // Nếu tài  khoản đó có tài khoản con
                    if(accountInfo && accountInfo.childs){

                        // Kiểm tra nếu chưa có trong mãn cuối kì thì tiến hành tạo cho tài khoản cha một phần tử trong mãn.
                        // Lý do tài khoản cha chưa có : do tất cả công nợ nằm hết tài khoản con

                        // Tạo nếu không có giá trị đầu kì
                        if(!arrayAccountDK[parentID]){
                            arrayAccountDK[parentID]                    = {};
                            // arrayAccountDK[parentID].amountPrice        = 0;
                            // arrayAccountDK[parentID].amountPriceDebit   = 0;
                            // arrayAccountDK[parentID].amountPriceCredit  = 0;
                            // arrayAccountDK[parentID].debit              = parentID;
                        }

                        // Tạo nếu không có giá trị trong kì
                        if(!arrayAccountTK[parentID]){
                            arrayAccountTK[parentID]                    = {};
                            arrayAccountTK[parentID].amountPrice        = 0;
                            arrayAccountTK[parentID].amountPriceDebit   = 0;
                            arrayAccountTK[parentID].amountPriceCredit  = 0;
                            arrayAccountTK[parentID].credit             = parentID;
                        }

                        // Nếu chưa có giá trị cuối kì
                        if(!arrayAccountCK[parentID]){
                            arrayAccountCK[parentID] = {}
                        }

                        // Duyệt mãng của những tài khoản con
                        accountInfo.childs.forEach(accountChil=>{
                        
                            if(accountChil.status == 1){
                            
                                // Kiểm tra nếu tài khoản con có giá trị công nợ đầu kì thì tiến hành cộng dồn cho tài khoản cha
                                if(arrayAccountDK[accountChil._id]){
                                    // XỬ LÝ CHO TÀI KHOẢN  CÓ ĐẦU KÌ
                                    // Nếu có thông tin về Đầu kì của tài khoản đang xét
                                    let openingAmountDebitAll = 0, openingRemainAmountCreitAll = 0;
                                    // Lấy tất cả khách hàng có nợ có trong tài khoản này
                                    let key1 = Object.keys(arrayAccountDK[accountChil._id]);
                                
                                    // duyệt qua các khách hàng
                                    for(let i =0; i<key1.length; i ++){
                                        let  _index  = key1[i];
                                        let customer = arrayAccountDK[accountChil._id][_index];
                                    
                                        if(Number(customer.amountPriceDebit || 0) - Number(customer.accountCrebit|| 0 )  > 0){
                                            let remainAmountDebit = Number(customer.amountPriceDebit || 0) - Number(customer.accountCrebit || 0)
                                            openingAmountDebitAll = Number(openingAmountDebitAll) + remainAmountDebit;
                                        
                                        }
                                        if(Number(customer.accountCrebit || 0) - Number(customer.amountPriceDebit || 0 ) > 0){
                                            let remainAmountCredit = Number(customer.accountCrebit || 0) - Number(customer.amountPriceDebit || 0)
                                            openingRemainAmountCreitAll = Number(openingRemainAmountCreitAll) + remainAmountCredit
                                        }	
                                    }
                                    // Lấy  tổng đầu kì cho một tài khoản
                                    accountChil.openingAmountDebitAll = openingAmountDebitAll || 0;
                                    accountChil.openingAmountCreditAll = openingRemainAmountCreitAll || 0;
                                    // accountInfo.openingAmountCreditAll  =  openingRemainAmountCreitAll;
                                    // accountInfo.openingAmountDebitAll =  openingAmountDebitAll;
                                    arrayAccountDK[parentID].openingAmountDebitAll  = Number(arrayAccountDK[parentID].openingAmountDebitAll || 0) + Number(arrayAccountDK[accountChil._id].openingAmountDebitAll || 0);
                                    arrayAccountDK[parentID].openingAmountCreditAll = Number(arrayAccountDK[parentID].openingAmountCreditAll || 0) + Number(arrayAccountDK[accountChil._id].openingAmountDebitAll || 0);
                                }else{
                                    accountChil.openingAmountDebitAll =  0;
                                    accountChil.openingAmountCreditAll = 0;
                                }
    
                                // Kiểm tra nếu tài khoản con có giá trị công nợ trong kì thì tiến hành cộng dồn cho tài khoản cha
                                if(arrayAccountTK[accountChil._id]){
                                    arrayAccountTK[parentID].amountPriceDebit = Number(arrayAccountTK[parentID].amountPriceDebit || 0) + Number( arrayAccountTK[accountChil._id].amountPriceDebit || 0);
                                    arrayAccountTK[parentID].amountPriceCredit = Number( arrayAccountTK[parentID].amountPriceCredit || 0) + Number( arrayAccountTK[accountChil._id].amountPriceCredit || 0);
                                }
                            
                                // Xử lý cuối kì
                                // Duyệt hết tất cả các khách hàng của tài khoản con
                                if(arrayAccountCK[accountChil._id]){
                                    let key1 = Object.keys(arrayAccountCK[accountChil._id]);
                                    for(let i =0; i<key1.length; i ++){
                                        let  _index  = key1[i]
                                        let customer = arrayAccountCK[accountChil._id][_index]
                                        if(arrayAccountCK[parentID][_index]){
                                            arrayAccountCK[parentID][_index].amountPriceDebit  =  Number( arrayAccountCK[parentID][_index].amountPriceDebit || 0) + Number(customer.amountPriceDebit|| 0);
                                            arrayAccountCK[parentID][_index].amountPriceCredit =  Number( arrayAccountCK[parentID][_index].amountPriceCredit || 0) + Number(customer.amountPriceCredit|| 0);
                                        }else{
                                            arrayAccountCK[parentID][_index] = {}
                                            arrayAccountCK[parentID][_index].amountPriceDebit  =  Number( arrayAccountCK[parentID][_index].amountPriceDebit || 0) + Number(customer.amountPriceDebit|| 0);
                                            arrayAccountCK[parentID][_index].amountPriceCredit =  Number( arrayAccountCK[parentID][_index].amountPriceCredit || 0) + Number(customer.amountPriceCredit|| 0);
                                        }
                                    }
                                }

                            

                                // Lấy tổng trong kì cho một tài khoản
                                if(arrayAccountTK[accountChil._id]){
                                    accountChil.amountDebitAll = arrayAccountTK[accountChil._id].amountPriceDebit || 0;
                                    accountChil.amountCreditAll = arrayAccountTK[accountChil._id].amountPriceCredit || 0;
                                }else{
                                    accountChil.amountDebitAll =  0;
                                    accountChil.amountCreditAll = 0;
                                }
                                
                                // Xử lý số liệu cuối kì

                                // Mặt định giá trị cuôi kì của mõi tài khoản là 0
                                let remainAmountDebitAll = 0, remainAmountCreditAll =0;
                                accountChil.remainAmountDebitAll =  remainAmountDebitAll;
                                accountChil.remainAmountCreditAll = remainAmountCreditAll;

                                // Nếu có thông tin về cuôi kì của tài khoản đang xét
                                if(arrayAccountCK[accountChil._id]){
                                    
                                        // Lấy tất cả khách hàng có nợ có trong tài khoản này
                                        let key1 = Object.keys(arrayAccountCK[accountChil._id]);
                                    
                                        // duyệt qua các khách hàng
                                        for(let i =0; i<key1.length; i ++){
                                            let  _index  = key1[i];
                                            let customer = arrayAccountCK[accountChil._id][_index];
                                        
                                            // Tính toán
                                            //_________Số liệu cuối kỳ
                                        
                                            if(Number(customer.amountPriceDebit || 0) - Number(customer.amountPriceCredit|| 0 )  > 0){
                                                let remainAmountDebit = Number(customer.amountPriceDebit || 0) - Number(customer.amountPriceCredit || 0)
                                                remainAmountDebitAll = Number(remainAmountDebitAll) + remainAmountDebit;
                                            }
                                            if(Number(customer.amountPriceCredit || 0) - Number(customer.amountPriceDebit || 0 ) > 0){
                                                let remainAmountCredit = Number(customer.amountPriceCredit || 0) - Number(customer.amountPriceDebit || 0)
                                                remainAmountCreditAll = Number(remainAmountCreditAll) + remainAmountCredit
                                            }	
                                        }
                                    
                                        // Tổng hợp theo tài khoản cha 
                                        accountChil.remainAmountDebitAll  =  remainAmountDebitAll;
                                        accountChil.remainAmountCreditAll =  remainAmountCreditAll;
                                    
                                        if(!arrAccLT.includes(parentName)){
                                            if(Number(accountChil.remainAmountDebitAll) > Number(accountChil.remainAmountCreditAll)){
                                                accountChil.remainAmountDebitAll    =   Number(remainAmountDebitAll) - Number(remainAmountCreditAll);;
                                                accountChil.remainAmountCreditAll   = 0;
                                            }else{
                                                if(Number(accountChil.remainAmountDebitAll) == Number(accountChil.remainAmountCreditAll)){
                                                    accountChil.remainAmountDebitAll    =  0;
                                                    accountChil.remainAmountCreditAll   =  0;
                                                }else{
                                                    accountChil.remainAmountCreditAll   =  Number(remainAmountCreditAll) - Number(remainAmountDebitAll);
                                                    accountChil.remainAmountDebitAll    =  0;
                                                }
                                            }
                                        }
                                        const newInfoAccountChild = {
                                            _id: accountChil._id,
                                            name: accountChil.name,
                                            description: accountChil.description,
                                            company: accountChil.company,
                                            childs: accountChil.childs,
                                            level: accountChil.level,
                                            state: accountChil.state,
                                            amountDebitAll: accountChil.amountDebitAll,
                                            amountCreditAll: accountChil.amountCreditAll,
                                            openingAmountCreditAll: accountChil.openingAmountCreditAll,
                                            openingAmountDebitAll: accountChil.openingAmountDebitAll,
                                            remainAmountCreditAll: accountChil.remainAmountCreditAll,
                                            remainAmountDebitAll: accountChil.remainAmountDebitAll,
                                            // remainAmountDebitAllChilds: accountChil.remainAmountDebitAllChilds,
                                            // remainAmountCreditAllChilds: accountChil.remainAmountCreditAllChilds
                                        }
                                        arrayChil.push(newInfoAccountChild)
                                }else{
                                
                                    // Tổng hợp theo tài khoản cha 
                                    accountChil.remainAmountDebitAll  =  0;
                                    accountChil.remainAmountCreditAll =  0;
                                    const newInfoAccountChild = {
                                        _id: accountChil._id,
                                        name: accountChil.name,
                                        description: accountChil.description,
                                        company: accountChil.company,
                                        childs: accountChil.childs,
                                        level: accountChil.level,
                                        state: accountChil.state,
                                        amountDebitAll: accountChil.amountDebitAll,
                                        amountCreditAll: accountChil.amountCreditAll,
                                        openingAmountCreditAll: accountChil.openingAmountCreditAll,
                                        openingAmountDebitAll: accountChil.openingAmountDebitAll,
                                        remainAmountCreditAll: accountChil.remainAmountCreditAll,
                                        remainAmountDebitAll: accountChil.remainAmountDebitAll,
                                        // remainAmountDebitAllChilds: accountChil.remainAmountDebitAllChilds,
                                        // remainAmountCreditAllChilds: accountChil.remainAmountCreditAllChilds
                                    }
                                    arrayChil.push(newInfoAccountChild)
                                }
                            
                                // Nếu tài khoản con còn các tài khoản con nữa thì tiếp tục làm duyệt qua
                                if(accountChil.childs){
                                    getValueCK({  accountInfo : accountChil, parentID  })
                                }
                            }   
                        })
                        
                    }
                    
                }

                // Danh sách các tài khoản lưỡng tính
                // let arrAccLT = ['128','131','136','138','141','331','334','335','336','338','341']
                let arrAccLT = []//'128','131','136','138','141','331','334','335','336','338','341'
                let arrAccLTObject  =  await  ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_AND_GET_LIST}`,
                { limit: '20', status : 1, type : 2, level : 1, isAccountingService: true });
                
                if(arrAccLTObject.error)
                    return resolve({ error: true, message: `DebtTrackingReport error: ${arrAccLTObject.message}`, status: 400 })
                    arrAccLTObject.data.listRecords.forEach(item=> { 
                    arrAccLT.push(item.name)
                });

                // 1.XỬ LÝ SỐ LIỆU ĐẦU KỲ.(kèm theo lưu thông tin của khách hàng theo từng đầu tài khoản  phục vụ việc tổng hợp CUỐI KÌ)
                ToltalDK({ newDebit : (listDataS.dataS && listDataS.dataS._debit) || [] , newCredit : (listDataS.dataS && listDataS.dataS._credit) || [] })
                ToltalDK({ newDebit : (listDataS.data && listDataS.data._debit) || [] , newCredit : (listDataS.data && listDataS.data._credit) || [] })
                
                // 2.XỬ LÝ SỐ LIỆU TRONG KỲ.(kèm theo lưu thông tin của khách hàng theo từng đầu tài khoản  phục vụ việc tổng hợp CUỐI KÌ)
                ToltalTK({ newDebit : (listData.data && listData.data._debit) || [] , newCredit : (listData.data && listData.data._credit) || [] })

                // 3.DUYỆT QUA TỪNG TÀI KHOẢN ĐỂ TỔNG HỢP CÔNG NỢ CUỐI CÙNG (ĐẦU KÌ ; TRONG KÌ; CUỐI KÌ).
                let newListAccount = [], arrayChil = []
                listAccounts && listAccounts.data && listAccounts.data.forEach(accountInfo=>{   
                        // Kiểm tra trường hợp có  danh sach tài khoản con
                        arrayChil = [];
                        getValueCK({ accountInfo : accountInfo, parentID :accountInfo._id, parentName : accountInfo.name });
                    
                        // Lấy  tổng đầu kì cho một tài khoản
                        // if(arrayAccountDK[accountInfo._id]){
                        //     accountInfo.openingAmountDebitAll = arrayAccountDK[accountInfo._id].amountPriceDebit || 0;
                        //     accountInfo.openingAmountCreditAll = arrayAccountDK[accountInfo._id].amountPriceCredit || 0;
                        // }else{
                        //     accountInfo.openingAmountDebitAll =  0;
                        //     accountInfo.openingAmountCreditAll = 0;
                        // }

                        // Lấy tổng trong kì cho một tài khoản
                        if(arrayAccountTK[accountInfo._id]){
                            accountInfo.amountDebitAll  = arrayAccountTK[accountInfo._id].amountPriceDebit || 0;
                            accountInfo.amountCreditAll = arrayAccountTK[accountInfo._id].amountPriceCredit || 0;
                        }else{
                            accountInfo.amountDebitAll  =  0;
                            accountInfo.amountCreditAll = 0;
                        }

                        // XỬ LÝ CHO TÀI KHOẢN  CÓ ĐẦU KÌ
                        // Nếu có thông tin về Đầu kì của tài khoản đang xét
                        let openingAmountDebitAll = 0, openingRemainAmountCreitAll = 0;

                        if(arrayAccountDK[accountInfo._id]){
                            
                            // Lấy tất cả khách hàng có nợ có trong tài khoản này
                            let key1 = Object.keys(arrayAccountDK[accountInfo._id]);
                        
                            // duyệt qua các khách hàng
                            for(let i =0; i<key1.length; i ++){
                                let  _index  = key1[i];
                                let customer = arrayAccountDK[accountInfo._id][_index];
                            
                                if(Number(customer.amountPriceDebit || 0) - Number(customer.accountCrebit|| 0 )  > 0){
                                    let remainAmountDebit = Number(customer.amountPriceDebit || 0) - Number(customer.accountCrebit || 0)
                                    openingAmountDebitAll = Number(openingAmountDebitAll) + remainAmountDebit;
                                    
                                }
                                if(Number(customer.accountCrebit || 0) - Number(customer.amountPriceDebit || 0 ) > 0){
                                    let remainAmountCredit = Number(customer.accountCrebit || 0) - Number(customer.amountPriceDebit || 0)
                                    openingRemainAmountCreitAll = Number(openingRemainAmountCreitAll) + remainAmountCredit
                                    
                                }	
                            }
                            
                        }
                            
                        accountInfo.openingAmountCreditAll  =  openingRemainAmountCreitAll;
                        accountInfo.openingAmountDebitAll   =  openingAmountDebitAll;

                        

                        arrayChil && arrayChil.forEach(item=>{
                            accountInfo.openingAmountCreditAll = Number(accountInfo.openingAmountCreditAll || 0) + Number(item.openingAmountCreditAll || 0);
                            accountInfo.openingAmountDebitAll  = Number(accountInfo.openingAmountDebitAll  || 0) + Number(item.openingAmountDebitAll || 0);
                        })
                    
                        // Xử lý số liệu cuối kì

                        // Mặt định giá trị cuôi kì của mõi tài khoản là 0
                        let remainAmountDebitAll = 0, remainAmountCreditAll =0;
                        accountInfo.remainAmountDebitAll  =  remainAmountDebitAll;
                        accountInfo.remainAmountCreditAll = remainAmountCreditAll;
                    
                        // Nếu có thông tin về cuôi kì của tài khoản đang xét
                        if(arrayAccountCK[accountInfo._id]){

                                // Lấy tất cả khách hàng có nợ có trong tài khoản này
                                let key1 = Object.keys(arrayAccountCK[accountInfo._id]);
                            
                                // duyệt qua các khách hàng
                                for(let i =0; i<key1.length; i ++){
                                    let  _index  = key1[i];
                                    let customer = arrayAccountCK[accountInfo._id][_index];
                                
                                    // Tính toán
                                    //_________Số liệu cuối kỳ
                                
                                    if(Number(customer.amountPriceDebit || 0) - Number(customer.amountPriceCredit|| 0 )  > 0){
                                        let remainAmountDebit = Number(customer.amountPriceDebit || 0) - Number(customer.amountPriceCredit || 0)
                                        remainAmountDebitAll  = Number(remainAmountDebitAll) + remainAmountDebit;
                                    }
                                    if(Number(customer.amountPriceCredit || 0) - Number(customer.amountPriceDebit || 0 ) > 0){
                                        let remainAmountCredit = Number(customer.amountPriceCredit || 0) - Number(customer.amountPriceDebit || 0)
                                        remainAmountCreditAll  = Number(remainAmountCreditAll) + remainAmountCredit
                                    }	
                                }
                            
                                // Tổng hợp theo tài khoản cha 
                                accountInfo.remainAmountDebitAll  =  remainAmountDebitAll;
                                accountInfo.remainAmountCreditAll =  remainAmountCreditAll;
                                if(!arrAccLT.includes(accountInfo.name)){
                                    if(Number(accountInfo.remainAmountDebitAll) > Number(accountInfo.remainAmountCreditAll)){
                                        accountInfo.remainAmountDebitAll    =   Number(remainAmountDebitAll) - Number(remainAmountCreditAll);;
                                        accountInfo.remainAmountCreditAll   = 0;
                                    }else{
                                        if(Number(accountInfo.remainAmountDebitAll) == Number(accountInfo.remainAmountCreditAll)){
                                            accountInfo.remainAmountDebitAll    =  0;
                                            accountInfo.remainAmountCreditAll   =  0;
                                        }else{
                                            accountInfo.remainAmountCreditAll   =  Number(remainAmountCreditAll) - Number(remainAmountDebitAll);
                                            accountInfo.remainAmountDebitAll    =  0;
                                        }
                                    }
                                }
                                accountInfo.plushValue  = true;
                                
                                arrayChil && arrayChil.forEach(item=>{
                                    accountInfo.remainAmountCreditAllChilds = Number(accountInfo.remainAmountCreditAllChilds || 0) + Number(item.remainAmountCreditAll);
                                    accountInfo.remainAmountDebitAllChilds  = Number(accountInfo.remainAmountDebitAllChilds  || 0) + Number(item.remainAmountDebitAll);
                                })
                                const newInfoAccount = {
                                    _id: accountInfo._id,
                                    name: accountInfo.name,
                                    description: accountInfo.description,
                                    company: accountInfo.company,
                                    childs: accountInfo.childs,
                                    level: accountInfo.level,
                                    state: accountInfo.state,
                                    amountDebitAll: accountInfo.amountDebitAll,
                                    amountCreditAll: accountInfo.amountCreditAll,
                                    openingAmountCreditAll: accountInfo.openingAmountCreditAll,
                                    openingAmountDebitAll: accountInfo.openingAmountDebitAll,
                                    remainAmountCreditAll: accountInfo.remainAmountCreditAll,
                                    remainAmountDebitAll: accountInfo.remainAmountDebitAll,
                                    remainAmountDebitAllChilds: accountInfo.remainAmountDebitAllChilds,
                                    remainAmountCreditAllChilds: accountInfo.remainAmountCreditAllChilds
                                }
                                newListAccount.push(newInfoAccount);
                        }
        
                        newListAccount = newListAccount.concat(arrayChil)
                });
                const resultList = []
                newListAccount  && newListAccount.map(accountInfo=>{   
                    // Kiểm tra trường hợp có  danh sach tài khoản con
                    arrayChil = [];
                    if(accountInfo.level != 1){
                        getValueCK({ accountInfo : accountInfo, parentID :accountInfo._id, parentName : accountInfo.name });
                        // Lấy  tổng đầu kì cho một tài khoản
                        // if(arrayAccountDK[accountInfo._id]){
                        //     accountInfo.openingAmountDebitAll = arrayAccountDK[accountInfo._id].amountPriceDebit || 0;
                        //     accountInfo.openingAmountCreditAll = arrayAccountDK[accountInfo._id].amountPriceCredit || 0;
                        // }else{
                        //     accountInfo.openingAmountDebitAll =  0;
                        //     accountInfo.openingAmountCreditAll = 0;
                        // }

                        // Lấy tổng trong kì cho một tài khoản
                        if(arrayAccountTK[accountInfo._id]){
                            accountInfo.amountDebitAll  = arrayAccountTK[accountInfo._id].amountPriceDebit || 0;
                            accountInfo.amountCreditAll = arrayAccountTK[accountInfo._id].amountPriceCredit || 0;
                        }else{
                            accountInfo.amountDebitAll  =  0;
                            accountInfo.amountCreditAll = 0;
                        }

                        // XỬ LÝ CHO TÀI KHOẢN  CÓ ĐẦU KÌ
                        // Nếu có thông tin về Đầu kì của tài khoản đang xét
                        let openingAmountDebitAll = 0, openingAmountCreditAll = 0;

                        if(arrayAccountDK[accountInfo._id]){

                            // Lấy tất cả khách hàng có nợ có trong tài khoản này
                            let key1 = Object.keys(arrayAccountDK[accountInfo._id]);
                        
                            // duyệt qua các khách hàng
                            for(let i =0; i<key1.length; i ++){
                                let  _index  = key1[i];
                                let customer = arrayAccountDK[accountInfo._id][_index];
                                
                                // Tính toán
                                //_________Số liệu cuối kỳ
                                // ccountInfo.openingAmountDebitAll = arrayAccountDK[accountInfo._id].amountPriceDebit || 0;
                                //     accountInfo.openingAmountCreditAll = arrayAccountDK[accountInfo._id].amountPriceCredit || 0;
                            
                                if((Number(customer.amountPriceDebit || 0).toFixed(0) - Number(customer.accountCrebit|| 0 ).toFixed(0)).toFixed(0)  > 0){
                                    let remainAmountDebit = Number(customer.amountPriceDebit || 0) - Number(customer.accountCrebit || 0)
                                    openingAmountDebitAll = Number(openingAmountDebitAll) + remainAmountDebit;
                                }
                                if((Number(customer.accountCrebit || 0).toFixed(0) - Number(customer.amountPriceDebit || 0 ).toFixed(0)).toFixed(0) > 0){
                                    let remainAmountCredit = Number(customer.accountCrebit || 0) - Number(customer.amountPriceDebit || 0)
                                    openingAmountCreditAll = Number(openingAmountCreditAll) + remainAmountCredit;
                                }	
                            }
                        }

                    
                        accountInfo.openingAmountCreditAll  =  openingAmountCreditAll;
                        accountInfo.openingAmountDebitAll =  openingAmountDebitAll;
                        arrayChil && arrayChil.forEach(item=>{
                            accountInfo.openingAmountCreditAll = Number(accountInfo.openingAmountCreditAll || 0) + Number(item.openingAmountCreditAll);
                            accountInfo.openingAmountDebitAll  = Number(accountInfo.openingAmountDebitAll  || 0) + Number(item.openingAmountDebitAll);
                        })
                        // Xử lý số liệu cuối kì

                        // Mặt định giá trị cuôi kì của mõi tài khoản là 0
                        let remainAmountDebitAll = 0, remainAmountCreditAll =0;
                        accountInfo.remainAmountDebitAll =  remainAmountDebitAll;
                        accountInfo.remainAmountCreditAll = remainAmountCreditAll;
                    
                        // XỬ LÝ CHO TÀI KHOẢN CUỐI KÌ
                        // Nếu có thông tin về cuôi kì của tài khoản đang xét
                        if(arrayAccountCK[accountInfo._id]){

                                // Lấy tất cả khách hàng có nợ có trong tài khoản này
                                let key1 = Object.keys(arrayAccountCK[accountInfo._id]);
                            
                                // duyệt qua các khách hàng
                                for(let i =0; i<key1.length; i ++){
                                    let  _index  = key1[i];
                                    let customer = arrayAccountCK[accountInfo._id][_index];
                                
                                    // Tính toán
                                    //_________Số liệu cuối kỳ
                                
                                    if(Number(customer.amountPriceDebit || 0) - Number(customer.amountPriceCredit|| 0 )  > 0){
                                        let remainAmountDebit = Number(customer.amountPriceDebit || 0) - Number(customer.amountPriceCredit || 0)
                                        remainAmountDebitAll = Number(remainAmountDebitAll) + remainAmountDebit;
                                    }
                                    if(Number(customer.amountPriceCredit || 0) - Number(customer.amountPriceDebit || 0 ) > 0){
                                        let remainAmountCredit = Number(customer.amountPriceCredit || 0) - Number(customer.amountPriceDebit || 0)
                                        remainAmountCreditAll = Number(remainAmountCreditAll) + remainAmountCredit
                                    }	
                                }
                            
                                // Tổng hợp theo tài khoản cha 
                                accountInfo.remainAmountDebitAll  =  remainAmountDebitAll;
                                accountInfo.remainAmountCreditAll =  remainAmountCreditAll;
                                if(!arrAccLT.includes(accountInfo.name)){
                                    if(Number(accountInfo.remainAmountDebitAll) > Number(accountInfo.remainAmountCreditAll)){
                                        accountInfo.remainAmountDebitAll    =   Number(remainAmountDebitAll) - Number(remainAmountCreditAll);;
                                        accountInfo.remainAmountCreditAll   = 0;
                                    }else{
                                        if(Number(accountInfo.remainAmountDebitAll) == Number(accountInfo.remainAmountCreditAll)){
                                            accountInfo.remainAmountDebitAll    =  0;
                                            accountInfo.remainAmountCreditAll   =  0;
                                        }else{
                                            accountInfo.remainAmountCreditAll   =  Number(remainAmountCreditAll) - Number(remainAmountDebitAll);
                                            accountInfo.remainAmountDebitAll    =  0;
                                        }
                                    }
                                }
                            
                                // accountInfo.plushValue  = true;
                            
                                // arrayChil && arrayChil.forEach(item=>{
                                //     accountInfo.remainAmountCreditAllChilds = Number(accountInfo.remainAmountCreditAllChilds || 0) + Number(item.remainAmountCreditAll);
                                //     accountInfo.remainAmountDebitAllChilds  = Number(accountInfo.remainAmountDebitAllChilds || 0) + Number(item.remainAmountDebitAll);
                                // })
                            
                                // newListAccount.push(accountInfo);
                        }

                        // Tổng hợp theo tài khoản cha  CUỐI KÌ
                        accountInfo.remainAmountDebitAll  =  remainAmountDebitAll;
                        accountInfo.remainAmountCreditAll =  remainAmountCreditAll;
                    
                        // accountInfo.plushValue  = true;
                    
                        arrayChil && arrayChil.forEach(item=>{
                            accountInfo.remainAmountCreditAllChilds = Number(accountInfo.remainAmountCreditAllChilds || 0) + Number(item.remainAmountCreditAll);
                            accountInfo.remainAmountDebitAllChilds  = Number(accountInfo.remainAmountDebitAllChilds  || 0) + Number(item.remainAmountDebitAll);
                        })

                        if(!arrAccLT.includes(accountInfo.name)){
                            if(Number(accountInfo.remainAmountDebitAll) > Number(accountInfo.remainAmountCreditAll)){
                                accountInfo.remainAmountDebitAll    =   Number(remainAmountDebitAll) - Number(remainAmountCreditAll);;
                                accountInfo.remainAmountCreditAll   = 0;
                            }else{
                                if(Number(accountInfo.remainAmountDebitAll) == Number(accountInfo.remainAmountCreditAll)){
                                    accountInfo.remainAmountDebitAll    =  0;
                                    accountInfo.remainAmountCreditAll   =  0;
                                }else{
                                    accountInfo.remainAmountCreditAll   =  Number(remainAmountCreditAll) - Number(remainAmountDebitAll);
                                    accountInfo.remainAmountDebitAll    =  0;
                                }
                            }
                        }
                    
                        // newListAccount.push(accountInfo);
                    }
                    const newInfoAccount = {
                        _id: accountInfo._id,
                        name: accountInfo.name,
                        description: accountInfo.description,
                        company: accountInfo.company,
                        childs: accountInfo.childs,
                        level: accountInfo.level,
                        state: accountInfo.state,
                        amountDebitAll: accountInfo.amountDebitAll,
                        amountCreditAll: accountInfo.amountCreditAll,
                        openingAmountCreditAll: accountInfo.openingAmountCreditAll,
                        openingAmountDebitAll: accountInfo.openingAmountDebitAll,
                        remainAmountCreditAll: accountInfo.remainAmountCreditAll,
                        remainAmountDebitAll: accountInfo.remainAmountDebitAll
                    }
                    return newInfoAccount;
                    // newListAccount = newListAccount.concat(arrayChil)
                });
                return resolve({ error: false, data :{
                    // infoFunda
                    projectID: undefined, fromDate, toDate,
                    listAccounts : newListAccount || [], 
                }, status: 200 })
            
            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOUNRAL][debtTrackingReport]: ${error} `);
                return resolve({ error: true, message: error.message, status: 400 })
            }
        });
    }

    // Danh sách công nợ
    debtTracking({ctx, companyID, fundaID, fromDate, toDate  }){
        return new Promise(async(resolve)=>{
            /**
            * BA
            * - LẤY CÂY TÀI KHOẢN KẾ TOÁN
            * - LẤY DỮ LIỆU ĐẦU KỲ
            * - LẤY DỮ LIỆU CUỐI KỲ
            * => Hiển thị dữ liệu theo dạng Cộng nợ: Mỗi Customer và Account sẽ chỉ tồn tại số dư cuối kỳ hoặc Bên NỢ hoặc bên CÓ
            */
            let listAccountsAsync    =  ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{  isNestedOfCompany: false, status : 1 })//ACCOUNT_MODEL.getListByCompany({ companyID, status : 1 });
            let listDataSAsyn        = this.getDataGroupByAccountAndContactS({ companyID, fundaID, fromDate });

            //  * - LẤY DỮ LIỆU TRONG KỲ
            let listDataAsyn         = this.getDataGroupByAccountAndContact({ companyID, fundaID, fromDate, toDate })
            
            const [  listAccounts, listDataS, listData ] = await Promise.all([ listAccountsAsync, listDataSAsyn, listDataAsyn ]);
            // Chuẩn bị các mãn
            let arrayAccountDK            = []; //  Danh sách thông tin giá trị tài khoản vào đầu kì :  đầu kì 1/1/năm_đang_xét + từ 1/1/năm_đang_xét -> date đang xét
            let arrayAccountTK            = []; //  Danh sách thông tin giá trị tài khoản trong kì : theo ngày đang xét 
            let arrayAccountCK            = []; //  Danh sách thông tin giá trị tài khoản cuối kì : Lưu ý tính toán phải dựa vào từng cập giá trị theo khách hàng

            // Tính toán số liệu đầu kì + tách công nợ theo từng khách hàng đầu kì
            function ToltalDK({ newDebit, newCredit, isLastPoint }){
                //TK nợ
                newDebit.forEach(async item=>{
                    
                    //  1.Tách theo từng đầu tài khoản sau đó gọp tổng lại
                    if( item && item._id && item._id.debit){
                    
                        let accountDebit = arrayAccountDK[item._id.debit];

                        // Nếu mà mãn đầu kì  có đầu tài khoản này thì cộng tiếp 
                        // Lưu vào  arrayAccountDK để sau này dễ lấy ra

                        let  customerID  = item._id.customerDebit;
                        if(accountDebit){
                            if(accountDebit[customerID]){
                                accountDebit[customerID].amountPriceDebit = Number( accountDebit[customerID].amountPriceDebit || 0 ) + Number(item.amountPrice || 0);    
                            }else{
                                accountDebit[customerID] = {};
                                accountDebit[customerID].amountPriceDebit = Number(item.amountPrice || 0);
                                accountDebit[customerID].customer = customerID;
                            }
                            // accountDebit.amountPrice        = Number(accountDebit.amountPrice || 0)  + Number(item.amountPrice || 0);
                            // accountDebit.amountPriceDebit   = Number(accountDebit.amountPriceDebit || 0) + Number(item.amountPrice || 0);
                        }else{
                        // Nếu chưa có thì khởi tạo thông tin cho tài khoản
                        //Llưu vào  arrayAccountDK để sau này dễ lấy ra
                        
                            arrayAccountDK[item._id.debit]                    = {};
                            arrayAccountDK[item._id.debit][customerID]        = {};

                            // arrayAccountDK[item._id.debit][customerID].amountPrice        = Number(item.amountPrice || 0);
                            arrayAccountDK[item._id.debit][customerID].amountPriceDebit   = Number(item.amountPrice || 0);
                            arrayAccountDK[item._id.debit][customerID].customerDebit      = item._id.customerDebit;
                            arrayAccountDK[item._id.debit][customerID].debit              = item._id.debit;
                        }
                        

                        // Tách tài khoản theo từng đầu công nợ theo từng khách hàng
                        // Xử lý mãng khách hàng theo từng đầu tài khoảng cho tính toán cuối kỳ 
                        // Cách thức tương tự chạy kế chuyển : [CF_ROUTINGS_FINANCIAL.FORWORD_UPDATE_22]
                        // Xử dụng một mãn : arrayAccountCK  cuối kỳ để lưu thông tin của khách hàng sau này tiện tính toán

                        let accountCK = arrayAccountCK[item._id.debit];

                        // Nếu đầu tài khoản đã có 
                        if(accountCK){
                            let  customerID  = item._id.customerDebit;

                            // Nếu đầu tài khoản này đã có khách hàng này 
                            if(accountCK[customerID]){
                                accountCK[customerID].amountPriceDebit = Number( accountCK[customerID].amountPriceDebit || 0) + Number(item.amountPrice || 0);    
                            }else{
                                
                                // Nếu chưa có thì tạo mới thông tin khách hàng trong tài khoản này theo bên nợ vì đang duyệt mãng debitx
                                accountCK[customerID] = {};
                                accountCK[customerID].amountPriceDebit = Number(item.amountPrice || 0);
                                accountCK[customerID].customer = customerID;
                            }

                        }else{

                            // Nếu đầu tài khoản chưa có thì tạo đầu tài khoản kèm theo khách hàng đang xét
                            arrayAccountCK[item._id.debit] = {};
                            arrayAccountCK[item._id.debit][item._id.customerDebit] = {};
                            arrayAccountCK[item._id.debit][item._id.customerDebit].customer = item._id.customerDebit;
                            arrayAccountCK[item._id.debit][item._id.customerDebit].amountPriceDebit = Number(item.amountPrice || 0); //  openingS + Dk
                        }
                
                    }
                })

                // Tương tự phần debit nhưng đổi các gía trị lưu thành creadit
                newCredit.forEach(async item=>{
                
                    if( item && item._id && item._id.credit){
                    
                        let accountCrebit = arrayAccountDK[item._id.credit]
                    

                        // if(accountCrebit){
                        //     accountCrebit.amountPrice             =  Number(accountCrebit.amountPrice  || 0) - Number(item.amountPrice || 0);
                        //     accountCrebit.amountPriceCredit       =  Number(accountCrebit.amountPriceCredit || 0 ) + Number(item.amountPrice || 0);
                        // }else{
                        //     arrayAccountDK[item._id.credit]                    = {};
                        //     arrayAccountDK[item._id.credit].amountPrice        = Number(item.amountPrice || 0);
                        //     arrayAccountDK[item._id.credit].amountPriceCredit  = Number(item.amountPrice || 0);
                        //     arrayAccountDK[item._id.credit].customerCredit     = item._id.customerCredit;
                        //     arrayAccountDK[item._id.credit].credit             = item._id.credit;
                        // }

                        let  customerID  = item._id.customerCredit;
                        if(arrayAccountDK[item._id.credit]){
                            if(arrayAccountDK[item._id.credit][customerID]){
                                arrayAccountDK[item._id.credit][customerID].accountCrebit = Number( arrayAccountDK[item._id.credit][customerID].accountCrebit || 0 ) + Number(item.amountPrice || 0);    
                            }else{
                                arrayAccountDK[item._id.credit][customerID] = {};
                                arrayAccountDK[item._id.credit][customerID].accountCrebit = Number(item.amountPrice || 0);
                                arrayAccountDK[item._id.credit][customerID].customer = customerID;
                            }
                            // accountCrebit.amountPrice        = Number(accountCrebit.amountPrice || 0)  + Number(item.amountPrice || 0);
                            // accountCrebit.amountPriceDebit   = Number(accountCrebit.amountPriceDebit || 0) + Number(item.amountPrice || 0);
                        }else{
                        // Nếu chưa có thì khởi tạo thông tin cho tài khoản
                        //Llưu vào  arrayAccountDK để sau này dễ lấy ra
                        
                            arrayAccountDK[item._id.credit]                    = {};
                            arrayAccountDK[item._id.credit][customerID]        = {};

                            arrayAccountDK[item._id.credit][customerID].amountPrice        =  0 - Number(item.amountPrice || 0);
                            arrayAccountDK[item._id.credit][customerID].accountCrebit   = Number(item.amountPrice || 0);
                            arrayAccountDK[item._id.credit][customerID].customerCredit      = item._id.customerCredit;
                            arrayAccountDK[item._id.credit][customerID].credit              = item._id.credit;
                        }

                        // Xử lý mãng khách hàng theo từng đầu tài khoảng cho tính toán cuối kỳ
                        let accountCK = arrayAccountCK[item._id.credit];
                        if(accountCK){
                            let  customerID  = item._id.customerCredit;
                            if(accountCK[customerID]){
                                accountCK[customerID].amountPriceCredit = Number(accountCK[customerID].amountPriceCredit || 0) + Number(item.amountPrice || 0);    
                            }else{
                                accountCK[customerID] = {};
                                accountCK[customerID].amountPriceCredit = Number(item.amountPrice || 0);
                                accountCK[customerID].customer = customerID;
                            }

                        }else{
                            arrayAccountCK[item._id.credit] = {};
                            arrayAccountCK[item._id.credit][item._id.customerCredit] = {};
                            arrayAccountCK[item._id.credit][item._id.customerCredit].customer          = item._id.customerCredit;
                            arrayAccountCK[item._id.credit][item._id.customerCredit].amountPriceCredit = Number(item.amountPrice || 0); //  openingS + Dk
                        }
                
                    }
                });
            }
        
            // Xử lý trong kì tương tự đầu kì
            function ToltalTK({ newDebit, newCredit }){
        
                newDebit.forEach(item=>{

                    //  1.Nếu đã có customer đó rồi thì xử lý cộng thêm số
                    if( item && item._id && item._id.debit){
                        let accountDebit = arrayAccountTK[item._id.debit];

                        if(accountDebit){
                            accountDebit.amountPrice        = Number(accountDebit.amountPrice || 0) + Number(item.amountPrice || 0);
                            accountDebit.amountPriceDebit   = Number(accountDebit.amountPriceDebit || 0) + Number(item.amountPrice || 0);
                        }else{
                            arrayAccountTK[item._id.debit]                    = {};
                            arrayAccountTK[item._id.debit].amountPrice        = Number(item.amountPrice || 0);
                            arrayAccountTK[item._id.debit].amountPriceDebit   = Number(item.amountPrice || 0);
                            arrayAccountTK[item._id.debit].customerDebit      = item._id.customerDebit;
                            arrayAccountTK[item._id.debit].debit              = item._id.debit;
                        }

                        // Xử lý mãng khách hàng theo từng đầu tài khoảng cho tính toán cuối kỳ
                        let accountCK = arrayAccountCK[item._id.debit];

                        if(accountCK){
                            let  customerID  = item._id.customerDebit;

                            if(accountCK[customerID]){
                                accountCK[customerID].amountPriceDebit = Number( accountCK[customerID].amountPriceDebit || 0 ) + Number(item.amountPrice || 0);    
                            }else{
                                accountCK[customerID] = {};
                                accountCK[customerID].amountPriceDebit = Number(item.amountPrice || 0);
                                accountCK[customerID].customer = customerID;
                            }
                        }else{
                            arrayAccountCK[item._id.debit] = {};
                            arrayAccountCK[item._id.debit][item._id.customerDebit] = {};
                            arrayAccountCK[item._id.debit][item._id.customerDebit].customer = item._id.customerDebit;
                            arrayAccountCK[item._id.debit][item._id.customerDebit].amountPriceDebit = Number(item.amountPrice || 0); //  openingS + Dk
                        }
                    }
                })

                newCredit.forEach(item=>{

                    if( item && item._id && item._id.credit){

                        let accountCrebit = arrayAccountTK[item._id.credit]

                        if(accountCrebit){
                            accountCrebit.amountPrice             =  Number(accountCrebit.amountPrice  || 0) - Number(item.amountPrice || 0);
                            accountCrebit.amountPriceCredit       =  Number(accountCrebit.amountPriceCredit || 0 ) + Number(item.amountPrice || 0);
                        }else{
                            arrayAccountTK[item._id.credit]                    = {};
                            arrayAccountTK[item._id.credit].amountPrice        = Number(item.amountPrice || 0);
                            arrayAccountTK[item._id.credit].amountPriceCredit  = Number(item.amountPrice || 0);
                            arrayAccountTK[item._id.credit].customerCredit     = item._id.customerCredit;
                            arrayAccountTK[item._id.credit].credit             = item._id.credit;
                        }

                        // Xử lý mãng khách hàng theo từng đầu tài khoảng cho tính toán cuối kỳ
                        let accountCK = arrayAccountCK[item._id.credit];

                        if(accountCK){
                            let  customerID  = item._id.customerCredit;

                            if(accountCK[customerID]){
                                accountCK[customerID].amountPriceCredit = Number(accountCK[customerID].amountPriceCredit || 0 ) + Number(item.amountPrice || 0);    
                            }else{
                                accountCK[customerID] = {};
                                accountCK[customerID].amountPriceCredit = Number(item.amountPrice || 0);
                                accountCK[customerID].customer = customerID;
                            }
                        }else{
                            arrayAccountCK[item._id.credit] = {};
                            arrayAccountCK[item._id.credit][item._id.customerCredit] = {};
                            arrayAccountCK[item._id.credit][item._id.customerCredit].customer          = item._id.customerCredit;
                            arrayAccountCK[item._id.credit][item._id.customerCredit].amountPriceCredit = Number(item.amountPrice || 0); //  openingS + Dk
                        }
                    }else{
                        // console.log({s : arrayAccount[ item._id.credit]})
                    }
                
                })
            }

            // Xử dụng để tính toán giá trị cuối kì cho các tài khoản có  tài khoản con
            function getValueCK({  accountInfo, parentID, parentName  }){

                // Nếu tài  khoản đó có tài khoản con
                if(accountInfo && accountInfo.childs){

                    // Kiểm tra nếu chưa có trong mãn cuối kì thì tiến hành tạo cho tài khoản cha một phần tử trong mãn.
                    // Lý do tài khoản cha chưa có : do tất cả công nợ nằm hết tài khoản con

                    // Tạo nếu không có giá trị đầu kì
                    if(!arrayAccountDK[parentID]){
                        arrayAccountDK[parentID]                    = {};
                        // arrayAccountDK[parentID].amountPrice        = 0;
                        // arrayAccountDK[parentID].amountPriceDebit   = 0;
                        // arrayAccountDK[parentID].amountPriceCredit  = 0;
                        // arrayAccountDK[parentID].debit              = parentID;
                    }

                    // Tạo nếu không có giá trị trong kì
                    if(!arrayAccountTK[parentID]){
                        arrayAccountTK[parentID]                    = {};
                        arrayAccountTK[parentID].amountPrice        = 0;
                        arrayAccountTK[parentID].amountPriceDebit   = 0;
                        arrayAccountTK[parentID].amountPriceCredit  = 0;
                        arrayAccountTK[parentID].credit             = parentID;
                    }

                    // Nếu chưa có giá trị cuối kì
                    if(!arrayAccountCK[parentID]){
                        arrayAccountCK[parentID] = {}
                    }

                    // Duyệt mãng của những tài khoản con
                    accountInfo.childs.forEach(accountChil=>{
                    
                        if(accountChil.status == 1){
                        
                            // Kiểm tra nếu tài khoản con có giá trị công nợ đầu kì thì tiến hành cộng dồn cho tài khoản cha
                            if(arrayAccountDK[accountChil._id]){
                                // XỬ LÝ CHO TÀI KHOẢN  CÓ ĐẦU KÌ
                                // Nếu có thông tin về Đầu kì của tài khoản đang xét
                                let openingAmountDebitAll = 0, openingRemainAmountCreitAll = 0;
                                // Lấy tất cả khách hàng có nợ có trong tài khoản này
                                let key1 = Object.keys(arrayAccountDK[accountChil._id]);
                            
                                // duyệt qua các khách hàng
                                for(let i =0; i<key1.length; i ++){
                                    let  _index  = key1[i];
                                    let customer = arrayAccountDK[accountChil._id][_index];
                                
                                    if(Number(customer.amountPriceDebit || 0) - Number(customer.accountCrebit|| 0 )  > 0){
                                        let remainAmountDebit = Number(customer.amountPriceDebit || 0) - Number(customer.accountCrebit || 0)
                                        openingAmountDebitAll = Number(openingAmountDebitAll) + remainAmountDebit;
                                    
                                    }
                                    if(Number(customer.accountCrebit || 0) - Number(customer.amountPriceDebit || 0 ) > 0){
                                        let remainAmountCredit = Number(customer.accountCrebit || 0) - Number(customer.amountPriceDebit || 0)
                                        openingRemainAmountCreitAll = Number(openingRemainAmountCreitAll) + remainAmountCredit
                                    }	
                                }
                                // Lấy  tổng đầu kì cho một tài khoản
                                accountChil.openingAmountDebitAll = openingAmountDebitAll || 0;
                                accountChil.openingAmountCreditAll = openingRemainAmountCreitAll || 0;
                                // accountInfo.openingAmountCreditAll  =  openingRemainAmountCreitAll;
                                // accountInfo.openingAmountDebitAll =  openingAmountDebitAll;
                                arrayAccountDK[parentID].openingAmountDebitAll  = Number(arrayAccountDK[parentID].openingAmountDebitAll || 0) + Number(arrayAccountDK[accountChil._id].openingAmountDebitAll || 0);
                                arrayAccountDK[parentID].openingAmountCreditAll = Number(arrayAccountDK[parentID].openingAmountCreditAll || 0) + Number(arrayAccountDK[accountChil._id].openingAmountDebitAll || 0);
                            }else{
                                accountChil.openingAmountDebitAll =  0;
                                accountChil.openingAmountCreditAll = 0;
                            }

                            // Kiểm tra nếu tài khoản con có giá trị công nợ trong kì thì tiến hành cộng dồn cho tài khoản cha
                            if(arrayAccountTK[accountChil._id]){
                                arrayAccountTK[parentID].amountPriceDebit = Number(arrayAccountTK[parentID].amountPriceDebit || 0) + Number( arrayAccountTK[accountChil._id].amountPriceDebit || 0);
                                arrayAccountTK[parentID].amountPriceCredit = Number( arrayAccountTK[parentID].amountPriceCredit || 0) + Number( arrayAccountTK[accountChil._id].amountPriceCredit || 0);
                            }
                        
                            // Xử lý cuối kì
                            // Duyệt hết tất cả các khách hàng của tài khoản con
                            if(arrayAccountCK[accountChil._id]){
                                let key1 = Object.keys(arrayAccountCK[accountChil._id]);
                                for(let i =0; i<key1.length; i ++){
                                    let  _index  = key1[i]
                                    let customer = arrayAccountCK[accountChil._id][_index]
                                    if(arrayAccountCK[parentID][_index]){
                                        arrayAccountCK[parentID][_index].amountPriceDebit  =  Number( arrayAccountCK[parentID][_index].amountPriceDebit || 0) + Number(customer.amountPriceDebit|| 0);
                                        arrayAccountCK[parentID][_index].amountPriceCredit =  Number( arrayAccountCK[parentID][_index].amountPriceCredit || 0) + Number(customer.amountPriceCredit|| 0);
                                    }else{
                                        arrayAccountCK[parentID][_index] = {}
                                        arrayAccountCK[parentID][_index].amountPriceDebit  =  Number( arrayAccountCK[parentID][_index].amountPriceDebit || 0) + Number(customer.amountPriceDebit|| 0);
                                        arrayAccountCK[parentID][_index].amountPriceCredit =  Number( arrayAccountCK[parentID][_index].amountPriceCredit || 0) + Number(customer.amountPriceCredit|| 0);
                                    }
                                }
                            }

                        

                            // Lấy tổng trong kì cho một tài khoản
                            if(arrayAccountTK[accountChil._id]){
                                accountChil.amountDebitAll = arrayAccountTK[accountChil._id].amountPriceDebit || 0;
                                accountChil.amountCreditAll = arrayAccountTK[accountChil._id].amountPriceCredit || 0;
                            }else{
                                accountChil.amountDebitAll =  0;
                                accountChil.amountCreditAll = 0;
                            }
                            
                            // Xử lý số liệu cuối kì

                            // Mặt định giá trị cuôi kì của mõi tài khoản là 0
                            let remainAmountDebitAll = 0, remainAmountCreditAll =0;
                            accountChil.remainAmountDebitAll =  remainAmountDebitAll;
                            accountChil.remainAmountCreditAll = remainAmountCreditAll;

                            // Nếu có thông tin về cuôi kì của tài khoản đang xét
                            if(arrayAccountCK[accountChil._id]){
                                
                                    // Lấy tất cả khách hàng có nợ có trong tài khoản này
                                    let key1 = Object.keys(arrayAccountCK[accountChil._id]);
                                
                                    // duyệt qua các khách hàng
                                    for(let i =0; i<key1.length; i ++){
                                        let  _index  = key1[i];
                                        let customer = arrayAccountCK[accountChil._id][_index];
                                    
                                        // Tính toán
                                        //_________Số liệu cuối kỳ
                                    
                                        if(Number(customer.amountPriceDebit || 0) - Number(customer.amountPriceCredit|| 0 )  > 0){
                                            let remainAmountDebit = Number(customer.amountPriceDebit || 0) - Number(customer.amountPriceCredit || 0)
                                            remainAmountDebitAll = Number(remainAmountDebitAll) + remainAmountDebit;
                                        }
                                        if(Number(customer.amountPriceCredit || 0) - Number(customer.amountPriceDebit || 0 ) > 0){
                                            let remainAmountCredit = Number(customer.amountPriceCredit || 0) - Number(customer.amountPriceDebit || 0)
                                            remainAmountCreditAll = Number(remainAmountCreditAll) + remainAmountCredit
                                        }	
                                    }
                                
                                    // Tổng hợp theo tài khoản cha 
                                    accountChil.remainAmountDebitAll  =  remainAmountDebitAll;
                                    accountChil.remainAmountCreditAll =  remainAmountCreditAll;
                                
                                    if(!arrAccLT.includes(parentName)){
                                        if(Number(accountChil.remainAmountDebitAll) > Number(accountChil.remainAmountCreditAll)){
                                            accountChil.remainAmountDebitAll    =   Number(remainAmountDebitAll) - Number(remainAmountCreditAll);;
                                            accountChil.remainAmountCreditAll   = 0;
                                        }else{
                                            if(Number(accountChil.remainAmountDebitAll) == Number(accountChil.remainAmountCreditAll)){
                                                accountChil.remainAmountDebitAll    =  0;
                                                accountChil.remainAmountCreditAll   =  0;
                                            }else{
                                                accountChil.remainAmountCreditAll   =  Number(remainAmountCreditAll) - Number(remainAmountDebitAll);
                                                accountChil.remainAmountDebitAll    =  0;
                                            }
                                        }
                                    }
                                    const newInfoAccountChild = {
                                        _id: accountChil._id,
                                        name: accountChil.name,
                                        description: accountChil.description,
                                        company: accountChil.company,
                                        childs: accountChil.childs,
                                        level: accountChil.level,
                                        state: accountChil.state,
                                        amountDebitAll: accountChil.amountDebitAll,
                                        amountCreditAll: accountChil.amountCreditAll,
                                        openingAmountCreditAll: accountChil.openingAmountCreditAll,
                                        openingAmountDebitAll: accountChil.openingAmountDebitAll,
                                        remainAmountCreditAll: accountChil.remainAmountCreditAll,
                                        remainAmountDebitAll: accountChil.remainAmountDebitAll,
                                        // remainAmountDebitAllChilds: accountChil.remainAmountDebitAllChilds,
                                        // remainAmountCreditAllChilds: accountChil.remainAmountCreditAllChilds
                                    }
                                    arrayChil.push(newInfoAccountChild)
                            }else{
                            
                                // Tổng hợp theo tài khoản cha 
                                accountChil.remainAmountDebitAll  =  0;
                                accountChil.remainAmountCreditAll =  0;
                                const newInfoAccountChild = {
                                    _id: accountChil._id,
                                    name: accountChil.name,
                                    description: accountChil.description,
                                    company: accountChil.company,
                                    childs: accountChil.childs,
                                    level: accountChil.level,
                                    state: accountChil.state,
                                    amountDebitAll: accountChil.amountDebitAll,
                                    amountCreditAll: accountChil.amountCreditAll,
                                    openingAmountCreditAll: accountChil.openingAmountCreditAll,
                                    openingAmountDebitAll: accountChil.openingAmountDebitAll,
                                    remainAmountCreditAll: accountChil.remainAmountCreditAll,
                                    remainAmountDebitAll: accountChil.remainAmountDebitAll,
                                    // remainAmountDebitAllChilds: accountChil.remainAmountDebitAllChilds,
                                    // remainAmountCreditAllChilds: accountChil.remainAmountCreditAllChilds
                                }
                                arrayChil.push(newInfoAccountChild)
                            }
                        
                            // Nếu tài khoản con còn các tài khoản con nữa thì tiếp tục làm duyệt qua
                            if(accountChil.childs){
                                getValueCK({  accountInfo : accountChil, parentID  })
                            }
                        }   
                    })
                    
                }
                
            }


            // Danh sách các tài khoản lưỡng tính
            // let arrAccLT = ['128','131','136','138','141','331','334','335','336','338','341']
            let arrAccLT = [];
            let arrAccLTObject  =  await  ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_AND_GET_LIST}`,
            { limit: '20', status : 1, type : 2, level : 1, isAccountingService: true })
                
            if(arrAccLTObject.error)
                return resolve({ error: true, message: `DebtTrackingReport error: ${arrAccLTObject.message}`, status: 400 })
                arrAccLTObject.data.listRecords.forEach(item=> { 
                arrAccLT.push(item.name)
            });

            // 1.XỬ LÝ SỐ LIỆU ĐẦU KỲ.(kèm theo lưu thông tin của khách hàng theo từng đầu tài khoản  phục vụ việc tổng hợp CUỐI KÌ)
            ToltalDK({ newDebit : (listDataS.dataS && listDataS.dataS._debit) || [] , newCredit : (listDataS.dataS && listDataS.dataS._credit) || [] })
            ToltalDK({ newDebit : (listDataS.data && listDataS.data._debit) || [] , newCredit : (listDataS.data && listDataS.data._credit) || [] })
            
            // 2.XỬ LÝ SỐ LIỆU TRONG KỲ.(kèm theo lưu thông tin của khách hàng theo từng đầu tài khoản  phục vụ việc tổng hợp CUỐI KÌ)
            ToltalTK({ newDebit : (listData.data && listData.data._debit) || [] , newCredit : (listData.data && listData.data._credit) || [] })

            // 3.DUYỆT QUA TỪNG TÀI KHOẢN ĐỂ TỔNG HỢP CÔNG NỢ CUỐI CÙNG (ĐẦU KÌ ; TRONG KÌ; CUỐI KÌ).
            let newListAccount = []
            let arrayChil = [];

            listAccounts && listAccounts.data && listAccounts.data.forEach(accountInfo=>{   
                if(arrAccLT.includes(accountInfo.name)){
                    arrayChil = [];
                    // Kiểm tra trường hợp có  danh sach tài khoản con
                    getValueCK({ accountInfo : accountInfo, parentID :accountInfo._id, parentName : accountInfo.name });
                
                    // Lấy  tổng đầu kì cho một tài khoản
                    // if(arrayAccountDK[accountInfo._id]){
                    //     accountInfo.openingAmountDebitAll = arrayAccountDK[accountInfo._id].amountPriceDebit || 0;
                    //     accountInfo.openingAmountCreditAll = arrayAccountDK[accountInfo._id].amountPriceCredit || 0;
                    // }else{
                    //     accountInfo.openingAmountDebitAll =  0;
                    //     accountInfo.openingAmountCreditAll = 0;
                    // }

                    // Lấy tổng trong kì cho một tài khoản
                    if(arrayAccountTK[accountInfo._id]){
                        accountInfo.amountDebitAll  = arrayAccountTK[accountInfo._id].amountPriceDebit || 0;
                        accountInfo.amountCreditAll = arrayAccountTK[accountInfo._id].amountPriceCredit || 0;
                    }else{
                        accountInfo.amountDebitAll  =  0;
                        accountInfo.amountCreditAll = 0;
                    }

                    // XỬ LÝ CHO TÀI KHOẢN  CÓ ĐẦU KÌ
                    // Nếu có thông tin về Đầu kì của tài khoản đang xét
                    let openingAmountDebitAll = 0, openingRemainAmountCreitAll = 0;

                    if(arrayAccountDK[accountInfo._id]){
                        
                        // Lấy tất cả khách hàng có nợ có trong tài khoản này
                        let key1 = Object.keys(arrayAccountDK[accountInfo._id]);
                    
                        // duyệt qua các khách hàng
                        for(let i =0; i<key1.length; i ++){
                            let  _index  = key1[i];
                            let customer = arrayAccountDK[accountInfo._id][_index];
                        
                            if(Number(customer.amountPriceDebit || 0) - Number(customer.accountCrebit|| 0 )  > 0){
                                let remainAmountDebit = Number(customer.amountPriceDebit || 0) - Number(customer.accountCrebit || 0)
                                openingAmountDebitAll = Number(openingAmountDebitAll) + remainAmountDebit;
                                
                            }
                            if(Number(customer.accountCrebit || 0) - Number(customer.amountPriceDebit || 0 ) > 0){
                                let remainAmountCredit      = Number(customer.accountCrebit || 0) - Number(customer.amountPriceDebit || 0)
                                openingRemainAmountCreitAll = Number(openingRemainAmountCreitAll) + remainAmountCredit
                                
                            }	
                        }
                        
                    }
                        
                    accountInfo.openingAmountCreditAll  =  openingRemainAmountCreitAll;
                    accountInfo.openingAmountDebitAll   =  openingAmountDebitAll;

                    

                    arrayChil && arrayChil.forEach(item=>{
                        accountInfo.openingAmountCreditAll = Number(accountInfo.openingAmountCreditAll || 0) + Number(item.openingAmountCreditAll || 0);
                        accountInfo.openingAmountDebitAll  = Number(accountInfo.openingAmountDebitAll || 0) + Number(item.openingAmountDebitAll || 0);
                    })
                    
                    // Xử lý số liệu cuối kì

                    // Mặt định giá trị cuôi kì của mõi tài khoản là 0
                    let remainAmountDebitAll = 0, remainAmountCreditAll =0;
                    accountInfo.remainAmountDebitAll    =  remainAmountDebitAll;
                    accountInfo.remainAmountCreditAll   = remainAmountCreditAll;
                    
                    // Nếu có thông tin về cuôi kì của tài khoản đang xét
                    if(arrayAccountCK[accountInfo._id]){

                            // Lấy tất cả khách hàng có nợ có trong tài khoản này
                            let key1 = Object.keys(arrayAccountCK[accountInfo._id]);
                        
                            // duyệt qua các khách hàng
                            for(let i =0; i<key1.length; i ++){
                                let  _index  = key1[i];
                                let customer = arrayAccountCK[accountInfo._id][_index];
                            
                                // Tính toán
                                //_________Số liệu cuối kỳ
                            
                                if(Number(customer.amountPriceDebit || 0) - Number(customer.amountPriceCredit|| 0 )  > 0){
                                    let remainAmountDebit = Number(customer.amountPriceDebit || 0) - Number(customer.amountPriceCredit || 0)
                                    remainAmountDebitAll  = Number(remainAmountDebitAll) + remainAmountDebit;
                                }
                                if(Number(customer.amountPriceCredit || 0) - Number(customer.amountPriceDebit || 0 ) > 0){
                                    let remainAmountCredit = Number(customer.amountPriceCredit || 0) - Number(customer.amountPriceDebit || 0)
                                    remainAmountCreditAll  = Number(remainAmountCreditAll) + remainAmountCredit
                                }	
                            }
                        
                            // Tổng hợp theo tài khoản cha 
                            accountInfo.remainAmountDebitAll  =  remainAmountDebitAll;
                            accountInfo.remainAmountCreditAll =  remainAmountCreditAll;
                            if(!arrAccLT.includes(accountInfo.name)){
                                if(Number(accountInfo.remainAmountDebitAll) > Number(accountInfo.remainAmountCreditAll)){
                                    accountInfo.remainAmountDebitAll    =   Number(remainAmountDebitAll) - Number(remainAmountCreditAll);;
                                    accountInfo.remainAmountCreditAll   = 0;
                                }else{
                                    if(Number(accountInfo.remainAmountDebitAll) == Number(accountInfo.remainAmountCreditAll)){
                                        accountInfo.remainAmountDebitAll    =  0;
                                        accountInfo.remainAmountCreditAll   =  0;
                                    }else{
                                        accountInfo.remainAmountCreditAll   =  Number(remainAmountCreditAll) - Number(remainAmountDebitAll);
                                        accountInfo.remainAmountDebitAll    =  0;
                                    }
                                }
                            }
                            accountInfo.plushValue  = true;
                            
                            arrayChil && arrayChil.forEach(item=>{
                                accountInfo.remainAmountCreditAllChilds = Number(accountInfo.remainAmountCreditAllChilds || 0) + Number(item.remainAmountCreditAll);
                                accountInfo.remainAmountDebitAllChilds  = Number(accountInfo.remainAmountDebitAllChilds || 0) + Number(item.remainAmountDebitAll);
                            })

                            const newInfoAccount = {
                                _id: accountInfo._id,
                                name: accountInfo.name,
                                description: accountInfo.description,
                                company: accountInfo.company,
                                childs: accountInfo.childs,
                                level: accountInfo.level,
                                state: accountInfo.state,
                                amountDebitAll: accountInfo.amountDebitAll,
                                amountCreditAll: accountInfo.amountCreditAll,
                                openingAmountCreditAll: accountInfo.openingAmountCreditAll,
                                openingAmountDebitAll: accountInfo.openingAmountDebitAll,
                                remainAmountCreditAll: accountInfo.remainAmountCreditAll,
                                remainAmountDebitAll: accountInfo.remainAmountDebitAll,
                                remainAmountDebitAllChilds: accountInfo.remainAmountDebitAllChilds,
                                remainAmountCreditAllChilds: accountInfo.remainAmountCreditAllChilds
                            }
                            
                            newListAccount.push(newInfoAccount);
                    }
                     
                }
            });
            return resolve({ error: false, data: { listAccount: newListAccount } });
        });
    }

    //_________DANH SÁCH KHÁCH HÀNG THỰC HIỆN GIAO DỊCH TRONG KỲ 
    // Tính năng sử dụng: Theo dõi công nợ
    // Author: HiepNH
    getListContactOfCompanyGroupByAccount({companyID, fundaID, contractID, accountID, toDate}) {
        const that = this;
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * 1. Gồm cả phiếu kết chuyển cuối kỳ của Khách hàng qua các năm
                 * 2. Do có 1 số khách hàng chỉ phát sinh tới cuối kỳ trước
                 */
                //____________Get nestedArray of account
                // let arrObjectID = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{ accountID, isNestedOfCompany: true }); 
                
                let conditionObj;

                if(!fundaID){
                    if(!contractID){
                        conditionObj = { 
                            company: companyID,
                            // forward: 0, 
                            cancel: 0,
                            date: { $lte: moment(toDate).toDate() }
                        }
                    }else{
                        conditionObj = { 
                            // company: companyID,
                            contract: contractID,
                            // forward: 0,
                            cancel: 0,
                            date: { $lte: moment(toDate).toDate() }
                        }
                    }
                }else{
                    if(!contractID){
                        conditionObj = { 
                            funda: fundaID,
                            // forward: 0,
                            cancel: 0,
                            date: { $lte: moment(toDate).toDate() }
                        }
                    }else{
                        conditionObj = { 
                            // funda: fundaID,
                            contract: contractID,
                            // forward: 0,
                            cancel: 0,
                            date: { $lte: moment(toDate).toDate() }
                        }
                    }
                }

                let listData1 = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $match: {
                            conditionObj
                        }
                    }, 
                    {
                        $group: {
                            _id: { contact: '$customerDebit' },
                        }
                    } 
                ])
                let listData2 = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $match: {
                            conditionObj
                        }
                    }, 
                    {
                        $group: {
                            _id: { contact: '$customerCredit' },
                        }
                    } 
                ])

                let arrCustomers = []
                for(const item of listData1){
                    if(!arrCustomers.includes(item._id.contact.toString())){
                        arrCustomers.push(item._id.contact.toString())
                    }
                }
                for(const item of listData2){
                    if(!arrCustomers.includes(item._id.contact.toString())){
                        arrCustomers.push(item._id.contact.toString())
                    }
                }

                // let listData = await CONTACT_COLL.find({_id: {$in: arrCustomers}}).select('_id name sign phone taxid')
                // console.log(listData)
              
                return resolve({ error: false, data: arrCustomers });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    } 

    //_________CÔNG NỢ ĐẦU KỲ PHÂN LOẠI THEO KHÁCH HÀNG (OK)
    // Tính năng sử dụng: Theo dõi công nợ
    // Author: HiepNH
    getListOpeningCombineGroupByAccountAndContact({ ctx, companyID, fundaID, contractID, accountID, fromDate }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                //____________Get nestedArray of account
                let arrObjectID = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{ accountID, isNestedOfCompany: true }); 
                let conditionObj1;
                let conditionObj2;

                //____________Lấy năm của ngày đầu kỳ
                let year = moment(fromDate).toDate().getFullYear() //!!!!Xem xét sao không lấy năm của ngày bắt đầu (sẽ áp dụng được cho kỳ kéo dài nhiều năm)
                let firstDayOfYear = `${Number(year)}-01-01T00:00:00.000Z`
                if(!fundaID){
                    if(!contractID){
                        conditionObj1 = {
                            company: ObjectID(companyID),
                            debit:  {
                                $in: arrObjectID.data
                            }
                        }
                        conditionObj2 = {
                            company: ObjectID(companyID),
                            credit:  {
                                $in: arrObjectID.data
                            }
                        }
                    }else{
                        conditionObj1 = {
                            company: ObjectID(companyID),
                            contract: ObjectID(contractID),
                            debit:  {
                                $in: arrObjectID.data
                            }
                        }
                        conditionObj2 = {
                            company: ObjectID(companyID),
                            contract: ObjectID(contractID),
                            credit:  {
                                $in: arrObjectID.data
                            }
                        }
                    }
                }else{
                    if(!contractID){
                        conditionObj1 = {
                            funda: ObjectID(fundaID),
                            debit:  {
                                $in: arrObjectID.data
                            }
                        }
                        conditionObj2 = {
                            funda: ObjectID(fundaID),
                            credit:  {
                                $in: arrObjectID.data
                            }
                        }
                    }else{
                        conditionObj1 = {
                            funda: ObjectID(fundaID),
                            contract: ObjectID(contractID),
                            debit:  {
                                $in: arrObjectID.data
                            }
                        }
                        conditionObj2 = {
                            funda: ObjectID(fundaID),
                            contract: ObjectID(contractID),
                            credit:  {
                                $in: arrObjectID.data
                            }
                        }
                    }
                }
                let listDataS = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionObj1
                                }, 
                                {
                                    $project : { 
                                        year : {$year : "$date"},
                                        customerDebit:'$customerDebit',
                                        debit:'$debit',
                                        contract:'$contract',
                                        funda:'$funda',
                                        amount:1,
                                        forward:'$forward',
                                        cancel:'$cancel'
                                    }
                                },
                                {
                                    $match: {
                                        "year": Number(year), //Number(year-1) THEO CẤU HÌNH CŨ
                                        "forward": 1,
                                        "cancel": 0
                                    }
                                }, 
                                {
                                    $group: {
                                        _id: { contact: '$customerDebit' },
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }                   
                            ],
                            
                            _credit:[
                                {
                                    $match: conditionObj2
                                }, 
                                {
                                    $project : { 
                                        year : {$year : "$date"},
                                        customerCredit:"$customerCredit",
                                        amount:1,
                                        forward:'$forward',
                                        cancel:'$cancel',
                                        
                                        credit:'$credit',
                                        contract:'$contract',
                                        funda:'$funda',
                                    }
                                },
                                {
                                    $match: {
                                        "year": Number(year), //Number(year-1) THEO CẤU HÌNH CŨ
                                        "forward": 1,
                                        "cancel": 0
                                    }
                                }, 
                                {
                                    $group: {
                                        _id: { contact: '$customerCredit' },
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }   
                            ],            
                        }
                    }
                ])
                
                let listData = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionObj1
                                }, 
                                // {
                                //     $project : { 
                                //         year : {$year : "$date"},
                                //         customerDebit:1,
                                //         amount:1,
                                //         forward:1,
                                //         cancel:1
                                //     }
                                // },
                                {
                                    $match: {
                                        forward: 0,
                                        cancel: 0,
                                        date: { 
                                            $gte: moment(firstDayOfYear).toDate(),
                                            $lt: moment(fromDate).toDate(), // $lte (<=), $lt (<)
                                        },
                                    }
                                },  
                                {
                                    $group: {
                                        _id: { contact: '$customerDebit' },
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }                   
                            ],
                            
                            _credit:[
                                {
                                    $match: conditionObj2
                                }, 
                                // {
                                //     $project : { 
                                //         year : {$year : "$date"},
                                //         customerCredit:1,
                                //         amount:1,
                                //         forward:1,
                                //         cancel:1
                                //     }
                                // },
                                {
                                    $match: {
                                        forward: 0,
                                        cancel: 0,
                                        date: { 
                                            $gte: moment(firstDayOfYear).toDate(),
                                            $lt: moment(fromDate).toDate(), // $lte (<=), $lt (<)
                                        },
                                    }
                                },  
                                {
                                    $group: {
                                        _id: { contact: '$customerCredit' },
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }   
                            ],            
                        }
                    }
                ]);

                let arrDebitS = [], arrCreditS = [], arrDebit = [], arrCredit = [];
                listDataS[0]._debit.forEach(element=>{
                    let key = element._id.contact;
                    if (!Array.isArray(arrDebitS[key])) {
                        arrDebitS[key] = [];
                    }
                    arrDebitS[key].push(element);
                });

                listDataS[0]._credit.forEach(element=>{
                    let key = element._id.contact;
                    if (!Array.isArray(arrCreditS[key])) {
                        arrCreditS[key] = [];
                    }
                    arrCreditS[key].push(element);
                }); 

                listData[0]._debit.forEach(element=>{
                    let key = element._id.contact;
                    if (!Array.isArray(arrDebit[key])) {
                        arrDebit[key] = [];
                    }
                    arrDebit[key].push(element);
                });

                listData[0]._credit.forEach(element=>{
                    let key = element._id.contact;
                    if (!Array.isArray(arrCredit[key])) {
                        arrCredit[key] = [];
                    }
                    arrCredit[key].push(element);
                });
                return resolve({ error: false, data: { arrDebitS, arrCreditS, arrDebit, arrCredit } });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }  

    //_________CÔNG NỢ TRONG KỲ PHÂN LOẠI THEO KHÁCH HÀNG (OK)
    // Tính năng sử dụng: Theo dõi công nợ
    // Author: HiepNH
    getListCombineGroupByAccountAndContact({ ctx, companyID, fundaID, contractID, accountID, fromDate, toDate}) {
        const that = this;
        return new Promise(async resolve => {
            try {
                //__________Get nestedArray of account
                let arrObjectID = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{ accountID, isNestedOfCompany: true }); 

                let conditionObj1;
                let conditionObj2;
                
                if(!fundaID){
                    if(!contractID){
                        conditionObj1 = {
                            company: ObjectID(companyID),
                            debit:  {
                                $in: arrObjectID.data
                            }
                        }
                        conditionObj2 = {
                            company: ObjectID(companyID),
                            credit:  {
                                $in: arrObjectID.data
                            }
                        }
                    }else{
                        conditionObj1 = {
                            company: ObjectID(companyID),
                            contract: ObjectID(contractID),
                            debit:  {
                                $in: arrObjectID.data
                            }
                        }
                        conditionObj2 = {
                            company: ObjectID(companyID),
                            contract: ObjectID(contractID),
                            credit:  {
                                $in: arrObjectID.data
                            }
                        }
                    }
                }else{
                    if(!contractID){
                        conditionObj1 = {
                            funda: ObjectID(fundaID),
                            debit:  {
                                $in: arrObjectID.data
                            }
                        }
                        conditionObj2 = {
                            funda: ObjectID(fundaID),
                            credit:  {
                                $in: arrObjectID.data
                            }
                        }                      
                    }else{
                        conditionObj1 = {
                            funda: ObjectID(fundaID),
                            contract: ObjectID(contractID),
                            debit:  {
                                $in: arrObjectID.data
                            }
                        }
                        conditionObj2 = {
                            funda: ObjectID(fundaID),
                            contract: ObjectID(contractID),
                            credit:  {
                                $in: arrObjectID.data
                            }
                        }
                    }
                }
                console.log({ conditionObj1, conditionObj2,arrObjectID: arrObjectID.data })

                let listData = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionObj1
                                }, 
                                {
                                    $project : { 
                                        customerDebit:1,
                                        amount:1,
                                        forward:1,
                                        cancel:1,
                                        date:1
                                    }
                                },
                                {
                                    $match: {
                                        forward: 0,
                                        cancel: 0,
                                        date: { 
                                            $gte: moment(fromDate).toDate(),
                                            $lte: moment(toDate).toDate(),
                                        },
                                    }
                                }, 
                                {
                                    $group: {
                                        _id: { contact: '$customerDebit' },
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }                   
                            ],
                            
                            _credit:[
                                {
                                    $match: conditionObj2
                                }, 
                                {
                                    $project : { 
                                        customerCredit:1,
                                        amount:1,
                                        forward:1,
                                        cancel:1,
                                        date:1
                                    }
                                },
                                {
                                    $match: {
                                        forward: 0,
                                        cancel: 0,
                                        date: { 
                                            $gte: moment(fromDate).toDate(),
                                            $lte: moment(toDate).toDate(),
                                        },
                                    }
                                }, 
                                {
                                    $group: {
                                        _id: { contact: '$customerCredit' },
                                        amountPrice: { $sum: "$amount" }
                                    }
                                }   
                            ],            
                        }
                    }
                ]);
                if (!listData) return resolve({ error: true, message: 'cannot_get_list_data' });
                // conditionObj1, conditionObj2,
                // Convert dữ liệu sang mảng có Key là các itemID để tiện cho việc hiển thị ra view
                let arrDebit = [], arrCredit = [];
                listData[0]._debit.forEach(element=>{
                    let key = element._id.contact;
                    if (!Array.isArray(arrDebit[key])) {
                        arrDebit[key] = [];
                    }
                    arrDebit[key].push(element);
                });

                listData[0]._credit.forEach(element=>{
                    let key = element._id.contact;
                    if (!Array.isArray(arrCredit[key])) {
                        arrCredit[key] = [];
                    }
                    arrCredit[key].push(element);
                });
                //example : arrDebit['customer'][{},{},{}];
                return resolve({ error: false, data: {  arrCredit, arrDebit }});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }  

    // Danh sách công nợ của tài khoản lấy theo khách hàng
    debtTrackingAccountWithCusomerDetails({  ctx, companyID, fundaID, contractID, accountID, fromDate, toDate  }){
        return new Promise(async(resolve)=>{
            try {
                let listJournalsOpening =  this.getListOpeningCombineGroupByAccountAndContact({ ctx, fundaID, accountID, fromDate });
                //_________Công nợ trong kỳ các khách hàng
                let listJournals =  this.getListCombineGroupByAccountAndContact({ ctx, fundaID, accountID, fromDate, toDate });
                let [ _listJournalsOpening, _listJournals] =  await Promise.all([listJournalsOpening, listJournals ]);
                return resolve({ 
                    error: false,
                    data:{ 
                        projectID: undefined,
                        infoContract: undefined,
                        // infoFunda,
                        fromDate, toDate,
                        // infoAccount: infoAccount.data,
                        accountID,
                        // listContacts: listContacts.data, [bổ xung]
                        arrDebitOpeningS:  Object.assign({}, _listJournalsOpening.data.arrDebitS), 
                        arrCreditOpeningS: Object.assign({}, _listJournalsOpening.data.arrCreditS),
                        arrDebitOpening: Object.assign({}, _listJournalsOpening.data.arrDebit),
                        arrCreditOpening: Object.assign({}, _listJournalsOpening.data.arrCredit),
                        arrDebit: Object.assign({}, _listJournals.data.arrDebit),
                        arrCredit: Object.assign({}, _listJournals.data.arrCredit),
                    } 
                })     

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    // Danh sách tài khoản chữ T [ok]
    listTbookByAccount({ ctx, companyID, fundaID, contractID, accountID, fromDate, toDate }) {
        return new Promise(async(resolve)=>{
            try {
                const _infoAccount  =  ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_AND_GET_LIST}`, { accountID });
                const listAccountsAsync  =  ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`, {  isNestedOfCompany: false, status : 1 })//ACCOUNT_MODEL.getListByCompany({ companyID, status : 1 });

                // let infoAccount = await ACCOUNT_MODEL.getInfoAccount({ accountID });
                let _listJournalsOpening =  this.getOpeningBalanceOfCompany({  ctx, fundaID, accountID, fromDate });
                let _listDataAccountCharacterT =  this.getListBalanceOfCompanyGroupByAccount({ ctx, companyID, fundaID, accountID, fromDate, toDate });
                const [  infoAccount, listAccounts, listJournalsOpening, listDataAccountCharacterT ] =  await Promise.all([
                    _infoAccount,listAccountsAsync,  _listJournalsOpening, _listDataAccountCharacterT 
                ]);
                return resolve({ 
                    error: false, 
                    message:"successfully_get_list_data_account_T", 
                    data:{ 
                        VOUCHER_TYPES,
                        projectID: undefined,
                        // infoFunda, 
                        fromDate, 
                        toDate,
                        infoAccount: infoAccount.data,
                        listAccounts: listAccounts.data,
                        accountID,
                        openingBalance: listJournalsOpening.data,
                        arrDebit: Object.assign({}, listDataAccountCharacterT.data.arrDebit), // listDataAccountCharacterT.data.arrDebit,
                        arrCredit: Object.assign({}, listDataAccountCharacterT.data.arrCredit),
                    } 
                })     
            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOURNAL][listTbookByAccount]: ${error}`);
                return resolve({ error: true, message: error.message });
            }
        });
    }
}
exports.MODEL = new Model;
var ACCOUNTING__FINANCIAL_VOUCHER     = require('../model/accounting.financial_voucher').MODEL;