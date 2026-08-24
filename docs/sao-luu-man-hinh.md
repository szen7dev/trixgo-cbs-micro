# Màn xem bản sao lưu CSDL — cửa ĐỌC cho kho `trixgo-prod-backup`

Dựng 2026-08-24. Tệp này nói **cách bật màn lên**; cơ chế sao lưu nằm ở
`trixgo-kubenetes-prod/infrastructure/trixgo-prod-01/backup-mongodb/README.md`.

## Việc này KHÔNG đụng gì tới cơ chế sao lưu

CronJob `backup-mongodb` đã chạy từ 2026-08-21: 23:15 giờ VN hằng ngày, `mongodump` →
ổ đĩa trong cụm (7 ngày) → Spaces `trixgo-prod-backup` (14 ngày). Màn này chỉ **đọc** kho đó.

## Hai endpoint

| Đường dẫn | Trả về |
|---|---|
| `GET /api/admin/backups` | Danh sách bản sao lưu, mới nhất đứng đầu |
| `GET /api/admin/backups/:ten/url` | Link tải ký sẵn, sống **300 giây** |

Cả hai **chỉ Admin ứng dụng Quản trị** (`app_users.level == 0` trên app `owner`) gọi được.
Chốt nằm trong `services/admin/handler/admin.backup-handler.js`, hàm `chotQuyenAdmin()` —
Trixgo không có lớp gác kiểu `superAdmin` gắn trước cả nhóm route, nên **thêm handler thứ ba
vào service này thì phải gọi lại chốt đó**, không có gì tự làm hộ.

**Không có endpoint xoá** — cố ý. Vòng đời bản sao lưu do CronJob lo.

## ⚠️ Phải khai 5 biến, không thì màn báo "chưa khai khoá"

```
BACKUP_S3_ENDPOINT   = https://sgp1.digitaloceanspaces.com
BACKUP_S3_REGION     = sgp1
BACKUP_S3_BUCKET     = trixgo-prod-backup
BACKUP_S3_ACCESS_KEY = <khoá CHỈ ĐỌC>
BACKUP_S3_SECRET_KEY = <khoá CHỈ ĐỌC>
```

Thiếu bất kỳ biến nào ⇒ endpoint trả **200 kèm `configured: false`**, màn hiện dải vàng
"chưa khai khoá". Đó **không phải lỗi** — dev và staging vốn không có kho sao lưu, và trả 500
ở đó chỉ làm người ta đi sửa nhầm chỗ.

### 🔴 Khoá phải là khoá CHỈ ĐỌC, và phải seal riêng

Chưa tạo — **chạy lệnh này trước** (tài khoản DO `app.szen7@gmail.com`):

```bash
doctl spaces keys create trixgo-prod-backup-readonly \
  --context szen7app \
  --grants 'bucket=trixgo-prod-backup;permission=read'
```

⛔ **Đừng dùng lại `trixgo-prod-backup-rw`.** Khoá đó ghi và **xoá** được cả kho sao lưu; một
màn hình chỉ để xem thì không có lý do gì cầm nó. Đúng lúc cần khôi phục nhất là lúc không còn
gì để khôi phục.

⛔ **Đừng nhét vào `apps/prod/trixgo-cbs-micro/secret.yaml`.** Tệp đó là Secret **thường**, nằm
đọc được trong repo GitOps. Seal riêng, cùng cách `infrastructure/trixgo-prod-01/backup-mongodb/`
đã làm.

### ⚠️ Trỏ nhầm kho thì KHÔNG có triệu chứng nào

Màn vẫn hiện một danh sách trông bình thường. Hệ S7 đã dính đúng chuyện này: kho cũ
`s7-prod-backup` ở tài khoản khác vẫn còn tệp tới 21/08 nhưng đã đông lạnh, không ai ghi thêm.
**Sau khi khai biến, đối chiếu tên tệp mới nhất trên màn với tên trong log CronJob** — chỉ mất
mười giây, và đó là phép kiểm duy nhất bắt được ca này.

## Màn hình

`/owner/backup` — `src/views/owner/pages/OwnerBackupPage/index.tsx` (repo `trixgo-cbs-webapp`).
Mục ở thanh bên trái **hard-code** theo `level == 0`, cố ý không đi qua bảng `app_menu`: quyền
vào kho sao lưu không nên là thứ cấp được bằng vài cú bấm trong màn phân quyền.

Ba trạng thái màn nói thẳng ra thay vì vẽ bảng rỗng:

| Trạng thái | Hiển thị |
|---|---|
| Chưa khai khoá | dải **vàng** — không phải hỏng |
| Kho rỗng | dải **đỏ** "KHO SAO LƯU TRỐNG — kiểm CronJob" |
| Bản mới nhất > **36 giờ** | dải **đỏ** "việc sao lưu nhiều khả năng đang hỏng" |

Ngưỡng 36 giờ: CronJob chạy hằng ngày nên bản mới nhất bình thường không quá 24 giờ tuổi;
36 giờ để lượt chạy chậm không kêu oan, mà bỏ lỡ hẳn một đêm thì kêu ngay.

## Vì sao link ký sẵn chứ không tải qua máy chủ

Bản sao lưu Trixgo nặng **~1,1 GB** (đo 2026-08-21: dump 274 giây từ 9,74 GB dữ liệu). Đẩy nó
qua pod API là giữ một kết nối hàng phút, ăn băng thông của mọi request khác, và pod khởi động
lại giữa chừng là hỏng cả lượt tải. Link ký sẵn cho trình duyệt tải **thẳng từ Spaces**.

## Dấu vết

Mỗi lượt xin link ghi ra **nhật ký pod**, không ghi vào CSDL:

```
[TẢI BẢN SAO LƯU] user=<id> tệp=<tên> lúc=<ISO>
```

Ghi vào CSDL thì bản ghi đó nằm trong chính cái CSDL vừa bị tải về, và người tải là người có
quyền cao nhất hệ thống. Nhật ký pod thì gom ra ngoài.
