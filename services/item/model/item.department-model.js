"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 		        = require('../../auth/helper/auth.actions-constant');
const _isValid                          = require("mongoose").Types.ObjectId;

/**
 * import inter-coll, exter-coll
 */
const ITEM__DEPARTMENT_COLL                 = require('../database/item.department-coll');
const { RANGE_BASE_PAGINATION_V2 } 		    = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */

class Model extends BaseModel {

    constructor() {
        super(ITEM__DEPARTMENT_COLL);
    }

    /**
     * Name: Tạo mới dự án/phòng ban bởi Supper Admin
     * Author: Depv
     */
    insert({ type, name, description, company, parent, sign, owner, address, startDate, endDate, pm, status, note, assistant, projectCapital, projectType, buildingGrade, buildingType, investmentAmount, area, authorID, admins, members, ctx }) {
        return new Promise(async resolve => {
            try {
                if(!_isValid(company) | !_isValid(authorID))
                    return resolve({ error: true, message: 'Request params company|author(*) invalid', status: 400 });
                if(!name)
                    return resolve({ error: true, message: 'Request params name(*) invalid', status: 400 });
                
                if(!sign)
                    return resolve({ error: true, message: 'Request params sign(*) invalid', status: 400 });
                
                if(!area)
                    return resolve({ error: true, message: 'Request params area(*) invalid', status: 400 });

                if(!type)
                    return resolve({ error: true, message: 'Request params type(*) invalid', status: 400 });

                // Lấy thông tin công ty để gán ký hiệu công ty vào tên dự án
                let infoCompany = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_OR_GET_LIST_COMPANY}`, {
                    companyID: company
                });

                if(infoCompany.error)
                    return resolve({ error: true, message: "Request params company invalid" });

                // Kiểm tra tồn tại
                let infoDepartment = await ITEM__DEPARTMENT_COLL.findOne({
                    company: company,
                    $or: [
                        { name: name },
                        { sign: sign },
                    ] 
                }).select('_id name sign');

                if(infoDepartment)
                    return resolve({ error: true, message: `Tên/Mã hiệu đã tồn tại: ${infoDepartment.name}` }); 
                
                let dataInsert = {
                    company,
                    type: type ? Number(type) : Number(1),
                    name,
                    description, 
                    sign: `${infoCompany.data.sign}.${sign}`,
                    owner, 
                    address, 
                    startTime: startDate, 
                    expiredTime: endDate, 
                    status: !isNaN(status) ? Number(status) : 1, 
                    note, 
                    projectCapital: !isNaN(projectCapital) ? Number(projectCapital) : 1, 
                    projectType: !isNaN(projectType) ? Number(projectType) : 1, 
                    buildingGrade: !isNaN(buildingGrade) ? Number(buildingGrade) : 1,
                    buildingType: !isNaN(buildingType) ? Number(buildingType) : 1,
                    investmentAmount: !isNaN(investmentAmount) ? Number(investmentAmount) : 0,
                }

                if(pm && _isValid(pm)){
                    dataInsert.pm = pm;
                }

                if(assistant && _isValid(assistant)){
                    dataInsert.assistant = assistant;
                }
                // _____Khuc vực
                if(area && _isValid(area)){
                    dataInsert.area = area;
                }

                if(parent && _isValid(parent)){
                    let infoMenuParent = await ITEM__DEPARTMENT_COLL.findById(parent);
                    dataInsert.parent = parent;
                    dataInsert.level = infoMenuParent.level + 1;
                }
                //________Xóa phần tử trùng nhau trong mảng
                admins  = [...new Set([ ...admins, authorID])];;
                members = [...new Set([ ...members, authorID])];;

                if(checkObjectIDs(admins)){
                    dataInsert.admins = admins;
                }

                if(checkObjectIDs(members)){
                    dataInsert.members = members;
                }
                

                let infoAfterInsert = await this.insertData(dataInsert, authorID);
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Cập nhật mới dự án/phòng ban bởi Supper Admin
     * Author: Depv
     */
    update({ 
        departmentID, name, admins, adminRemove, members, memberRemove, stage, ontime, onbudget, status, projectType, projectCapital, buildingType, buildingGrade,
        description, sign, owner, location, address, area, startTime, expiredTime, actualStartTime, actualFinishTime,
        pm, assistant, budget, note, position, image, files, userUpdate, milestones, completedMilestones, tasks, completedTasks,
        images, lastComment, revenue, forecastRevenue, realRevenue, forecastBudget, realBudget, npv, forecastNpv, realNpv, irr, forecastIrr,
        realIrr, numberOfPackage, numberOfCompletedPackage, numberOfContractIn, contractValue, contractPlusValue, contractVatValue, contractAdvancePayment,
        contractProduce, contractPlusAcceptance, contractVatAcceptance, contractRetainedValue, contractAdvancePaymentDeduction,
        contractOtherDeduction, contractRecommendedPayment, contractAmountPaid, contractRemainingPayment, contractAdvancePaymentOverage, openTime,
        closedTime, numberOfAgent, numberOfBooking, totalBookingValue, numberOfDeposit, totalDepositValue, numberOfContract, totalContractValue,
        receivable, estimate, lastDateContact, transactionContacts, likelihoodOfSuccess, lastChange, numberOfContact, numberOfMoms, numberOfDocs,
        numberOfDrawings, numberOfReports, numberOfIpcs, numberOfRfis, numberOfSubmitals, numberOfPunchLists, numberOfPhotos, numberOfInspections, numberFinishOfDocs
    }) {
        return new Promise(async resolve => {
            try {
                let dataUpdate   = {};
                let dataAddToSet = {};
                let dataPull     = {};
                
                if(!checkObjectIDs(departmentID))
                    return resolve({ error: true, message: "Request params departmentID invalid" });

                // KIỂM TRA SIGN VÀ NAME CÓ TỒN TẠI Ở 1 DỰ ÁN KHÁC CHƯA
                if(sign || name){
                    let infoDepartmentOrg = await ITEM__DEPARTMENT_COLL.findById(departmentID);
                    let infoDepartment = await ITEM__DEPARTMENT_COLL.findOne({
                        company: infoDepartmentOrg.company,
                        $or: [
                            { name: name },
                            { sign: sign },
                        ], 
                        _id: { $ne: departmentID }
                    }).select('_id name sign');

                    if(infoDepartment)
                        return resolve({ error: true, message: `Tên/Mã hiệu đã tồn tại: ${infoDepartment.name}` }); 
                }

                if(name){
                    dataUpdate.name = name;
                }
           
                if(checkObjectIDs(admins)){
                    dataAddToSet.admins = admins;
                }

                if(checkObjectIDs(adminRemove)){
                    dataPull.admins = adminRemove;
                }

                if(checkObjectIDs(members)){
                    dataAddToSet.members = members;
                }

                if(checkObjectIDs(memberRemove)){
                    dataPull.members = memberRemove;
                }

                if(!isNaN(stage)){
                    dataAddToSet.stage = stage;
                }

                if(!isNaN(ontime)){
                    dataUpdate.ontime = ontime;
                }

                if(!isNaN(onbudget)){
                    dataUpdate.onbudget = onbudget;
                }

                if(!isNaN(status)){
                    dataUpdate.status = status;
                }

                if(!isNaN(projectType)){
                    dataUpdate.projectType = projectType;
                }

                if(!isNaN(projectCapital)){
                    dataUpdate.projectCapital = projectCapital;
                }

                if(!isNaN(buildingType)){
                    dataUpdate.buildingType = buildingType;
                }

                if(!isNaN(buildingGrade)){
                    dataUpdate.buildingGrade = buildingGrade;
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(owner){
                    dataUpdate.owner = owner;
                }

                if(location){
                    dataUpdate.location = location;
                }

                if(address){
                    dataUpdate.address = address;
                }

                if(checkObjectIDs(area)){
                    dataUpdate.area = area;
                }
               
                if(startTime){
                    dataUpdate.startTime = startTime;
                }

                if(expiredTime){
                    dataUpdate.expiredTime = expiredTime;
                }

                if(actualStartTime){
                    dataUpdate.actualStartTime = actualStartTime;
                }

                if(actualFinishTime){
                    dataUpdate.actualFinishTime = actualFinishTime;
                }

                if(checkObjectIDs(pm)){
                    dataUpdate.pm = pm;
                }

                if(checkObjectIDs(assistant)){
                    dataUpdate.assistant = assistant;
                }

                if(checkObjectIDs(budget)){
                    dataUpdate.budget = budget;
                }

                if(note){
                    dataUpdate.note = note;
                }

                // if(checkObjectIDs(position)){ // Check lại
                //     dataUpdate.position = position;
                // }

                if(image){
                    dataUpdate.image = image;
                }

                if(checkObjectIDs(files)){
                    dataUpdate.files = files;
                }
                
                if(checkObjectIDs(userUpdate)){
                    dataUpdate.userUpdate = userUpdate;
                }

                if(!isNaN(milestones)){
                    dataUpdate.milestones = milestones;
                }

                if(!isNaN(completedMilestones)){
                    dataUpdate.completedMilestones = completedMilestones;
                }

                if(!isNaN(tasks)){
                    dataUpdate.tasks = tasks;
                }

                if(!isNaN(completedTasks)){
                    dataUpdate.completedTasks = completedTasks;
                }

                if(checkObjectIDs(images)){
                    dataUpdate.images = images;
                }

                if(checkObjectIDs(lastComment)){
                    dataUpdate.lastComment = lastComment;
                }

                if(!isNaN(revenue)){
                    dataUpdate.revenue = revenue;
                }

                if(!isNaN(forecastRevenue)){
                    dataUpdate.forecastRevenue = forecastRevenue;
                }

                if(!isNaN(realRevenue)){
                    dataUpdate.realRevenue = realRevenue;
                }

                if(!isNaN(forecastBudget)){
                    dataUpdate.forecastBudget = forecastBudget;
                }
                
                if(!isNaN(realBudget)){
                    dataUpdate.realBudget = realBudget;
                }

                if(!isNaN(npv)){
                    dataUpdate.npv = npv;
                }

                if(!isNaN(forecastNpv)){
                    dataUpdate.forecastNpv = forecastNpv;
                }

                if(!isNaN(realNpv)){
                    dataUpdate.realNpv = realNpv;
                }

                if(!isNaN(irr)){
                    dataUpdate.irr = irr;
                }

                if(!isNaN(forecastIrr)){
                    dataUpdate.forecastIrr = forecastIrr;
                }

                if(!isNaN(realIrr)){
                    dataUpdate.realIrr = realIrr;
                }
                
                if(!isNaN(numberOfPackage)){
                    dataUpdate.numberOfPackage = numberOfPackage;
                }

                if(!isNaN(numberOfCompletedPackage)){
                    dataUpdate.numberOfCompletedPackage = numberOfCompletedPackage;
                }

                if(!isNaN(numberOfContractIn)){
                    dataUpdate.numberOfContractIn = numberOfContractIn;
                }

                if(!isNaN(contractValue)){
                    dataUpdate.contractValue = contractValue;
                }

                if(!isNaN(contractPlusValue)){
                    dataUpdate.contractPlusValue = contractPlusValue;
                }

                if(!isNaN(contractVatValue)){
                    dataUpdate.contractVatValue = contractVatValue;
                }

                if(!isNaN(contractAdvancePayment)){
                    dataUpdate.contractAdvancePayment = contractAdvancePayment;
                }

                if(!isNaN(contractProduce)){
                    dataUpdate.contractProduce = contractProduce;
                }

                if(!isNaN(contractPlusAcceptance)){
                    dataUpdate.contractPlusAcceptance = contractPlusAcceptance;
                }

                if(!isNaN(contractVatAcceptance)){
                    dataUpdate.contractVatAcceptance = contractVatAcceptance;
                }

                if(!isNaN(contractRetainedValue)){
                    dataUpdate.contractRetainedValue = contractRetainedValue;
                }

                if(!isNaN(contractAdvancePaymentDeduction)){
                    dataUpdate.contractAdvancePaymentDeduction = contractAdvancePaymentDeduction;
                }

                if(!isNaN(contractOtherDeduction)){
                    dataUpdate.contractOtherDeduction = contractOtherDeduction;
                }

                if(!isNaN(contractRecommendedPayment)){
                    dataUpdate.contractRecommendedPayment = contractRecommendedPayment;
                }

                if(!isNaN(contractAmountPaid)){
                    dataUpdate.contractAmountPaid = contractAmountPaid;
                }

                if(!isNaN(contractRemainingPayment)){
                    dataUpdate.contractRemainingPayment = contractRemainingPayment;
                }

                if(!isNaN(contractAdvancePaymentOverage)){
                    dataUpdate.contractAdvancePaymentOverage = contractAdvancePaymentOverage;
                }

                if(openTime){
                    dataUpdate.openTime = openTime;
                }

                if(closedTime){
                    dataUpdate.closedTime = closedTime;
                }

                if(!isNaN(numberOfAgent)){
                    dataUpdate.numberOfAgent = numberOfAgent;
                }

                if(!isNaN(numberOfBooking)){
                    dataUpdate.numberOfBooking = numberOfBooking;
                }

                if(!isNaN(totalBookingValue)){
                    dataUpdate.totalBookingValue = totalBookingValue;
                }

                if(!isNaN(numberOfDeposit)){
                    dataUpdate.numberOfDeposit = numberOfDeposit;
                }

                if(!isNaN(totalDepositValue)){
                    dataUpdate.totalDepositValue = totalDepositValue;
                }

                if(!isNaN(numberOfContract)){
                    dataUpdate.numberOfContract = numberOfContract;
                }

                if(!isNaN(totalContractValue)){
                    dataUpdate.totalContractValue = totalContractValue;
                }

                if(!isNaN(receivable)){
                    dataUpdate.receivable = receivable;
                }

                if(!isNaN(estimate)){
                    dataUpdate.estimate = estimate;
                }

                if(lastDateContact){
                    dataUpdate.lastDateContact = lastDateContact;
                }

                if(checkObjectIDs(transactionContacts)){
                    dataUpdate.transactionContacts = transactionContacts;
                }

                if(likelihoodOfSuccess){
                    dataUpdate.likelihoodOfSuccess = likelihoodOfSuccess;
                }

                if(checkObjectIDs(lastChange)){
                    dataUpdate.lastChange = lastChange;
                }
                
                if(!isNaN(numberOfContact)){
                    dataUpdate.numberOfContact = numberOfContact;
                }

                if(!isNaN(numberOfMoms)){
                    dataUpdate.numberOfMoms = numberOfMoms;
                }

                // if(!isNaN(numberOfDocs)){
                //     dataUpdate.numberOfDocs = numberOfDocs;
                // }

                if(!isNaN(numberOfDrawings)){
                    dataUpdate.numberOfDrawings = numberOfDrawings;
                }

                if(!isNaN(numberOfReports)){
                    dataUpdate.numberOfReports = numberOfReports;
                }
                
                if(!isNaN(numberOfIpcs)){
                    dataUpdate.numberOfIpcs = numberOfIpcs;
                }

                if(!isNaN(numberOfRfis)){
                    dataUpdate.numberOfRfis = numberOfRfis;
                }

                if(!isNaN(numberOfSubmitals)){
                    dataUpdate.numberOfSubmitals = numberOfSubmitals;
                }

                if(!isNaN(numberOfPunchLists)){
                    dataUpdate.numberOfPunchLists = numberOfPunchLists;
                }

                if(!isNaN(numberOfPhotos)){
                    dataUpdate.numberOfPhotos = numberOfPhotos;
                }

                if(!isNaN(numberOfInspections)){
                    dataUpdate.numberOfInspections = numberOfInspections;
                }

                if(dataAddToSet){
                    dataUpdate.$addToSet = dataAddToSet;
                }

                if(dataPull){
                    dataUpdate.$pull = dataPull;
                }

                let dataInc = {};
                if(numberOfDocs){
                    dataInc.numberOfDocs = numberOfDocs;
                }

                if(numberFinishOfDocs){
                    dataInc.numberFinishOfDocs = numberFinishOfDocs;
                }

                if(dataInc){
                    dataUpdate.$inc = dataInc;
                }

                let infoAfterUpdate = await ITEM__DEPARTMENT_COLL.findByIdAndUpdate(departmentID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Update department faild" });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Lấy thông tin dự án/phòng ban ✅
     * Author: Depv
     * Code: F00401
     */
    getInfo({ departmentID, 
        select, populates={}}) {
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
                
                if(!checkObjectIDs(departmentID))
                    return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */

                let infoDepartment = await ITEM__DEPARTMENT_COLL.findById(departmentID)
                .select(select)
                .populate(populates)

                if(!infoDepartment)
                    return resolve({ error: true, message: "Can't get department", status: 403 });

                return resolve({ error: false, data: infoDepartment, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Danh sách dự án (Hàm dùng chung)
     * Author: DePV ✅
     * Code  : F00402
     */
    getList({ companyID, keyword, type, userID, isMember, limit = 10, lastestID, select, populates={} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj  = {};
                let sortBy;
                let keys	      = ['createAt__-1', '_id__-1'];

                if(limit > 20){
                    limit = 20;
                }

                if(isMember == 1){
                    conditionObj.members = { $in: [userID] }
                }
                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(companyID && !checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

                companyID && (conditionObj.company = companyID);
                
                if(type){
                    conditionObj.type = +type;
                }

                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                //_____populate
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

                //_____Tìm kiếm theo từ khóa
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

                let conditionObjOrg = { ...conditionObj }

				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__DEPARTMENT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });

					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort?.data?.find;
					sortBy        = dataPagingAndSort?.data?.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort?.data?.sort;
                }
               
                //_____Bắt đầu query database
                let infoDataAfterGet = await ITEM__DEPARTMENT_COLL
                    .find(conditionObj)
                    .limit(+limit+1)
                    .sort(sortBy) 
                    .select(select) 
                    .populate(populates)
                    .lean(); 
                
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get department", status: 403 });

                let totalRecord = await ITEM__DEPARTMENT_COLL.count(conditionObjOrg);
				let nextCursor	= null;
                let totalPage = Math.ceil(totalRecord/limit);

				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

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
     * Name  : Danh sách dự án mà user được quyền truy cập (là member)
     * Author: DePV ✅
     * Code  : F00403
     */
    getListByMembers({ companyID, keyword, type, userID, limit = 10, lastestID, select, populates={} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj  =  { 
                    members: { $in: [userID] }
                }
                
                let sortBy;
                let keys	      = ['createAt__-1', '_id__-1'];

                if(limit > 20){
                    limit = 20;
                }

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = companyID
                }
                
                if([1,2].includes(type)){
                    conditionObj.type = +type;
                }

                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                //_____populate
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

                //_____Tìm kiếm theo từ khóa
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

                let conditionObjOrg = { ...conditionObj }

                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await ITEM__DEPARTMENT_COLL.findById(lastestID);
                    if(!infoData)
                        return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });

                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort?.data?.find;
                    sortBy        = dataPagingAndSort?.data?.sort;
                }else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy        = dataPagingAndSort?.data?.sort;
                }
                
                //_____Bắt đầu query database
                let infoDataAfterGet = await ITEM__DEPARTMENT_COLL
                    .find(conditionObj)
                    .limit(+limit+1)
                    .sort(sortBy) 
                    .select(select) 
                    .populate(populates)
                    .lean(); 
                
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get department", status: 403 });

                let totalRecord = await ITEM__DEPARTMENT_COLL.count(conditionObjOrg);
                let nextCursor	= null;
                let totalPage = Math.ceil(totalRecord/limit);

                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

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
     * Name  : Thống kê theo tiến độ ngân sách
     * Author: DePV ✅
     * Code  : 
     */
    analysisOntimeOnbudget({ userID }){
        return new Promise(async resolve => {
            let dataBlock1 = await ITEM__DEPARTMENT_COLL.aggregate([
                {
                    $match: {
                        members : { $in: [_isValid(userID)] },
                        ontime  : { $exists: true },
                        onbudget: { $exists: true },
                    },
                },
                { 
                    $group: {
                        _id: { 
                            ontime  :  "$ontime",
                            onbudget:  "$onbudget",
                        }, 
                        amount: { $sum: 1 },
                      } 
                },
                {
                    $sort: { 
                        "_id.ontime": 1,
                        "_id.onbudget": 1
                    }
                },
            ])

            let dataBlock2 = await ITEM__DEPARTMENT_COLL.aggregate([
                {
                    $match: {
                        members : { $in: [_isValid(userID)] },
                    },
                },
                { 
                    $group: {
                        _id: null,
                        budget: { $sum: "$budget" },
                        forecastBudget: { $sum: "$forecastBudget" },
                        contractValueContractPlusValueContractVatValue: { $sum: { $multiply: [ "$contractValue", "$contractPlusValue", "contractVatValue" ]} },
                        contractAmountPaid: { $sum: "$contractAmountPaid" },
                    } 
                }
            ])

            let dataBlock3 = await ITEM__DEPARTMENT_COLL.aggregate([
                {
                    $match: {
                        members : { $in: [_isValid(userID)] },
                        stage: { $ne: null}
                    },
                },
                { 
                    $group: {
                        _id: {
                            stage: "$stage",
                        },
                        amount: { $sum: 1 },
                    } 
                },
                {
                    $sort: { 
                        "_id.stage": 1,
                    }
                },
            ])

            return resolve({ 
                error: false, 
                data: { 
                    dataBlock1, dataBlock2, dataBlock3
                }
            });
        })
    }
}

exports.MODEL = new Model;
