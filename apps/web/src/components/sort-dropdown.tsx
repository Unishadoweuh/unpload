'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import { Button } from './ui/button';

export type SortField = 'name' | 'date' | 'size';
export type SortOrder = 'asc' | 'desc';

interface SortOption {
    field: SortField;
    order: SortOrder;
    label: string;
}

const sortOptions: SortOption[] = [
    { field: 'name', order: 'asc', label: 'Name (A-Z)' },
    { field: 'name', order: 'desc', label: 'Name (Z-A)' },
    { field: 'date', order: 'desc', label: 'Newest First' },
    { field: 'date', order: 'asc', label: 'Oldest First' },
    { field: 'size', order: 'desc', label: 'Largest First' },
    { field: 'size', order: 'asc', label: 'Smallest First' },
];

interface SortDropdownProps {
    sortField: SortField;
    sortOrder: SortOrder;
    onSort: (field: SortField, order: SortOrder) => void;
}

export function SortDropdown({ sortField, sortOrder, onSort }: SortDropdownProps) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLabel = sortOptions.find(
        opt => opt.field === sortField && opt.order === sortOrder
    )?.label || 'Sort';

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                onClick={() => setOpen(!open)}
                className="gap-2"
            >
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">{currentLabel}</span>
            </Button>

            {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {sortOptions.map((option) => {
                        const isActive = sortField === option.field && sortOrder === option.order;
                        return (
                            <button
                                key={`${option.field}-${option.order}`}
                                onClick={() => {
                                    onSort(option.field, option.order);
                                    setOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive ? 'text-primary-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                {option.label}
                                {isActive && <Check className="h-4 w-4" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
