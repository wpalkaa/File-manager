'use client';

import { useTranslation } from '@/context/LanguageProvider';
import SortTooltipClient from '../SortTooltip/SortTooltipClient';
import { MENU_ACTIONS, BACKGROUND_ITEMS } from '../../config';
import { humanizeFileSize as defaultHumanizeFileSize, formatDate as defaultFormatDate } from '@/utils/formatters';
import './ToolBar.css';

const TOOLBAR_ITEMS = [
    {
        id: MENU_ACTIONS.SORT,
        icon: 'fa-solid fa-sort',
        location: 'left',
    },
    {
        id: MENU_ACTIONS.NEW_FILE,
        icon: 'fa-solid fa-file-circle-plus',
        location: 'left',
    },
    {
        id: MENU_ACTIONS.NEW_DIR,
        icon: 'fa-solid fa-folder-plus',
        location: 'left',
    },
    {
        id: MENU_ACTIONS.DOWNLOAD,
        icon: 'fa-solid fa-file-arrow-down',
        location: 'left',
    },
    {
        id: MENU_ACTIONS.INFO,
        icon: 'fa-solid fa-circle-info',
        location: 'right',
    },
    {
        id: MENU_ACTIONS.REFRESH,
        icon: 'fa-solid fa-arrows-rotate',
        location: 'right',
    },
];

export default function ToolBarClient({
    currentDirInfo,
    currentPath,
    humanizeFileSize = defaultHumanizeFileSize,
    formatDate = defaultFormatDate,
    handleClick,
    setSortMethod,
}) {
    const { lang } = useTranslation();
    const infoPath = currentPath === '/' ? '/home' : `${currentPath}`;

    const leftItems = TOOLBAR_ITEMS.filter((item) => item.location === 'left');
    const rightItems = TOOLBAR_ITEMS.filter((item) => item.location === 'right');

    const handleActionClick = (actionId) => {
        if (actionId === MENU_ACTIONS.SORT || actionId === MENU_ACTIONS.INFO) {
            return;
        }
        if (typeof handleClick === 'function') {
            handleClick(actionId);
        }
    };

    const formatSize = typeof humanizeFileSize === 'function' ? humanizeFileSize : defaultHumanizeFileSize;
    const formatDt = typeof formatDate === 'function' ? formatDate : defaultFormatDate;

    const renderItem = (item) => (
        <div key={item.id} className="toolbar-item" onClick={() => handleActionClick(item.id)}>
            <i className={item.icon} />

            <div className="tooltip">
                {item.id === MENU_ACTIONS.INFO ? (
                    <>
                        <div className="info-line">{lang.files.toolBar.info.position}: {infoPath + '/'}</div>
                        <div className="info-line">
                            {lang.files.toolBar.info.size}: {currentDirInfo?.size != null ? formatSize(currentDirInfo.size) : '0 B'}
                        </div>
                        <div className="info-line">
                            {lang.files.toolBar.info.lastModified}: {currentDirInfo?.lastModified ? formatDt(currentDirInfo.lastModified) : '--'}
                        </div>
                        <div className="info-line">
                            {lang.files.toolBar.info.birthTime}: {currentDirInfo?.birthTime ? formatDt(currentDirInfo.birthTime) : '--'}
                        </div>
                    </>
                ) : item.id === MENU_ACTIONS.SORT ? (
                    <SortTooltipClient setSortMethod={setSortMethod} />
                ) : (
                    lang.files.actionItems[item.id]
                )}
            </div>
        </div>
    );

    return currentDirInfo ? (
        <div className="toolbar-container">
            <div className="toolbar-items left">{leftItems.map(renderItem)}</div>
            <div className="toolbar-items right">{rightItems.map(renderItem)}</div>
        </div>
    ) : null;
}
