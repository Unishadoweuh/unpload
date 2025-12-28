'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, RefreshCw, RotateCcw, XCircle, FileIcon, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatBytes, formatDate, getFileIcon } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface TrashItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    size?: number;
    deletedAt: string;
    expiresAt: string;
    mimeType?: string;
}

export default function TrashPage() {
    const router = useRouter();
    const [items, setItems] = useState<TrashItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState<string | null>(null);

    useEffect(() => {
        const token = api.getToken();
        if (!token) {
            router.push('/auth/login');
            return;
        }
        loadTrash();
    }, []);

    const loadTrash = async () => {
        try {
            setLoading(true);
            const token = api.getToken();
            const response = await fetch(`${API_URL}/api/trash`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setItems(Array.isArray(data) ? data : data.items || []);
            }
        } catch (error) {
            console.error('Failed to load trash:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (itemId: string, type: 'file' | 'folder') => {
        setRestoring(itemId);
        try {
            const token = api.getToken();
            const endpoint = type === 'file'
                ? `${API_URL}/api/trash/files/${itemId}/restore`
                : `${API_URL}/api/trash/folders/${itemId}/restore`;

            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            await loadTrash();
        } catch (error) {
            console.error('Failed to restore:', error);
        } finally {
            setRestoring(null);
        }
    };

    const handlePermanentDelete = async (itemId: string, type: 'file' | 'folder') => {
        if (!confirm('This will permanently delete the item. This cannot be undone.')) return;

        try {
            const token = api.getToken();
            const endpoint = type === 'file'
                ? `${API_URL}/api/trash/files/${itemId}`
                : `${API_URL}/api/trash/folders/${itemId}`;

            await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            await loadTrash();
        } catch (error) {
            console.error('Failed to permanently delete:', error);
        }
    };

    const handleEmptyTrash = async () => {
        if (!confirm('This will permanently delete all items in trash. This cannot be undone.')) return;

        try {
            const token = api.getToken();
            await fetch(`${API_URL}/api/trash/empty`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            await loadTrash();
        } catch (error) {
            console.error('Failed to empty trash:', error);
        }
    };

    const getDaysUntilExpiry = (expiresAt: string) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const days = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return days;
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
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Trash2 className="h-5 w-5 text-red-500" />
                                Trash
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={loadTrash}>
                                <RefreshCw className="h-5 w-5" />
                            </Button>
                            {items.length > 0 && (
                                <Button variant="destructive" onClick={handleEmptyTrash}>
                                    Empty Trash
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {items.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Trash2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Trash is empty
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Deleted files will appear here for 30 days before being permanently removed
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {items.length} item{items.length !== 1 ? 's' : ''} in trash • Items are permanently deleted after 30 days
                        </p>
                        {items.map((item) => {
                            const daysLeft = getDaysUntilExpiry(item.expiresAt);
                            return (
                                <Card key={item.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="text-2xl">
                                                    {item.type === 'folder' ? (
                                                        <Folder className="h-8 w-8 text-yellow-500" />
                                                    ) : (
                                                        <span>{item.mimeType ? getFileIcon(item.mimeType) : '📄'}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{item.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Deleted {formatDate(item.deletedAt)}
                                                        {item.size && ` • ${formatBytes(item.size)}`}
                                                    </p>
                                                    <p className={`text-xs ${daysLeft <= 7 ? 'text-red-500' : 'text-gray-400'}`}>
                                                        {daysLeft > 0 ? `${daysLeft} days until permanent deletion` : 'Expires today'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRestore(item.id, item.type)}
                                                    disabled={restoring === item.id}
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-1" />
                                                    {restoring === item.id ? 'Restoring...' : 'Restore'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handlePermanentDelete(item.id, item.type)}
                                                >
                                                    <XCircle className="h-4 w-4 text-red-500" />
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
