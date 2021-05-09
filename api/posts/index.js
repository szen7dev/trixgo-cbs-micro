
let POST_MODEL    		    = require('../../models/core/posts').MODEL;
const Redis                 = require("ioredis");
const redis                 = new Redis()

module.exports = {

    /**
         * Create post
         * 
         * @actions
         * @param {String} authorID 
         * @param {String} title 
         * @param {String} content 
         * @param {String} type 
         *
         * @returns {Object} 
    **/

    create: {
        async handler(ctx) {
            try {
                let authorID = ctx.meta.userID;
                let { title, content, type } = ctx.params;
                let infoPost = await POST_MODEL.create({title, content, type, authorID});
                return infoPost;
            } catch (error) {
                return(error);
            }
        },
    },

    /**
         * Get list post
         * 
         * @actions
         *
         * @returns {Object} 
    **/

    getList: {
        async handler(ctx) {
            try {
                let infoPost = await POST_MODEL.getList();
                return infoPost;
            } catch (error) {
                return(error);
            }
        },
    },

    /**
         * Remove post
         * 
         * @actions
         * @param {String} postID 
         *
         * @returns {Object} 
    **/

    remove: {
        params:{
            postID: { type: "string" },
        },
        async handler(ctx) {
            try {
                let {postID} = ctx.params;
                let infoPost = await POST_MODEL.remove({postID});
                return infoPost;
            } catch (error) {
                return(error);
            }
        },
        
    },

    /**
         * Comment in post
         * 
         * @actions
         * @param {String} authorID 
         * @param {String} postID 
         * @param {String} content 
         * @param {String} parent  ID comment cha ( nếu là rep coment)
         *
         * @returns {Object} 
    **/

    addComment: {
        async handler(ctx) {
            try {
                let {_id: authorID} = ctx.meta.inforUser;
                let { postID, content, parent } = ctx.params;
                let infoPost = await POST_MODEL.addComment({authorID, postID, content, parent});
                return infoPost;
            } catch (error) {
                return(error);
            }
        },
        
    },

    /**
         * Remove comment in post
         * 
         * @actions
         * @param {String} authorID 
         * @param {String} commentID 
         *
         * @returns {Object} 
    **/

    removeComment: {
        async handler(ctx) {
            try {
                let {_id: authorID} = ctx.meta.inforUser;
                let {commentID} = ctx.params;
                let infoPost = await POST_MODEL.removeComment({authorID, commentID});
                return infoPost;
            } catch (error) {
                return(error);
            }
        },
        
    },
    
} 
