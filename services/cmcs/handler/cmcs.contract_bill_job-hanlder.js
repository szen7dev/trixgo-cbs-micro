/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
 const CMCS__CONTRACT_BILL_JOB_MODEL             = require('../model/cmcs.contract_bill_job-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: Danh sách và lấy thông tin contract bill job
	 */
    getListAndGetInfoContractBillJob: {
        params: {
            keyword           : { type: "string", optional: true },
            limit             : { type: "string", optional: true },
            lastestID         : { type: "string", optional: true },
            contractID        : { type: "string", optional: true },
            contractBillJobID : { type: "string", optional: true },
            select            : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { keyword, limit, lastestID, contractID, select, contractBillJobID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(contractBillJobID){
                    resultAfterCallHandler = await CMCS__CONTRACT_BILL_JOB_MODEL.getInfo({
                        contractBillJobID, select
                    });
                }else{
                    resultAfterCallHandler = await CMCS__CONTRACT_BILL_JOB_MODEL.getList({
                        keyword, limit, lastestID, contractID, select
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}