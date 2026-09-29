import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { FilterState } from '@/types/procurement';

function readCookie(name: string): string | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const cookie = document.cookie
        .split('; ')
        .find((value) => value.startsWith(`${name}=`));

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(cookie.split('=').slice(1).join('='));
}

export function SavedSearchDialog({
    open,
    onOpenChange,
    criteria,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    criteria: FilterState;
    onSaved: (message: string | null) => void;
}) {
    const metaCsrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    const cookieCsrfToken = readCookie('XSRF-TOKEN');
    const csrfToken = metaCsrfToken ?? cookieCsrfToken;
    const [saveSearchName, setSaveSearchName] = useState('');
    const [saveSearchAlertsEnabled, setSaveSearchAlertsEnabled] =
        useState(true);
    const [saveSearchError, setSaveSearchError] = useState<string | null>(null);
    const [isSavingSearch, setIsSavingSearch] = useState(false);

    const handleSaveDialogChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
            setSaveSearchName('');
            setSaveSearchAlertsEnabled(true);
            setSaveSearchError(null);
            setIsSavingSearch(false);
        }
    };

    const handleCreateSavedSearch = async () => {
        const trimmedName = saveSearchName.trim();

        if (trimmedName === '') {
            setSaveSearchError('กรุณาตั้งชื่อการค้นหาก่อนบันทึก');

            return;
        }

        if (!csrfToken) {
            setSaveSearchError('ไม่พบข้อมูลความปลอดภัยสำหรับการบันทึกการค้นหา');

            return;
        }

        const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };

        if (metaCsrfToken) {
            headers['X-CSRF-TOKEN'] = metaCsrfToken;
        } else if (cookieCsrfToken) {
            headers['X-XSRF-TOKEN'] = cookieCsrfToken;
        }

        setIsSavingSearch(true);
        setSaveSearchError(null);
        onSaved(null);

        try {
            const response = await window.fetch('/user/saved-searches', {
                method: 'POST',
                credentials: 'same-origin',
                headers,
                body: JSON.stringify({
                    name: trimmedName,
                    criteria,
                    alert_enabled: saveSearchAlertsEnabled,
                }),
            });

            if (response.ok) {
                onSaved(`บันทึกการค้นหา "${trimmedName}" เรียบร้อยแล้ว`);
                handleSaveDialogChange(false);

                return;
            }

            const data = (await response.json().catch(() => null)) as {
                message?: string;
                errors?: Record<string, string[]>;
            } | null;

            const nameError = data?.errors?.name?.[0];
            const criteriaError = data?.errors?.criteria?.[0];

            setSaveSearchError(
                nameError ??
                    criteriaError ??
                    data?.message ??
                    'ไม่สามารถบันทึกการค้นหาได้ในขณะนี้',
            );
        } finally {
            setIsSavingSearch(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleSaveDialogChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>บันทึกการค้นหาปัจจุบัน</DialogTitle>
                    <DialogDescription>
                        ตั้งชื่อและเลือกการแจ้งเตือนสำหรับเงื่อนไขที่กำลังค้นหาอยู่ในตอนนี้
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="saved-search-name">ชื่อการค้นหา</Label>
                        <Input
                            id="saved-search-name"
                            value={saveSearchName}
                            onChange={(event) => {
                                setSaveSearchName(event.target.value);
                                if (saveSearchError) {
                                    setSaveSearchError(null);
                                }
                            }}
                            placeholder="เช่น งานก่อสร้างเทศบาลที่สนใจ"
                            data-test="procurement-save-search-name"
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label
                                htmlFor="saved-search-alert-enabled"
                                className="text-base"
                            >
                                เปิดการแจ้งเตือน
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                แจ้งเมื่อมีประกาศใหม่ที่ตรงกับเงื่อนไขนี้
                            </p>
                        </div>
                        <Switch
                            id="saved-search-alert-enabled"
                            checked={saveSearchAlertsEnabled}
                            onCheckedChange={setSaveSearchAlertsEnabled}
                            data-test="procurement-save-search-alert-enabled"
                        />
                    </div>
                    {saveSearchError && (
                        <p
                            className="text-sm font-medium text-destructive"
                            data-test="procurement-save-search-error"
                        >
                            {saveSearchError}
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSaveDialogChange(false)}
                        disabled={isSavingSearch}
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        type="button"
                        onClick={handleCreateSavedSearch}
                        disabled={isSavingSearch}
                        data-test="procurement-save-search-submit"
                    >
                        {isSavingSearch && (
                            <LoaderCircle className="mr-2 h-4 w-4 motion-safe:animate-spin" />
                        )}
                        บันทึกการค้นหา
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
