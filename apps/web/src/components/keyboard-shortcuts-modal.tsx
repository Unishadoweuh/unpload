'use client';

import { useState, useEffect } from 'react';
import { X, Command } from 'lucide-react';
import { Button } from './ui/button';
import { KEYBOARD_SHORTCUTS } from '@/hooks/use-keyboard-shortcuts';

interface KeyboardShortcutsModalProps {
    onClose: () => void;
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Command className="h-5 w-5 text-primary-600" />
                        Keyboard Shortcuts
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-4 space-y-6">
                    {KEYBOARD_SHORTCUTS.map((category) => (
                        <div key={category.category}>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                                {category.category}
                            </h3>
                            <div className="space-y-2">
                                {category.shortcuts.map((shortcut) => (
                                    <div
                                        key={shortcut.description}
                                        className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                                    >
                                        <span className="text-sm">{shortcut.description}</span>
                                        <div className="flex gap-1">
                                            {shortcut.keys.map((key, i) => (
                                                <kbd
                                                    key={i}
                                                    className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Press <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to close
                    </p>
                </div>
            </div>
        </div>
    );
}
