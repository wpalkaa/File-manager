'use client';

import { useState } from 'react';

/**
 * Manages context menu state: position and the targeted file/items pair.
 */
export function useContextMenu() {
    const [position, setPosition] = useState(null);
    const [contextFile, setContextFile] = useState(null);

    function open(e, file, items) {
        e.preventDefault();
        e.stopPropagation();

        if (file?.name === '..') return;

        setContextFile({ file, items });
        setPosition({ x: e.clientX + 8, y: e.clientY - 100 });
    }

    function close() {
        setPosition(null);
        setContextFile(null);
    }

    return { position, contextFile, open, close };
}
