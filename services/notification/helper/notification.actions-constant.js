// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_NOTIFICATION';
const LOG      = 'LOG';

const CF_ACTIONS_NOTIFICATION = {
    INSERT                        : `${BASE_ACTIONS}_${LOG}_INSERT`,
}

exports.CF_ACTIONS_NOTIFICATION = CF_ACTIONS_NOTIFICATION;