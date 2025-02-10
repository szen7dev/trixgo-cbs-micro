//FILE CONFIG || VARIABLE CONSTANT

 /**
 * PHÂN LOẠI
    1-Văn Bản Lĩnh vực hồ sơ
    2-Văn Bản Tính chất hồ sơ
    3-Lĩnh vực kinh doanh
    4-Khách hàng phân loại
    5-Công việc, Phân loại khác
    6-Nhân sự, Trình độ
    7-Nhân sự, Chuyên ngành
    8-Nhận sự, Loại HDLD
    9-Nhân sự tình trạng làm việc
    10-Nhân sự Thâm niên
    11-Hành trình khách hàng (CRM)
    12-Hồ sơ chi tiết từng hành trình khách hàng (CRM)
    13-Nhân sự, chúc vụ
    14-Nhân sự loại chứng chỉ
    15-Nhân sự, Nội dung chứng chỉ
    16-Hợp đồng phân loại công nợ
    17-Hợp đồng nguyên nhân phát sinh
    18-Chung-Nguyên nhân thất bại
    20-Chung các lỗi hay gặp
    21- Công việc, Đánh giá chất lượng
    22-Theo service (áp dụng cho message nps)
    23-Theo service (áp dụng cho message nps)(Không hài lòng)
    24-Kênh bán hàng
*/
exports.DOCTYPE_TYPE = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, 23,24];

exports.CONTACT_CLASSIFY = [
    { value: 1, text: 'Nhân viên' },
    { value: 2, text: 'Khách hàng' },
    { value: 3, text: 'Nhà cung cấp' },
]

exports.HUMAN_CLASSIFY = [
    { value: 1, text: 'Nhân viên' },
    { value: 2, text: 'Cộng tác viên' },
    { value: 3, text: 'Chuyên gia' },
]

exports.CONTACT_GENDER = [
    { value: 1, text: 'Nam' },
    { value: 2, text: 'Nữ' },
    { value: 3, text: 'Khác' },
]

exports.PERSONAL_STATUS = [
    { value: 1, text: 'T' },
    { value: 2, text: 'A' },
]

exports.INSURANCE_STATUS = [
    { value: 1, text: 'Chưa nộp' },
    { value: 2, text: 'Đã nộp' },
    { value: 3, text: 'Thêm mới' },
]

exports.CONTACT_POLICY = [
    { value: 1, text: 'Không' },
    { value: 2, text: 'Bộ đội phục viên' },
    { value: 3, text: 'Con thương bệnh binh' },
    { value: 4, text: 'Gia đình chính sách' },
]

exports.CONTACT_NEW = [
    { value: 1, text: 'Mới' },
    { value: 2, text: 'Cũ' },
    { value: 3, text: 'Vãng lai' },
]

exports.PAYMENT_STATUS = [
    { value: 1, text: 'Chưa giao dịch' },
    { value: 2, text: 'Đang giao dịch' },
    { value: 3, text: 'Ngừng giao dịch' },
]

exports.DOCUMENT_CLASSIFY = [
    { value: 1, text: 'Lịch sử làm việc ở các đơn vị' },
    { value: 2, text: 'Kinh nghiệm thực tế tham gia tại các Dự án' },
    { value: 3, text: 'Lịch sử làm việc theo Quyết định bổ nhiệm' },
    { value: 4, text: 'Trình độ học vấn + Chuyên ngành đào tạo' },
    { value: 5, text: 'Bằng cấp chứng chỉ' },
    { value: 6, text: 'Hồ sơ nhân sự khác' },
]

exports.DOCUMENT_GRADE = [
    { value: 1, text: 'Hạng 1' },
    { value: 2, text: 'Hạng 2' },
    { value: 3, text: 'Hạng 3' },
    { value: 4, text: 'Hạng 4' },
]

exports.DOCUMENT_STATUS = [
    { value: 1, text: 'Còn hiệu lực' },
    { value: 2, text: 'Hết hiệu lực' },
]

exports.ITEM_ACCOUNTS = [
    { 
        name: 111, description: 'Tiền mặt',
        sub: [
            {
                name: 1111, description: 'Tiền Việt Nam',
                sub2: [
                    { name: 11111, description: 'Quỹ tiền mặt 1' },
                    { name: 11112, description: 'Quỹ tiền mặt 2' }
                ]
            },
            { name: 1112, description: 'Ngoại tệ' },
            { name: 1113, description: 'Vàng tiền tệ' }
        ]
    },
    { 
        name: 112, description: 'Tiền gửi Ngân hàng',
        sub: [
            {
                name: 1121, description: 'Tiền Việt Nam',
                sub2: [
                    { name: 11211, description: 'Ngân hàng 1' },
                    { name: 11212, description: 'Ngân hàng 2' }
                ]
            },
            { name: 1122, description: 'Ngoại tệ' },
            { name: 1123, description: 'Vàng tiền tệ' }
        ]
    },
    { 
        name: 113, description: 'Tiền đang chuyển',
        sub: [
            { name: 1131, description: 'Tiền Việt Nam' },
            { name: 1132, description: 'Ngoại tệ' }
        ]
    },
    { 
        name: 121, description: 'Chứng khoán kinh doanh',
        sub: [
            { name: 1211, description: 'Cổ phiếu' },
            { name: 1212, description: 'Trái phiếu' },
            { name: 1218, description: 'Chứng khoán và công cụ tài chính khác' }
        ]
    },
    { 
        name: 128, description: 'Đầu tư nắm giữ đến ngày đáo hạn',
        sub: [
            { name: 1281, description: 'Tiền gửi có kì hạn' },
            { name: 1282, description: 'Trái phiếu' },
            { name: 1283, description: 'Cho vay' },
            { name: 1288, description: 'Các khoản đầu tư nắm giữ đến ngày đáo hạn' }
        ]
    },
    { 
        name: 131, description: 'Phải thu của khách hàng'
    },
    { 
        name: 133, description: 'Thuế GTGT được khấu trừ',
        sub: [
            { name: 1331, description: 'Thuế GTGT được khấu trừ của hàng hóa, dịch vụ' },
            { name: 1332, description: 'Thuế GTGT được khấu trừ của TSCĐ' },
        ]
    },
    { 
        name: 136, description: 'Phải thu nội bộ',
        sub: [
            { name: 1361, description: 'Vốn kinhh doanh ở các đơn vị trực thộc' },
            { name: 1362, description: 'Phải thu nội bộ về chênh lệch tỷ giá' },
            { name: 1363, description: 'Phải thu nội bộ vệ chi phí đi vay đủ điều kiện được vốn hóa' },
            { name: 1368, description: 'Phải thu nội bộ khác' }
        ]
    },
    { 
        name: 138, description: 'Phải thu khác',
        sub: [
            { name: 1381, description: 'Tài sản thiếu chờ xử lý' },
            { name: 1385, description: 'Phải thu về cổ phần hoá' },
            { name: 1388, description: 'Phải thu khác' }
        ]
    },
    { 
        name: 141, description: 'Tạm ứng',
    },
    { 
        name: 151, description: 'Hàng mua đang đi đường',
    },
    { 
        name: 152, description: 'Nguyên liệu, vật liệu',
    },
    { 
        name: 153, description: 'Công cụ, dụng cụ',
        sub: [
            { name: 1531, description: 'Công cụ, dụng cụ' },
            { name: 1532, description: 'Bao bì luân chuyển' },
            { name: 1533, description: 'Đồ dùng cho thuê' },
            { name: 1534, description: 'Thiết bị, phụ tùng thay thế' }
        ]
    },
    { 
        name: 154, description: 'Chi phí sản xuất, kinh doanh dở dang',
    },
    { 
        name: 155, description: 'Thành phẩm',
        sub: [
            { name: 1551, description: 'Thành phẩm nhập kho' },
            { name: 1557, description: 'Thành phẩm bất động sản' }
        ]
    },
    { 
        name: 156, description: 'Hàng hóa',
        sub: [
            { name: 1561, description: 'Giá mua hàng hóa' },
            { name: 1562, description: 'Chi phí thu mua hàng hóa' },
            { name: 1567, description: 'Hàng hóa bất động sản' },
        ]
    },
    { 
        name: 157, description: 'Hàng gửi đi bán',
    },
    { 
        name: 158, description: 'Hàng hóa kho bảo thuế',
    },
    { 
        name: 161, description: 'Chi sự nghiệp',
        sub: [
            { name: 1611, description: 'Chi sự nghiệp năm trước' },
            { name: 1612, description: 'Chi sự nghiệp năm nay' }
        ]
    },
    { 
        name: 171, description: 'Giao dịch mua bán lại trái phiếu chính phủ',
    },
    { 
        name: 211, description: 'Tài sản cố định hữu hình',
        sub: [
            { name: 2111, description: 'Nhà cửa, vật kiến trúc' },
            { name: 2112, description: 'Máy móc thết bị' },
            { name: 2113, description: 'Phương tiện vận tải, truyền dẫn' },
            { name: 2114, description: 'Thiết bị, dụng cụ quản lý' },
            { name: 2115, description: 'Cây lâu năm, súc vật làm việc và cho sản phẩm' },
            { name: 2118, description: 'TSCĐ khác' }
        ]
    },
    { 
        name: 212, description: 'Tài sản cố định thuê tài chính',
        sub: [
            { name: 2121, description: 'TSCĐ hữu hình thuê tài chính' },
            { name: 2122, description: 'TSCĐ vô hình thuê tài chính' }
        ]
    },
    { 
        name: 213, description: 'Tài sản cố định vô hình',
        sub: [
            { name: 2131, description: 'Quyền sử dụng đất' },
            { name: 2132, description: 'Quyền phát hành' },
            { name: 2133, description: 'Bản quyền, bằng sáng chế' },
            { name: 2134, description: 'Nhãn hiệu, tên thương mại' },
            { name: 2135, description: 'Chương trình phần mềm' },
            { name: 2136, description: 'Giấy phép và giấy phép nhượng quyền' },
            { name: 2138, description: 'TSCĐ vô hình khác' }
        ]
    },
    { 
        name: 214, description: 'Hao mòn tài sản cố định',
        sub: [
            { name: 2141, description: 'Hao mòn TSCĐ hữu hình' },
            { name: 2142, description: 'Hao mòn TSCĐ thuê tài chính' },
            { name: 2143, description: 'Hao mòn TSCĐ vô hình' },
            { name: 2147, description: 'Hao mòn bất động sản đầu tư' }
        ]
    },
    { 
        name: 217, description: 'Bất động sản đầu tư',
    },
    { 
        name: 221, description: 'Đầu tư vào Công ty con',
    },
    { 
        name: 222, description: 'Đầu tư vào Công ty liên doanh, liên kết',
    },
    { 
        name: 228, description: 'Đầu tư khác',
         sub: [
            { name: 2281, description: 'Đầu tư góp vốn vào đơn vị khác' },
            { name: 2288, description: 'Đầu tư khác' }
        ]
    },
    { 
        name: 229, description: 'Dự phòng tổn thất tài sản',
         sub: [
            { name: 2291, description: 'Dự phòng giảm giá chứng khoán kinh doanh' },
            { name: 2292, description: 'Dự phòng tổn thất đầu tư vào đơn vị khác' },
            { name: 2293, description: 'Dự phòng phải thu khó đòi' },
            { name: 2294, description: 'Dự phòng gảm giá hàng tồn kho' }
        ]
    },
    { 
        name: 241, description: 'Xây dựng cơ bản dở dang',
         sub: [
            { name: 2411, description: 'Mua sắm TSCĐ' },
            { name: 2412, description: 'Xây dựng cơ bản' },
            { name: 2413, description: 'Sửa chữa lớn TSCĐ' }
        ]
    },
    { 
        name: 242, description: 'Chi phí trả trước',
    },
    { 
        name: 243, description: 'Tài sản thuế thu nhập hoãn lại',
    },
    { 
        name: 244, description: 'Cầm cố, thế chấp, ký quỹ, ký cược',
    },
    { 
        name: 331, description: 'Phải trả cho người bán',
    },
    { 
        name: 333, description: 'Thuế và các khoản phải nộp Nhà nước',
        sub: [
            {
                name: 3331, description: 'Thuế giá trị gia tăng phải nộp',
                sub2: [
                    { name: 33311, description: 'Thuế GTGT đầu ra' },
                    { name: 33312, description: 'Thuế GTGT hàng nhập khẩu' }
                ]
            },
            { name: 3332, description: 'Thuế tiêu thụ đặc biệt' },
            { name: 3333, description: 'Thuế xuất, nhập khẩu' },
            { name: 3334, description: 'Thuế thu nhập doanh nghiệp' },
            { name: 3335, description: 'Thuế thu nhập cá nhân' },
            { name: 3336, description: 'Thuế tài nguyên' },
            { name: 3337, description: 'Thuế nhà đất, tiền thuê nhà' },
            {
                name: 3338, description: 'Thuế bảo vệ mội trường và các loại thuế khác',
                sub2: [
                    { name: 33381, description: 'Thuế bảo vệ môi trường' },
                    { name: 33382, description: 'Các loại thuế khác' }
                ]
            },
            { name: 3339, description: 'Phí, lệ phí và các khoản phải nộp khác' }
        ]
    },
    { 
        name: 334, description: 'Phải trả người lao động',
         sub: [
            { name: 3341, description: 'Phải trả công nhân viên' },
            { name: 3348, description: 'Phải trả người lao động khác' }
        ]
    },
    { 
        name: 335, description: 'Chi phí phải trả',
    },
    { 
        name: 336, description: 'Phải trả nội bộ',
         sub: [
            { name: 3361, description: 'Phải trả nội bộ về vốn kinh doanh' },
            { name: 3362, description: 'Phải trả nội bộ về chênh lệch tỷ giá' },
            { name: 3363, description: 'Phải trả nội bộ về chi phí đi vay đủ điều kiện được vốn hoá' },
            { name: 3368, description: 'Phải trả nội bộ khác' },
        ]
    },
    { 
        name: 337, description: 'Thanh toán theo tiến độ kế hoạch hợp đồng xây dựng',
    },
    { 
        name: 338, description: 'Phải trả, phải nộp khác',
         sub: [
            { name: 3381, description: 'Tài sản thừa chờ giải quyết' },
            { name: 3382, description: 'Kinh phí công đoàn' },
            { name: 3383, description: 'Bảo hiểm xã hội' },
            { name: 3384, description: 'Bảo hiểm tế' },
            { name: 3385, description: 'Phải trả về cổ phần hóa' },
            { name: 3386, description: 'Bảo hiểm thất nghiệp' },
            { name: 3387, description: 'Doanh thu chưa thực hiện' },
            { name: 3388, description: 'Phải trả, phải nộp khác' }
        ]
    },
    { 
        name: 341, description: 'Vay và nợ thuê tài chính',
         sub: [
            { name: 3411, description: 'Các khoản đi vay' },
            { name: 3412, description: 'Nợ thuê tài chính' }
        ]
    },
    { 
        name: 343, description: 'Trái phiếu phát hành',
        sub: [
            {
                name: 3431, description: 'Trái phiếu thường',
                sub2: [
                    { name: 34311, description: 'Mệnh giá' },
                    { name: 34312, description: 'Chiết khấu trái phiếu' },
                    { name: 34313, description: 'Phụ trội trái phiếu' }
                ]
            },
            { name: 3432, description: 'Trái phiếu chuyển đổi' }
        ]
    },
    { 
        name: 344, description: 'Nhận ký quỹ, ký cược',
    },
    { 
        name: 347, description: 'Thuế thu nhập hoãn lại phải trả',
    },
    { 
        name: 352, description: 'Dự phòng phải trả',
         sub: [
            { name: 3521, description: 'Dự phòng bảo hành sản phẩm hàng hóa' },
            { name: 3522, description: 'Dự phòng bảo hành công trình xây dựng' },
            { name: 3523, description: 'Dự phòng tái cơ cấu doanh nghiệp' },
            { name: 3524, description: 'Dự phòng phải trả khác' }
        ]
    },
    { 
        name: 353, description: 'Quỹ khen thưởng phúc lợi',
         sub: [
            { name: 3531, description: 'Quỹ khen thưởng' },
            { name: 3532, description: 'Quỹ phúc lợi' },
            { name: 3533, description: 'Quỹ phúc lợi đã hình thành TSCĐ' },
            { name: 3534, description: 'Quỹ thưởng ban quản lý điều hành Công ty' }
        ]
    },
    { 
        name: 356, description: 'Quỹ phát triển khoa học và công nghệ',
         sub: [
            { name: 3561, description: 'Quỹ phát triển khoa học và công nghệ' },
            { name: 3562, description: 'Quỹ phát triển khoa học và công nghệ đã hình thành TSCĐ' }
        ]
    },
    { 
        name: 357, description: 'Quỹ bình ổn giá'
    },
    { 
        name: 411, description: 'Vốn đầu tư của chủ sở hữu',
        sub: [
            {
                name: 4111, description: 'Vốn góp của chủ sở hữu',
                sub2: [
                    { name: 41111, description: 'Cổ phiếu phổ thông có quyền biểu quyết' },
                    { name: 41112, description: 'Cổ phiếu ưu đãi' }
                ]
            },
            { name: 4112, description: 'Thặng dư vốn cổ phần' },
            { name: 4113, description: 'Quyền chọn chuyển đổi trái phiếu' },
            { name: 4118, description: 'Vốn khác' }
        ]
    },
    { 
        name: 412, description: 'Chênh lệch đánh giá lại tài sản',
    },
    { 
        name: 413, description: 'Chênh lệch tỷ giá hối đoái',
         sub: [
            { name: 4131, description: 'Chênh lệch tỷ giá do đánh giá lại các khoản mục tiền tệ có gốc ngoại lệ' },
            { name: 4132, description: 'Chênh lệch tỷ giá hối đoái trong giai đoạn trước hoạt động' }
        ]
    },
    { 
        name: 414, description: 'Quỹ đầu tư phát triển',
    },
    { 
        name: 417, description: 'Quỹ hỗ trợ sắp xếp doanh nghiệp',
    },
    { 
        name: 418, description: 'Các quỹ khác thuộc vốn chủ sở hữu',
    },
    { 
        name: 419, description: 'Cổ phiếu quỹ',
    },
    { 
        name: 421, description: 'Lợi nhuận sau thuế chưa phân phối',
         sub: [
            { name: 4211, description: 'Lợi nhuận sau thuế chưa phân phối năm trước' },
            { name: 4212, description: 'Lợi nhuận sau thuế chưa phân phối năm nay' }
        ]
    },
    { 
        name: 441, description: 'Nguồn vốn đầu tư xây dựng cơ bản',
    },
    { 
        name: 461, description: 'Nguồn kinh phí sự nghiệp',
         sub: [
            { name: 4611, description: 'Nguồn kinh phí sự nghiệp năm trước' },
            { name: 4612, description: 'Nguồn kinh phí sự nghiệp năm nay' }
        ]
    },
    { 
        name: 466, description: 'Nguồn kinh phí đã hình thành TSCĐ',
    },
    { 
        name: 511, description: 'Doanh thu bán hàng và cung cấp dịch vụ',
         sub: [
            { name: 5111, description: 'Doanh thu bán hàng hóa' },
            { name: 5112, description: 'Doanh thu bán các thành phẩm' },
            { name: 5113, description: 'Doanh thu cung cấp dịch vụ' },
            { name: 5114, description: 'Doanh thu trợ cấp, trợ giá' },
            { name: 5117, description: 'Doanh thu kinh doanh bất động sản đầu tư' },
            { name: 5118, description: 'Doanh thu khác' }
        ]
    },
    { 
        name: 515, description: 'Doanh thu hoạt động tài chính',
    },
    { 
        name: 521, description: 'Các khoản giảm trừ doanh thu',
         sub: [
            { name: 5211, description: 'Chiết khấu thương mại' },
            { name: 5212, description: 'Hàng hóa bị trả lại' },
            { name: 5213, description: 'Giảm giá hàng hóa' }
        ]
    },
    { 
        name: 611, description: 'Mua hàng',
         sub: [
            { name: 6111, description: 'Mua nguyên liệu, vật liệu' },
            { name: 6112, description: 'Mua hàng hóa' }
        ]
    },
    { 
        name: 621, description: 'Chi phí nguyên liệu, vật liệu trực tiếp',
    },
    { 
        name: 622, description: 'Chi phí nhân công trực tiếp',
    },
    { 
        name: 623, description: 'Chi phí sử dụng máy thi công',
         sub: [
            { name: 6231, description: 'Chi phí nhân công' },
            { name: 6232, description: 'Chi phí nguyên, vật liệu' },
            { name: 6233, description: 'Chi phí dụng cụ sản xuất' },
            { name: 6234, description: 'Chi phí khấu hao máy thi công' },
            { name: 6237, description: 'Chi phí dịch vụ mua ngoài' },
            { name: 6238, description: 'Chi phí bằng tiền khác' }
        ]
    },
    { 
        name: 627, description: 'Chi phí sản xuất chung',
         sub: [
            { name: 6271, description: 'Chi phí nhân viên xưởng' },
            { name: 6272, description: 'Chi phí nguyên, vật liệu' },
            { name: 6273, description: 'Chi phí dụng cụ sản xuất' },
            { name: 6274, description: 'Chi phí khấu hao TSCĐ' },
            { name: 6277, description: 'Chi phí dịch vụ mua ngoài' },
            { name: 6278, description: 'Chi phí bằng tiền khác' }
        ]
    },
    { 
        name: 631, description: 'Giá thành sản xuất',
    },
    { 
        name: 632, description: 'Giá vốn hàng bán',
    },
    { 
        name: 635, description: 'Chi phí tài chính',
    },
    { 
        name: 641, description: 'Chi phí bán hàng',
         sub: [
            { name: 6411, description: 'Chi phí nhân viên' },
            { name: 6412, description: 'Chi phí vật liệu, bao bì' },
            { name: 6413, description: 'Chi phí dụng cụ, đồ dùng' },
            { name: 6414, description: 'Chi phí khấu hao TSCĐ' },
            { name: 6415, description: 'Chi phí bảo hành' },
            { name: 6417, description: 'Chi phí dịch vụ mua ngoài' },
            { name: 6418, description: 'Chi phí bằng tiền khác' }
        ]
    },
    { 
        name: 642, description: 'Chi phí quản lý doanh nghiệp',
         sub: [
            { name: 6421, description: 'Chi phí nhân viên quản lý' },
            { name: 6422, description: 'Chi phí vật liệu quản lý' },
            { name: 6423, description: 'Chi phí đồ dùng văn phòng' },
            { name: 6424, description: 'Chi phí khấu hao TSCĐ' },
            { name: 6425, description: 'Thuế, phí và lệ phí' },
            { name: 6426, description: 'Chi phí dự phòng' },
            { name: 6427, description: 'Chi phí dịch vụ mua ngoài' },
            { name: 6428, description: 'Chi phí bằng tiền khác' }
        ]
    },
    { 
        name: 711, description: 'Thu nhập khác',
    },
    { 
        name: 811, description: 'Chi phí khác',
    },
    { 
        name: 821, description: 'Chi phí thuế thu nhập doanh nghiệp',
         sub: [
            { name: 8211, description: 'Chi phí thuế TNDN hiện hành' },
            { name: 8212, description: 'Chi phí thuế TNDN hoãn lại' }
        ]
    },
    { 
        name: 911, description: 'Xác định kết quả kinh doanh',
    },
]