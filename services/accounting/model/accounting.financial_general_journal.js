"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const ObjectID                                  = require('mongoose').Types.ObjectId;
const moment                                = require('moment');
const { _isValid, _getLevelMaxInRecursive, _constructForAny, _getLevelMaxInRecursiveByCompany
}                                           = require('../../../tools/utils/utils');

// const CONTACT_COLL                          = require('../../../database/core/contact-coll');
// const ACCOUNT_COLL                          = require('../../../database/core/account-coll');
// const GOODS_COLL                            = require('../../../database/core/goods-coll');
// const WAREHOUSE_COLL                        = require('../../../database/core/warehouse-coll');
// const CONTRACT_COLL                         = require('../../../database/core/contract-coll');
// const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL                  = require('../../../database/apps/financial/financial_general_journal-coll');
// const VOUCHER_COLL                          = require('../../../database/apps/financial/financial_voucher-coll');
// const BUDGET_JOB_COLL                       = require('../../../database/apps/budget/budget_job-coll');

// const ACCOUNT_MODEL                         = require('../../../models/core/account').MODEL;

/**
 * DOMAIN AND ACTIONS
*/

/**
 * CONSTANTS
*/
const { CF_DOMAIN_SERVICES } 	= require('../../gateway/helper/domain.constant');
const { VOUCHER_TYPES }         = require('../config/accounting.financial_config');
const { CF_ACTIONS_ITEM }       = require('../../item/helper/item.actions-constant')
/**
 * TOOLS
*/
const connection  = require('../helper/transaction-demo/connectionMongo');


// update  phân trang sau
// const { RANGE_BASE_PAGINATION } 	    = require('../../../tools/cursor_base/playground/index');
// const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * COLLECTIONS
*/
// const ACCOUNTING__FINANCIAL_VOUCHER_COLL        = require('../database/accounting.financial_voucher-coll');
// const FUNDA_COLL                                = require('../../item/database/item.funda-coll');
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL     = require('../database/accounting.financial_general_journal-coll');

/**
 * MODELS
*/
// const ACCOUNTING__FINANCIAL_VOUCHER     = require('../model/accounting.financial_voucher').MODEL;


class Model extends BaseModel {

    constructor() {
        super(require('../database/accounting.financial_general_journal-coll'))
    }
    // -------------------- start function check params for add, update, remove, search -----------
    checkInputInputJournal({ amount, authorID }){
        if(Number.isNaN(Number(amount)))
            return { error: true, message: 'amount_invalid' };

        if(!_isValid(authorID))
            return { error: true, message: 'authorID_invalid' };
    }

    checkInputInsertFull({ amount, voucher, companyID, authorID, fundaID, customerDebit, customerCredit }){
        // if(Number.isNaN(Number(amount)) || !_isValid(journalID) || !_isValid(authorID)){
        this.checkInputInputJournal({ amount, authorID });
        if(Number.isNaN(Number(amount)))
            return { error: true, message: 'amount_invalid' };

        if(!_isValid(authorID))
            return { error: true, message: 'authorID_invalid' };
            
        if(!_isValid(voucher))
            return { error: true, message: 'voucher_invalid' };

        if(!_isValid(companyID))
            return { error: true, message: 'companyID_invalid' };

        if(!_isValid(fundaID))
            return { error: true, message: 'fundaID_invalid' };

        if(!_isValid(customerDebit))
            return { error: true, message: 'customerDebit_invalid' };
        
        if(!_isValid(customerCredit))
            return { error: true, message: 'customerCredit_invalid' };

        return { error: false }
    }

    checkInputUpdate({ amount, authorID, journalID }){
        // if(Number.isNaN(Number(amount)) || !_isValid(journalID) || !_isValid(authorID)){
        this.checkInputInputJournal({ amount, authorID });
        if(!_isValid(journalID))
            return { error: true, message: 'journalID_invalid' };

        return { error: false }
    }

 
    // --------------------   end function check params for add, update, remove, search -----------

    // -------------------- start function collect data for add, update, search -----------------

    // -------------------- end function check params for add, update, remove, search -----------
    collectDataForInsert({
        companyID, fundaID, authorID, voucher, customerDebit,
        customerCredit, quantityCalculate, unitpriceCalculate,
        amountCalculate, fcuExRate, fcuAmountCalculate,
        cash, vat, note, date, subtype, project,
        updown, advancePayment, debit, credit,
        goods, contract, job
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
            amount: amountCalculate,
            fcuExRate: Number(fcuExRate || 0),
            fcuAmount: fcuAmountCalculate,
            cash,
            vat,
            note,
            date,
            subtype,
            project,
            updown: (!isNaN(updown) && [1,-1].includes(Number(updown))) ? Number(updown) : 1,
            advancePayment: (!isNaN(advancePayment) && [0,1].includes(Number(advancePayment))) ? Number(advancePayment) : 0
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

        //_________Kiểm tra xem có Dự án hay không
        if(project && _isValid(project)) {
            dataInsert.project = project
        }

        //_________Ứng dụng quản lý chi phí
        if(job && _isValid(job) && group && _isValid(group)) {
            dataInsert.job = job
            dataInsert.group = group
        }

        return dataInsert;
    }

    async collectDataForUpdate({
        authorID, customerDebit,
        customerCredit, quantityCalculate, unitpriceCalculate,
        amountCalculate, fcuExRate, fcuAmountCalculate,
        note, project,
        updown, advancePayment, debit, credit,
        goods, contract, job, journalID, amount
    }){
        // TẠO CHI TIẾT CHỨNG TỪ
        let dataUpdate = {
            userUpdate: authorID, 
            quantity: quantityCalculate,
            unitprice: unitpriceCalculate,
            amount: amountCalculate,
            fcuExRate: Number(fcuExRate),
            fcuAmount: fcuAmountCalculate,
            note,
            updown: (!isNaN(updown) && [1,-1].includes(Number(updown))) ? Number(updown) : 1,
            advancePayment: (!isNaN(advancePayment) && [0,1].includes(Number(advancePayment))) ? Number(advancePayment) : 0,
            customerDebit,
            customerCredit,
        }
        if(amount && Number(amount)){
            dataUpdate.amount = Number(amount);
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
            let infoJournal = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.findById(journalID);
            
            // await BUDGET_JOB_COLL.findByIdAndUpdate(infoJournal.job, {
            //     $pull: { journals: journalID }
            // }, { new: true });
        }
        return dataUpdate;
    }
    //_________Tạo chi tiết chứng từ (OK)
    // Author: HiepNH
    insertFull({ 
        authorID, companyID, fundaID, voucher, debit, credit, customerDebit,
        customerCredit, goods, quantity, amount, fcuExRate, contract, 
        project, job, cash, vat, note, updown, advancePayment , 
        date, subtype, 
    }) {
        const that = this;
        return new Promise(async (resolve) => {
            let responseResultInsert = {};
            const session = await connection.startSession();
            await session.startTransaction();
            try {
                const checkInput = this.checkInputInsertFull({  amount, voucher, companyID, authorID, fundaID, customerDebit, customerCredit });
                if(checkInput.error)
                    return resolve(checkInput)
                // Kiểm tra để đảm bảo "debit, credit, customerDebit, customerCredit, goods, warehouse, contract" thuộc companyID
                // Kiểm tra check trùng tài khoản đối ứng
                if(debit && credit && debit.toString() === credit.toString())
                    return resolve({ error: false, message: 'debit/credit is duplicated' });

                // Fix: nếu amount == 0 -> result = NaN (insert into db throw error)
                const quantityCalculate       = Number(Number(quantity).toFixed(3)) || 0;
                const unitpriceCalculate      = Number(Number(amount/quantity).toFixed(3)) || 0;
                const amountCalculate         = Number(Number(amount).toFixed(3)) || 0;
                const fcuAmountCalculate      = Number(Number((amount || 0)/(fcuExRate || 1)).toFixed(0)) || 0;
                
                // TẠO CHI TIẾT CHỨNG TỪ
                const dataInsert = this.collectDataForInsert({
                    companyID, fundaID, authorID, voucher, customerDebit,
                    customerCredit, quantityCalculate, unitpriceCalculate,
                    amountCalculate, fcuExRate, fcuAmountCalculate,
                    cash, vat, note, date, subtype, project,
                    updown, advancePayment, debit, credit,
                    goods, contract, job
                })
               
                // console.log(dataInsert)
                let infoAfterInsert = await that.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" });
                
                //Todos
                //___________CẬP NHẬT LẠI THÔNG TIN PHIẾU
                // Cập nhật: amount, fcuAmount
                const resultUpdate = await ACCOUNTING__FINANCIAL_VOUCHER.updateWithChangingJournal({ voucherId: voucher, journalAmount : amount , journalFcuAmount: fcuAmountCalculate })
                // await session.commitTransaction();
                //---- Không cần check kĩ --> sẽ đưa qua trasaction//
                if(resultUpdate.error){
                    responseResultInsert = { error: false, data: infoAfterInsert }
                    await session.abortTransaction();
                }else{
                    responseResultInsert = { error: false, data: infoAfterInsert }
                }
                //Todos
                //___________CẬP NHẬT LẠI THÔNG TIN NGÂN SÁCH (CẦN PHẢI XÓA ĐI KHI UPDATE journals SANG JOB MỚI)
                //1.butget service
                // if(job && _isValid(job)){
                //     await BUDGET_JOB_COLL.findByIdAndUpdate(job, {
                //         $addToSet: { journals: infoAfterInsert._id } 
                //     },{ new: true });
                // }
                // return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOURNAL][ADD_JOURNAL]: ${error}`);
                await session.abortTransaction();
                responseResultInsert = { error: true, message: error.message };
                // return resolve({ error: true, message: error.message });
            }
            finally {
                session.endSession();
                const resultC = await connection.close();
                console.log({resultC})
                return resolve(responseResultInsert);
            }
        })
    }

    update({
        journalID, debit, credit, customerDebit,
        customerCredit, goods, quantity, 
        amount, fcuExRate, note, updown, advancePayment,
        contract, project, job, authorID 
    }){
        return new Promise(async (resolve) => {
            let responseResultUpdate = {};
            const session = await connection.startSession();
            await session.startTransaction();
            try {
                const info = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.findById(journalID);
                if (!info) 
                    return resolve({ error: true, message: 'cannot_get_info' });

                const checkInputUpdate = this.checkInputUpdate({ amount, journalID, authorID })
                if(checkInputUpdate.error)
                    return resolve(checkInputUpdate);


                // Kiểm tra check trùng tài khoản đối ứng
                if(debit && credit && debit.toString() === credit.toString())
                    return resolve({ error: false, message: 'debit/credit is duplicated' });
            
                const infoJournal = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.findById(journalID);
                if(!infoJournal)
                    return resolve({ error: false, message: 'finacial_journal_exit' });

                // Fix: Nếu amount == 0 -> result = NaN (insert into db throw error)
                const quantityCalculate       = Number(Number(quantity).toFixed(3)) || 0;
                const unitpriceCalculate      = Number(Number(amount/quantity).toFixed(3)) || 0;
                const amountCalculate         = Number(Number(amount).toFixed(3)) || 0;
                const fcuAmountCalculate      = Number(Number(amount/fcuExRate).toFixed(0)) || 0;
                const dataUpdate = await this.collectDataForUpdate({
                    authorID, customerDebit, customerCredit,
                    quantityCalculate, unitpriceCalculate,
                    amountCalculate, fcuExRate, fcuAmountCalculate,
                    note, project, updown, advancePayment, debit, credit,
                    goods, contract, job, journalID, amount
                })

                const infoAfterUpdate = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.findByIdAndUpdate(journalID, dataUpdate , { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });
                
                const journalAmount = Number(infoAfterUpdate.amount || 0) - Number(infoJournal.amount ||0) || 0;
                const journalFcuAmount = Number(infoAfterUpdate.fcuAmount || 0) - Number(infoJournal.fcuAmount ||0) || 0;

                // step 1: update --> voucher info 
                // step 2: transaction (after...)
                const resultUpdateVoucher = await ACCOUNTING__FINANCIAL_VOUCHER.updateWithChangingJournal({  voucherId: `${infoAfterUpdate.voucher}`,journalAmount, journalFcuAmount })
                if(resultUpdateVoucher.error){
                    responseResultUpdate = { error: false, data: infoAfterUpdate }
                    await session.abortTransaction();
                }else{
                    responseResultUpdate = { error: false, data: infoAfterUpdate }
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
                responseResultUpdate = { error: true, message: error.message };
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
                    return resolve({ error: true, message: 'param_invalid' });

                let info = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.findById(journalID);
                if (!info) 
                    return resolve({ error: true, message: 'cannot_get_info' });

                //_________Xóa chi tiết
                let infoAfterRemove = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.findByIdAndDelete(journalID);
                if(!infoAfterRemove)
                    return resolve({ error: true, message: "cannot_remove" });

                //Cập nhật thông tin trong phiếu
                const journalAmount =   0 - (Number(infoAfterRemove.amount || 0) || 0);
                const journalFcuAmount = 0  - (Number(infoAfterRemove.fcuAmount || 0) || 0);

                // step 1: update --> voucher info 
                // step 2: transaction (after...)
                const resultUpdateVoucher = await ACCOUNTING__FINANCIAL_VOUCHER.updateWithChangingJournal({  voucherId: `${infoAfterRemove.voucher}`,journalAmount, journalFcuAmount })
                if(resultUpdateVoucher.error){
                    responseResultRemove = { error: true, data: infoAfterRemove, message: resultUpdateVoucher.message }
                    await session.abortTransaction();
                }else{
                    responseResultRemove = { error: false, data: infoAfterRemove, message: "Remove success" }
                }
                //_________Xóa trong Ứng dụng quản lý chi phí
                if(info.job && _isValid(info.job)){
                    await BUDGET_JOB_COLL.findByIdAndUpdate(info.job, {
                        $pull: { journals: journalID } 
                    }, { new: true });
                }
            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOURNAL][REMOVE_JOURNAL]: ${error}`);
                return resolve({ error: true, message: error.message })
            }
            finally {
                session.endSession();
                await connection.close();
                return resolve(responseResultRemove);
            }
        })
    }

    //_________DANH SÁCH TÀI KHOẢN VÀ CON CHÁU CỦA NÓ
    // Author: HiepNH
    getListNestedItem({ ctx, accountID }) {
        return new Promise(async resolve => {
            try {
                if(!accountID)
                    return resolve({ error: true, message:'accountID_invalid' });
                const { company } = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_WITH_ID}`,{ accountID }); 
               
                //__________Lấy levelMax của các phần tử
                // let levelForRecursive = await _getLevelMaxInRecursive(ACCOUNT_COLL);
                const levelForRecursive = await _getLevelMaxInRecursiveByCompany(ACCOUNT_COLL , company);

                //__________Khai báo mảng chứa phần tử cha và các con
                let arrObjectID = [];
                let getListIDRecursiveForAny = (arr) => {
                    for(const item of arr){
                        arrObjectID.push(item._id)

                        if (Array.isArray(item.childs) && item.childs.length) {
                            getListIDRecursiveForAny(item.childs)
                        }
                    }
                }

                //__________Lấy thông tin phần tử kèm theo populate vào bên trong các phần tử con
                let infoItemOrigin = await ACCOUNT_COLL.findById(accountID)
                    .populate(
                        _constructForAny(levelForRecursive, 'childs') 
                    )
                
                //__________Gọi hàm đệ quy để lấy mảng nestedArray
                getListIDRecursiveForAny([infoItemOrigin], levelForRecursive);

                if (!arrObjectID)
                    return resolve({ error: true, message: 'cannot_get_list' });
                    
                return resolve({ error: false, data: arrObjectID });
            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOUNRAL][getListNestedItem]: ${error} `);
                return resolve({ error: true, message: error.message });
            }
        });
    }  

    getInfo({ journalID }) {
        return new Promise(async resolve => {
            try {
                if(!_isValid(journalID))
                    return { error: true, message: 'journalID_invalid' };
                
                const infoJournal = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.findById(journalID)
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
                    return resolve({ error: true, message: 'cant_get_info_journal' })
                    
                return resolve({ error: false, data: infoJournal })
            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOUNRAL][getInfo]: ${error} `);
                return resolve({ error: true, message: error.message })
            }
        });
    }

    //_________SỐ DƯ ĐẦU KỲ CỦA 1 TÀI KHOẢN (OK)
    // Tính năng sử dụng: Sổ chi tiết tài khoản
    // Author: HiepNH
    getOpeningBalanceOfCompany({ companyID, fundaID, contractID, accountID, fromDate, arrAccountObjectID }) {
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
                const arrObjectID = arrAccountObjectID;
                let conditionObj1;
                let conditionObj2;
                
                if(!fundaID){
                    if(!contractID){
                        conditionObj1 = {
                            company: companyID,
                            debit: {
                                $in: arrObjectID.data
                            }
                        }
                        conditionObj2 = {
                            company: companyID,
                            credit: {
                                $in: arrObjectID.data
                            }
                        }
                    }else{
                        conditionObj1 = {
                            company: companyID,
                            contract: contractID,
                            debit: {
                                $in: arrObjectID.data
                            }
                        }
                        conditionObj2 = {
                            company: companyID,
                            contract: contractID,
                            credit: {
                                $in: arrObjectID.data
                            }
                        }
                    }
                }else{
                    if(!contractID){
                        conditionObj1 = {
                            funda: fundaID,
                            debit: {
                                $in: arrObjectID.data
                            }
                        }
                        conditionObj2 = {
                            funda: fundaID,
                            credit: {
                                $in: arrObjectID.data
                            }
                        }
                    }else{
                        conditionObj1 = {
                            funda: fundaID,
                            contract: contractID,
                            debit: {
                                $in: arrObjectID.data
                            }
                        }
                        conditionObj2 = {
                            funda:fundaID,
                            contract: contractID,
                            credit: {
                                $in: arrObjectID.data
                            }
                        }
                    }
                }
                //____________Lấy năm của ngày đầu kỳ
                let year = moment(fromDate).toDate().getFullYear() //!!!!Xem xét sao không lấy năm của ngày bắt đầu (sẽ áp dụng được cho kỳ kéo dài nhiều năm)
                let firstDayOfYear = `${Number(year)}-01-01T00:00:00.000Z`

                //____________Số liệu của các phiếu kết chuyển cuối kỳ năm trước sang đầu kỳ năm sau (31/12/2019-1/1/2020)
                let listDataS = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionObj1
                                }, 
                                {
                                    $lookup: {
                                        from: 'financial_vouchers',
                                        localField: 'voucher',
                                        foreignField: '_id',
                                        as:         'voucher'
                                    }
                                },
                                {
                                    $unwind : "$voucher"
                                },
                                {
                                    $project : { 
                                        year : {$year : "$voucher.date"},
                                        forward: '$voucher.forward',
                                        cancel: '$voucher.cancel',
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
                                    $lookup: {
                                        from: 'financial_vouchers',
                                        localField: 'voucher',
                                        foreignField: '_id',
                                        as:         'voucher'
                                    }
                                },
                                {
                                    $unwind : "$voucher"
                                },
                                {
                                    $project : { 
                                        year : {$year : "$voucher.date"},
                                        forward: '$voucher.forward',
                                        cancel: '$voucher.cancel',
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
                let listData = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionObj1
                                }, 
                                {
                                    $lookup: {
                                        from: 'financial_vouchers',
                                        localField: 'voucher',
                                        foreignField: '_id',
                                        as:         'voucher'
                                    }
                                },
                                {
                                    $unwind : "$voucher"
                                },
                                {
                                    $match: {
                                        "voucher.forward": 0,
                                        "voucher.cancel": 0,
                                        "voucher.date": { 
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
                                    $lookup: {
                                        from: 'financial_vouchers',
                                        localField: 'voucher',
                                        foreignField: '_id',
                                        as:         'voucher'
                                    }
                                },
                                {
                                    $unwind : "$voucher"
                                },
                                {
                                    $match: {
                                        "voucher.forward": 0,
                                        "voucher.cancel": 0,
                                        "voucher.date": { 
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

     //_________CHI TIẾT GIAO DỊCH TRONG KỲ CỦA 1 TÀI KHOẢN (OK)
    // Tính năng sử dụng: Sổ chi tiết tài khoản
    // Author: HiepNH
    getListJournalOfCompany({ companyID, fundaID, contractID, accountID, fromDate, toDate, arrAccountObjectID }) {
        // console.log({fromDate})
        // console.log({toDate})
        const that = this;
        return new Promise(async resolve => {
            try {
                /**
                 * Business Analyst (BA)
                 * 1. Lấy mảng chứa tài khoản và các con cháu của nó
                 * 2. Số liệu trong kỳ không gồm các Phiếu kết chuyển+Phiếu hủy
                 */

                // Get nestedArray of account
                // let arrObjectID = await that.getListNestedItem({accountID});
                const arrObjectID = arrAccountObjectID;

                let conditionObj1;
                
                if(!fundaID){
                    if(!contractID){
                        conditionObj1 = {
                            company: companyID,
                            $or: [
                                { debit:   {
                                    $in: arrObjectID.data
                                }},
                                { credit:  {
                                    $in: arrObjectID.data
                                } },
                            ],
                        }
                    }else{
                        conditionObj1 = {
                            company: companyID,
                            contract: contractID,
                            $or: [
                                { debit:   {
                                    $in: arrObjectID.data
                                }},
                                { credit:  {
                                    $in: arrObjectID.data
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
                                    $in: arrObjectID.data
                                }},
                                { credit:  {
                                    $in: arrObjectID.data
                                } },
                            ],
                        }
                    }else{
                        conditionObj1 = {
                            funda: fundaID,
                            contract: contractID,
                            $or: [
                                { debit:   {
                                    $in: arrObjectID.data
                                }},
                                { credit:  {
                                    $in: arrObjectID.data
                                } },
                            ],
                        }
                    }
                }

                // Lấy giao dịch của tài khoản và các tài khoản con của nó
                let listData = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.aggregate([
                    {
                        $match: conditionObj1
                    }, 
                    {
                        $lookup: {
                            from: 'financial_vouchers',
                            localField: 'voucher',
                            foreignField: '_id',
                            as:         'voucher'
                        }
                    },
                    {
                        $unwind : "$voucher"
                    },
                    {
                        $match: {
                            "voucher.forward": 0,
                            "voucher.cancel": 0,
                            "voucher.date": { 
                                $gte: moment(fromDate).toDate(),
                                $lte: moment(toDate).toDate(),
                            },
                        }
                    },    
                ]).sort({'voucher.date':'asc'});

                if (!listData) return resolve({ error: true, message: 'cannot_get_list' });

                let listData1 = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.populate(listData, {
                    path: 'debit',
                    select: '_id name description',
                    model: 'account',
                });
                if (!listData1) return resolve({ error: true, message: 'cannot_get_list' });

                let listData2 = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.populate(listData1, {
                    path: 'credit',
                    select: '_id name description',
                    model: 'account',
                });
                if (!listData2) return resolve({ error: true, message: 'cannot_get_list' });

                let listData3 = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.populate(listData2, {
                    path: 'voucher.customer',
                    select: '_id name',
                    model: 'contact',
                });
                if (!listData3) return resolve({ error: true, message: 'cannot_get_list' });

                let listData4 = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.populate(listData3, {
                    path: 'contract',
                    select: '_id name',
                    model: 'contract',
                });
                if (!listData4) return resolve({ error: true, message: 'cannot_get_list' });

                return resolve({ error: false, data: listData4 });
            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOUNRAL][getListJournalOfCompany]: ${error} `);
                return resolve({ error: true, message: error.message });
            }
        });
    }

    getListJournalOfAccount({ ctx, accountID, fromDate, toDate,fundaID }){
        return new Promise(async resolve => {
            try {
                if(!_isValid(accountID))
                    return { error: true, message: 'accountID_invalid' };
               
                const [ infoAccount, listNestedAccount ] = await Promise.all([
                    ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_WITH_ID}`,{ accountID }),
                    ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{ accountID }),
                ]);
                [infoAccount, listNestedAccount ].forEach(item=>{
                    if(item.error){
                        return resolve(item);
                    }
                })
                const nestedAccount = listNestedAccount.data.map(item => item.toString());
                const [ openingBalance, listJournals ] = await Promise.all([
                    this.getOpeningBalanceOfCompany({ fundaID, accountID, fromDate, arrAccountObjectID: listNestedAccount }),
                    this.getListJournalOfCompany({ fundaID, accountID, fromDate, toDate, arrAccountObjectID: listNestedAccount })
                ]);

                [ openingBalance, listJournals ].forEach(item=>{
                    if(item.error){
                        return resolve(item);
                    }
                })
                return resolve({
                    error: false, 
                    data:{
                        fromDate, toDate,
                        infoAccount: infoAccount.data,
                        nestedAccount, accountID,
                        openingBalance: openingBalance.data,
                        listJournals: listJournals.data
                    }
                });

            } catch (error) {
                console.log(`ERROR [ACCOUNTING_JOUNRAL][getListJournalOfAccount]: ${error} `);
                return resolve({ error: true, message: error.message })
            }
        });  
    }

}
exports.MODEL = new Model;
var ACCOUNTING__FINANCIAL_VOUCHER     = require('../model/accounting.financial_voucher').MODEL;
