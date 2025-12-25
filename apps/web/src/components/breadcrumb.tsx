'use client';

import { ChevronRight, Home, Folder } from 'lucide-react';

interface BreadcrumbItem {
    id: string | null;
    name: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    onNavigate: (folderId: string | null) => void;
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
    if (items.length <= 1) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Home className="h-4 w-4" />
                <span className="font-medium text-gray-900 dark:text-white">My Files</span>
            </div>
        );
    }

    return (
        <nav className="flex items-center gap-1 text-sm overflow-x-auto">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const isFirst = index === 0;

                return (
                    <div key={item.id ?? 'root'} className="flex items-center gap-1 shrink-0">
                        {index > 0 && (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}

                        {isLast ? (
                            <span className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white px-2 py-1">
                                {isFirst ? (
                                    <Home className="h-4 w-4" />
                                ) : (
                                    <Folder className="h-4 w-4 text-yellow-500" />
                                )}
                                {item.name}
                            </span>
                        ) : (
                            <button
                                onClick={() => onNavigate(item.id)}
                                className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                {isFirst ? (
                                    <Home className="h-4 w-4" />
                                ) : (
                                    <Folder className="h-4 w-4 text-yellow-500" />
                                )}
                                {item.name}
                            </button>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
