"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs }                = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const ObjectID                          = require('mongoose').Types.ObjectId;
const moment                            = require('moment')
const { hash, compare }                 = require('../../../tools/bcrypt');
const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const { uploadFileS3 }                  = require('../../../tools/s3');

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_ITEM } 		        = require('../helper/item.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const { 
    DEVICE_TYPES,
 }                = require('../helper/analysis.keys-constant')

/**
 * COLLECTIONS
 */
const USER_COLL                                 = require('../../auth/database/auth.user-coll')
const APP_COLL                                  = require('../../auth/database/permission/auth.app-coll')
const COMPANY_COLL                              = require('../../auth/database/auth.company-coll')
const ANALYSIS__HISTORY_DATA_COLL               = require('../database/analysis.history_data-coll')
const ANALYSIS__HISTORY_TRAFFIC_COLL            = require('../database/analysis.history_traffic-coll')
const TIMESHEET__EXPERT_SALARY_COLL             = require('../../timesheet/database/timesheet.expert_salary-coll')
const ITEM__CONTACT_COLL            		    = require('../../item/database/item.contact-coll')
const ITEM__DOCTYPE_COLL            		    = require('../../item/database/item.doctype-coll')
const ITEM__FUNDA_COLL            		        = require('../../item/database/item.funda-coll')
const ITEM__WAREHOUSE_COLL            		    = require('../../item/database/item.warehouse-coll')
const BUDGET__WORK_COLL                         = require('../../budget/database/budget.work-coll');

class Model extends BaseModel {

    constructor() {
        super(ANALYSIS__HISTORY_DATA_COLL)
    }

	/**
	 * Dev: Depv
	 * Func: Tạo history traffic
	 * Date: 13/12/2021
	 */
	insert({ type, userCreate }){
        // console.log({ type, userCreate })
        return new Promise(async resolve => { 
            try {
                let dataInsert = { userCreate}; 
                if(type){
                    dataInsert.type = type;
                }
                let infoAfterInsert = await this.insertData(dataInsert);
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getData({ option, companyID, page, unit, getNumber, newPassword }){
        // console.log({ option, companyID, page, unit, getNumber, newPassword })
        return new Promise(async resolve => { 
            try {
                return resolve({ error: false, data: 'Get data thành công' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    convertData({ option, companyID, page, unit, getNumber, newPassword, fundaID, warehouseID, contactID }){
        // console.log({ option, companyID, page, unit, getNumber, newPassword })
        const that = this
        return new Promise(async resolve => { 
            try {
                let conditionObj = {}
                
                if(option == 1){
                    let selectObj = '_id name sign description note phone email identity taxid bankAccount'
                
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                    }

                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertContact({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await ITEM__CONTACT_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // convertDoctype
                else if(option == 2){
                    let selectObj = '_id name sign description'
                
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                    }

                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await ITEM__DOCTYPE_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await ITEM__DOCTYPE_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertDoctype({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await ITEM__DOCTYPE_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // convertBudget
                else if(option == 3){
                    let selectObj = '_id name sign description note'
                
                    if(companyID && checkObjectIDs(companyID)){
                        conditionObj.company = ObjectID(companyID)
                    }

                    if(!getNumber){
                        let limit = Number(page * unit)
                        let listData = await BUDGET__WORK_COLL.find(conditionObj)
                        .select('_id')
                        .sort({_id: 1})
                        .limit(limit)
                        .lean()
    
                        let infoBegin = listData[Number(page - 1)*unit]
                        let infoEnd = listData.slice(-1)

                        conditionObj._id = { $gte: ObjectID(infoBegin._id), $lte: ObjectID(infoEnd._id)}
    
                        let listDataConvert = await BUDGET__WORK_COLL.find(conditionObj)
                        .select(selectObj)
                        .sort({_id: 1})
                        .lean()
    
                        for(const item of listDataConvert){
                            await that.convertBudget({ docID: item._id, selectObj })
                        }
    
                        return resolve({ error: false, message: "Done", data: {page} })
                    }else{
                        let number = await BUDGET__WORK_COLL.count(conditionObj)
                        return resolve({ error: false, number: number })
                    }
                }

                // Link fundaID với warehouseID
                else if(option == 4){
                  let info1 = await ITEM__FUNDA_COLL.findByIdAndUpdate(fundaID, {warehouse: warehouseID}, { new: true } )
                  let info2 = await ITEM__WAREHOUSE_COLL.findByIdAndUpdate(warehouseID, {funda: fundaID}, { new: true } )
                //   console.log(info1)
                //   console.log(info2)
                }

                else if(option == 5){
                    let info = await ITEM__FUNDA_COLL.findByIdAndUpdate(fundaID, {contact: contactID}, { new: true } )
                    // console.log(info)
                }

                else if(option == 6){
                    let info = await ITEM__CONTACT_COLL.findByIdAndUpdate(contactID, {isDefault: 2}, { new: true } )
                    // console.log(info)
                }

                return resolve({ error: false, data: 'Convert thành công' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    convertContact({ docID, selectObj }) {
        return new Promise(async resolve => {
            try {
                let info = await ITEM__CONTACT_COLL.findById(docID).select(`${selectObj}`)

                let convertStr = ''
                if(info.name && info.name != ""){
                    convertStr = stringUtils.removeAccents(info.name)
                }
                if(info.sign && info.sign != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.sign)
                }
                if(info.description && info.description != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.description)
                }
                if(info.note && info.note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.note)
                }
                if(info.phone && info.phone != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.phone)
                }
                if(info.email && info.email != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.email)
                }
                if(info.identity && info.identity != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.identity)
                }
                if(info.taxid && info.taxid != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.taxid)
                }
                if(info.bankAccount && info.bankAccount != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.bankAccount)
                }

                await ITEM__CONTACT_COLL.findByIdAndUpdate(docID, {namecv: convertStr}, { new: true })
              
                return resolve({ error: false})
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    convertDoctype({ docID, selectObj }) {
        return new Promise(async resolve => {
            try {
                let info = await ITEM__DOCTYPE_COLL.findById(docID).select(`${selectObj}`)

                let convertStr = ''
                if(info.name && info.name != ""){
                    convertStr = stringUtils.removeAccents(info.name)
                }
                if(info.sign && info.sign != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.sign)
                }
                if(info.description && info.description != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.description)
                }

                await ITEM__DOCTYPE_COLL.findByIdAndUpdate(docID, {namecv: convertStr}, { new: true })
              
                return resolve({ error: false})
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    convertBudget({ docID, selectObj }) {
        return new Promise(async resolve => {
            try {
                let info = await BUDGET__WORK_COLL.findById(docID).select(`${selectObj}`)

                let convertStr = ''
                if(info.name && info.name != ""){
                    convertStr = stringUtils.removeAccents(info.name)
                }
                if(info.sign && info.sign != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.sign)
                }
                if(info.description && info.description != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.description)
                }
                if(info.note && info.note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(info.note)
                }

                await BUDGET__WORK_COLL.findByIdAndUpdate(docID, {namecv: convertStr}, { new: true })
              
                return resolve({ error: false})
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    resetData({ option, companyID, page, unit, getNumber, newPassword, pass, salaryID }){
        // console.log({ option, companyID, page, unit, getNumber, newPassword })
        return new Promise(async resolve => { 
            try {
                if(pass && pass == 'Hiepnh1985@#'){
                    if(option == 1){
                        return resolve({ error: false, data: 'Reset thành công' });
                    }else if(option == 2){
                        if(companyID && checkObjectIDs(companyID)){
                            const newPassHash = await hash(newPassword, 8)
                            await USER_COLL.updateMany({company: companyID},{$set: {password: newPassHash}})
                            return resolve({ error: false, data: 'Reset thành công' })
                        }else{
                            return resolve({ error: false, data: 'Reset thất bại' })
                        }
                    }
                    else if(option == 3){
                        if(salaryID && checkObjectIDs(salaryID)){    
                            await TIMESHEET__EXPERT_SALARY_COLL.deleteMany({parent: salaryID})
                            await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndDelete(salaryID);
                            return resolve({ error: false, data: 'Reset thành công' })
                        }else{
                            if(companyID && checkObjectIDs(companyID)){    
                                await TIMESHEET__EXPERT_SALARY_COLL.deleteMany({company: companyID})
                                return resolve({ error: false, data: 'Reset thành công' })
                            }
                        }
                    }
                }else{
                    return resolve({ error: false, data: 'Pass không đúng, Reset thất bại' })
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    exportExcel({ option, companyID, year, page, unit, getNumber, newPassword }){
        // console.log({ option, companyID, page, unit, getNumber, newPassword })
        return new Promise(async resolve => { 
            try {
                let yearFilter
                let currentYear = new Date().getFullYear()
                if(year && !isNaN(year)){
                    yearFilter = Number(year)
                }else{
                    yearFilter = Number(currentYear)
                }

                let conditionObj = {}

                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = companyID
                }
    
                if(option == 1){
                    let listData = await ANALYSIS__HISTORY_TRAFFIC_COLL.find(conditionObj)
                    .limit(500)
                    .populate({
                        path: 'companyOfAuthor userCreate app menu',
                        select:'fullname name sign'
                    })
                    .sort({createAt: -1})
                    // .select('name hours unitprice amount status date note')
                    
                    // console.log(listData)
    
                    let listData1 = await ANALYSIS__HISTORY_TRAFFIC_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project : {
                                year : {$year : "$createAt"},
                                month : {$month : "$createAt"},
                                companyOfAuthor : 1,
                                createAt : 1,
                                userCreate : 1,
                                type : 1,
                                app : 1,
                                menu : 1,
                                note : 1,
                            }
                        },
                        {
                            $match: {
                                year: Number(yearFilter)
                            }
                        },
                        {
                            $group: {
                                _id: { app: "$app", month: "$month" },
                                quantity: { $sum: 1 },
                            }
                        },
                    ])
                    // console.log(listData1)

                    let listApp = await APP_COLL.find({_id: {$in: listData1.map(item => item._id.app)}}).sort({_id: 1}).select('name')

                    let listData2 = await ANALYSIS__HISTORY_TRAFFIC_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project : {
                                year : {$year : "$createAt"},
                                month : {$month : "$createAt"},
                                companyOfAuthor : 1,
                                createAt : 1,
                                userCreate : 1,
                                type : 1,
                                app : 1,
                                menu : 1,
                                note : 1,
                            }
                        },
                        {
                            $match: {
                                year: Number(yearFilter)
                            }
                        },
                        {
                            $group: {
                                _id: { companyOfAuthor: "$companyOfAuthor", month: "$month" },
                                quantity: { $sum: 1 },
                            }
                        },
                    ])

                    let listCompany = await COMPANY_COLL.find({_id: {$in: listData2.map(item => item._id.companyOfAuthor)}}).sort({_id: 1}).select('name')
    
                     // Modify the workbook.
                     XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/analysis_export_traffic.xlsx')))
                     .then(async workbook => {
    
                         var i = 3
                         listData.forEach((item, index) =>{
                             workbook.sheet("Data").row(i).cell(1).value(Number(index + 1))
                             workbook.sheet("Data").row(i).cell(2).value(item.createAt)
                             workbook.sheet("Data").row(i).cell(3).value(item?.companyOfAuthor?.name)
                             workbook.sheet("Data").row(i).cell(4).value(item?.userCreate?.fullname)
                             workbook.sheet("Data").row(i).cell(5).value(DEVICE_TYPES[Number(item.type - 1)].text)
                             workbook.sheet("Data").row(i).cell(6).value(item?.app?.name)
                             workbook.sheet("Data").row(i).cell(7).value(item?.menu?.name)
                             workbook.sheet("Data").row(i).cell(8).value(item?.note)

                             i++
                         })
    
                         var i = 3
                         listApp.forEach((item, index) =>{
                             workbook.sheet("DashBoard").row(i).cell(1).value(Number(index+1))
                             workbook.sheet("DashBoard").row(i).cell(2).value(`${item.name}`)
                             workbook.sheet("DashBoard").row(i).cell(3).value(`${item._id}`)
    
                             i++
                         })

                         listData1?.forEach((item, index) => {
                            for (var i = 3; i <= listApp.length + 2; i++) {
                                for(var j = 4; j <= 15; j ++){
                                    let appID = workbook.sheet(`DashBoard`).row(i).cell(3).value()

                                    if(appID.toString() === item._id.app.toString() && Number(j - 3) === Number(item._id.month)){
                                        workbook.sheet("DashBoard").row(i).cell(j).value(Number(item.quantity))
                                    }
                                }
                            }
                         })

                         var i = 3
                         listCompany.forEach((item, index) =>{
                             workbook.sheet("DashBoard2").row(i).cell(1).value(Number(index+1))
                             workbook.sheet("DashBoard2").row(i).cell(2).value(`${item.name}`)
                             workbook.sheet("DashBoard2").row(i).cell(3).value(`${item._id}`)
    
                             i++
                         })

                         listData2?.forEach((item, index) => {
                            for (var i = 3; i <= listCompany.length + 2; i++) {
                                for(var j = 4; j <= 15; j ++){
                                    let companyID = workbook.sheet(`DashBoard2`).row(i).cell(3).value()

                                    if(companyID.toString() === item._id.companyOfAuthor.toString() && Number(j - 3) === Number(item._id.month)){
                                        workbook.sheet("DashBoard2").row(i).cell(j).value(Number(item.quantity))
                                    }
                                }
                            }
                         })
               
                         const now = new Date();
                         const filePath = '../../../files/temporary_uploads/';
                         const fileName = `traffic_report${now.getTime()}.xlsx`;
                         const pathWriteFile = path.resolve(__dirname, filePath, fileName);
    
                         await workbook.toFileAsync(pathWriteFile);
                         const result = await uploadFileS3(pathWriteFile, fileName);
    
                         fs.unlinkSync(pathWriteFile);
                         return resolve({ error: false, data: result?.Location, status: 200 });
                     });
                }

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model