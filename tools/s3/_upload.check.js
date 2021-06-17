let mkdirp                      = require('mkdirp');
let fs                          = require('fs');
let path                        = require('path');
let FS_EXTRA                    = require('fs-extra');

// let { COMPRESS_IMAGE }       = require('../../utils/file_utils');
let { MIME_TYPES_IMAGE }        = require('../../config/cf_constants');
// const FILE_COLL                 = require('../../database/core/file-coll');


// let APP_COMPANY_MODEL           = require('../../models/core/app_company').MODEL;
// let config                      = require('../../config/configS3');
let AWS                         = require('aws-sdk');
// var s3 = require('s3');
var s3 = require('@auth0/s3')


AWS.config.update({
    accessKeyId : config.aws_access_key_id,
    secretAccessKey : config.aws_secret_access_key,
    region: config.aws_region,
})
let s3Object                    = new AWS.S3();

var client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
        accessKeyId : config.aws_access_key_id,
        secretAccessKey : config.aws_secret_access_key,
        region: config.aws_region,
      // endpoint: 's3.yourdomain.com',
      // sslEnabled: false
      // any other options are passed to new AWS.S3()
      // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    },
});
/** 
 * ----- THOẢ ĐIỀU KIỆN: ---------
 * 1/ maxSize, VD:20GB (TỔNG KÍCH THƯỚC/LẦN UPLOAD)
 * 2/ maxStorage, VD: 100GB (TỔNG KÍCH THƯỚC CÔNG TY ĐƯỢC CẤP PHÉP) [BỎ]
 * 3/ fileTypes, VD: ['doc','zip','png'] (đã check tổng quát tại multer, sau đó check trong function thuộc 1 vài dạng cho phép từng FUNC)
 * 4/ pathFolder, VD: '/storage/appID/...' (THƯ MỤC LƯU TRỮ mới sau khi pull ảnh từ folder cũ (mặc định))
 * 5/ dataFile = [{name: 'baocao1.doc', size:'560'},{},{}] (req.files)
 * -----------------------------
 * req.files =  [
 *      {
 *          originalname, 
 *          fieldname,
 *          mimetype,
 *          size
 *      }
 * ]
 */
/**
 * 
 * @param {*} req REQUEST
 * @param {*} maxSize KÍCH THƯỚC TỐI ĐA TRONG 1 LẦN UPLOAD (GB)
 * @param {*} fileTypes VD: ['doc','zip','png']
 * @param {*} pathFolder ĐƯỜNG DẪN CHI TIẾT LƯU FILES
 */


// link từ s3 upload file
let  render_link_upload_file_s3 = ({ path, fileName, type }) =>{
    try {
        console.log({
            Bucket: `${config.bucket}/storage/${path}`,
            Key: fileName,
            Expires: config.signedUrlExpireSeconds,
            ACL: "public-read",
            ContentType: type,
        })

        let bucket;
        if(path.includes('files/db') || path.includes('files/templates/reports')){
            bucket = `${config.bucket}/${path}`;
        }else{
            bucket = `${config.bucket}/storage/${path}`;
        }
        
        var url = s3Object.getSignedUrl('putObject', {
            Bucket: bucket,
            Key: fileName,
            Expires: config.signedUrlExpireSeconds,
            ACL: "public-read",
            ContentType: type,
        });

        // console.log({ url_sign: url })
        return { error : false, url };
    } catch (error) {
        return  { error : true, message : 'cant_create_url' }
    }
}

// link từ s3 xem file
let  render_link_read_file_s3 = ({ path, fileName, type }) =>{
    try {
        console.log({
            Bucket: `pravitebk001`,
            Key: 'IMG_3196.CR2',
            Expires: config.signedUrlExpireSeconds,
            ACL: "public-read",
            ContentType: type,
        })
        
        var url =  s3Object.getSignedUrl('getObject', {
            // avarta.jpeg
            Bucket: `pravitebk001`,
            Key: 'avarta.jpeg',
            Expires: 10,
            // ACL: "public-read",
            // ContentType: type,
        })

        // console.log({ url_sign: url })
        return url
        return { error : false, url };
    } catch (error) {
        return  { error : true, message : 'cant_create_url' }
    }
}

function render_link_upload_s3( path, fileName, type) {
    return new Promise(async resolve => {
        try {
            if(!path || !fileName || !type)
                return resolve({ error: true, message: "params_invalid" });
            let result = await render_link_upload_file_s3({ path, fileName, type });
            if(!result.error){
                return resolve({ error: false, data: result });
            }else{
                return resolve({ error: true, message: "Error" });
            }
        } catch (error) {
            return resolve({ error: true, message: error.message });
        }
    })
}

//DOWLOAD 1 FILE TỪ S3
const download_one_file_s3 = ({ filePathS3, newFilePath  }) => {
    return new Promise( async(resolve, reject) => {
        try {
            var params = {
                localFile: `${newFilePath}`,// tên mới cũng như vị trí lưu file
                s3Params: {
                  Bucket: `${config.bucket}/storage`,// vị trí chưa file
                  Key: `${filePathS3}`,// tên file trên server
                  // other options supported by getObject
                  // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property
                },
              };
            
              var downloader = await client.downloadFile(params);
              downloader.on('error', function(err) {
                // console.error("-----unable to download:", err.stack);
                return resolve({error : true, message : 'cant_get_file'});
              });
              downloader.on('progress', function() {
                // console.log("-----progress", downloader.progressAmount, downloader.progressTotal);
              });
              downloader.on('end', function() {
                // console.log("-----download done");
                return resolve({error : false, message : 'dowload_sccusse' })
              });
          
        } catch (error) {
            console.log({error})
            return resolve({error : true, message : error });
        }
       
    });
  };

/**
 * Name: function kiem tra quyen tao link s3
 * author: Depv(14/10/2020)
 * Update: 
 * @param {*} req REQUEST
 * @param {*} maxSize KÍCH THƯỚC TỐI ĐA TRONG 1 LẦN UPLOAD (GB)
 * @param {*} sizeCurrent KÍCH THƯỚC FILE HIEN TAI
 * @param {*} fileTypes VD: ['doc','zip','png']
 * @param {*} pathName VD: serverS3/storage/appID/...
 * @param {*} fileName VD: abc.jpg
 */
function checkPermissionGenerateLink( req, maxSize, sizeCurrent, fileTypes, pathName, fileName ) {
    return new Promise(async resolve => {
        try {
            let appID  = req.APP_ID || req.params.APP_ID || req.query.APP_ID || req.body.APP_ID;
            let { _id: userID, company: companyID } = req.user;

            /**
             * kiểm tra TỔNG SIZE FILE, đối chiếu với maxSize
             */
            let maxSizeConvertedByte = Number(maxSize) * 1024 * 1024 * 1024; // (bytes)

            if (Number(sizeCurrent) > maxSizeConvertedByte){
                return resolve({ error: true, message: 'total_size_has_exceeded_allowed_once_upload' });
            }

            /**
             * kiểm tra req.files array có chứa mimetype không hợp lệ
             */
            let typeFileInvalid = fileTypes.includes(fileName.split('.').pop().toLowerCase());
            if (!typeFileInvalid)
                return resolve({ error: true, message: 'mimetype_invalid', desscription: 'req.files have file contain mimefile invalid' });
        
            /**
             * kiểm tra LƯỢNG DỮ LIỆU CHO PHÉP UPLOAD CÒN LẠI của 1 công ty
             */

            let infoCompanyAccessApp = await APP_COMPANY_MODEL.getInfoDetail({ appID, companyID });
            if (!infoCompanyAccessApp)
                return resolve({ error: true, message: infoCompanyAccessApp });

            let { maxData: maxStorageOfCompany } = infoCompanyAccessApp; // maxStorageOfCompany: (dung lượng tối đa)
           
            // demo dung lượng hiện tại 2G (đã dùng)
            let currentStorage = 2 * 1024 * 1024 * 1024;

            if (currentStorage + sizeCurrent > maxStorageOfCompany)
                return resolve({ error: true, message: 'total_size_has_exceeded_allowed_of_company_app' });

            /**
             * kiểm tra file đã tồn tại theo path;
             */
            let checkFileExist = await FILE_COLL.findOne({ path: pathName });
            if(checkFileExist)
                return resolve({ error: true, message: "file_existed"});
            /**
             * Kiểm tra file có chứa dấu #
             */
            if(fileName.includes('#') || fileName.includes('+'))
                return resolve({ error: true, message: "file_has_valid_characters"});

            return resolve({ error: false, message: "permission_success"});
         
        } catch (error) {
            return resolve({ error: true, message: error.message });
        }
    })
}


// link từ s3 dowload file về 
function  render_ljnk_dowload_file_s3({ path, fileName }){
    return new Promise(async resolve => {
        try {
            console.log({_____________ : `${config.bucket}/storage/${path}`, fileName})
            var urlParams = {
                Bucket: `trx-demo-003`,
                Key: 'Bài 10.docx',
                // ResponseContentType: 'image/jpg',
            };
            let url = s3Object.getSignedUrl('getObject', urlParams);
            return  resolve({ error : false, url })
        } catch (error) {
            console.log({ error })
            return  resolve({ error : true, message : 'cant_create_url' })
        }
    })

}


function deleteOneFile({ path, fileName }){
    return new Promise(async resolve => {
        try {
			path = path.search('storage/') !== -1 ? `${config.bucket}/storage/${path}` : `${config.bucket}/${path}`;

			const params = {
                Bucket: path,// đường đẫn
                Key: fileName
                // ví dụ
                // Bucket: 'trx-demo-003/storage/5dfe4c1b51dc622100bb9d8f/5e60dffb2c43a444c5f8e227/603604cb00343a668ff875f5',
                // Key: '5c6669d4-5775-4845-8e8c-aab522654e2e.png' ,
            };

            const resultDelete = await s3Object.deleteObject(params, function(err, data) {
                if (err) console.log(err, err.stack);  // error
                else     console.log();                // deleted
			});
			return resolve({error: false, status: resultDelete, message: 'delete_success'  })
        } catch (error) {
            return resolve({ error: true, message: error})
        }
    })
}

exports.CHECK_MIDDLE_UPLOAD                 = check_prefix_upload_array;
exports.CHECK_MIDDLE_UPLOAD_FIELD           = check_prefix_upload_field;
exports.CHECK_MIDDLE_UPLOAD_SINGLE          = check_prefix_upload_single;
exports.CHECK_MIDDLE_UPLOAD_FIELD_GOODS     = check_prefix_upload_field_goods; 
exports.GENERATE_LINK_S3                    = render_link_upload_s3; 
exports.CHECK_PERMISSION_GENERATE_LINK      = checkPermissionGenerateLink; 
exports.DOWLOAD_ONE_FILE_S3                 = download_one_file_s3; 
exports.GENERATE_LINK_DOWLOAD_ONE_FILE_S3   = render_ljnk_dowload_file_s3;
exports.DELETE_ONE_FILE_S3                  = deleteOneFile;
exports.FAKE_LINK_READ_FILE_S3              = render_link_read_file_s3;





