'use client';

import { useState } from 'react';
import axios from 'axios';
import { useTranslation } from '@/context/LanguageProvider';
import BaseModalPortal from '@/components/Modals/BaseModalPortal';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import '../CreateUserDialog/CreateUserDialog.css';

export default function EditUserDialogClient({ user, onClose, onUpdate }) {
    const { lang } = useTranslation();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [group, setGroup] = useState(user?.group || 'user');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const baseURL = process.env.NEXT_PUBLIC_SERVER_URL || '';
            const endpoint = `/api/users/edit/${user?._id || user?.login}`;
            const API_URL = baseURL ? `${baseURL}${endpoint}` : endpoint;

            // Send edit update request
            await axios.patch(API_URL, {
                group,
                ...(password ? { password } : {}),
            }, { withCredentials: true });

            if (onUpdate) {
                onUpdate({ ...user, group });
            }
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || lang.errors.server || 'Server error updating user');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <BaseModalPortal onClose={onClose}>
            <div className="portal">
                <div className="backdrop" onClick={onClose} />

                <dialog className="dialog relative" open>
                    <div className="header">
                        <h3 className="header-title">
                            {lang.settings.users.info.editUser}: {user?.login}
                        </h3>
                        <button className="header-closebtn" onClick={onClose} type="button">
                            X
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="create-user-form">
                        <div className="form-row">
                            <label className="form-label" htmlFor="edit-login">
                                {lang.settings.users.createUser.loginLabel}
                            </label>
                            <input
                                className="form-input"
                                id="edit-login"
                                type="text"
                                value={user?.login || ''}
                                disabled
                                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                            />
                        </div>

                        <div className="form-row">
                            <label className="form-label" htmlFor="edit-password">
                                {lang.settings.users.changePassword} ({lang.settings.users.editUser?.optional || 'Optional'})
                            </label>
                            <input
                                className="form-input"
                                id="edit-password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            <label className="form-label">
                                {lang.settings.users.createUser.groupLabel}
                            </label>
                            <select
                                name="group"
                                className="form-select"
                                value={group}
                                onChange={(e) => setGroup(e.target.value)}
                            >
                                <option value="user">{lang.settings.users.createUser.groups.user}</option>
                                <option value="admin">{lang.settings.users.createUser.groups.admin}</option>
                            </select>
                        </div>

                        {error && (
                            <div className="form-row">
                                <div className="error-msg">{error}</div>
                            </div>
                        )}

                        <div className="form-footer">
                            <button className="form-btn cancel-btn" type="button" onClick={onClose} disabled={isLoading}>
                                {lang.settings.users.createUser.cancelButton}
                            </button>
                            <button
                                className="form-btn submit-btn flex items-center justify-center gap-2"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner /> {lang.settings.users.editUser?.loadingPlaceholder || lang.settings.users.createUser.loadingPlaceholder || 'Saving...'}
                                    </>
                                ) : (
                                    lang.settings.users.editUser?.saveButton || lang.files.modals.confirmation.accept || 'Save'
                                )}
                            </button>
                        </div>
                    </form>
                </dialog>
            </div>
        </BaseModalPortal>
    );
}
