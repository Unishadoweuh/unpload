// User Types
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    oauthProvider?: OAuthProvider;
    oauthId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

export enum OAuthProvider {
    DISCORD = 'DISCORD',
    GOOGLE = 'GOOGLE',
    GITHUB = 'GITHUB',
}

// File Types
export interface File {
    id: string;
    userId: string;
    folderId?: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    storagePath: string;
    checksum: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Folder {
    id: string;
    userId: string;
    parentId?: string;
    name: string;
    createdAt: Date;
}

// Share Types
export interface Share {
    id: string;
    slug: string;
    userId: string;
    fileId?: string;
    folderId?: string;
    visibility: ShareVisibility;
    passwordHash?: string;
    expiresAt?: Date;
    maxDownloads?: number;
    downloadCount: number;
    enabled: boolean;
    createdAt: Date;
}

export enum ShareVisibility {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE',
}

// Quota Types
export interface Quota {
    id: string;
    userId: string;
    maxBytes: bigint;
    usedBytes: bigint;
}

// Settings Types
export interface Setting {
    key: string;
    value: unknown;
    category: SettingCategory;
    updatedAt: Date;
}

export enum SettingCategory {
    GENERAL = 'general',
    STORAGE = 'storage',
    EMAIL = 'email',
    LIMITS = 'limits',
    SECURITY = 'security',
}

// API Response Types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ApiMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface ApiMeta {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
}

// Auth Types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}

// File Upload Types
export interface UploadRequest {
    folderId?: string;
}

export interface CreateShareRequest {
    fileId?: string;
    folderId?: string;
    visibility: ShareVisibility;
    password?: string;
    expiresAt?: string;
    maxDownloads?: number;
}

export interface UpdateShareRequest {
    visibility?: ShareVisibility;
    password?: string;
    expiresAt?: string | null;
    maxDownloads?: number | null;
    enabled?: boolean;
}

// Admin Types
export interface SystemStats {
    totalUsers: number;
    totalFiles: number;
    totalShares: number;
    totalStorageUsed: bigint;
    activeShares: number;
}

export interface UpdateUserRequest {
    name?: string;
    role?: UserRole;
    maxQuota?: bigint;
}

// Wizard Types
export interface WizardStatus {
    completed: boolean;
    currentStep?: WizardStep;
}

export enum WizardStep {
    WELCOME = 'welcome',
    DATABASE = 'database',
    STORAGE = 'storage',
    SMTP = 'smtp',
    ADMIN = 'admin',
    BRANDING = 'branding',
    COMPLETE = 'complete',
}

export interface DatabaseConfig {
    url: string;
}

export interface StorageConfig {
    type: 'local' | 's3';
    localPath?: string;
    s3Endpoint?: string;
    s3Bucket?: string;
    s3AccessKey?: string;
    s3SecretKey?: string;
    s3Region?: string;
}

export interface SmtpConfig {
    host: string;
    port: number;
    user?: string;
    password?: string;
    from: string;
    secure?: boolean;
}

export interface AdminConfig {
    email: string;
    password: string;
    name: string;
}

export interface BrandingConfig {
    appName: string;
    primaryColor?: string;
    logoUrl?: string;
}
