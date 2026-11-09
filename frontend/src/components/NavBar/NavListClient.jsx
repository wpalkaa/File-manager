'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/context/LanguageProvider';

export default function NavListClient() {
    const { lang } = useTranslation();
    const pathname = usePathname();

    const isActive = (path) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    return (
        <ul className="navbar-list">
            <li className={`navbar-list-item ${isActive('/') ? 'active' : ''}`}>
                <Link href="/">
                    <i className="fa-regular fa-house"></i>
                    {lang.navbar.home}
                </Link>
            </li>
            <li className={`navbar-list-item ${isActive('/files') ? 'active' : ''}`}>
                <Link href="/files">
                    <i className="fa-regular fa-file"></i>
                    {lang.navbar.files}
                </Link>
            </li>
            <li className={`navbar-list-item ${isActive('/resources') ? 'active' : ''}`}>
                <Link href="/resources">
                    <i className="fa-solid fa-microchip"></i>
                    {lang.navbar.resources}
                </Link>
            </li>
            <li className={`navbar-list-item ${isActive('/settings') ? 'active' : ''}`}>
                <Link href="/settings">
                    <i className="fa-solid fa-sliders"></i>
                    {lang.navbar.settings}
                </Link>
            </li>
        </ul>
    );
}
