/**
 * Builds the final file list for a given directory path.
 * Prepends the ".." (parent directory) entry when not at root.
 */
export function buildFileList(files, path) {
    if (path === '/') return files;

    const previousDir = {
        name: '..',
        type: undefined,
        isDirectory: true,
        size: undefined,
        lastModified: undefined,
        birthTime: undefined,
    };

    return [previousDir, ...files];
}
