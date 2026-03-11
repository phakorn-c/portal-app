export type AnnouncementStatus = 'open' | 'urgent' | 'closing' | 'closed';

export interface Announcement {
    id: string;
    title: string;
    organization: string;
    category: string;
    method: string;
    budget: number;
    location: string;
    publishedAt: string;
    deadline: string;
    status: AnnouncementStatus;
    contactName?: string;
    contactPhone?: string;
    referencePrice?: number;
    description?: string;
}

export interface AnnouncementAttachment {
    id: string;
    name: string;
    type: 'PDF' | 'ZIP' | 'DOC' | 'XLS';
    size: string;
    url?: string;
}

export interface Organization {
    id: string;
    name: string;
    shortName?: string;
    type: 'government' | 'municipality' | 'university' | 'hospital' | 'other';
}

export interface ProcurementMethod {
    id: string;
    name: string;
    code: string;
}

export interface Alert {
    id: string;
    name: string;
    criteria: FilterState;
    alert_enabled: boolean;
    last_notified_at: string | null;
}

export interface NotificationChannel {
    id: string;
    type: 'email' | 'in-app' | 'sms';
    enabled: boolean;
    isPro?: boolean;
}

export interface UserStats {
    activeTracking: number;
    savedProjects: number;
    pendingSubmissions: number;
    downloads: number;
}

export interface AdminStats {
    openAnnouncements: number;
    pendingReview: number;
    expired: number;
}

export interface SavedSearch {
    id: string;
    name: string;
    criteria: FilterState;
    alert_enabled: boolean;
    last_notified_at: string | null;
}

export interface ActivityItem {
    id: string;
    type: 'view' | 'download' | 'save' | 'alert';
    title: string;
    description?: string;
    timestamp: string;
    relatedId?: string;
}

export interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}

export interface FilterState {
    query: string;
    budgetRange: [number, number];
    organizations: string[];
    methods: string[];
    categories: string[];
    sortBy: 'latest' | 'budget-high' | 'budget-low' | 'deadline';
}
