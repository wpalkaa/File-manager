'use client';

import { useState } from 'react';

/**
 * Manages a single modal slot: { type, file, path, isDirectory }.
 * Pass a MODAL constant as type, or null to close.
 */
export function useModal() {
    const [modal, setModal] = useState(null);

    function open(type, file, path, isDirectory) {
        setModal({ type, file, path, isDirectory });
    }

    function close() {
        setModal(null);
    }

    return { modal, open, close };
}
