const BASE_ROUTE = '/products';

const CF_ROUTINGS_PRODUCTS = {
    
    REMOVE: `${BASE_ROUTE}/remove/:id`,
    ADD_TO_CART: `${BASE_ROUTE}/add-to-cart`,
    SHOW_CART: `${BASE_ROUTE}/show-cart`,
    FIND_BY_ID: `${BASE_ROUTE}/:id`,
    ORIGIN_APP: BASE_ROUTE,

    APP_ID: `602d065b16982545ecd5923c`,

}

exports.CF_ROUTINGS_PRODUCTS = CF_ROUTINGS_PRODUCTS;