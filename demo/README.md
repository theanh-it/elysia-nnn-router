# Demo · elysia-nnn-router

Thư mục demo gồm:

- **`server.ts`** — Entry chạy server (port 3000).
- **`routes/`** — Các route mẫu (root, users, products, api, middleware, …).

## Chạy demo

Từ thư mục gốc repo:

```bash
bun run demo
```

Khi chạy, plugin dùng `verbose: true` nên sẽ in ra **bảng routes** (tiếng Anh) với các cột Method, Path, File ngay sau khi scan xong. Bạn có thể tắt bằng `silent: true` hoặc bỏ `verbose` trong `server.ts`. Option `onError` dùng để xử lý lỗi khi load route/middleware (xem README chính).

Chi tiết cấu trúc routes xem trong [routes/README.md](./routes/README.md).
