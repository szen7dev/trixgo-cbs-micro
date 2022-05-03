"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                          = require('mongoose').Types.ObjectId;
const moment                            = require('moment')
const fs                                = require('fs');
const path                              = require('path');

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant')
const { CF_ACTIONS_AUTH } 		        = require('../../auth/helper/auth.actions-constant')
const { VOUCHER_TYPES }                 = require('../config/accounting.financial_config')

/**
 * TOOLS
 */
const BaseModel                             = require('../../../tools/db/base_model')
const { checkObjectIDs, _isValid, IsJsonString }      = require('../../../tools/utils/utils')
const { RANGE_BASE_PAGINATION_V2 }          = require('../../../tools/cursor_base/playground/index')
const { KEY_ERROR }                         = require('../../../tools/keys/index')

/**
 * COLLECTIONS
 */
const FUNDA_COLL                                    = require('../../item/database/item.funda-coll'); // Kiểm tra fix lại, không Import trực tiếp
const CONTRACT_COLL                                 = require('../../item/database/item.contract-coll'); // Kiểm tra fix lại, không Import trực tiếp
const ACCOUNTING__FINANCIAL_VOUCHER_COLL            = require('../database/accounting.financial_voucher-coll')
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL    = require('../database/accounting.financial_general_journal-coll')

/**
 * MODELS
 */
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL   = require('./accounting.financial_general_journal-model').MODEL;

class Model extends BaseModel {
    constructor() {
        super(ACCOUNTING__FINANCIAL_VOUCHER_COLL);
    }

    /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    insert({ 
        authorID, 
        companyID, 
        fundaID, 
        customerID,
        contractID, 
        storageID, 
        type, date, name, sign, signInvoice, dateInvoice, vat, source, orderNew, pricePolicy,
        receiver, note,
        forward, forwardIs, returning, advancePayment, cancel, 
        fcuExRate, 
        selectedJournals,
        ctx
     }) {
        const that = this
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA-Author: HiepNH - 23/4/2022
                 * 1. Khi thêm phiếu có gán budgetWorkID => Cập nhật Ngân sách thực hiện cho work, group, item, budget
                 * 2. Khi sửa bút toán budgetWorkID => Cập nhật Ngân sách thực hiện cho work, group, item, budget của:
                 * +++budgetWorkID cũ
                 * +++budgetWorkID mới
                */

                //_________Kiểm tra dữ liệu đầu vào
                if(!date || !name || Number.isNaN(Number(type)) ||!checkObjectIDs(authorID) || !checkObjectIDs(fundaID) || !checkObjectIDs(customerID) || !checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'date|name|type|authorID|customerID|companyID invalid', keyError: KEY_ERROR.PARAMS_INVALID, status: 400 })

                /**
                 * TỰ ĐỘNG GHI SỐ HIỆU PHIẾU
                 */
                //_________Lấy số lượng phiếu hiện tại của công ty/đơn vị cơ sở
                let number          = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.count({ funda: fundaID, type: type })
                let infoFunda       = await FUNDA_COLL.findById(fundaID)

                let voucherSign = `${infoFunda.sign}.${VOUCHER_TYPES[Number(type)-1].sign}${Number(number+1)}`
                if(sign && sign != ""){
                    // Kiểm tra xem đã tồn tại mã hiệu đó hay chưa
                    let infoVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findOne({
                        funda: fundaID, 
                        sign: sign
                    }).select('_id')

                    if(!infoVoucher){
                        voucherSign = sign
                    }
                }

                /**
                 * B1. TẠO PHIẾU
                 */
                 const dataInsertVoucher = {
                    userCreate: authorID, 
                    company: companyID, 
                    funda: fundaID, 
                    customer: customerID,
                    type, date, name, sign, signInvoice, dateInvoice, vat, type, source, orderNew, pricePolicy,
                    receiver, note,
                    forward, forwardIs, returning, advancePayment, cancel, 
                    fcuExRate
                }

                if (checkObjectIDs(contractID)) {
                    let infoContract = await CONTRACT_COLL.findById(contractID)
                    if(infoContract.project && checkObjectIDs(infoContract.project)){
                        dataInsertVoucher.project = infoContract.project;
                    }
                    dataInsertVoucher.contract = contractID;
                }

                if (checkObjectIDs(storageID)) {
                    dataInsertVoucher.storage = storageID;
                }

                const infoAfterInsert = await this.insertData(dataInsertVoucher)
                if (!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm phiếu thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

                /**
                 * B2. CẬP NHẬT BÚT TOÁN VÀO PHIẾU
                 */
                if(selectedJournals && selectedJournals.length >0){
                    //_________Get ID của phiếu vừa tạo để tiến hành tạo chi tiết chứng từ
                    const voucherID = infoAfterInsert._id;           

                    for (const subitem of selectedJournals) {

                        const dataInsert = {
                            authorID, 
                            companyID, 
                            fundaID, 
                            voucherID, 
                            date, forward, forwardIs, returning, advancePayment, cancel, vat, type, source, orderNew, pricePolicy,
                            updown: (!isNaN(subitem.updown) && [1,-1].includes(Number(subitem.updown))) ? Number(subitem.updown) : 1,
                            quantity: subitem.quantity ? Number(subitem.quantity) : 0,
                            amount: subitem.amount ? Number(subitem.amount) : 0,
                            unitprice: subitem.quantity != 0 ? Number(Number(subitem.amount/subitem.quantity)) : 0, // Đơn giá tính theo thành tiền/khối lượng
                            fcuExRate,
                            fcuAmount: fcuExRate != 0 ? Number(subitem.amount/fcuExRate) : 0,
                            note: subitem.note,
                            ctx
                        }

                        /**
                         * Kiểm tra xem có tài khoản nợ/có không
                         * Nếu không thì lấy giá trị null
                         */
                        if(subitem.debit && _isValid(subitem.debit)){
                            dataInsert.debit = subitem.debit
                        }else{
                            dataInsert.debit = null
                        }

                        if(subitem.credit && _isValid(subitem.credit)){
                            dataInsert.credit = subitem.credit
                        }else{
                            dataInsert.credit = null
                        }

                        /**
                         * Kiểm tra nếu có chi tiết mã khách nợ/có thì lấy theo chi tiết
                         * Nếu không  có thì lấy theo mã khách trên phiếu
                         */
                        if(subitem.customerDebit && _isValid(subitem.customerDebit)){
                            dataInsert.customerDebit = subitem.customerDebit
                        }else{
                            dataInsert.customerDebit = customerID
                        }

                        if(subitem.customerCredit && _isValid(subitem.customerCredit)){
                            dataInsert.customerCredit = subitem.customerCredit
                        }else{
                            dataInsert.customerCredit = customerID
                        }

                        /**
                         * Kiểm tra xem có hàng hóa/kho hay không
                         * Nếu không  có thì lấy theo mã khách trên phiếu
                         * Chỉ insert khi có cả thông tin goods và warehouse
                         */
                        if(subitem.goods && _isValid(subitem.goods) && subitem.warehouse && _isValid(subitem.warehouse)){
                            dataInsert.goods = subitem.goods
                            dataInsert.warehouse = subitem.warehouse
                        }else{
                            dataInsert.goods = null
                            dataInsert.warehouse = null
                        }

                        /**
                         * Kiểm tra xem có Hợp đồng hay không
                         * Nếu không  có thì lấy theo hợp đồng trên phiếu
                         */
                        if(subitem.contract && _isValid(subitem.contract)){
                            let infoContract = await CONTRACT_COLL.findById(subitem.contract)
                            if(infoContract.project && checkObjectIDs(infoContract.project)){
                                dataInsert.project = infoContract.project;
                            }
                            dataInsert.contract = subitem.contract
                        }else{
                            if(contractID && _isValid(contractID)){
                                let infoContract = await CONTRACT_COLL.findById(contractID)
                                if(infoContract.project && checkObjectIDs(infoContract.project)){
                                    dataInsert.project = infoContract.project;
                                }
                                dataInsert.contract = contractID;
                            }
                        }

                        /**
                         * Cập nhật ngân sách thực hiện
                         */
                        if(subitem.budgetWork && _isValid(subitem.budgetWork)){
                            dataInsert.budgetWork = subitem.budgetWork
                        }
                        
                        //_________Tiến hành tạo chi tiết_________//
                        let infoJournal = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.insert(dataInsert);

                        /**
                         * B3. CẬP NHẬT GIÁ TRỊ PHIẾU SAU KHI ĐÃ CẬP NHẬT XONG CÁC BÚT TOÁN
                         */
                        if(infoJournal){
                            let newInfoVoucher = await that.updateValue({ voucherID })
                            // console.log(newInfoVoucher)
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
     * Date: 30/4/2022
     */
    update({ 
        authorID, 
        voucherID,
        customerID,
        contractID, 
        storageID, 
        type, date, name, sign, signInvoice, dateInvoice, vat, source, orderNew, pricePolicy,
        receiver, note,
        forward, forwardIs, returning, advancePayment, cancel, 
        fcuExRate, 
        selectedJournals, 
        deletedJournals,
        ctx
     }) {
        const that = this
        return new Promise(async (resolve) => {
            try {
               
                /**
                 * BA-Author: HiepNH - 23/4/2022
                 * 1. Khi thêm phiếu có gán budgetWorkID => Cập nhật Ngân sách thực hiện cho work, group, item, budget
                 * 2. Khi sửa bút toán budgetWorkID => Cập nhật Ngân sách thực hiện cho work, group, item, budget của:
                 * +++budgetWorkID cũ
                 * +++budgetWorkID mới
                */

                //_________Kiểm tra dữ liệu đầu vào
                if(!date || !name || Number.isNaN(Number(type)) ||!checkObjectIDs(authorID) || !checkObjectIDs(voucherID) || !checkObjectIDs(customerID))
                    return resolve({ error: true, message: 'date|name|type|authorID|customerID|companyID invalid', keyError: KEY_ERROR.PARAMS_INVALID, status: 400 })

                let info = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(voucherID)
                if (!info) 
                    return resolve({ error: true, message: 'cannot_get_info_voucher', status: 400 })

                let companyID = info.company
                let fundaID = info.funda

                /**
                 * KIỂM TRA TRÙNG PHIẾU
                 */
                if(sign != ""){
                    let infoVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findOne({
                        funda: fundaID, 
                        sign: sign,
                        _id: {
                            $ne: voucherID
                        }
                    }).select('_id')
    
                    if(infoVoucher)
                        return resolve({ error: true, message: "Mã phiếu đã tồn tại", status: 400 })
                }

                /**
                 * B1. CẬP NHẬT PHIẾU
                 */
                 const dataUpdateVoucher = {
                    userUpdate: authorID, 
                    modifyAt: Date.now(),
                    type, date, name, sign, signInvoice, dateInvoice, vat, source, orderNew, pricePolicy,
                    receiver, note,
                    forward, forwardIs, returning, advancePayment, cancel, 
                    fcuExRate
                }

                if (checkObjectIDs(contractID)) {
                    let infoContract = await CONTRACT_COLL.findById(contractID)
                    if(infoContract.project && checkObjectIDs(infoContract.project)){
                        dataUpdateVoucher.project = infoContract.project;
                    }
                    dataUpdateVoucher.contract = contractID;
                }

                if (checkObjectIDs(storageID)) {
                    dataUpdateVoucher.storage = storageID;
                }

                const infoAfterUpdate = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findByIdAndUpdate(voucherID, dataUpdateVoucher, { new: true })
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "cannot_update", status: 400 })

                /**
                 * B2. CẬP NHẬT BÚT TOÁN VÀO PHIẾU
                 */
                if(selectedJournals && selectedJournals.length >0){
                    for (const subitem of selectedJournals) {
                        // Tạo mới
                        if(!subitem.journalID){
                            console.log('===================TẠO BÚT TOÁN===================')
                            const dataInsert = {
                                authorID, 
                                companyID, 
                                fundaID, 
                                voucherID, 
                                date, forward, forwardIs, returning, advancePayment, cancel, vat, type, source, orderNew, pricePolicy,
                                updown: (!isNaN(subitem.updown) && [1,-1].includes(Number(subitem.updown))) ? Number(subitem.updown) : 1,
                                quantity: subitem.quantity ? Number(subitem.quantity) : 0,
                                amount: subitem.amount ? Number(subitem.amount) : 0,
                                unitprice: subitem.quantity != 0 ? Number(Number(subitem.amount/subitem.quantity)) : 0, // Đơn giá tính theo thành tiền/khối lượng
                                fcuExRate,
                                fcuAmount: fcuExRate != 0 ? Number(subitem.amount/fcuExRate) : 0,
                                note: subitem.note,
                                ctx
                            }
    
                            /**
                             * Kiểm tra xem có tài khoản nợ/có không
                             * Nếu không thì lấy giá trị null
                             */
                            if(subitem.debit && _isValid(subitem.debit)){
                                dataInsert.debit = subitem.debit
                            }else{
                                dataInsert.debit = null
                            }
    
                            if(subitem.credit && _isValid(subitem.credit)){
                                dataInsert.credit = subitem.credit
                            }else{
                                dataInsert.credit = null
                            }
    
                            /**
                             * Kiểm tra nếu có chi tiết mã khách nợ/có thì lấy theo chi tiết
                             * Nếu không  có thì lấy theo mã khách trên phiếu
                             */
                            if(subitem.customerDebit && _isValid(subitem.customerDebit)){
                                dataInsert.customerDebit = subitem.customerDebit
                            }else{
                                dataInsert.customerDebit = customerID
                            }
    
                            if(subitem.customerCredit && _isValid(subitem.customerCredit)){
                                dataInsert.customerCredit = subitem.customerCredit
                            }else{
                                dataInsert.customerCredit = customerID
                            }
    
                            /**
                             * Kiểm tra xem có hàng hóa/kho hay không
                             * Nếu không  có thì lấy theo mã khách trên phiếu
                             * Chỉ insert khi có cả thông tin goods và warehouse
                             */
                            if(subitem.goods && _isValid(subitem.goods) && subitem.warehouse && _isValid(subitem.warehouse)){
                                dataInsert.goods = subitem.goods
                                dataInsert.warehouse = subitem.warehouse
                            }else{
                                dataInsert.goods = null
                                dataInsert.warehouse = null
                            }
    
                            /**
                             * Kiểm tra xem có Hợp đồng hay không
                             * Nếu không  có thì lấy theo hợp đồng trên phiếu
                             */
                            if(subitem.contract && _isValid(subitem.contract)){
                                let infoContract = await CONTRACT_COLL.findById(subitem.contract)
                                if(infoContract.project && checkObjectIDs(infoContract.project)){
                                    dataInsert.project = infoContract.project;
                                }
                                dataInsert.contract = subitem.contract
                            }else{
                                if(contractID && _isValid(contractID)){
                                    let infoContract = await CONTRACT_COLL.findById(contractID)
                                    if(infoContract.project && checkObjectIDs(infoContract.project)){
                                        dataInsert.project = infoContract.project;
                                    }
                                    dataInsert.contract = contractID;
                                }
                            }
    
                            /**
                             * Cập nhật ngân sách thực hiện
                             */
                            if(subitem.budgetWork && _isValid(subitem.budgetWork)){
                                dataInsert.budgetWork = subitem.budgetWork
                            }
                            
                            //_________Tiến hành tạo chi tiết_________//
                            let infoJournal = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.insert(dataInsert);
    
                            /**
                             * B3. CẬP NHẬT GIÁ TRỊ PHIẾU SAU KHI ĐÃ CẬP NHẬT XONG CÁC BÚT TOÁN
                             */
                            if(infoJournal){
                                let newInfoVoucher = await that.updateValue({ voucherID })
                                // console.log(newInfoVoucher)
                            }
                        }

                        // Cập nhật
                        else{
                            console.log('===================CẬP NHẬT BÚT TOÁN===================')
                            const dataUpdate = {
                                authorID, 
                                journalID: subitem.journalID, 
                                date, forward, forwardIs, returning, advancePayment, cancel, vat, type, source, orderNew, pricePolicy,
                                updown: (!isNaN(subitem.updown) && [1,-1].includes(Number(subitem.updown))) ? Number(subitem.updown) : 1,
                                quantity: subitem.quantity ? Number(subitem.quantity) : 0,
                                amount: subitem.amount ? Number(subitem.amount) : 0,
                                unitprice: subitem.quantity != 0 ? Number(Number(subitem.amount/subitem.quantity)) : 0, // Đơn giá tính theo thành tiền/khối lượng
                                fcuExRate,
                                fcuAmount: fcuExRate != 0 ? Number(subitem.amount/fcuExRate) : 0,
                                note: subitem.note,
                                ctx
                            }
    
                            /**
                             * Kiểm tra xem có tài khoản nợ/có không
                             * Nếu không thì lấy giá trị null
                             */
                            if(subitem.debit && _isValid(subitem.debit)){
                                dataUpdate.debit = subitem.debit
                            }else{
                                dataUpdate.debit = null
                            }
    
                            if(subitem.credit && _isValid(subitem.credit)){
                                dataUpdate.credit = subitem.credit
                            }else{
                                dataUpdate.credit = null
                            }
    
                            /**
                             * Kiểm tra nếu có chi tiết mã khách nợ/có thì lấy theo chi tiết
                             * Nếu không  có thì lấy theo mã khách trên phiếu
                             */
                            if(subitem.customerDebit && _isValid(subitem.customerDebit)){
                                dataUpdate.customerDebit = subitem.customerDebit
                            }else{
                                dataUpdate.customerDebit = customerID
                            }
    
                            if(subitem.customerCredit && _isValid(subitem.customerCredit)){
                                dataUpdate.customerCredit = subitem.customerCredit
                            }else{
                                dataUpdate.customerCredit = customerID
                            }
    
                            /**
                             * Kiểm tra xem có hàng hóa/kho hay không
                             * Nếu không  có thì lấy theo mã khách trên phiếu
                             * Chỉ insert khi có cả thông tin goods và warehouse
                             */
                            if(subitem.goods && _isValid(subitem.goods) && subitem.warehouse && _isValid(subitem.warehouse)){
                                dataUpdate.goods = subitem.goods
                                dataUpdate.warehouse = subitem.warehouse
                            }else{
                                dataUpdate.goods = null
                                dataUpdate.warehouse = null
                            }
    
                            /**
                             * Kiểm tra xem có Hợp đồng hay không
                             * Nếu không  có thì lấy theo hợp đồng trên phiếu
                             */
                            if(subitem.contract && _isValid(subitem.contract)){
                                let infoContract = await CONTRACT_COLL.findById(subitem.contract)
                                if(infoContract.project && checkObjectIDs(infoContract.project)){
                                    dataUpdate.project = infoContract.project;
                                }
                                dataUpdate.contract = subitem.contract
                            }else{
                                if(contractID && _isValid(contractID)){
                                    let infoContract = await CONTRACT_COLL.findById(contractID)
                                    if(infoContract.project && checkObjectIDs(infoContract.project)){
                                        dataUpdate.project = infoContract.project;
                                    }
                                    dataUpdate.contract = contractID;
                                }
                            }

                            /**
                             * Cập nhật ngân sách thực hiện
                             */
                            if(subitem.budgetWork && _isValid(subitem.budgetWork)){
                                dataUpdate.budgetWork = subitem.budgetWork
                            }
                            
                            //_________Tiến hành tạo chi tiết_________//
                            let infoJournal = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.update(dataUpdate);
    
                            /**
                             * B3. CẬP NHẬT GIÁ TRỊ PHIẾU SAU KHI ĐÃ CẬP NHẬT XONG CÁC BÚT TOÁN
                             */
                            if(infoJournal){
                                let newInfoVoucher = await that.updateValue({ voucherID })
                                // console.log(newInfoVoucher)
                            }
                        }

                        /**
                         * XÓA BÚT TOÁN
                         * 1-Xóa bút toán
                         * 2-Update lại giá trị phiếu
                         * 3-Update lại ngân sách đã thực hiện (nếu có)
                         */
                        
                    }
                }

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Cập nhật giá trị của phiếu
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    updateValue({ voucherID }){
        return new Promise(async (resolve, reject) => {
            try {
                let dataUpdate = { amount: 0, fcuAmount: 0 }

                let listData = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                    {
                        $match: {
                            voucher: ObjectID(voucherID),
                        }
                    }, 
                    {
                        $group: {
                            _id: { },
                            amount: { $sum: "$amount" },
                            fcuAmount: { $sum: "$fcuAmount" },
                        }
                    }, 
                ])
                // console.log('Tính tổng các bút toán của Phiếu==========>>>>>>>>>>>>')
                // console.log(listData)

                if(listData && listData.length){
                    dataUpdate.amount = Number(listData[0].amount)
                    dataUpdate.fcuAmount = Number(listData[0].fcuAmount)
                }

                const resultUpdateVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findByIdAndUpdate(voucherID, dataUpdate)
                if(!resultUpdateVoucher)
                    return resolve({ erorr: true, message: 'update_voucher_fail', data : resultUpdateVoucher, status: 400})
            
                return resolve({ erorr: false, message: 'successfully_update_voucher', data : resultUpdateVoucher, status: 200 })
            } catch (error) {
                console.log(`ERROR [ACCOUNTING][UPDATE_VOUCHER_WITH_NEW_JOURNAL]: ${error}`)
                return resolve({ erorr: true, message: 'update_voucher_fail', status: 400})
            }
        });
    }

    /**
     * Name: Cập nhật thuộc tính từ phiếu sang bút toán
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    updateFromVoucherToJournal({ companyID, userID }){
        return new Promise(async (resolve, reject) => {
            try {
                let listData = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find({ company: companyID })
                console.log({totalVoucher: listData.length})
                // console.log(listData)
                for(const item of listData){
                    let infoAfterUpdate = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL.updateMany(
                        { voucher: ObjectID(item._id) },
                        {
                            $set: {
                                date: item.date,
                                forward: !isNaN(item.forward) ? item.forward : 0,
                                forwardIs: !isNaN(item.forwardIs) ? item.forwardIs : 0,
                                returning: !isNaN(item.returning) ? item.returning : 0,
                                advancePayment: !isNaN(item.advancePayment) ? item.advancePayment : 0,
                                cancel: !isNaN(item.cancel) ? item.cancel : 0,
                                type: !isNaN(item.type) ? item.type : 1,
                                vat: !isNaN(item.vat) ? item.vat : 0,
                                source: !isNaN(item.source) ? item.source : 1,
                                orderNew: !isNaN(item.orderNew) ? item.orderNew : 1,
                                pricePolicy: !isNaN(item.pricePolicy) ? item.pricePolicy : 1
                            }
                        }
                    )
                    // console.log(infoAfterUpdate)
                }

                return resolve({ erorr: false, message: 'convert_successfull', totalVoucher: listData.length, status: 200 })
            } catch (error) {
                return resolve({ erorr: true, message: 'convert_failed', status: 400})
            }
        });
    }

     /**
     * Name: Cập nhật từ bút toán sang phiếu
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    updateFromJournalToVoucher({ companyID, userID }){
        const that = this
        return new Promise(async (resolve, reject) => {
            try {
                let listVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find({company: companyID}).select('_id name')
                console.log(listVoucher.length)
                // console.log(listVoucher)
                for (const item of listVoucher){
                    let info = await that.updateValue({ voucherID: item._id })
                    // console.log(info)
                }

                return resolve({ erorr: false, message: 'convert_successfull', status: 200 })
            } catch (error) {
                return resolve({ erorr: true, message: 'convert_failed', status: 400})
            }
        });
    }

    /**
     * Name: Remove
     * Author: Hiepnh
     * Date: 30/4/2022
     */

    /**
     * Name: Get info 
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    getInfo({ voucherID, select, populates }) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(voucherID))
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

                let info = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(voucherID)
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
     * Date: 30/4/2022
     */
    getList({ userID, companyID, fundaID, projectID, contractID, customerID, fromDate, toDate, type,
        keyword, limit = 20, lastestID, select, populates = {}, sortKey }) {
        return new Promise(async (resolve) => {
            try {
                if (limit > 20) {
                    limit = 20
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
                if(!isNaN(type) && Number(type) > 0){
                    conditionObj.type = Number(type)
                }

                if (checkObjectIDs(customerID)) {
                    conditionObj.customer = customerID
                }else{
                    if (checkObjectIDs(contractID)) {
                        conditionObj.contract = contractID
                    }else{
                        if (checkObjectIDs(projectID)) {
                            conditionObj.project = projectID
                        }else{
                            if (checkObjectIDs(fundaID)) {
                                conditionObj.funda = fundaID
                            } else {
                                conditionObj.company = companyID
                            }
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

                if (keyword) {
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                }
                // console.log(conditionObj)

                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
                if (lastestID && checkObjectIDs(lastestID)) {
                    let infoData = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(lastestID);
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

                let infoDataAfterGet = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find(conditionObj)
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

                let totalRecord = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.count(conditionObjOrg);
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

}

exports.MODEL = new Model;