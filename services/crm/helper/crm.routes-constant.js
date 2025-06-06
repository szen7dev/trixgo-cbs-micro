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
    CRM_HABIT_EXPORT_EXCEL                      : `${BASE_ROUTE}/habit/export-excel`,

    // ==================== CRM_HABIT_TRACK ======================== //
    CRM_HABIT_TRACK                             : `${BASE_ROUTE}/habit_track`,
    CRM_HABIT_TRACK_UPDATE_MANY                 : `${BASE_ROUTE}/habit_track/update-many`,
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
}

exports.CF_ROUTINGS_CRM = CF_ROUTINGS_CRM;