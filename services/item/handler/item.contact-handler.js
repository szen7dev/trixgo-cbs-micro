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
            image            : { type: "string", optional: true },

            amountWorkHistory        : { type: "string", optional: true },
            amountProjectHistory     : { type: "string", optional: true },
            amountContractHistory    : { type: "string", optional: true },
            amountEducationHistory   : { type: "string", optional: true },
            amountCertificateHistory : { type: "string", optional: true },
            documents                : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { 
                    contactID, parent, type, name, description, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, 
                    linkSale, workingStatus, realStatus, insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, 
                    sallaryFactor, sallarySubFactor, sallaryBasic, signerIn, signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire, image,
                    amountWorkHistory, amountProjectHistory, amountContractHistory, amountEducationHistory, amountCertificateHistory, documents, documentsRemove
                } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;
                
                let resultAfterCallHandler = await ITEM__CONTACT_MODEL.update({
                    contactID, company: company._id, authorID: userID, parent, type, name, description, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, linkSale, workingStatus, realStatus, 
                    insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, sallaryFactor, sallarySubFactor, sallaryBasic, signerIn,
                    signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire, image,   
                    amountWorkHistory: +amountWorkHistory, amountProjectHistory: +amountProjectHistory, documents, documentsRemove,
                    amountContractHistory: +amountContractHistory , amountEducationHistory: +amountEducationHistory, amountCertificateHistory: +amountCertificateHistory, ctx
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
            companyID           : { type: "string", optional: true },
            isBirthday          : { type: "string", optional: true },
            isLinkUser          : { type: "string", optional: true },
            isListParentOrListChilds: { type: "string", optional: true },
            parentID            : { type: "string", optional: true },
            
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
                let { companyID, contactID, type, departmentID, positionID, contractTypeID, 
                    workingStatusID, gender, insuranceStatus, isBirthday, isLinkUser, isListParentOrListChilds, parentID,
                    keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler;
                if(contactID){
                    resultAfterCallHandler = await ITEM__CONTACT_MODEL.getInfo({
                        contactID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__CONTACT_MODEL.getList({
                        companyID, type, departmentID, positionID, contractTypeID, 
                        workingStatusID, gender, insuranceStatus, isBirthday, isLinkUser, isListParentOrListChilds, parentID,
                        lastestID, userID, keyword, limit, select, populates
                    });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Danh sách danh bạ của hệ thống
	 */
    getListOfSystem: {
        params: {
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
                let { 
                    keyword, limit, lastestID, select, populates } = ctx.params;
                let resultAfterCallHandler = await ITEM__CONTACT_MODEL.getListOfSystem({ keyword, limit, lastestID, select, populates });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}