'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, Share2, Copy, Trash2, Eye, EyeOff, Calendar, Download, ArrowLeft, ExternalLink, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface ShareData {
    id: string;
    slug: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    hasPassword?: boolean;
    expiresAt: string | null;
    maxDownloads: number | null;
    downloadCount: number;
    enabled: boolean;
    createdAt: string;
    file?: { id: string; name: string; size: number; mimeType: string } | null;
    folder?: { id: string; name: string } | null;
}

export default function SharesPage() {
    const router = useRouter();
    const [shares, setShares] = useState<ShareData[]>([]);
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
            const data = await api.listShares() as ShareData[];
            setShares(data || []);
        } catch (error) {
            console.error('Failed to load shares:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = (slug: string) => {
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
                            <h1 className="text-xl font-bold">My Shares</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {shares.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Share2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No shares yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Share files from the dashboard to create share links.
                        </p>
                        <Button onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {shares.map((share) => (
                            <Card key={share.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className={`p-3 rounded-lg ${share.enabled ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                {share.hasPassword ? (
                                                    <Lock className={`h-6 w-6 ${share.enabled ? 'text-primary-600' : 'text-gray-400'}`} />
                                                ) : (
                                                    <Link2 className={`h-6 w-6 ${share.enabled ? 'text-primary-600' : 'text-gray-400'}`} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {share.file?.name || share.folder?.name || 'Unnamed share'}
                                                </p>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Download className="h-3 w-3" />
                                                        {share.downloadCount}{share.maxDownloads ? `/${share.maxDownloads}` : ''} downloads
                                                    </span>
                                                    {share.expiresAt && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Expires {formatDate(share.expiresAt)}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        {share.visibility === 'PRIVATE' ? (
                                                            <><EyeOff className="h-3 w-3" /> Private</>
                                                        ) : (
                                                            <><Eye className="h-3 w-3" /> Public</>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 mr-2">
                                                <code className="text-xs text-gray-600 dark:text-gray-300 mr-2">
                                                    /s/{share.slug}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => handleCopyLink(share.slug)}
                                                >
                                                    {copied === share.slug ? (
                                                        <span className="text-xs text-green-600">✓</span>
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => window.open(`/s/${share.slug}`, '_blank')}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(share.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
