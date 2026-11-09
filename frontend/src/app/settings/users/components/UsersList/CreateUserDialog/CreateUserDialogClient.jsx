'use client';

import axios from 'axios';
import { useState } from 'react';
import { useTranslation } from '@/context/LanguageProvider';
import BaseModalPortal from '@/components/Modals/BaseModalPortal';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import './CreateUserDialog.css';

export default function CreateUserDialogClient({ onClose, onCreate }) {
    const { lang } = useTranslation();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState({
        login: '',
        password: '',
        group: 'user',
    });

    function validateLogin(e) {
        setError('');
        const login = e.target.value;
        const illegalSymbols = /[\\/:*?"<>!#$%^&()@{}\[\]';:".,`~+=|]/;

        if (login.trim().length === 0) {
            setError(lang.errors.emptyString);
        } else if (illegalSymbols.test(login)) {
            setError(lang.errors.illegalSymbols);
        } else {
            setError('');
        }

        setUserData((prev) => ({ ...prev, login }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const baseURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost';
            const API_URL = new URL('/api/users/create', baseURL);

            await axios.post(API_URL, userData);

            onClose();
            if (onCreate) onCreate(userData);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || lang.errors.server || 'Server error creating user');
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
                        <h3 className="header-title">{lang.settings.users.createUser.title}</h3>
                        <button className="header-closebtn" onClick={onClose} type="button">
                            X
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="create-user-form">
                        <div className="form-row">
                            <label className="form-label" htmlFor="login">
                                {lang.settings.users.createUser.loginLabel}
                            </label>
                            <input
                                className="form-input"
                                name="login"
                                id="login"
                                type="text"
                                placeholder={lang.settings.users.createUser.loginPlaceholder}
                                onChange={(e) => validateLogin(e)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-row">
                            <label className="form-label" htmlFor="password">
                                {lang.settings.users.createUser.passwordLabel}
                            </label>
                            <input
                                className="form-input"
                                name="password"
                                id="password"
                                type="password"
                                placeholder={lang.settings.users.createUser.passwordPlaceholder}
                                onChange={(e) => setUserData((p) => ({ ...p, password: e.target.value }))}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-row">
                            <label className="form-label">{lang.settings.users.createUser.groupLabel}</label>
                            <select
                                name="group"
                                className="form-select"
                                onChange={(e) => setUserData((p) => ({ ...p, group: e.target.value }))}
                                disabled={isLoading}
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
                                disabled={error || isLoading || userData.login.length === 0 || userData.password.length === 0}
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner /> {lang.settings.users.createUser.loadingPlaceholder || 'Creating...'}
                                    </>
                                ) : (
                                    lang.settings.users.createUser.createButton
                                )}
                            </button>
                        </div>
                    </form>
                </dialog>
            </div>
        </BaseModalPortal>
    );
}
