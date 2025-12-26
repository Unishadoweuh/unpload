'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { ArrowLeft, User, Key, HardDrive, Download } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
    quota?: {
        maxBytes: string;
        usedBytes: string;
    };
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await api.getProfile() as UserProfile;
            setUser(data);
        } catch (error) {
            console.error('Failed to load profile:', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const name = (document.getElementById('name') as HTMLInputElement).value;
            await api.updateProfile({ name });
            alert('Profile updated!');
            loadProfile();
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement).value;
        const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
        const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        setSaving(true);
        try {
            await api.changePassword(currentPassword, newPassword);
            alert('Password changed successfully!');
            (document.getElementById('currentPassword') as HTMLInputElement).value = '';
            (document.getElementById('newPassword') as HTMLInputElement).value = '';
            (document.getElementById('confirmPassword') as HTMLInputElement).value = '';
        } catch (error) {
            console.error('Failed to change password:', error);
            alert('Failed to change password. Check your current password.');
        } finally {
            setSaving(false);
        }
    };

    const downloadShareXConfig = () => {
        const token = api.getToken();
        const config = {
            Version: "14.0.0",
            Name: "UnPload",
            DestinationType: "ImageUploader, FileUploader",
            RequestMethod: "POST",
            RequestURL: `${API_URL}/api/files/upload`,
            Headers: {
                Authorization: `Bearer ${token}`
            },
            Body: "MultipartFormData",
            FileFormName: "file",
            URL: "{json:share.url}",
            ThumbnailURL: "",
            DeletionURL: ""
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'UnPload-ShareX.sxcu';
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatBytes = (bytes: string | number) => {
        const b = typeof bytes === 'string' ? parseInt(bytes) : bytes;
        if (b === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold">Profile Settings</h1>
                </div>

                {/* Profile Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>Update your account details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input value={user?.email || ''} disabled className="bg-gray-100 dark:bg-gray-800" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input id="name" defaultValue={user?.name || ''} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Input value={user?.role || ''} disabled className="bg-gray-100 dark:bg-gray-800" />
                            </div>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Storage */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5" />
                            Storage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user?.quota && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Used: {formatBytes(user.quota.usedBytes)}</span>
                                    <span>Total: {formatBytes(user.quota.maxBytes)}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all"
                                        style={{
                                            width: `${Math.min(100, (parseInt(user.quota.usedBytes) / parseInt(user.quota.maxBytes)) * 100)}%`
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Change Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Current Password</label>
                                <Input id="currentPassword" type="password" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password</label>
                                <Input id="newPassword" type="password" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirm New Password</label>
                                <Input id="confirmPassword" type="password" />
                            </div>
                            <Button type="submit" variant="outline" disabled={saving}>
                                {saving ? 'Changing...' : 'Change Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* ShareX Integration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            ShareX Integration
                        </CardTitle>
                        <CardDescription>Upload screenshots and files directly from ShareX</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={downloadShareXConfig} variant="outline">
                            Download ShareX Config (.sxcu)
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                            Double-click the downloaded file to import it into ShareX.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
