'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatBytes } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    quota: {
        usedBytes: number | string;
        maxBytes: number | string;
    } | null;
}

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        const token = api.getToken();
        if (!token) {
            router.push('/auth/login');
            return;
        }
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const userData = await api.getMe() as UserProfile;
            setUser(userData);
            setName(userData.name || '');
            setEmail(userData.email || '');
        } catch (error) {
            console.error('Failed to load profile:', error);
            router.push('/auth/login');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);

        try {
            const token = api.getToken();
            const response = await fetch(`${API_URL}/api/users/me`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            await loadProfile();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }

        setSaving(true);

        try {
            const token = api.getToken();
            const response = await fetch(`${API_URL}/api/users/me/password`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to change password');
            }

            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to change password' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const quotaPercent = user?.quota
        ? (Number(user.quota.usedBytes) / Number(user.quota.maxBytes)) * 100
        : 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <User className="h-5 w-5 text-primary-600" />
                                Profile Settings
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Storage Usage */}
                {user?.quota && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Storage Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>{formatBytes(user.quota.usedBytes)} used</span>
                                    <span>{formatBytes(user.quota.maxBytes)} total</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all ${quotaPercent > 90 ? 'bg-red-500' : quotaPercent > 70 ? 'bg-yellow-500' : 'bg-primary-600'
                                            }`}
                                        style={{ width: `${Math.min(quotaPercent, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">{quotaPercent.toFixed(1)}% used</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Profile Information */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Profile Information</CardTitle>
                        <CardDescription>Update your name and email address</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Name
                                </label>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="bg-gray-100 dark:bg-gray-800"
                                />
                                <p className="text-xs text-gray-500">Email cannot be changed</p>
                            </div>
                            <Button type="submit" disabled={saving}>
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Change Password</CardTitle>
                        <CardDescription>Update your password to keep your account secure</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    Current Password
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password</label>
                                <div className="relative">
                                    <Input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirm New Password</label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <Button type="submit" disabled={saving || !currentPassword || !newPassword}>
                                <Lock className="h-4 w-4 mr-2" />
                                {saving ? 'Changing...' : 'Change Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
