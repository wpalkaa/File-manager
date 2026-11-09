'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/context/LanguageProvider';
import BaseModalPortal from '@/components/Modals/BaseModalPortal';
import ConfirmationModal from '@/components/ConfirmationModal/ConfirmationModal';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import { getFileContentAction, saveFileContentAction } from '@/app/files/actions/fileActions';
import '../Modals.css';
import './FileEditorModal.css';

export default function FileEditorModalClient({ file, filePath, onClose, onSaveSuccess }) {
    const { lang } = useTranslation();
    const [content, setContent] = useState('');
    const [initialContent, setInitialContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [confirmClose, setConfirmClose] = useState(false);

    const isDirty = content !== initialContent;

    useEffect(() => {
        let cancelled = false;
        async function loadContent() {
            setIsLoading(true);
            try {
                const res = await getFileContentAction(filePath);
                if (cancelled) return;
                if (res.success) {
                    setContent(res.content || '');
                    setInitialContent(res.content || '');
                } else {
                    setError(res.message || lang.files.editor.loadError || 'Error loading file content');
                }
            } catch (err) {
                if (!cancelled) setError(err.message || lang.files.editor.loadError || 'Error loading file content');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        loadContent();
        return () => { cancelled = true; };
    }, [filePath, lang]);

    // Handle Ctrl+S
    useEffect(() => {
        function handleKeyDown(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [content, filePath]);

    async function handleSave() {
        setIsSaving(true);
        setStatusMessage('');
        setError('');
        try {
            const res = await saveFileContentAction(filePath, content);
            if (res.success) {
                setInitialContent(content);
                setStatusMessage(lang.files.editor.savedMessage || 'Saved');
                if (onSaveSuccess) onSaveSuccess();
                setTimeout(() => setStatusMessage(''), 2000);
            } else {
                setError(res.message || lang.files.editor.saveError || 'Error saving file');
            }
        } catch (err) {
            setError(err.message || lang.files.editor.saveError || 'Error saving file');
        } finally {
            setIsSaving(false);
        }
    }

    function handleClose() {
        if (isDirty) {
            setConfirmClose(true);
        } else {
            onClose();
        }
    }

    return (
        <BaseModalPortal onClose={handleClose}>
            <div className="modal-overlay" onMouseDown={handleClose}>
                <div className="modal-container file-editor-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="file-editor-header">
                    <div className="file-editor-header-left">
                        <i className="fa-regular fa-file-lines file-editor-header-icon" />
                        <h2 className="file-editor-header-title">{file?.name}</h2>
                        {isDirty && (
                            <span className="file-editor-unsaved-badge">
                                {lang.files.editor.unsavedChanges}
                            </span>
                        )}
                    </div>
                    <button type="button" className="file-editor-close-btn" onClick={handleClose}>
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="file-editor-body">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : error ? (
                    <div className="file-editor-error">
                        {error}
                    </div>
                ) : (
                    <div className="file-editor-content">
                        <textarea
                            className="file-editor-textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            spellCheck={false}
                        />
                    </div>
                )}

                <div className="file-editor-footer">
                    <div className="file-editor-status">
                        {statusMessage && (
                            <span>
                                <i className="fa-solid fa-check" /> {statusMessage}
                            </span>
                        )}
                    </div>
                    <div className="file-editor-actions">
                        <button
                            type="button"
                            className="file-editor-btn-cancel"
                            onClick={handleClose}
                        >
                            {lang.files.editor.closeButton}
                        </button>
                        <button
                            type="button"
                            className={`file-editor-btn-save ${isDirty ? 'dirty' : 'clean'}`}
                            onClick={handleSave}
                            disabled={isSaving || !isDirty}
                        >
                            {isSaving && <LoadingSpinner size="sm" />}
                            <span>{lang.files.editor.saveButton}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

            {confirmClose && (
                <ConfirmationModal
                    message={lang.files.editor.unsavedWarning}
                    onSubmit={() => { setConfirmClose(false); onClose(); }}
                    onClose={() => setConfirmClose(false)}
                />
            )}
        </BaseModalPortal>
    );
}
