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
            workingStatus    : { type: "string", optional: true },
            realStatus       : { type: "string", optional: true },
            insuranceStatus  : { type: "string", optional: true },
            familyPolicy     : { type: "string", optional: true },
            contractType     : { type: "string", optional: true },
            contractSign     : { type: "string", optional: true },
            family           : { type: "string", optional: true },
            identity         : { type: "string", optional: true },
            dateProvice      : { type: "string", optional: true },
            place            : { type: "string", optional: true },
            area             : { type: "string", optional: true },
            area1            : { type: "string", optional: true },
            area2            : { type: "string", optional: true },
            insuranceSign    : { type: "string", optional: true },
            insuranceDate    : { type: "string", optional: true },
            sallaryFactor    : { type: "string", optional: true },
            sallarySubFactor : { type: "string", optional: true },
            sallaryBasic     : { type: "string", optional: true },
            signerIn         : { type: "string", optional: true },
            signerOut        : { type: "string", optional: true },
            workStartDate    : { type: "string", optional: true },
            dayOff           : { type: "string", optional: true },
            appointDate      : { type: "string", optional: true },
            changeSallaryDate: { type: "string", optional: true },
            contractDate     : { type: "string", optional: true },
            contractValid    : { type: "string", optional: true },
            contractExpire   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  
                    parent, type, name, description, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, 
                    linkSale, workingStatus, realStatus, insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, 
                    sallaryFactor, sallarySubFactor, sallaryBasic, signerIn, signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire
                } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await ITEM__CONTACT_MODEL.insert({
                    company: company._id, authorID: userID, parent, type, name, description, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, linkSale, workingStatus, realStatus, 
                    insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, sallaryFactor, sallarySubFactor, sallaryBasic, signerIn,
                    signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
    /**
     * Dev: Depv ✅
     * Func: Cập nhật contact
     */
    update: {
        params: {
            contactID        : { type: "string" },
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
            workingStatus    : { type: "string", optional: true },
            realStatus       : { type: "string", optional: true },
            insuranceStatus  : { type: "string", optional: true },
            familyPolicy     : { type: "string", optional: true },
            contractType     : { type: "string", optional: true },
            contractSign     : { type: "string", optional: true },
            family           : { type: "string", optional: true },
            identity         : { type: "string", optional: true },
            dateProvice      : { type: "string", optional: true },
            place            : { type: "string", optional: true },
            area             : { type: "string", optional: true },
            area1            : { type: "string", optional: true },
            area2            : { type: "string", optional: true },
            insuranceSign    : { type: "string", optional: true },
            insuranceDate    : { type: "string", optional: true },
            sallaryFactor    : { type: "string", optional: true },
            sallarySubFactor : { type: "string", optional: true },
            sallaryBasic     : { type: "string", optional: true },
            signerIn         : { type: "string", optional: true },
            signerOut        : { type: "string", optional: true },
            workStartDate    : { type: "string", optional: true },
            dayOff           : { type: "string", optional: true },
            appointDate      : { type: "string", optional: true },
            changeSallaryDate: { type: "string", optional: true },
            contractDate     : { type: "string", optional: true },
            contractValid    : { type: "string", optional: true },
            contractExpire   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { 
                    contactID, parent, type, name, description, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, 
                    linkSale, workingStatus, realStatus, insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, 
                    sallaryFactor, sallarySubFactor, sallaryBasic, signerIn, signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire
                } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;
                
                let resultAfterCallHandler = await ITEM__CONTACT_MODEL.update({
                    contactID, company: company._id, authorID: userID, parent, type, name, description, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, linkSale, workingStatus, realStatus, 
                    insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, sallaryFactor, sallarySubFactor, sallaryBasic, signerIn,
                    signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire
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
            departmentID        : { type: "string", optional: true },
            positionID          : { type: "string", optional: true },
            contractTypeID      : { type: "string", optional: true },
            workingStatusID     : { type: "string", optional: true },
            gender              : { type: "string", optional: true },
            insuranceStatus     : { type: "string", optional: true },

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
                let { contactID, type, departmentID, positionID, contractTypeID, workingStatusID, gender, insuranceStatus, keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(contactID){
                    resultAfterCallHandler = await ITEM__CONTACT_MODEL.getInfo({
                        contactID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__CONTACT_MODEL.getList({
                        companyID: company._id, type, departmentID, positionID, contractTypeID, workingStatusID, gender, insuranceStatus, lastestID, userID, keyword, limit, select, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}