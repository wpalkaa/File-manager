'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import UserCard from './UserCard';
import CreateUserCard from './CreateUserCard';
import { useTranslation } from '@/context/LanguageProvider';
import './UsersList.css';

export default function UsersListClient({ allUsers, isAdmin }) {
    const { lang } = useTranslation();

    const [users, setUsers] = useState(allUsers || []);
    const [searchValue, setSearchValue] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const maxUsersPerPage = 11;

    // Fix state desynchronization bug when navigating or when server props change
    useEffect(() => {
        setUsers(allUsers || []);
    }, [allUsers]);

    const firstUserIndex = (currentPage - 1) * maxUsersPerPage;
    const totalPages = Math.max(1, Math.ceil(users.length / maxUsersPerPage));
    const currentUsers = users.slice(firstUserIndex, firstUserIndex + maxUsersPerPage);

    function addUser(userData) {
        setUsers((prev) => [...prev, userData]);
    }

    useEffect(() => {
        if (!searchValue || searchValue.trim().length === 0) {
            setUsers(allUsers || []);
            return;
        }

        async function fetchFilteredUsers() {
            try {
                const baseURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost';
                const response = await axios.get('/api/users', {
                    baseURL,
                    params: { search: searchValue },
                });
                setUsers(response.data?.data || []);
            } catch (error) {
                console.error("Error: Couldn't fetch users data:\n", error?.response?.data || error.message);
                setUsers([]);
            }
        }

        const delay = setTimeout(() => fetchFilteredUsers(), 500);
        return () => clearTimeout(delay);
    }, [searchValue, allUsers]);

    return (
        <>
            <div className="search-bar-container">
                <div className="search-input-wrapper">
                    <i className="fa-solid fa-magnifying-glass search-icon"></i>
                    <input
                        type="text"
                        placeholder={lang.settings.users.searchBarPlaceholder}
                        className="search-input"
                        value={searchValue}
                        onChange={(e) => {
                            setSearchValue(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="users-list-wrapper">
                {currentUsers.map((u) => (
                    <UserCard key={u._id || u.login} userData={u} />
                ))}

                {isAdmin && <CreateUserCard onCreate={addUser} />}
            </div>

            {totalPages > 1 && (
                <div className="pagination-bar">
                    <button
                        className="pagination-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>

                    <span className="pagination-info text-[#94a3b8]">
                        {currentPage}/{totalPages}
                    </span>

                    <button
                        className="pagination-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                        <i className="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            )}
        </>
    );
}
