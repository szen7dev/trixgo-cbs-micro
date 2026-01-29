const BASE_ROUTE = '/crm';

const CF_ROUTINGS_CRM = {
    // ==================== CRM_GROW_TRACK ======================== //
    CRM_GROW_TRACK                              : `${BASE_ROUTE}/grow_track`,
    CRM_GROW_TRACK_GET_LIST_BY_PROPERTY         : `${BASE_ROUTE}/grow_track/get-list-by-property`,
    CRM_GROW_TRACK_EXPORT_EXCEL                 : `${BASE_ROUTE}/grow_track/export-excel`,
    CRM_GROW_TRACK_IMPORT_EXCEL                 : `${BASE_ROUTE}/grow_track/import-from-excel`,
       
    // ==================== CRM_HABIT ======================== //
    CRM_HABIT                                   : `${BASE_ROUTE}/habit`,
    CRM_HABIT_GET_LIST_BY_PROPERTY              : `${BASE_ROUTE}/habit/get-list-by-property`,
    CRM_HABIT_IMPORT_EXCEL                      : `${BASE_ROUTE}/habit/import-from-excel`,
    CRM_HABIT_EXPORT_EXCEL                      : `${BASE_ROUTE}/habit/export-excel`,
    CRM_HABIT_ADD_MANY                          : `${BASE_ROUTE}/habit/add-many`,

    // ==================== CRM_HABIT_TRACK ======================== //
    CRM_HABIT_TRACK                             : `${BASE_ROUTE}/habit_track`,
    CRM_HABIT_TRACK_GET_LIST_BY_PROPERTY        : `${BASE_ROUTE}/habit_track/get-list-by-property`,
    CRM_HABIT_TRACK_EXPORT_EXCEL                : `${BASE_ROUTE}/habit_track/export-excel`,
    CRM_HABIT_TRACK_IMPORT_EXCEL                : `${BASE_ROUTE}/habit_track/import-from-excel`,

    // ==================== CRM_SURVEY ======================== //
    CRM_SURVEY                                  : `${BASE_ROUTE}/survey`,
    CRM_SURVEY_GET_LIST_BY_PROPERTY             : `${BASE_ROUTE}/survey/get-list-by-property`,
    CRM_SURVEY_EXPORT_EXCEL                     : `${BASE_ROUTE}/survey/export-excel`,

    // ==================== CRM_SURVEY_RESULT ======================== //
    CRM_SURVEY_RESULT                           : `${BASE_ROUTE}/survey_result`,
    CRM_SURVEY_RESULT_GET_LIST_BY_PROPERTY      : `${BASE_ROUTE}/survey_result/get-list-by-property`,
    CRM_SURVEY_RESULT_EXPORT_EXCEL              : `${BASE_ROUTE}/survey_result/export-excel`,

    // ==================== CRM_SEARCH_KEYWORD ======================== //
    CRM_SEARCH_KEYWORD                          : `${BASE_ROUTE}/search_keyword`,
    CRM_SEARCH_KEYWORD_GET_LIST_BY_PROPERTY     : `${BASE_ROUTE}/search_keyword/get-list-by-property`,
    CRM_SEARCH_KEYWORD_EXPORT_EXCEL             : `${BASE_ROUTE}/search_keyword/export-excel`,
    
    // ==================== CRM_COMBO ======================== //
    CRM_COMBO                                   : `${BASE_ROUTE}/combo`,
    CRM_COMBO_GET_LIST_BY_PROPERTY              : `${BASE_ROUTE}/combo/get-list-by-property`,
    CRM_COMBO_EXPORT_EXCEL                      : `${BASE_ROUTE}/combo/export-excel`,
    CRM_COMBO_BEST_SELLER                       : `${BASE_ROUTE}/combo/best-seller`,

    // ==================== CRM_VNG_FUND ======================== //
    CRM_VNG_FUND                                : `${BASE_ROUTE}/vng_fund`,
    CRM_VNG_FUND_GET_LIST_BY_PROPERTY           : `${BASE_ROUTE}/vng_fund/get-list-by-property`,
    CRM_VNG_FUND_EXPORT_EXCEL                   : `${BASE_ROUTE}/vng_fund/export-excel`,

    // ==================== CRM_VNG_EVENT ======================== //
    CRM_VNG_EVENT                                : `${BASE_ROUTE}/vng_event`,
    CRM_VNG_EVENT_GET_LIST_BY_PROPERTY           : `${BASE_ROUTE}/vng_event/get-list-by-property`,
    CRM_VNG_EVENT_EXPORT_EXCEL                   : `${BASE_ROUTE}/vng_event/export-excel`,    

    // ==================== CRM_REGISTER ======================== //
    CRM_REGISTER                               : `${BASE_ROUTE}/register`,
    CRM_REGISTER_GET_LIST_BY_PROPERTY          : `${BASE_ROUTE}/register/get-list-by-property`,
    CRM_REGISTER_EXPORT_EXCEL                  : `${BASE_ROUTE}/register/export-excel`,

    // ==================== CRM_STORY ======================== //
    CRM_STORY                                  : `${BASE_ROUTE}/story`,
    CRM_STORY_GET_LIST_BY_PROPERTY             : `${BASE_ROUTE}/story/get-list-by-property`,
    CRM_STORY_EXPORT_EXCEL                     : `${BASE_ROUTE}/story/export-excel`,

    // ==================== CRM_POINT_TRANSACTION ======================== //
    CRM_POINT_TRANSACTION                                   : `${BASE_ROUTE}/point_transaction`,
    CRM_POINT_TRANSACTION_GET_LIST_BY_PROPERTY              : `${BASE_ROUTE}/point_transaction/get-list-by-property`,
    CRM_POINT_TRANSACTION_EXPORT_EXCEL                      : `${BASE_ROUTE}/point_transaction/export-excel`,

    //================================CRM_CUSTOMER_SERVICE=======================================//
    CRM_CUSTOMER_SERVICE                                 : `${BASE_ROUTE}/customer_service`,
    CRM_CUSTOMER_SERVICE_GET_LIST_BY_PROPERTY            : `${BASE_ROUTE}/customer_service/get-list-by-property`,
    CRM_CUSTOMER_SERVICE_DOWNLOAD_TEMPLATE_EXCEL         : `${BASE_ROUTE}/customer_service/download-template-excel`,
    CRM_CUSTOMER_SERVICE_IMPORT_FROM_EXCEL               : `${BASE_ROUTE}/customer_service/import-from-excel`,
    CRM_CUSTOMER_SERVICE_EXPORT_EXCEL                    : `${BASE_ROUTE}/customer_service/export-excel`,

    // ==================== CRM_AWARD ======================== //
    CRM_AWARD                                   : `${BASE_ROUTE}/award`,
    CRM_AWARD_GET_LIST_BY_PROPERTY              : `${BASE_ROUTE}/award/get-list-by-property`,
    CRM_AWARD_EXPORT_EXCEL                      : `${BASE_ROUTE}/award/export-excel`,
    CRM_AWARD_CAPTURE           		        : `${BASE_ROUTE}/award/capture`,
}

exports.CF_ROUTINGS_CRM = CF_ROUTINGS_CRM;