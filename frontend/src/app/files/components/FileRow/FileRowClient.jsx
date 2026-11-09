'use client';

import './FileRow.css';

export default function FileRowClient({ file, handleShowMore, onNavigate, humanizeFileSize }) {
    function getFileIcon() {
        const icons = {
            'dir': 'fa-regular fa-folder',
            '.jpg': 'fa-regular fa-file-image',
            '.jpeg': 'fa-regular fa-file-image',
            '.png': 'fa-regular fa-file-image',
            '.gif': 'fa-regular fa-file-image',
            '.pdf': 'fa-regular fa-file-pdf',
            '.txt': 'fa-regular fa-file-lines',
            '.doc': 'fa-regular fa-file-word',
            '.docx': 'fa-regular fa-file-word',
            '.xls': 'fa-regular fa-file-excel',
            '.xlsx': 'fa-regular fa-file-excel',
            '.zip': 'fa-regular fa-file-zipper',
            '.rar': 'fa-regular fa-file-zipper',
            '.mp3': 'fa-regular fa-file-audio',
            '.mp4': 'fa-regular fa-file-video',
        };
        if (file.name === '..') return '';

        const fileType = file.type ? file.type.toLowerCase() : '';

        if (file.isDirectory) return icons['dir'];
        return icons[fileType] || 'fa-regular fa-file';
    }

    return (
        <div
            className="file-content"
            onContextMenu={handleShowMore}
            onClick={onNavigate}
        >
            <div className="file-identity">
                {file.isDirectory && <i className="fa-solid fa-greater-than"></i>}
                <i className={getFileIcon()} style={{ marginLeft: !file.isDirectory ? '1rem' : '0' }} />
                <div className="file-name">{file.name}</div>
            </div>

            {file.name !== '..' && (
                <div className="file-info">
                    <span className="file-size">{humanizeFileSize ? humanizeFileSize(file.size) : file.size}</span>
                    <div className="file-show-more" onClick={handleShowMore}>...</div>
                </div>
            )}
        </div>
    );
}
