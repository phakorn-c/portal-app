# คู่มือซ้อมเดโมและนำเข้าข้อมูล

หน้านี้สำหรับคนเตรียมระบบ: คำสั่งจริงและจุดที่ต้องตรวจ ถ้าจะเล่าเรื่องบนเว็บให้เปิด [คู่มือเดโมแบบสั้น](human-demo-runbook.md) แทน **ทุกคำสั่งรีเซ็ตด้านล่างใช้ฐาน `testing` เท่านั้น** อย่านำไปชี้ฐานที่มีข้อมูลต้องเก็บ

## สองทางที่ต่างกัน

- **ข้อมูลตัวอย่างในเว็บ:** seed ประกาศกับ PDF; การอัปโหลดใหม่ใช้ `FakeDocumentExtractor` จากชื่อไฟล์ ไม่ใช่ OCR
- **ข้อมูลจริงที่ประมวลไว้:** `portal-ocr` ส่ง JSON + PDF มาให้ `portal:import`; Laravel เก็บเป็นฉบับร่างพร้อมผลรอตรวจ ไม่เรียกตัวสกัดผลทดสอบซ้ำ

## เตรียมข้อมูลจาก `portal-ocr`

ต้องมี Docker Desktop, `portal-app/` กับ `portal-ocr/` อยู่ข้างกัน, Python 3.10+, `uv` และ corpus เดิมที่ `portal-ocr/outputs/output.json` กับ `portal-ocr/data/pdfs/` ทำคำสั่งนี้จาก `portal-ocr/`:

```bash
shasum data/ocr_texts/*.txt | shasum
uv run --locked python portal_export.py
jq '{rows:length,drafts:([.[]|select(.publication_status=="draft" and .published_at==null)]|length),with_pdf:([.[]|select(.pdf_path!="")]|length),with_raw_text:([.[]|select(has("raw_text"))]|length),with_flags:([.[]|select(has("validation_flags"))]|length)}' outputs/portal_import.json
shasum data/ocr_texts/*.txt | shasum
```

ค่า hash ก่อนและหลังต้องตรงกัน การซ้อม 11 ก.ย. 2569 ส่งออก 90 แถว/90 PDF แต่ไม่มี `raw_text` หรือ `validation_flags` แยกเป็นฟิลด์ จึงอย่าเรียกข้อความย่อใน `description` ว่า raw OCR

ย้าย JSON และโฟลเดอร์เอกสารไปไว้ข้างกันใน Sail (ทำจาก `portal-app/`):

```bash
./vendor/bin/sail up -d
docker compose exec laravel.test mkdir -p /tmp/portal-demo
docker compose cp ../portal-ocr/outputs/portal_import.json laravel.test:/tmp/portal-demo/portal_import.json
docker compose cp ../portal-ocr/outputs/portal_attachments laravel.test:/tmp/portal-demo/portal_attachments
```

ตัวนำเข้าปฏิเสธ path ที่เป็น absolute/ย้อนขึ้นโฟลเดอร์, PDF ที่หายหรือไม่ใช่ PDF และเนื้อหาไฟล์ที่ซ้ำ โดยไม่สร้างประกาศบางส่วนทิ้งไว้

## รีเซ็ตฐานเดโมอย่างปลอดภัย

คำสั่งแรกสร้างฐานชื่อ `testing` หากยังไม่มี คำสั่งที่สอง **ยืนยันชื่อฐานที่ต่ออยู่จริง** แล้วจึงอนุญาตให้รันคำสั่งล้างฐาน อย่าข้าม guard หรือเปลี่ยน `DB_DATABASE` ไปเป็นฐานพัฒนา

```bash
./vendor/bin/sail exec pgsql sh -lc 'psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '\''testing'\''" | grep -qx 1 || createdb -U "$POSTGRES_USER" testing'

./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=sync laravel.test php artisan tinker --execute='$db = \Illuminate\Support\Facades\DB::selectOne("select current_database() AS name")->name; throw_unless($db === "testing", "Refusing DB: ".$db);'

./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=sync laravel.test php artisan migrate:fresh --seed --force
```

seed เริ่มต้นมี 8 ประกาศ 4 ไฟล์แนบ 3 ผลสกัด หากไม่ได้ซ้อมนำเข้าข้อมูลจริง ให้ข้ามส่วนถัดไปแล้วเปิด `/procurement`

## นำเข้า ตรวจ และเผยแพร่

```bash
./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=sync laravel.test php artisan portal:import /tmp/portal-demo/portal_import.json
```

การซ้อม 11 ก.ย. 2569 ได้ `imported=70 skipped=0 errors=20` และ exit code ไม่ใช่ 0 เพราะ 20 แถวมีชื่อหน่วยงานไม่อยู่ใน `app/Support/Procurement/Taxonomy.php` อย่าฝืนแก้ JSON ด้วยการเดาหน่วยงาน การรันซ้ำโดยไม่รีเซ็ตจะข้าม 70 แถวเดิม ให้แก้ mapping ที่ตัวส่งออก `portal-ocr` แล้วซ้อมใหม่

อ่าน ID ที่รันได้จริงก่อนเปิดหน้าตรวจ (อย่าใช้เลขจากการซ้อมครั้งเก่า):

```bash
./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=sync laravel.test php artisan tinker --execute='$a=\App\Models\Announcement::where("source_reference","kku_plan:201b887d_kku_plan")->firstOrFail(); $f=$a->attachments()->firstOrFail(); $e=$f->extraction()->firstOrFail(); throw_unless($a->publication_status === "draft" && $e->status === "review" && $e->method === "portal-ocr", "Unsafe import state"); dump(["announcement_id"=>$a->id,"attachment_id"=>$f->id,"extraction_id"=>$e->id]);'
```

เปิดเว็บแยกพอร์ตด้วยฐาน `testing` โดยไม่เปลี่ยนฐานของเว็บปกติ:

```bash
DEMO_WEB_CONTAINER=$(APP_PORT=8001 VITE_PORT=5174 docker compose run -d --rm --service-ports -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=sync laravel.test php artisan serve --host=0.0.0.0 --port=80 --no-reload)
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:8001/procurement
```

ต้องได้ HTTP `200` เข้าระบบด้วยบัญชีผู้ดูแลจากคู่มือเดโม เปิด `/admin/announcements/{announcement_id}/extractions/{extraction_id}` ตรวจและอนุมัติ แล้วกลับ `/admin` เพื่อ **กดเผยแพร่แยกอีกครั้ง** จากนั้นออกจากระบบ ค้นประกาศใน `/procurement` และเปิด PDF ที่ `/procurement/announcements/{announcement_id}/pdf/{attachment_id}` ตรวจว่าเป็น `application/pdf` และ hash ตรงกับไฟล์ต้นฉบับ เสร็จแล้วหยุดเว็บชั่วคราวด้วย `docker stop "$DEMO_WEB_CONTAINER"`

## ตรวจระบบ

```bash
./vendor/bin/sail composer test
./vendor/bin/sail npm run types
./vendor/bin/sail npm run build
./vendor/bin/sail npm run format:check
./vendor/bin/sail npx eslint .
./vendor/bin/sail npm run test:e2e -- --project=chromium --workers=1
```

Playwright ใช้ไฟล์ SQLite สำหรับทดสอบและรีเซ็ตข้อมูลตัวอย่างก่อนเริ่ม อย่านำฐานนี้ไปใช้แทนฐานพัฒนา

ถ้าต้องการพิสูจน์ queue ของการ **อัปโหลดผ่านเว็บ** ให้เปลี่ยน `QUEUE_CONNECTION=database` บนฐาน PostgreSQL `testing` ที่ guard แล้ว ตรวจว่ามี job 1 แถว รัน `php artisan queue:work database --queue=default --stop-when-empty --tries=1 --timeout=120` และตรวจว่าผลลงสถานะ `review` โดยไม่มี failed job เส้นทางนี้ยังใช้ตัวสกัดผลทดสอบ ไม่ใช่ OCR จริง

## เมื่อมีปัญหา

- **ข้อมูลนำเข้าไม่ครบ:** ดู error รายแถวและ taxonomy; แก้ตัวส่งออก ไม่สร้างข้อมูลที่ไม่มีหลักฐาน หากต้องเริ่มใหม่ให้ผ่าน guard ด้านบนก่อนรีเซ็ต
- **PDF ค้างในที่เก็บ:** `./vendor/bin/sail artisan procurement:reconcile-attachments` แสดงรายการแบบไม่ลบ ตรวจผลก่อนใช้ `--delete`; ไฟล์อายุน้อยกว่า 24 ชั่วโมงและไฟล์ที่ยังมีการอ้างอิงจะไม่ถูกลบ
- **ผลสกัดค้าง:** สถานะ `processing` เกิน 360 วินาทีจึง retry ได้; จำกัด 3 ครั้ง ผลล้มเหลวของข้อมูลตัวอย่างหมายเลข 8 ถูกตั้งใจให้ล้มเหลว
- **ที่มาข้อมูล:** `demo.invalid` เป็น URL ตัวอย่าง, การนำเข้า 70/20 ไม่ใช่คะแนนความแม่นยำ OCR และยังไม่มี pipeline สำหรับ deploy/rollback หรือดูแล queue worker บน production
