
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
                let { name } = ctx.params;
                let {_id : authorID} = ctx.meta.infoUser;
                let infoCategory = await CATEGORIES_MODEL.create({name, authorID});
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
         *
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

     /**
         * Update category by id
         * 
         * @actions
         * @param {String} categoryID 
         * @param {String} productID 
         *
         * @returns {Object} 
    **/

   update: {
        params: {
            categoryID: "string",
            productID: "string"
        },
        async handler(ctx) {
            try {
                let { categoryID, productID } = ctx.params;
                let infoCategory = await CATEGORIES_MODEL.update({categoryID, productID});
                return infoCategory;
            } catch (error) {
                return(error);
            }
        },
    },

    /**
         * Add product in category
         * 
         * @actions
         * @param {String} productID 
         * @param {String} categoryID 
         *
         * @returns {Object} 
    **/

   addProduct: {
        params: {
            productID: "string",
            categoryID: "string"
        },
        async handler(ctx) {
            try {
                let { productID, categoryID } = ctx.params;
                let infoAddProductInCategory = await CATEGORIES_MODEL.addProduct({productID, categoryID});
                return infoAddProductInCategory;
            } catch (error) {
                return(error);
            }
        },
    },
    
    /**
         * Get list categories
         * 
         * @actions
         *
         * @returns {Object} 
    **/

    getList: {
        async handler(ctx) {
            try {
                let infoCategory = await CATEGORIES_MODEL.getList();
                   
                return infoCategory;
            } catch (error) {
                return(error);
            }
        },
    },

    /**
         * Remove category
         * 
         * @actions
         * @param {String} id 
         *
         * @returns {Object} 
    **/

    remove: {
        params:{
            id: { type: "string" },
        },
        async handler(ctx) {
            try {
                let { id } = ctx.params;
                let infoCategory = await CATEGORIES_MODEL.remove({ctx, id});
                return infoCategory;
            } catch (error) {
                return(error);
            }
        },
    }
    
} 
