'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface InlineEditProps {
    value: string;
    onSave: (newValue: string) => void;
    onCancel: () => void;
    className?: string;
}

export function InlineEdit({ value, onSave, onCancel, className = '' }: InlineEditProps) {
    const [editValue, setEditValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (editValue.trim() && editValue !== value) {
                onSave(editValue.trim());
            } else {
                onCancel();
            }
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleBlur = () => {
        if (editValue.trim() && editValue !== value) {
            onSave(editValue.trim());
        } else {
            onCancel();
        }
    };

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="flex-1 px-2 py-1 text-sm border border-primary-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800"
            />
            <button
                onClick={() => editValue.trim() && onSave(editValue.trim())}
                className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                title="Save"
            >
                <Check className="h-4 w-4" />
            </button>
            <button
                onClick={onCancel}
                className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                title="Cancel"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
