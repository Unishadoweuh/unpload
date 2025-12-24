// API Endpoints
export const API_ROUTES = {
    // Auth
    AUTH: {
        REGISTER: '/api/auth/register',
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        ME: '/api/auth/me',
        REFRESH: '/api/auth/refresh',
        OAUTH_DISCORD: '/api/auth/oauth/discord',
        OAUTH_DISCORD_CALLBACK: '/api/auth/oauth/discord/callback',
    },

    // Files
    FILES: {
        LIST: '/api/files',
        UPLOAD: '/api/files/upload',
        UPLOAD_FOLDER: '/api/files/upload/folder',
        GET: (id: string) => `/api/files/${id}`,
        DOWNLOAD: (id: string) => `/api/files/${id}/download`,
        PREVIEW: (id: string) => `/api/files/${id}/preview`,
        UPDATE: (id: string) => `/api/files/${id}`,
        DELETE: (id: string) => `/api/files/${id}`,
        MOVE: (id: string) => `/api/files/${id}/move`,
    },

    // Folders
    FOLDERS: {
        LIST: '/api/folders',
        CREATE: '/api/folders',
        GET: (id: string) => `/api/folders/${id}`,
        UPDATE: (id: string) => `/api/folders/${id}`,
        DELETE: (id: string) => `/api/folders/${id}`,
    },

    // Shares
    SHARES: {
        LIST: '/api/shares',
        CREATE: '/api/shares',
        GET: (slug: string) => `/api/shares/${slug}`,
        VERIFY: (slug: string) => `/api/shares/${slug}/verify`,
        DOWNLOAD: (slug: string) => `/api/shares/${slug}/download`,
        UPDATE: (id: string) => `/api/shares/${id}`,
        DELETE: (id: string) => `/api/shares/${id}`,
    },

    // Admin
    ADMIN: {
        USERS: '/api/admin/users',
        USER: (id: string) => `/api/admin/users/${id}`,
        STATS: '/api/admin/stats',
        STORAGE: '/api/admin/storage',
    },

    // Settings
    SETTINGS: {
        LIST: '/api/settings',
        GET: (key: string) => `/api/settings/${key}`,
        UPDATE: (key: string) => `/api/settings/${key}`,
        SMTP_TEST: '/api/settings/smtp/test',
    },

    // Wizard
    WIZARD: {
        STATUS: '/api/wizard/status',
        DATABASE: '/api/wizard/database',
        STORAGE: '/api/wizard/storage',
        SMTP: '/api/wizard/smtp',
        ADMIN: '/api/wizard/admin',
        BRANDING: '/api/wizard/branding',
        COMPLETE: '/api/wizard/complete',
    },
} as const;

// Storage limits
export const LIMITS = {
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB default
    DEFAULT_QUOTA: 5 * 1024 * 1024 * 1024, // 5GB default
    MAX_SHARE_EXPIRY_DAYS: 365,
    MIN_PASSWORD_LENGTH: 8,
    SLUG_LENGTH: 8,
} as const;

// Mime types for preview
export const PREVIEWABLE_TYPES = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    documents: ['application/pdf'],
    text: ['text/plain', 'text/markdown', 'text/html', 'text/css', 'text/javascript'],
    code: ['application/json', 'application/xml'],
} as const;

export const ALL_PREVIEWABLE = [
    ...PREVIEWABLE_TYPES.images,
    ...PREVIEWABLE_TYPES.documents,
    ...PREVIEWABLE_TYPES.text,
    ...PREVIEWABLE_TYPES.code,
];

// Settings keys
export const SETTING_KEYS = {
    // General
    APP_NAME: 'app_name',
    APP_LOGO: 'app_logo',
    PRIMARY_COLOR: 'primary_color',
    LANGUAGE: 'language',

    // Storage
    STORAGE_TYPE: 'storage_type',
    S3_ENDPOINT: 's3_endpoint',
    S3_BUCKET: 's3_bucket',
    S3_ACCESS_KEY: 's3_access_key',
    S3_SECRET_KEY: 's3_secret_key',
    S3_REGION: 's3_region',

    // Email
    SMTP_HOST: 'smtp_host',
    SMTP_PORT: 'smtp_port',
    SMTP_USER: 'smtp_user',
    SMTP_PASSWORD: 'smtp_password',
    SMTP_FROM: 'smtp_from',
    SMTP_SECURE: 'smtp_secure',

    // Limits
    MAX_FILE_SIZE: 'max_file_size',
    DEFAULT_QUOTA: 'default_quota',
    MAX_SHARE_EXPIRY: 'max_share_expiry',

    // Security
    ALLOW_REGISTRATION: 'allow_registration',
    REQUIRE_EMAIL_VERIFICATION: 'require_email_verification',
    OAUTH_PROVIDERS: 'oauth_providers',
} as const;

// Error codes
export const ERROR_CODES = {
    // Auth
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    EMAIL_EXISTS: 'EMAIL_EXISTS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',

    // Files
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    FOLDER_NOT_FOUND: 'FOLDER_NOT_FOUND',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

    // Shares
    SHARE_NOT_FOUND: 'SHARE_NOT_FOUND',
    SHARE_EXPIRED: 'SHARE_EXPIRED',
    SHARE_DISABLED: 'SHARE_DISABLED',
    SHARE_PASSWORD_REQUIRED: 'SHARE_PASSWORD_REQUIRED',
    SHARE_PASSWORD_INVALID: 'SHARE_PASSWORD_INVALID',
    SHARE_DOWNLOAD_LIMIT: 'SHARE_DOWNLOAD_LIMIT',

    // General
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SETUP_REQUIRED: 'SETUP_REQUIRED',
} as const;
