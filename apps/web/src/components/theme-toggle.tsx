'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './theme-provider';
import { Button } from './ui/button';
import { useState, useRef, useEffect } from 'react';

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
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

    const options = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'system', label: 'System', icon: Monitor },
    ] as const;

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(!open)}
                title={`Current: ${theme}`}
            >
                {resolvedTheme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                ) : (
                    <Sun className="h-5 w-5" />
                )}
            </Button>

            {open && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {options.map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.value}
                                onClick={() => {
                                    setTheme(option.value);
                                    setOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${theme === option.value ? 'text-primary-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
