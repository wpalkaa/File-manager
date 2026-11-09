import FilesViewClient from './components/FilesViewClient';
import { listFilesAction, getFileInfoAction } from './actions/fileActions';
import { buildFileList } from '@/utils/fileHelpers';

async function fetchInitialFiles(path) {
    try {
        const data = await listFilesAction(path);
        if (data.success) {
            return { files: buildFileList(data.files || [], path), error: null };
        }
        return { files: [], error: data.message || 'Error loading directory' };
    } catch (err) {
        return { files: [], error: err.message || 'Server error' };
    }
}

async function fetchInitialDirInfo(path) {
    try {
        const data = await getFileInfoAction(path);
        return data.success ? data.fileInfo : null;
    } catch (err) {
        return null;
    }
}

export default async function FilesPage({ searchParams }) {
    const resolvedParams = searchParams ? await searchParams : {};
    const currentPath = resolvedParams?.path || '/';

    const [filesResult, initialDirInfo] = await Promise.all([
        fetchInitialFiles(currentPath),
        fetchInitialDirInfo(currentPath),
    ]);

    return (
        <FilesViewClient
            initialPath={currentPath}
            initialFiles={filesResult.files}
            initialError={filesResult.error}
            initialDirInfo={initialDirInfo}
        />
    );
}
