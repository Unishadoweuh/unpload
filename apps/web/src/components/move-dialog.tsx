'use client';

import { useState, useEffect } from 'react';
import { X, FolderOpen, ChevronRight, Home } from 'lucide-react';
import { Button } from './ui/button';
import { api } from '@/lib/api';

interface Folder {
    id: string;
    name: string;
    parentId: string | null;
}

interface MoveDialogProps {
    itemType: 'file' | 'folder';
    itemName: string;
    itemId: string;
    currentFolderId: string | null;
    onClose: () => void;
    onMoved: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function MoveDialog({ itemType, itemName, itemId, currentFolderId, onClose, onMoved }: MoveDialogProps) {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [moving, setMoving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadFolders(null);
    }, []);

    const loadFolders = async (parentId: string | null) => {
        try {
            setLoading(true);
            const data = await api.listFolders(parentId || undefined) as Folder[];
            // Filter out the current item if it's a folder
            const filtered = itemType === 'folder'
                ? data.filter(f => f.id !== itemId)
                : data;
            setFolders(filtered);
        } catch (err) {
            console.error('Failed to load folders:', err);
        } finally {
            setLoading(false);
        }
    };

    const navigateToFolder = async (folder: Folder | null) => {
        if (folder === null) {
            setCurrentPath([]);
            setSelectedFolder(null);
            await loadFolders(null);
        } else {
            setCurrentPath(prev => [...prev, folder]);
            setSelectedFolder(folder.id);
            await loadFolders(folder.id);
        }
    };

    const navigateToBreadcrumb = async (index: number) => {
        if (index === -1) {
            setCurrentPath([]);
            setSelectedFolder(null);
            await loadFolders(null);
        } else {
            const folder = currentPath[index];
            setCurrentPath(currentPath.slice(0, index + 1));
            setSelectedFolder(folder.id);
            await loadFolders(folder.id);
        }
    };

    const handleMove = async () => {
        // Don't move to same folder
        if (selectedFolder === currentFolderId) {
            setError('Item is already in this folder');
            return;
        }

        setMoving(true);
        setError('');

        try {
            const token = api.getToken();
            const endpoint = itemType === 'file'
                ? `${API_URL}/api/files/${itemId}/move`
                : `${API_URL}/api/folders/${itemId}/move`;

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ folderId: selectedFolder }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to move');
            }

            onMoved();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to move item');
        } finally {
            setMoving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="font-semibold flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-primary-600" />
                        Move "{itemName}"
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 text-sm mb-4 flex-wrap">
                        <button
                            onClick={() => navigateToBreadcrumb(-1)}
                            className="flex items-center gap-1 hover:text-primary-600"
                        >
                            <Home className="h-4 w-4" />
                            Root
                        </button>
                        {currentPath.map((folder, index) => (
                            <span key={folder.id} className="flex items-center gap-1">
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                <button
                                    onClick={() => navigateToBreadcrumb(index)}
                                    className="hover:text-primary-600"
                                >
                                    {folder.name}
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* Folder list */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-64 overflow-y-auto">
                        {/* Current folder option */}
                        <button
                            onClick={() => setSelectedFolder(currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null)}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedFolder === (currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null)
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                                    : ''
                                }`}
                        >
                            <FolderOpen className="h-4 w-4" />
                            (Move here)
                        </button>

                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Loading...</div>
                        ) : folders.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">No subfolders</div>
                        ) : (
                            folders.map((folder) => (
                                <button
                                    key={folder.id}
                                    onDoubleClick={() => navigateToFolder(folder)}
                                    onClick={() => setSelectedFolder(folder.id)}
                                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedFolder === folder.id
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                                            : ''
                                        }`}
                                >
                                    <FolderOpen className="h-4 w-4 text-yellow-500" />
                                    {folder.name}
                                    <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                                </button>
                            ))
                        )}
                    </div>

                    <p className="text-xs text-gray-500 mt-2">Double-click to navigate into folder</p>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-800">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleMove} disabled={moving}>
                        {moving ? 'Moving...' : 'Move Here'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
