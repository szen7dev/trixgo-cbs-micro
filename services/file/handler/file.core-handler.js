const uuidv4                            = require('uuid').v4;
const { getExtension }                  = require('../../../tools/utils/utils');
const { GENERATE_LINK_S3, GET_PATH_S3 } = require('../helper/s3');
const FILE__CORE_MODEL                  = require('../model/file.core-model').MODEL;

module.exports = {
    insert: {
        params: {
            app            : { type: "string" },
            name           : { type: "string" },
            path           : { type: "string" },
            size           : { type: "number", optional: true },
            userID         : { type: "string" }, //TODO: fake wating AUTH_SERVICE
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				// const { _id: userID } = ctx.meta.infoUser;
                let { app, name, path, size, userID } = ctx.params;

                let infoFileAfterInsert = await FILE__CORE_MODEL.insert({ app, name, path, size, userID });
                return infoFileAfterInsert;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    update: {
        params: {
            fileID: { type: "string" },
            status: { type: "string", optional: true },
            description: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                let { fileID, status, description } = ctx.params;

                let infoFileAfterUpdate = await FILE__CORE_MODEL.update({ fileID, status, description, userID });
                return infoFileAfterUpdate;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    getInfoFile: {
        params: {
            userID: { type: "string" }, //TODO: fake wating AUTH_SERVICE
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { fileID, userID } = ctx.params;

                let infoFile = await FILE__CORE_MODEL.getInfoFile({ fileID, userID });
                return infoFile;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    getInfoOfListFile: {
        params: {
            fileIDs: { type: "array", items: "string" }, //TODO: fake wating AUTH_SERVICE
           
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { fileIDs } = ctx.params;

                let listFiles = await FILE__CORE_MODEL.getInfoOfListFileID({ fileIDs });
                return listFiles;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    getListFileWithStatus: {
        params: {
            status: { type: "string", optional: true },
            userID: { type: "string" }, //TODO: fake wating AUTH_SERVICE
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { status, userID } = ctx.params;

                let listFiles = await FILE__CORE_MODEL.getListFileWithStatus({ status, userID });
                return listFiles;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    generateLinkS3: {
        params: {
            mimeType        : { type: "string" },
            name            : { type: "string" },
            type            : { type: "string" },
            size            : { type: "number" },
            //____Ứng dụng
            appID           : { type: "string", optional: true },
            companyID       : { type: "string", optional: true },
            projectID       : { type: "string", optional: true },
            groupID         : { type: "string", optional: true },
            packageID        : { type: "string", optional: true },
            conversationID  : { type: "string", optional: true },
            //____(typeUpload == user)
            typeUpload      : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { 
                    mimeType, type, appID, name, size, typeUpload, 
                    companyID, projectID, groupID, packageID, conversationID
                } = ctx.params;
                let { _id: userID } = ctx.meta.infoUser;

                let generatePathS3  = GET_PATH_S3({
                    appID,
                    companyID,
                    projectID,
                    groupID,
                    packageID,
                    conversationID,
                    fileName: name,
                    type: typeUpload
                });
                if(generatePathS3.error) return generatePathS3;

                let { newFileName, pathS3 } = generatePathS3.data;
                let infoGenerateLink = await GENERATE_LINK_S3(newFileName, mimeType, typeUpload, pathS3);

                /**
                 * Nếu có app thì đang insert file trong app
                 * Nếu không có app thì đang insert trong user(image, signature)
                 */
                let infoFileAfterInsert = null;
                if(appID && !infoGenerateLink.error){
                    infoFileAfterInsert = await FILE__CORE_MODEL.insert({
                        app: appID,
                        nameOrg: name,
                        name: newFileName,
                        path: `/${process.env.AWS_BUCKET_PATH}${pathS3}/${newFileName}`,
                        mimeType,
                        type,
                        size,
                        userID
                    });
                }

                return {
                    error: false,
                    status: 200,
                    data: {
                        infoGenerateLink,
                        infoFileAfterInsert: infoFileAfterInsert?.data,
                    }
                };
            } catch (error) {
                return { error: true, message: error.message, status: 500 };
            }
        }
    },
}
