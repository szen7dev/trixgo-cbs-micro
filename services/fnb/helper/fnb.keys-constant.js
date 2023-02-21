exports.FNB_FACTOR = {
    // Tỷ lệ tích điểm cho đơn off (%)
    credit: {
        level1: { purchasedValue: 0, factor: 2 }, // Thông thường
        level2: { purchasedValue: 1000000, factor: 2 }, // Bạc (tuần mua 1 lần/mua trong 6 tháng)
        level3: { purchasedValue: 2000000, factor: 2 }, // Vàng (tuần mua 2 lần/mua trong 6 tháng)
        level4: { purchasedValue: 5000000, factor: 2 }, // Kim Cương (ngày mua 1 lần/mua trong 6 tháng)
    },
    vatRate: 10, // Thuế VAT (%)
}

exports.FNB_NEW = [
    { value: 1, text: 'Mới' },
    { value: 2, text: 'Cũ' },
]

exports.FNB_NON_RESIDENT = [
    { value: 1, text: 'Biết tên' },
    { value: 2, text: 'Vãng lai' },
]

exports.FNB_INTERNAL = [
    { value: 1, text: 'Trong hệ thống' },
    { value: 2, text: 'Nhượng quyền' },
]

exports.FNB_SHIFT_TYPES = [
    { value: 1, text: 'Sáng' },
    { value: 2, text: 'Chiều' },
    { value: 3, text: 'Tối' },
]

exports.FNB_SEASONS = [
    { value: 1, text: 'Xuân' },
    { value: 2, text: 'Hạ' },
    { value: 3, text: 'Thu' },
    { value: 4, text: 'Đông' },
]

exports.FNB_SALES_CHANNEL = [
    { value: 1, text: 'Offline' },
    { value: 2, text: 'Grab' },
    { value: 3, text: 'Shopee' },
    { value: 4, text: 'Gojek' },
    { value: 5, text: 'Baemin' },
    { value: 6, text: 'Loship' },
    { value: 7, text: 'Bee' },
]

exports.FNB_PAYMENT_METHOD = [
    { value: 1, text: 'Tiền mặt' },
    { value: 2, text: 'Chuyển khoản' },
]

exports.FNB_SERVICE = [
    { value: 1, text: 'Tại quán' },
    { value: 2, text: 'Giao hàng (App)' },
    { value: 3, text: 'Mang đi (Mua mang đi)' },
]

exports.FNB_STATUS = [
    { value: 1, text: 'Đang giao hàng/Phục vụ' },
    { value: 2, text: 'Hoàn tiền một phần' },
    { value: 3, text: 'Hoàn tiền toàn bộ' },
    { value: 4, text: 'Đã hủy' },
    { value: 5, text: 'Hoàn thành' },
]