'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function BaseModalPortal({ children, onClose }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        if (!onClose) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!mounted || typeof document === 'undefined') {
        return null;
    }

    const dialogsRoot = document.getElementById('dialogs') || document.body;
    return createPortal(children, dialogsRoot);
}
