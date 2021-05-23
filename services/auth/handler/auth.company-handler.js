let AUTH__COMPANY_MODEL              = require('../model/auth.company-model').MODEL;

module.exports = {
    insertFast: {
        params: {
            name: { type: "string" }
        },
        async handler(ctx) {
            try {
                let { name }        = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)

				await this.validateEntity(name);

                let resultAfterCallHandler = await AUTH__COMPANY_MODEL.insertFast({ name });

                return resultAfterCallHandler;
            } catch (error) {
                return error;
            }
        }
    }
}