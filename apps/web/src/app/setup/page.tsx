'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Database, HardDrive, User, Palette, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type WizardStep = 'welcome' | 'database' | 'storage' | 'admin' | 'branding' | 'complete';

interface StepConfig {
    id: WizardStep;
    title: string;
    icon: React.ReactNode;
}

const steps: StepConfig[] = [
    { id: 'welcome', title: 'Welcome', icon: <CheckCircle className="h-5 w-5" /> },
    { id: 'database', title: 'Database', icon: <Database className="h-5 w-5" /> },
    { id: 'storage', title: 'Storage', icon: <HardDrive className="h-5 w-5" /> },
    { id: 'admin', title: 'Admin', icon: <User className="h-5 w-5" /> },
    { id: 'branding', title: 'Branding', icon: <Palette className="h-5 w-5" /> },
];

export default function SetupWizardPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Form states
    const [storageType, setStorageType] = useState<'local' | 's3'>('local');
    const [storageConfig, setStorageConfig] = useState({
        localPath: '/data/uploads',
        s3Endpoint: '',
        s3Bucket: '',
        s3AccessKey: '',
        s3SecretKey: '',
        s3Region: 'us-east-1',
    });
    const [adminConfig, setAdminConfig] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
    });
    const [brandingConfig, setBrandingConfig] = useState({
        appName: 'UnPload',
        primaryColor: '#6366f1',
    });

    useEffect(() => {
        checkWizardStatus();
    }, []);

    const checkWizardStatus = async () => {
        try {
            const status = await api.getWizardStatus() as { completed: boolean };
            if (status.completed) {
                router.push('/');
            }
        } catch (error) {
            console.error('Failed to check wizard status:', error);
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleNext = async () => {
        setError('');
        setLoading(true);

        try {
            switch (currentStep) {
                case 'welcome':
                    setCurrentStep('database');
                    break;

                case 'database':
                    // Database is already configured via env, just test connection
                    const dbResult = await fetch(`${API_URL}/api/wizard/database`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: 'env' }),
                    }).then(r => r.json());
                    if (!dbResult.success) throw new Error(dbResult.error || 'Database test failed');
                    setCurrentStep('storage');
                    break;

                case 'storage':
                    const storageResult = await fetch(`${API_URL}/api/wizard/storage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: storageType,
                            ...(storageType === 'local' ? { localPath: storageConfig.localPath } : {
                                s3Endpoint: storageConfig.s3Endpoint,
                                s3Bucket: storageConfig.s3Bucket,
                                s3AccessKey: storageConfig.s3AccessKey,
                                s3SecretKey: storageConfig.s3SecretKey,
                                s3Region: storageConfig.s3Region,
                            }),
                        }),
                    }).then(r => r.json());
                    if (!storageResult.success) throw new Error(storageResult.error || 'Storage configuration failed');
                    setCurrentStep('admin');
                    break;

                case 'admin':
                    if (adminConfig.password !== adminConfig.confirmPassword) {
                        throw new Error('Passwords do not match');
                    }
                    if (adminConfig.password.length < 8) {
                        throw new Error('Password must be at least 8 characters');
                    }
                    const adminResult = await fetch(`${API_URL}/api/wizard/admin`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: adminConfig.email,
                            password: adminConfig.password,
                            name: adminConfig.name,
                        }),
                    }).then(r => r.json());
                    if (!adminResult.success) throw new Error(adminResult.error || 'Admin creation failed');
                    setCurrentStep('branding');
                    break;

                case 'branding':
                    const brandingResult = await fetch(`${API_URL}/api/wizard/branding`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(brandingConfig),
                    }).then(r => r.json());
                    if (!brandingResult.success) throw new Error(brandingResult.error || 'Branding configuration failed');

                    // Complete setup
                    await api.completeWizard();
                    setCurrentStep('complete');
                    break;

                case 'complete':
                    router.push('/auth/login');
                    break;
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        const stepIndex = steps.findIndex(s => s.id === currentStep);
        if (stepIndex > 0) {
            setCurrentStep(steps[stepIndex - 1].id);
        }
    };

    if (checkingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Progress Steps */}
                {currentStep !== 'complete' && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div
                                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${index <= currentStepIndex
                                            ? 'bg-primary-600 border-primary-600 text-white'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-400'
                                            }`}
                                    >
                                        {step.icon}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`w-full h-1 mx-2 ${index < currentStepIndex ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                                                }`}
                                            style={{ width: '60px' }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2">
                            {steps.map((step) => (
                                <span key={step.id} className="text-xs text-gray-500 dark:text-gray-400">
                                    {step.title}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step Content */}
                <Card className="shadow-xl">
                    {currentStep === 'welcome' && (
                        <>
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-8 w-8 text-primary-600" />
                                </div>
                                <CardTitle className="text-2xl">Welcome to UnPload</CardTitle>
                                <CardDescription>
                                    Let's configure your self-hosted file sharing platform in just a few steps.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                    <h3 className="font-medium mb-2">What we'll configure:</h3>
                                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <li className="flex items-center gap-2">
                                            <Database className="h-4 w-4" /> Database connection
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <HardDrive className="h-4 w-4" /> File storage location
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <User className="h-4 w-4" /> Administrator account
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Palette className="h-4 w-4" /> App branding
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {currentStep === 'database' && (
                        <>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5 text-primary-600" />
                                    Database Configuration
                                </CardTitle>
                                <CardDescription>
                                    Your database is configured via environment variables.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                    <p className="text-sm text-green-700 dark:text-green-400">
                                        ✓ Database connection is configured via <code className="bg-green-100 dark:bg-green-900 px-1 rounded">DATABASE_URL</code> environment variable.
                                    </p>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Click "Next" to test the connection and proceed.
                                </p>
                            </CardContent>
                        </>
                    )}

                    {currentStep === 'storage' && (
                        <>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <HardDrive className="h-5 w-5 text-primary-600" />
                                    Storage Configuration
                                </CardTitle>
                                <CardDescription>
                                    Choose where uploaded files will be stored.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setStorageType('local')}
                                        className={`p-4 rounded-lg border-2 text-left transition-colors ${storageType === 'local'
                                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <HardDrive className="h-6 w-6 mb-2 text-primary-600" />
                                        <p className="font-medium">Local Storage</p>
                                        <p className="text-sm text-gray-500">Store files on disk</p>
                                    </button>
                                    <button
                                        onClick={() => setStorageType('s3')}
                                        className={`p-4 rounded-lg border-2 text-left transition-colors ${storageType === 's3'
                                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <svg className="h-6 w-6 mb-2 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                        </svg>
                                        <p className="font-medium">S3 Compatible</p>
                                        <p className="text-sm text-gray-500">MinIO, AWS S3, etc.</p>
                                    </button>
                                </div>

                                {storageType === 'local' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Storage Path</label>
                                        <Input
                                            value={storageConfig.localPath}
                                            onChange={(e) => setStorageConfig({ ...storageConfig, localPath: e.target.value })}
                                            placeholder="/data/uploads"
                                        />
                                    </div>
                                )}

                                {storageType === 's3' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Endpoint</label>
                                                <Input
                                                    value={storageConfig.s3Endpoint}
                                                    onChange={(e) => setStorageConfig({ ...storageConfig, s3Endpoint: e.target.value })}
                                                    placeholder="https://s3.example.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Bucket</label>
                                                <Input
                                                    value={storageConfig.s3Bucket}
                                                    onChange={(e) => setStorageConfig({ ...storageConfig, s3Bucket: e.target.value })}
                                                    placeholder="unpload-files"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Access Key</label>
                                                <Input
                                                    value={storageConfig.s3AccessKey}
                                                    onChange={(e) => setStorageConfig({ ...storageConfig, s3AccessKey: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Secret Key</label>
                                                <Input
                                                    type="password"
                                                    value={storageConfig.s3SecretKey}
                                                    onChange={(e) => setStorageConfig({ ...storageConfig, s3SecretKey: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Region</label>
                                            <Input
                                                value={storageConfig.s3Region}
                                                onChange={(e) => setStorageConfig({ ...storageConfig, s3Region: e.target.value })}
                                                placeholder="us-east-1"
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </>
                    )}

                    {currentStep === 'admin' && (
                        <>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary-600" />
                                    Create Administrator
                                </CardTitle>
                                <CardDescription>
                                    Set up your admin account to manage the platform.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name</label>
                                    <Input
                                        value={adminConfig.name}
                                        onChange={(e) => setAdminConfig({ ...adminConfig, name: e.target.value })}
                                        placeholder="Admin User"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={adminConfig.email}
                                        onChange={(e) => setAdminConfig({ ...adminConfig, email: e.target.value })}
                                        placeholder="admin@example.com"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Password</label>
                                        <Input
                                            type="password"
                                            value={adminConfig.password}
                                            onChange={(e) => setAdminConfig({ ...adminConfig, password: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Confirm Password</label>
                                        <Input
                                            type="password"
                                            value={adminConfig.confirmPassword}
                                            onChange={(e) => setAdminConfig({ ...adminConfig, confirmPassword: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {currentStep === 'branding' && (
                        <>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-primary-600" />
                                    Customize Branding
                                </CardTitle>
                                <CardDescription>
                                    Personalize your UnPload instance.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Application Name</label>
                                    <Input
                                        value={brandingConfig.appName}
                                        onChange={(e) => setBrandingConfig({ ...brandingConfig, appName: e.target.value })}
                                        placeholder="UnPload"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Primary Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={brandingConfig.primaryColor}
                                            onChange={(e) => setBrandingConfig({ ...brandingConfig, primaryColor: e.target.value })}
                                            className="h-10 w-16 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={brandingConfig.primaryColor}
                                            onChange={(e) => setBrandingConfig({ ...brandingConfig, primaryColor: e.target.value })}
                                            placeholder="#6366f1"
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        You can customize more settings later in the admin panel.
                                    </p>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {currentStep === 'complete' && (
                        <>
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                                <CardTitle className="text-2xl">Setup Complete!</CardTitle>
                                <CardDescription>
                                    Your UnPload instance is ready to use.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-center">
                                <p className="text-gray-600 dark:text-gray-400">
                                    You can now sign in with your admin account and start uploading files.
                                </p>
                                <Button onClick={handleNext} size="lg" className="w-full">
                                    Go to Login
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </CardContent>
                        </>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="px-6 pb-4">
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {currentStep !== 'complete' && (
                        <div className="px-6 pb-6 flex justify-between">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 'welcome' || loading}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button onClick={handleNext} disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {currentStep === 'branding' ? 'Complete Setup' : 'Next'}
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
