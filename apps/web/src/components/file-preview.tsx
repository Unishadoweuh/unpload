'use client';

import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText, Image as ImageIcon, Film, Music, File } from 'lucide-react';
import { Button } from './ui/button';
import { formatBytes } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FilePreviewProps {
    fileId: string;
    fileName: string;
    mimeType: string;
    size: number;
    onClose: () => void;
}

export function FilePreview({ fileId, fileName, mimeType, size, onClose }: FilePreviewProps) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [textContent, setTextContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');
    const isAudio = mimeType.startsWith('audio/');
    const isPdf = mimeType === 'application/pdf';
    const isText = mimeType.startsWith('text/') ||
        ['application/json', 'application/javascript', 'application/xml'].includes(mimeType);

    const fileUrl = `${API_URL}/api/files/${fileId}/download`;

    useEffect(() => {
        if (isText) {
            loadTextContent();
        }
    }, [isText, fileId]);

    const loadTextContent = async () => {
        setLoading(true);
        try {
            const response = await fetch(fileUrl);
            const text = await response.text();
            setTextContent(text);
        } catch (error) {
            console.error('Failed to load text content:', error);
            setTextContent('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 25, 200));
        if (e.key === '-') setZoom(z => Math.max(z - 25, 25));
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, []);

    const getPreviewIcon = () => {
        if (isImage) return <ImageIcon className="h-16 w-16" />;
        if (isVideo) return <Film className="h-16 w-16" />;
        if (isAudio) return <Music className="h-16 w-16" />;
        if (isPdf || isText) return <FileText className="h-16 w-16" />;
        return <File className="h-16 w-16" />;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50">
                <div className="flex items-center gap-3 text-white">
                    {getPreviewIcon()}
                    <div>
                        <h3 className="font-medium">{fileName}</h3>
                        <p className="text-sm text-gray-400">{formatBytes(size)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isImage && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setZoom(z => Math.max(z - 25, 25))}
                                className="text-white hover:bg-white/20"
                            >
                                <ZoomOut className="h-5 w-5" />
                            </Button>
                            <span className="text-white text-sm w-12 text-center">{zoom}%</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setZoom(z => Math.min(z + 25, 200))}
                                className="text-white hover:bg-white/20"
                            >
                                <ZoomIn className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setRotation(r => (r + 90) % 360)}
                                className="text-white hover:bg-white/20"
                            >
                                <RotateCw className="h-5 w-5" />
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(fileUrl, '_blank')}
                        className="text-white hover:bg-white/20"
                    >
                        <Download className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-white hover:bg-white/20"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                {isImage && (
                    <img
                        src={fileUrl}
                        alt={fileName}
                        style={{
                            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                            transition: 'transform 0.2s ease',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                        }}
                    />
                )}

                {isVideo && (
                    <video
                        src={fileUrl}
                        controls
                        autoPlay
                        className="max-w-full max-h-full"
                    />
                )}

                {isAudio && (
                    <div className="bg-gray-800 rounded-xl p-8 flex flex-col items-center gap-4">
                        <Music className="h-24 w-24 text-primary-500" />
                        <audio src={fileUrl} controls autoPlay className="w-80" />
                    </div>
                )}

                {isPdf && (
                    <iframe
                        src={fileUrl}
                        className="w-full h-full bg-white rounded-lg"
                        title={fileName}
                    />
                )}

                {isText && (
                    <div className="w-full max-w-4xl h-full bg-gray-900 rounded-lg overflow-auto">
                        {loading ? (
                            <div className="p-8 text-gray-400">Loading...</div>
                        ) : (
                            <pre className="p-6 text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                {textContent}
                            </pre>
                        )}
                    </div>
                )}

                {!isImage && !isVideo && !isAudio && !isPdf && !isText && (
                    <div className="text-center text-gray-400">
                        <File className="h-24 w-24 mx-auto mb-4" />
                        <p>Preview not available for this file type</p>
                        <Button
                            onClick={() => window.open(fileUrl, '_blank')}
                            className="mt-4"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download File
                        </Button>
                    </div>
                )}
            </div>

            {/* Click backdrop to close */}
            <div
                className="absolute inset-0 -z-10"
                onClick={onClose}
            />
        </div>
    );
}
