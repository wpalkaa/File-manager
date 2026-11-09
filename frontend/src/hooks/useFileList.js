'use client';

import { useState, useEffect, useCallback } from 'react';
import { listFilesAction, getFileInfoAction } from '@/app/files/actions/fileActions';
import { buildFileList } from '@/utils/fileHelpers';

/**
 * Manages file list and directory info state for a given path.
 * Fetches data on mount and when currentPath changes.
 * Uses a cancellation flag to prevent stale state updates after unmount.
 */
export function useFileList(currentPath, initialFiles, initialDirInfo, initialError) {
    const [files, setFiles] = useState(initialFiles || []);
    const [currentDirInfo, setCurrentDirInfo] = useState(initialDirInfo);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(initialError || '');

    // Sync with server props when they change (e.g. Next.js navigation)
    useEffect(() => {
        if (initialFiles && initialFiles.length > 0) setFiles(initialFiles);
        if (initialDirInfo) setCurrentDirInfo(initialDirInfo);
        if (initialError !== undefined) setError(initialError || '');
    }, [initialFiles, initialDirInfo, initialError]);

    async function loadData(path, signal) {
        setIsLoading(true);
        try {
            const [filesData, infoData] = await Promise.all([
                listFilesAction(path),
                getFileInfoAction(path),
            ]);

            if (signal.cancelled) return;

            if (filesData.success) {
                setFiles(buildFileList(filesData.files || [], path));
                setError('');
            } else {
                setError(filesData.message || 'Error fetching files');
            }

            if (infoData.success) {
                setCurrentDirInfo(infoData.fileInfo);
            }
        } catch (err) {
            if (!signal.cancelled) setError(err?.message || 'Error fetching files');
        } finally {
            if (!signal.cancelled) setIsLoading(false);
        }
    }

    // Re-fetch when path changes
    useEffect(() => {
        const signal = { cancelled: false };
        loadData(currentPath, signal);
        return () => { signal.cancelled = true; };
    }, [currentPath]);

    // Stable refresh function – safe to pass to useCallback in consumers
    const refresh = useCallback((path) => {
        const signal = { cancelled: false };
        loadData(path, signal);
        return () => { signal.cancelled = true; };
    }, []);

    return { files, currentDirInfo, isLoading, error, refresh };
}
