export type User = {
    id: number;
    name: string;
    email: string;
    role: 'registered' | 'admin';
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Capabilities = {
    isAdmin: boolean;
    isRegistered: boolean;
};

export type Auth = {
    user: User | null;
    capabilities: Capabilities;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
