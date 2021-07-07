"use strict";
const fs                                            = require('fs');
const path                                          = require('path');

// Colls
const CHATTING__MESSAGE_COLL                        = require('../database/chatting.message-coll');
const CHATTING__CONVERSATION_COLL                   = require('../database/chatting.convensation-coll');
const FILE__FILE_COLL                               = {}
const REACTION_COLL                                 = {}

// Models  || actions
const REACTION_MODEL                                = {}
const FILE__REMOVED_MODEL                           = {}


// Tools
const BaseModel                                     = require('../../../tools/db/base_model');
const ObjectID                                      = require('mongoose').Types.ObjectId;
const { checkObjectIDs, objectID }                            = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION }                     = require('../../../tools/cursor_base/playground/index');



class Model extends BaseModel {

    constructor() {
        super(require('../database/chatting.message-coll'));
    }

    // Thêm tin nhắn mới
    insert({ senderID, content, parentID, receivers, conversationID, status, type }) { 
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!status){
                    status = 0;
                }
                if(!type){
                    type = 0;
                }
                if (!checkObjectIDs(senderID, conversationID)) 
                    return resolve({ error: true, message: 'Params invalid', status : 400 });
                
                let arrReceiver = receivers;
                // if(receivers && receivers.includes(',')) {
                //     arrReceiver = receivers.split(',');
                // } else {
                //     arrReceiver.push(receivers);
                // }
                arrReceiver.forEach(receiver =>{
                    if(receiver && !checkObjectIDs(receiver))
                        return resolve({ error: true, message: 'Params invalid', status : 400 });
                })
                
                if(!Array.isArray(arrReceiver))
                    return resolve({ error: true, message: 'Params invalid', status : 400 });

                
                // kiểm tra các receivers có phải là members trong cuộc hội thoại
                let checkExistConversation  = await CHATTING__CONVERSATION_COLL.find({
                        _id: conversationID ,
                        members: { $all: [senderID, ... arrReceiver] }
                });
                if(!Array.isArray(checkExistConversation) || checkExistConversation.length < 1)
                    return resolve({ error: true, message: 'You are not member', status : 403 });

                let infoMessageAfterInserted;

                // Kiểm tra parentID => tính năng reply tin nhắn
                if(parentID) {
                    if(parentID && !checkObjectIDs(parentID)) 
                        return resolve({ error: true, message: 'Params invalid', status : 400 });

                    infoMessageAfterInserted = await that.insertData({ listSeen: [senderID], sender: senderID, content, conversation: conversationID, parent: parentID, status, type });
                    if(!infoMessageAfterInserted)
                        return resolve({ error: true, message: 'Cant create message reply', status : 403 });

                    let checkLastMessageAfterUpdatedR = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                        lastMessage: infoMessageAfterInserted._id, modifyAt: Date.now()
                    }, { new: true });

                    return resolve({ error: false, data : infoMessageAfterInserted, status : 200 });
                }

                infoMessageAfterInserted = await that.insertData({listSeen: [senderID], sender: senderID, content, conversation: conversationID, parent: parentID, status, type });
                if(!infoMessageAfterInserted)
                    return resolve({ error: true, message: 'Cant create message ', status : 403 });

                let { _id: messageID } = infoMessageAfterInserted; 
                let infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, {
                    $addToSet: {
                        receivers: [...arrReceiver]
                    }
                }, { new: true });

                if(!infoMessageAfterUpdated)
                    return resolve({ error: true, message: 'Cant create message ', status : 403 });

                let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: messageID, modifyAt: Date.now()
                }, { new: true });

                if(!checkLastMessageAfterUpdated)
                    return resolve({ error: true, message: 'Cant create message ', status : 403 });
                
                return resolve({ error: false, data : infoMessageAfterUpdated, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // coppy tin nhắn
    copyMessage({ senderID, receivers, conversationID, messageShareID }) { 
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs(senderID, conversationID)) 
                    return resolve({ error: true, message: 'Params invalid', status : 400 });    

                let arrReceiver = receivers;
                // if(receivers && receivers.includes(',')) {
                //     arrReceiver = receivers.split(',');
                // } else {
                //     arrReceiver.push(receivers);
                // }
                arrReceiver.forEach(receiver =>{
                    if(!checkObjectIDs(receiver))
                        return resolve({ error: true, message: 'Params invalid', status : 400 });
                })
                if(!Array.isArray(arrReceiver))
                    return resolve({ error: true, message: 'Params invalid', status : 400 });

                
                // kiểm tra các receivers có phải là members trong cuộc hội thoại
                let checkExistConversation  = await CHATTING__CONVERSATION_COLL.find({
                        _id: conversationID ,
                        members: { $all: [senderID, ... arrReceiver] }
                });
                if(!Array.isArray(checkExistConversation) || checkExistConversation.length < 1)
                    return resolve({ error: true, message: 'You are not member', status : 403 });

                let infoMessageAfterInserted;
                let infoMessageShare = await CHATTING__MESSAGE_COLL.findById(messageShareID);
            
                let _infoMessageShare = {};
                _infoMessageShare.files         = infoMessageShare.files
                _infoMessageShare.content       = infoMessageShare.content
                _infoMessageShare.conversation  = conversationID;
                _infoMessageShare.sender        = senderID;
                _infoMessageShare.receivers     = arrReceiver;


                _infoMessageShare.status     = 3;
                infoMessageAfterInserted = await that.insertData(_infoMessageShare);
                if(!infoMessageAfterInserted)
                    return resolve({ error: true, message: 'Cant create message ', status : 403 });

                let { _id: messageID } = infoMessageAfterInserted; 
                let infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, {
                    $addToSet: {
                        receivers: [...arrReceiver]
                    }
                }, { new: true });

                if(!infoMessageAfterUpdated)
                    return resolve({ error: true, message: 'Cant create message ', status : 403 });

                let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: messageID, modifyAt: Date.now()
                }, { new: true });

                if(!checkLastMessageAfterUpdated)
                    return resolve({ error: true, message: 'Cant update to last message ', status : 403 });
                
                return resolve({ error: false, data : infoMessageAfterUpdated, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    //
    updateByID({ messageID, filesID }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(messageID) || !checkObjectIDs(filesID))
                    return resolve({ error: true, message: 'Params invalid', status : 400 });

                let infoUpdateMessage;
                
                infoUpdateMessage = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID,{
                    $addToSet: {
                        files: filesID
                    }
                }, { new: true });

                if(!infoUpdateMessage)
                    return resolve({ error: true, message: 'Cant update message ', status : 403 });

                return resolve({ error: false, data: infoUpdateMessage });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    //GetFiles
    getFiles({ conversationID, currentPage, userID }){
        return new Promise(async(resolve)=>{
            try {
                const page = Number(currentPage) || 1;
                const perPage = 5;
                if(!checkObjectIDs(conversationID))
                    return resolve({ error: true, message: 'Params invalid', status : 400 });

                let checkExistConversation  = await CHATTING__CONVERSATION_COLL.find({
                        _id: conversationID ,
                        members: { $all: [userID] }
                });

                if(currentPage ==1){
                    let listImage = await FILE__FILE_COLL.find({ conversation: conversationID, type : 1 })
                        .skip((page * perPage) - perPage)
                        .limit(perPage)
                        .sort({ createAt: -1 });
                    
                    let listZips = await FILE__FILE_COLL.find({ conversation: conversationID, type : 3 })
                        .skip((page * perPage) - perPage)
                        .limit(perPage)
                        .sort({ createAt: -1 });

                    return resolve({ error: false, data : {listImage, listZips}, page });
                }else{

                    let listImage = await FILE__FILE_COLL.find({ conversation: conversationID, type : 1 })
                        .sort({ createAt: -1 });
                
                    let listZips = await FILE__FILE_COLL.find({ conversation: conversationID, type : 3 })
                        .sort({ createAt: -1 });
                        
                    return resolve({ error: false, data : {listImage, listZips}, status : 200 });

                }
            
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // author : VinhNh
    // 16/10/2020
    // Lấy tất cả các link của cuộc hội thoại

    //   getAllLink({ conversationID, currentPage, userID }){
    //     return new Promise(async(resolve)=>{
    //         try {
    //                 const page = Number(currentPage) || 1;
    //                 const perPage = 5;
    //                 if(!checkObjectIDs(conversationID))
    //                     return resolve({ error: true, message: 'invalid_object_id'});

    //                 let checkExistConversation  = await CHATTING__CONVERSATION_COLL.find({
    //                         _id: conversationID ,
    //                         members: { $all: [userID] }
    //                 });

    //                 if(currentPage ==1){
    //                     let listImage = await m.find({ conversation: conversationID, type : 1 })
    //                     .skip((page * perPage) - perPage)
    //                     .limit(perPage)
    //                     .sort({ createAt: -1 });
                    
    //                     let listZips = await FILE__FILE_COLL.find({ conversation: conversationID, type : 3 })
    //                         .skip((page * perPage) - perPage)
    //                         .limit(perPage)
    //                         .sort({ createAt: -1 });
    //                     return resolve({ error: false, data : {listImage, listZips}, page });
    //                 }else{

    //                     let listImage = await FILE__FILE_COLL.find({ conversation: conversationID, type : 1 })
    //                         .sort({ createAt: -1 });
                    
    //                     let listZips = await FILE__FILE_COLL.find({ conversation: conversationID, type : 3 })
    //                         .sort({ createAt: -1 });
                            
    //                     return resolve({ error: false, data : {listImage, listZips} });

    //                 }
                
    //             } catch (error) {
    //                 return resolve({ error: true, message: error.message });
    //             }
    //         })
    //     }
    // xóa toàn bộ các tin nhắn trong cuộc hội thoại
    removeAllByConversationID({ conversationID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(conversationID))
                    return resolve({ error: true, message: 'Params invalid', status : 400 });

                let infoMessageAfterRemoved = await CHATTING__MESSAGE_COLL.find({ conversation: conversationID});
                if(!infoMessageAfterRemoved)
                    return resolve({ error: true, message : 'cannot_remove'});
                
                await infoMessageAfterRemoved.forEach(async  message=>{
                    let infoMessage = await CHATTING__MESSAGE_COLL.findById(message._id);
                    let infoMessageAfterRemoved = await CHATTING__MESSAGE_COLL.findOneAndRemove({ _id: message._id, conversation: conversationID });
                    if(!infoMessageAfterRemoved)
                        return resolve({ error: true, message : 'cannot_remove' });
    
                    let pathFileMessage = path.resolve(__dirname, '../../../..');
                    await infoMessage.files.forEach(async file=>{
                        let info = await FILE__FILE_COLL.findById(file);
                        await FILE__FILE_COLL.findByIdAndDelete(file)
                        fs.unlink(`${pathFileMessage}${info.url}`, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                        })
                    })
                })

                return resolve({ error: false, data : '' });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }
    
    // lấy toàn bộ các tin nhắn trong cuộc hội thoại phân trang
    getMessageByConversationIDWithPage({ conversationID, currentPage, userID, nextInfo }){
        return new Promise(async(resolve)=>{
            try {
                const page = Number(currentPage) || 1;
                const perPage = 15;
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let checkExistConversation  = await CHATTING__CONVERSATION_COLL.find({
                    _id: conversationID ,
                    members: { $all: [userID] }
                });

                if(!checkExistConversation)
                    return resolve({ error: true, message: 'Permission denied', status : 403 });
                
                
               let dataPaggingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys: ['createAt__-1', '_id__-1'] })
               
                if(!dataPaggingAndSort || (dataPaggingAndSort && dataPaggingAndSort.error) )
                    return resolve({ error: true, message: 'request params nextInfo invalid', status : 400 });

                let ObjectSearch            = dataPaggingAndSort.data.find;
                ObjectSearch.conversation   =  objectID(conversationID);
                let _sort = dataPaggingAndSort.data.sort;
                // console.log({ObjectSearch});

                    // let listMessage = await CHATTING__MESSAGE_COLL.aggregate([
                    //     {
                    //         $match:  ObjectSearch
                            
                    //     }, 
                    //     {
                    //         $project : { 
                    //             year : {$year : "$createAt" || "$createdAt"},
                    //             month : {$month : "$createAt"|| "$createdAt"},
                    //             day : {$dayOfMonth : "$createAt"|| "$createdAt"},
                    //             content : 1,
                    //             files : 1,
                    //             receivers : 1,
                    //             sender : 1,
                    //             conversation : 1,
                    //             parent : 1,
                    //             status : 1,
                    //             createAt : 1,
                    //             createdAt : 1


                    //         }
                    //     },
                    //     {
                    //         $sort:{ createAt : -1 }
                    //     },
                    //     { $limit : perPage }
                    // ])
                let listMessage = await CHATTING__MESSAGE_COLL.find(ObjectSearch)
                    // .populate({ 
                    //     path: 'files',
                    // })
                    // .populate(
                    // {
                    //     path : 'sender', select :'_id fullname image company ' 
                    // })
                    // .populate({
                    //     path: 'parent',
                    //     populate: {
                    //         path: "files sender",
                    //         select :'_id fullname image company path name type size author conversation' 
                    //     }
                    // })
                    // .populate(
                    // {
                    //     path : 'likedUsers', select :'_id fullname image company ' 
                    // })
                    // .populate({path : 'listSeen', select :  '_id fullname  image' })
                    // .populate({
                    //     path: 'reactions',
                    //     populate: {
                    //         path: "author",
                    //         select :'_id fullname image company' 
                    //     }
                    // })
                .limit(perPage)
                .sort( dataPaggingAndSort.data.sort );

                
                return resolve({ error: false, data : listMessage, page, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // xóa tin nhắn trong cuộc hội thoại => gỡ tin nhắn
    /* Author: Hoang
    * Date: 18/10/2010 
    * Update: save file removed.(remove S3 rontab)
    */
    removebyID({ messageID, conversationID, senderID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(messageID, conversationID, senderID))
                    return resolve({ error: true, message: 'invalid_object_id'});

                let infoMessage = await CHATTING__MESSAGE_COLL.findById(messageID);
                
                // kiểm tra thời gian hiện tại nếu quá 1h không cho xoá tin 
                let currentDate     = new Date();
                let createMessage   =   infoMessage.createdAt
                console.log({ currentDate, messageDate : infoMessage.createdAt })
                // return resolve({ error: false, data : 'okkk' });

                let infoMessageAfterRemoved = await CHATTING__MESSAGE_COLL.findOneAndRemove({ _id: messageID, conversation: conversationID, sender: senderID });
                if(!infoMessageAfterRemoved)
                    return resolve({ error: true, message : 'cannot_remove' });

                // await infoMessage.files.forEach(async file=>{
                //     let info = await FILE__FILE_COLL.findById(file);
                //     await FILE__FILE_COLL.findByIdAndDelete(file)
                //     await FILE__REMOVED_MODEL.insert({name: info.name, path: info.path});
                //     // fs.unlink(`${pathFileMessage}${info.url}`, (err) => {
                //     //     if (err) {
                //     //         console.error(err)
                //     //         return
                //     //     }
                //     // })
                // })
               
                return resolve({ error: false, data : infoMessageAfterRemoved });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    getInfoByID({ messageID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(messageID))
                    return resolve({ error: true, message: 'invalid_object_id'});
                let infoMessage = await CHATTING__MESSAGE_COLL.findById( messageID )
                    // .populate({ 
                    //     path: 'files',
                    // })
                    // .populate({
                    //     path: 'parent',
                    //     populate: {
                    //         path: "files"
                    //     },
                    //     populate : { 
                    //         path : 'sender', select :  '_id fullname  image' 
                    //     }
                    // })
                    // .populate({path : 'sender', select :  '_id fullname  image' })
                    // .populate({path : 'listSeen', select :  '_id fullname  image' })
                    // .populate({
                    //     path: 'reactions',
                    //     populate: {
                    //         path: "author"
                    //     }
                    // });

                if(!infoMessage)
                    return resolve({ error: true, message : 'cannot_find'});
                //Chưa check xóa tin nhắn có files_ và tin nhắn có tin nhắn reply
                return resolve({ error: false, data : infoMessage });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }
    //cập nhật trạng thái tin nhắn đã xem
    /**
     * Author: Vinh
     * Update: Hoang - 3:35PM - 21/10/2020
     * add seen for like (status = 107)
     */
    seenMessageOneByOne({ messageID, userID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(messageID))
                    return resolve({ error: true, message: 'invalid_object_id'});

                let checkExitsMessage = await CHATTING__MESSAGE_COLL.findById(messageID);
                if(!checkExitsMessage)
                    return resolve({ error: true, message : 'cannot_update'});

                if(checkExitsMessage.status >= 100)
                    return resolve({ error: true, message : 'cannot_update'});  
                    //listSeen
                let infoMessage;
                if(checkExitsMessage.listSeen){
                    let listSeen = checkExitsMessage.listSeen;
                    if(!listSeen.includes(userID)){
                        listSeen = listSeen.concat([userID]);
                        infoMessage = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, {status : 1, listSeen}, { new: true });
                        if(!infoMessage)
                            return resolve({ error: true, message : 'cannot_update'});
                        return resolve({ error: false, data : infoMessage });
                    }else{
                        return resolve({ error: false, data : checkExitsMessage });  
                    }
                }else{
                    let listSeen = [userID]
                    infoMessage = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, {status : 1, listSeen}, { new: true });
                    if(!infoMessage)
                        return resolve({ error: true, message : 'cannot_update'});
                    return resolve({ error: false, data : infoMessage });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    //Thu hồi tin nhắn
    revokeMessage({ messageID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(messageID))
                    return resolve({ error: true, message: 'invalid_object_id'});
                let infoMessage = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, {content : 'Tin nhắn này đã được thu hồi'}, { new: true });
                if(!infoMessage) 
                    return resolve({ error: true, message : 'cannot_update'});
                //Xóa files 
                return resolve({ error: false, data : infoMessage });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    toggleLikeMessage({ messageID, authorID, type }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(messageID) || !checkObjectIDs(authorID) )
                    return resolve({ error: true, message: 'Params invalid', status : 400 });
                let arrUser = [authorID]
                let checkExistMessage = await CHATTING__MESSAGE_COLL.findOne({
                     _id : messageID,
                });
                let infoMessageAfterUpdated;
                //Kiểm tra tin nhắn có tồn tại không
                if(!checkExistMessage){
                    return resolve({ error: true, message: 'Message is exits', status : 403 });
                }
                //Kiểm tra xem đã có bày tỏ cảm xúc về tin nhắn chưa
                let checkExistReaction = await REACTION_COLL.findOne({
                    message : messageID, author : authorID
                })
                let infoMessageAterUpdate;

                //Nếu có rồi
                if(checkExistReaction){
                    //Kiểm tra xem đang muốn chuyển thành action mới hay hủy bỏ action
                    //Chuyển sang action khác VD : tù like đổi sang phẫn nộ
                    if(checkExistReaction.type != type){
                        let reactionID = checkExistMessage.reactions;
                        let infoAction = await REACTION_COLL.findByIdAndUpdate(
                            reactionID, { type : type }, { new: true }
                        );
                        if(!infoAction)
                            return resolve({ error: true, message: 'Cant update', status : 403 });

                        return resolve({ error: false, data : checkExistMessage });
                    }else
                    {
                    //Hủy bỏ action 
                    let reactionID = checkExistReaction._id;
                    let infoAction = await REACTION_MODEL.remove({reactionID});
                    if(!infoAction)
                        return resolve({ error: true, message: 'Cant update', status : 403 });

                    infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(
                        { _id : messageID }, {
                        $pull : {
                            reactions: reactionID
                        }}, 
                        { new: true });
                    if(!infoMessageAfterUpdated)
                        return resolve({ error: true, message: 'Cant update', status : 403 });

                    return resolve({ error: false, data : infoMessageAfterUpdated })    

                    }
                }else{
                //Nếu chưa có
                    let infoActionAfterAdd = await REACTION_MODEL.insert({ author : authorID, type, message : messageID})
                    if(!infoActionAfterAdd)
                        return resolve({ error: true, message: 'Cant update', status : 403 });

                    let idReacion = infoActionAfterAdd.data._id;
                    infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(
                                { _id : messageID }, {
                                $addToSet : {
                                    reactions: idReacion
                                }}, 
                                { new: true });
                    if(!infoMessageAfterUpdated)
                        return resolve({ error: true, message: 'Cant update', status : 403 });

                    return resolve({ error: false, data : infoMessageAfterUpdated });
                }
                // // Nếu đã like rồi chuyển sang unlike
                // if(checkExistLikeMessage){
                //      infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(
                //         { _id : messageID }, {
                //         $pull : {
                //             reaction: authorID
                //         }}, 
                //         { new: true });
                //         isLike = false;
                //     return resolve({ error: false, data : infoMessageAfterUpdated, isLike });
                // }
                // infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(
                //         { _id : messageID }, {
                //         $addToSet : {
                //             reaction: [...arrUser]
                //         }}, 
                //         { new: true });
                // if(!infoMessageAfterUpdated)
                //     return resolve({ error: true, message : 'cannot_update'});
                // return resolve({ error: false, data : infoMessageAfterUpdated, isLike });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Danh sách các Bug/Tickets cần support cho khách hàng
    getAllMessageBugInSystem({ userID, tab, isSupporter }){
        return new Promise(async(resolve)=>{
            try {

                let conditionObj
                let conditionSort = {createAt : -1}
                if(isSupporter){
                    conditionObj = { bug : 1 }
                }else{
                    conditionObj = { 
                        bug      : 1,
                        sender   : userID
                    }
                }

                if(tab == 1 || tab ==2){
                    conditionObj.fixedbug = 0
                }

                if(tab == 3){
                    conditionObj.fixedbug = 1
                    conditionSort = {fixBugAt: -1}
                }

                if(tab==4){
                    conditionObj = { 
                        bug         : 1,
                        userFixedBug: userID
                    }
                }

                let allMessageBugs = await CHATTING__MESSAGE_COLL.find(conditionObj)
                    .populate({
                        path        : 'sender',
                        select      : 'company _id fullname image email',
                        populate    : {
                            path : 'company'
                        }
                    })
                    .populate({
                        path     : 'userFixedBug',
                        select   : 'company _id fullname image email',
                        populate : {
                            path     : 'company'
                        }
                    })
                    .populate({
                        path    : 'conversation',
                        select  :  '_id name' 
                    })
                    .populate({
                        path    : 'files',
                        select  :  'path _id type' 
                    })
                    .populate({
                        path    : 'listSeen',
                        select  :  'fullname _id email image' 
                    })
                    .populate({
                        path    : 'app',
                        select  :  '_id name' 
                    })
                    .sort(conditionSort)

                if(!allMessageBugs)
                    return resolve({ error: true, message: 'cant_get_list' });

                return resolve({ error: false, data: allMessageBugs });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }
    
    updateStatusMessageBug({ messageID, authorID, bug, appID }){
        return new Promise(async(resolve)=>{
            try {
                let isBug = 1;
                let newTicket;

                if(bug == 'false' || bug == false){
                    isBug = 0;
                }

                if(!checkObjectIDs(messageID) || !checkObjectIDs(authorID)  )
                    return resolve({ error: true, message: 'invalid_object_id'});

                let infoMessage = await CHATTING__MESSAGE_COLL.find({ _id : messageID });
                if(infoMessage && infoMessage.length <1 ){
                    return resolve({ error: true, message: 'message_exits'});
                }

                let infoMessageMaxTickit = await  CHATTING__MESSAGE_COLL.find().sort({ ticket: -1 }).limit(1);
                newTicket = Number(infoMessageMaxTickit[0].ticket);
                if(infoMessageMaxTickit && infoMessageMaxTickit.length > 0 && isBug!=0){
                    newTicket = Number(infoMessageMaxTickit[0].ticket) + 1;
                }

                let dataUpdate =  { bug : isBug, ticket : newTicket }
                if(appID && checkObjectIDs(appID)){
                    dataUpdate.app  = appID

                }

                let infoMessageAfterUpdate = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, dataUpdate, { new: true });
                if(!infoMessageAfterUpdate)
                    return resolve({ error: true, message: 'invalid_object_id'});

                return resolve({ error: false, data: infoMessageAfterUpdate });

            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    updateUserWorkingBug({ messageID, userID, fixBugAt, noteBug }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(messageID) || !checkObjectIDs(userID) )
                    return resolve({ error: true, message: 'invalid_object_id'});
                
                let exitMessage = await CHATTING__MESSAGE_COLL.findById(messageID);
                if(!exitMessage)
                    return resolve({ error: true, message: 'message_exits'});

                let infoMessageAfterUpdate = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, { userFixedBug : userID, fixBugAt, noteBug, fixedbug : 1 }, { new: true });
                if(!infoMessageAfterUpdate)
                    return resolve({ error: true, message: 'canT_update'});
                
                return resolve({ error: false, data: infoMessageAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    updateNoteBug({messageID, noteBug, userID}){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(messageID))
                    return resolve({ error: true, message: 'invalid_object_id'});
                
                let exitMessage = await CHATTING__MESSAGE_COLL.findOne({ _id : messageID, userFixedBug : userID });
                if(!exitMessage)
                    return resolve({ error: true, message: 'message_exits'});

                let infoMessageAfterUpdate = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, { noteBug }, { new: true });
                if(!infoMessageAfterUpdate)
                    return resolve({ error: true, message: 'cant_update'});
                
                return resolve({ error: false, data: infoMessageAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    /**
     * Name: Cập nhật message ticket
     * Author: Dattv (12/12/2020)
     * Updated:
     * -12/10/2020 - Dattv: Populate userFixedBug & app
     * Usage:
     * Web: Cập nhật thông tin message ticket
     */
    updateAppIDTicket({ messageID, appID, noteBugEdit, expiredTime, priority, userFixBugs }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(messageID))
                    return resolve({ error: true, message: 'invalid_object_id'});
                
                let exitMessage = await CHATTING__MESSAGE_COLL.findById(messageID);
                if(!exitMessage)
                    return resolve({ error: true, message: 'message_exits'});

                let ObjectUpdate = {} ;
                if(!noteBugEdit){
                    noteBugEdit = '';
                }
                ObjectUpdate.noteBug = noteBugEdit;


                if(appID){
                    ObjectUpdate.app = appID;
                }

                if(expiredTime){
                    ObjectUpdate.expiredTime = expiredTime;
                }

                if(priority){
                    ObjectUpdate.priority = Number(priority);
                }

                if(userFixBugs){
                    ObjectUpdate.userFixedBug = userFixBugs;
                }

                let infoMessageAfterUpdate = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, ObjectUpdate, { new: true })
                    .populate("userFixedBug app");

                if(!infoMessageAfterUpdate)
                    return resolve({ error: true, message: 'cant_update'});
                
                return resolve({ error: false, data: infoMessageAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    /**
     * Lấy danh sách ticket của app
     * Depv
     */
    getListTicketOfApp({ appID, fixedbug }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(appID))
                    return resolve({ error: true, message: 'params_invalid'});
                
                let listTicket = await CHATTING__MESSAGE_COLL.find({  app: appID, fixedbug })
                                 .populate({
                    path : 'sender',
                    select : 'company _id fullname image email',
                    populate : {
                        path : 'company'
                    }
                })
                .populate({
                    path : 'userFixedBug',
                    select : 'company _id fullname image email',
                    populate : {
                    path : 'company'
                    }
                })
                .populate({
                    path : 'conversation',
                    select :  '_id name' 
                })
                .populate({
                    path : 'files',
                    select :  'path _id type' 
                })
                .populate({
                    path : 'listSeen',
                    select :  'fullname _id email image' 
                })
                .populate({
                    path : 'app',
                    select :  '_id name' 
                })
                .sort({createAt : -1})
                if(!listTicket)
                    return resolve({ error: true, message: 'cant_update'});
                
                return resolve({ error: false, data: listTicket });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    getListTicketNoApp({  fixedbug }){
        return new Promise(async(resolve)=>{
            try {
                let listTicket = await CHATTING__MESSAGE_COLL.find({ app : { $exists: false }, ticket :{ $ne : 0 }, fixedbug , bug: 1 })
                    .populate({
                        path : 'sender',
                        select : 'company _id fullname image email',
                        populate : {
                            path : 'company'
                        }
                    })
                    .populate({
                        path : 'userFixedBug',
                        select : 'company _id fullname image email',
                        populate : {
                        path : 'company'
                        }
                    })
                    .populate({
                        path : 'conversation',
                        select :  '_id name' 
                    })
                    .populate({
                        path : 'files',
                        select :  'path _id type' 
                    })
                    .populate({
                        path : 'listSeen',
                        select :  'fullname _id email image' 
                    })
                    .populate({
                        path : 'app',
                        select :  '_id name' 
                    })
                    .sort({createAt : -1})

                if(!listTicket)
                    return resolve({ error: true, message: 'cant_update'});
                
                return resolve({ error: false, data: listTicket });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Tìm kiếm tin theo nội dung dạng string
    getInfoWithKey({ key, conversationID, userID }) {
        return new Promise(async resolve => {
            try {
                let checkExitsConversation = await CHATTING__CONVERSATION_COLL.find({
                    _id : conversationID,
                    members: { $in: [userID]},
                });
                if(!checkExitsConversation)
                    return resolve({ error: true, message :'exit conversation' });

                let infoMessage = await CHATTING__MESSAGE_COLL.find({
                    conversation: conversationID,
                        $or: [
                            { content: new RegExp(key, 'i') }
                        ]
                })

                // lấy những tin nhắn gần nhất nên sẽ lấy phần tử cuối cùng tìm được
                infoMessage = infoMessage[infoMessage.length -1]
                return resolve({ error: false, data: infoMessage });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    // thay đổi trạng thái đã nhận tin nhắn phía người nhận
    /**
     * Author: Vinh
     * Update: Hoang - 2:55PM 22/10/2020 
     * check message.status < 100 to set status again. 
     */
    updateRecive({ messageID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(messageID))
                    return resolve({ error: true, message: 'Params invalid', status : 400 });
                // status = 2 trạn thái đã nhận tin nhắn , tin nhắn đã gửi thành công
                let infoMessage = await CHATTING__MESSAGE_COLL.findById(messageID);
                if(!infoMessage)
                    return resolve({ error: true, message: 'Message is exits', status : 403 });
                if(infoMessage.status < 100){
                    let infoMessageAfterUpdate = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, { status : 2 }, { new: true });
                    if(!infoMessageAfterUpdate)
                        return resolve({ error: true, message: 'Message is exits', status : 403 });

                    return resolve({ error: false, data: infoMessageAfterUpdate, status : 200 });
                }else{
                    return resolve({ error: false, data: "message_status_greater_than_100", message : 'message_status_greater_than_100',  status : 200 });
                }
                
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }


    // db.products.find({_id: {$gt: ObjectId("4fdbaf608b446b0477000142") }}).limit(1)
    // lấy tin nhắn trước và sau tin nhắn hiện tại ví dụ  [ tn1  tn2 tn3 tn4 tn5] truyền vào tìm tn2 sẽ lấy ra tn1 tn2 tn3
    getMessagefromAPoint({ messageID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(messageID))
                    return resolve({ error: true, message: 'invalid_object_id'});
                // status = 2 trạn thái đã nhận tin nhắn , tin nhắn đã gửi thành công
                let infoMessage = await CHATTING__MESSAGE_COLL.find({ _id: messageID });
                let conversationID = infoMessage[0].conversation;
                //.sort({createAt: -1})
                let listData  =  [];
            
                let infoMessage1 = await CHATTING__MESSAGE_COLL.find({_id: { $lte: messageID }, conversation : conversationID})
                    .populate({
                        path : 'sender',
                        populate : {
                            path : 'company'
                        }
                    })
                    .populate({
                        path : 'userFixedBug',
                        populate : {
                        path : 'company'
                        }
                    })
                    .populate({
                        path : 'conversation',
                        select :  '_id name' 
                    })
                    .populate({
                        path : 'files',
                        select :  'path _id type' 
                    })
                    .populate({
                        path : 'listSeen',
                        select :  'fullname _id email image' 
                    })
                    .populate({
                        path : 'app',
                        select :  '_id name' 
                    }).limit(3).sort({createAt: -1})

                let infoMessage2 = await CHATTING__MESSAGE_COLL.find({ _id: { $gte: messageID }, conversation : conversationID})
                    .populate({
                        path : 'sender',
                        populate : {
                            path : 'company'
                        }
                    })
                    .populate({
                        path : 'userFixedBug',
                        populate : {
                        path : 'company'
                        }
                    })
                    .populate({
                        path : 'conversation',
                        select :  '_id name' 
                    })
                    .populate({
                        path : 'files',
                        select :  'path _id type' 
                    })
                    .populate({
                        path : 'listSeen',
                        select :  'fullname _id email image' 
                    })
                    .populate({
                        path : 'app',
                        select :  '_id name' 
                    }).limit(3)

                if(!infoMessage2 && !infoMessage1)
                    return resolve({ error: true, data: 'cant_get_message' });

                if(infoMessage1){
                    infoMessage1.reverse();
                    listData = listData.concat(infoMessage1)
                }

                if(infoMessage2){
                    listData = listData.concat(infoMessage2)
                }
                listData = [...new Set(listData)];

                
                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }
}

exports.MODEL = new Model;