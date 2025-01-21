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
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
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
                let { parentID, date, type, note, projectID, humanID, salary, onLeaveSalary, overtimeSalary, reward, punishment, advance, convertFactor, paid, name } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;
                // console.log(company)

                // console.log(ctx.params)

                let resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.insert({
                    userCreate: userID,
                    companyID: company._id,
                    parentID, date, type, note, projectID, humanID, salary, onLeaveSalary, overtimeSalary, reward, punishment, advance, convertFactor, paid, name
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx })
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Update
     * Author: HiepNH
     * Code: 22/11/2023
     */
    update: {
        params: {
            expertSalaryID      : { type: "string" },
            members             : { type: "array", optional: true },
            admins              : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { expertSalaryID, admins, members, status, projectID, humanID, name, date, type, note, salary, onLeaveSalary, overtimeSalary, reward, punishment, advance, convertFactor, paid, revenueBonus, mealAllowance, insurance, pitax, union, share, other, kpiFactor, subAllowance1, subAllowance2, subAllowance3, subAllowance4, subAllowance5, subAllowance6, subAllowance7, subAllowance8, subAllowance9, subAllowance10, subAllowance11, subAllowance12, subAllowance13, subAllowance14, subAllowance15, subAllowance16, subAllowance17, subAllowance18, subAllowance19, subAllowance20, subAllowance21, subAllowance22, filesID } = ctx.params;

                // console.log(ctx.params)

				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.update({
                    companyID: company._id, 
                    expertSalaryID, admins, members, userID, status, projectID, humanID, name, date, type, note, 
                    salary: Number(salary).toFixed(0), 
                    onLeaveSalary: Number(onLeaveSalary).toFixed(0), 
                    overtimeSalary: Number(overtimeSalary).toFixed(0), 
                    reward: Number(reward).toFixed(0), 
                    punishment: Number(punishment).toFixed(0), 
                    advance: Number(advance).toFixed(0), 
                    convertFactor: convertFactor, 
                    paid: Number(paid).toFixed(0), 
                    revenueBonus: Number(revenueBonus).toFixed(0), 
                    mealAllowance: Number(mealAllowance).toFixed(0), 
                    insurance: Number(insurance).toFixed(0), 
                    pitax: Number(pitax).toFixed(0), 
                    union: Number(union).toFixed(0), 
                    share: Number(share).toFixed(0), 
                    other: Number(other).toFixed(0), 
                    kpiFactor, 
                    subAllowance1: Number(subAllowance1).toFixed(0), 
                    subAllowance2: Number(subAllowance2).toFixed(0), 
                    subAllowance3: Number(subAllowance3).toFixed(0), 
                    subAllowance4: Number(subAllowance4).toFixed(0), 
                    subAllowance5: Number(subAllowance5).toFixed(0), 
                    subAllowance6: Number(subAllowance6).toFixed(0), 
                    subAllowance7: Number(subAllowance7).toFixed(0), 
                    subAllowance8: Number(subAllowance8).toFixed(0), 
                    subAllowance9: Number(subAllowance9).toFixed(0), 
                    subAllowance10: Number(subAllowance10).toFixed(0), 
                    subAllowance11: Number(subAllowance11).toFixed(0), 
                    subAllowance12: Number(subAllowance12).toFixed(0), 
                    subAllowance13: Number(subAllowance13).toFixed(0), 
                    subAllowance14: Number(subAllowance14).toFixed(0), 
                    subAllowance15: Number(subAllowance15).toFixed(0), 
                    subAllowance16: Number(subAllowance16).toFixed(0), 
                    subAllowance17: Number(subAllowance17).toFixed(0), 
                    subAllowance18: Number(subAllowance18).toFixed(0), 
                    subAllowance19: Number(subAllowance19).toFixed(0), 
                    subAllowance20: Number(subAllowance20).toFixed(0), 
                    subAllowance21: Number(subAllowance21).toFixed(0), 
                    subAllowance22: Number(subAllowance22).toFixed(0),
                    filesID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Remove
     * Author: HiepNH
     * Code: 22/3/2024
     */
    remove: {
        auth: "required",
        params: {
            arraysRemove : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  arraysRemove } = ctx.params;
        				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.remove({
                    arraysRemove, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: syncData
     * Author: HiepNH
     * Code: 22/3/2024
     */
    syncData: {
        params: {
            salaryID : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { option, salaryID, orderID, fundaID, arrUser, year, month } = ctx.params;
                console.log(ctx.params)

				const { _id: userID, company, email } = ctx.meta.infoUser;

                let resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.syncData({
                    userID, companyID: company._id, email, option, salaryID, orderID, fundaID, arrUser, year, month
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Get list
     * Author: HiepNH
     * Code: 22/11/2023
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
                let { expertSalaryID, subtype, salary, onLeaveSalary, overtimeSalary, mealAllowance, punishment, companyID, parentID, projectID, keyword, limit, lastestID, select, populates, sortOption, positionsID, departmentsID, option, month, year } = ctx.params;

				const { _id: userID, company } = ctx.meta.infoUser;
                console.log({ EXPERT_SALARY_PARAMS: ctx.params })

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
                        subtype, salary, onLeaveSalary, overtimeSalary, mealAllowance, punishment, parentID, companyID, projectID, userID, keyword, limit, lastestID, select, populates, sortOption, positionsID, departmentsID, option, month, year
                    })
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Get
     * Author: HiepNH
     * Code: 22/11/2023
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
                        option, year, companyID, projectID, userID, assigneeID, month, ctx
                    });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Download Template Excel
     * Author: HiepNH
     * Code: 25/11/2024
     */
    exportExcel: {
        auth: 'required',
        params: {
            // companyID: { type: "string", optional: true },
            // option: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, email, company } = ctx.meta.infoUser;

                let { option, year, month } = ctx.params;
                console.log(ctx.params)

                const resultAfterCallHandler = await TIMESHEET__EXPERT_SALARY_MODEL.exportExcel({
                    companyID: company._id, option, year, month, email, userID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}
