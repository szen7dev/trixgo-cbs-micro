"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { KEY_ERROR }			            = require('../../../tools/keys');
const ObjectID                          = require('mongoose').Types.ObjectId;

// const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');

const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const { uploadFileS3 }                  = require('../../../tools/s3');

/**s
 * import inter-coll, exter-coll
 */
const ITEM__FUNDA_COLL            			   = require('../../item/database/item.funda-coll');
const FNB_PRODUCT_COLL                         = require('../database/fnb.product-coll');
const ITEM__CONTACT_COLL            		   = require('../../item/database/item.contact-coll'); 
// const FNB_ORDER_COLL                           = require('../database/fnb.order-coll');
// const FNB_ORDER_PRODUCT_COLL                   = require('../database/fnb.order_product-coll');
// const FNB_SHIFT_COLL                           = require('../database/fnb.shift-coll');
// const FNB_MISTAKE_COLL                         = require('../database/fnb.mistake-coll');
// const FNB_QUOTA_COLL                           = require('../database/fnb.quota-coll');
// const FNB_ORDER_MATERIAL_COLL                  = require('../database/fnb.order_material-coll');
const FNB_VOUCHER_COLL                          = require('../database/fnb.voucher-coll');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {

    constructor() {
        super(FNB_VOUCHER_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Date: 21/3/2023
     */
    insert({  userID, companyID, template, type, name, note, referrerID, customerID, minOrderAmount, salesoffAmount, salesoffRate, expired, status }) {
        // console.log({ userID, companyID, template, type, name, note, referrerID, customerID, minOrderAmount, salesoffAmount, salesoffRate, expired, status })
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(companyID) || !name)
                    return resolve({ error: true, message: 'companyID|name invalid', keyError: KEY_ERROR.PARAMS_INVALID })

                let suid = await stringUtils.randomAndCheckExists(FNB_VOUCHER_COLL, 'suid')

                let dataInsert = { 
                    suid,
                    company: companyID,
                    template, 
                    type,
                    name, 
                    userCreate: userID 
                }

                if(note && note != ""){
                    dataInsert.note = note
                }

                if(expired && expired != ""){
                    dataInsert.expired = expired
                }

                if(referrerID && checkObjectIDs(referrerID)){
                    dataInsert.referrer = referrerID
                }

                if(customerID && checkObjectIDs(customerID)){
                    dataInsert.customer = customerID
                }

                if(!isNaN(minOrderAmount) && Number(minOrderAmount) >= 0){
                    dataInsert.minOrderAmount = Number(minOrderAmount)
                }
                if(!isNaN(salesoffAmount) && Number(salesoffAmount) >= 0){
                    dataInsert.salesoffAmount = Number(salesoffAmount)
                }
                if(!isNaN(salesoffRate) && Number(salesoffRate) >= 0){
                    dataInsert.salesoffRate = Number(salesoffRate)
                }
                if(!isNaN(minOrderAmount) && Number(minOrderAmount) >= 0){
                    dataInsert.minOrderAmount = Number(minOrderAmount)
                }

                let infoAfterInsert = await this.insertData(dataInsert)
                if (!infoAfterInsert)
                    return resolve({ error: true, message: 'Thêm thất bại', keyError: KEY_ERROR.INSERT_FAILED })       

                return resolve({ error: false, data: infoAfterInsert })
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: Update
     * Author: HiepNH
     * Date: 21/3/2023
     */
    update({ userID, voucherID, template, type, name, note, referrerID, customerID, minOrderAmount, salesoffAmount, salesoffRate, expired, status }) {
        // console.log({ userID, voucherID, type, name, note, referrerID, customerID, minOrderAmount, salesoffAmount, salesoffRate, expired, status })
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(voucherID))
                        return resolve({ error: true, message: 'voucherID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                    let dataInUpdate = { userUpdate: userID, modifyAt: new Date() };

                    if(name && name != ""){
                        dataInUpdate.name = name
                    }

                    if(note && note != ""){
                        dataInUpdate.note = note
                    }
    
                    if(expired && expired != ""){
                        dataInUpdate.expired = expired
                    }
    
                    if(referrerID && checkObjectIDs(referrerID)){
                        dataInUpdate.referrer = referrerID
                    }
    
                    if(customerID && checkObjectIDs(customerID)){
                        dataInUpdate.customer = customerID
                    }

                    if(!isNaN(template) && Number(template) > 0){
                        dataInUpdate.template = Number(template)
                    }
                    if(!isNaN(type) && Number(type) > 0){
                        dataInUpdate.type = Number(type)
                    }
                    if(!isNaN(status) && Number(status) > 0){
                        dataInUpdate.status = Number(status)
                    }
    
                    if(!isNaN(minOrderAmount) && Number(minOrderAmount) >= 0){
                        dataInUpdate.minOrderAmount = Number(minOrderAmount)
                    }
                    if(!isNaN(salesoffAmount) && Number(salesoffAmount) >= 0){
                        dataInUpdate.salesoffAmount = Number(salesoffAmount)
                    }
                    if(!isNaN(salesoffRate) && Number(salesoffRate) >= 0){
                        dataInUpdate.salesoffRate = Number(salesoffRate)
                    }
                    if(!isNaN(minOrderAmount) && Number(minOrderAmount) >= 0){
                        dataInUpdate.minOrderAmount = Number(minOrderAmount)
                    }

                    let infoAfterUpdate = await FNB_VOUCHER_COLL.findByIdAndUpdate(voucherID, dataInUpdate, { new: true });
                    if (!infoAfterUpdate)
                        return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

                    return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: Get
     * Author: HiepNH
     * Date: 21/3/2023
     */
    getInfo({ voucherID, suid, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(voucherID){
                    if(!checkObjectIDs(voucherID))
                        return resolve({ error: true, message: 'param_invalid' });

                    // populate
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

                    let info = await FNB_VOUCHER_COLL.findById(voucherID)
                                        .select(select)
                                        .populate(populates)
                    if (!info) return resolve({ error: true, message: 'cannot_get', keyError: KEY_ERROR.GET_INFO_FAILED })

                    return resolve({ error: false, data: info })
                }else{
                    // populate
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

                    let info = await FNB_VOUCHER_COLL.findOne({ suid: suid })
                                        .select(select)
                                        .populate(populates)
                    if (!info) return resolve({ error: true, message: 'cannot_get', keyError: KEY_ERROR.GET_INFO_FAILED })

                    return resolve({ error: false, data: info })
                }
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: Get
     * Author: HiepNH
     * Date: 21/3/2023
     */
    getList({ companyID, userID, customerID, template, type, keyword, limit=10, lastestID, select, populates }) {
        // console.log({ companyID, userID, customerID, template, type, keyword, limit, lastestID, select, populates })
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = { }
                let sortBy;
                let keys	 = ['createAt__1', '_id__1'];

                if(customerID && checkObjectIDs(customerID)){
                    conditionObj.customer = ObjectID(customerID)
                }else{
                    conditionObj.company = ObjectID(companyID)
                }

                if(type && !isNaN(type)){
                    conditionObj.type = Number(type)
                }

                if(template && !isNaN(template)){
                    conditionObj.template = Number(template)
                }

                /**
                 * ĐIỀU KIỆN KHÁC
                 */
                if(populates && typeof populates === 'string'){
                    if(!IsJsonString(populates))
                        return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

                    populates = JSON.parse(populates);
                } else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                }

                if(select && typeof select === 'string'){
                    if(!IsJsonString(select))
                        return resolve({ error: true, message: 'Request params select invalid', status: 400 });

                    select = JSON.parse(select);
                }

                // console.log(populates)
                // console.log(conditionObj)

                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await FNB_VOUCHER_COLL.findById(lastestID);
                    if(!infoData)
                        return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort.data.find;
                    sortBy        = dataPagingAndSort.data.sort;
                }else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy                = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await FNB_VOUCHER_COLL.find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]?._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await FNB_VOUCHER_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

     /**
     * Name: Download Template Excel
     * Author: HiepNH
     * Date: 21/3/2023
     */
    downloadTemplateExcel({ companyID, userID }) {
        return new Promise(async resolve => {
            try {
                let listData  = await ITEM__CONTACT_COLL.find({ company: companyID }).select('name phone address note')
                .limit(200)
                // console.log(listData)

                // Modify the workbook.
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fnb_voucher_template_import.xlsx')))
                .then(async workbook => {

                    var i = 3;
                    listData?.forEach((item, index) => {
                        workbook.sheet("Contact").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("Contact").row(i).cell(2).value(item.name);
                        workbook.sheet("Contact").row(i).cell(3).value(item.phone);
                        workbook.sheet("Contact").row(i).cell(4).value(item.note);
                        workbook.sheet("Contact").row(i).cell(5).value(`${item._id}`);
                        i++
                    });

                    const now = new Date();
                    const filePath = '../../../files/temporary_uploads/';
                    const fileName = `template_import_voucher_${now.getTime()}.xlsx`;
                    const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                    await workbook.toFileAsync(pathWriteFile);
                    const result = await uploadFileS3(pathWriteFile, fileName);

                    fs.unlinkSync(pathWriteFile);
                    // console.log({ result })
                    return resolve({ error: false, data: result?.Location, status: 200 });
                });

            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Download Template Excel
     * Author: HiepNH
     * Date: 21/3/2023
     */
    importFromExcel({ companyID, dataImport, userID, ctx }) {
        return new Promise(async resolve => {
            try {
                const dataImportJSON = JSON.parse(dataImport);
                // console.log('=============Log data===================');
                // return console.log({ dataImportJSON });
                let index = 0;
                let errorNumber = 0;
                // let parentID;
                for (const data of dataImportJSON) {
                    // Chỉ lấy dữ liệu từ mẩu tin thứ 2 trở đi
                    if(index > 0){
                        let dataInsert = {
                            companyID,
                            userID,
                            template: data?.__EMPTY,
                            type: data?.__EMPTY_1,
                            name: data?.__EMPTY_2,
                            customerID: data?.__EMPTY_3,
                            expired: data?.__EMPTY_4,
                            minOrderAmount: data?.__EMPTY_5,
                            salesoffAmount: data?.__EMPTY_6,
                            salesoffRate: data?.__EMPTY_7,
                            referrerID: data?.__EMPTY_8,
                            note: data?.__EMPTY_9,
                        }
                        // console.log(dataInsert);
                    
                        let infoAfterInsert = await this.insert(dataInsert);
                        if(infoAfterInsert.error){
                            errorNumber++;
                        }
                    }
                    index ++;
                }
                if(errorNumber != 0)
                    return resolve({ error: true, message: "Import failed" })

                return resolve({ error: false, message: "Import successfull" });
            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Download Template Excel
     * Author: HiepNH
     * Date: 21/3/2023
     */
    // exportExcel({ companyID, userID }) {
    //     // console.log({ companyID, userID })
    //     return new Promise(async resolve => {
    //         try {
    //             let listData  = await FNB_ORDER_COLL.find({ company: companyID })
    //             .populate({
    //                 path: "funda",
    //                 select: "name sign",
    //             })
    //             .populate({
    //                 path: "shift",
    //                 select: "name sign",
    //             })
    //             .limit(1000)
    //             .sort({createAt: -1})
    //             // console.log(listData)

    //             // Modify the workbook.
    //             XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fnb_shift_export.xlsx')))
    //             .then(async workbook => {

    //                 var i = 3;
    //                 listData?.forEach((item, index) => {
    //                     workbook.sheet("Order").row(i).cell(1).value(Number(index+1));
    //                     workbook.sheet("Order").row(i).cell(2).value(item?.funda?.name);
    //                     workbook.sheet("Order").row(i).cell(3).value(item.createAt);
    //                     workbook.sheet("Order").row(i).cell(4).value(item?.shift?.name);
    //                     workbook.sheet("Order").row(i).cell(5).value(`${FNB_SHIFT_TYPES[Number(item.shiftType)-1].text}`);
    //                     workbook.sheet("Order").row(i).cell(6).value(item.name);
    //                     workbook.sheet("Order").row(i).cell(7).value(item.sign);
    //                     workbook.sheet("Order").row(i).cell(8).value(`${FNB_SALES_CHANNEL[Number(item.salesChannel)-1].text}`);
    //                     workbook.sheet("Order").row(i).cell(9).value(item?.appOrderSign);
    //                     workbook.sheet("Order").row(i).cell(10).value(`${FNB_PAYMENT_METHOD[Number(item.paymentMethod)-1].text}`);
    //                     workbook.sheet("Order").row(i).cell(11).value(`${FNB_STATUS[Number(item.status)-1].text}`);
    //                     workbook.sheet("Order").row(i).cell(12).value(Number(item.total));
    //                     workbook.sheet("Order").row(i).cell(13).value(Number(item.discount));
    //                     workbook.sheet("Order").row(i).cell(14).value(Number(item.salesoff));
    //                     workbook.sheet("Order").row(i).cell(15).value(Number(item.amount));
    //                     workbook.sheet("Order").row(i).cell(16).value(Number(item.numberOfSizeM));
    //                     workbook.sheet("Order").row(i).cell(17).value(Number(item.numberOfSizeL));
    //                     workbook.sheet("Order").row(i).cell(18).value(Number(item.numberOfProducts));
    //                     workbook.sheet("Order").row(i).cell(19).value(Number(item.numberOfMistakes));
    //                     workbook.sheet("Order").row(i).cell(20).value(item.note);
    //                     i++
    //                 });

    //                 const now = new Date();
    //                 const filePath = '../../../files/temporary_uploads/';
    //                 const fileName = `fnb_shift_export_${now.getTime()}.xlsx`;
    //                 const pathWriteFile = path.resolve(__dirname, filePath, fileName);

    //                 await workbook.toFileAsync(pathWriteFile);
    //                 const result = await uploadFileS3(pathWriteFile, fileName);

    //                 fs.unlinkSync(pathWriteFile);
    //                 // console.log({ result })
    //                 return resolve({ error: false, data: result?.Location, status: 200 });
    //             });

    //         } catch (error) {
    //             console.log({ error })
    //             return resolve({ error: true, message: error.message, status: 500 });
    //         }
    //     })
    // }
}

exports.MODEL = new Model