'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, Lock, FileIcon, Folder, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatBytes } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ShareInfo {
    slug: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    hasPassword: boolean;
    expiresAt: string | null;
    file?: { name: string; size: number; mimeType: string } | null;
    folder?: { name: string } | null;
    error?: string;
}

export default function PublicSharePage() {
    const params = useParams();
    const slug = params.slug as string;
    const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        loadShareInfo();
    }, [slug]);

    const loadShareInfo = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/shares/${slug}`);
            const data = await response.json();
            setShareInfo(data);
        } catch (error) {
            console.error('Failed to load share:', error);
            setShareInfo({ slug, visibility: 'PUBLIC', hasPassword: false, expiresAt: null, error: 'Failed to load share' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (shareInfo?.hasPassword && !password) {
            setPasswordError('Please enter the password');
            return;
        }

        try {
            setDownloading(true);
            setPasswordError('');

            const response = await fetch(`${API_URL}/api/shares/${slug}/download`, {
                method: 'GET',
                headers: password ? { 'X-Share-Password': password } : {},
            });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 401) {
                    setPasswordError('Invalid password');
                } else {
                    setPasswordError(error.message || 'Download failed');
                }
                return;
            }

            // Get filename from content-disposition header
            const contentDisposition = response.headers.get('content-disposition');
            let filename = shareInfo?.file?.name || 'download';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+?)"?$/);
                if (match) filename = decodeURIComponent(match[1]);
            }

            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            setPasswordError('Download failed');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (shareInfo?.error || !shareInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle>Share Not Found</CardTitle>
                        <CardDescription>
                            This share link may have expired, been deleted, or never existed.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const isFile = !!shareInfo.file;
    const isFolder = !!shareInfo.folder;
    const itemName = shareInfo.file?.name || shareInfo.folder?.name || 'Unknown';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
            <Card className="max-w-md w-full shadow-xl">
                <CardHeader className="text-center">
                    <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        {isFile ? (
                            <FileIcon className="h-10 w-10 text-primary-600" />
                        ) : (
                            <Folder className="h-10 w-10 text-primary-600" />
                        )}
                    </div>
                    <CardTitle className="text-xl">{itemName}</CardTitle>
                    {isFile && shareInfo.file && (
                        <CardDescription>
                            {formatBytes(shareInfo.file.size)}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {shareInfo.hasPassword && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Password Required
                            </label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                            />
                        </div>
                    )}

                    {passwordError && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                            {passwordError}
                        </div>
                    )}

                    {isFile && (
                        <Button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="w-full"
                            size="lg"
                        >
                            {downloading ? (
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                                <Download className="h-5 w-5 mr-2" />
                            )}
                            {downloading ? 'Downloading...' : 'Download File'}
                        </Button>
                    )}

                    {isFolder && (
                        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                            Folder browsing coming soon...
                        </div>
                    )}

                    {shareInfo.expiresAt && (
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            This link expires on {new Date(shareInfo.expiresAt).toLocaleDateString()}
                        </p>
                    )}
                </CardContent>
            </Card>

            <div className="fixed bottom-4 text-center w-full">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                    Powered by <span className="font-medium text-primary-600">UnPload</span>
                </p>
            </div>
        </div>
    );
}
