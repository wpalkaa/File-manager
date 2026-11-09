'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

import { useTranslation } from '@/context/LanguageProvider';
import { useFileList } from '@/hooks/useFileList';
import { useMqttFileSync } from '@/hooks/useMqttFileSync';
import { useContextMenu } from '@/hooks/useContextMenu';
import { useModal } from '@/hooks/useModal';

import FileRowClient from './FileRow/FileRowClient';
import RenameModalClient from './Modals/RenameModalClient';
import ContextMenuClient from './ContextMenu/ContextMenuClient';
import CreateModalClient from './Modals/CreateModalClient';
import ToolBarClient from './ToolBar/ToolBarClient';
import ConfirmationModal from '@/components/ConfirmationModal/ConfirmationModal';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import FileEditorModalClient from './Modals/FileEditorModal/FileEditorModalClient';
import ImagePreviewModalClient from './Modals/ImagePreviewModal/ImagePreviewModalClient';

import {
    renameFileAction,
    deleteFileAction,
    createFileAction,
} from '@/app/files/actions/fileActions';

import { MENU_ACTIONS, MENU_ITEMS, BACKGROUND_ITEMS, MODAL } from '../config.js';
import { humanizeFileSize, formatDate } from '@/utils/formatters';
import '../files.css';

export default function FilesViewClient({
    initialPath = '/',
    initialFiles = [],
    initialError = '',
    initialDirInfo = null,
}) {
    const { lang } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentPath = searchParams.get('path') || initialPath || '/';

    // --- State via custom hooks ---
    const {
        files,
        currentDirInfo,
        isLoading,
        error,
        refresh,
    } = useFileList(currentPath, initialFiles, initialDirInfo, initialError);

    const contextMenu = useContextMenu();
    const { modal, open: openModal, close: closeModal } = useModal();

    // MQTT live sync
    const handleMqttUpdate = useCallback(() => refresh(currentPath), [currentPath, refresh]);
    useMqttFileSync(currentPath, handleMqttUpdate);

    // --- Sort state ---
    const [sortMethod, setSortMethod] = useState({ key: 'name', order: 'asc' });

    const sortedFiles = useMemo(() => {
        return [...files].sort((a, b) => {
            if (a.name === '..' || b.name === '..') {
                return a.name === '..' ? -1 : 1;
            }
            if (a.isDirectory !== b.isDirectory) {
                return b.isDirectory - a.isDirectory;
            }
            const aValue = a[sortMethod.key];
            const bValue = b[sortMethod.key];
            return aValue < bValue
                ? sortMethod.order === 'asc' ? -1 : 1
                : sortMethod.order === 'asc' ? 1 : -1;
        });
    }, [files, sortMethod]);

    // --- File operations ---
    async function renameFile(filePath, newName) {
        const result = await renameFileAction(filePath, newName);
        if (result.success) {
            refresh(currentPath);
            closeModal();
        } else {
            throw new Error(result.message || 'Rename failed');
        }
    }

    async function deleteFile(filePath) {
        const result = await deleteFileAction(filePath);
        if (result.success) {
            refresh(currentPath);
            closeModal();
        } else {
            throw new Error(result.message || 'Delete failed');
        }
    }

    async function createFile(filePath, fileName, isDirectory) {
        const result = await createFileAction(filePath, fileName, isDirectory);
        if (result.success) {
            refresh(currentPath);
            closeModal();
        } else {
            throw new Error(result.message || 'Create failed');
        }
    }

    async function downloadFile(file, filePath) {
        try {
            const baseURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost';
            const API_URL = new URL('/api/files/download', baseURL);
            const response = await axios.post(API_URL, { path: filePath }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.isDirectory ? `${file.name}.zip` : file.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('[Download error]:', err);
        }
    }

    // --- Navigation ---
    function handleNavigate(file) {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;

        if (!file.isDirectory) {
            const ext = file.name.includes('.') ? '.' + file.name.split('.').pop().toLowerCase() : '';
            const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext);
            const isText = ['.txt', '.json', '.md', '.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.yml', '.yaml', '.xml', '.env', '.log', '.sh'].includes(ext);

            const filePath = currentPath !== '/' ? `${currentPath}/${file.name}` : `/${file.name}`;
            if (isImage) { openModal('IMAGE_PREVIEW', file, filePath); return; }
            if (isText || !ext) { openModal('FILE_EDITOR', file, filePath); return; }
            return;
        }

        const pathParts = currentPath.split('/').filter(Boolean);
        if (file.name === '..') pathParts.pop();
        else pathParts.push(file.name);

        const newPath = pathParts.join('/');
        router.push(newPath ? `/files?path=/${newPath}` : '/files');
    }

    // --- Context menu actions ---
    function handleContextAction(action, overrideContextFile = null) {
        const activeContext = overrideContextFile || contextMenu.contextFile;
        if (!activeContext || !activeContext.file) return;

        const actionFile = activeContext.file;
        const isTargettingBackground = activeContext.items === BACKGROUND_ITEMS;

        const filePath = isTargettingBackground
            ? currentPath
            : (currentPath !== '/'
                ? `${currentPath}/${actionFile.name}`
                : `/${actionFile.name}`);

        const parentDir = actionFile.isDirectory ? filePath : currentPath;

        switch (action) {
            case MENU_ACTIONS.OPEN:
                handleNavigate(actionFile);
                break;
            case MENU_ACTIONS.NEW_FILE:
                openModal(MODAL.CREATE, actionFile, parentDir, false);
                break;
            case MENU_ACTIONS.NEW_DIR:
                openModal(MODAL.CREATE, actionFile, parentDir, true);
                break;
            case MENU_ACTIONS.RENAME:
                openModal(MODAL.RENAME, actionFile, filePath);
                break;
            case MENU_ACTIONS.DOWNLOAD:
                downloadFile(actionFile, filePath);
                break;
            case MENU_ACTIONS.DELETE:
                openModal(MODAL.DELETE, actionFile, filePath);
                break;
            case MENU_ACTIONS.REFRESH:
                refresh(currentPath);
                break;
            default:
                break;
        }

        contextMenu.close();
    }

    return (
        <div className="files-container">
            <div className="files-card">
                <div className="list-title-container">
                    <h1 className="list-title">{lang.files.title}</h1>
                    <h2 className="list-position">{currentPath === '/' ? '/home/' : currentPath + '/'}</h2>
                </div>

                <div className="toolbar-wrapper h-32">
                    <ToolBarClient
                        currentDirInfo={currentDirInfo}
                        currentPath={currentPath}
                        humanizeFileSize={humanizeFileSize}
                        formatDate={formatDate}
                        handleClick={(action) => {
                            handleContextAction(action, { file: currentDirInfo, items: BACKGROUND_ITEMS });
                        }}
                        setSortMethod={setSortMethod}
                    />
                </div>

                {isLoading && (
                    <div className="files-loading-indicator">
                        <LoadingSpinner size="sm" />
                        <span>{lang.files.loading}</span>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {!error && (
                    <div
                        className="files-list"
                        onContextMenu={(e) => contextMenu.open(e, currentDirInfo, BACKGROUND_ITEMS)}
                    >
                        {sortedFiles.map((file) => (
                            <div key={file.name} className="file-item">
                                <FileRowClient
                                    file={file}
                                    handleShowMore={(e) => contextMenu.open(e, file, MENU_ITEMS)}
                                    onNavigate={() => handleNavigate(file)}
                                    humanizeFileSize={humanizeFileSize}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {contextMenu.position && contextMenu.contextFile && (
                    <ContextMenuClient
                        items={contextMenu.contextFile.items}
                        position={contextMenu.position}
                        onAction={handleContextAction}
                        onClose={contextMenu.close}
                        extra={{
                            size: humanizeFileSize(contextMenu.contextFile?.file?.size),
                            mtime: formatDate(contextMenu.contextFile?.file?.lastModified),
                            birthTime: formatDate(contextMenu.contextFile?.file?.birthTime),
                        }}
                    />
                )}

                {modal?.type === MODAL.RENAME && (
                    <RenameModalClient
                        file={modal.file}
                        onSubmit={(newName) => renameFile(modal.path, newName)}
                        onClose={closeModal}
                    />
                )}

                {modal?.type === MODAL.DELETE && modal.file && (
                    <ConfirmationModal
                        message={
                            <p>
                                {modal.file.isDirectory
                                    ? lang.files.modals.delete.deleteMessageDir
                                    : lang.files.modals.delete.deleteMessageFile}{' '}
                                <b>{modal.file.name}</b>?
                                <br />
                                {lang.files.modals.delete.warning}
                            </p>
                        }
                        onSubmit={() => deleteFile(modal.path)}
                        onClose={closeModal}
                    />
                )}

                {modal?.type === MODAL.CREATE && (
                    <CreateModalClient
                        onSubmit={(fileName) => createFile(modal.path, fileName, modal.isDirectory)}
                        onClose={closeModal}
                        isDirectory={modal.isDirectory}
                    />
                )}

                {modal?.type === 'FILE_EDITOR' && (
                    <FileEditorModalClient
                        file={modal.file}
                        filePath={modal.path}
                        onClose={closeModal}
                        onSaveSuccess={() => refresh(currentPath)}
                    />
                )}

                {modal?.type === 'IMAGE_PREVIEW' && (
                    <ImagePreviewModalClient
                        file={modal.file}
                        filePath={modal.path}
                        onClose={closeModal}
                        onDownload={() => downloadFile(modal.file, modal.path)}
                    />
                )}
            </div>
        </div>
    );
}

