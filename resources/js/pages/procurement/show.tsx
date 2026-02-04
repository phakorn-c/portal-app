import { Head, Link } from '@inertiajs/react';
import {
    Bookmark,
    CalendarDays,
    ChevronRight,
    Download,
    FileText,
    MapPin,
    Maximize2,
    Menu,
    Minus,
    Phone,
    Plus,
    Share2,
    User,
} from 'lucide-react';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Timeline, type TimelineItem } from '@/components/ui/timeline';

type Props = {
    announcementId: string;
};

const attachments = [
    {
        name: 'ใบเสนอราคา (แบบฟอร์ม ก)',
        type: 'PDF',
        size: '245 KB',
        icon: 'pdf',
    },
    { name: 'แบบแปลนการก่อสร้าง', type: 'ZIP', size: '15 MB', icon: 'zip' },
    { name: 'เอกสาร TOR ฉบับเต็ม', type: 'PDF', size: '2.4 MB', icon: 'pdf' },
];

const timelineItems: TimelineItem[] = [
    {
        date: '20 ต.ค. 2566',
        title: 'เผยแพร่ประกาศ',
        status: 'completed',
    },
    {
        date: '25 ต.ค. - 14 พ.ย. 2566',
        title: 'ช่วงการจำหน่าย/ดาวน์โหลดเอกสาร',
        status: 'current',
    },
    {
        date: '15 พ.ย. 2566',
        title: 'วันสิ้นสุดการรับยื่นข้อเสนอ',
        status: 'upcoming',
    },
];

export default function ProcurementAnnouncement({ announcementId }: Props) {
    return (
        <AppHeaderLayout>
            <Head title={`รายละเอียดประกาศ ${announcementId}`} />
            <div className="flex flex-col gap-6 px-4 py-6 md:px-8">
                <nav className="flex flex-wrap items-center gap-2 text-sm">
                    <Link
                        href="/"
                        className="text-muted-foreground hover:text-primary hover:underline"
                    >
                        หน้าหลัก
                    </Link>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Link
                        href="/procurement"
                        className="text-muted-foreground hover:text-primary hover:underline"
                    >
                        ประกาศจัดซื้อจัดจ้าง
                    </Link>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                        โครงการเลขที่ #{announcementId}
                    </span>
                </nav>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex max-w-3xl flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <StatusBadge status="open" />
                            <span className="text-sm text-muted-foreground">
                                วันที่ประกาศ: 25 ต.ค. 2566
                            </span>
                        </div>
                        <h1 className="text-2xl leading-tight font-black tracking-tight text-foreground md:text-4xl">
                            ก่อสร้างศูนย์การเรียนรู้ชุมชน อำเภอเมือง
                        </h1>
                        <p className="text-muted-foreground">
                            รหัสโครงการ: {announcementId}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" className="gap-2">
                            <Bookmark className="h-4 w-4" />
                            บันทึก
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <Share2 className="h-4 w-4" />
                            แชร์
                        </Button>
                        <Button className="gap-2 shadow-sm">
                            <Download className="h-4 w-4" />
                            ดาวน์โหลดเอกสาร PDF
                        </Button>
                    </div>
                </div>

                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-2 border-b border-border bg-muted/30 py-4">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                            รายละเอียดประกาศจัดซื้อจัดจ้าง
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    หน่วยงานที่รับผิดชอบ
                                </p>
                                <p className="font-medium text-foreground">
                                    องค์การบริหารส่วนจังหวัดขอนแก่น
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    งบประมาณโครงการ
                                </p>
                                <p className="font-medium text-foreground">
                                    5,000,000 บาท
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    ราคากลาง
                                </p>
                                <p className="font-medium text-foreground">
                                    4,950,000 บาท
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    สิ้นสุดรับยื่นข้อเสนอ
                                </p>
                                <p className="font-bold text-destructive">
                                    15 พ.ย. 2566
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-border border-t border-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    ชื่อผู้ติดต่อ
                                </p>
                                <p className="font-medium text-foreground">
                                    นายสมชาย ใจดี
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    เบอร์โทรศัพท์ติดต่อ
                                </p>
                                <p className="font-medium text-foreground">
                                    043-123-4567
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    วิธีการจัดซื้อจัดจ้าง
                                </p>
                                <p className="font-medium text-foreground">
                                    e-market
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    วันที่ประกาศเผยแพร่
                                </p>
                                <p className="font-medium text-foreground">
                                    20 ต.ค. 2566
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground">
                                <FileText className="h-7 w-7 text-primary" />
                                เอกสารข้อกำหนด (TOR)
                            </h2>
                            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                                <span>หน้า 1 จาก 14</span>
                                <span>|</span>
                                <button className="hover:text-primary">
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span>100%</span>
                                <button className="hover:text-primary">
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="group relative flex h-[600px] flex-col overflow-hidden rounded-xl border border-border bg-[#525659] shadow-lg">
                            <div className="flex h-12 items-center justify-between border-b border-[#404447] bg-[#323639] px-4">
                                <div className="flex items-center gap-4 text-gray-300">
                                    <Menu className="h-5 w-5 cursor-pointer hover:text-white" />
                                    <span className="max-w-[200px] truncate text-sm font-medium">
                                        TOR-{announcementId}.pdf
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-300">
                                    <Minus className="h-5 w-5 cursor-pointer hover:text-white" />
                                    <Plus className="h-5 w-5 cursor-pointer hover:text-white" />
                                    <Maximize2 className="h-5 w-5 cursor-pointer hover:text-white" />
                                </div>
                            </div>

                            <div className="custom-scrollbar flex flex-1 justify-center overflow-y-auto bg-[#525659] p-8">
                                <div className="min-h-[800px] w-full max-w-[800px] bg-white p-12 text-foreground shadow-2xl">
                                    <div className="flex flex-col gap-6">
                                        <div className="mb-4 flex items-start justify-between border-b-2 border-black pb-4">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <div className="text-right">
                                                <h3 className="text-lg font-bold">
                                                    เอกสารทางราชการ
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    เลขที่อ้างอิง:
                                                    KK-PROC-2023-882
                                                </p>
                                            </div>
                                        </div>

                                        <h2 className="mb-4 text-center text-xl font-bold uppercase">
                                            ร่างขอบเขตของงาน (TOR)
                                        </h2>
                                        <h3 className="mb-8 text-center text-lg font-medium">
                                            ชื่อโครงการ:
                                            ก่อสร้างศูนย์การเรียนรู้ชุมชน
                                            อำเภอเมือง
                                        </h3>

                                        <div className="space-y-4 text-justify text-sm leading-relaxed">
                                            <p>
                                                <strong>1. ความเป็นมา</strong>
                                            </p>
                                            <p>
                                                องค์การบริหารส่วนจังหวัดขอนแก่น
                                                ตระหนักถึงความจำเป็นในการจัดสร้างศูนย์การเรียนรู้ชุมชนแห่งใหม่
                                                เพื่อรองรับจำนวนประชากรที่เพิ่มขึ้นในเขตอำเภอเมือง
                                                สถานที่แห่งนี้จะเป็นศูนย์กลางของกิจกรรมด้านวัฒนธรรม
                                                การศึกษา และสันทนาการ
                                            </p>
                                            <p>
                                                <strong>2. วัตถุประสงค์</strong>
                                            </p>
                                            <ul className="list-disc space-y-1 pl-5">
                                                <li>
                                                    เพื่อก่อสร้างอาคารอเนกประสงค์ตามมาตรฐานความปลอดภัย
                                                </li>
                                                <li>
                                                    เพื่อจัดเตรียมสถานที่สำหรับการมีส่วนร่วมของชุมชนและกิจกรรมท้องถิ่น
                                                </li>
                                                <li>
                                                    เพื่อยกระดับโครงสร้างพื้นฐานของจังหวัด
                                                </li>
                                            </ul>
                                            <p>
                                                <strong>3. ขอบเขตของงาน</strong>
                                            </p>
                                            <p>
                                                ผู้รับจ้างจะต้องรับผิดชอบงานก่อสร้างทั้งหมด
                                                รวมถึงงานวิศวกรรมโยธา
                                                งานติดตั้งไฟฟ้า งานประปา
                                                และภูมิสถาปัตยกรรมตามรายละเอียดในแบบแปลนแนบท้าย
                                                พื้นที่ก่อสร้างรวมประมาณ 1,200
                                                ตารางเมตร
                                            </p>

                                            <div className="my-4 flex h-32 w-full items-center justify-center rounded border border-muted bg-muted/30">
                                                <span className="text-muted-foreground italic">
                                                    [พื้นที่แสดงแผนผังทางสถาปัตยกรรม]
                                                </span>
                                            </div>

                                            <p>
                                                <strong>
                                                    4. คุณสมบัติผู้ยื่นข้อเสนอ
                                                </strong>
                                            </p>
                                            <p>
                                                ผู้ยื่นข้อเสนอต้องเป็นนิติบุคคลที่จดทะเบียน
                                                มีทุนจดทะเบียนไม่ต่ำกว่า
                                                2,000,000 บาท
                                                และมีผลงานประเภทเดียวกันกับงานที่ประกาศจัดซื้อจัดจ้างกับหน่วยงานภาครัฐภายในระยะเวลา
                                                5 ปีที่ผ่านมา
                                            </p>
                                        </div>

                                        <div className="mt-12 flex items-end justify-between border-t border-muted pt-8">
                                            <div className="text-center">
                                                <div className="mb-2 h-12 w-32 border-b border-dotted border-muted-foreground"></div>
                                                <p className="text-xs text-muted-foreground">
                                                    ลงชื่อผู้มีอำนาจลงนาม
                                                </p>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                หน้า 1 จาก 14
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="absolute right-6 bottom-6 h-14 w-14 rounded-full p-0 shadow-lg transition-transform hover:scale-105"
                            >
                                <Download className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    ข้อมูลติดต่อ & เอกสารที่ต้องใช้
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {attachments.map((file) => (
                                    <div
                                        key={file.name}
                                        className="group/item flex cursor-pointer items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded ${
                                                    file.icon === 'pdf'
                                                        ? 'bg-red-50 text-red-600'
                                                        : 'bg-blue-50 text-blue-600'
                                                }`}
                                            >
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground group-hover/item:text-primary">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {file.type} · {file.size}
                                                </p>
                                            </div>
                                        </div>
                                        <Download className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    กำหนดการ
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Timeline items={timelineItems} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppHeaderLayout>
    );
}
