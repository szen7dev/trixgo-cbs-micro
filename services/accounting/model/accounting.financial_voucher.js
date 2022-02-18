"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const ObjectId                          = require('mongoose').Types.ObjectId;
const moment                            = require('moment')

/**
 * DOMAIN AND ACTIONS
*/

/**
 * CONSTANTS
*/
const { CF_DOMAIN_SERVICES } 	= require('../../gateway/helper/domain.constant');
const { VOUCHER_TYPES }         = require('../config/accounting.financial_config');
const { CF_ACTIONS_ITEM }       = require('../../item/helper/item.actions-constant');
const PERPAGE_CORE              = 20;
/**
 * TOOLS
*/
const { _isValid, _getLevelMaxInRecursive, _constructForAny, _getLevelMaxInRecursiveByCompany, IsJsonString }  = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');

// update  phân trang sau
// const { RANGE_BASE_PAGINATION } 	    = require('../../../tools/cursor_base/playground/index');
// const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * COLLECTIONS
*/
const ACCOUNTING__FINANCIAL_VOUCHER_COLL            = require('../database/accounting.financial_voucher-coll');
const FUNDA_COLL                                    = require('../../item/database/item.funda-coll');
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL    = require('../database/accounting.financial_general_journal-coll');

/**
 * MODELS
*/
// const ITEM__ACCOUNT_MODEL                        = require('../../item/model/item.account-model').MODEL;
// const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL     = require('../model/accounting.financial_general_journal').MODEL;

class AccountingFinancialVoucher extends BaseModel {
    
    constructor() {
        super(require('../database/accounting.financial_voucher-coll'));
    }

    // -------------------- start function check params for add, update, remove, search -----------
    checkInputVoucher({ date, name, type, authorID, customerID }){
        if(!date)
            return { error: true, message: 'date_invalid', status: 400 };
            
        if(!name)
            return { error: true, message: 'name_invalid', status: 400 };

        if(Number.isNaN(Number(type))){
            return { error: true, message: 'type_invalid', status: 400 };
        }

        if(!authorID || !ObjectId.isValid(authorID))
            return { error: true, message: 'authorID_invalid', status: 400};

        if(!customerID || !ObjectId.isValid(customerID))
            return { error: true, message: 'customer_invalid', status: 400 };

        return { error: false };
    }

    checkInputInsertFull({ date, name, type, fundaID, authorID, customerID }){
        const checkVoucher = this.checkInputVoucher({ date, name, type, authorID, customerID });
        if(checkVoucher.error)
            return checkVoucher; 

        if(!fundaID || !ObjectId.isValid(fundaID))
            return { error: true, message: 'fundaId_invalid', status: 400};

        return { error: false }; 
    }

    checkInputUpdate({ date, name, type, voucherID, authorID, customerID }){
        const checkVoucher = this.checkInputVoucher({ date, name, type, authorID, customerID });
        if(checkVoucher.error)
            return checkVoucher; 
        if(!voucherID || !ObjectId.isValid(voucherID))
            return { error: true, message: 'voucherID_invalid', status: 400 };

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
        ipc, subtype, fee, project }){
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
                return { error: true, message: "ipc_invalid", status: 400 }
            }
            dataInsertVoucher.ipc = ipc;
        }

        if(subtype){
            if(!ObjectId.isValid(subtype)){
                return { error: true, message: "subtype_invalid", status: 400}
            }
            dataInsertVoucher.subtype = subtype;
        }

        if(fee){
            if(!ObjectId.isValid(fee)){
                return { error: true, message: "fee_invalid", status: 400 }
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
        storage, project, ipc, subtype, fee
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
            staff, 
            project, subtype, fee
        }

        if(ipc && _isValid(ipc)){
            dataUpdateVoucher.ipc = ipc
        }else{
            dataUpdateVoucher.ipc = null
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
        // function checkInputObejctId(value, messageError){
        //     if(value){
        //         if(!ObjectId.isValid(value)){
        //             return { error: true, message: messageError }
        //         }
        //         dataUpdateVoucher[value] = value;
        //     }
        // }
        // New field
        if(project){
            if(!ObjectId.isValid(project)){
                return { error: true, message: "project_invalid", status: 400 }
            }
            dataUpdateVoucher.project = project;
        }

        if(ipc){
            if(!ObjectId.isValid(ipc)){
                return { error: true, message: "ipc_invalid", status: 400 }
            }
            dataUpdateVoucher.ipc = ipc;
        }

        if(subtype){
            if(!ObjectId.isValid(subtype)){
                return { error: true, message: "subtype_invalid", status: 400 }
            }
            dataUpdateVoucher.subtype = subtype;
        }

        if(fee){
            if(!ObjectId.isValid(fee)){
                return { error: true, message: "fee_invalid", status: 400 }
            }
            dataUpdateVoucher.fee = fee;
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
        ipc, fee, subtype, project
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


                let voucherSign = `${infoFunda.sign}.${VOUCHER_TYPES[Number(type)-1].sign}${Number(number+1)}`
                const companyID = infoFunda.company;
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
                    authorID , fundaID, type, date, 
                    dateInvoice, name, sign, signInvoice, 
                    customer, receiver, note, vat, contract, 
                    storage, inspection, termination, advancePayment,
                    returning, forward, cancel, source, orderNew, pricePolicy,
                    discountCost, otherCost, shipperName, shipperCost, staff, 
                    fcuExRate, selectedJournals, isImport, voucherSign, companyID,
                    ipc, subtype, fee, project
                });

                if(dataInsertVoucher.error)
                    return resolve(dataInsertVoucher);

                const infoAfterInsert = await this.insertData(dataInsertVoucher.data);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert", status: 400 });
                
                if(selectedJournals && selectedJournals.length >0){
                    //_________Get ID của phiếu vừa tạo để tiến hành tạo chi tiết chứng từ
                    const voucherID = infoAfterInsert._id;           

                    //_________Thông tin về tài khoản thuế phải nộp/được khấu trừ
                    const infoAccount133          = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_WITH_NAME}`,{ companyID : `${companyID}`, name: '133'});
                    const listNestedAccount133    = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{ accountID: `${ infoAccount133.data._id }` });
                    const nestedAccount133        = listNestedAccount133.data.map(item => item.toString());
                    const infoAccount333          = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_WITH_NAME}`,{ companyID : `${companyID}`, name: '133'});
                    const listNestedAccount333    = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{ accountID: `${ infoAccount333.data._id }` });
                    const nestedAccount333        = listNestedAccount333.data.map(item => item.toString());

                    for (const subitem of selectedJournals) {
                        const dataInsert = {
                            authorID, companyID, fundaID, voucher: voucherID, 
                            quantity: subitem.quantity ? Number(subitem.quantity) : 1,
                            amount: subitem.amount ? Number(subitem.amount) : 0,
                            unitprice: subitem.unitprice ? Number(subitem.unitprice) : 0,
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
                        const res = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.insertFull(dataInsert);
                    }
                }

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                console.log(`ERROR [ACCOUNTING][INSERT_FULL_VOUCHER]: ${error}`);
                return resolve({ error: true, message: `error voucher services : ${error.message}`, status: 400 });
            }
        })
    }

    // Author: HiepNH.
    //__________Cập nhật phiếu.
    // Author: HiepNH.
    update({ 
        ctx,voucherID, type, date, dateInvoice, 
        name, sign, signInvoice, customer, 
        receiver, warehouse, note, vat, contract, 
        storage, inspection, termination, advancePayment,
        returning, forward, cancel, selectedJournals, deletedJournals,
        source, orderNew, pricePolicy, discountCost, otherCost, shipperName,
        shipperCost, staff, fcuExRate, authorID, companyID, fundaID,
         project, subtype, fee, ipc
    }){
        return new Promise(async (resolve) => {
            try {
                let info = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(voucherID);
                
                if (!info) 
                    return resolve({ error: true, message: 'cannot_get_info', status: 400 });

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
                    return resolve({ error: true, message: "Mã phiếu đã tồn tại", status: 400 }); 

                if(!fundaID)
                    fundaID = info.funda;

                const dataUpdateVoucher = this.collectDataForUpdate({
                    authorID, type, date, dateInvoice, 
                    name, sign, signInvoice, customer, 
                    receiver, note, inspection, termination,
                    vat, advancePayment, returning, forward,
                    cancel, source, orderNew, pricePolicy,
                    discountCost, otherCost, shipperName,
                    shipperCost, fcuExRate, staff, contract,
                    storage, project, subtype, fee, ipc
                });

                const infoAfterUpdate = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findByIdAndUpdate(voucherID, dataUpdateVoucher, { new: true });
                // console.log(infoAfterUpdate)
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "cannot_update", status: 400 });

                // Cần hỏi ý kiến ---!
                // //_________Thông tin về tài khoản thuế phải nộp/được khấu trừ
                const infoAccount133          = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_WITH_NAME}`,{ companyID : `${companyID}`, name: '133'});
                const listNestedAccount133    = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{ accountID: `${ infoAccount133.data._id }` });
                const nestedAccount133        = listNestedAccount133.data.map(item => item.toString());
                const infoAccount333          = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_WITH_NAME}`,{ companyID : `${companyID}`, name: '133'});
                const listNestedAccount333    = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED}`,{ accountID: `${ infoAccount333.data._id }` });
                const nestedAccount333        = listNestedAccount333.data.map(item => item.toString());

                //// Cập nhật phiếu + xoá phiếu
                // Cập nhật chi tiết
                if(selectedJournals){
                    for (const subitem of selectedJournals) {
                        // Kiểm tra nếu là mới thì cho tạo, không thì cho cập nhật
                        if(!subitem.journalID){
                            let dataInsert = {
                                authorID, companyID, fundaID, voucher: voucherID, 
                                quantity: subitem.quantity ? Number(subitem.quantity) : 1,
                                amount: subitem.amount ? Number(subitem.amount) : 0,
                                unitprice: subitem.unitprice ? Number(subitem.unitprice) : 0,
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
                            if(subitem.goods && _isValid(subitem.goods)){
                                if(subitem.warehouse && _isValid(subitem.warehouse)){
                                    dataInsert.goods = subitem.goods
                                    dataInsert.warehouse = subitem.warehouse
                                }else{
                                    if(warehouse && _isValid(warehouse)){
                                        dataInsert.goods = subitem.goods
                                        dataInsert.warehouse = warehouse
                                    }
                                }
                            }

                            //_________Kiểm tra xem có Hợp đồng hay không
                            if(subitem.contract && _isValid(subitem.contract)){
                                dataInsert.contract = subitem.contract;
                            }else{
                                if(contract && _isValid(contract)){
                                    dataInsert.contract = contract;
                                }
                            }

                            //_________Kiểm tra xem có Dự án hay không (phục vụ ngân sách dự án)
                            if(subitem.project && _isValid(subitem.project)){
                                dataInsert.project = subitem.project
                            }

                            ////_________Nếu tạo phiếu link với khoản mục phí ứng dụng Quản lý chi phí/Ngân sách
                            // if(subitem.budget && _isValid(subitem.budget)){
                            //     let infoGroup = await BUDGET_JOB_COLL.findById(subitem.budget);
                            //     dataInsert.job = subitem.budget;
                            //     dataInsert.group = infoGroup.group;
                            // }
                            // console.log('==============Tạo mới==============>')
                            //_________Tiến hành tạo chi tiết_________//
                            let infoAfterInsert = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.insertFull(dataInsert);
                        }else{
                            let dataUpdate = {
                                journalID: subitem.journalID,
                                authorID, 
                                // quantity: subitem.quantity ? Number(subitem.quantity) : 1,
                                // amount: subitem.amount ? Number(subitem.amount) : 0,
                                // unitprice: subitem.unitprice ? Number(subitem.unitprice) : 0,
                                fcuExRate: fcuExRate ? Number(fcuExRate) : 0,
                                note: subitem.note,
                                updown: (!isNaN(subitem.updown) && [1,-1].includes(Number(subitem.updown))) ? Number(subitem.updown) : 1,
                                advancePayment: (!isNaN(advancePayment) && [0,1].includes(Number(advancePayment))) ? Number(advancePayment) : 0,
                                customerDebit: customer,
                                customerCredit: customer
                            }
                            if(subitem.quantity && subitem.unitprice){
                                dataUpdate.quantity = subitem.quantity ? Number(subitem.quantity) : 1;
                                dataUpdate.amount = subitem.amount ? Number(subitem.amount) : 0;
                                dataUpdate.unitprice = subitem.unitprice ? Number(subitem.unitprice) : 0;
                            }
                            //_________Kiểm tra xem có tài khoản nợ/có không
                            //_________Nếu không thì lấy giá trị null
                            if(subitem.debit && _isValid(subitem.debit)){
                                // console.log('==============1==============>')
                                dataUpdate.debit = subitem.debit

                                //_________Kiểm tra xem có phải là 133 hoặc 333 hay không
                                if(nestedAccount133.includes(subitem.debit.toString()) || nestedAccount333.includes(subitem.debit.toString())){
                                    dataUpdate.vat = 1;
                                }                                
                            }else{
                                // console.log('==============0==============>')
                                dataUpdate.debit = null
                            }

                            if(subitem.credit && _isValid(subitem.credit)){
                                dataUpdate.credit = subitem.credit

                                //_________Kiểm tra xem có phải là 133 hoặc 333 hay không
                                if(nestedAccount133.includes(subitem.credit.toString()) || nestedAccount333.includes(subitem.credit.toString())){
                                    dataUpdate.vat = 1;
                                }                                
                            }else{
                                dataUpdate.credit = null
                            }

                            //_________Kiểm tra nếu có chi tiết mã khách nợ/có thì lấy theo chi tiết
                            //_________Nếu không  có thì lấy theo mã khách trên phiếu
                            if(subitem.customerDebit && _isValid(subitem.customerDebit)){
                                dataUpdate.customerDebit = subitem.customerDebit
                            }else{
                                dataUpdate.customerDebit = customer
                            }
                            if(subitem.customerCredit && _isValid(subitem.customerCredit)){
                                dataUpdate.customerCredit = subitem.customerCredit
                            }else{
                                dataUpdate.customerCredit = customer
                            }

                            //_________Kiểm tra xem có hàng hóa/kho hay không
                            //_________Nếu không  có thì lấy theo mã khách trên phiếu
                            //_________Chỉ insert khi có cả thông tin goods và warehouse
                            if(subitem.goods && _isValid(subitem.goods)){
                                if(subitem.warehouse && _isValid(subitem.warehouse)){
                                    dataUpdate.goods = subitem.goods
                                    dataUpdate.warehouse = subitem.warehouse
                                }else{
                                    if(warehouse && _isValid(warehouse)){
                                        dataUpdate.goods = subitem.goods
                                        dataUpdate.warehouse = warehouse
                                    }
                                }
                            }else{
                                dataUpdate.goods = null
                                dataUpdate.warehouse = null
                            }

                            //_________Kiểm tra xem có hợp đồng hay không
                            if(subitem.contract && _isValid(subitem.contract)){
                                dataUpdate.contract = subitem.contract
                            }else{
                                if(contract && _isValid(contract)){
                                    dataUpdate.contract = contract;
                                }else{
                                    dataUpdate.contract = null
                                }
                            }

                            //_________Kiểm tra xem có Dự án hay không (phục vụ ngân sách dự án)
                            if(subitem.project && _isValid(subitem.project)){
                                dataUpdate.project = subitem.project
                            }

                            //_________Nếu tạo phiếu link với khoản mục phí ứng dụng Quản lý chi phí/Ngân sách
                            if(subitem.budget && _isValid(subitem.budget)){
                                // let infoGroup = await BUDGET_JOB_COLL.findById(subitem.budget);
                                // dataUpdate.job = subitem.budget;
                                // dataUpdate.group = infoGroup.group;
                            }else{
                                dataUpdate.job = null
                                dataUpdate.group = null
                            }
                            // console.log('==============Cập nhật==============>')
                            // console.log(dataUpdate)

                            //_________Tiến hành cập nhật chi tiết_________//
                            let resultUpdate = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.update(dataUpdate);
                        }
                    }
                }
                const listJunral = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.find({ voucher: voucherID });

                if(listJunral){
                    let arrayUpdateJounral  = []
                    listJunral.forEach(journal=>{
                        arrayUpdateJounral.push(
                            ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findByIdAndUpdate(journal._id,{  date: infoAfterUpdate.date })
                        )
                    });
                    await Promise.all(arrayUpdateJounral);
                }
                //_________Tiến hành xóa chi tiết_________//
                if(deletedJournals){
                    // console.log('==============Xóa==============>')
                    for(const item of deletedJournals){
                        await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL.remove({ journalID: item });
                    }
                }
                    
                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                console.log(`ERROR [ACCOUNTING][UPDATE_VOUCHER]: ${error}`);
                return resolve({ error: true, message: error.message, status: 400 });
            }
        })
    }

    checkInputUpdateWithNewJournals({ voucherId, journalAmount, journalFcuAmount }){
        if(!ObjectId.isValid(voucherId)){
            return { error : true, message:'invalid_voucherId', status: 400 }
        }

        if(Number.isNaN(Number(journalAmount))){
            return { error : true, message:'invalid_journalAmount', status: 400 }
        }

        if(Number.isNaN(Number(journalFcuAmount))){
            return { error : true, message:'invalid_journalFcuAmount', status: 400 }
        }

        return { error: false };  
    }

    // Cập nhật một số trưởng như amout, fcuAmount, date khi có 1 chi tiết phiếu thay đổi thông tin.
    updateWithChangingJournal({ voucherId, journalAmount, journalFcuAmount }){
        const that = this;
        return new Promise(async (resolve, reject) => {
            try {
                const checkInput = this.checkInputUpdateWithNewJournals({ voucherId, journalAmount, journalFcuAmount })
                if(checkInput.error)
                    return resolve(checkInput);
                
                const infoVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(voucherId);

                if(!infoVoucher)
                    return resolve({ erorr: true, message:'voucher_exits', data: null, status: 400 });
                
                const dataUpdateVoucher = {
                    amount: Number(infoVoucher.amount || 0) + Number(journalAmount || 0), 
                    fcuAmount: Number(infoVoucher.fcuAmount || 0) + Number(journalFcuAmount || 0)
                }
                const resultUpdateVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findByIdAndUpdate(voucherId,dataUpdateVoucher);
                if(!resultUpdateVoucher)
                    return resolve({ erorr: true, message: 'update_voucher_fail', data : resultUpdateVoucher, status: 400});
            
                return resolve({ erorr: false, message: 'successfully_update_voucher', data : resultUpdateVoucher, status: 200 });

            } catch (error) {
                console.log(`ERROR [ACCOUNTING][UPDATE_VOUCHER_WITH_NEW_JOURNAL]: ${error}`);
                return resolve({ erorr: true, message: 'update_voucher_fail', status: 400});
            }
        });
    }

    remove({ voucherID }){
        return new Promise(async (resolve) => {
            try {
                if( !_isValid(voucherID))
                    return resolve({ error: true, message: 'voucherID_invalid', status: 400 });

                const info = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(voucherID);
                if (!info) 
                    return resolve({ error: true, message: 'cannot_get_info', status: 400 });

                // Remove doc
                const infoAfterRemove = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findByIdAndDelete(voucherID);
                if(!infoAfterRemove)
                    return resolve({ error: true, message: "cannot_remove", status: 400 });

                // Remove sub docs
                const removeSubDocs = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.deleteMany({ voucher: voucherID });
                if (!removeSubDocs) return resolve({ error: true, message: 'cannot_remove_sub_docs', status: 400 }); 

                // Xóa trong ngân sách

                return resolve({ error: false, data: infoAfterRemove, status: 200 });
            } catch (error) {
                console.log(`ERROR [ACCOUNTING][REMOVE_VOUCHER]: ${error}`);
                return resolve({ error: true, message: error.message, status: 400 })
            }
        })
    }

    getInfo({ voucherID, populates }) {
        return new Promise(async resolve => {
            try {

                if( !_isValid(voucherID))
                    return resolve({ error: true, message: 'voucherID_invalid', status: 400 });

                // populates
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
                const infoVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(voucherID)
                .populate(populates);
                
                if(!infoVoucher)
                    return resolve({ error: true, message: 'voucher_exits', status: 400 })

               
                // get list journal
              
                // .populate({
                //     path: 'files',
                //     populate: {
                //         path: 'author'
                //     }
                // })
                // .populate({
                //     path: 'customerCredit customerDebit contact  warehouse ipc',
                //     select:'_id  name'
                // })
                // .populate({
                //     path: 'contract',
                //     select:'_id  date name sign'
                // })
                // // .populate({
                // //     path: 'goods',
                // //     select:'_id name unit'
                // // })
                // .populate({
                //     path: 'debit credit',
                //     select:'_id description sign'
                // });


              

                return resolve({ error: false, data: infoVoucher, status: 200 })
            } catch (error) {
                console.log(`ERROR [ACCOUNTING][GET_INFO_VOUCHER]: ${error}`);
                return resolve({ error: true, message: error.message, status: 400})
            }
        });
    }

    // Danh sách các phiếu của công ty.
    getListVoucherOfCompany({ lastestID, companyID, fundaID, contractID, limit = PERPAGE_CORE, perPage, fromDate, toDate, type }){
        return new Promise(async (resolve) => {
            try {
                limit = Number(limit);
                if(!limit || limit<0){
                    limit = PERPAGE_CORE;
                }
                if(limit > PERPAGE_CORE){
                    limit = PERPAGE_CORE
                }
                let conditionObj;
                if(!fundaID){
                    if(!contractID){
                        conditionObj = { 
                            company: companyID,
                            type: Number(type)
                        }
                    }else{
                        conditionObj = { 
                            company: companyID,
                            contract: {$in: contractID },
                            type: Number(type)
                        }
                    }
                }else{
                    if(!contractID){
                        conditionObj = { 
                            funda: fundaID,
                            type: Number(type),
                        }
                    }else{
                        conditionObj = { 
                            funda: fundaID,
                            contract: { $in: contractID },
                            type: Number(type)
                        }
                    }
                }
                if(fromDate && toDate){
                    if(fromDate != 'Invalid Date' && toDate != 'Invalid Date'){
                        let startTime   = moment(fromDate).startOf('day').format();// <=== fix ISODate here
                        let endTime     = moment(toDate).endOf('day').format();// <=== fix ISODate here
                        // conditionObj.date = {
                        //     $gte: startTime,// <=== fix ISODate here
                        //     $lte: endTime // <=== fix ISODate here
                        // }
                        conditionObj.date  = { 
                            $gte: moment(startTime).toDate(),
                            $lte: moment(endTime).toDate()
                        }
                    }
                }
                // lastestID
                let latestRecord = null;
                if(lastestID && ObjectId(lastestID)){
                    const checkExitLastRecord = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(lastestID);
                    if(!checkExitLastRecord)
                        return resolve({ error: true, message: "Can't get info lastestID", status: 400 });
                    
                    latestRecord = checkExitLastRecord;
                }
                let keys = ['createAt__-1', '_id__-1'];
                const result = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord, objectQuery: conditionObj })
                // console.log({ result, find: result.data.find['$or'], sort: result.data.sort });
                if(result.error){
                    return resolve({ error: true, message: "cannot_get_list", status: 400 });
                }

              
                // let listData = null;

                // if(!currentPage){
                //     listData = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find(conditionObj)
                //     .populate({
                //         path: 'company customer staff contract warehouse',
                //         select: '_id name sign phone address'
                //     })
                //     .populate({
                //         path: 'userCreate userUpdate',
                //         select:'_id fullname image'
                //     })
                //     .populate({
                //         path: 'journals',
                //         populate: {
                //             path: 'debit credit customerDebit customerCredit goods warehouse contract'
                //         }
                //     })
                //     .sort({date: 'desc'});
                // }else{
                  
                const listVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find(result.data.find)
                .populate({
                    path: 'company customer staff contract warehouse',
                    select: '_id name sign phone address'
                })
                .populate({
                    path: 'userCreate userUpdate',
                    select:'_id fullname image'
                })
                .limit(limit+1)
                .sort(result.data.sort);
                // }

                if(!listVoucher)
                    return resolve({ error: true, message: "cannot_get_list", status: 400 });

                const totalRecord = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.countDocuments(conditionObj);
                let nextCursor	= null;

                if(listVoucher && listVoucher.length){
                    if(listVoucher.length > limit){
                        nextCursor = listVoucher[limit - 1]._id;
                        listVoucher.length = limit;
                    }
                }

                const totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ 
                    error: false,
                    data: {
                        listVoucher: listVoucher || [],
                        nextCursor,
                        totalPage,
                        totalRecord,
                        limit,
                    },
                    status: 200
                });
            } catch (error) {
                console.log(`ERROR [ACCOUNTING][getListVoucherOfCompany] ${error}`);
                return resolve({ error: true, message: error.message, status: 400 });
            }
        })
    }

    // Danh sách các phiếu VAT.
    conditionObjSearchGetListVATVoucherOfCompany({
        companyID, vat, fromDate, toDate, fundaID
    }){
        let conditionObj;

        if(!fundaID){
            conditionObj = { 
                company: companyID,
                vat: Number(vat),
                forward: 0,
                cancel: 0,
                date: { 
                    $gte: moment(fromDate).toDate(),
                    $lte: moment(toDate).toDate(),
                }
            }
        }else{
            conditionObj = { 
                funda: fundaID,
                vat: Number(vat),
                forward: 0,
                cancel: 0,
                date: { 
                    $gte: moment(fromDate).toDate(),
                    $lte: moment(toDate).toDate(),
                }
            }
        }
        return conditionObj;
    }

    // Author: HiepNH
    getListVATVoucherOfCompany({ companyID, fundaID, fromDate, toDate, vat, nextInfo, perPage }){
        return new Promise(async (resolve) => {
            try {
                const perPage = Number(perPage) || 20;
                /**
                 * Business Analyst (BA)
                 * 1. Lấy các phiếu có VAT = 1 và debit, credit in arrObjectID[]
                 * 2. Không lấy các Phiếu kết chuyển + Phiếu hủy
                */  
                const conditionObj = this.conditionObjSearchGetListVATVoucherOfCompany({
                    companyID, vat, fromDate, toDate, fundaID
                });

                const keys = ['createAt__-1', '_id__-1'];
                const latestRecord = { _id: nextInfo._id, createAt: nextInfo.createAt };
                const resultPagination = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord, objectQuery: conditionObj });
                
                if(resultPagination.eror)
                    return resolve({ error: true, message: "cant_get_list_vat" });

               
                const listData = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find(resultPagination.data.find)
                .populate({
                    path: 'company customer storage staff warehouse',
                    select: '_id name sign taxid address',
                })
                .populate({
                    path: 'contract',
                    select: '_id name sign project',
                    populate: {
                        path: 'project',
                        select: '_id name sign',
                    }
                })
                .populate({
                    path: 'journals',
                    populate: {
                        path: 'debit credit customerDebit customerCredit goods warehouse contract'
                    }
                })
                .sort(resultPagination.data.sort)
                .limit(perPage);

                if(!listData)
                    return resolve({ error: true, message: "cannot_get_list" });

                return resolve({ error: false, data: listData });
            } catch (error) {
                console.log(`ERROR [ACCOUNTING][getListVATVoucherOfCompany] ${error}`);
                return resolve({ error: true, message: error.message });
            }
        })
    }

    // Tìm kiếm phiếu.
    findVoucherInCompany({ lastestID, key, type, customer, author, fromDate, toDate, fundaID, companyID, limit = PERPAGE_CORE }) {
        return new Promise(async resolve => {
            try {       
                let sort = {}, conditionObj = {};
                limit = Number(limit);
                if(!limit || limit<0){
                    limit = PERPAGE_CORE;
                }
                if(limit > PERPAGE_CORE){
                    limit = PERPAGE_CORE
                }

                /**
                 * CONDITION
                 */
                if(key && key.length > 0){
                    let keyword = key.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';

                    conditionObj = {
                        $or: [
                            { name   :  new RegExp(keyword, 'i') },
                            { sign:  new RegExp(keyword, 'i') },
                        ]
                    }
                }

                if(!fundaID){
                    conditionObj.company = companyID
                }else{
                    conditionObj.funda = fundaID
                }

                if(type && Number(type) > 0){
                    conditionObj.type = type;
                }
                
                if(customer && _isValid(customer)){
                    conditionObj.customer = customer;
                }

                if(author && _isValid(author)){
                    conditionObj.userCreate = author;
                }
                
                if(fromDate != 'Invalid Date' && toDate != 'Invalid Date'){
                    let startTime   = moment(fromDate).startOf('day').format();// <=== fix ISODate here
                    let endTime     = moment(toDate).endOf('day').format();// <=== fix ISODate here
                    if(`${startTime}` != 'Invalid Date' && `${endTime}` != 'Invalid Date'){
                        conditionObj.date = {
                            $gte: startTime,// <=== fix ISODate here
                            $lte: endTime // <=== fix ISODate here
                        }
                    }
                }
                
                let latestRecord = null;
                if(lastestID && ObjectId(lastestID)){
                    const checkExitLastRecord = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(lastestID);
                    if(!checkExitLastRecord)
                        return resolve({ error: true, message: "Can't get info lastestID", status: 400 });
                    
                    latestRecord = checkExitLastRecord;
                }

                const keys = ['createAt__-1', '_id__-1'];
                const resultPagination = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord, objectQuery: conditionObj })
                
                if(resultPagination.eror)
                    return resolve({ error: true, message: "cant_get_list_vat",  status: 400 });
               
                const infoVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find(resultPagination.data.find)
                    .populate('customer')
                    .populate('warehouse')
                    .populate({
                        path: 'userCreate userUpdate',
                        select:'_id fullname image'
                    })
                    .limit(limit+1)
                    .sort(resultPagination.data.sort);

                if(!infoVoucher)
                    return resolve({ error: true, message: 'voucher_exits', status: 400 });

                const totalRecord = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.count(conditionObj);
				let nextCursor	= null;

				if(infoVoucher && infoVoucher.length){
					if(infoVoucher.length > limit){
						nextCursor = infoVoucher[limit - 1]._id;
						infoVoucher.length = limit;
					}
				}
                const totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ 
                    error: false, 
                    data: { 
                        infoVoucher,
                        nextCursor, 
                        limit: +limit || 0,
                        totalRecord,
                        totalPage,
                    },
                    status : 200,
                });
            } catch (error) {
                console.log(`ERROR [ACCOUNTING][findVoucherInCompany] ${error}`);
                return resolve({ error: true, message: error.message, status: 400 });
            }
        });
    }

    // Danh sách các phiếu VAT
    // Author: HiepNH
    getListVATVoucherOfCompany({ companyID, fundaID, fromDate, toDate, vat }){
        return new Promise(async (resolve) => {
            try {
                /**
                 * Business Analyst (BA)
                 * 1. Lấy các phiếu có VAT = 1 và debit, credit in arrObjectID[]
                 * 2. Không lấy các Phiếu kết chuyển + Phiếu hủy
                 */  

                let conditionObj;

                if(!fundaID){
                    conditionObj = { 
                        company: companyID,
                        vat: Number(vat),
                        forward: 0,
                        cancel: 0,
                        date: { 
                            $gte: moment(fromDate).toDate(),
                            $lte: moment(toDate).toDate(),
                        }
                    }
                }else{
                    conditionObj = { 
                        funda: fundaID,
                        vat: Number(vat),
                        forward: 0,
                        cancel: 0,
                        date: { 
                            $gte: moment(fromDate).toDate(),
                            $lte: moment(toDate).toDate(),
                        }
                    }
                }

                let listData = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find(conditionObj)
                .populate({
                    path: 'company customer storage staff warehouse',
                    select: '_id name sign taxid address',
                })
                .populate({
                    path: 'contract',
                    select: '_id name sign project',
                    populate: {
                        path: 'project',
                        select: '_id name sign',
                    }
                })
                .populate({
                    path: 'journals',
                    populate: {
                        path: 'debit credit customerDebit customerCredit goods warehouse contract'
                    }
                })
                .sort({date: 'asc'});
                if(!listData)
                    return resolve({ error: true, message: "cannot_get_list" });

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    // In các phiếu theo tra cứu [x]
    getListVoucherOfCompanyBySearch({ companyID, fundaID, perPage, fromDate, toDate, type }){
        return new Promise(async (resolve) => {
            try {
                // console.log({ __1_before__: { fromDate, toDate } });
                fromDate   = moment(fromDate).startOf('day').format();// <=== fix ISODate here
                toDate     = moment(toDate).endOf('day').format();// <=== fix ISODate here
                // console.log({ __1__: { fromDate, toDate } });
  

                let pagination;
                if(!perPage){
                    pagination = ''
                }else{
                    pagination = perPage;
                }

                if(!fundaID){
                    if(!_isValid(companyID))
                    return resolve({ error: true, message: 'param_not_valid' });

                    let listData = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find({ 
                        company: companyID,
                        type: Number(type),
                        date: { 
                            $gte: moment(fromDate).toDate(),
                            $lte: moment(toDate).toDate(),
                        },
                    })
                    .populate('company customer staff')
                    .populate('warehouse')
                    .populate({
                        path: 'journals',
                        populate: {
                            path: 'debit credit customerDebit customerCredit goods warehouse contract'
                        }
                    })
                    .limit(pagination)
                    .sort({date: 'asc'});

                    if(!listData)
                        return resolve({ error: true, message: "cannot_get_list" });
                    return resolve({ error: false, data: listData });
                }else{
                    if(!_isValid(fundaID))
                    return resolve({ error: true, message: 'param_not_valid' });

                    let listData = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find({ 
                        funda: fundaID,
                        type: Number(type),
                        date: { 
                            $gte: moment(fromDate).toDate(),
                            $lte: moment(toDate).toDate(),
                        },
                    })
                    .populate('company customer staff')
                    .populate('warehouse')
                    .populate({
                        path: 'journals',
                        populate: {
                            path: 'debit credit customerDebit customerCredit goods warehouse contract'
                        }
                    })
                    .limit(pagination)
                    .sort({date: 'asc'});

                    if(!listData)
                        return resolve({ error: true, message: "cannot_get_list" });
                    return resolve({ error: false, data: listData });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

     // Danh sách phiếu kèm theo chi tiết tải về [x]
     getListVoucherOfCompanyForExport({ companyID, fundaID, fromDate, toDate }){
        return new Promise(async (resolve) => {
            try {
                if(!fundaID){
                    if(!_isValid(companyID))
                        return resolve({ error: true, message: 'param_not_valid' });
                    
                    let listData = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find({ 
                        company: companyID,
                        forward: 0,
                        cancel: 0,
                        date: { 
                            $gte: moment(fromDate).toDate(),
                            $lte:  moment(toDate).toDate(),
                        },
                    })
                    .populate({
                        path: 'userCreate',
                        select: '_id fullname image'
                    })
                    .populate({
                        path: 'customer warehouse contract',
                        select: '_id name sign address'
                    })
                    .populate({
                        path: 'journals',
                        populate: {
                            path: 'debit credit customerDebit customerCredit contract goods warehouse'
                        }
                    })
                    .sort({date: 'asc'});

                    if(!listData)
                        return resolve({ error: true, message: "cannot_get_list" });
                    return resolve({ error: false, data: listData });
                }else{
                    if(!_isValid(fundaID))
                        return resolve({ error: true, message: 'param_not_valid' });
                    
                    let listData = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find({ 
                        funda: fundaID,
                        forward: 0,
                        cancel: 0,
                        date: { 
                            $gte: moment(fromDate).toDate(),
                            $lte:  moment(toDate).toDate(),
                        },
                    })
                    .populate({
                        path: 'userCreate',
                        select: '_id fullname image'
                    })
                    .populate({
                        path: 'customer warehouse contract',
                        select: '_id name sign address'
                    })
                    .populate({
                        path: 'journals',
                        populate: {
                            path: 'debit credit customerDebit customerCredit contract goods warehouse'
                        }
                    })
                    .sort({date: 'asc'});

                    if(!listData)
                        return resolve({ error: true, message: "cannot_get_list" });
                    return resolve({ error: false, data: listData });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    // Author: HiepNH
    getListOrderOfCompany({ companyID, fundaID, type, fromDate, toDate }){
        return new Promise(async (resolve) => {
            try {
                /**
                 * Business Analyst (BA)
                 * 1. Nếu không tồn tại fundaID => lấy các đơn hàng thuộc công ty (tất cả đơn vị cơ sở)
                 * 2. Nếu tồn tại fundaID => lấy các đơn hàng thuộc đơn vị cơ sở
                 */
                 // console.log({ __1_before__: { fromDate, toDate } });
                 fromDate   = moment(fromDate).startOf('day').format();// <=== fix ISODate here
                 toDate     = moment(toDate).endOf('day').format();// <=== fix ISODate here
                 // console.log({ __1__: { fromDate, toDate } });
 

                let conditionObj;
                if(!fundaID){
                    if(!type){
                        conditionObj = {
                            company: companyID,
                            date: { 
                                $gte: moment(fromDate).toDate(),
                                $lte: moment(toDate).toDate(),
                            }
                        }
                    }else{
                        conditionObj = {
                            company: companyID,
                            type: Number(type),
                            date: { 
                                $gte: moment(fromDate).toDate(),
                                $lte: moment(toDate).toDate(),
                            }
                        }
                    }
                }else{
                    if(!type){
                        conditionObj = {
                            funda: fundaID,
                            cancel: 0, // Không lấy phiếu hủy
                            forward: 0, // Không lấy phiếu kết chuyển cuối kỳ
                            date: { 
                                $gte: moment(fromDate).toDate(),
                                $lte: moment(toDate).toDate(),
                            }
                        }
                    }else{
                        conditionObj = {
                            funda: fundaID,
                            type: Number(type),
                            cancel: 0, // Không lấy phiếu hủy
                            forward: 0, // Không lấy phiếu kết chuyển cuối kỳ
                            date: { 
                                $gte: moment(fromDate).toDate(),
                                $lte: moment(toDate).toDate(),
                            }
                        }
                    }
                }
                let listData = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find(conditionObj)
                    .populate({
                        path: 'customer',
                        select: '_id name sign address phone',
                        populate: {
                            path: 'property',
                            select:'_id name sign'
                        }
                    })
                    .populate({
                        path: 'staff',
                        select: '_id name sign',
                    })
                    .populate({
                        path: 'userCreate',
                        select: '_id fullname image'
                    })
                    .populate({
                        path: 'journals',
                        populate:{
                            path: 'debit credit customerDebit customerCredit goods'
                        }
                    })
                    .sort({date: 1, _id: 1});

                if(!listData)
                    return resolve({ error: true, message: "cannot_get_list" });
                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    
    //
    updateDB(){
        return new Promise(async (resolve) => {
            const listFina = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find({
                date : { 
                    $gte: moment('2021-01-01').toDate(),
                    $lte: moment('2021-12-01').toDate()
                }, 
                company:'5e8415e651d84b60937abe71'
            });
            async function updateJounal(id,  
                forward,
                cancel,
                returning,
                advancePayment,
                forwardIs,
                date
            ){
                console.log({id,  forward,
                    cancel,
                    returning,
                    advancePayment,
                    forwardIs,
                    date
                });
                await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.findByIdAndUpdate(id,{
                    forward,
                    cancel,
                    returning,
                    advancePayment,
                    forwardIs,
                    date
                });
            }
            async function updateVoucher(id, amount){
                const listFina = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findByIdAndUpdate(id,
                    {
                        amount: amount
                    });
                return listFina;
            }
            let listPJ = [];
            let listPV = [];
            for(const finItem of listFina){
                let newAmount = 0;
                finItem.journals && finItem.journals.forEach(item=>{
                    newAmount = Number(newAmount) + (Number(item.amount || 0) || 0);
                    listPJ.push(updateJounal(item, 
                        finItem.forward,
                        finItem.cancel,
                        finItem.returning,
                        finItem.advancePayment,
                        finItem.forwardIs,
                        finItem.date
                    ));
                });
                listPV.push(
                    updateVoucher(finItem._id, newAmount)
                );
            }
            //
            const resulUpdateJ = await Promise.all(listPJ);
            const resulUpdateV = await Promise.all(listPV);
        })
    }

}

exports.MODEL = new AccountingFinancialVoucher;
var ACCOUNTING__FINANCIAL_GENERAL_JOURNAL   = require('../model/accounting.financial_general_journal').MODEL;