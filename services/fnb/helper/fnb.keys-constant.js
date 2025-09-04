exports.FNB_ACC = {
    bod: ['adwgo.winggo@gmail.com','hiepnh.winggo@gmail.com','hoangnh.winggo@gmail.com','thaobnbp.winggo@gmail.com','quynhntd.winggo@gmail.com','thupt1.winggo@gmail.com','hapt.winggo@gmail.com','hienpd.winggo@gmail.com','vyhth.winggo@gmail.com','toannd.winggo@gmail.com','nhungvth.winggo@gmail.com','kiemthuvien.dcop.trx@gmail.com','hiepnh.pmi@gmail.com','hiepnh.winggo@gmail.com','chinhnv.winggo@gmail.com','ninhdtp.winggo@gmail.com','huongnt.winggo@gmail.com','assistant.momy.trx@gmail.com','thupt.momychi@gmail.com','ninhdtp.momychi@gmail.com','toannd.momychi@gmail.com','quynhntd.momychi@gmail.com','nhuongquyen.winggo@gmail.com'],
    taichinh: ['adwgo.winggo@gmail.com','hiepnh.winggo@gmail.com','hoangnh.winggo@gmail.com','thaobnbp.winggo@gmail.com','quynhntd.winggo@gmail.com','thupt1.winggo@gmail.com','hapt.winggo@gmail.com','hienpd.winggo@gmail.com','vyhth.winggo@gmail.com','toannd.winggo@gmail.com','nhungvth.winggo@gmail.com','kiemthuvien.dcop.trx@gmail.com','hiepnh.pmi@gmail.com','hiepnh.winggo@gmail.com','chinhnv.winggo@gmail.com','ninhdtp.winggo@gmail.com','huongnt.winggo@gmail.com','assistant.momy.trx@gmail.com','thupt.momychi@gmail.com','ninhdtp.momychi@gmail.com','toannd.momychi@gmail.com','quynhntd.momychi@gmail.com','nhuongquyen.winggo@gmail.com','vund.winggo@gmail.com'],
    cskh: ['adwgo.winggo@gmail.com','hiepnh.winggo@gmail.com','hoangnh.winggo@gmail.com','thaobnbp.winggo@gmail.com','quynhntd.winggo@gmail.com','thupt1.winggo@gmail.com','hapt.winggo@gmail.com','hienpd.winggo@gmail.com','vyhth.winggo@gmail.com','toannd.winggo@gmail.com','nhungvth.winggo@gmail.com','kiemthuvien.dcop.trx@gmail.com','hiepnh.pmi@gmail.com','hiepnh.winggo@gmail.com','chinhnv.winggo@gmail.com','ninhdtp.winggo@gmail.com','huongnt.winggo@gmail.com','assistant.momy.trx@gmail.com','thupt.momychi@gmail.com','ninhdtp.momychi@gmail.com','toannd.momychi@gmail.com','quynhntd.momychi@gmail.com','nhuongquyen.winggo@gmail.com','vund.winggo@gmail.com'],
    man: ['adwgo.winggo@gmail.com','hiepnh.winggo@gmail.com','hoangnh.winggo@gmail.com','thaobnbp.winggo@gmail.com','quynhntd.winggo@gmail.com','thupt1.winggo@gmail.com','hapt.winggo@gmail.com','hienpd.winggo@gmail.com','vyhth.winggo@gmail.com','toannd.winggo@gmail.com','nhungvth.winggo@gmail.com','kiemthuvien.dcop.trx@gmail.com','hiepnh.pmi@gmail.com','hiepnh.winggo@gmail.com','chinhnv.winggo@gmail.com','ninhdtp.winggo@gmail.com','huongnt.winggo@gmail.com','ninhdtp.momychi@gmail.com','toannd.momychi@gmail.com','thupt.momychi@gmail.com', 'hoangthanhnga3108@gmail.com','assistant.momy.trx@gmail.com','thupt.momychi@gmail.com','ninhdtp.momychi@gmail.com','toannd.momychi@gmail.com','quynhntd.momychi@gmail.com','nhuongquyen.winggo@gmail.com','vund.winggo@gmail.com','hoatran72000@gmail.com','hoanglien2484@gmail.com','tvhien91@gmail.com','ngpthuy2@gmail.com','doanhoainam29032000@gmail.com','thuynt2109.winggo@gmail.com','thuynguyen676868@gmail.com','duynq.winggo@gmail.com','duyngoquoc98@gmail.com','hieunt.winggo@gmail.com']
}

exports.FNB_FACTOR = {
    // Tỷ lệ tích điểm cho đơn off (%)
    credit: {
        level1: { purchasedOffValue: 0, factor: 3 }, // Thông thường
        level2: { purchasedOffValue: 1000000, factor: 3 }, // Bạc (tuần mua 1 lần/mua trong 6 tháng)
        level3: { purchasedOffValue: 2000000, factor: 3 }, // Vàng (tuần mua 2 lần/mua trong 6 tháng)
        level4: { purchasedOffValue: 5000000, factor: 3 }, // Kim Cương (ngày mua 1 lần/mua trong 6 tháng)
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
    { value: 4, text: 'Đêm' },
]

exports.FNB_SEASONS = [
    { value: 1, text: 'Xuân' },
    { value: 2, text: 'Hạ' },
    { value: 3, text: 'Thu' },
    { value: 4, text: 'Đông' },
]

exports.FNB_SALES_CHANNEL = [
    { value: 1, text: 'Offline' },
    { value: 2, text: 'Grab Food' },
    { value: 3, text: 'Shopee Food' },
    { value: 4, text: 'Gojek' },
    { value: 5, text: 'Baemin' },
    { value: 6, text: 'Loship' },
    { value: 7, text: 'Be' },
    { value: 8, text: 'TikTok Shop' },
    { value: 9, text: 'Shopee' },
    { value: 10, text: 'Lazada' },
    { value: 11, text: 'FB Reels' },
    { value: 12, text: 'Xanh Ngon' },
    { value: 13, text: 'Egets' },
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

// Cơ chế trả hoa hồng Affiliate
exports.FNB_AFFILIATE_COM = [
    { amount: 1000000, rate: 16 }, // Sale trực tiếp
    { amount: 1000000, rate: 2.75 }, // Cấp 1
    { amount: 2000000, rate: 2.25 }, // Cấp 2
    { amount: 5000000, rate: 2.20 }, // Cấp ...
    { amount: 5000000, rate: 1.75 },
    { amount: 5000000, rate: 1.50 },
    { amount: 5000000, rate: 1.25 },
    { amount: 5000000, rate: 1.00 },
    { amount: 5000000, rate: 0.75 },
    { amount: 5000000, rate: 0.50 },
]

exports.CRM_STATUS = [
    { value: 1, text: 'Chưa xử lý' },
    { value: 2, text: 'Hoàn thành' },
]

exports.CRM_TYPES = [
    { value: 1, text: 'Lỗi chủ quan' },
    { value: 2, text: 'Lỗi khách quan' },
]