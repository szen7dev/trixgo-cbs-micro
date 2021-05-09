/**
 * COMMON ROUTE (DÙNG CHUNG CHO TẤT CẢ CÁC ỨNG DỤNG)
 */
const BASE_API = '/api';

const CF_ROUTINGS = {
    /**
     * CHUNG
     */
    MAIN: '/',
    APP: '/app',
    API: `${BASE_API}`,
    
    // cron job
    CRON_JOB: 'add-cron'
}

exports.CF_ROUTINGS = CF_ROUTINGS;