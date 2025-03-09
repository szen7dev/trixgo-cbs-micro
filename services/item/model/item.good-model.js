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
// const ITEM__FUNDA_COLL            				= require('../database/item.funda-coll');
const MEDIA__MENU_COLL					        = require('../../media/database/media.menu-coll');

class Model extends BaseModel {

    constructor() {
        super(ITEM__GOODS_COLL);
    }

    /**
	 * Dev : Depv
	 * Func: Tạo goods
	 * Date: 13/12/2021
	 */
	insert({ projectID, companyID, parentID, name, sign, unit, quantity, weight, unitprice, listedUnitprice, sellingUnitprice, note, type, unitPrice, unitPrice2, unitPrice3, unitPrice4, userID, convertID, convertQuantity, status, usage, duration, authorID, categoryID, fundaID, nods, date, description, features, ingredients, benefits, instructions, sideEffects, warnings, storage, expired }){
        return new Promise(async resolve => {
            try {
                if(!name || name == "")
                    return resolve({ error: true, message: "Tên không hợp lệ", keyError: "Request params name invalid" });

                let checkName = await ITEM__GOODS_COLL.findOne({ company: companyID, name: name.trim() });
				if(checkName)
					return resolve({ error: true, message: "title_existed" });

                let dataInsert = {
                    userCreate: userID,
                    userUpdate: userID,
                    modifyAt: new Date(),
                    company: companyID,
                    name,
                    slug: stringUtils.getSlugAccents(name)
                }

                if(authorID && checkObjectIDs(authorID)){
                    dataInsert.author = authorID
                }else{
                    dataInsert.author = userID
                }

                if(fundaID && checkObjectIDs(fundaID)){
                    dataInsert.funda = fundaID;
                }

                if(projectID && checkObjectIDs(projectID)){
                    dataInsert.project = projectID;
                }

                if(categoryID && checkObjectIDs(categoryID)){
                    dataInsert.category = categoryID;
                }

                if(parentID && checkObjectIDs(parentID)){
                    let infoParent = await ITEM__GOODS_COLL.findById(parentID);
                    dataInsert.parent = parentID;
                    dataInsert.project = infoParent.project;
                    dataInsert.level = infoParent.level + 1;
                }

                if(date && date != ""){
                    dataInsert.date = date;
                }

                if(expired && expired != ""){
                    dataInsert.expired = expired;
                }

                if(sign && sign != ""){
                    dataInsert.sign = sign;
                }

                if(unit && unit != ""){
                    dataInsert.unit = unit;
                }

                if(!isNaN(nods)){
                    dataInsert.nods = Number(nods);
                }

                if(!isNaN(duration)){
                    dataInsert.duration = Number(duration);
                }

                if(!isNaN(quantity)){
                    dataInsert.quantity = Number(quantity);
                }

                if(!isNaN(weight)){
                    dataInsert.weight = Number(weight);
                }

                if(!isNaN(unitprice)){
                    dataInsert.unitprice = Number(unitprice);
                }

                if(!isNaN(listedUnitprice)){
                    dataInsert.listedUnitprice = Number(listedUnitprice);
                }

                if(!isNaN(sellingUnitprice)){
                    dataInsert.sellingUnitprice = Number(sellingUnitprice);
                }

                if(!isNaN(type)){
                    dataInsert.type = Number(type);
                }

                if(!isNaN(unitPrice)){
                    dataInsert.unitPrice = Number(unitPrice);
                }

                if(!isNaN(unitPrice2)){
                    dataInsert.unitPrice2 = Number(unitPrice2);
                }

                if(!isNaN(unitPrice3)){
                    dataInsert.unitPrice3 = Number(unitPrice3);
                }

                if(!isNaN(unitPrice4)){
                    dataInsert.unitPrice4 = Number(unitPrice4);
                }

                if(!isNaN(status)){
                    dataInsert.status = Number(status);
                }

                if(!isNaN(usage)){
                    dataInsert.usage = Number(usage);
                }

                if(note && note != ""){
                    dataInsert.note = note;
                }
                if(description && description != ""){
                    dataInsert.description = description;
                }
                if(features && features != ""){
                    dataInsert.features = features;
                }
                if(ingredients && ingredients != ""){
                    dataInsert.ingredients = ingredients;
                }
                if(benefits && benefits != ""){
                    dataInsert.benefits = benefits;
                }
                if(instructions && instructions != ""){
                    dataInsert.instructions = instructions;
                }
                if(sideEffects && sideEffects != ""){
                    dataInsert.sideEffects = sideEffects;
                }
                if(warnings && warnings != ""){
                    dataInsert.warnings = warnings;
                }
                if(storage && storage != ""){
                    dataInsert.storage = storage;
                }

                if(convertID && checkObjectIDs(convertID)){
                    dataInsert.convert = convertID;
                }

                if(!isNaN(convertQuantity)){
                    dataInsert.convertQuantity = Number(convertQuantity);
                }

                let convertStr = ''
                if(name && name != ""){
                    convertStr = stringUtils.removeAccents(name)
                }
                if(sign && sign != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(sign)
                }
                if(unit && unit != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(unit)
                }
                if(note && note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                dataInsert.namecv = convertStr

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
	update({ goodsID, name, sign, unit, quantity, weight, unitprice, listedUnitprice, sellingUnitprice, type, unitPrice, unitPrice2, unitPrice3, unitPrice4, note, userID, convertID, convertQuantity, status, usage, duration, imagesID, authorID, categoryID, fundaID, nods, date, description, features, ingredients, benefits, instructions, sideEffects, warnings, storage, expired }){
        return new Promise(async resolve => {
            try {
				let info = await ITEM__GOODS_COLL.findById(goodsID)
				if (!info)
					return resolve({ error: true, message: 'can_not_get_info' })

                if (name && name != '') {
                    let checkName = await ITEM__GOODS_COLL.findOne({
                        company: info.company,
                        name: name.trim(),
                        _id: {
                            $ne: goodsID
                        }
                        });
                    if(checkName)
                        return resolve({ error: true, message: "name_existed" })
                }

                let dataUpdate = {
                    userUpdate: userID,
                    modifyAt: new Date()
                }

                // Tác giả (áp dụng cho Khóa học)
                if(authorID && checkObjectIDs(authorID)){
                    userUpdate.author = authorID
                }

                if(categoryID && checkObjectIDs(categoryID)){
                    dataUpdate.category = categoryID;
                }

                if(fundaID && checkObjectIDs(fundaID)){
                    dataUpdate.funda = fundaID;
                }

                if(imagesID && imagesID.length) {
                    dataUpdate.$addToSet = {
                        images: imagesID,
                    }
                }

                if (name && name != '') {
					dataUpdate.name = name;
					dataUpdate.slug = stringUtils.getSlugAccents(name)
				}

                if(sign && sign != ""){
                    dataUpdate.sign = sign;
                }

                if(unit && unit != ""){
                    dataUpdate.unit = unit;
                }

                if(date && date != ""){
                    dataUpdate.date = date;
                }

                if(expired && expired != ""){
                    dataUpdate.expired = expired;
                }

                if(!isNaN(nods)){
                    dataUpdate.nods = Number(nods);
                }

                if(!isNaN(duration)){
                    dataUpdate.duration = Number(duration);
                }

                if(!isNaN(quantity)){
                    dataUpdate.quantity = Number(quantity);
                }

                if(!isNaN(weight)){
                    dataUpdate.weight = Number(weight);
                }

                if(!isNaN(unitprice)){
                    dataUpdate.unitprice = Number(unitprice);
                }

                if(!isNaN(listedUnitprice)){
                    dataUpdate.listedUnitprice = Number(listedUnitprice);
                }

                if(!isNaN(sellingUnitprice)){
                    dataUpdate.sellingUnitprice = Number(sellingUnitprice);
                }

                if(!isNaN(type)){
                    dataUpdate.type = Number(type);
                }

                if(!isNaN(unitPrice)){
                    dataUpdate.unitPrice = Number(unitPrice);
                }

                if(!isNaN(unitPrice2)){
                    dataUpdate.unitPrice2 = Number(unitPrice2);
                }

                if(!isNaN(unitPrice3)){
                    dataUpdate.unitPrice3 = Number(unitPrice3);
                }

                if(!isNaN(unitPrice4)){
                    dataUpdate.unitPrice4 = Number(unitPrice4);
                }

                if(!isNaN(status)){
                    dataUpdate.status = Number(status);
                }

                if(!isNaN(usage)){
                    dataUpdate.usage = Number(usage);
                }

                if(note && note != ""){
                    dataUpdate.note = note;
                }
                if(description && description != ""){
                    dataUpdate.description = description;
                }
                if(features && features != ""){
                    dataUpdate.features = features;
                }
                if(ingredients && ingredients != ""){
                    dataUpdate.ingredients = ingredients;
                }
                if(benefits && benefits != ""){
                    dataUpdate.benefits = benefits;
                }
                if(instructions && instructions != ""){
                    dataUpdate.instructions = instructions;
                }
                if(sideEffects && sideEffects != ""){
                    dataUpdate.sideEffects = sideEffects;
                }
                if(warnings && warnings != ""){
                    dataUpdate.warnings = warnings;
                }
                if(storage && storage != ""){
                    dataUpdate.storage = storage;
                }

                if(convertID && checkObjectIDs(convertID)){
                    dataUpdate.convert = convertID;
                }

                if(!isNaN(convertQuantity)){
                    dataUpdate.convertQuantity = Number(convertQuantity);
                }

                let convertStr = ''
                if(name && name != ""){
                    convertStr = stringUtils.removeAccents(name)
                }
                if(sign && sign != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(sign)
                }
                if(unit && unit != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(unit)
                }
                if(note && note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                if(convertStr != ""){
                    dataUpdate.namecv = convertStr
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
    getInfo({ companyID, goodsID, slug, select, populates }) {
        return new Promise(async (resolve) => {
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

                if (!checkObjectIDs(goodsID)){
					if(slug && slug != ''){
						let info = await ITEM__GOODS_COLL
						.findOne({ company: companyID, slug: slug.trim() })
						.select(select)
						.populate(populates)
						.lean();
                        // console.log(info)

						if (!info) return resolve({ error: true, message: 'cannot_get_info' })

						return resolve({ error: false, data: info })
					}else{
						return resolve({ error: true, message: 'cannot_get_info' })
					}
				}else{
                    let info = await ITEM__GOODS_COLL
                    .findById(goodsID)
                    .select(select)
                    .populate(populates)
                    // console.log(info)

                    if(!info)
                        return resolve({ error: true, message: "cannot_get_info", status: 403 });

                    return resolve({ error: false, data: info, status: 200 });
				}

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
        option, companyID, projectID, parentID, categoryID, menuSlug, fundaID, type, isParent, status, usage, isListParentOfListChilds, forCustomer,
        keyword, limit = 10, lastestID, select, populates = {}, sortDirection = '-1' }) {
        return new Promise(async (resolve) => {
            try {
                if(limit > 50){
                    limit = 50
                } else{
                    limit = +limit;
                }

                let sortBy;
                let conditionObj = { };
                let keys	 = [`createAt__${sortDirection}`, `_id__${sortDirection}`];

                if(option && option == 1){
                    conditionObj.parent = { $exists: true, $ne: null }
                }

                if(fundaID && checkObjectIDs(fundaID)){
                    conditionObj.fundas = {$in: [fundaID]}
                }

                if(categoryID && checkObjectIDs(categoryID)){
                    conditionObj.category = ObjectID(categoryID);
                }

                if(parentID && checkObjectIDs(parentID)){
                    conditionObj.parent = ObjectID(parentID);
                }

                if(forCustomer && !isNaN(forCustomer)){
                    // conditionObj.forCustomer = Number(forCustomer)
                    conditionObj.usage = 2
                }

                // Chỉ lấy danh mục
                if(isParent && Number(isParent) == 1){
                    conditionObj.parent = { $exists: false }
                }

                // Phân loại (sản phẩm chính/topping)
                if(type && !isNaN(type)){
                    conditionObj.type = Number(type)
                }

                // Theo trạng thái
                if(status && !isNaN(status)){
                    conditionObj.status = Number(status)
                }

                // Theo mục đích sử dụng
                if(usage && !isNaN(usage)){
                    conditionObj.usage = Number(usage)
                }

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

                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = companyID;
                }

                if(projectID && checkObjectIDs(projectID)){
                    conditionObj.project = projectID;
                }

                if(menuSlug){
					let infoMenu = await MEDIA__MENU_COLL.findOne({ company: companyID, slug: menuSlug})
					if(infoMenu){
						conditionObj.category = infoMenu._id;
					}
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
                    keyword = stringUtils.removeAccents(keyword)
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');
                    conditionObj.namecv = regSearch
                }
                // console.log(conditionObj)

                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__GOODS_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
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
                let listData  = await ITEM__GOODS_COLL.find({ company: companyID })
                .select('level parent name sign unit note')
                .populate({
                    path: 'parent',
                    select: 'name'
                })

                // Modify the workbook.
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/item_import_goods.xlsx')))
                .then(async workbook => {

                    var i = 3;
                    listData?.forEach((item, index) => {
                        workbook.sheet("DanhMucKho").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("DanhMucKho").row(i).cell(2).value(item.name);
                        workbook.sheet("DanhMucKho").row(i).cell(3).value(item?.parent ? item?.parent?.name : '');
                        workbook.sheet("DanhMucKho").row(i).cell(4).value(item.unit);
                        workbook.sheet("DanhMucKho").row(i).cell(5).value(item.sign);
                        workbook.sheet("DanhMucKho").row(i).cell(6).value(item.note);

                        i++
                    })

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
    importFromExcel({ companyID, dataImport, projectID, userID, ctx }) {
        return new Promise(async resolve => {
            try {
                const dataImportJSON = JSON.parse(dataImport);
                let index = 0;
                let errorNumber = 0;
                for (const data of dataImportJSON) {
                    if(index > 0){
                        let dataInsert = {
                            companyID,
                            userID,
                            name: data?.__EMPTY,
                            sign: data?.__EMPTY_1,
                            type: data?.__EMPTY_2,
                            unit: data?.__EMPTY_3,
                            unitprice: data?.__EMPTY_4,
                            sellingUnitprice: data?.__EMPTY_5,
                            unitPrice: data?.__EMPTY_6,
                            unitPrice2: data?.__EMPTY_7,
                            unitPrice3: data?.__EMPTY_8,
                            unitPrice4: data?.__EMPTY_9,
                            note: data?.__EMPTY_10,
                            usage: data?.__EMPTY_11,
                            status: data?.__EMPTY_12,
                            parentID: data?.__EMPTY_13,
                            projectID: projectID ? projectID : null
                        }

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
