'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Folder, Share2, LogOut, Plus, FileIcon, Download, Trash2, Link2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShareModal } from '@/components/share-modal';
import { api } from '@/lib/api';
import { formatBytes, formatDate, getFileIcon } from '@/lib/utils';

interface FileData {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    createdAt: string;
}

interface FolderData {
    id: string;
    name: string;
    createdAt: string;
}

interface UserData {
    id: string;
    name: string;
    email: string;
    role?: 'ADMIN' | 'USER';
    quota?: {
        usedBytes: number;
        maxBytes: number;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [files, setFiles] = useState<FileData[]>([]);
    const [folders, setFolders] = useState<FolderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [shareModal, setShareModal] = useState<{ fileId?: string; folderId?: string; name: string } | null>(null);

    useEffect(() => {
        const token = api.getToken();
        if (!token) {
            router.push('/auth/login');
            return;
        }

        loadData();
    }, [currentFolder]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [userData, filesData, foldersData] = await Promise.all([
                api.getMe(),
                api.listFiles(currentFolder || undefined),
                api.listFolders(currentFolder || undefined),
            ]);
            setUser(userData as UserData);
            setFiles((filesData as any) || []);
            setFolders((foldersData as any) || []);
        } catch (error) {
            console.error('Failed to load data:', error);
            router.push('/auth/login');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadFiles = e.target.files;
        if (!uploadFiles?.length) return;

        setUploading(true);
        try {
            await api.uploadFiles(Array.from(uploadFiles), currentFolder || undefined);
            await loadData();
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = async () => {
        await api.logout();
        router.push('/');
    };

    const handleDeleteFile = async (fileId: string) => {
        try {
            await api.deleteFile(fileId);
            await loadData();
        } catch (error) {
            console.error('Delete failed:', error);
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold text-primary-600">UnPload</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={() => router.push('/shares')}>
                                <Link2 className="h-4 w-4 mr-2" />
                                My Shares
                            </Button>
                            {user?.role === 'ADMIN' && (
                                <Button variant="ghost" onClick={() => router.push('/admin')}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Admin
                                </Button>
                            )}
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {user?.email}
                            </span>
                            <Button variant="ghost" size="icon" onClick={handleLogout}>
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/50">
                                    <FileIcon className="h-6 w-6 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Files</p>
                                    <p className="text-2xl font-bold">{files.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50">
                                    <Folder className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Folders</p>
                                    <p className="text-2xl font-bold">{folders.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                    <Upload className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Storage Used</p>
                                    <p className="text-2xl font-bold">
                                        {user?.quota ? formatBytes(user.quota.usedBytes) : '0 B'}
                                    </p>
                                </div>
                            </div>
                            {user?.quota && (
                                <div className="mt-3">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-primary-600 h-2 rounded-full transition-all"
                                            style={{ width: `${Math.min(quotaPercent, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatBytes(user.quota.usedBytes)} / {formatBytes(user.quota.maxBytes)}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Upload Button */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">My Files</h2>
                    <div className="flex gap-3">
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <Button disabled={uploading}>
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Upload Files
                                    </>
                                )}
                            </Button>
                        </label>
                    </div>
                </div>

                {/* Files Grid */}
                {files.length === 0 && folders.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Upload className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No files yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Upload your first file to get started
                        </p>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <Button size="lg">
                                <Upload className="h-5 w-5 mr-2" />
                                Upload Now
                            </Button>
                        </label>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {folders.map((folder) => (
                            <Card
                                key={folder.id}
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => setCurrentFolder(folder.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                                            <Folder className="h-8 w-8 text-yellow-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{folder.name}</p>
                                            <p className="text-sm text-gray-500">{formatDate(folder.createdAt)}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShareModal({ folderId: folder.id, name: folder.name });
                                            }}
                                        >
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {files.map((file) => (
                            <Card key={file.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">{getFileIcon(file.mimeType)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{file.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {formatBytes(file.size)} • {formatDate(file.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setShareModal({ fileId: file.id, name: file.name })}
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => window.open(`/api/files/${file.id}/download`, '_blank')}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteFile(file.id)}
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

            {/* Share Modal */}
            {shareModal && (
                <ShareModal
                    fileId={shareModal.fileId}
                    folderId={shareModal.folderId}
                    itemName={shareModal.name}
                    onClose={() => setShareModal(null)}
                    onCreated={() => { }}
                />
            )}
        </div>
    );
}
