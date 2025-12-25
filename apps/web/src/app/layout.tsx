import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
    title: 'UnPload - Self-Hosted File Sharing',
    description: 'A modern, self-hosted file sharing platform with advanced sharing features.',
    keywords: ['file sharing', 'self-hosted', 'cloud storage', 'file upload'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans" suppressHydrationWarning>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
