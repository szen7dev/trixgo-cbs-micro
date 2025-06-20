exports.PCM_STATUS_TASK = [
    { value: 1, text: 'Khởi tạo/sắp triển khai', class: 'tajic-status-btn-open', backgroud: 'ff0000', key: 'open' },
    { value: 2, text: 'Đang triển khai', class: 'tajic-status-btn-in-progress', backgroud: '00aaff', key: 'in_progress' },
    { value: 3, text: 'Hoàn thành', class: 'tajic-status-btn-completed', backgroud: '5fba7d', key: 'completed' },
    { value: 4, text: 'Treo lại', class: 'tajic-status-btn-deferred', backgroud: '8f1aac', key: 'deferred' },
    { value: 5, text: 'Chờ người khác giải quyết', class: 'tajic-status-btn-waiting', backgroud: '4d4dff', key: 'waiting_on_someone_else' },
    { value: 6, text: 'Tiếp tục theo dõi', class: 'tajic-status-btn-follow-up', backgroud: '5bc0de', key: 'follow_up' },
    { value: 7, text: 'Khóa đóng', class: 'tajic-status-btn-follow-up', backgroud: '5bc0de', key: 'follow_up' },
    { value: 8, text: 'Chưa đủ điều kiện duyệt', class: 'tajic-status-btn-follow-up', backgroud: 'f6bb29', key: 'follow_up' },
    { value: 9, text: 'Chất lượng kiểm tra không đạt', class: 'tajic-status-btn-follow-up', backgroud: 'ffb3b3', key: 'follow_up' },
]

exports.INSURANCE_STATUS = [
    { value: 1, text: 'Chưa nộp' },
    { value: 2, text: 'Đã nộp' },
    { value: 3, text: 'Thêm mới' },
]

exports.TEMPLATE_NOTIFICATION = [
    {
        key: 'new_post',
        messages: {
            vi: {
                title: 'Bài viết mới quan trọng!!!',
                description: 'Hãy vào trang tin tức của Lamin sau {minute} phút nữa để đọc bài nhé'
            },
            en: {
                title: 'Its bedtime!!!',
                description: 'Finish this to-do item in just {minute} minutes'
            }
        }
    },
    {
        key: 'sleep_reminder',
        messages: {
            vi: {
                title: 'Tới giờ đi ngủ rồi!!!',
                description: 'Hoàn thành mục việc-cần-làm-này chỉ với {minute} phút nào'
            },
            en: {
                title: 'Its bedtime!!!',
                description: 'Finish this to-do item in just {minute} minutes'
            }
        }
    },
    {
        key: 'daily_input_reminder',
        messages: {
            vi: {
                title: 'Bạn quên nhập liệu hôm nay rồi!',
                description: 'Chỉ mất 1 phút để hoàn tất nhập liệu mỗi ngày – vào nhập ngay nhé'
            },
            en: {
                title: 'You forgot to log your day!',
                description: 'It only takes 1 minute to complete your daily input – let’s do it now!'
            }
        }
    }
]