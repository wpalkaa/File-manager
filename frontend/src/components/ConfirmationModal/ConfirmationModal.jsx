'use client';

import { useTranslation } from '@/context/LanguageProvider';
import BaseModalPortal from '@/components/Modals/BaseModalPortal';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import './ConfirmationModal.css';

export default function ConfirmationModal({ message, onSubmit, onClose, isLoading = false }) {
    const { lang } = useTranslation();

    function handleSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;
        onSubmit();
    }

    function handleCancel(e) {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;
        onClose();
    }

    return (
        <BaseModalPortal onClose={onClose}>
            <div className="modal-overlay" onMouseDown={handleCancel}>
                <div className="modal-container" onMouseDown={(e) => e.stopPropagation()}>
                    <h1>{lang.files.modals.confirmation.accept}:</h1>

                    <div className="modal-message">{message}</div>

                    <div className="modal-buttons">
                        <button
                            type="submit"
                            onClick={(e) => handleSubmit(e)}
                            className="submit-button"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <LoadingSpinner /> {lang.files.modals.confirmation.accept}
                                </span>
                            ) : (
                                lang.files.modals.confirmation.accept
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleCancel(e)}
                            className="cancel-button"
                            disabled={isLoading}
                        >
                            {lang.files.modals.confirmation.cancel}
                        </button>
                    </div>
                </div>
            </div>
        </BaseModalPortal>
    );
}