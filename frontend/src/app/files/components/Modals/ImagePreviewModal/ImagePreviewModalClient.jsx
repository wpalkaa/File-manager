'use client';

import { useState } from 'react';
import { useTranslation } from '@/context/LanguageProvider';
import BaseModalPortal from '@/components/Modals/BaseModalPortal';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import '../Modals.css';

export default function ImagePreviewModalClient({ file, filePath, onClose, onDownload }) {
    const { lang } = useTranslation();
    const [zoom, setZoom] = useState(1);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const baseURL = process.env.NEXT_PUBLIC_SERVER_URL || '';
    const rawUrl = `${baseURL}/api/files/raw?path=${encodeURIComponent(filePath)}`;

    function handleZoomIn() {
        setZoom(prev => Math.min(prev + 0.25, 3));
    }

    function handleZoomOut() {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    }

    function handleResetZoom() {
        setZoom(1);
    }

    return (
        <BaseModalPortal onClose={onClose}>
            <div className="modal-overlay" onMouseDown={onClose}>
                <div
                    className="modal-container"
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{ width: '85vw', maxWidth: '1000px', height: '85vh', display: 'flex', flexDirection: 'column' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-regular fa-file-image" style={{ color: '#38bdf8' }} />
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f1f5f9' }}>{file?.name}</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={handleZoomOut}
                            title={lang?.files?.modals?.imagePreview?.zoomOut || "Pomniejsz"}
                            style={{ background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                        >
                            <i className="fa-solid fa-magnifying-glass-minus" />
                        </button>
                        <button
                            type="button"
                            onClick={handleResetZoom}
                            title={lang?.files?.modals?.imagePreview?.zoomReset || "Reset"}
                            style={{ background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            {Math.round(zoom * 100)}%
                        </button>
                        <button
                            type="button"
                            onClick={handleZoomIn}
                            title={lang?.files?.modals?.imagePreview?.zoomIn || "Powiększ"}
                            style={{ background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                        >
                            <i className="fa-solid fa-magnifying-glass-plus" />
                        </button>
                        {onDownload && (
                            <button
                                type="button"
                                onClick={onDownload}
                                title={lang?.files?.modals?.imagePreview?.download || "Pobierz"}
                                style={{ background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', marginLeft: '0.5rem' }}
                            >
                                <i className="fa-solid fa-download" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer', marginLeft: '0.5rem' }}
                        >
                            <i className="fa-solid fa-xmark" />
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', backgroundColor: '#020617', borderRadius: '0.375rem', position: 'relative' }}>
                    {!imageLoaded && !hasError && (
                        <div style={{ position: 'absolute' }}>
                            <LoadingSpinner size="lg" />
                        </div>
                    )}
                    {hasError ? (
                        <div style={{ color: '#ef4444' }}>
                            {lang?.files?.modals?.imagePreview?.loadError || "Nie udało się załadować podglądu obrazu."}
                        </div>
                    ) : (
                        <img
                            src={rawUrl}
                            alt={file?.name}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => { setImageLoaded(true); setHasError(true); }}
                            style={{
                                transform: `scale(${zoom})`,
                                transition: 'transform 0.15s ease-out',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                display: imageLoaded && !hasError ? 'block' : 'none'
                            }}
                        />
                    )}
                    </div>
                </div>
            </div>
        </BaseModalPortal>
    );
}
