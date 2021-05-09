const BASE_ROUTE = '/accounts';

const CF_ROUTINGS_ACCOUNT = {
    
    LOGIN: `${BASE_ROUTE}/sign-in`,
    REGISTER: `${BASE_ROUTE}/sign-up`,
    LOGOUT: `${BASE_ROUTE}/sign-out`,
    UPDATE_INFO: `${BASE_ROUTE}/:accountID`,
    ORIGIN_APP: BASE_ROUTE,

    CREATE_APP: `app/create-app`,
    UPDATE_APP: `app/update-app/:appID`,
    ADD_USER_APP: `app/add-user-app`,

    APP_ID: `602d0ac9377d6c453835070a`,
}

exports.CF_ROUTINGS_ACCOUNT = CF_ROUTINGS_ACCOUNT;