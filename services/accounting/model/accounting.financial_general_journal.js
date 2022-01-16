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

    //_________Tạo chi tiết chứng từ (OK)
    // Author: HiepNH
    insertFull({ 
        authorID, companyID, fundaID, voucher, debit, credit, customerDebit,
        customerCredit, goods, warehouse, quantity, amount, fcuExRate, contract, 
        project, job, group, cash, vat, note, updown, advancePayment , 
        date, subtype, 
    }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                console.log({ amount, voucher, companyID, fundaID, authorID, customerDebit, customerCredit })
                if(Number.isNaN(Number(amount)) || !_isValid(voucher) || !_isValid(companyID) || !_isValid(fundaID) || 
                !_isValid(authorID) || !_isValid(customerDebit) || !_isValid(customerCredit)){
                    return resolve({ error: false, message: 'params_not_valid' });
                }else{

                    // Kiểm tra để đảm bảo "debit, credit, customerDebit, customerCredit, goods, warehouse, contract" thuộc companyID
                    // Kiểm tra check trùng tài khoản đối ứng
                    if(debit && credit && debit.toString() === credit.toString()){
                        return resolve({ error: false, message: 'debit/credit is duplicated' });
                    }else{

                        // Fix: nếu amount == 0 -> result = NaN (insert into db throw error)
                        let quantityCalculate       = Number(Number(quantity).toFixed(3)) || 0;
                        let unitpriceCalculate      = Number(Number(amount/quantity).toFixed(3)) || 0;
                        let amountCalculate         = Number(Number(amount).toFixed(3)) || 0;
                        let fcuAmountCalculate      = Number(Number((amount || 0)/(fcuExRate || 1)).toFixed(0)) || 0;
                        
                        // TẠO CHI TIẾT CHỨNG TỪ
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

                        // console.log(dataInsert)
                        let infoAfterInsert = await that.insertData(dataInsert);
                        if(!infoAfterInsert)
                            return resolve({ error: true, message: "cannot_insert" });
                        
                        //Todos
                        //___________CẬP NHẬT LẠI THÔNG TIN PHIẾU
                        // Cập nhật: amount, fcuAmount
                        const resultUpdate = await ACCOUNTING__FINANCIAL_VOUCHER.updateWithNewJournal({ voucherId: voucher, journalAmount : amount , journalFcuAmount: fcuAmountCalculate })
                        
                        //---- Không cần check kĩ --> sẽ đưa qua trasaction//
                        console.log({resultUpdate});
                        
                        //Todos
                        //___________CẬP NHẬT LẠI THÔNG TIN NGÂN SÁCH (CẦN PHẢI XÓA ĐI KHI UPDATE journals SANG JOB MỚI)
                        //1.butget service
                        // if(job && _isValid(job)){
                        //     await BUDGET_JOB_COLL.findByIdAndUpdate(job, {
                        //         $addToSet: { journals: infoAfterInsert._id } 
                        //     },{ new: true });
                        // }
    
                        return resolve({ error: false, data: infoAfterInsert });
                    }
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    //_________DANH SÁCH TÀI KHOẢN VÀ CON CHÁU CỦA NÓ
    // Author: HiepNH
    getListNestedItem({ ctx, accountID }) {
        return new Promise(async resolve => {
            try {
                let { company } = await  ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_WITH_ID}`,{ accountID }); 
               
                //__________Lấy levelMax của các phần tử
                // let levelForRecursive = await _getLevelMaxInRecursive(ACCOUNT_COLL);
                let levelForRecursive = await _getLevelMaxInRecursiveByCompany(ACCOUNT_COLL , company);

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
                return resolve({ error: true, message: error.message });
            }
        });
    }

    update({
        voucherID,
        journalID, debit, credit, customerDebit,
        customerCredit, goods, warehouse, quantity, 
        amount, fcuExRate, note, updown, advancePayment,
        contract, project, job, group, authorID 
    }){
        return new Promise(async (resolve) => {
            try {
                
                let info = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.findById(journalID);
                if (!info) 
                    return resolve({ error: true, message: 'cannot_get_info' });
                
                if(Number.isNaN(Number(amount)) || !_isValid(journalID) || !_isValid(authorID)){
                    return resolve({ error: false, message: 'params_not_valid' });
                }else{

                    // Kiểm tra check trùng tài khoản đối ứng
                    if(debit && credit && debit.toString() === credit.toString())
                        return resolve({ error: false, message: 'debit/credit is duplicated' });
                
                    let infoJournal = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.findById(journalID);
                    if(!infoJournal)
                        return resolve({ error: false, message: 'finacial_journal_exit' });

                    // Fix: Nếu amount == 0 -> result = NaN (insert into db throw error)
                    let quantityCalculate       = Number(Number(quantity).toFixed(3)) || 0;
                    let unitpriceCalculate      = Number(Number(amount/quantity).toFixed(3)) || 0;
                    let amountCalculate         = Number(Number(amount).toFixed(3)) || 0;
                    let fcuAmountCalculate      = Number(Number(amount/fcuExRate).toFixed(0)) || 0;

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
                        customerCredit
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

                    let infoAfterUpdate = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.findByIdAndUpdate(journalID, dataUpdate , { new: true });

                    if(!infoAfterUpdate)
                        return resolve({ error: true, message: "cannot_update" });
                    
                    const journalAmount = Number(infoAfterUpdate.amount || 0) - Number(infoJournal.amount ||0) || 0;
                    const journalFcuAmount = Number(infoAfterUpdate.fcuAmount || 0) - Number(infoJournal.fcuAmount ||0) || 0;

                    // step 1: update --> voucher info 
                    // step 2: transaction (after...)
                    await ACCOUNTING__FINANCIAL_VOUCHER.updateWithNewJournal({  voucherId: `${infoAfterUpdate.voucher}`,journalAmount, journalFcuAmount })
                    
                    //___________UPDATE VÀO KHOẢN MỤC PHÍ MỚI
                    if(job && _isValid(job)){
                        // await BUDGET_JOB_COLL.findByIdAndUpdate(job, {
                        //     $addToSet: { journals: journalID } 
                        // }, { new: true });
                    }
                    
                    return resolve({ error: false, data: infoAfterUpdate });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    //_________Xóa chi tiết chứng từ
    // Author: HiepNH
    remove({ journalID }){
        return new Promise(async (resolve) => {
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
                await ACCOUNTING__FINANCIAL_VOUCHER.updateWithNewJournal({  voucherId: `${infoAfterRemove.voucher}`,journalAmount, journalFcuAmount })

                //_________Xóa trong Ứng dụng quản lý chi phí
                if(info.job && _isValid(info.job)){
                    await BUDGET_JOB_COLL.findByIdAndUpdate(info.job, {
                        $pull: { journals: journalID } 
                    }, { new: true });
                }

                return resolve({ error: false, data: infoAfterRemove });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

}
exports.MODEL = new Model;
var ACCOUNTING__FINANCIAL_VOUCHER     = require('../model/accounting.financial_voucher').MODEL;
