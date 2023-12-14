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
                let { parentID, date, type, note, projectID, humanID, salary, reward, punishment, advance, remaining, paid, name } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;
                // console.log(company)

                let resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.insert({
                    userCreate: userID, 
                    companyID: company._id, 
                    parentID, date, type, note, projectID, humanID, salary, reward, punishment, advance, remaining, paid, name
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx })
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
            expertSalaryID      : { type: "string" },
            members             : { type: "array", optional: true },
            admins              : { type: "array", optional: true },
            status              : { type: "string", optional: true },
            name                : { type: "string", optional: true},
            parentID            : { type: "string", optional: true },
            date                : { type: "string", optional: true },
            type                : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            projectID           : { type: "string", optional: true },
            humanID             : { type: "string", optional: true },
            // salary              : { type: "string", optional: true },
            // reward              : { type: "string", optional: true },
            // punishment          : { type: "string", optional: true },
            // advance             : { type: "string", optional: true },
            // remaining           : { type: "string", optional: true },
            // paid                : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { expertSalaryID, admins, members, status, projectID, humanID, name, date, type, note, salary, reward, punishment, advance, remaining, paid, revenueBonus, mealAllowance, insurance, pitax } = ctx.params;
                // console.log({ expertSalaryID, admins, members, status, projectID, humanID, name, date, type, note, salary, reward, punishment, advance, remaining, paid, revenueBonus, mealAllowance, insurance, pitax })

				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.update({
                    expertSalaryID, admins, members, userID, status, projectID, humanID, name, date, type, note, salary, reward, punishment, advance, remaining, paid, revenueBonus, mealAllowance, insurance, pitax, companyID: company._id
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
            expertSalaryID : { type: "string"},
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);

                let { expertSalaryID } = ctx.params;
                let resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.remove({ expertSalaryID });

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
            sortOption        : { type: "string", optional: true },
            expertSalaryID    : { type: "string", optional: true },
            companyID         : { type: "string", optional: true },
            projectID         : { type: "string", optional: true },
            parentID          : { type: "string", optional: true },
            departmentsID     : { type: "array", optional: true },

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
                let { expertSalaryID, companyID, parentID, projectID, keyword, limit, lastestID, select, populates, sortOption, departmentsID } = ctx.params;

				const { _id: userID, company } = ctx.meta.infoUser;
                // console.log({ EXPERT_SALARY_PARAMS: ctx.params })

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler;
                if(expertSalaryID){
                    resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.getInfo({
                        expertSalaryID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.getList({
                        parentID, companyID, projectID, userID, keyword, limit, lastestID, select, populates, sortOption, departmentsID
                    })
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
            companyID           : { type: "string", optional: true  },
            projectID           : { type: "string", optional: true  },
            year                : { type: "string", optional: true  },
            month               : { type: "string", optional: true  },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { option, year, companyID, projectID, assigneeID, month } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.getListByProperty({
                        option, year, companyID, projectID, userID, assigneeID, month
                    });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}
