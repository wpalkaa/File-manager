'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

import { useTranslation } from '@/context/LanguageProvider';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';

export default function UserSectionClient({ username }) {
    const [needConfirm, setNeedConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { lang } = useTranslation();
    const router = useRouter();

    async function handleLogout() {
        setIsLoggingOut(true);
        try {
            await axios.patch('/next-api/auth/logout');
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('[Logout error]:', error);
        } finally {
            setIsLoggingOut(false);
            setNeedConfirm(false);
        }
    }

    return (
        <div className="navbar-footer-user-wrapper flex items-center">
            <div className="navbar-footer-user">
                <i className="fa-regular fa-user mr-3"></i>
                {username}

                <button
                    className="logout-btn ml-3"
                    title={lang.navbar.logout}
                    onClick={() => setNeedConfirm(true)}
                    type="button"
                >
                    <i className="fa-solid fa-right-from-bracket"></i>
                </button>

                {needConfirm && (
                    <ConfirmationModal
                        message={lang.navbar.logoutMessage}
                        onSubmit={handleLogout}
                        onClose={() => setNeedConfirm(false)}
                        isLoading={isLoggingOut}
                    />
                )}
            </div>
        </div>
    );
}
