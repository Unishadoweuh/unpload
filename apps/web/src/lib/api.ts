import { API_ROUTES, AuthTokens, ApiResponse } from '@unpload/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiClient {
    private accessToken: string | null = null;

    setToken(token: string | null) {
        this.accessToken = token;
        if (token) {
            localStorage.setItem('accessToken', token);
        } else {
            localStorage.removeItem('accessToken');
        }
    }

    getToken(): string | null {
        if (this.accessToken) return this.accessToken;
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken');
        }
        return null;
    }

    private async request<T>(
        url: string,
        options: RequestInit = {},
    ): Promise<T> {
        const token = this.getToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${url}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            // If 401, token is invalid/expired - clear it
            if (response.status === 401) {
                this.setToken(null);
                // Redirect to login if in browser
                if (typeof window !== 'undefined') {
                    window.location.href = '/auth/login';
                }
            }
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Auth
    async register(email: string, password: string, name: string): Promise<AuthTokens> {
        const result = await this.request<AuthTokens>(API_ROUTES.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
        this.setToken(result.accessToken);
        return result;
    }

    async login(email: string, password: string): Promise<AuthTokens> {
        const result = await this.request<AuthTokens>(API_ROUTES.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setToken(result.accessToken);
        return result;
    }

    async logout() {
        try {
            await this.request(API_ROUTES.AUTH.LOGOUT, { method: 'POST' });
        } finally {
            this.setToken(null);
        }
    }

    async getMe() {
        return this.request(API_ROUTES.AUTH.ME);
    }

    async isAuthenticated(): Promise<boolean> {
        const token = this.getToken();
        if (!token) return false;

        try {
            await this.getMe();
            return true;
        } catch {
            return false;
        }
    }

    // Profile
    async getProfile() {
        return this.request('/api/users/me');
    }

    async updateProfile(data: { name?: string }) {
        return this.request('/api/users/me', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async changePassword(currentPassword: string, newPassword: string) {
        return this.request('/api/users/me/password', {
            method: 'PATCH',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    }

    // Files
    async listFiles(folderId?: string) {
        const url = folderId
            ? `${API_ROUTES.FILES.LIST}?folderId=${folderId}`
            : API_ROUTES.FILES.LIST;
        return this.request(url);
    }

    async uploadFiles(files: File[], folderId?: string) {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        if (folderId) formData.append('folderId', folderId);

        const token = this.getToken();
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${API_ROUTES.FILES.UPLOAD}`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');
        return response.json();
    }

    async deleteFile(id: string) {
        return this.request(API_ROUTES.FILES.DELETE(id), { method: 'DELETE' });
    }

    async renameFile(id: string, name: string) {
        return this.request(API_ROUTES.FILES.UPDATE(id), {
            method: 'PATCH',
            body: JSON.stringify({ name }),
        });
    }

    // Folders
    async listFolders(parentId?: string) {
        const url = parentId
            ? `${API_ROUTES.FOLDERS.LIST}?parentId=${parentId}`
            : API_ROUTES.FOLDERS.LIST;
        return this.request(url);
    }

    async createFolder(name: string, parentId?: string) {
        return this.request(API_ROUTES.FOLDERS.CREATE, {
            method: 'POST',
            body: JSON.stringify({ name, parentId }),
        });
    }

    async deleteFolder(id: string) {
        return this.request(API_ROUTES.FOLDERS.DELETE(id), { method: 'DELETE' });
    }

    async renameFolder(id: string, name: string) {
        return this.request(API_ROUTES.FOLDERS.UPDATE(id), {
            method: 'PATCH',
            body: JSON.stringify({ name }),
        });
    }

    async getFolder(id: string) {
        return this.request(API_ROUTES.FOLDERS.GET(id));
    }

    // Shares
    async listShares() {
        return this.request(API_ROUTES.SHARES.LIST);
    }

    async createShare(fileId?: string, folderId?: string, options: {
        visibility?: 'PUBLIC' | 'PRIVATE';
        customSlug?: string;
        password?: string;
        expiresAt?: string;
        maxDownloads?: number;
    } = {}) {
        return this.request(API_ROUTES.SHARES.CREATE, {
            method: 'POST',
            body: JSON.stringify({ fileId, folderId, ...options }),
        });
    }

    async deleteShare(id: string) {
        return this.request(API_ROUTES.SHARES.DELETE(id), { method: 'DELETE' });
    }

    // Wizard
    async getWizardStatus() {
        return this.request(API_ROUTES.WIZARD.STATUS);
    }

    async completeWizard() {
        return this.request(API_ROUTES.WIZARD.COMPLETE, { method: 'POST' });
    }
}

export const api = new ApiClient();
