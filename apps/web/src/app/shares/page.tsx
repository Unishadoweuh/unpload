'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, Copy, ExternalLink, Trash2, ArrowLeft, Eye, Download, Calendar, Lock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Share {
    id: string;
    slug: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    hasPassword: boolean;
    expiresAt: string | null;
    maxDownloads: number | null;
    downloadCount: number;
    viewCount: number;
    createdAt: string;
    file?: { id: string; name: string };
    folder?: { id: string; name: string };
}

export default function SharesPage() {
    const router = useRouter();
    const [shares, setShares] = useState<Share[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        const token = api.getToken();
        if (!token) {
            router.push('/auth/login');
            return;
        }
        loadShares();
    }, []);

    const loadShares = async () => {
        try {
            setLoading(true);
            const data = await api.listShares() as Share[];
            setShares(data || []);
        } catch (error) {
            console.error('Failed to load shares:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (slug: string) => {
        const url = `${window.location.origin}/s/${slug}`;
        navigator.clipboard.writeText(url);
        setCopied(slug);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this share link?')) return;
        try {
            await api.deleteShare(id);
            await loadShares();
        } catch (error) {
            console.error('Failed to delete share:', error);
        }
    };

    const isExpired = (expiresAt: string | null) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    const totalViews = shares.reduce((sum, s) => sum + (s.viewCount || 0), 0);
    const totalDownloads = shares.reduce((sum, s) => sum + (s.downloadCount || 0), 0);
    const activeShares = shares.filter(s => !isExpired(s.expiresAt)).length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
                                <Link2 className="h-5 w-5 text-primary-600" />
                                My Shares
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/50">
                                    <Link2 className="h-6 w-6 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Shares</p>
                                    <p className="text-2xl font-bold">{shares.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50">
                                    <BarChart3 className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Shares</p>
                                    <p className="text-2xl font-bold">{activeShares}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                    <Eye className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
                                    <p className="text-2xl font-bold">{totalViews}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                                    <Download className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Downloads</p>
                                    <p className="text-2xl font-bold">{totalDownloads}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Shares List */}
                {shares.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Link2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No shares yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Create your first share from the dashboard
                        </p>
                        <Button onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {shares.map((share) => {
                            const expired = isExpired(share.expiresAt);
                            const itemName = share.file?.name || share.folder?.name || 'Unknown';

                            return (
                                <Card key={share.id} className={expired ? 'opacity-60' : ''}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-4 flex-wrap">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium truncate">{itemName}</p>
                                                    {expired && (
                                                        <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-600 px-2 py-0.5 rounded">
                                                            Expired
                                                        </span>
                                                    )}
                                                    {share.hasPassword && (
                                                        <Lock className="h-3 w-3 text-gray-400" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                    /s/{share.slug}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {share.viewCount || 0} views
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Download className="h-3 w-3" />
                                                        {share.downloadCount || 0}
                                                        {share.maxDownloads ? ` / ${share.maxDownloads}` : ''} downloads
                                                    </span>
                                                    {share.expiresAt && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Expires {formatDate(share.expiresAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCopy(share.slug)}
                                                >
                                                    {copied === share.slug ? (
                                                        '✓ Copied!'
                                                    ) : (
                                                        <>
                                                            <Copy className="h-4 w-4 mr-1" />
                                                            Copy
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(`/s/${share.slug}`, '_blank')}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(share.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
