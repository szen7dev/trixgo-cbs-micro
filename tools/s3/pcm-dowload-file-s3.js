const COMMENT_MODEL                 = require('../models/core/comment').MODEL;
const PCM_PLAN_TASK                 = require('../models/apps/pcm/pcm_plan_task').MODEL;
const FILE_COLL                     = require('../database/core/file-coll');
const fs                            = require('fs');
const path                          = require('path');
let { CHECK_MIDDLE_UPLOAD, GENERATE_LINK_S3, CHECK_PERMISSION_GENERATE_LINK, DOWLOAD_ONE_FILE_S3, GENERATE_LINK_DOWLOAD_ONE_FILE_S3 } = require('../routing/role/_upload.check');


exports.dowloadAllFileAllTaskInGroup= function(stringifyStr){
    let {group,  projectName, groupID, userID, _pathFilePcmTemp } = JSON.parse(stringifyStr); // convert for worker_threads
    
    return new Promise(async(resolve)=>{
        console.log({ _pathFilePcmTemp, groupID, group})

        let listAllTaskInGroup = await PCM_PLAN_TASK.getAllTaskInGroup({ groupID, userID });
        console.log({listAllTaskInGroup})

        if(listAllTaskInGroup.error) return resolve({error: true, message:'cant_get_info_group'});
        // let infoPlanGroup = await PCM_PLAN_GROUP_MODEL.getInfo({ planGroupID : groupID })
        // if(infoPlanGroup.error) return resolve({error: true, message:'cant_get_task_info_group'});
        console.log('goo')
        
        let pathFilePcmTemp = path.resolve(__dirname, `${_pathFilePcmTemp}/${group.name}`);
        
        if (!fs.existsSync(pathFilePcmTemp)){
            fs.mkdirSync(pathFilePcmTemp, { recursive: true });
        }else{
            await  rimraf(pathFilePcmTemp, function () {  fs.mkdirSync(pathFilePcmTemp, { recursive: true }); });
        }
        (async()=>{
            let isFasle = false;
            for(const task of listAllTaskInGroup.data){
        console.log('goo22')

                    let taskID = task._id;
                    let listData = await PCM_PLAN_TASK.getInfo({ taskID, userID});
                    console.log({listData})
                    if(listData.error)
                        return resolve({error: true, message:'dont_have_file'});
                    let { assigneeAttachs, authorAttachs, _id } = listData.data;
                    let listPromise = [];
                    for(let file of assigneeAttachs){
                        let { name, path } = file;
                        path =path.slice(9, path.length)
                        let resultDowload =  DOWLOAD_ONE_FILE_S3({filePathS3 : path, newFilePath :`${_pathFilePcmTemp}/${group.name}/${listData.data.name}/${name}`});
                        listPromise.push(resultDowload);
                    }
                    for(let file of authorAttachs){
                        let { name, path } = file;
                        path =path.slice(9, path.length)
                        let resultDowload =  DOWLOAD_ONE_FILE_S3({filePathS3 : path, newFilePath :`${_pathFilePcmTemp}/${group.name}/${listData.data.name}/${name}`});
                        listPromise.push(resultDowload);
                    }
                    //task
                    let fileRespone = await FILE_COLL.find({ planTask  : taskID });
                    if(fileRespone){
                        for(let file of fileRespone){
                            let { name, path } = file;
                            path =path.slice(9, path.length)
                            let resultDowload =  DOWLOAD_ONE_FILE_S3({filePathS3 : path, newFilePath :`${_pathFilePcmTemp}/${group.name}/${listData.data.name}/${name}`});
                            listPromise.push(resultDowload);
                        }
                    }
                    let fileComment = await COMMENT_MODEL.getListCommentByTaskID({taskID });
                    if(!fileComment.error){
                        for(let comment of fileComment.data){
                            let { files } = comment;
                            if(files){
                                for(let file of files){
                                    let { name, path } = file;
                                    path =path.slice(9, path.length)
                                    let resultDowload =  DOWLOAD_ONE_FILE_S3({filePathS3 : path, newFilePath :`${_pathFilePcmTemp}/${group.name}/${listData.data.name}/${name}`});
                                    listPromise.push(resultDowload);
                                }
                            }
                        }
                    }
                    
                    //planTask
                    let arrHermaps =  await Promise.all(listPromise);
                    let _arrHermaps = [];
                    if(arrHermaps.length == 0){
                        // return resolve({error :true, message: 'dont_have_file'})
                    }
                    arrHermaps.forEach(pr=>{
                        if(pr.error){
                            isFasle = true;
                        }
                    })
            }
            group && group.childs && group.childs.forEach(item2=>{
                console.log({item2})
            })
            if((group && group.childs && group.childs)){
                for(const item of  group.childs){
                console.log({item2 : item})

                    // if (!fs.existsSync(`${_pathFilePcmTemp}/${infoPlanGroup.data.name}/${item.name}`)){
                    //     fs.mkdirSync(`${_pathFilePcmTemp}/${infoPlanGroup.data.name}/${item.name}`);
                    // }else{
                    //     await  rimraf(`${_pathFilePcmTemp}/${infoPlanGroup.data.name}/${item.name}`, function () {  fs.mkdirSync(`${_pathFilePcmTemp}/${infoPlanGroup.data.name}/${item.name}`); });
                    // }
                    let return__ =   await dowloadAllFileAllTaskInGroup(JSON.stringify({ group :item,  projectName, groupID : item._id, userID, _pathFilePcmTemp : `${_pathFilePcmTemp}/${group.name}` }))
                }
            }
            if(!isFasle){
                // let check  = await compressing.tar.compressDir(path.resolve(__dirname, '../../../../files/dowloadFormS3/',`${infoPlanGroup.data.name}`),path.resolve(__dirname, '../../../../files/dowloadFormS3/',`${infoPlanGroup.data.name}.zip`) )
                // let pathDown =   `files/dowloadFormS3/${infoPlanGroup.data.name}.zip`
                return  resolve({error :false, message: 'dowload_success'})
            }

            // let resultDowload = await  DOWLOAD_ONE_FILE_S3({filePathS3, newFilePath});
            return resolve({error :true, message: 'dowload_miss'})
            })();
        
        })
}