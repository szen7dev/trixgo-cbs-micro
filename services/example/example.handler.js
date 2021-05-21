
let CATEGORIES_MODEL    		= require('./category.model').MODEL;
module.exports = {

    /**
         * Create category
         * 
         * @actions
         * @param {String} authorID 
         * @param {String} name 
         *
         * @returns {Object} 
    **/

    create: {
        params: {
            name: "string"
        },
        async handler(ctx) {
            try {
                let { name }            = ctx.params;
                let { _id : authorID }  = ctx.meta.infoUser;
                let infoCategory        = await CATEGORIES_MODEL.create({ name, authorID });

                return infoCategory;
            } catch (error) {
                return(error);
            }
        },
    },

    /**
         * Find category by id
         * 
         * @actions
         * @param {String} categoryID 
         * @returns {Object} 
    **/

    findById: {
        params: {
            categoryID: "string"
        },
        async handler(ctx) {
            try {
                let { categoryID } = ctx.params;
                let infoCategory = await CATEGORIES_MODEL.findById({categoryID});
                return infoCategory;
            } catch (error) {
                return(error);
            }
        },
    },
} 
