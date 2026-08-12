<?php

namespace App\Support\Procurement;

class Taxonomy
{
    private const ORGANIZATIONS = [
        'องค์การบริหารส่วนจังหวัด',
        'เทศบาลนครขอนแก่น',
        'แขวงทางหลวงขอนแก่น',
        'มหาวิทยาลัยขอนแก่น',
        'สำนักงานสาธารณสุขจังหวัด',
        'โรงพยาบาลธัญญารักษ์ขอนแก่น',
    ];

    private const METHODS = [
        'e-bidding' => 'ประกวดราคาอิเล็กทรอนิกส์ (e-bidding)',
        'selective' => 'คัดเลือก',
        'specific' => 'เฉพาะเจาะจง',
    ];

    private const CATEGORIES = [
        'construction' => 'จ้างก่อสร้าง',
        'goods' => 'ซื้อ',
        'services' => 'จ้างทำของ/จ้างเหมาบริการ',
        'consulting' => 'จ้างที่ปรึกษา',
    ];

    public static function organizations(): array
    {
        return self::ORGANIZATIONS;
    }

    public static function methods(): array
    {
        return self::METHODS;
    }

    public static function categories(): array
    {
        return self::CATEGORIES;
    }

    public static function organizationOptions(): array
    {
        return array_map(
            static fn (string $organization): array => [
                'value' => $organization,
                'label' => $organization,
            ],
            self::ORGANIZATIONS,
        );
    }

    public static function methodOptions(): array
    {
        return self::toOptions(self::METHODS);
    }

    public static function categoryOptions(): array
    {
        return self::toOptions(self::CATEGORIES);
    }

    public static function forInertia(): array
    {
        return [
            'organizations' => self::organizationOptions(),
            'methods' => self::methodOptions(),
            'categories' => self::categoryOptions(),
            'methodLabels' => self::methods(),
            'categoryLabels' => self::categories(),
        ];
    }

    private static function toOptions(array $values): array
    {
        return array_map(
            static fn (string $value, string $label): array => [
                'value' => $value,
                'label' => $label,
            ],
            array_keys($values),
            array_values($values),
        );
    }
}
