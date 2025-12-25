'use client';

import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';

interface DropZoneProps {
    onDrop: (files: File[]) => void;
    disabled?: boolean;
    className?: string;
}

export function DropZone({ onDrop, disabled, className = '' }: DropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set dragging to false if we're leaving the drop zone entirely
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onDrop(files);
        }
    }, [disabled, onDrop]);

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200
                ${isDragging
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
                    : 'border-gray-300 dark:border-gray-700'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
                ${className}
            `}
        >
            {isDragging && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary-50/90 dark:bg-primary-900/80 rounded-xl z-10">
                    <div className="animate-bounce mb-2">
                        <Upload className="h-12 w-12 text-primary-600" />
                    </div>
                    <p className="text-lg font-medium text-primary-600">Drop files here</p>
                    <p className="text-sm text-primary-500">Release to upload</p>
                </div>
            )}
        </div>
    );
}

// Full-page drop overlay
export function DropOverlay({
    onDrop,
    disabled,
    children
}: {
    onDrop: (files: File[]) => void;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragCounter, setDragCounter] = useState(0);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(prev => prev + 1);
        if (!disabled && e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(prev => {
            const newCount = prev - 1;
            if (newCount === 0) setIsDragging(false);
            return newCount;
        });
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setDragCounter(0);

        if (disabled) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onDrop(files);
        }
    }, [disabled, onDrop]);

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative min-h-screen"
        >
            {children}

            {/* Full-page overlay */}
            {isDragging && (
                <div className="fixed inset-0 bg-primary-600/20 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-12 flex flex-col items-center gap-4 animate-pulse">
                        <div className="p-6 bg-primary-100 dark:bg-primary-900/50 rounded-full">
                            <Upload className="h-16 w-16 text-primary-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">Drop to Upload</p>
                            <p className="text-gray-500 dark:text-gray-400">Release your files anywhere</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
