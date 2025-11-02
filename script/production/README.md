# Production Documentation
## Hướng dẫn setup Production environment (4 máy)

Production setup đã được đơn giản hóa và không còn phụ thuộc vào PowerShell scripts.

### Setup instructions:
Xem chi tiết trong: **[docs/PRODUCTION_SETUP.md](../../docs/PRODUCTION_SETUP.md)**

### Tóm tắt quy trình:
1. Cài đặt MongoDB trên 4 máy Windows
2. Khởi động MongoDB services thủ công
3. Cấu hình replica sets bằng mongosh commands
4. Setup sharding và web application

**Lưu ý**: Setup thủ công giúp hiểu rõ hơn về kiến trúc MongoDB Sharded Cluster và dễ dàng troubleshoot khi gặp vấn đề.