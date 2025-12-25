'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in inputs
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        for (const shortcut of shortcuts) {
            const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
            const altMatch = shortcut.alt ? e.altKey : !e.altKey;
            const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

            if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
                e.preventDefault();
                shortcut.action();
                break;
            }
        }
    }, [shortcuts]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

// Default dashboard shortcuts
export function useDashboardShortcuts({
    onUpload,
    onNewFolder,
    onSearch,
    onSelectAll,
    onDelete,
}: {
    onUpload?: () => void;
    onNewFolder?: () => void;
    onSearch?: () => void;
    onSelectAll?: () => void;
    onDelete?: () => void;
}) {
    const router = useRouter();

    const shortcuts: KeyboardShortcut[] = [
        { key: 'u', description: 'Upload files', action: () => onUpload?.() },
        { key: 'n', shift: true, description: 'New folder', action: () => onNewFolder?.() },
        { key: 'f', ctrl: true, description: 'Search', action: () => onSearch?.() },
        { key: 'a', ctrl: true, description: 'Select all', action: () => onSelectAll?.() },
        { key: 'Delete', description: 'Delete selected', action: () => onDelete?.() },
        { key: 'Backspace', description: 'Delete selected', action: () => onDelete?.() },
        { key: '?', shift: true, description: 'Show shortcuts', action: () => { } }, // Will be handled by modal
        { key: 'g', description: 'Go to dashboard', action: () => router.push('/dashboard') },
        { key: 's', description: 'Go to shares', action: () => router.push('/shares') },
        { key: 'p', description: 'Go to profile', action: () => router.push('/profile') },
    ];

    useKeyboardShortcuts(shortcuts);

    return shortcuts;
}

// Shortcut help modal content
export const KEYBOARD_SHORTCUTS = [
    {
        category: 'Navigation', shortcuts: [
            { keys: ['G'], description: 'Go to dashboard' },
            { keys: ['S'], description: 'Go to shares' },
            { keys: ['P'], description: 'Go to profile' },
        ]
    },
    {
        category: 'Files', shortcuts: [
            { keys: ['U'], description: 'Upload files' },
            { keys: ['Shift', 'N'], description: 'New folder' },
            { keys: ['Ctrl', 'F'], description: 'Search files' },
            { keys: ['Ctrl', 'A'], description: 'Select all' },
            { keys: ['Delete'], description: 'Delete selected' },
        ]
    },
    {
        category: 'Help', shortcuts: [
            { keys: ['Shift', '?'], description: 'Show keyboard shortcuts' },
        ]
    },
];
