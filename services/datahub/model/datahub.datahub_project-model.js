"use strict";

/**
 * EXTERNAL PACKAGE
 */
const stringUtils						 = require('../../../tools/utils/string_utils');
const ObjectID                           = require('mongoose').Types.ObjectId;
const BaseModel                                 	= require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');
const {
    checkObjectIDs,
    IsJsonString,
} = require('../../../tools/utils/utils');
/**
 * CONSTANTS
 */

/**
 * TOOLS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

/**
 * COLLECTIONS
 */
const DATAHUB_PROJECT_COLL           	= require('../database/datahub_project-coll');
const AREA_COLL                         = require('../../item/database/item.area-coll');
const COMPANY_COLL                      = require('../../auth/database/auth.company-coll');

class Model extends BaseModel {

    constructor() {
        super(DATAHUB_PROJECT_COLL);
    }

    /**
	 * Name: insert datahub project 
	 * Author: Depv
	 * Code: 
	 */
    insert({ client, address, area3, location, name, sign, note, projectType, buildingType, buildingGrade, basementNumber,
         basementArea, floorNumber, floorArea, status, userID, ctx }) {
        return new Promise(async resolve => {
            try { 
                if(!name)
                    return resolve({ error: true, message: "Tên datahub project không hợp lệ", keyError: 'name_invalid' });

                let dataInsert = { name, userCreate: userID, userUpdate: userID };

                if(client){
                    dataInsert.client = client;
                }

                if(address){
                    dataInsert.address = address;
                }

                if(area3){
                    dataInsert.area3 = area3;
                    // Call service area để lấy area1 và area2 => Xử lý sau
                    let infoArea3 = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.AREA_GET_INFO_AND_GET_LIST}`, {
                        areaID: area3, populates: JSON.stringify({"path": "parent", "select": "name sign parent level", "populate": {"path": "parent", "select": "name sign parent level"}})
                    })
                    let area2 = infoArea3?.data?.parent?._id;
                    let area1 = infoArea3?.data?.parent?.parent?._id;
                    if(area2){
                        dataInsert.area2 = area2;
                    }
                    if(area1){
                        dataInsert.area1 = area1;
                    }
                }
                
                if(location){
                    dataInsert.location = location;
                }

                if(sign){
                    dataInsert.sign = sign;
                }

                if(note){
                    dataInsert.note = note;
                }

                if(projectType){
                    dataInsert.projectType = projectType;
                }

                if(buildingType){
                    dataInsert.buildingType = buildingType;
                }

                if(buildingGrade){
                    dataInsert.buildingGrade = buildingGrade;
                }

                if(basementNumber){
                    dataInsert.basementNumber = basementNumber;
                }

                if(basementArea){
                    dataInsert.basementArea = basementArea;
                }

                if(floorNumber){
                    dataInsert.floorNumber = floorNumber;
                }

                if(floorArea){
                    dataInsert.floorArea = floorArea;
                }

                if(status){
                    dataInsert.status = status;
                }
                
                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert) 
                    return resolve({ error: true, message: "Tạo mới thất bại", keyError: 'cannot_insert' });
                
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Name: update datahub project 
	 * Author: Depv
	 * Code: 
	 */
    update({ datahubProjectID, client, address, area3, location, name, sign, note, projectType, buildingType, buildingGrade, 
        basementNumber, basementArea, floorNumber, floorArea, status, userID, ctx }) {
        return new Promise(async resolve => {
            try {
                
                let dataUpdate = { userUpdate: userID };
                if(name){
                    dataUpdate.name = name;
                }

                if(client){
                    dataUpdate.client = client;
                }

                if(address){
                    dataUpdate.address = address;
                }

                if(area3){
                    dataUpdate.area3 = area3;
                     // Call service area để lấy area1 và area2 => Xử lý sau
                     let infoArea3 = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.AREA_GET_INFO_AND_GET_LIST}`, {
                        areaID: area3, populates: JSON.stringify({"path": "parent", "select": "name sign parent level", "populate": {"path": "parent", "select": "name sign parent level"}})
                    })
                    let area2 = infoArea3?.data?.parent?._id;
                    let area1 = infoArea3?.data?.parent?.parent?._id;
                    if(area2){
                        dataUpdate.area2 = area2;
                    }
                    if(area1){
                        dataUpdate.area1 = area1;
                    }
                }

                if(location){
                    dataUpdate.location = location;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(projectType){
                    dataUpdate.projectType = projectType;
                }

                if(buildingType){
                    dataUpdate.buildingType = buildingType;
                }

                if(buildingGrade){
                    dataUpdate.buildingGrade = buildingGrade;
                }

                if(basementNumber){
                    dataUpdate.basementNumber = basementNumber;
                }

                if(basementArea){
                    dataUpdate.basementArea = basementArea;
                }

                if(floorNumber){
                    dataUpdate.floorNumber = floorNumber;
                }

                if(floorArea){
                    dataUpdate.floorArea = floorArea;
                }

                if(status){
                    dataUpdate.status = status;
                }

                let infoAfterUpdate = await DATAHUB_PROJECT_COLL.findByIdAndUpdate(datahubProjectID, dataUpdate, { new: true });
                if (!infoAfterUpdate) 
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: 'cannot_update' });
                
                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Name: Remove datahub project 
	 * Author: Depv
	 * Code: 
	 */
	remove({ datahubProjectID }) { 
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(datahubProjectID))
                    return resolve({ error: true, message: 'Mã datahubProjectID không hợp lệ', keyError: "datahubProjectID_invalid", status: 400 });
                
                let infoAterRemove = await DATAHUB_PROJECT_COLL.findByIdAndDelete(datahubProjectID)
                if(!infoAterRemove)
                    return resolve({ error: true, message: "Xoá thất bại", keyError: "remove_failed", status: 403 });
 
                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {               
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Name: get info datahub 
	 * Author: Depv
	 * Code: 
	 */
	getInfo({ datahubProjectID, select, populates }) { 
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
                if(!checkObjectIDs(datahubProjectID))
                    return resolve({ error: true, message: 'Request params datahubProjectID invalid', status: 400 });
                
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
                let infoAterGet = await DATAHUB_PROJECT_COLL.findById(datahubProjectID)
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
	 * Dev: Depv
	 * Func: Lấy danh sách gói thầu
	 * Date: 26/10/2021
	 */
    getList({ userID, lastestID, keyword, limit = 10, select, populates = {}}){
        return new Promise(async resolve => {
            try {
                let conditionObj = {};
                let sortBy; 
                let keys	     = ['createAt__-1', '_id__-1'];

                if(limit > 20){
                    limit = 20;
                }

				if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

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
                // SEARCH TEXT
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regSearch = new RegExp(keyword, 'i');
                    conditionObj.name = regSearch;
                }

                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await DATAHUB_PROJECT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort.data.find;
                    sortBy        = dataPagingAndSort.data.sort;
                }else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy        = dataPagingAndSort.data.sort;
                }

                let listPackages = await DATAHUB_PROJECT_COLL
					.find(conditionObj)
					.limit(limit + 1)
					.select(select)
					.populate(populates)
                    .sort(sortBy)
					.lean();

				// GET TOTAL RECORD
                let totalRecord = await DATAHUB_PROJECT_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);
				let nextCursor	= null;

				if(listPackages && listPackages.length){
					if(listPackages.length > limit){
						nextCursor = listPackages[limit - 1]._id;
						listPackages.length = limit;
					}
				}

                return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listPackages,
						limit: +limit,
						totalRecord,
                        totalPage,
						nextCursor
					}
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }


     /**
     * Dev: HiepNH
     * Func: Download template import excel
     * Date: 18/09/2022
     */
    downloadTemplateImportExcel({ userID }) {
        return new Promise(async resolve => {
            try {

                // let infoProject = await DEPARTMENT_COLL.findById(projectID).populate({ path: "members", select: "fullname name" });
                // if(infoProject.error)
                //     return res.json(infoProject);

                // let memberInProject     = infoProject.members;

                let listArea  = await AREA_COLL.find({ }).select("name sign");
                let listCompany = await COMPANY_COLL.find({ }).select('_id name sign').sort({_id: 1})

                // Modify the workbook.
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/datahub_project_list.xlsx')))
                .then(async workbook => {
                    var i = 2;
                    listArea?.forEach((item, index) => {
                        workbook.sheet("3-KhuVuc").row(i).cell(1).value(`${item._id}`);
                        workbook.sheet("3-KhuVuc").row(i).cell(2).value(`${item.sign}-${item.name}`); 
                        i++
                    });

                    var i = 2;
                    listCompany.forEach((item, index) => {
                        workbook.sheet("2-ChuDauTu").row(i).cell(7).value(`${item._id}`);
                        workbook.sheet("2-ChuDauTu").row(i).cell(8).value(`${item.sign}-${item.name}`);
                        i++
                    });

                    // var i = 2;
                    // memberInProject.forEach((item, index) => {
                    //     workbook.sheet("Export").row(i).cell(4).value(`${item._id}`);
                    //     workbook.sheet("Export").row(i).cell(5).value(item.fullname);
                    //     i++
                    // });

                    const now = new Date();
                    const filePath = '../../../files/temporary_uploads/';
                    const fileName = `Template_import_project_${now.getTime()}.xlsx`;
                    const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                    await workbook.toFileAsync(pathWriteFile);
                    const result = await uploadFileS3(pathWriteFile, fileName);
                    fs.unlinkSync(pathWriteFile);
                    console.log({ result })
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