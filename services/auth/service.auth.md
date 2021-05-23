service chứa các phần phân quyền tuy cập, bao gồm:
    - company: thông tin doanh nghiệp
    - user: thông tin người dùng
    - app: thông tin ứng dụng
    - app_menu: thông tin CÂY MENU của ứng dụng
    - app_company: thông tin truy cập app của công ty
    - app_user: thông tin truy cập app của user
        + Admin: ngừoi đầu tiên mà CBS tạo cho doanh nghiệp đó
        + Member: những nhân viên của công ty được phân quyền truy cập 
            => user được phép truy cập phụ thuộc điều kiện
                - có trong app_user
                - có trong cây app_role_memu -> mà nhóm đó được phép try cập các memu cho phép
    - app_role: thông tin các nhóm của CTY trên app đó
    - app_role_menu: thông tin phần quyền các NHÓM được truy cập trên từng cây menu
