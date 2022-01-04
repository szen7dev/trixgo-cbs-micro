/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__DEPARTMENT_MODEL                   = require('../model/item.department-model').MODEL;

module.exports = {


    /**
	 * Dev: Depv ✅
	 * Func: Thêm dự án/phòng ban
	 */
    insert: {
        auth: "required",
        params: {
            type            : { type: "number", optional: true },
            name            : { type: "string", optional: true },
            description     : { type: "string", optional: true },
            // company         : { type: "string", optional: true },
            parent          : { type: "string", optional: true },
            sign            : { type: "string", optional: true },
            owner           : { type: "string", optional: true },
            address         : { type: "string", optional: true },
            startDate       : { type: "string", optional: true },
            endDate         : { type: "string", optional: true },
            pm              : { type: "string", optional: true },
            status          : { type: "string", optional: true },
            note            : { type: "string", optional: true },
            assistant       : { type: "string", optional: true },
            projectCapital  : { type: "string", optional: true },
            projectType     : { type: "string", optional: true },
            buildingGrade   : { type: "string", optional: true },
            buildingType    : { type: "string", optional: true },
            investmentAmount: { type: "string", optional: true },
            area            : { type: "string", optional: true },
            members         : { type: "array", optional: true },
            admins          : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  type, name, description, parent, sign, owner, address, startDate, endDate, pm, status, note,
                    assistant, projectCapital, projectType, buildingGrade, buildingType, investmentAmount, area, admins, members } = ctx.params;

				const { _id: userID, company } = ctx.meta.infoUser;
                let resultAfterCallHandler = await ITEM__DEPARTMENT_MODEL.insert({
                    type, name, description, company, parent, sign, owner, address, startDate, endDate, pm, status, 
                    note, assistant, projectCapital, projectType, buildingGrade, buildingType, investmentAmount, area, authorID: userID, admins, members, ctx
                });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Cập nhật dự án/phòng ban
	 */
    update: {
        auth: "required",
        params: {
            departmentID            : { type: "string", optional: true },
            name                    : { type: "string", optional: true },
            admins                  : { type: "array", optional: true  },
            adminRemove             : { type: "string", optional: true },
            members                 : { type: "array", optional: true  },
            memberRemove            : { type: "string", optional: true },
            stage                   : { type: "number", optional: true },
            ontime                  : { type: "number", optional: true },
            onbudget                : { type: "number", optional: true },
            status                  : { type: "number", optional: true },
            projectType             : { type: "number", optional: true },
            projectCapital          : { type: "number", optional: true },
            buildingType            : { type: "number", optional: true },
            buildingGrade           : { type: "number", optional: true },
            description             : { type: "string", optional: true },
            sign                    : { type: "string", optional: true },
            owner                   : { type: "string", optional: true },
            location                : { type: "string", optional: true },
            address                 : { type: "string", optional: true },
            area                    : { type: "string", optional: true },
            startTime               : { type: "string", optional: true },
            expiredTime             : { type: "string", optional: true },
            actualStartTime         : { type: "string", optional: true },
            actualFinishTime        : { type: "string", optional: true },
            pm                      : { type: "string", optional: true },
            assistant               : { type: "string", optional: true },
            budget                  : { type: "number", optional: true },
            note                    : { type: "string", optional: true },
            position                : { type: "string", optional: true },
            image                   : { type: "string", optional: true },
            files                   : { type: "array", optional: true  },
            userUpdate              : { type: "string", optional: true },
            milestones              : { type: "number", optional: true },
            completedMilestones     : { type: "number", optional: true },
            tasks                   : { type: "number", optional: true },
            completedTasks          : { type: "number", optional: true },
            images                  : { type: "string", optional: true },
            lastComment             : { type: "string", optional: true },
            revenue                 : { type: "number", optional: true },
            forecastRevenue         : { type: "number", optional: true },
            realRevenue             : { type: "number", optional: true },
            forecastBudget          : { type: "number", optional: true },
            realBudget              : { type: "number", optional: true },
            npv                     : { type: "number", optional: true },
            forecastNpv             : { type: "number", optional: true },
            realNpv                 : { type: "number", optional: true },
            irr                     : { type: "number", optional: true },
            forecastIrr             : { type: "number", optional: true },
            realIrr                 : { type: "number", optional: true },
            numberOfPackage         : { type: "number", optional: true },
            numberOfCompletedPackage: { type: "number", optional: true },
            numberOfContractIn      : { type: "number", optional: true },
            contractValue           : { type: "number", optional: true },
            contractPlusValue       : { type: "number", optional: true },
            contractVatValue        : { type: "number", optional: true },
            contractAdvancePayment  : { type: "number", optional: true },
            contractPlusAcceptance  : { type: "number", optional: true },
            contractVatAcceptance   : { type: "number", optional: true },
            contractRetainedValue   : { type: "number", optional: true },
            contractAdvancePaymentDeduction: { type: "number", optional: true },
            contractOtherDeduction         : { type: "number", optional: true },
            contractRecommendedPayment     : { type: "number", optional: true },
            contractAmountPaid             : { type: "number", optional: true },
            contractRemainingPayment       : { type: "number", optional: true },
            contractAdvancePaymentOverage  : { type: "number", optional: true },
            openTime                       : { type: "string", optional: true },
            closedTime                     : { type: "string", optional: true },
            numberOfAgent                  : { type: "number", optional: true },
            numberOfBooking                : { type: "number", optional: true },
            totalBookingValue              : { type: "number", optional: true },
            numberOfDeposit                : { type: "number", optional: true },
            totalDepositValue              : { type: "number", optional: true },
            numberOfContract               : { type: "number", optional: true },
            totalContractValue             : { type: "number", optional: true },
            receivable                     : { type: "number", optional: true },
            estimate                       : { type: "number", optional: true },
            lastDateContact                : { type: "string", optional: true },
            transactionContacts            : { type: "string", optional: true },
            likelihoodOfSuccess            : { type: "string", optional: true },
            lastChange                     : { type: "string", optional: true },
            numberOfContact                : { type: "number", optional: true },
            numberOfMoms                   : { type: "number", optional: true },
            numberOfDocs                   : { type: "number", optional: true },
            numberOfDrawings               : { type: "number", optional: true },
            numberOfReports                : { type: "number", optional: true },
            numberOfIpcs                   : { type: "number", optional: true },
            numberOfRfis                   : { type: "number", optional: true },
            numberOfSubmitals              : { type: "number", optional: true },
            numberOfPunchLists             : { type: "number", optional: true },
            numberOfPhotos                 : { type: "number", optional: true },
            numberOfInspections            : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;

                let {  departmentID, name, admins, adminRemove, members, memberRemove, stage, ontime, onbudget, status, projectType, projectCapital, buildingType, buildingGrade,
                    description, sign, owner, location, address, area, startTime, expiredTime, actualStartTime, actualFinishTime,
                    pm, assistant, budget, note, position, image, files, milestones, completedMilestones, tasks, completedTasks,
                    images, lastComment, revenue, forecastRevenue, realRevenue, forecastBudget, realBudget, npv, forecastNpv, realNpv, irr, forecastIrr,
                    realIrr, numberOfPackage, numberOfCompletedPackage, numberOfContractIn, contractValue, contractPlusValue, contractVatValue, contractAdvancePayment,
                    contractProduce, contractPlusAcceptance, contractVatAcceptance, contractRetainedValue, contractAdvancePaymentDeduction,
                    contractOtherDeduction, contractRecommendedPayment, contractAmountPaid, contractRemainingPayment, contractAdvancePaymentOverage, openTime,
                    closedTime, numberOfAgent, numberOfBooking, totalBookingValue, numberOfDeposit, totalDepositValue, numberOfContract, totalContractValue,
                    receivable, estimate, lastDateContact, transactionContacts, likelihoodOfSuccess, lastChange, numberOfContact, numberOfMoms, numberOfDocs,
                    numberOfDrawings, numberOfReports, numberOfIpcs, numberOfRfis, numberOfSubmitals, numberOfPunchLists, numberOfPhotos, numberOfInspections } = ctx.params;

                let resultAfterCallHandler = await ITEM__DEPARTMENT_MODEL.update({
                    departmentID, name, admins, adminRemove, members, memberRemove, stage, ontime, onbudget, status, projectType, projectCapital, buildingType, buildingGrade,
                    description, sign, owner, location, address, area, startTime, expiredTime, actualStartTime, actualFinishTime,
                    pm, assistant, budget, note, position, image, files, userUpdate: userID, milestones, completedMilestones, tasks, completedTasks,
                    images, lastComment, revenue, forecastRevenue, realRevenue, forecastBudget, realBudget, npv, forecastNpv, realNpv, irr, forecastIrr,
                    realIrr, numberOfPackage, numberOfCompletedPackage, numberOfContractIn, contractValue, contractPlusValue, contractVatValue, contractAdvancePayment,
                    contractProduce, contractPlusAcceptance, contractVatAcceptance, contractRetainedValue, contractAdvancePaymentDeduction,
                    contractOtherDeduction, contractRecommendedPayment, contractAmountPaid, contractRemainingPayment, contractAdvancePaymentOverage, openTime,
                    closedTime, numberOfAgent, numberOfBooking, totalBookingValue, numberOfDeposit, totalDepositValue, numberOfContract, totalContractValue,
                    receivable, estimate, lastDateContact, transactionContacts, likelihoodOfSuccess, lastChange, numberOfContact, numberOfMoms, numberOfDocs,
                    numberOfDrawings, numberOfReports, numberOfIpcs, numberOfRfis, numberOfSubmitals, numberOfPunchLists, numberOfPhotos, numberOfInspections 
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
    
    /**
	 * Dev: Depv ✅
	 * Func: Danh sách dự án mà user được quyền truy cập
	 */
    getInfoAndGetList: {
        params: {
            // Field bổ sung
            type            : { type: "string", optional: true },
            departmentID    : { type: "string", optional: true },
            companyID       : { type: "string", optional: true },
            projectID       : { type: "string", optional: true },
            // Field mặc định
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  departmentID, companyID, type, keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                
                let resultAfterCallHandler;
                if(departmentID){
                    resultAfterCallHandler = await ITEM__DEPARTMENT_MODEL.getInfo({
                        departmentID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__DEPARTMENT_MODEL.getList({
                        companyID, lastestID, userID, type, 
                        keyword, limit, select, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}