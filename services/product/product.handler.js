
let PRODUCT_MODEL    		    = require('./product.model').MODEL;

module.exports = {

    /**
         * Create product
         * 
         * @actions
         * @param {String} authorID header
         * @param {String} name 
         * @param {String} price 
         * @param {String} decription 
         * @param {String} category 
         *
         * @returns {Object} 
    **/
    create: {
        params:{
            name: { type: "string" },
            price: { type: "string" },
            decription: { type: "string" },
            categoryID: { type: "string" },
        },
        async handler(ctx) {
            try {
                let {_id: authorID} = ctx.meta.infoUser;
                let { name, price, decription, categoryID } = ctx.params;
                let infoProduct = await PRODUCT_MODEL.create({ctx, name, price, decription, categoryID, authorID});
                
                if(infoProduct.error){
                    return { error: true, message: infoProduct.message }
                }

                return infoProduct;
            } catch (error) {
                return(error);
            }
        },
    },

    /**
         * Get list products
         * 
         * @actions
         * @returns {Object} 
    **/
    getList: {
        async handler(ctx) {
            let listProducts = await ctx.call("products.find", { populate: ["category"]});
            return listProducts;
        },
    },

     /**
         * Find product by id
         * 
         * @actions
         * @param {String} productID 
         *
         * @returns {Object} 
    **/

    findById: {
        params:{
            productID: { type: "string" }
        },
        async handler(ctx) {
            try {
                let productID = ctx.params.productID;
                let infoProduct = await PRODUCT_MODEL.findById({productID});
                return infoProduct;
            } catch (error) {
                return(error);
            }
        },
     
    },

     /**
         * Remove product
         * 
         * @actions
         * @param {String} id 
         * @param {String} categoryID 
         *
         * @returns {Object} 
    **/

    remove: {
        params:{
            id: { type: "string" },
            categoryID: { type: "string" },
        },
        async handler(ctx) {
            try {
                let {id, categoryID} = ctx.params;
                let infoProduct = await PRODUCT_MODEL.remove({ctx, id, categoryID});
                return infoProduct;
            } catch (error) {
                return(error);
            }
        },
        
    },

    /**
         * Remove many product then category remove
         * 
         * @actions
         * @param {String} categoryID 
         *
         * @returns {Object} 
    **/

   removeFromCate: {
    params:{
        categoryID: { type: "string" },
    },
    async handler(ctx) {
        try {
            let {categoryID} = ctx.params;
            let infoProduct = await PRODUCT_MODEL.removeFromCate({categoryID});
            return infoProduct;
        } catch (error) {
            return(error);
        }
    },
    
},
    
     /**
         * Add product to cart
         * 
         * @actions
         * @param {String} productID 
         *
         * @returns {Object} 
    **/

    // addToCart: {
    //     async handler(ctx) {
    //         try {
    //             let {productID} = ctx.params;
    //             let infoCart = await PRODUCT_MODEL.addToCart({productID});
    //             if(infoCart){
    //                 await client.sadd('MyCart', JSON.stringify(infoCart.data), function(err, reply){
	// 					if(err){
	// 						throw new MoleculerClientError("IdProduct Existed!", 404, "NAME_PRODUCT_EXISTED");
	// 					} else {
	// 						return reply;
	// 					}
	// 				});
    //             }
    //             return infoCart;
    //         } catch (error) {
    //             return(error);
    //         }
    //     },
        
    // },

    /**
         * Show all cart
         * 
         * @actions
         *
         * @returns {Object} 
    **/

    // showCart: {
    //     async handler(ctx) {
    //         try {
    //             let infoCart = await PRODUCT_MODEL.showCart('MyCart');
    //             return infoCart;
    //         } catch (error) {
    //             return(error);
    //         }
    //     },
    // },
} 
