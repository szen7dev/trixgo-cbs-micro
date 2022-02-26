let { config }              = require('../file.keys-constant');
let { checkObjectIDs }      = require('../../../../tools/utils/utils');
let { APP_KEYS }            = require('../../../../tools/keys');
let AWS                     = require('aws-sdk');

AWS.config.update({
    accessKeyId : config.aws_access_key_id,
    secretAccessKey : config.aws_secret_access_key,
    region: config.aws_region,
})
let s3Object = new AWS.S3();

// link từ s3 upload file
let render_link_upload_file_s3 = ({ fileName, type, typeUpload, pathS3 }) =>{
    try {
        let bucket = `${config.bucket}/${process.env.AWS_BUCKET_PATH}${pathS3}`;

        if(typeUpload == "user"){
            bucket = `${config.bucket}/files/db/users`;
        }

        let signedUrl = s3Object.getSignedUrl('putObject', {
            Bucket: bucket,
            Key: fileName,
            Expires: config.signedUrlExpireSeconds,
            ACL: "public-read",
            ContentType: type,
        });

        return signedUrl;
    } catch (error) {
        return { error: true, message: "Can't presign url" }
    }
}

function render_link_upload_s3(fileName, type, typeUpload, pathS3) {
    return new Promise(async resolve => {
        try {
            if(!fileName || !type)
                return resolve({ error: true, message: "params_invalid" });

            let result = await render_link_upload_file_s3({ fileName, type, typeUpload, pathS3 });
            if(result.error) {
                return resolve({ error: true, message: result.message });
            }

            return resolve({ error: false, data: result, fileName });
        } catch (error) {
            return resolve({ error: true, message: error.message });
        }
    })
}

const uploadFile = (pathFile, key) => {
    return new Promise( resolve => {
        try {
            // Read content from the file
            // const fileContent = fs.readFileSync(pathFile);

            const parseBase64ToBuffer = Buffer.from(pathFile.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            const bucket = `${config.bucket}/root`;

            // Setting up S3 upload parameters
            const params = {
                ContentEncoding: 'base64',
                ContentType: 'image/jpeg',
                ACL:'public-read',
                Bucket: bucket,
                Key: key,
                Body: parseBase64ToBuffer
            };

            // Uploading files to the bucket
            const result = s3Object.upload(params, function(err) {
                if (err) throw err;
            });

            return resolve({ error: false, data: result });
        } catch (error) {
            return resolve({ error: true, message: error.message });
        }
    })

};

/**
 * GET PATH S3 BY APP
 * @param {string} type 
 * @param {string} appID 
 * @param {string} companyID 
 * @param {string} projectID 
 * @param {string} groupID 
 * @returns { error: boolean, data: string }
 */
const getPathS3 = ({ type, appID, companyID, projectID, groupID, packageID }) => {
    if(type) {
        return { error: false, data: '' };
    }

    if(!appID || !checkObjectIDs([appID])) {
        return {
            error: true,
            message: 'Tham số AppID không hợp lệ', 
            keyError: 'params_appID_invalid', 
            status: 400
        };
    }

    let pathS3 = `/${appID}`;

    // Khai báo constants các app
    const COMPANIES = [
        APP_KEYS.MEDIA,
        APP_KEYS.PCM_PLAN_TASK,
        APP_KEYS.DOCUMENT,
    ];
    const PROJECTS = [APP_KEYS.PCM_PLAN_TASK, APP_KEYS.DOCUMENT];
    const GROUPS   = [APP_KEYS.PCM_PLAN_TASK];
    const PACKAGES = [APP_KEYS.DOCUMENT];

    const PACKAGES = [
        APP_KEYS.DOCUMENT
    ];

    // Validate tham số theo app
    if(COMPANIES.includes(appID) && (!companyID || !checkObjectIDs([companyID]))) 
        return { error: true, message: 'Tham số companyID không hợp lệ', keyError: 'params_companyID_invalid', status: 400 };

    if(PROJECTS.includes(appID) && (!projectID || !checkObjectIDs([projectID]))) 
        return { error: true, message: 'Tham số projectID không hợp lệ', keyError: 'params_projectID_invalid', status: 400 };

    if(GROUPS.includes(appID) && (!groupID || !checkObjectIDs([groupID])))
        return { error: true, message: 'Tham số groupID không hợp lệ', keyError: 'params_groupID_invalid', status: 400 }; 

    if(PACKAGES.includes(appID) && (!packageID || !checkObjectIDs([packageID])))
        return { error: true, message: 'Tham số packageID không hợp lệ', keyError: 'params_packageID_invalid', status: 400 };

    // Nối đường dẫn lưu s3
    switch (appID) {
        case APP_KEYS.MEDIA:
            pathS3 += `/${companyID}`;
            break;
        case APP_KEYS.PCM_PLAN_TASK:
            pathS3 += `/${companyID}/${projectID}/${groupID}`;
            break;
        case APP_KEYS.DOCUMENT:
            pathS3 += `/${companyID}/${projectID}/${packageID}`;
            break;
        default:
            break;
    }
    
    return { error: false, data: pathS3 };
}

exports.GENERATE_LINK_S3 = render_link_upload_s3;
exports.UPLOAD_FILE_S3   = uploadFile;
exports.GET_PATH_S3      = getPathS3;