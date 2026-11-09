'use client';

import { useState } from 'react';
import { useTranslation } from '@/context/LanguageProvider';
import CreateUserDialog from './CreateUserDialog/CreateUserDialog';
import './UsersList.css';

export default function CreateUserCard({ onCreate }) {
    const { lang } = useTranslation();
    const [isOpened, setIsOpened] = useState(false);

    return (
        <>
            <div className="user-card-link" onClick={() => setIsOpened((p) => !p)}>
                <div className="user-card">
                    <div className="user-photo text-3xl font-thin flex items-center justify-center select-none">
                        <i className="fa-solid fa-plus"></i>
                    </div>

                    <div className="user-name">
                        {lang?.settings?.users?.addUser || 'Add user'}
                    </div>

                </div>
            </div>

            {isOpened && <CreateUserDialog onClose={() => setIsOpened(false)} onCreate={onCreate} />}
        </>
    );
}
