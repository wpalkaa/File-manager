'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/context/LanguageProvider';

export default function LiveClockClient() {
    const [currentDate, setCurrentDate] = useState(null);
    const { locale } = useTranslation();

    useEffect(() => {
        setCurrentDate(new Date());

        const intervalId = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="date">
            {currentDate ? currentDate.toLocaleString(locale || 'en') : '--:--:---- --:--'}
        </div>
    );
}
