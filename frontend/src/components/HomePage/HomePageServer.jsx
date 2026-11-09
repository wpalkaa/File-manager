'use client';

import { useTranslation } from '@/context/LanguageProvider';
import LiveClockClient from './LiveClockClient';
import './HomePage.css';

export default function HomePageServer({ username = '' }) {
    const { lang } = useTranslation();
    const welcome = lang?.mainPage?.welcomeMessage || 'Hello';

    return (
        <div className="main-page">
            <div className="main-page-content">
                <h1 className="welcome-message">
                    {username ? `${welcome} ${username}!` : `${welcome}!`}
                </h1>

                <div className="photo-block">
                    <img src="/default-avatar-icon.jpg" alt="Avatar" />
                </div>

                <LiveClockClient />
            </div>
        </div>
    );
}
