import axios from 'axios';
import { getGroup } from '@/lib/getClientInfo';
import UsersListClient from './components/UsersList/UsersListClient';

async function getUsers() {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://nginx';
    try {
        const response = await axios.get(`${backendUrl}/api/users`);
        return response.data?.data || [];
    } catch (error) {
        console.error("Error: Couldn't fetch users data:\n", error?.response?.data || error.message);
        return [];
    }
}

export default async function SettingsUsers() {
    const allUsers = await getUsers();
    const clientGroup = await getGroup();
    const isAdmin = clientGroup === "admin";

    return (
        <UsersListClient
            allUsers={allUsers}
            isAdmin={isAdmin}
        />
    );
}
