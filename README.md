# 💸 หารกัน (Harngun) - Trip Bill Splitter & Debt Settlement App

แอปจัดการค่าใช้จ่ายทริป หารบิลอัตโนมัติ ตัดหนี้อัจฉริยะด้วยอัลกอริทึมจับคู่หนี้ขั้นต่ำ รองรับบิลจำนวนมากด้วย SQLite และสร้าง QR Code พร้อมเพย์มาตรฐาน EMVCo สแกนจ่ายได้จริง

![Harngun Banner](https://img.shields.io/badge/Status-Production%20Ready-emerald)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20Tailwind%20%7C%20Express%20%7C%20SQLite-blue)

---

## ✨ ฟีเจอร์เด่น (Key Features)

1. **⚡ รองรับบิลจำนวนมาก (High-Volume Ready with SQLite)**
   - ฐานข้อมูล SQLite (`better-sqlite3`) พร้อมโหมด WAL (Write-Ahead Logging) และ Indexing
   - คำนวณสรุปยอดดุลรวมในระดับ SQL Aggregation ในเวลาเพียง **< 10ms** แม้มีบิลหลายร้อยหรือหลายพันรายการ
   - ระบบแบ่งหน้า (Pagination), ค้นหาชื่อบิลแบบเรียลไทม์, กรองตามหมวดหมู่ และกรองตามคนจ่าย

2. **📱 สแกน QR โอนเงินผ่าน PromptPay จริง (Bank of Thailand EMVCo Standard)**
   - สร้าง QR Code พร้อมเพย์มาตรฐาน EMVCo แบบระบุยอดเงินตรงเป๊ะถึงเศษสตางค์
   - แอปธนาคารไทย (K PLUS, SCB EASY, Krungthai NEXT, ฯลฯ) สามารถเปิดกล้องสแกนและใส่ยอดอัตโนมัติได้ทันที
   - ปุ่มคัดลอกเบอร์พร้อมเพย์สะดวกรวดเร็ว

3. **💸 บันทึกการเคลียร์ยอดและหักลบหนี้อัตโนมัติ (Settlement Tracking & Undo)**
   - คำนวณเส้นทางการโอนที่น้อยที่สุด (Greedy Minimal Settlement Algorithm)
   - เมื่อกด "ยืนยันว่าโอนแล้ว" ระบบจะบันทึกลงตาราง settlements และหักลบยอดหนี้ออกจากบัญชีทันที
   - ดูประวัติการโอนย้อนหลัง และกด "ยกเลิก (Undo)" ได้หากเกิดข้อผิดพลาด

4. **🧾 แนบรูปสลิปและใบเสร็จ (Receipt Photo Upload)**
   - แนบภาพถ่ายสลิปหรือใบเสร็จรับเงินขณะบันทึกบิล
   - กดดูรูปใบเสร็จขนาดใหญ่แบบ Fullscreen พร้อมปุ่มเปิดดูภาพต้นฉบับ

5. **📊 ส่งออกข้อมูลเป็นไฟล์ Excel / CSV (Export to CSV)**
   - ดาวน์โหลดสรุปยอดดุลรายบุคคล และประวัติบิลทั้งหมดเป็นไฟล์ CSV
   - เข้ารหัส UTF-8 with BOM รองรับการเปิดด้วย Microsoft Excel ภาษาไทยโดยตัวอักษรไม่เพี้ยน

6. **🧪 ปุ่มสุ่ม 50 บิลทดสอบ (+50 Bulk Test Bills)**
   - ปุ่ม Stress Test ในหน้าแอปสำหรับสร้างบิลสุ่มสมจริง 50 รายการทันที เพื่อทดสอบความเร็วและการแสดงผล

7. **🗺️ จัดการได้หลายทริป (Multi-Trip Management)**
   - สร้างทริปใหม่ และสลับทริปได้สะดวก
   - แชร์ลิงก์ทริปส่งเข้ากลุ่ม LINE เพื่อนคลิกเปิดเข้ามาร่วมใช้งานได้ทันที

---

## 🚀 วิธีติดตั้งและรันโปรเจกต์ (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันโหมด Development (รัน API Backend และ Vite Frontend พร้อมกัน)
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001` (Vite ทำ Proxy `/api` และ `/uploads` ให้อัตโนมัติ)

### 3. รันโหมด Production (Build & Start)
```bash
npm run build
npm start
```
แอปจะทำงานเต็มรูปแบบบน `http://localhost:3001` โดย Express จะเสิร์ฟไฟล์ Static ของ React และ API พร้อมกันในพอร์ตเดียว

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
harngun/
├── data/                      # ฐานข้อมูล SQLite (harngun.db / harbgun.db)
├── uploads/                   # โฟลเดอร์เก็บรูปสลิป/ใบเสร็จ
├── server/                    # Express.js + SQLite Backend
│   ├── db.ts                  # การเชื่อมต่อ SQLite, Schema และ Indexes
│   ├── seed.ts                # Seeder ทริปเชียงใหม่ และฟังก์ชันสร้าง 50 บิลทดสอบ
│   ├── routes/
│   │   ├── trips.ts           # จัดการทริป
│   │   ├── members.ts         # จัดการสมาชิก
│   │   ├── expenses.ts        # บิลค่าใช้จ่าย, การหาร, Pagination, Search
│   │   ├── settlements.ts     # การโอนชำระหนี้, ประวัติ, Undo
│   │   ├── balances.ts        # SQL Aggregated Balance Calculation
│   │   └── logs.ts            # ประวัติกิจกรรม
│   └── index.ts               # Express Entry Point
├── src/                       # React Frontend
│   ├── api/client.ts          # Typed API Client
│   ├── types/index.ts         # TypeScript Interfaces
│   ├── utils/
│   │   ├── promptpay.ts       # ตัวสร้าง BOT EMVCo PromptPay QR Code Payload
│   │   ├── settlement.ts      # อัลกอริทึมจับคู่หนี้ต่ำสุด
│   │   ├── currency.ts        # ฟอร์แมตเงินบาทและวันที่ภาษาไทย
│   │   └── exportCsv.ts       # ตัวส่งออกไฟล์ Excel/CSV (UTF-8 BOM)
│   ├── components/            # คอมโพเนนต์แยกโมดูลาร์
│   │   ├── Header.tsx         # ส่วนหัว, แก้ชื่อทริป, สลับผู้ใช้งาน
│   │   ├── BalanceCard.tsx    # การ์ดสรุปสถานะหนี้/เงินคืน
│   │   ├── NavigationTabs.tsx # แถบสลับแท็บ
│   │   ├── SummaryTab.tsx     # ยอดดุลสมาชิกทุกคน และกิจกรรม
│   │   ├── ExpenseList.tsx    # รายการบิล, ค้นหา, กรองหมวดหมู่, ส่งออก CSV
│   │   ├── ExpenseModal.tsx   # ป๊อปอัปเพิ่มบิล, ค่า SC/VAT, แนบรูปสลิป
│   │   ├── SettleTab.tsx      # บัตรโอนเคลียร์เงิน และประวัติการโอน
│   │   ├── PromptPayQRModal.tsx # ป๊อปอัป QR พร้อมเพย์สแกนได้จริง
│   │   ├── ReceiptViewerModal.tsx # ดูรูปใบเสร็จขนาดใหญ่
│   │   ├── TripSwitcherModal.tsx  # สลับและสร้างทริปใหม่
│   │   └── ShareModal.tsx     # แชร์ลิงก์กลุ่ม
│   ├── App.tsx                # Main App Layout & State Sync
│   └── main.tsx               # React DOM Entry
└── package.json
```
