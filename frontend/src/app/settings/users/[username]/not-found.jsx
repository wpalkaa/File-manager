'use client';

import { useTranslation } from '@/context/LanguageProvider';

export default function NotFoundUser() {
    const { lang } = useTranslation();

    return (
        <div style={{ color: '#ef4444', padding: '2rem', textAlign: 'center', fontSize: '1.25rem' }}>
            {lang?.settings?.users?.notFound || 'Nie znaleziono użytkownika'}
        </div>
    );
}
