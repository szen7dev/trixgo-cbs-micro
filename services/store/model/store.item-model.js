"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { KEY_ERROR }			            = require('../../../tools/keys');
const ObjectID                          = require('mongoose').Types.ObjectId;
const moment                            = require('moment');

const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');

const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const { uploadFileS3 }                  = require('../../../tools/s3');

/**s
 * import inter-coll, exter-coll
 */
const ITEM__CONTACT_COLL            	= require('../../item/database/item.contact-coll'); 
const STORE_LOT_COLL                    = require('../database/store.lot-coll');
const STORE_ITEM_COLL                   = require('../database/store.item-coll');

/**
 * import inter-model, exter-model
 */
const { 
    FNB_ACC,
 } = require('../../fnb/helper/fnb.keys-constant')

class Model extends BaseModel {

    constructor() {
        super(STORE_ITEM_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Date: 25/5/2025
     */
    insert({ userID, companyID, lotID, goodsID, name, sign, note, status }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(lotID) || !name || !sign )
                    return resolve({ error: true, message: 'lotID|name invalid', keyError: KEY_ERROR.PARAMS_INVALID })

                let infoVoucher = await STORE_ITEM_COLL.findOne({ company: companyID, sign: sign.replace(/\s/g, "") })
                if(infoVoucher)
                    return resolve({ error: true, message: 'Mã hiệu đã tồn tại' })

                let infoLot = await STORE_LOT_COLL.findById(lotID)
                if(!infoLot)
                    return resolve({ error: true, message: 'Lô không tồn tại' })

                let dataInsert = { 
                    userCreate: userID,
                    company: companyID,
                    lot: lotID,
                    date: infoLot.date,
                    expired: infoLot.expired,
                }

                if (checkObjectIDs(goodsID)) {
                    dataInsert.goods = goodsID;
                }

                if (!isNaN(status) && Number(status) >= 1) {
                    dataInsert.status = Number(status)
                }

                let convertStr = ''
                if(name && name != ""){
                    dataInsert.name = name;
                    convertStr = stringUtils.removeAccents(name)
                }
                if(sign && sign != ""){
                    dataInsert.sign = sign.replace(/\s/g, "");
                    convertStr = convertStr + " " + stringUtils.removeAccents(sign)
                }
                if(note && note != ""){
                    dataInsert.note = note;
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                if(convertStr != ""){
                    dataInsert.namecv = convertStr
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
    update({ userID, itemID, name, sign, note, status, activationDate, customerName, customerPhone, amount }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(itemID))
                    return resolve({ error: true, message: 'itemID__invalid', keyError: KEY_ERROR.PARAMS_INVALID })

                let convertStr = ''
                if(sign && sign != ""){
                    let infoVoucher = await STORE_ITEM_COLL.findOne({ 
                        _id: { $ne: itemID },
                        company: companyID, 
                        sign: sign.replace(/\s/g, "")
                    })
                    if(infoVoucher)
                        return resolve({ error: true, message: 'Mã hiệu đã tồn tại' })

                    dataUpdate.sign = sign.replace(/\s/g, "")
                    convertStr = convertStr + " " + stringUtils.removeAccents(sign)
                }

                let dataUpdate = { 
                    userUpdate: userID, 
                    modifyAt: new Date() 
                }
                
                if(name && name != ""){
                    dataUpdate.name = name;
                    convertStr = stringUtils.removeAccents(name)
                }
                if(note && note != ""){
                    dataUpdate.note = note;
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                if(convertStr != ""){
                    dataUpdate.namecv = convertStr
                }

                if (!isNaN(status) && Number(status) >= 1) {
                    dataUpdate.status = Number(status)
                }

                let infoAfterUpdate = await STORE_ITEM_COLL.findByIdAndUpdate(itemID, dataUpdate, { new: true });
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    /**
     * Name: Get
     * Author: HiepNH
     * Date: 21/3/2023
     */
    getInfo({ itemID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
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

                let infoAterGet = await STORE_ITEM_COLL.findById(itemID)
                .select(select)
                .populate(populates)

                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", status: 403 })

                return resolve({ error: false, data: infoAterGet, status: 200 })
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
    getList({ companyID, status, keyword, limit = 50, lastestID, select, populates }) {
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = {company: companyID};
                let sortBy;
                let keys	 = ['createAt__-1', '_id__-1'];

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

                if(keyword){
                    keyword = stringUtils.removeAccents(keyword)
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');
                    conditionObj.namecv = regSearch
                }

                if(status && !isNaN(status)){
                    conditionObj.status = Number(status)
                }

                let conditionObjOrg = { ...conditionObj };
                
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await STORE_ITEM_COLL.findById(lastestID);
                    if(!infoData)
                        return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });

                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
                    sortBy       = dataPagingAndSort.data.sort;
                }else{
                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy        = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await STORE_ITEM_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await STORE_ITEM_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
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
    downloadTemplateExcel({ option, companyID, userID }) {
        return new Promise(async resolve => {
            try {
                /**
                 * TẢI DANH SÁCH KHÁCH HÀNG
                 */
                if(!option){
                    // Danh sách danh bạ
                    let listData  = await ITEM__CONTACT_COLL.find({ company: companyID }).select('name phone address note')
                    .sort({_id: -1})
                    .limit(200)
                    // console.log(listData)

                    // Modify the workbook.
                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fnb_voucher_template_import.xlsx')))
                    .then(async workbook => {

                        var i = 3;
                        listData?.forEach((item, index) => {
                            workbook.sheet("ExportContact").row(i).cell(1).value(Number(index+1));
                            workbook.sheet("ExportContact").row(i).cell(2).value(item.name);
                            workbook.sheet("ExportContact").row(i).cell(3).value(item.phone);
                            workbook.sheet("ExportContact").row(i).cell(4).value(item.note);
                            workbook.sheet("ExportContact").row(i).cell(5).value(`${item._id}`);
                            workbook.sheet("ExportContact").row(i).cell(6).value(`https://app.winggo.vn/mobile/activity/${item._id}/w6g9o22`).hyperlink(`https://app.winggo.vn/mobile/activity/${item._id}/w6g9o22`)

                            i++
                        });

                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `template_import_contact_voucher_${now.getTime()}.xlsx`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);
                        const result = await uploadFileS3(pathWriteFile, fileName);

                        fs.unlinkSync(pathWriteFile);
                        // console.log({ result })
                        return resolve({ error: false, data: result?.Location, status: 200 });
                    });
                }

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
    importFromExcel({ companyID, dataImport, userID, email }) {
        const that = this
        return new Promise(async resolve => {
            try {
                if(FNB_ACC.bod.includes(email.toString()) || FNB_ACC.cskh.includes(email.toString()) ){
                    // console.log('=============Có quyền===================')
                    const dataImportJSON = JSON.parse(dataImport);
                    // console.log('=============Log data===================');
                    // console.log({ dataImportJSON });
                    let index = 0;

                    let option = Number(dataImportJSON[0].__EMPTY_9)
                    // console.log({ option })

                    if(option == 1){
                        for (const item of dataImportJSON) {
                            // Chỉ lấy dữ liệu từ mẩu tin thứ 2 trở đi
                            if(index > 0){
                                let dataInsert = {
                                    companyID,
                                    userID,
                                    type: item?.__EMPTY,
                                    name: item?.__EMPTY_1,
                                    sign: item?.__EMPTY_2,
                                    expired: item?.__EMPTY_8,
                                    minOrderAmount: item?.__EMPTY_4,
                                    salesoffAmount: item?.__EMPTY_5,
                                    salesoffRate: item?.__EMPTY_6,
                                    note: item?.__EMPTY_7,
                                }
                                // console.log(dataInsert)

                                let info = await that.insert(dataInsert)
                            //    console.log(info)
                            }
        
                            index ++;
                        }

                        return resolve({ error: false, message: "Import successfull" })
                    }

                }else{
                    // console.log('=============Không có quyền===================')
                    return resolve({ error: true, message: 'Bạn không có quyền', status: 500 })
                }
            } catch (error) {
                // console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model