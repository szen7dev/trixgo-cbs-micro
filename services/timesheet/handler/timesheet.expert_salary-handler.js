/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const TIMESHEET__EXPERT_SALARY_MODEL            = require('../model/timesheet.expert_salary-model').MODEL;

module.exports = {

    /**
	 * Dev: Depv 
	 * Func: Insert expert timesheet
	 */
    insert: {
        params: {
            name               : { type: "string"},
            parentID           : { type: "string", optional: true },
            date               : { type: "string", optional: true },
            type               : { type: "string", optional: true },
            note               : { type: "string", optional: true },
            projectID          : { type: "string", optional: true },
            humanID             : { type: "string", optional: true },
            salary              : { type: "number", optional: true },
            reward              : { type: "number", optional: true },
            punishment          : { type: "number", optional: true },
            advance             : { type: "number", optional: true },
            remaining           : { type: "number", optional: true },
            paid                : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { parentID, name, date, type, note, projectID, humanID, salary, reward, punishment, advance, remaining, paid } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.insert({
                    userCreate: userID, companyID: company._id, parentID, name, date, type, note, projectID, humanID, salary, reward, punishment, advance, remaining, paid
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv 
	 * Func: Update expert timesheet
	 */
    update: {
        params: {
            expertSalaryID       : { type: "string" },
            projectID               : { type: "string", optional: true },
            name                    : { type: "string", optional: true },
            date                    : { type: "string", optional: true },
            type                    : { type: "string", optional: true },
            assigneeID              : { type: "string", optional: true },
            workID                  : { type: "string", optional: true },
            hours                   : { type: "string", optional: true },
            unitprice               : { type: "string", optional: true },
            amount                  : { type: "string", optional: true },
            status                  : { type: "string", optional: true },
            approver                : { type: "string", optional: true },
            note                    : { type: "string", optional: true },
            dateIn1                 : { type: "string", optional: true },
            dateOut1                : { type: "string", optional: true },
            dateIn2                 : { type: "string", optional: true },
            dateOut2                : { type: "string", optional: true },
            dateIn3                 : { type: "string", optional: true },
            dateOut3                : { type: "string", optional: true },
            members                 : { type: "array", optional: true },
            admins                  : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { expertSalaryID, projectID, name, type, assigneeID, hours, unitprice, amount, status, approver, note, date,
                     dateIn1, dateOut1, dateIn2, dateOut2, dateIn3, dateOut3, members, membersRemove, admins, adminsRemove, workID } = ctx.params;
                     
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.update({
                    expertSalaryID, userID, projectID, name, type, assigneeID, hours, unitprice, amount, status, approver,
                    note, date, dateIn1, dateOut1, dateIn2, dateOut2, dateIn3, dateOut3, members, membersRemove, admins, adminsRemove, workID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv 
	 * Func: Remove expert timesheet
	 */
    remove: {
        params: {
            expertTimesheetID : { type: "string"},
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                
                let { expertTimesheetID } = ctx.params;
                let resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.remove({ expertTimesheetID });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
    
    /**
	 * Dev: Depv 
	 * Func: Danh sách expert timesheet
	 */
    getInfoAndGetList: {
        params: {
            expertSalaryID    : { type: "string", optional: true },
            companyID         : { type: "string", optional: true },
            projectID         : { type: "string", optional: true },
            parentID          : { type: "string", optional: true },
            
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
                let { expertSalaryID, companyID, parentID, projectID, keyword, limit, lastestID, select, populates } = ctx.params;

				const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }
                
                let resultAfterCallHandler;
                if(expertSalaryID){
                    resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.getInfo({
                        expertSalaryID, userID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.getList({
                        parentID, companyID, projectID, userID, keyword, limit: +limit, lastestID, select, populates
                    });

                    // console.log(resultAfterCallHandler)
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Dev: HiepNH
     * Func: Gom nhóm theo tính chất
     * Date: 6/8/2023
     */
    getListByProperty: {
        auth: "required",
        params: {
            option              : { type: "string", optional: true  },
            year              : { type: "string", optional: true  },
            companyID           : { type: "string", optional: true  },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { option, year, companyID } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.getListByProperty({
                        option, year, companyID, userID
                    });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}