"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const ObjectID                          = require('mongoose').Types.ObjectId;
const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const moment                            = require('moment');

/**
 * DOMAIN AND ACTIONS
 */

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { uploadFileS3 }                  = require('../../../tools/s3');

/**
 * COLLECTIONS
 */
const ITEM__GOODS_COLL            				= require('../database/item.goods-coll');

class Model extends BaseModel {

    constructor() {
        super(ITEM__GOODS_COLL);
    }

    /**
	 * Dev : Depv
	 * Func: Tạo goods
	 * Date: 13/12/2021
	 */
	insert({ companyID, parentID, name, sign, unit, unitprice, description, note, userID, convertID, convertQuantity }){
        return new Promise(async resolve => {
            try {
                if(!name)
                    return resolve({ error: true, message: "Tên không hợp lệ", keyError: "Request params name invalid" });

                let dataInsert = {
                    userCreate: userID,
                    company: companyID,
                    name, 
                }    

                if(parentID && checkObjectIDs(parentID)){
                    let infoParent = await ITEM__GOODS_COLL.findById(parentID);
                    dataInsert.parent = parentID;
                    dataInsert.level = infoParent.level + 1;
                }

                if(sign){
                    dataInsert.sign = sign;
                }

                if(unit){
                    dataInsert.unit = unit;
                }

                if(!isNaN(unitprice)){
                    dataInsert.unitprice = Number(unitprice);
                }

                if(description){
                    dataInsert.description = description;
                }

                if(note){
                    dataInsert.note = note;
                }

                if(convertID && checkObjectIDs(convertID)){
                    dataInsert.convert = convertID;
                }

                if(!isNaN(convertQuantity)){
                    dataInsert.convertQuantity = Number(convertQuantity);
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" });

                //______Cập nhật amountChilds cho phần tử cha
                if(parentID && checkObjectIDs(parentID)){
                    await ITEM__GOODS_COLL.findByIdAndUpdate(parentID, { $inc: { amountChilds: 1 }}, { new: true });
                }

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Dev : Depv
	 * Func: update goods
	 * Date: 13/12/2021
	 */
	update({ goodsID, name, sign, unit, unitprice, description, note, userID, convertID, convertQuantity }){
        return new Promise(async resolve => { 
            try {
                if(!checkObjectIDs(goodsID))
                    return resolve({ error: true, message: "goodsID không hợp lệ", keyError: "Request params goodsID invalid" });

                if(!name)
                    return resolve({ error: true, message: "Tên không hợp lệ", keyError: "Request params name invalid" });
                
                let dataUpdate = {
                    name, userUpdate: userID, modifyAt: new Date()
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(unit){
                    dataUpdate.unit = unit;
                }

                if(!isNaN(unitprice)){
                    dataUpdate.unitprice = Number(unitprice);
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(convertID && checkObjectIDs(convertID)){
                    dataUpdate.convert = convertID;
                }

                if(!isNaN(convertQuantity)){
                    dataUpdate.convertQuantity = Number(convertQuantity);
                }

                let infoAfterUpdate = await ITEM__GOODS_COLL.findByIdAndUpdate(goodsID, dataUpdate, { new: true });
                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: get info goods ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ goodsID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(goodsID))
                    return resolve({ error: true, message: 'Request params goodsID invalid', status: 400 });
                
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

                let infoAterGet = await ITEM__GOODS_COLL.findById(goodsID)
                    .select(select)
                    .populate(populates)
                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", status: 403 });
 
                return resolve({ error: false, data: infoAterGet, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /**
     * Name  : Danh sách goods 
     * Author: Depv
     * Code  : 
     */
    getList({
        companyID, parentID, isListParentOfListChilds,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        // console.log({companyID, parentID, isListParentOfListChilds, keyword, limit, lastestID, select, populates})
        return new Promise(async (resolve) => {
            try {
                
                if(limit > 20){
                    limit = 20
                }else{
                    limit = +limit;
                }

                let sortBy;
                let conditionObj = { };
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

                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = companyID;
                }

                // Chỉ lấy danh sách cha hoặc con
                if(isListParentOfListChilds == 1){
                    if(parentID){
                        conditionObj.parent = parentID;
                    }else{
                        conditionObj.parent = { $exists: false };
                    }
                }
                
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }
                
                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__GOODS_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }
                
                let infoDataAfterGet = await ITEM__GOODS_COLL.find(conditionObj)
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

                let totalRecord = await ITEM__GOODS_COLL.count(conditionObjOrg);
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
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/item_goods_template_import.xlsx')))
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
                    const fileName = `Template_import_goods_${now.getTime()}.xlsx`;
                    const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                    await workbook.toFileAsync(pathWriteFile);
                    const result = await uploadFileS3(pathWriteFile, fileName);

                    fs.unlinkSync(pathWriteFile);
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
     * Date: 8/12/2022
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
                            unit: data?.__EMPTY_2,
                            unitprice: data?.__EMPTY_3,
                            description: data?.__EMPTY_4,
                            note: data?.__EMPTY_5,
                            
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

                return resolve({ error: false, message: "Import successfull" });
            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model