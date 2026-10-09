# พอร์ทัลประกาศจัดซื้อจัดจ้างขอนแก่น

เว็บตัวอย่างสำหรับค้นหาประกาศ ดูเอกสารต้นฉบับ บันทึกการค้นหา และให้ผู้ดูแลตรวจข้อมูลก่อนเผยแพร่ **ยังไม่ใช่ระบบพร้อมใช้จริงใน production**

| ใคร       | ทำอะไรได้                                              |
| --------- | ------------------------------------------------------ |
| ผู้เข้าชม | ค้นหา กรอง ดูรายละเอียดและเอกสารต้นฉบับของประกาศที่ตรวจและเผยแพร่แล้ว |
| สมาชิก    | บันทึกการค้นหา ดูประวัติ และรับการแจ้งเตือน            |
| ผู้ดูแล   | จัดการประกาศ ผู้ใช้ เอกสาร และตรวจผลการสกัดข้อมูล      |

## ข้อมูลเดินทางอย่างไร

```text
ประกาศที่สร้างในเว็บ / output.json จาก portal-ocr + เอกสาร PDF/JPEG
  → ประกาศฉบับร่าง + เอกสารแนบ + ข้อมูลรอตรวจ
  → ผู้ดูแลแก้และอนุมัติข้อมูล
  → ผู้ดูแลกดเผยแพร่แยกอีกครั้ง
  → ผู้เข้าชมค้นหาและเปิดเอกสารต้นฉบับ
```

`portal:import ../portal-ocr/outputs/output.json` รับฟิลด์ที่ตกลงกันในไฟล์ OCR โดยตรง และอ่านเอกสารจาก `../portal-ocr/data/pdfs/` (`--pdf-dir=` ใช้เมื่อย้ายไฟล์ไปที่อื่น) ยังรับรูปแบบ `portal_import.json` เดิมกับ `portal_attachments/` ได้ แถวที่ไม่มีชื่อ/เอกสารที่อ่านได้จะถูกปฏิเสธโดยไม่สร้างข้อมูลค้างไว้ เอกสารต่างกันที่ใช้ `record_key` หรือ URL หน้าแหล่งข้อมูลเดียวกันยังนำเข้าได้ตาม `source_id + source_url + pdf_path`; การรันซ้ำข้ามเอกสารเดิม การนำเข้าบังคับเป็น **ฉบับร่าง** เสมอ ไม่มีการเติมงบประมาณหรือกำหนดส่งจาก `base_price`/วันที่อื่นเมื่อ OCR ไม่ทราบ วันที่ พ.ศ. แปลงเป็น ค.ศ. ก่อนจัดเก็บและวันที่ที่ผิดช่วงถูกแจ้งให้ผู้ดูแลตรวจ ค่าเอกสารและคำเตือนดิบอยู่เฉพาะหน้าตรวจของผู้ดูแล ดูกรณีตรวจได้ที่ `tests/Feature/Procurement/PortalImportCommandTest.php`

ข้อมูลจาก `portal-ocr` เป็นผลที่ประมวลผลไว้ก่อนนำเข้า ส่วนการอัปโหลด PDF ผ่านเว็บยังใช้ `FakeDocumentExtractor` ซึ่งสร้างผลทดสอบจาก **ชื่อไฟล์** ไม่ได้อ่าน PDF และไม่ใช่ OCR ข้อมูลดิบ ค่าความเชื่อมั่น คำเตือน และข้อผิดพลาดแสดงเฉพาะผู้ดูแล; การอนุมัติข้อมูล **ไม่เท่ากับ** การเผยแพร่ประกาศ

## ถ้าจะเปลี่ยนอะไร ให้เริ่มที่ไหน

| งาน                   | จุดเริ่ม                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| เส้นทางและสิทธิ์      | `routes/web.php`, `app/Http/Controllers/`                                                                                                      |
| ค้นหาและตัวกรอง       | `app/Support/Procurement/AnnouncementSearch.php`, `FilterState.php`, `resources/js/components/procurement-search/`                             |
| นำเข้าและเก็บ PDF     | `app/Console/Commands/ImportPortalAnnouncements.php`, `app/Support/Procurement/PortalImport/`, `app/Support/Procurement/AttachmentStorage.php` |
| สกัดและตรวจข้อมูล     | `app/Jobs/ProcessDocumentExtraction.php`, `app/Http/Controllers/Admin/ExtractionReviewController.php`                                          |
| หน้าจอและชนิดข้อมูล   | `resources/js/pages/`, `resources/js/components/`, `resources/js/types/`                                                                       |
| ประวัติและลิงก์ค้นซ้ำ | `resources/js/components/user-history/`                                                                                                        |
| กฎที่ต้องรักษา        | `tests/Feature/`, `tests/Browser/`                                                                                                             |

แอปใช้ Laravel 12 + Inertia.js + React 19 + Tailwind CSS v4; ฐานข้อมูลใน Sail เป็น PostgreSQL ส่วนชุดทดสอบใช้ SQLite หน้าเว็บอยู่ที่ `resources/js/` ไม่ใช่ `src/` และ auth เชื่อมผ่าน Fortify

## เริ่มใช้งานในเครื่อง

ต้องมี Docker Desktop, Composer, PHP 8.4.1+ และ Node.js 22 หากรันคำสั่ง frontend นอก Sail

```bash
cp .env.example .env
composer install
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm ci
./vendor/bin/sail npm run build
./vendor/bin/sail composer dev
```

เปิด `/procurement` เพื่อดูประกาศตัวอย่าง บัญชีสำหรับเดโมอยู่ใน [คู่มือเดโม](docs/human-demo-runbook.md) เท่านั้น อย่าใช้บัญชีเหล่านี้กับข้อมูลจริง

## ตรวจงานก่อนส่งต่อ

```bash
./vendor/bin/sail composer test
./vendor/bin/sail npm run types
./vendor/bin/sail npm run build
./vendor/bin/sail npm run format:check
./vendor/bin/sail npx eslint .
./vendor/bin/sail npm run test:e2e -- --project=chromium --workers=1
```

- [คู่มือเดโมแบบสั้น](docs/human-demo-runbook.md) · [สถานะความสามารถ](docs/demo-feature-matrix.md)
- [คำสั่งนำเข้าข้อมูลและกู้คืน](docs/demo-runbook.md) · [แนวทางหน้าจอ](DESIGN.md)

ตัวอย่าง `portal-ocr/outputs/output.json` วันที่ 9 ต.ค. 2569 มี 57 เอกสาร; การซ้อมบนฐานทดสอบนำเข้าเป็นฉบับร่างรอตรวจครบ 57 เอกสาร แม้บาง `record_key` ซ้ำกัน มี 53 รายการที่ไม่ทราบงบประมาณและ 14 รายการที่ไม่ทราบกำหนดส่ง รวมทั้งต้นฉบับ JPEG หนึ่งไฟล์ ตัวเลขนี้เป็นผลของชุดตัวอย่างนั้น ไม่ใช่ผลรับประกันในอนาคต ยังไม่มี workflow deploy/rollback, queue worker ที่ดูแลใน production หรือการวัดความแม่นยำ OCR

## สิทธิ์การใช้งาน

MIT; ดู `LICENSE`
