const uuidv4                            = require('uuid').v4;
const { getExtension }                  = require('../../../tools/utils/utils');
let { GENERATE_LINK_S3 }                = require('../helper/s3');
let FILE__CORE_MODEL                    = require('../model/file.core-model').MODEL;

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
            mimeType : { type: "string" },
            name     : { type: "string" },
            type     : { type: "string", optional: true },
            app      : { type: "string", optional: true },
            size     : { type: "number", optional: true },
            //____Ứng dụng
            taskID   :  { type: "string", optional: true },
            //____(typeUpload == user)
            typeUpload : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                let { _id: userID } = ctx.meta.infoUser;

                await this.validateEntity(ctx.params);
                let { mimeType, type, app, name, size, typeUpload, taskID } = ctx.params;
                let extension = getExtension(name);
                let fileName  = `${uuidv4()}.${extension}`;
                let nameOrg   = name;
                let pathS3    = null;
                if(taskID){
                    // pathS3 = `${appID}/${company}/${project}/${group}/${taskID}`;
                }

                let infoGenerateLink = await GENERATE_LINK_S3(fileName, mimeType, typeUpload, pathS3);

                /**
                 * Nếu có app thì đang insert file trong app
                 * Nếu không có app thì đang insert trong user(image, signature)
                 */
                let infoFileAfterInsert = null;
                if(app && !infoGenerateLink.error){
                    infoFileAfterInsert = await FILE__CORE_MODEL.insert({
                        app,
                        nameOrg,
                        name: fileName,
                        path: `${process.env.AWS_BUCKET_PATH}/${fileName}`,
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
