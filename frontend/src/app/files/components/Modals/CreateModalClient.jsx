'use client';

import { useState } from 'react';
import { useTranslation } from '@/context/LanguageProvider';
import BaseModalPortal from '@/components/Modals/BaseModalPortal';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import './Modals.css';

export default function CreateModalClient({ onSubmit, onClose, isDirectory }) {
    const { lang } = useTranslation();

    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    function handleChange(e) {
        setError('');
        const name = e.target.value;
        const illegalSymbols = /[\\/:*?"<>|]/;

        if (name.trim().length === 0) {
            setError(lang.errors.emptyString);
        } else if (illegalSymbols.test(name)) {
            setError(lang.errors.illegalSymbols);
        } else {
            setError('');
        }

        setFileName(name);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (error || !fileName.trim()) {
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(fileName);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || lang.errors.generic);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <BaseModalPortal onClose={onClose}>
            <div className="modal-overlay" onMouseDown={onClose}>
                <div className="modal-container" onMouseDown={(e) => e.stopPropagation()}>
                    <h1>{isDirectory ? lang.files.modals.create.newDir : lang.files.modals.create.newFile}:</h1>
                    <form className="modal-form" onSubmit={(e) => handleSubmit(e)}>
                        <input
                            autoFocus
                            type="text"
                            value={fileName}
                            onChange={(e) => handleChange(e)}
                            disabled={isLoading}
                        />

                        <div
                            className="form-error"
                            style={{ color: 'red', fontSize: '0.7rem', visibility: error ? 'visible' : 'hidden' }}
                        >
                            <i className="fa-solid fa-x"></i> {error}
                        </div>

                        <div className="modal-buttons">
                            <button
                                type="submit"
                                className="submit-button flex items-center justify-center gap-2"
                                disabled={isLoading || Boolean(error) || fileName.trim().length === 0}
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner /> {lang.files.modals.create.createButton}
                                    </>
                                ) : (
                                    lang.files.modals.create.createButton
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="cancel-button"
                                disabled={isLoading}
                            >
                                {lang.files.modals.confirmation.cancel}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </BaseModalPortal>
    );
}
