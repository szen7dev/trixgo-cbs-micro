"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const ObjectId                                  = require('mongoose').Types.ObjectId;

/**
 * DOMAIN AND ACTIONS
*/

/**
 * CONSTANTS
*/
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { VOUCHER_TYPES }                 = require('../config/accounting.financial_config');
const { CF_ACTIONS_ITEM }   = require('../../item/helper/item.actions-constant')
/**
 * TOOLS
*/
const { _isValid, _getLevelMaxInRecursive, _constructForAny, _getLevelMaxInRecursiveByCompany }  = require('../../../tools/utils/utils');

// update  phân trang sau
// const { RANGE_BASE_PAGINATION } 	    = require('../../../tools/cursor_base/playground/index');
// const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * COLLECTIONS
*/
const ACCOUNTING__FINANCIAL_VOUCHER_COLL        = require('../database/accounting.financial_voucher-coll');
const FUNDA_COLL                                = require('../../item/database/item.funda-coll');
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL     = require('../database/accounting.financial_general_journal-coll');

/**
 * MODELS
*/
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL     = require('../model/accounting.financial_general_journal').MODEL;

// const ITEM__ACCOUNT_MODEL                          = require('../../item/model/item.account-model').MODEL;

class AccountingFinancialVoucher extends BaseModel {

    constructor() {
        super(ACCOUNTING__FINANCIAL_VOUCHER_COLL);
    }

    // -------------------- start function check params for add, update, remove, search -----------
    checkInputVoucher({ date, name, type, authorID, customerID }){
        if(!date)
            return { error: true, message: 'date_invalid' };
            
        if(!name)
            return { error: true, message: 'name_invalid' };

        if(!type || !Number.isNaN(Number(type)))
            return { error: true, message: 'type_invalid' };

        if(authorID || !ObjectId.isValid(authorID))
            return { error: true, message: 'authorID_invalid' };

        if(customerID || !ObjectId.isValid(customerID))
            return { error: true, message: 'type_invalid' };
    }

    checkInputInsertFull({ date, name, type, fundaID, authorID, customerID }){
        this.checkInputVoucher({ date, name, type, authorID, customerID });
        if(!fundaID || !ObjectId.isValid(fundaID))
            return { error: true, message: 'fundaId_invalid' };

        return { error: false }; 
    }

    checkInputUpdate({ date, name, type, voucherID, authorID, customerID }){
        this.checkInputVoucher({ date, name, type, authorID, customerID });
        if(!voucherID || !ObjectId.isValid(voucherID))
            return { error: true, message: 'voucherID_invalid' };

        return { error: false }; 
    }
    // -------------------- end function check params for add, update, remove, search -----------
    // -------------------- start function collect data for add, update, search -----------------
    collectDataForInsertFull({ ctx, authorID , fundaID, type, date, 
        dateInvoice, name, sign, signInvoice, 
        customer, receiver, note, vat, contract, 
        storage, inspection, termination, advancePayment,
        returning, forward, cancel, source, orderNew, pricePolicy,
        discountCost, otherCost, shipperName, shipperCost, staff, 
        fcuExRate, selectedJournals, isImport, voucherSign, companyID,
        ipc, subtype, fee }){
        //_________Khai báo dữ liệu
        let dataInsertVoucher = {
            company: companyID, 
            funda: fundaID, 
            userCreate: authorID, 
            type, 
            date, 
            dateInvoice: (dateInvoice && dateInvoice != "") ? dateInvoice : date, 
            name,
            sign: voucherSign,
            signInvoice: (signInvoice && signInvoice != "") ? signInvoice : voucherSign,
            customer, 
            receiver,
            note,
            inspection, 
            termination,
            vat: vat ? Number(vat) : 0,
            advancePayment: advancePayment ? Number(advancePayment) : 0,
            returning: returning ? Number(returning) : 0,
            forward: forward ? Number(forward) : 0,
            cancel: cancel ? Number(cancel) : 0,
            source: source ? Number(source) : 1, // Dành riêng cho bán hàng
            orderNew: orderNew ? Number(orderNew) : 1, 
            pricePolicy: pricePolicy ? Number(pricePolicy) : 1, 
            discountCost: discountCost ? Number(discountCost) : 0, 
            otherCost: otherCost ? Number(otherCost) : 0, 
            shipperName: shipperName ? shipperName : null,
            shipperCost: shipperCost ? Number(shipperCost) : 0,
            fcuExRate: fcuExRate ? Number(fcuExRate) : 0,
            staff
        }

        //_________Kiểm tra xem có VAT, lưu trữ hồ sơ không
        //_________Nếu không thì lấy giá trị null
        if(contract && _isValid(contract)){
            dataInsertVoucher.contract = contract
        }

        if(storage && _isValid(storage)){
            dataInsertVoucher.storage = storage
        }

        if(ipc){
            if(!ObjectId.isValid(ipc)){
                return { error: true, message: "ipc_invalid" }
            }
            dataInsertVoucher.ipc = ipc;
        }

        if(subtype){
            if(!ObjectId.isValid(subtype)){
                return { error: true, message: "subtype_invalid" }
            }
            dataInsertVoucher.subtype = subtype;
        }

        if(fee){
            if(!ObjectId.isValid(fee)){
                return { error: true, message: "fee_invalid" }
            }
            dataInsertVoucher.fee = fee;
        }

        return  { error: false, data: dataInsertVoucher };
    }

    collectDataForUpdate({
        authorID, type, date, dateInvoice, 
        name, sign, signInvoice, customer, 
        receiver, note, inspection, termination,
        vat, advancePayment, returning, forward,
        cancel, source, orderNew, pricePolicy,
        discountCost, otherCost, shipperName,
        shipperCost, fcuExRate, staff, contract,
        storage
    }){
        let dataUpdateVoucher = {
            userUpdate: authorID, 
            modifyAt: Date.now(),
            type,
            date, 
            dateInvoice, 
            name, 
            sign, 
            signInvoice, 
            customer, 
            receiver,
            note,
            inspection, 
            termination,
            vat: vat ? Number(vat) : 0,
            advancePayment: advancePayment ? Number(advancePayment) : 0,
            returning: returning ? Number(returning) : 0,
            forward: forward ? Number(forward) : 0,
            cancel: cancel ? Number(cancel) : 0,
            source: source ? Number(source) : 1, // Dành riêng cho bán hàng
            orderNew: orderNew ? Number(orderNew) : 1, 
            pricePolicy: pricePolicy ? Number(pricePolicy) : 1, 
            discountCost: discountCost ? Number(discountCost) : 0, 
            otherCost: otherCost ? Number(otherCost) : 0, 
            shipperName: shipperName ? shipperName : null,
            shipperCost: shipperCost ? Number(shipperCost) : 0,
            fcuExRate: fcuExRate ? Number(fcuExRate) : 0,
            staff
        }

        //_________Kiểm tra xem có VAT, lưu trữ hồ sơ không
        //_________Nếu không thì lấy giá trị null
        if(contract && _isValid(contract)){
            dataUpdateVoucher.contract = contract
        }else{
            dataUpdateVoucher.contract = null
        }
        if(storage && _isValid(storage)){
            dataUpdateVoucher.storage = storage
        }else{
            dataUpdateVoucher.storage = null
        }
        
        return dataUpdateVoucher;
    }
    // -------------------- end function check params for add, update, remove, search -----------


    // Tạo phiếu.
    insertFull({
        ctx, authorID , fundaID, type, date, 
        dateInvoice, name, sign, signInvoice, 
        customer, receiver, note, vat, contract, 
        storage, inspection, termination, advancePayment,
        returning, forward, cancel, source, orderNew, pricePolicy,
        discountCost, otherCost, shipperName, shipperCost, staff, 
        fcuExRate, selectedJournals, isImport,
        ipc
    }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                /**
                 * Hiepnh (27/12/2019)
                 * !!!!Check xem "authorID/customer/warehouse" có thuộc companyID hay không?
                */

                // if(!date || !name || Number.isNaN(Number(type)) || !ObjectId.isValid(fundaID) || !ObjectId.isValid(authorID) || !ObjectId.isValid(customer))
                //     return resolve({ error: true, message: 'params_not_valid' });
                const checkParams = this.checkInputInsertFull({ date, name, type, fundaID, authorID, customerID: customer });
                if(checkParams.error){
                    return resolve(checkParams)
                }
                //_________Lấy số lượng phiếu hiện tại của công ty/đơn vị cơ sở
                // const number          = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.count({ funda: fundaID, type: type });
                const number          = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.count({ funda: fundaID, type: type });
                const infoFunda       = await FUNDA_COLL.findById(fundaID);
                /**
                 *  DOMI.PX4740 
                 *  infoFunda.sign = DOMI
                 *  VOUCHER_TYPES  = PX
                 *  {Number(number+1)} = 4740
                 */
                const voucherSign = `${infoFunda.sign}.${VOUCHER_TYPES[Number(type)-1].sign}${Number(number+1)}`
                const companyID = infoFunda.company;
                console.log({ companyID })
                if(sign && sign != ""){
                    const infoVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findOne({
                        funda: fundaID, 
                        sign: sign
                    }).select('_id')

                    if(!infoVoucher){
                        voucherSign = sign
                    }
                }

                const dataInsertVoucher = this.collectDataForInsertFull({
                    ctx, authorID , fundaID, type, date, 
                    dateInvoice, name, sign, signInvoice, 
                    customer, receiver, note, vat, contract, 
                    storage, inspection, termination, advancePayment,
                    returning, forward, cancel, source, orderNew, pricePolicy,
                    discountCost, otherCost, shipperName, shipperCost, staff, 
                    fcuExRate, selectedJournals, isImport,
                    ipc, voucherSign, companyID
                });

                if(dataInsertVoucher.error)
                    return resolve(dataInsertVoucher);

                const infoAfterInsert = await this.insertData(dataInsertVoucher.data);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" });
                
                // console.log({infoAfterInsert})
                
                if(selectedJournals && selectedJournals.length >0){
                    //_________Get ID của phiếu vừa tạo để tiến hành tạo chi tiết chứng từ
                    const voucherID = infoAfterInsert._id;           

                    //_________Thông tin về tài khoản thuế phải nộp/được khấu trừ
                    const infoAccount133          = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_WITH_NAME}`,{ companyID : `${companyID}`, name: '133'});
                    const listNestedAccount133    = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{ accountID: `${ infoAccount133.data._id }` });
                    const nestedAccount133        = listNestedAccount133.data.map(item => item.toString());
                    const infoAccount333          = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_WITH_NAME}`,{ companyID : `${companyID}`, name: '133'});
                    const listNestedAccount333    =await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{ accountID: `${ infoAccount333.data._id }` });
                    const nestedAccount333        = listNestedAccount333.data.map(item => item.toString());

                    for (const subitem of selectedJournals) {
                        const dataInsert = {
                            authorID, companyID, fundaID, voucher: voucherID, 
                            quantity: subitem.quantity ? Number(subitem.quantity) : 1,
                            amount: subitem.amount ? Number(subitem.amount) : 0,
                            fcuExRate: fcuExRate ? Number(fcuExRate) : 0,
                            note: subitem.note,
                            updown: (!isNaN(subitem.updown) && [1,-1].includes(Number(subitem.updown))) ? Number(subitem.updown) : 1,
                            advancePayment: (!isNaN(advancePayment) && [0,1].includes(Number(advancePayment))) ? Number(advancePayment) : 0
                        }

                        //_________Kiểm tra xem có tài khoản nợ/có không
                        //_________Nếu không thì lấy giá trị null
                        if(subitem.debit && _isValid(subitem.debit)){
                            dataInsert.debit = subitem.debit

                            //_________Kiểm tra xem có phải là 133 hoặc 333 hay không
                            if(nestedAccount133.includes(subitem.debit.toString()) || nestedAccount333.includes(subitem.debit.toString())){
                                dataInsert.vat = 1;
                            }
                        }else{
                            dataInsert.debit = null
                        }
                        if(subitem.credit && _isValid(subitem.credit)){
                            dataInsert.credit = subitem.credit

                            //_________Kiểm tra xem có phải là 133 hoặc 333 hay không
                            if(nestedAccount133.includes(subitem.credit.toString()) || nestedAccount333.includes(subitem.credit.toString())){
                                dataInsert.vat = 1;
                            }
                        }else{
                            dataInsert.credit = null
                        }

                        //_________Kiểm tra nếu có chi tiết mã khách nợ/có thì lấy theo chi tiết
                        //_________Nếu không  có thì lấy theo mã khách trên phiếu
                        if(subitem.customerDebit && _isValid(subitem.customerDebit)){
                            dataInsert.customerDebit = subitem.customerDebit
                        }else{
                            dataInsert.customerDebit = customer
                        }
                        if(subitem.customerCredit && _isValid(subitem.customerCredit)){
                            dataInsert.customerCredit = subitem.customerCredit
                        }else{
                            dataInsert.customerCredit = customer
                        }

                        //_________Kiểm tra xem có hàng hóa/kho hay không
                        //_________Nếu không  có thì lấy theo mã khách trên phiếu
                        //_________Chỉ insert khi có cả thông tin goods và warehouse
                        if(subitem.goods && _isValid(subitem.goods) && subitem.warehouse && _isValid(subitem.warehouse)){
                            dataInsert.goods = subitem.goods
                            dataInsert.warehouse = subitem.warehouse
                        }else{
                            dataInsert.goods = null
                            dataInsert.warehouse = null
                        }

                        //_________Kiểm tra xem có Hợp đồng hay không
                        //_________Nếu không  có thì lấy theo hợp đồng trên phiếu
                        if(subitem.contract && _isValid(subitem.contract)){
                            dataInsert.contract = subitem.contract
                        }else{
                            if(contract && _isValid(contract)){
                                dataInsert.contract = contract;
                            }
                        }

                        //_________Kiểm tra xem có Dự án hay không (phục vụ ngân sách dự án)
                        if(subitem.project && _isValid(subitem.project)){
                            dataInsert.project = subitem.project
                        }

                        //_________Nếu tạo phiếu link với khoản mục phí ứng dụng Quản lý chi phí/Ngân sách
                        if(subitem.budget && _isValid(subitem.budget)){
                            let infoGroup = await BUDGET_JOB_COLL.findById(subitem.budget);
                            dataInsert.job = subitem.budget;
                            dataInsert.group = infoGroup.group;
                        }
                        //_________Tiến hành tạo chi tiết_________//
                        const res = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.insertFull(dataInsert)
                        console.log({res})
                    }
                }

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                console.log(`ERROR [ACCOUNTING][INSERT_FULL_VOUCHER]: ${error}`);
                return resolve({ error: true, message: error.message });
            }
        })
    }
    
    //__________Cập nhật phiếu
    // Author: HiepNH
    update({ 
        voucherID, type, date, dateInvoice, 
        name, sign, signInvoice, customer, 
        receiver, warehouse, note, vat, contract, 
        storage, inspection, termination, advancePayment,
        returning, forward, cancel, selectedJournals, deletedJournals,
        source, orderNew, pricePolicy, discountCost, otherCost, shipperName,
        shipperCost, staff, fcuExRate, authorID, companyID, fundaID
    }){
        return new Promise(async (resolve) => {
            try {
                let info = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(voucherID);
                if (!info) 
                    return resolve({ error: true, message: 'cannot_get_info' });

                // // Cập nhật phiếu
                // if(!date || !name || Number.isNaN(Number(type)) || !ObjectId.isValid(voucherID) || !ObjectId.isValid(authorID) || !ObjectId.isValid(customer))
                //     return resolve({ error: true, message: 'params_not_valid' });

                const checkParams  = this.checkInputUpdate({ date, name, type, voucherID, authorID, customerID: customer});
                if(checkParams.error){
                    return resolve(checkParams)
                }
                let infoVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findOne({
                    funda: fundaID, 
                    sign: sign,
                    _id: {
                        $ne: voucherID
                    }
                }).select('_id')

                if(infoVoucher)
                    return resolve({ error: true, message: "Mã phiếu đã tồn tại" }); 

                const dataUpdateVoucher = this.collectDataForUpdate({
                    authorID, type, date, dateInvoice, 
                    name, sign, signInvoice, customer, 
                    receiver, note, inspection, termination,
                    vat, advancePayment, returning, forward,
                    cancel, source, orderNew, pricePolicy,
                    discountCost, otherCost, shipperName,
                    shipperCost, fcuExRate, staff, contract,
                    storage
                });

                const infoAfterUpdate = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findByIdAndUpdate(voucherID, dataUpdateVoucher, { new: true });
                // console.log(infoAfterUpdate)
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });

                // Cần hỏi ý kiến ---!
                // //_________Thông tin về tài khoản thuế phải nộp/được khấu trừ
                // let infoAccount133 = await ACCOUNT_MODEL.getInfoAccountWithName({ companyID, name: '133' });
                // let listNestedAccount133 = await GENERAL_JOURNAL.getListNestedItem({ accountID: infoAccount133.data._id });
                // let nestedAccount133 = listNestedAccount133.data.map(item => item.toString());

                // let infoAccount333 = await ACCOUNT_MODEL.getInfoAccountWithName({ companyID, name: '333' });
                // let listNestedAccount333 = await GENERAL_JOURNAL.getListNestedItem({ accountID: infoAccount333.data._id });
                // let nestedAccount333 = listNestedAccount333.data.map(item => item.toString());

                // Cập nhật phiếu + xoá phiếu

                // // Cập nhật chi tiết
                // if(selectedJournals){
                //     let listJorID=  []
                //     for (const subitem of selectedJournals) {
                //         // Kiểm tra nếu là mới thì cho tạo, không thì cho cập nhật
                //         if(!subitem.journalID){
                //             let dataInsert = {
                //                 authorID, companyID, fundaID, voucher: voucherID, 
                //                 quantity: subitem.quantity ? Number(subitem.quantity) : 1,
                //                 amount: subitem.amount ? Number(subitem.amount) : 0,
                //                 fcuExRate: fcuExRate ? Number(fcuExRate) : 0,
                //                 note: subitem.note,
                //                 updown: (!isNaN(subitem.updown) && [1,-1].includes(Number(subitem.updown))) ? Number(subitem.updown) : 1,
                //                 advancePayment: (!isNaN(advancePayment) && [0,1].includes(Number(advancePayment))) ? Number(advancePayment) : 0
                //             }

                //             //_________Kiểm tra xem có tài khoản nợ/có không
                //             //_________Nếu không thì lấy giá trị null
                //             if(subitem.debit && _isValid(subitem.debit)){
                //                 dataInsert.debit = subitem.debit

                //                 //_________Kiểm tra xem có phải là 133 hoặc 333 hay không
                //                 if(nestedAccount133.includes(subitem.debit.toString()) || nestedAccount333.includes(subitem.debit.toString())){
                //                     dataInsert.vat = 1;
                //                 }                                
                //             }else{
                //                 dataInsert.debit = null
                //             }
                //             if(subitem.credit && _isValid(subitem.credit)){
                //                 dataInsert.credit = subitem.credit

                //                 //_________Kiểm tra xem có phải là 133 hoặc 333 hay không
                //                 if(nestedAccount133.includes(subitem.credit.toString()) || nestedAccount333.includes(subitem.credit.toString())){
                //                     dataInsert.vat = 1;
                //                 }                                
                //             }else{
                //                 dataInsert.credit = null
                //             }

                //             //_________Kiểm tra nếu có chi tiết mã khách nợ/có thì lấy theo chi tiết
                //             //_________Nếu không  có thì lấy theo mã khách trên phiếu
                //             if(subitem.customerDebit && _isValid(subitem.customerDebit)){
                //                 dataInsert.customerDebit = subitem.customerDebit
                //             }else{
                //                 dataInsert.customerDebit = customer
                //             }
                //             if(subitem.customerCredit && _isValid(subitem.customerCredit)){
                //                 dataInsert.customerCredit = subitem.customerCredit
                //             }else{
                //                 dataInsert.customerCredit = customer
                //             }

                //             //_________Kiểm tra xem có hàng hóa/kho hay không
                //             //_________Nếu không  có thì lấy theo mã khách trên phiếu
                //             //_________Chỉ insert khi có cả thông tin goods và warehouse
                //             if(subitem.goods && _isValid(subitem.goods)){
                //                 if(subitem.warehouse && _isValid(subitem.warehouse)){
                //                     dataInsert.goods = subitem.goods
                //                     dataInsert.warehouse = subitem.warehouse
                //                 }else{
                //                     if(warehouse && _isValid(warehouse)){
                //                         dataInsert.goods = subitem.goods
                //                         dataInsert.warehouse = warehouse
                //                     }
                //                 }
                //             }

                //             //_________Kiểm tra xem có Hợp đồng hay không
                //             if(subitem.contract && _isValid(subitem.contract)){
                //                 dataInsert.contract = subitem.contract
                //             }else{
                //                 if(contract && _isValid(contract)){
                //                     dataInsert.contract = contract;
                //                 }
                //             }

                //             //_________Kiểm tra xem có Dự án hay không (phục vụ ngân sách dự án)
                //             if(subitem.project && _isValid(subitem.project)){
                //                 dataInsert.project = subitem.project
                //             }

                //             //_________Nếu tạo phiếu link với khoản mục phí ứng dụng Quản lý chi phí/Ngân sách
                //             if(subitem.budget && _isValid(subitem.budget)){
                //                 let infoGroup = await BUDGET_JOB_COLL.findById(subitem.budget);
                //                 dataInsert.job = subitem.budget;
                //                 dataInsert.group = infoGroup.group;
                //             }
                //             // console.log('==============Tạo mới==============>')
                //             //_________Tiến hành tạo chi tiết_________//
                //             let infoAfterInsert = await GENERAL_JOURNAL.insertFull(dataInsert);
                //             listJorID.push(infoAfterInsert.data._id)
                //         }else{
                //             let dataUpdate = {
                //                 journalID: subitem.journalID,
                //                 authorID, 
                //                 quantity: subitem.quantity ? Number(subitem.quantity) : 1,
                //                 amount: subitem.amount ? Number(subitem.amount) : 0,
                //                 fcuExRate: fcuExRate ? Number(fcuExRate) : 0,
                //                 note: subitem.note,
                //                 updown: (!isNaN(subitem.updown) && [1,-1].includes(Number(subitem.updown))) ? Number(subitem.updown) : 1,
                //                 advancePayment: (!isNaN(advancePayment) && [0,1].includes(Number(advancePayment))) ? Number(advancePayment) : 0,
                //                 customerDebit: customer,
                //                 customerCredit: customer
                //             }

                //             //_________Kiểm tra xem có tài khoản nợ/có không
                //             //_________Nếu không thì lấy giá trị null
                //             if(subitem.debit && _isValid(subitem.debit)){
                //                 // console.log('==============1==============>')
                //                 dataUpdate.debit = subitem.debit

                //                 //_________Kiểm tra xem có phải là 133 hoặc 333 hay không
                //                 if(nestedAccount133.includes(subitem.debit.toString()) || nestedAccount333.includes(subitem.debit.toString())){
                //                     dataUpdate.vat = 1;
                //                 }                                
                //             }else{
                //                 // console.log('==============0==============>')
                //                 dataUpdate.debit = null
                //             }
                //             if(subitem.credit && _isValid(subitem.credit)){
                //                 dataUpdate.credit = subitem.credit

                //                 //_________Kiểm tra xem có phải là 133 hoặc 333 hay không
                //                 if(nestedAccount133.includes(subitem.credit.toString()) || nestedAccount333.includes(subitem.credit.toString())){
                //                     dataUpdate.vat = 1;
                //                 }                                
                //             }else{
                //                 dataUpdate.credit = null
                //             }

                //             //_________Kiểm tra nếu có chi tiết mã khách nợ/có thì lấy theo chi tiết
                //             //_________Nếu không  có thì lấy theo mã khách trên phiếu
                //             if(subitem.customerDebit && _isValid(subitem.customerDebit)){
                //                 dataUpdate.customerDebit = subitem.customerDebit
                //             }else{
                //                 dataUpdate.customerDebit = customer
                //             }
                //             if(subitem.customerCredit && _isValid(subitem.customerCredit)){
                //                 dataUpdate.customerCredit = subitem.customerCredit
                //             }else{
                //                 dataUpdate.customerCredit = customer
                //             }

                //             //_________Kiểm tra xem có hàng hóa/kho hay không
                //             //_________Nếu không  có thì lấy theo mã khách trên phiếu
                //             //_________Chỉ insert khi có cả thông tin goods và warehouse
                //             if(subitem.goods && _isValid(subitem.goods)){
                //                 if(subitem.warehouse && _isValid(subitem.warehouse)){
                //                     dataUpdate.goods = subitem.goods
                //                     dataUpdate.warehouse = subitem.warehouse
                //                 }else{
                //                     if(warehouse && _isValid(warehouse)){
                //                         dataUpdate.goods = subitem.goods
                //                         dataUpdate.warehouse = warehouse
                //                     }
                //                 }
                //             }else{
                //                 dataUpdate.goods = null
                //                 dataUpdate.warehouse = null
                //             }

                //             //_________Kiểm tra xem có hợp đồng hay không
                //             if(subitem.contract && _isValid(subitem.contract)){
                //                 dataUpdate.contract = subitem.contract
                //             }else{
                //                 if(contract && _isValid(contract)){
                //                     dataUpdate.contract = contract;
                //                 }else{
                //                     dataUpdate.contract = null
                //                 }
                //             }

                //             //_________Kiểm tra xem có Dự án hay không (phục vụ ngân sách dự án)
                //             if(subitem.project && _isValid(subitem.project)){
                //                 dataUpdate.project = subitem.project
                //             }

                //             //_________Nếu tạo phiếu link với khoản mục phí ứng dụng Quản lý chi phí/Ngân sách
                //             if(subitem.budget && _isValid(subitem.budget)){
                //                 let infoGroup = await BUDGET_JOB_COLL.findById(subitem.budget);
                //                 dataUpdate.job = subitem.budget;
                //                 dataUpdate.group = infoGroup.group;
                //             }else{
                //                 dataUpdate.job = null
                //                 dataUpdate.group = null
                //             }
                //             // console.log('==============Cập nhật==============>')
                //             // console.log(dataUpdate)

                //             //_________Tiến hành cập nhật chi tiết_________//
                //             let resultUpdate =await GENERAL_JOURNAL.update(dataUpdate);
                //             listJorID.push(resultUpdate.data._id);
                //         }
                //     }
                //     let infoAfterUpdate = await VOUCHER_COLL.findByIdAndUpdate(voucherID,{ journals : listJorID }, { new: true });
                //     // console.log(infoAfterUpdate)
                //     if(!infoAfterUpdate)
                //         return resolve({ error: true, message: "cannot_update" });
                // }
                

                // //_________Tiến hành xóa chi tiết_________//
                // if(deletedJournals){
                //     // console.log('==============Xóa==============>')
                //     for(const item of deletedJournals){
                //         await GENERAL_JOURNAL.remove({ journalID: item })
                //     }
                // }
                    
                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    collectDataForUpdate( ctx, authorID , fundaID, type, date, 
        dateInvoice, name, sign, signInvoice, 
        customer, receiver, note, vat, contract, 
        storage, inspection, termination, advancePayment,
        returning, forward, cancel, source, orderNew, pricePolicy,
        discountCost, otherCost, shipperName, shipperCost, staff, 
        fcuExRate, selectedJournals, isImport, voucherSign,
        ipc, subtype, fee){
        //_________Khai báo dữ liệu
        let dataUpdateVoucher = {
            userUpdate: authorID, 
            modifyAt: Date.now(),
            type,
            date, 
            dateInvoice, 
            name, 
            sign, 
            signInvoice, 
            customer, 
            receiver,
            note,
            inspection, 
            termination,
            vat: vat ? Number(vat) : 0,
            advancePayment: advancePayment ? Number(advancePayment) : 0,
            returning: returning ? Number(returning) : 0,
            forward: forward ? Number(forward) : 0,
            cancel: cancel ? Number(cancel) : 0,
            source: source ? Number(source) : 1, // Dành riêng cho bán hàng
            orderNew: orderNew ? Number(orderNew) : 1, 
            pricePolicy: pricePolicy ? Number(pricePolicy) : 1, 
            discountCost: discountCost ? Number(discountCost) : 0, 
            otherCost: otherCost ? Number(otherCost) : 0, 
            shipperName: shipperName ? shipperName : null,
            shipperCost: shipperCost ? Number(shipperCost) : 0,
            fcuExRate: fcuExRate ? Number(fcuExRate) : 0,
            staff
        }

        //_________Kiểm tra xem có VAT, lưu trữ hồ sơ không
        //_________Nếu không thì lấy giá trị null
        if(contract && _isValid(contract)){
            dataUpdateVoucher.contract = contract
        }

        if(storage && _isValid(storage)){
            dataUpdateVoucher.storage = storage
        }

        if(ipc){
            if(!ObjectId.isValid(ipc)){
                return { error: true, message: "ipc_invalid" }
            }
            dataUpdateVoucher.ipc = ipc;
        }

        if(subtype){
            if(!ObjectId.isValid(subtype)){
                return { error: true, message: "subtype_invalid" }
            }
            dataUpdateVoucher.subtype = subtype;
        }

        if(fee){
            if(!ObjectId.isValid(fee)){
                return { error: true, message: "fee_invalid" }
            }
            dataUpdateVoucher.fee = fee;
        }

        return  { error: false, data: dataUpdateVoucher };
    }

    checkInputUpdateWithNewJournals( voucherId, journalAmount, journalFcuAmount){
        if(!ObjectId.isValid(voucherId) || Number.isNaN(Number(journalAmount)) || Number.isNaN(Number(journalFcuAmount)))
            return false;
        return true;        
    }
    // Cập nhật phiếu khi có chi tiết phiếu mới.
    // Cập nhật phiếu khi có chi tiết phiếu mới.
    updateWithNewJournal({ voucherId, journalAmount, journalFcuAmount }){
        const that = this;
        return new Promise(async (resolve, reject) => {
            try {
                const checkInput = this.checkInputUpdateWithNewJournals(voucherId, journalAmount, journalFcuAmount)
                if(!checkInput)
                    return resolve({ error: true, message: 'params_not_valid', data: null });
            
                const infoVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(voucherId);
                if(!infoVoucher)
                    return resolve({ erorr: true, message:'voucher_exits', data: null });
                
                const dataUpdateVoucher = {
                    amount: Number(infoVoucher.amount || 0) + Number(journalAmount || 0), 
                    fcuAmount: Number(infoVoucher.fcuAmount || 0) + Number(journalFcuAmount || 0)
                }
                const resultUpdateVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findByIdAndUpdate(voucherId,dataUpdateVoucher);
                if(!resultUpdateVoucher)
                    return resolve({ erorr: true, message: 'update_voucher_fail', data : resultUpdateVoucher });
            
                return resolve({ erorr: false, message: 'successfully_update_voucher', data : resultUpdateVoucher });

            } catch (error) {
                console.log(`ERROR [ACCOUNTING][UPDATE_VOUCHER]: ${error}`);
                return resolve({ erorr: true, message: 'update_voucher_fail' });
            }
        });
    }
}
exports.MODEL = new AccountingFinancialVoucher;

// test

// const run =  new AccountingFinancialVoucher;
// (async()=>{
//     const result = await run.insertFull({forward: 0,
//         forwardIs: 0,
//         returning: 0,
//         advancePayment: 0,
//         cancel: 0,
//         selectedJournals: [
//             ObjectId("6198727abc3b2e745ae5277d"),
//             ObjectId("6198727abc3b2e745ae5277e"),
//             ObjectId("6198727abc3b2e745ae5277f")
//         ],
//         type: 1,
//         vat: 0,
//         dateInvoice: "2021-11-30T07:00:00.000+07:00",
//         status: 1,
//         lock: 0,
//         sign: "CPMI.PKT649",
//         fcuExRate: 0,
//         staff: [],
//         source: 1,
//         orderNew: 1,
//         pricePolicy: 1,
//         discountCost: 0,
//         otherCost: 0,
//         shipperCost: 0,
//         files: [],
//         company: ObjectId("5e8415e651d84b60937abe71"),
//         fundaID: ObjectId("5e846addd7e3490be59ae8d5"),
//         authorID: ObjectId("5f2cc4bd039d212061a13986"),
//         date: "2021-11-30T07:00:00.000+07:00",
//         name: "HT doanh thu - công nợ của Asana tiền điện, phí làm thêm ngoài giờ, gửi xe Tháng 10/2021",
//         signInvoice: "CPMI.PKT418",
//         customer: ObjectId("5fb37ee7e5c18a7517c3aa5a"),
//     shipperName: null})
//     console.log({result})
// })()

// const data = {
// "forward": 0,
// "forwardIs": 0,
// "returning": 0,
// "advancePayment": 0,
// "cancel": 0,
// "journals": [
//     ObjectId("6198727abc3b2e745ae5277d"),
//     ObjectId("6198727abc3b2e745ae5277e"),
//     ObjectId("6198727abc3b2e745ae5277f")
// ],
// "type": 1,
// "vat": 0,
// "dateInvoice": "2021-11-30T07:00:00.000+07:00",
// "status": 1,
// "lock": 0,
// "sign": "CPMI.PKT649",
// "fcuExRate": 0,
// "staff": [],
// "source": 1,
// "orderNew": 1,
// "pricePolicy": 1,
// "discountCost": 0,
// "otherCost": 0,
// "shipperCost": 0,
// "files": [],
// "company": ObjectId("5e8415e651d84b60937abe71"),
// "funda": ObjectId("5e846addd7e3490be59ae8d5"),
// "userCreate": ObjectId("5f2cc4bd039d212061a13986"),
// "date": ISODate("2021-11-30T07:00:00.000+07:00"),
// "name": "HT doanh thu - công nợ của Asana tiền điện, phí làm thêm ngoài giờ, gửi xe Tháng 10/2021",
// "signInvoice": "CPMI.PKT418",
// "customer": ObjectId("5fb37ee7e5c18a7517c3aa5a"),
// "shipperName": null}