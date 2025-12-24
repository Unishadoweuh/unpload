'use client';

import { useState } from 'react';
import { X, Link2, Lock, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

interface ShareModalProps {
    fileId?: string;
    folderId?: string;
    itemName: string;
    onClose: () => void;
    onCreated: () => void;
}

export function ShareModal({ fileId, folderId, itemName, onClose, onCreated }: ShareModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const [usePassword, setUsePassword] = useState(false);
    const [password, setPassword] = useState('');
    const [useExpiration, setUseExpiration] = useState(false);
    const [expiresAt, setExpiresAt] = useState('');
    const [useDownloadLimit, setUseDownloadLimit] = useState(false);
    const [maxDownloads, setMaxDownloads] = useState(10);

    const handleCreate = async () => {
        setError('');
        setLoading(true);

        try {
            const result = await api.createShare(fileId, folderId, {
                visibility: 'PUBLIC',
                password: usePassword ? password : undefined,
                expiresAt: useExpiration && expiresAt ? new Date(expiresAt).toISOString() : undefined,
                maxDownloads: useDownloadLimit ? maxDownloads : undefined,
            }) as { slug: string };

            const url = `${window.location.origin}/s/${result.slug}`;
            setShareUrl(url);
            onCreated();
        } catch (err: any) {
            setError(err.message || 'Failed to create share');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-primary-600" />
                        Share {fileId ? 'File' : 'Folder'}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-4 space-y-4">
                    {shareUrl ? (
                        <>
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <p className="text-sm text-green-700 dark:text-green-400 mb-2">
                                    ✓ Share link created successfully!
                                </p>
                                <div className="flex gap-2">
                                    <Input value={shareUrl} readOnly className="text-xs" />
                                    <Button onClick={handleCopy}>
                                        {copied ? '✓ Copied!' : 'Copy'}
                                    </Button>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full" onClick={onClose}>
                                Done
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                <p className="text-sm font-medium truncate">{itemName}</p>
                            </div>

                            {/* Password Protection */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={usePassword}
                                        onChange={(e) => setUsePassword(e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Lock className="h-4 w-4" />
                                    Password Protection
                                </label>
                                {usePassword && (
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                    />
                                )}
                            </div>

                            {/* Expiration Date */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useExpiration}
                                        onChange={(e) => setUseExpiration(e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Calendar className="h-4 w-4" />
                                    Set Expiration Date
                                </label>
                                {useExpiration && (
                                    <Input
                                        type="datetime-local"
                                        value={expiresAt}
                                        onChange={(e) => setExpiresAt(e.target.value)}
                                    />
                                )}
                            </div>

                            {/* Download Limit */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useDownloadLimit}
                                        onChange={(e) => setUseDownloadLimit(e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Download className="h-4 w-4" />
                                    Limit Downloads
                                </label>
                                {useDownloadLimit && (
                                    <Input
                                        type="number"
                                        min="1"
                                        value={maxDownloads}
                                        onChange={(e) => setMaxDownloads(parseInt(e.target.value))}
                                        placeholder="Max downloads"
                                    />
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={handleCreate} disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Link'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
