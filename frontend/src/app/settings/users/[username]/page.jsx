import { notFound } from 'next/navigation';
import axios from 'axios';
import { cookies } from 'next/headers';
import { getUsername, getGroup } from '@/lib/getClientInfo';

import UserInfoCard from './components/UserInfoCard';
import './UserInfo.css';

async function getUserData(username) {
    if (!username) return null;
    try {
        const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://nginx';
        const cookieStore = await cookies();
        const token = cookieStore.get('user_session');
        const headers = token ? { Cookie: `user_session=${token.value}` } : {};

        const response = await axios.get(`${backendUrl}/api/users/${encodeURIComponent(username)}`, { headers });
        return response.data?.data || null;
    } catch (error) {
        if (error.response?.status !== 404) {
            console.error(`[Error]: Couldn't fetch user data for ${username}:\n`, error?.response?.data || error.message);
        }
        return null;
    }
}

export default async function UserInfo({ params }) {
    const clientGroup = await getGroup();
    const clientLogin = await getUsername();

    const resolvedParams = params ? await params : {};
    const username = resolvedParams?.username;

    if (!username) {
        notFound();
    }

    const userData = await getUserData(username);
    if (!userData) {
        notFound();
    }

    return (
        <div className="user-info-page">
            <UserInfoCard userData={userData} isAdmin={clientGroup === 'admin'} clientLogin={clientLogin} />
        </div>
    );
}
