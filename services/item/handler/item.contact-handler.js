/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__CONTACT_MODEL                       = require('../model/item.contact-model').MODEL;

module.exports = {

     /**
	 * Dev: Depv ✅
	 * Func: Thêm contact
	 */
    insert: {
        params: {
            parent           : { type: "string", optional: true },
            type             : { type: "string", optional: true },
            name             : { type: "string", optional: true },
            description      : { type: "string", optional: true },
            sign             : { type: "string", optional: true },
            address          : { type: "string", optional: true },
            area             : { type: "string", optional: true },
            taxid            : { type: "string", optional: true },
            birthday         : { type: "string", optional: true },
            province         : { type: "string", optional: true },
            gender           : { type: "string", optional: true },
            phone            : { type: "string", optional: true },
            email            : { type: "string", optional: true },
            department       : { type: "string", optional: true },
            position         : { type: "string", optional: true },
            linkUser         : { type: "string", optional: true },
            status           : { type: "string", optional: true },
            field            : { type: "string", optional: true },
            property         : { type: "string", optional: true },
            linkSale         : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  parent, type, name, description, sign, address, area, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, linkSale } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await ITEM__CONTACT_MODEL.insert({
                    company: company._id, authorID: userID, parent, type, name, description, sign, address, area, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, linkSale
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
    
    /**
	 * Dev: Depv ✅
	 * Func: Danh sách contact
	 */
    getInfoAndGetList: {
        params: {
            // Field bổ sung
            contactID           : { type: "string", optional: true },
            type                : { type: "string", optional: true },

            // Field mặc định
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            filter          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { contactID, type, keyword, limit, lastestID, select, filter, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(contactID){
                    resultAfterCallHandler = await ITEM__CONTACT_MODEL.getInfo({
                        contactID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__CONTACT_MODEL.getList({
                        companyID: company._id, type, lastestID, userID, keyword, limit, select, filter, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}