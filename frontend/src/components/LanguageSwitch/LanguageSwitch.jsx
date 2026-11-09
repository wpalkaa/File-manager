'use client';

import { useTranslation } from "@/context/LanguageProvider";
import { useState, useRef, useEffect } from "react";
import './LanguageSwitch.css';

const languagesList = [
    { id: 'pl', label: "PL" },
    { id: "en", label: "ENG"}
]

export default function LanguageSwitch() {

    const { locale, changeLanguage } = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const containerRef = useRef(null);


    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpened(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    })

    return (
        <div className="lang-switch-container" ref={containerRef}>
            <div className="lang-switch" onClick={() => setIsOpened(prev => !prev)} >
                <i className="fa-solid fa-globe"></i>
            </div>
            {isOpened && (<div className="lang-list">
                {languagesList.map( (lang) => 
                    <button 
                        key={lang.id}
                        className={`lang-button ${locale === lang.id ? "active" : ""}`}
                        onClick={() => {
                            changeLanguage(lang.id)
                            setIsOpened(false);
                        }}
                    >
                        <img src={`/icons/${lang.id}.svg`} height={24} width={24} />{lang.label}
                    </button>   
                )}

            </div>
            )}
        </div>
    )
}