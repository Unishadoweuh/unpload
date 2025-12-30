'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { ArrowLeft, User, Key, HardDrive, Download } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
    quota?: {
        maxBytes: string;
        usedBytes: string;
    };
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await api.getProfile() as UserProfile;
            setUser(data);
        } catch (error) {
            console.error('Failed to load profile:', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const name = (document.getElementById('name') as HTMLInputElement).value;
            await api.updateProfile({ name });
            alert('Profile updated!');
            loadProfile();
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement).value;
        const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
        const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        setSaving(true);
        try {
            await api.changePassword(currentPassword, newPassword);
            alert('Password changed successfully!');
            (document.getElementById('currentPassword') as HTMLInputElement).value = '';
            (document.getElementById('newPassword') as HTMLInputElement).value = '';
            (document.getElementById('confirmPassword') as HTMLInputElement).value = '';
        } catch (error) {
            console.error('Failed to change password:', error);
            alert('Failed to change password. Check your current password.');
        } finally {
            setSaving(false);
        }
    };

    const getUploadUrl = () => {
        if (typeof window === 'undefined') return API_URL;
        return API_URL || window.location.origin;
    };

    const downloadShareXConfig = () => {
        const token = api.getToken();
        const config = {
            Version: "14.0.0",
            Name: "UnPload",
            DestinationType: "ImageUploader, FileUploader",
            RequestMethod: "POST",
            RequestURL: `${getUploadUrl()}/api/files/upload`,
            Headers: {
                Authorization: `Bearer ${token}`
            },
            Body: "MultipartFormData",
            FileFormName: "files",
            URL: "{json:url}",
            ThumbnailURL: "",
            DeletionURL: ""
        };

        downloadFile(JSON.stringify(config, null, 2), 'UnPload-ShareX.sxcu', 'application/json');
    };

    const downloadFlameshotScript = () => {
        const token = api.getToken();
        const script = `#!/bin/bash
# UnPload - Flameshot Upload Script
# Usage: Save this script, make it executable (chmod +x), and run it
# Or bind it to a keyboard shortcut

UPLOAD_URL="${getUploadUrl()}/api/files/upload"
TOKEN="${token}"

# Take screenshot with Flameshot and save to temp file
TEMP_FILE=$(mktemp /tmp/screenshot-XXXXXX.png)
flameshot gui --raw > "$TEMP_FILE"

# Check if screenshot was taken (file size > 0)
if [ ! -s "$TEMP_FILE" ]; then
    rm -f "$TEMP_FILE"
    exit 1
fi

# Upload to UnPload
RESPONSE=$(curl -s -X POST "$UPLOAD_URL" \\
    -H "Authorization: Bearer $TOKEN" \\
    -F "files=@$TEMP_FILE")

# Extract URL from response and copy to clipboard
URL=$(echo "$RESPONSE" | jq -r '.[0].url // .[0].id' 2>/dev/null)

if [ -n "$URL" ] && [ "$URL" != "null" ]; then
    # Try different clipboard commands
    if command -v xclip &> /dev/null; then
        echo -n "$URL" | xclip -selection clipboard
    elif command -v xsel &> /dev/null; then
        echo -n "$URL" | xsel --clipboard
    elif command -v wl-copy &> /dev/null; then
        echo -n "$URL" | wl-copy
    fi
    
    # Show notification
    if command -v notify-send &> /dev/null; then
        notify-send "UnPload" "Screenshot uploaded! URL copied to clipboard."
    fi
    echo "Uploaded: $URL"
else
    if command -v notify-send &> /dev/null; then
        notify-send "UnPload" "Upload failed!" --urgency=critical
    fi
    echo "Upload failed: $RESPONSE"
fi

# Cleanup
rm -f "$TEMP_FILE"
`;
        downloadFile(script, 'unpload-flameshot.sh', 'text/x-shellscript');
    };

    const downloadKsnipConfig = () => {
        const token = api.getToken();
        // Ksnip uses INI-style config for custom uploaders
        const config = `[Uploader]
Type=Custom
UploadUrl=${getUploadUrl()}/api/files/upload
Token=${token}

; Ksnip Custom Uploader Instructions:
; 1. Open Ksnip Settings
; 2. Go to "Image Grabber" > "Uploader"
; 3. Select "Custom" as uploader type
; 4. Set the following:
;    - URL: ${getUploadUrl()}/api/files/upload
;    - HTTP Method: POST
;    - Form Field Name: files
;    - Add Header: Authorization = Bearer ${token}
`;
        downloadFile(config, 'unpload-ksnip.txt', 'text/plain');
    };

    const downloadCurlScript = () => {
        const token = api.getToken();
        const script = `#!/bin/bash
# UnPload - Universal Upload Script
# Works with any file on Linux, macOS, and Windows (Git Bash/WSL)

UPLOAD_URL="${getUploadUrl()}/api/files/upload"
TOKEN="${token}"

# Check if file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <file>"
    echo "Example: $0 screenshot.png"
    exit 1
fi

FILE="$1"

if [ ! -f "$FILE" ]; then
    echo "Error: File not found: $FILE"
    exit 1
fi

# Upload file
echo "Uploading $FILE..."
RESPONSE=$(curl -s -X POST "$UPLOAD_URL" \\
    -H "Authorization: Bearer $TOKEN" \\
    -F "files=@$FILE")

echo "Response: $RESPONSE"

# Try to extract and display URL
URL=$(echo "$RESPONSE" | jq -r '.[0].url // .[0].id' 2>/dev/null)
if [ -n "$URL" ] && [ "$URL" != "null" ]; then
    echo ""
    echo "✓ Upload successful!"
    echo "File ID/URL: $URL"
fi
`;
        downloadFile(script, 'unpload-upload.sh', 'text/x-shellscript');
    };

    const downloadIOSShortcut = () => {
        const token = api.getToken();
        // Generate a shareable shortcut link (instructions)
        const instructions = `# UnPload - iOS Shortcuts Instructions

## Quick Setup

Create a new Shortcut with these actions:

1. **Receive** - What is passed to this shortcut
   - Accept: Images, Files
   
2. **Get Contents of URL**
   - URL: ${getUploadUrl()}/api/files/upload
   - Method: POST
   - Headers:
     - Authorization: Bearer ${token}
   - Request Body: Form
     - files: Shortcut Input
     
3. **Show Result**

## Alternative: Import via QR Code

Scan this configuration in any app that supports REST API testing:

\`\`\`json
{
  "url": "${getUploadUrl()}/api/files/upload",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer ${token}"
  },
  "body": {
    "type": "multipart",
    "field": "files"
  }
}
\`\`\`

## Token

Your API token (keep it secret!):
${token}
`;
        downloadFile(instructions, 'unpload-ios-instructions.md', 'text/markdown');
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatBytes = (bytes: string | number) => {
        const b = typeof bytes === 'string' ? parseInt(bytes) : bytes;
        if (b === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold">Profile Settings</h1>
                </div>

                {/* Profile Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>Update your account details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input value={user?.email || ''} disabled className="bg-gray-100 dark:bg-gray-800" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input id="name" defaultValue={user?.name || ''} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Input value={user?.role || ''} disabled className="bg-gray-100 dark:bg-gray-800" />
                            </div>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Storage */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5" />
                            Storage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user?.quota && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Used: {formatBytes(user.quota.usedBytes)}</span>
                                    <span>Total: {formatBytes(user.quota.maxBytes)}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all"
                                        style={{
                                            width: `${Math.min(100, (parseInt(user.quota.usedBytes) / parseInt(user.quota.maxBytes)) * 100)}%`
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Change Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Current Password</label>
                                <Input id="currentPassword" type="password" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password</label>
                                <Input id="newPassword" type="password" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirm New Password</label>
                                <Input id="confirmPassword" type="password" />
                            </div>
                            <Button type="submit" variant="outline" disabled={saving}>
                                {saving ? 'Changing...' : 'Change Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* App Integrations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            App Integrations
                        </CardTitle>
                        <CardDescription>
                            Upload screenshots and files directly from your favorite apps
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Windows */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <span className="text-lg">🪟</span> Windows
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={downloadShareXConfig} variant="outline" size="sm">
                                    ShareX (.sxcu)
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Double-click the downloaded file to import it into ShareX.
                            </p>
                        </div>

                        {/* Linux */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <span className="text-lg">🐧</span> Linux
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={downloadFlameshotScript} variant="outline" size="sm">
                                    Flameshot Script
                                </Button>
                                <Button onClick={downloadKsnipConfig} variant="outline" size="sm">
                                    Ksnip Instructions
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Make the script executable with <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">chmod +x</code> then bind it to a keyboard shortcut.
                            </p>
                        </div>

                        {/* Cross-platform */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <span className="text-lg">🌐</span> Cross-Platform
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={downloadCurlScript} variant="outline" size="sm">
                                    cURL Script (.sh)
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Universal script that works on Linux, macOS, and Windows (Git Bash/WSL).
                                Usage: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">./unpload-upload.sh myfile.png</code>
                            </p>
                        </div>

                        {/* Mobile */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <span className="text-lg">📱</span> Mobile
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={downloadIOSShortcut} variant="outline" size="sm">
                                    iOS Shortcuts Guide
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Instructions to create an iOS Shortcut for uploading from your iPhone/iPad.
                            </p>
                        </div>

                        {/* API Info */}
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                <strong>API Endpoint:</strong>{' '}
                                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                                    {getUploadUrl()}/api/files/upload
                                </code>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                All configs include your personal API token. Keep them secure and don&apos;t share!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
