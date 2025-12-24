import Link from 'next/link';
import { Upload, Share2, Shield, Users } from 'lucide-react';

export default function HomePage() {
    return (
        <main className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-600/10" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                    <div className="text-center">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
                            <span className="block">Your Files,</span>
                            <span className="block text-primary-600 dark:text-primary-400">Your Cloud</span>
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">
                            Self-hosted file sharing with powerful features. Upload, share, and manage your files securely.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25"
                            >
                                Get Started
                            </Link>
                            <Link
                                href="/auth/register"
                                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
                            >
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Everything You Need
                        </h2>
                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                            Full-featured file management at your fingertips
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard
                            icon={<Upload className="w-8 h-8" />}
                            title="Easy Uploads"
                            description="Drag & drop files and folders. Multi-file uploads with progress tracking."
                        />
                        <FeatureCard
                            icon={<Share2 className="w-8 h-8" />}
                            title="Smart Sharing"
                            description="Create links with passwords, expiry dates, and download limits."
                        />
                        <FeatureCard
                            icon={<Shield className="w-8 h-8" />}
                            title="Secure Storage"
                            description="Self-hosted means your data stays on your server, fully encrypted."
                        />
                        <FeatureCard
                            icon={<Users className="w-8 h-8" />}
                            title="Multi-User"
                            description="Manage users with quotas. OAuth login with Discord & more."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-gray-500 dark:text-gray-400">
                        © 2025 UnPload. Self-hosted file sharing.
                    </p>
                </div>
            </footer>
        </main>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
    );
}
