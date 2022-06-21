"use strict";

const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const moment                            = require('moment');
const _isValid                          = require('mongoose').Types.ObjectId;

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString, validateParamsObjectID }
                                        = require('../../../tools/utils/utils');
const { KEY_ERROR }                     = require('../../../tools/keys/index');

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { uploadFileS3 }                  = require('../../../tools/s3');

/**
 * COLLECTIONS
 */
const HUMAN__CONTACT_DOCUMENT_COLL      = require('../database/human.contact_document-coll');

class Model extends BaseModel {

    constructor() {
        super(HUMAN__CONTACT_DOCUMENT_COLL);
    }

    /**
     * Name: Insert contactDocument
     * Author: Depv
     * Code:
     */
    insert({ userCreate, contactID, type, number, status, certificateGrade, fromDate, toDate, workplace, reference, item, project, client, name, place, description, sign, note, store, field2, position2, certificateType, certificateName, educationalBackground2, contract, timeMobilize, factor, ctx }) {
        return new Promise(async resolve => {
            try {
                if(!_isValid(contactID))
                    return resolve({ error: true, message: 'param_not_valid' });

                // call service item contact để lấy thông tin
                let infoContact = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTACT_GET_INFO_AND_GET_LIST}`, {
                    contactID
                })

                if(!infoContact || infoContact.error)
                    return resolve({ error: true, message: 'param_not_valid' });

                //__________Khai báo và validate dữ liệu
                let dataInsert = {
                    userCreate,
                    company: infoContact.data.company,
                    contact: contactID,
                    type: !isNaN(type) ? Number(type) : 1,
                    number: !isNaN(number) ? Number(number) : 0,
                    status: (!isNaN(status) && [1,2].includes(Number(status))) ? Number(status) : 1,
                    certificateGrade: (!isNaN(certificateGrade) && [1,2,3,4].includes(Number(certificateGrade))) ? Number(certificateGrade) : 0,
                    fromDate,
                    toDate,
                    workplace,
                    reference,
                    item,
                    project,
                    client,
                    name,
                    place,
                    description,
                    sign,
                    note,
                    store,
                    timeMobilize :!isNaN(timeMobilize) ? Number(timeMobilize) : 0,
                    factor  : !isNaN(factor) ? Number(factor) : 0
                }

                if(field2 && _isValid(field2)){
                    dataInsert.field2 = field2;
                }

                if(position2 && _isValid(position2)){
                    dataInsert.position2 = position2;
                }

                if(certificateType && _isValid(certificateType)){
                    dataInsert.certificateType = certificateType;
                }

                if(certificateName && _isValid(certificateName)){
                    dataInsert.certificateName = certificateName;
                }

                if(educationalBackground2 && _isValid(educationalBackground2)){
                    dataInsert.educationalBackground2 = educationalBackground2;
                }

                if(contract && _isValid(contract)){
                    dataInsert.contract = contract;
                }
                // console.log(dataInsert)

                let infoAfterInsert = await this.insertData(dataInsert);
                // console.log(infoAfterInsert)
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert", keyError: KEY_ERROR.INSERT_FAILED });

                // Cập nhật lại số lượng contact_document cho contact
                let amountWorkHistory, amountProjectHistory, amountContractHistory, amountEducationHistory, amountCertificateHistory;
                if(type == 1) {
                    amountWorkHistory =  "1"
                }

                if(type == 2) {
                    amountProjectHistory =  "1"
                }

                if(type == 3) {
                    amountContractHistory =  "1"
                }

                if(type == 4) {
                    amountEducationHistory =  "1"
                }

                if(type == 5) {
                    amountCertificateHistory =  "1"
                }

                // Cập nhật lại số lượng contact_document cho contact
                await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTACT_UPDATE}`, {
                    contactID, amountWorkHistory, amountProjectHistory, amountContractHistory, amountEducationHistory, amountCertificateHistory,
                    documents: `${infoAfterInsert._id}`
                })

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Update contactDocument
     * Author: Depv
     * Code:
     */
    update({ authorID, documentID, number, status, certificateGrade, fromDate, toDate, workplace, reference, item, project, client, name, place, description, sign, note, store, field2, position2, certificateType, certificateName, educationalBackground2, contract,  timeMobilize, factor,  filesID, fileRemoveID }){
        return new Promise(async (resolve) => {
            try {
                if(!_isValid(authorID) || !_isValid(documentID))
                    return resolve({ error: true, message: 'param_not_valid' });

                let dataUpdate = {
                    userUpdate: authorID,
                    modifyAt: Date.now(),
                }

                if(!isNaN(number)){
                    dataUpdate.number = number;
                }

                if(!isNaN(status)){
                    dataUpdate.status = status;
                }

                if(!isNaN(certificateGrade) && [0,1,2,3,4,5].includes(Number(certificateGrade))){
                    dataUpdate.certificateGrade = certificateGrade;
                }

                if(fromDate){
                    dataUpdate.fromDate = fromDate;
                }

                if(toDate){
                    dataUpdate.toDate = toDate;
                }

                if(workplace){
                    dataUpdate.workplace = workplace;
                }

                if(reference){
                    dataUpdate.reference = reference;
                }

                if(item){
                    dataUpdate.item = item;
                }

                if(project){
                    dataUpdate.project = project;
                }

                if(client){
                    dataUpdate.client = client;
                }

                if(name){
                    dataUpdate.name = name;
                }

                if(place){
                    dataUpdate.place = place;
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(store){
                    dataUpdate.store = store;
                }

                if(!isNaN(timeMobilize)){
                    dataUpdate.timeMobilize = timeMobilize;
                }

                if(checkObjectIDs(field2)){
                    dataUpdate.field2 = field2;
                }

                if(position2 && _isValid(position2)){
                    dataUpdate.position2 = position2;
                }

                if(certificateType && _isValid(certificateType)){
                    dataUpdate.certificateType = certificateType;
                }

                if(certificateName && _isValid(certificateName)){
                    dataUpdate.certificateName = certificateName;
                }

                if(educationalBackground2 && _isValid(educationalBackground2)){
                    dataUpdate.educationalBackground2 = educationalBackground2;
                }

                if(contract && _isValid(contract)){
                    dataUpdate.contract = contract;
                }

                if(factor){
                    dataUpdate.factor = factor;
                }

                if(checkObjectIDs(filesID)){
                    dataUpdate.$addToSet = { files: filesID };
                }

                if(fileRemoveID && _isValid(fileRemoveID)){
                    dataUpdate.$pull = { files: fileRemoveID };
                }
                let infoAfterUpdate = await HUMAN__CONTACT_DOCUMENT_COLL.findByIdAndUpdate(documentID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "cannot_update", keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
    * Name: Remove contactDocument
    * Author: Depv
    * Code:
    */
    remove({ contactDocumentID, ctx }) {
       return new Promise(async (resolve) => {
           try {
                /**
                * DECALARTION VARIABLE (1)
                */

                /**
                * VALIDATION STEP (2)
                *  - Kiểm tra valid từ các input
                *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                */
                if(!checkObjectIDs(contactDocumentID))
                   return resolve({ error: true, message: 'Request params contactDocumentID invalid', status: 400 });

                /**
                * LOGIC STEP (3)
                * 3.1: Convert type + update name (ví dụ: string -> number)
                * 3.2: Operation database
                */
                let infoAterRemove = await HUMAN__CONTACT_DOCUMENT_COLL.findByIdAndDelete(contactDocumentID)

                if(!infoAterRemove)
                   return resolve({ error: true, message: "can't_remove", keyError: KEY_ERROR.DELETE_FAILED });

                let { contact, type } = infoAterRemove;
                let amountWorkHistory, amountProjectHistory, amountContractHistory, amountEducationHistory, amountCertificateHistory;
                if(type == 1) {
                    amountWorkHistory =  "-1"
                }

                if(type == 2) {
                    amountProjectHistory =  "-1"
                }

                if(type == 3) {
                    amountContractHistory =  "-1"
                }

                if(type == 4) {
                    amountEducationHistory =  "-1"
                }

                if(type == 5) {
                    amountCertificateHistory =  "-1"
                }

                // Cập nhật lại số lượng contact_document cho contact
                await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTACT_UPDATE}`, {
                    contactID: `${contact}`, amountWorkHistory, amountProjectHistory, amountContractHistory, amountEducationHistory, amountCertificateHistory,
                    documentsRemove: contactDocumentID
                })

                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
       })
   }

    /**
     * Name: get info contactDocument
     * Author: Depv
     * Code:
     */
    getInfo({ contactDocumentID, select, populates }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(contactDocumentID))
                    return resolve({ error: true, message: 'Request params contactDocumentID invalid', status: 400 });

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
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoAterGet = await HUMAN__CONTACT_DOCUMENT_COLL.findById(contactDocumentID)
                                    .select(select)
                                    .populate(populates)
                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", keyError: KEY_ERROR.GET_INFO_FAILED, status: 403 });

                return resolve({ error: false, data: infoAterGet, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    /**
     * Name  : Danh sách contactDocument
     * Author: Depv
     * Code  :
     */
    getList({
        companyID, type, contactID, isDuration3Month,
        keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {};
                let keys	 = ['createAt__-1', '_id__-1'];
                let sortBy;

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                // POPULATE
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

                if(checkObjectIDs(companyID)){
                    conditionObj.company = companyID;
                }

                if(type){
                    conditionObj.type = type;
                }

                if(checkObjectIDs(contactID)){
                    conditionObj.contact = contactID;
                }

                if(isDuration3Month == 1){
                    let today = new Date();
                    today.setMonth(today.getMonth() +3); // + Thêm 3 tháng nữa
                    conditionObj.toDate = { $lte: today }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */

                let conditionObjOrg = { ...conditionObj };
                console.log({ conditionObjOrg });
                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await HUMAN__CONTACT_DOCUMENT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await HUMAN__CONTACT_DOCUMENT_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", keyError: KEY_ERROR.GET_LIST_FAILED, status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await HUMAN__CONTACT_DOCUMENT_COLL.countDocuments(conditionObjOrg);
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
     * Name: Thống kê chứng chỉ
     * Author: Depv
     * Code:
     * SCREEN: S18-2.1
     */
    statisticsCertificate({ companyID }) {
        return new Promise(async (resolve) => {
            try {
                let infoData = await HUMAN__CONTACT_DOCUMENT_COLL.aggregate([
                    {
                        $match: {
                            company: _isValid(companyID),
                            certificateName: { $exists: true }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                certificateName:  "$certificateName"
                            },
                            amount: { $sum: 1 },
                        }
                    },
                    {
                        $sort: { "_id.certificateName": 1 }
                    },
                    {
                        $lookup: {
                            from: "doctypes",
                            localField:"_id.certificateName",
                            foreignField: "_id",
                            as: "certificateName"
                        }
                    },
                    {
                        $unwind: "$certificateName"
                    },
                    {
                        "$project": {
                          "_id": 0,
                          "certificateName.name": 1,
                          "amount": 1
                        }
                    }
                ]);
                if(!infoData)
                    return resolve({ error: true, message: "can't_get", status: 403 });

                return resolve({ error: false, data: infoData, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

     /**
     * Name: Thống kê khu vực làm việc
     * Author: Depv
     * Code:
     * SCREEN: S18-2.4.1
     */
    statistics({ companyID }) {
        return new Promise(async (resolve) => {
            try {
                let infoData = await HUMAN__CONTACT_DOCUMENT_COLL.aggregate([
                    {
                        $match: {
                            company: _isValid(companyID),
                            certificateName: { $exists: true }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                certificateName:  "$certificateName"
                            },
                            amount: { $sum: 1 },
                        }
                    },
                    {
                        $sort: { "_id.certificateName": 1 }
                    },
                    {
                        $lookup: {
                            from: "doctypes",
                            localField:"_id.certificateName",
                            foreignField: "_id",
                            as: "certificateName"
                        }
                    },
                    {
                        $unwind: "$certificateName"
                    },
                    {
                        "$project": {
                          "_id": 0,
                          "certificateName.name": 1,
                          "amount": 1
                        }
                    }
                ]);
                if(!infoData)
                    return resolve({ error: true, message: "can't_get", status: 403 });

                return resolve({ error: false, data: infoData, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Download Excel Human in Company
     * Date: 21/06/2022
     */
    exportHuman({ companyID, userID }) {
        return new Promise(async resolve => {
            try {
                const validation = validateParamsObjectID({ userID, companyID });
                if(validation.error) return resolve(validation);

                const listHuman = await HUMAN__CONTACT_DOCUMENT_COLL
                    .find({
                        company: companyID
                    })
                    .populate({
                        path: 'position2 project contact certificateName',
                        // select: 'name position birthday workingStatus workStartDate educationalBackground graduationYear contractType contractExpire insuranceNumber taxid phone identity insuranceStatus note',
                        populate: {
                            path: 'position workingStatus educationalBackground contractType department',
                            // select: 'name'
                        }
                    })
                    .lean();

                if(!listHuman) {
                    return resolve({
                        error: true,
                        message: 'Không tìm thấy nhân sự trong công ty',
                        keyError: 'humans_not_exists',
                        status: 400
                    });
                }

                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/human_1_HumanInCompany.xlsm')))
                    .then(async workbook => {

                        workbook.sheet("DanhSachNhanSu").row(1).cell(1).value(`DANH SÁCH CÁN BỘ CÔNG TY`);

                        let indexExcel = 4;
                        const currentYear = new Date().getFullYear();

                        listHuman.map((human, index) => {
                            const {
                                name, position, department, workingStatus, birthday, workStartDate,
                                educationalBackground, graduationYear, contractType, contractExpire,
                                insuranceNumber, taxid, phone, identity, insuranceStatus, note
                            } = human.contact;

                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(1).value(index+1);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(2).value(name);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(3).value(position?.name);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(4).value(department?.name);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(5).value(workingStatus?.name);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(6).value(moment(birthday).format('DD/MM/YYYY'));
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(7).value(workStartDate ? moment(workStartDate).format('DD/MM/YYYY') : '');
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(8).value(educationalBackground?.name);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(9).value('');
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(10).value(graduationYear);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(11).value(currentYear - graduationYear);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(12).value(human.certificateName?.description);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(13).value(human.certificateGrade);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(14).value('');
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(15).value(contractType?.name || '');
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(16).value(moment(contractExpire).format('DD/MM/YYYY'));
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(17).value(insuranceNumber);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(18).value(taxid);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(19).value(phone);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(20).value(identity);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(21).value(insuranceStatus);
                            workbook.sheet("DanhSachNhanSu").row(indexExcel).cell(22).value(note || human.note);

                            indexExcel++;
                        })

                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `human_1_HumanInCompany${now.getTime()}.xlsm`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);

                        const result = await uploadFileS3(pathWriteFile, fileName);
                        fs.unlinkSync(pathWriteFile);

                        return resolve({ error: false, data: result?.Location, status: 200 });
                    });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;
