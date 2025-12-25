'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Settings, HardDrive, FileText, Trash2, Edit2, Shield, ArrowLeft, RefreshCw, Ban, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
    enabled: boolean;
    createdAt: string;
    quota: {
        usedBytes: number | string;
        maxBytes: number | string;
    } | null;
}

interface Stats {
    totalUsers: number;
    totalFiles: number;
    totalStorageUsed: number | string;
}

type Tab = 'users' | 'settings';

export default function AdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = api.getToken();
        if (!token) {
            router.push('/auth/login');
            return;
        }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = api.getToken();

            const [usersResponse, statsData] = await Promise.all([
                fetch(`${API_URL}/api/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(r => r.json()),
                fetch(`${API_URL}/api/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(r => r.json()).catch(() => null),
            ]);

            // API returns { data: users[], meta: {...} } for paginated response
            let usersData: User[] = [];
            if (Array.isArray(usersResponse)) {
                usersData = usersResponse;
            } else if (usersResponse?.data && Array.isArray(usersResponse.data)) {
                usersData = usersResponse.data;
            } else if (usersResponse?.message) {
                setError(usersResponse.message);
            }

            setUsers(usersData);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load admin data:', error);
            setError('Failed to load admin data. You may not have admin privileges.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleUserStatus = async (userId: string, enabled: boolean) => {
        try {
            const token = api.getToken();
            await fetch(`${API_URL}/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ enabled }),
            });
            await loadData();
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? All their files will be deleted.')) return;

        try {
            const token = api.getToken();
            await fetch(`${API_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            await loadData();
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/dashboard')} className="w-full">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary-600" />
                                Admin Panel
                            </h1>
                        </div>
                        <Button variant="ghost" size="icon" onClick={loadData}>
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/50">
                                        <Users className="h-6 w-6 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                                        <p className="text-2xl font-bold">{stats.totalUsers}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50">
                                        <FileText className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Files</p>
                                        <p className="text-2xl font-bold">{stats.totalFiles}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                        <HardDrive className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Storage</p>
                                        <p className="text-2xl font-bold">{formatBytes(stats.totalStorageUsed)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={tab === 'users' ? 'default' : 'outline'}
                        onClick={() => setTab('users')}
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Users
                    </Button>
                    <Button
                        variant={tab === 'settings' ? 'default' : 'outline'}
                        onClick={() => setTab('settings')}
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </div>

                {/* Users Tab */}
                {tab === 'users' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Manage user accounts and permissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {users.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                        No users found
                                    </p>
                                ) : (
                                    users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'ADMIN'
                                                    ? 'bg-primary-100 dark:bg-primary-900/50'
                                                    : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}>
                                                    <span className="text-sm font-medium">
                                                        {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium flex items-center gap-2">
                                                        {user.name || 'Unnamed'}
                                                        {user.role === 'ADMIN' && (
                                                            <span className="text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-600 px-2 py-0.5 rounded">
                                                                Admin
                                                            </span>
                                                        )}
                                                        {!user.enabled && (
                                                            <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-600 px-2 py-0.5 rounded">
                                                                Disabled
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                    <p className="text-xs text-gray-400">
                                                        Joined {formatDate(user.createdAt)}
                                                        {user.quota && (
                                                            <> • {formatBytes(user.quota.usedBytes)} / {formatBytes(user.quota.maxBytes)}</>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleUserStatus(user.id, !user.enabled)}
                                                    title={user.enabled ? 'Disable user' : 'Enable user'}
                                                >
                                                    {user.enabled ? (
                                                        <Ban className="h-4 w-4 text-orange-500" />
                                                    ) : (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={async () => {
                                                        const currentGB = user.quota ? Math.round(Number(user.quota.maxBytes) / (1024 * 1024 * 1024)) : 5;
                                                        const newGB = prompt(`Enter new storage quota in GB (current: ${currentGB} GB):`, String(currentGB));
                                                        if (newGB && !isNaN(Number(newGB))) {
                                                            try {
                                                                const token = api.getToken();
                                                                await fetch(`${API_URL}/api/admin/users/${user.id}/quota`, {
                                                                    method: 'PATCH',
                                                                    headers: {
                                                                        'Authorization': `Bearer ${token}`,
                                                                        'Content-Type': 'application/json',
                                                                    },
                                                                    body: JSON.stringify({ maxBytes: String(Number(newGB) * 1024 * 1024 * 1024) }),
                                                                });
                                                                await loadData();
                                                            } catch (error) {
                                                                console.error('Failed to update quota:', error);
                                                            }
                                                        }
                                                    }}
                                                    title="Edit quota"
                                                >
                                                    <Edit2 className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={user.role === 'ADMIN'}
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Settings Tab */}
                {tab === 'settings' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Settings</CardTitle>
                            <CardDescription>Configure platform-wide settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Application Logo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
                                        <span className="text-xs text-gray-400">Logo</span>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="logo-upload"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const formData = new FormData();
                                                formData.append('logo', file);
                                                try {
                                                    const token = api.getToken();
                                                    await fetch(`${API_URL}/api/settings/logo`, {
                                                        method: 'POST',
                                                        headers: { 'Authorization': `Bearer ${token}` },
                                                        body: formData,
                                                    });
                                                    alert('Logo uploaded successfully!');
                                                    window.location.reload();
                                                } catch (error) {
                                                    console.error('Logo upload failed:', error);
                                                    alert('Logo upload failed');
                                                }
                                            }}
                                        />
                                        <label htmlFor="logo-upload" className="cursor-pointer">
                                            <span className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 h-10 px-4 py-2">
                                                Upload Logo
                                            </span>
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">PNG or SVG, max 1MB. Used in header and favicon.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Application Name</label>
                                <Input defaultValue="UnPload" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Default Quota (GB)</label>
                                <Input type="number" defaultValue="5" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Allow Registration</label>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" defaultChecked className="rounded" />
                                    <span className="text-sm text-gray-500">Allow new users to register</span>
                                </div>
                            </div>
                            <Button>Save Settings</Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
