'use client';

import { useTranslation } from '@/context/LanguageProvider';
import './ContextMenu.css';

export default function ContextMenuClient({ items, position, onAction, onClose, extra }) {
    const { lang } = useTranslation();

    return (
        <>
            <div
                className="context-menu-backdrop"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                onContextMenu={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onClose();
                }}
            />

            <div
                className="context-menu"
                style={{ left: position.x, top: position.y }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                <ul className="menu-item-list">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className="menu-item"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onClose();
                                onAction(item.id);
                            }}
                            style={item.styles}
                        >
                            {lang.files.actionItems[item.id]}
                            {item.id === 'size' && extra?.size}
                            {item.id === 'mDate' && extra?.mtime}
                            {item.id === 'birthTime' && extra?.birthTime}
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}
