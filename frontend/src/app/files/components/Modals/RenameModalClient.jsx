'use client';

import { useState } from 'react';
import { useTranslation } from '@/context/LanguageProvider';
import BaseModalPortal from '@/components/Modals/BaseModalPortal';
import ConfirmationModal from '@/components/ConfirmationModal/ConfirmationModal';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import './Modals.css';

export default function RenameModalClient({ file, onSubmit, onClose }) {
    const { lang } = useTranslation();

    const fileExtension = file.name.split('.').pop();

    const [newName, setNewName] = useState(file.name);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [warn, setWarn] = useState('');
    const [needApprove, setNeedApprove] = useState(false);

    function handleChange(e) {
        setError('');
        const name = e.target.value;
        const illegalSymbols = /[\\/:*?"<>|]/;

        if (name.trim().length === 0) {
            setError(lang.errors.emptyString);
        } else if (illegalSymbols.test(name)) {
            setError(lang.errors.illegalSymbols);
        } else if (!file.isDirectory && fileExtension !== name.split('.').pop() && file.name.indexOf('.') !== 0) {
            setWarn(lang.files.modals.rename.warning);
        } else {
            setError('');
        }

        setNewName(name);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (error || !newName.trim()) {
            return;
        }

        if (warn && !needApprove) {
            setNeedApprove(true);
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(newName);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || lang.errors.generic);
        } finally {
            setIsLoading(false);
        }
    }

    function selectOnlyFileName(e) {
        const extensionLocation = e.target.value.lastIndexOf('.');

        // Check if not hidden and has extension
        if (extensionLocation > 0) {
            e.target.setSelectionRange(0, extensionLocation);
        } else {
            e.target.select();
        }
    }

    return (
        <BaseModalPortal onClose={onClose}>
            <div className="modal-overlay" onMouseDown={onClose}>
                <div className="modal-container" onMouseDown={(e) => e.stopPropagation()}>
                    <h1>{file.isDirectory ? lang.files.modals.rename.renameDir : lang.files.modals.rename.renameFile}</h1>
                    <h2>{file.name}</h2>
                    <form className="modal-form" onSubmit={(e) => handleSubmit(e)}>
                        <input
                            autoFocus
                            type="text"
                            value={newName}
                            onChange={(e) => handleChange(e)}
                            onFocus={(e) => selectOnlyFileName(e)}
                            disabled={isLoading}
                        />

                        <div
                            className="form-error"
                            style={{ color: 'red', fontSize: '0.7rem', visibility: error ? 'visible' : 'hidden' }}
                        >
                            <i className="fa-solid fa-x"></i> {lang.errors[error] || error}
                        </div>

                        <div className="modal-buttons">
                            <button
                                type="submit"
                                className="submit-button flex items-center justify-center gap-2"
                                disabled={isLoading || Boolean(error) || needApprove || newName.trim().length === 0}
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner /> {lang.files.modals.rename.renameButton}
                                    </>
                                ) : (
                                    lang.files.modals.rename.renameButton
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="cancel-button"
                                disabled={isLoading}
                            >
                                {lang.files.modals.rename.cancelButton}
                            </button>
                        </div>
                    </form>
                </div>

                {needApprove && (
                    <ConfirmationModal
                        message={warn}
                        onSubmit={() => {
                            setWarn('');
                            setNeedApprove(false);
                        }}
                        onClose={() => {
                            setWarn('');
                            setNeedApprove(false);
                            setError(lang.files.modals.rename.changeExtension);
                        }}
                    />
                )}
            </div>
        </BaseModalPortal>
    );
}
