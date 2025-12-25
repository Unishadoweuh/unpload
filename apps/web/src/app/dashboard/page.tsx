'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Folder, LogOut, Plus, FileIcon, Download, Trash2, Link2, Shield, Share2, Edit2, Eye, CheckSquare, Square, User, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShareModal } from '@/components/share-modal';
import { ThemeToggle } from '@/components/theme-toggle';
import { DropOverlay } from '@/components/drop-zone';
import { Breadcrumb } from '@/components/breadcrumb';
import { InlineEdit } from '@/components/inline-edit';
import { FilePreview } from '@/components/file-preview';
import { SearchBar } from '@/components/search-bar';
import { SortDropdown, SortField, SortOrder } from '@/components/sort-dropdown';
import { KeyboardShortcutsModal } from '@/components/keyboard-shortcuts-modal';
import { useDashboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
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
    parentId?: string | null;
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

interface BreadcrumbItem {
    id: string | null;
    name: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [files, setFiles] = useState<FileData[]>([]);
    const [folders, setFolders] = useState<FolderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: 'My Files' }]);
    const [shareModal, setShareModal] = useState<{ fileId?: string; folderId?: string; name: string } | null>(null);
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [editingFolder, setEditingFolder] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<FileData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

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
            setSelectedFiles(new Set());
            setSelectedFolders(new Set());
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

    // Filter and sort
    const filteredAndSortedItems = useMemo(() => {
        let filteredFiles = files;
        let filteredFolders = folders;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredFiles = files.filter(f => f.name.toLowerCase().includes(query));
            filteredFolders = folders.filter(f => f.name.toLowerCase().includes(query));
        }

        // Sort
        const sortItems = <T extends { name: string; createdAt: string; size?: number }>(items: T[]) => {
            return [...items].sort((a, b) => {
                let comparison = 0;
                switch (sortField) {
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'date':
                        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                        break;
                    case 'size':
                        comparison = (a.size || 0) - (b.size || 0);
                        break;
                }
                return sortOrder === 'asc' ? comparison : -comparison;
            });
        };

        return {
            files: sortItems(filteredFiles),
            folders: sortItems(filteredFolders),
        };
    }, [files, folders, searchQuery, sortField, sortOrder]);

    const navigateToFolder = useCallback(async (folderId: string | null, folderName?: string) => {
        if (folderId === null) {
            setBreadcrumbs([{ id: null, name: 'My Files' }]);
        } else if (folderName) {
            setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
        }
        setCurrentFolder(folderId);
    }, []);

    const navigateToBreadcrumb = useCallback((folderId: string | null) => {
        const index = breadcrumbs.findIndex(b => b.id === folderId);
        if (index !== -1) {
            setBreadcrumbs(breadcrumbs.slice(0, index + 1));
            setCurrentFolder(folderId);
        }
    }, [breadcrumbs]);

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

    const handleDroppedFiles = async (droppedFiles: File[]) => {
        setUploading(true);
        try {
            await api.uploadFiles(droppedFiles, currentFolder || undefined);
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

    const handleBulkDelete = async () => {
        if (selectedFiles.size === 0 && selectedFolders.size === 0) return;
        if (!confirm(`Delete ${selectedFiles.size + selectedFolders.size} selected items?`)) return;

        try {
            await Promise.all([
                ...Array.from(selectedFiles).map(id => api.deleteFile(id)),
                ...Array.from(selectedFolders).map(id => api.deleteFolder(id)),
            ]);
            await loadData();
        } catch (error) {
            console.error('Bulk delete failed:', error);
        }
    };

    const handleRenameFile = async (fileId: string, newName: string) => {
        try {
            await api.renameFile(fileId, newName);
            setEditingFile(null);
            await loadData();
        } catch (error) {
            console.error('Rename failed:', error);
        }
    };

    const handleRenameFolder = async (folderId: string, newName: string) => {
        try {
            await api.renameFolder(folderId, newName);
            setEditingFolder(null);
            await loadData();
        } catch (error) {
            console.error('Rename failed:', error);
        }
    };

    const toggleFileSelection = (fileId: string) => {
        setSelectedFiles(prev => {
            const next = new Set(prev);
            if (next.has(fileId)) next.delete(fileId);
            else next.add(fileId);
            return next;
        });
    };

    const toggleFolderSelection = (folderId: string) => {
        setSelectedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) next.delete(folderId);
            else next.add(folderId);
            return next;
        });
    };

    const selectAll = () => {
        setSelectedFiles(new Set(filteredAndSortedItems.files.map(f => f.id)));
        setSelectedFolders(new Set(filteredAndSortedItems.folders.map(f => f.id)));
    };

    const clearSelection = () => {
        setSelectedFiles(new Set());
        setSelectedFolders(new Set());
    };

    const hasSelection = selectedFiles.size > 0 || selectedFolders.size > 0;
    const allSelected = selectedFiles.size === filteredAndSortedItems.files.length &&
        selectedFolders.size === filteredAndSortedItems.folders.length &&
        (filteredAndSortedItems.files.length + filteredAndSortedItems.folders.length) > 0;

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
        <DropOverlay onDrop={handleDroppedFiles} disabled={uploading}>
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
                                <ThemeToggle />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => router.push('/profile')}
                                    title="Profile settings"
                                >
                                    <User className="h-5 w-5" />
                                </Button>
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

                    {/* Toolbar: Breadcrumb, Search, Sort, Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <Breadcrumb items={breadcrumbs} onNavigate={navigateToBreadcrumb} />
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <SearchBar value={searchQuery} onChange={setSearchQuery} />
                            <SortDropdown
                                sortField={sortField}
                                sortOrder={sortOrder}
                                onSort={(f, o) => { setSortField(f); setSortOrder(o); }}
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <Button disabled={uploading} onClick={triggerFileUpload}>
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Upload
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Selection toolbar */}
                    {(filteredAndSortedItems.files.length + filteredAndSortedItems.folders.length) > 0 && (
                        <div className="flex items-center gap-4 mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <button
                                onClick={allSelected ? clearSelection : selectAll}
                                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600"
                            >
                                {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                            {hasSelection && (
                                <>
                                    <span className="text-sm text-gray-500">
                                        {selectedFiles.size + selectedFolders.size} selected
                                    </span>
                                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Files Grid */}
                    {filteredAndSortedItems.files.length === 0 && filteredAndSortedItems.folders.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Upload className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                {searchQuery ? 'No files found' : 'No files yet'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {searchQuery ? 'Try a different search term' : 'Upload your first file or drag & drop anywhere'}
                            </p>
                            {!searchQuery && (
                                <Button size="lg" onClick={triggerFileUpload}>
                                    <Upload className="h-5 w-5 mr-2" />
                                    Upload Now
                                </Button>
                            )}
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredAndSortedItems.folders.map((folder) => (
                                <Card
                                    key={folder.id}
                                    className={`hover:shadow-md transition-shadow cursor-pointer group ${selectedFolders.has(folder.id) ? 'ring-2 ring-primary-500' : ''
                                        }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleFolderSelection(folder.id); }}
                                                className="text-gray-400 hover:text-primary-600"
                                            >
                                                {selectedFolders.has(folder.id) ? (
                                                    <CheckSquare className="h-5 w-5 text-primary-600" />
                                                ) : (
                                                    <Square className="h-5 w-5" />
                                                )}
                                            </button>
                                            <div
                                                className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50"
                                                onClick={() => navigateToFolder(folder.id, folder.name)}
                                            >
                                                <Folder className="h-8 w-8 text-yellow-600" />
                                            </div>
                                            <div className="flex-1 min-w-0" onClick={() => navigateToFolder(folder.id, folder.name)}>
                                                {editingFolder === folder.id ? (
                                                    <div onClick={e => e.stopPropagation()}>
                                                        <InlineEdit
                                                            value={folder.name}
                                                            onSave={(name) => handleRenameFolder(folder.id, name)}
                                                            onCancel={() => setEditingFolder(null)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="font-medium truncate">{folder.name}</p>
                                                        <p className="text-sm text-gray-500">{formatDate(folder.createdAt)}</p>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" onClick={() => setEditingFolder(folder.id)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setShareModal({ folderId: folder.id, name: folder.name })}>
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {filteredAndSortedItems.files.map((file) => (
                                <Card
                                    key={file.id}
                                    className={`hover:shadow-md transition-shadow group ${selectedFiles.has(file.id) ? 'ring-2 ring-primary-500' : ''
                                        }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleFileSelection(file.id)}
                                                className="text-gray-400 hover:text-primary-600"
                                            >
                                                {selectedFiles.has(file.id) ? (
                                                    <CheckSquare className="h-5 w-5 text-primary-600" />
                                                ) : (
                                                    <Square className="h-5 w-5" />
                                                )}
                                            </button>
                                            <div
                                                className="text-3xl cursor-pointer hover:scale-110 transition-transform"
                                                onClick={() => setPreviewFile(file)}
                                            >
                                                {getFileIcon(file.mimeType)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {editingFile === file.id ? (
                                                    <InlineEdit
                                                        value={file.name}
                                                        onSave={(name) => handleRenameFile(file.id, name)}
                                                        onCancel={() => setEditingFile(null)}
                                                    />
                                                ) : (
                                                    <>
                                                        <p
                                                            className="font-medium truncate cursor-pointer hover:text-primary-600"
                                                            onDoubleClick={() => setEditingFile(file.id)}
                                                            onClick={() => setPreviewFile(file)}
                                                        >
                                                            {file.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {formatBytes(file.size)} • {formatDate(file.createdAt)}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => setPreviewFile(file)} title="Preview">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setEditingFile(file.id)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setShareModal({ fileId: file.id, name: file.name })}>
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => window.open(`/api/files/${file.id}/download`, '_blank')}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.id)}>
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

                {/* File Preview Modal */}
                {previewFile && (
                    <FilePreview
                        fileId={previewFile.id}
                        fileName={previewFile.name}
                        mimeType={previewFile.mimeType}
                        size={previewFile.size}
                        onClose={() => setPreviewFile(null)}
                    />
                )}

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
        </DropOverlay>
    );
}
