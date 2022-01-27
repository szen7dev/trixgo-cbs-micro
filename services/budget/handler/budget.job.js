/**
 * TOOLS
 */
// const { renderStatusCodeAndResponse } 			= require('../../../tools/utils/status_code')

/**
 * MODEL
 */
const BUDGET__BUDGET_JOB_COLL                         	= require('../database/budget.job-coll');

module.exports = {
    /**
     *  Code: F0011
     *  Author: Depv
     */
    findByIdAndUpdate: {
        params: {
            // email           : { type: "string" },
            // fullname        : { type: "string" },
            // username        : { type: "string" },
            // level           : { type: "string" },
            // companyID       : { type: "string" },
            // platform        : { type: "string" },
        },
        async handler(ctx) {
            try {
          
                return true;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}
