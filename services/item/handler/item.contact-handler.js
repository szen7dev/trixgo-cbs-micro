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
     * Dev: Depv
     * Func: Thêm contact
     */
    insert: {
        auth: "required",
        params: {
            parent           : { type: "string", optional: true },
            type             : { type: "string", optional: true },
            name             : { type: "string" },
            description      : { type: "string", optional: true },
            note             : { type: "string", optional: true },
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
            nonResident      : { type: "string", optional: true },
            fundaID          : { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {
                    parent, type, name, description, note, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property,
                    linkSale, workingStatus, realStatus, insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate,
                    sallaryFactor, sallarySubFactor, sallaryBasic, signerIn, signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire, nonResident, fundaID 
                } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await ITEM__CONTACT_MODEL.insert({
                    authorID: userID, parent, type, name, description, note, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, linkSale, workingStatus, realStatus,
                    insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, sallaryFactor, sallarySubFactor, sallaryBasic, signerIn,
                    signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire, nonResident, fundaID  
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Dev: Depv
     * Func: Cập nhật contact
     */
    update: {
        auth: "required",
        params: {
            contactID        : { type: "string" },
            parent           : { type: "string", optional: true },
            type             : { type: "string", optional: true },
            name             : { type: "string", optional: true },
            description      : { type: "string", optional: true },
            note             : { type: "string", optional: true },
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
            // nonResident              : { type: "string", optional: true },
            fundaID                  : { type: "string", optional: true },
            purchasedValue              : { type: "string", optional: true },
            totalLoyaltyPoints          : { type: "string", optional: true },
            usedLoyaltyPoints           : { type: "string", optional: true },
            remainLoyaltyPoints         : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {
                    contactID, parent, type, name, description, note, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property,
                    linkSale, workingStatus, realStatus, insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate,
                    sallaryFactor, sallarySubFactor, sallaryBasic, signerIn, signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire, image,
                    amountWorkHistory, amountProjectHistory, amountContractHistory, amountEducationHistory, amountCertificateHistory, documents, documentsRemove, nonResident, purchasedValue, totalLoyaltyPoints, usedLoyaltyPoints, remainLoyaltyPoints, fundaID 
                } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await ITEM__CONTACT_MODEL.update({
                    contactID, company: company._id, authorID: userID, parent, type, name, description, note, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, linkSale, workingStatus, realStatus,
                    insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, sallaryFactor, sallarySubFactor, sallaryBasic, signerIn,
                    signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire, image,
                    amountWorkHistory: +amountWorkHistory, amountProjectHistory: +amountProjectHistory, documents, documentsRemove,
                    amountContractHistory: +amountContractHistory , amountEducationHistory: +amountEducationHistory, amountCertificateHistory: +amountCertificateHistory, nonResident, fundaID, purchasedValue, totalLoyaltyPoints, usedLoyaltyPoints, remainLoyaltyPoints, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Danh sách contact
	 */
    getInfoAndGetList: {
        // auth: "required",
        params: {
            // Field bổ sung
            contactID           : { type: "string", optional: true },
            type                : { type: "string", optional: true },
            fundaID             : { type: "string", optional: true },
            departmentID        : { type: "string", optional: true },
            positionID          : { type: "string", optional: true },
            contractTypeID      : { type: "string", optional: true },
            workingStatusID     : { type: "string", optional: true },
            gender              : { type: "string", optional: true },
            realStatus          : { type: "string", optional: true },
            familyPolicy        : { type: "string", optional: true },
            insuranceStatus     : { type: "string", optional: true },
            companyID           : { type: "string", optional: true },
            isBirthday          : { type: "string", optional: true },
            isLinkUser          : { type: "string", optional: true },
            isListParentOrListChilds: { type: "string", optional: true },
            isMember            : { type: "string", optional: true },
            parentID            : { type: "string", optional: true },
            educationalBackground2: { type: "string", optional: true },
            field2              : { type: "string", optional: true },
            typeCertificate     : { type: "string", optional: true },
            certificateName     : { type: "string", optional: true },
            certificateGrade    : { type: "string", optional: true },
            isPartner           : { type: "string", optional: true },
            isContractExpire4month: { type: "string", optional: true },
            fromDate            : { type: "string", optional: true },
            toDate              : { type: "string", optional: true },
            
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
                    companyID, fundaID, contactID, type, departmentID, positionID, contractTypeID,
                    workingStatusID, gender, insuranceStatus, isBirthday, isLinkUser, isListParentOrListChilds,
                    isMember, parentID, realStatus, familyPolicy, educationalBackground2, field2, typeCertificate,
                    certificateName, certificateGrade, isPartner, isContractExpire4month,
                    keyword, limit, lastestID, select, populates, fromDate, toDate
                } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                // console.log({companyID, fundaID, contactID, type, departmentID, positionID, contractTypeID,
                //     workingStatusID, gender, insuranceStatus, isBirthday, isLinkUser, isListParentOrListChilds,
                //     isMember, parentID, realStatus, familyPolicy, educationalBackground2, field2, typeCertificate,
                //     certificateName, certificateGrade, isPartner, isContractExpire4month,
                //     keyword, limit, lastestID, select, populates, fromDate, toDate})

                if(!companyID){
                    companyID = company._id
                }
                
                let resultAfterCallHandler;
                if(contactID){
                    resultAfterCallHandler = await ITEM__CONTACT_MODEL.getInfo({
                        contactID, select, populates
                    });
                }else{
                    // resultAfterCallHandler = await ITEM__CONTACT_MODEL.getList({
                    //     companyID, fundaID, type, departmentID, positionID, contractTypeID,
                    //     workingStatusID, gender, insuranceStatus, isBirthday, isLinkUser, isListParentOrListChilds, isMember,
                    //     parentID, realStatus, familyPolicy, educationalBackground2, field2, typeCertificate, certificateName, certificateGrade, isPartner, isContractExpire4month,
                    //     lastestID, userID, keyword, limit, select, populates, fromDate, toDate
                    // });

                    resultAfterCallHandler = await ITEM__CONTACT_MODEL.getListV2({
                        companyID, fundaID, type, fromDate, toDate, keyword, limit, lastestID, select, populates, userID
                    })
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Danh sách theo phân loại
     * Author: HiepNH
     * Code: 24/12/2022
     */
    getListByProperty: {
        auth: "required",
        params: {
            fundasID        : { type: "array", optional: true },
            option          : { type: "string", optional: true },
            optionGroup     : { type: "string", optional: true },
            optionTime      : { type: "string", optional: true },
            year            : { type: "string", optional: true },
            fromDate        : { type: "string", optional: true },
            toDate          : { type: "string", optional: true },
            
            //_____________THÔNG SỐ MẶC ĐỊNH________________
            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                let { option, optionGroup, optionTime, fundasID, year, fromDate, toDate,
                     keyword, limit, lastestID, select, populates, sortKey } = ctx.params;

                let resultAfterCallHandler = await ITEM__CONTACT_MODEL.getListByProperty({
                    companyID: company._id,
                    option, optionGroup, optionTime, fundasID, year, fromDate, toDate,
                     keyword, limit, lastestID, select, populates, sortKey, 
                     userID
                    });
             
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Danh sách danh bạ của hệ thống
	 */
    getListOfSystem: {
        auth: "required",
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

    /**
     * Name  : Danh bạ (bên mua, bên bán) mà user được quyền truy cập theo hợp đồng
     * Author: HiepNH
     * Code  : 7/9/2022
     */
    getListAccessByContract: {
        auth: 'required',
        params: {
            option              : { type: 'string', optional: true },

            keyword             : { type: "string", optional: true },
            limit               : { type: "string", optional: true },
            lastestID           : { type: "string", optional: true },
            select              : { type: "string", optional: true },
            populates           : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                const {
                    option, 
                    keyword, limit, lastestID, select, populates
                } = ctx.params;

                const resultAfterCallHandler = await ITEM__CONTACT_MODEL.getListAccessByContract({
                    option, 
                    keyword, limit, lastestID, select, populates, 
                    userID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 8/12/2022
     */
    downloadTemplateImportExcel: {
        auth: 'required',
        params: {
            // projectID: { type: 'string' }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                // const { projectID } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                // console.log('====================HERE===================')
                // console.log('====================HERE===================')
                // console.log('====================HERE===================')
                const resultAfterCallHandler = await ITEM__CONTACT_MODEL.downloadTemplateImportExcel({
                    companyID: company._id, userID 
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 9/12/2022
     */
    importFromExcel: {
        auth: 'required',
        params: {
            // taskID    : { type: 'string', optional: true },
            dataImport: { type: 'string' }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { dataImport } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;
                // console.log(dataImport)

                console.log('====================HERE===================')
                console.log('====================HERE===================')
                console.log('====================HERE===================')

                // console.log(dataImport)

                const resultAfterCallHandler = await ITEM__CONTACT_MODEL.importFromExcel({
                    companyID: company._id, dataImport, userID, ctx
                })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: MinhVH
     * Func: Download Excel Contact
     * Date: 21/06/2022
     */
    exportExcel: {
        auth: 'required',
        params: {
            companyID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                let { companyID, filterParams } = ctx.params;

                if(!companyID) {
                    companyID = company._id;
                }

                const resultAfterCallHandler = await ITEM__CONTACT_MODEL.exportExcel({
                    userID, companyID, filterParams, ctx
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}