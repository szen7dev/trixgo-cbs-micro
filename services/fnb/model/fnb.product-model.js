"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
// const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const { KEY_ERROR }			            = require('../../../tools/keys');

// const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
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
// const FNB_ORDER_COLL                           = require('../database/fnb.order-coll');
// const FNB_ORDER_PRODUCT_COLL                   = require('../database/fnb.order_product-coll');
// const FNB_SHIFT_COLL                           = require('../database/fnb.shift-coll');
// const FNB_MISTAKE_COLL                         = require('../database/fnb.mistake-coll');
// const FNB_QUOTA_COLL                           = require('../database/fnb.quota-coll');
// const FNB_ORDER_MATERIAL_COLL                  = require('../database/fnb.order_material-coll');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {

    constructor() {
        super(FNB_PRODUCT_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert({ userID, companyID, parentID, name, sign, unit, note, quantity, unitPrice, unitPrice2, unitPrice3, unitPrice4, type }) {
        // console.log({ userID, companyID, parentID, name, sign, unit, note, quantity, unitPrice, unitPrice2, unitPrice3, unitPrice4, type })
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(companyID) || !name)
                    return resolve({ error: true, message: 'companyID|name invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let dataInsert = { 
                    company: companyID,
                    name, 
                    namecv: stringUtils.removeAccents(name),
                    type, 
                    // convertOption: 2, //Truyền tham biến
                    userCreate: userID 
                };
                if(sign && sign != ""){
                    let checkExist = await FNB_PRODUCT_COLL.findOne({ company: companyID, sign });
                    if(checkExist)
                        return resolve({ error: true, message: "Mã hiệu đã tồn tại", keyError: KEY_ERROR.ITEM_EXISTED })

                    dataInsert.sign = sign
                }

                if(parentID && checkObjectIDs(parentID)){
                    let infoParent = await FNB_PRODUCT_COLL.findById(parentID);
                    
                    dataInsert.parent = parentID;
                    dataInsert.level = infoParent.level + 1;
                }

                if(unit && unit != ""){
                    dataInsert.unit = unit;
                }

                if(note && note != ""){
                    dataInsert.note = note;
                }

                if(!isNaN(unitPrice)){
                    dataInsert.unitPrice = Number(unitPrice);
                    dataInsert.unitPrice2 = Number(unitPrice2);
                    dataInsert.unitPrice3 = Number(unitPrice3);
                    dataInsert.unitPrice4 = Number(unitPrice4);

                    if(!isNaN(quantity)){
                        dataInsert.quantity = Number(quantity);
                        dataInsert.amount = Number(quantity*unitPrice);
                    }else{
                        dataInsert.amount = Number(unitPrice);
                    }
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                // console.log(infoAfterInsert)
                if (!infoAfterInsert)
                    return resolve({ error: true, message: 'Thêm thất bại', keyError: KEY_ERROR.INSERT_FAILED })

                //______Cập nhật amountChilds cho phần tử cha
                if(parentID && checkObjectIDs(parentID)){
                    await FNB_PRODUCT_COLL.findByIdAndUpdate(parentID, { $inc: { amountChilds: 1 }}, { new: true });
                }                    

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: update group
     * Author: Depv
     * Code:
     */
    update({ companyID, productID, userID, parentID, type, name, sign, unit, note, quantity, unitPrice, unitPrice2, unitPrice3, unitPrice4, imagesID, fundasID, option, convertOption }) {
        // console.log({ companyID, productID, userID, parentID, type, name, sign, unit, note, quantity, unitPrice, unitPrice2, unitPrice3, unitPrice4, imagesID, fundasID, option, convertOption })
        return new Promise(async resolve => {
            try {
                if(!option){
                    if(!checkObjectIDs(productID))
                        return resolve({ error: true, message: 'productID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                    let dataInUpdate = { userUpdate: userID, modifyAt: new Date() };

                    if(parentID && checkObjectIDs(parentID)){
                        dataInUpdate.parent = parentID;
                    }

                    if(type){
                        dataInUpdate.type = Number(type);
                    }

                    if(name && name != ""){
                        dataInUpdate.name = name; 
                        dataInUpdate.namecv = stringUtils.removeAccents(name); 
                    }

                    if(sign && sign != ""){
                        dataInUpdate.sign =sign;
                    }

                    if(imagesID && imagesID.length) {
                        dataInUpdate.$addToSet = {
                            images: imagesID,
                        }
                    }

                    // if(fundasID && fundasID.length) {
                    //     // dataInUpdate.$addToSet = {
                    //     //     fundas: fundasID,
                    //     // }
                    //     dataInUpdate.fundas = fundasID
                    // }

                    if(fundasID) {
                        dataInUpdate.fundas = fundasID
                    }

                    if(unit && unit != ""){
                        dataInUpdate.unit = unit;
                    }

                    if(note && note != ""){
                        dataInUpdate.note = note;
                    }

                    if(quantity && !isNaN(quantity)){
                        dataInUpdate.quantity = Number(quantity);
                    }

                    if(unitPrice && !isNaN(unitPrice)){
                        dataInUpdate.unitPrice = Number(unitPrice);
                        dataInUpdate.unitPrice2 = Number(unitPrice2);
                        dataInUpdate.unitPrice3 = Number(unitPrice3);
                        dataInUpdate.unitPrice4 = Number(unitPrice4);

                        dataInUpdate.amount = Number(quantity*unitPrice);
                    }

                    let infoAfterUpdate = await FNB_PRODUCT_COLL.findByIdAndUpdate(productID, dataInUpdate, { new: true });
                    if (!infoAfterUpdate)
                        return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

                    return resolve({ error: false, data: infoAfterUpdate });
                }else{
                    let infoAfterUpdate = await FNB_PRODUCT_COLL.updateMany(
                        // { company: companyID}, 
                        { company: companyID, convertOption: convertOption}, 
                        { $set: { fundas: fundasID } }, 
                        { new: true}
                    );

                    if (!infoAfterUpdate)
                        return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

                    return resolve({ error: false, data: infoAfterUpdate });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: get info user_pcm_plan_group
     * Author: Depv
     * Code:
     */
    getInfo({ productID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(productID))
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

                let infoPlanGroup = await FNB_PRODUCT_COLL.findById(productID)
                                    .select(select)
                                    .populate(populates)

                if (!infoPlanGroup) return resolve({ error: true, message: 'cannot_get', keyError: KEY_ERROR.GET_INFO_FAILED });

                return resolve({ error: false, data: infoPlanGroup });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name  : Get list
     * Author: HiepNH
     * Code: 24/11/2022
     */
    getList({ companyID, parentID, fundaID, type, isParent, convertOption, keyword, limit = 10, lastestID, select, populates, sortKey, userID }) {
        // console.log('========DANH MỤC SẢN PHẨM===============>>>>>>>>>>>>>>>>')
        // console.log({ companyID, parentID, fundaID, type, isParent, keyword })
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = { company : ObjectID(companyID) }
                let sortBy;
                // let keys	 = ['createAt__-1'];
                let keys	 = ['createAt__1', '_id__1'];

                if(fundaID && checkObjectIDs(fundaID)){
                    conditionObj.fundas = {$in: [fundaID]}
                }

                if(parentID && checkObjectIDs(parentID)){
                    conditionObj.parent = ObjectID(parentID);
                }

                // Chỉ lấy danh mục
                if(isParent && Number(isParent) == 1){
                    conditionObj.parent = { $exists: false }
                }

                // Phân loại (sản phẩm chính/topping)
                if(type && !isNaN(type)){
                    conditionObj.type = Number(type)
                }

                if(convertOption){
                    conditionObj.convertOption = Number(convertOption)
                }

                // Làm rõ mục đích để làm gì?
                if (sortKey && typeof sortKey === 'string') {
                    if (!IsJsonString(sortKey))
                        return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                    keys = JSON.parse(sortKey);
                }
                // console.log(conditionObj)

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
                    let keywordCV =  stringUtils.removeAccents(keyword)
                    // console.log({keywordCV})

                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');
                    
                    keywordCV = keywordCV.split(" ");
                    keywordCV = '.*' + keywordCV.join(".*") + '.*';
                    const regCVSearch = new RegExp(keywordCV, 'i');

                    conditionObj.namecv = regCVSearch
                }

                if(select && typeof select === 'string'){
                    if(!IsJsonString(select))
                        return resolve({ error: true, message: 'Request params select invalid', status: 400 });

                    select = JSON.parse(select);
                }

                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await FNB_PRODUCT_COLL.findById(lastestID);
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

                let infoDataAfterGet = await FNB_PRODUCT_COLL.find(conditionObj)
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
                let totalRecord = await FNB_PRODUCT_COLL.count(conditionObjOrg);
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
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 8/12/2022
     */
    downloadTemplateExcel({ companyID, userID }) {
        return new Promise(async resolve => {
            try {
                // let listData  = await ITEM__CONTACT_COLL.find({ company: companyID })
                // console.log(listData)

                // Modify the workbook.
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fnb_product_template_import.xlsx')))
                .then(async workbook => {

                    // var i = 3;
                    // listData?.forEach((item, index) => {
                    //     workbook.sheet("Export").row(i).cell(1).value(Number(index+1));
                    //     workbook.sheet("Export").row(i).cell(2).value(item.name);
                    //     workbook.sheet("Export").row(i).cell(3).value(item.phone);
                    //     workbook.sheet("Export").row(i).cell(4).value(item.address);
                    //     // workbook.sheet("Export").row(i).cell(5).value(item.description);
                    //     workbook.sheet("Export").row(i).cell(5).value(item.note);
                    //     i++
                    // });

                    const now = new Date();
                    const filePath = '../../../files/temporary_uploads/';
                    const fileName = `Template_import_product_${now.getTime()}.xlsx`;
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
     * Dev: HiepNH
     * Func: importFromExcel
     * Date: 8/1/2023
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
                            name: data?.__EMPTY,
                            sign: data?.__EMPTY_1,
                            type: data?.__EMPTY_2,
                            unit: data?.__EMPTY_3,
                            unitPrice: data?.__EMPTY_4,
                            unitPrice2: data?.__EMPTY_5,
                            unitPrice3: data?.__EMPTY_6,
                            unitPrice4: data?.__EMPTY_7,
                            note: data?.__EMPTY_8,
                            parentID: data?.__EMPTY_9,
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
                    return resolve({ error: true, message: "Import failed" });
                    
                // console.log("Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

                // // Update timeImportExcel trick reload việc con
                // await PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, { $set: { timeImportExcel: new Date() }}, { new: true });

                return resolve({ error: false, message: "Import successfull" });
            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: HiepNH
     * Func: exportExcel
     * Date: 15/1/2023
     */
    exportExcel({ companyID, userID }) {
        // console.log({ companyID, userID })
        return new Promise(async resolve => {
            try {
                let listData  = await FNB_ORDER_COLL.find({ company: companyID })
                .populate({
                    path: "funda",
                    select: "name sign",
                })
                .populate({
                    path: "shift",
                    select: "name sign",
                })
                .limit(1000)
                .sort({createAt: -1})
                // console.log(listData)

                // Modify the workbook.
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fnb_shift_export.xlsx')))
                .then(async workbook => {

                    var i = 3;
                    listData?.forEach((item, index) => {
                        workbook.sheet("Order").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("Order").row(i).cell(2).value(item?.funda?.name);
                        workbook.sheet("Order").row(i).cell(3).value(item.createAt);
                        workbook.sheet("Order").row(i).cell(4).value(item?.shift?.name);
                        workbook.sheet("Order").row(i).cell(5).value(`${FNB_SHIFT_TYPES[Number(item.shiftType)-1].text}`);
                        workbook.sheet("Order").row(i).cell(6).value(item.name);
                        workbook.sheet("Order").row(i).cell(7).value(item.sign);
                        workbook.sheet("Order").row(i).cell(8).value(`${FNB_SALES_CHANNEL[Number(item.salesChannel)-1].text}`);
                        workbook.sheet("Order").row(i).cell(9).value(item?.appOrderSign);
                        workbook.sheet("Order").row(i).cell(10).value(`${FNB_PAYMENT_METHOD[Number(item.paymentMethod)-1].text}`);
                        workbook.sheet("Order").row(i).cell(11).value(`${FNB_STATUS[Number(item.status)-1].text}`);
                        workbook.sheet("Order").row(i).cell(12).value(Number(item.total));
                        workbook.sheet("Order").row(i).cell(13).value(Number(item.discount));
                        workbook.sheet("Order").row(i).cell(14).value(Number(item.salesoff));
                        workbook.sheet("Order").row(i).cell(15).value(Number(item.amount));
                        workbook.sheet("Order").row(i).cell(16).value(Number(item.numberOfSizeM));
                        workbook.sheet("Order").row(i).cell(17).value(Number(item.numberOfSizeL));
                        workbook.sheet("Order").row(i).cell(18).value(Number(item.numberOfProducts));
                        workbook.sheet("Order").row(i).cell(19).value(Number(item.numberOfMistakes));
                        workbook.sheet("Order").row(i).cell(20).value(item.note);
                        i++
                    });

                    const now = new Date();
                    const filePath = '../../../files/temporary_uploads/';
                    const fileName = `fnb_shift_export_${now.getTime()}.xlsx`;
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
}

exports.MODEL = new Model;