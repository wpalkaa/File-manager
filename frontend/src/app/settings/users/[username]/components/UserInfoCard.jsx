'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';

import { useTranslation } from '@/context/LanguageProvider';
import ConfirmationModal from '@/components/ConfirmationModal/ConfirmationModal';
import EditUserDialogClient from '@/app/settings/users/components/UsersList/EditUserDialog/EditUserDialogClient';
import '../UserInfo.css';

export default function UserInfoCard({ userData: initialUserData, isAdmin, clientLogin }) {
    const { lang } = useTranslation();
    const router = useRouter();

    const [userData, setUserData] = useState(initialUserData);
    const [isEditing, setIsEditing] = useState(false);
    const [needDeleteConfirm, setNeedDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const avatar = userData.avatar || '/default-avatar-icon.jpg';

    async function handleConfirmDelete() {
        setIsDeleting(true);
        try {
            const baseURL = process.env.NEXT_PUBLIC_SERVER_URL || '';
            const endpoint = `/api/users/delete/${userData._id}`;
            const API_URL = baseURL ? `${baseURL}${endpoint}` : endpoint;

            await axios.delete(API_URL, { withCredentials: true });
            router.push('/settings/users');
            router.refresh();
        } catch (error) {
            console.error('[Delete user error]:', error);
        } finally {
            setIsDeleting(false);
            setNeedDeleteConfirm(false);
        }
    }

    return (
        <div className="user-info-card">
            <div className="user-previous-page w-full flex justify-start text-slate-400">
                <Link href="/settings/users">
                    <i className="fa-solid fa-arrow-left mr-2"></i>{lang.settings.users.info.previousPage}
                </Link>
            </div>

            <h1 className="username">{userData.login}</h1>

            <div className="user-avatar">
                <img src={avatar} alt="User Avatar" />
            </div>

            <div className="user-groups">
                <span className="group-label">{lang.global.groups.title}:</span>
                <span className={`group-badge group-${userData.group}`}>
                    {lang.global.groups[userData.group]}
                </span>
            </div>

            {isAdmin && (
                <div className="user-actions">
                    <button
                        className="edit-user-button"
                        onClick={() => setIsEditing(true)}
                        type="button"
                    >
                        {lang.settings.users.info.editUser}
                    </button>
                    <button
                        className="delete-user-button"
                        onClick={() => setNeedDeleteConfirm(true)}
                        disabled={clientLogin?.name === userData.login}
                        type="button"
                    >
                        {lang.settings.users.info.deleteUser}
                    </button>
                </div>
            )}

            {isEditing && (
                <EditUserDialogClient
                    user={userData}
                    onClose={() => setIsEditing(false)}
                    onUpdate={(updated) => {
                        setUserData((prev) => ({ ...prev, ...updated }));
                        router.refresh();
                    }}
                />
            )}

            {needDeleteConfirm && (
                <ConfirmationModal
                    message={
                        <p>
                            {lang.settings.users.deleteUser}: <b>{userData.login}</b>?
                            <br />
                            {lang.files.modals.delete.warning}
                        </p>
                    }
                    onSubmit={handleConfirmDelete}
                    onClose={() => setNeedDeleteConfirm(false)}
                    isLoading={isDeleting}
                />
            )}
        </div>
    );
}