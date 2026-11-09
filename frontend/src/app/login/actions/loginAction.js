'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export async function loginAction(prevState, formData) {
    try {
        let login = '';
        let password = '';

        if (formData instanceof FormData) {
            login = formData.get('login') || '';
            password = formData.get('password') || '';
        } else if (formData && typeof formData === 'object' && 'login' in formData) {
            login = formData.login || '';
            password = formData.password || '';
        } else if (prevState && typeof prevState === 'object' && 'login' in prevState) {
            login = prevState.login || '';
            password = prevState.password || '';
        }

        const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://nginx';
        
        let response;
        try {
            response = await axios.post(`${backendUrl}/api/auth/login`, { login, password });
        } catch (err) {
            if (err.response) {
                return {
                    success: false,
                    message: err.response.data?.message || 'authRejected',
                };
            }
            throw err;
        }

        const data = response.data;
        if (!data || !data.success) {
            return {
                success: false,
                message: data?.message || 'authRejected',
            };
        }

        // Extract cookie from backend response headers
        const rawCookies = response.headers['set-cookie'];
        const setCookies = Array.isArray(rawCookies) ? rawCookies : (rawCookies ? [rawCookies] : []);

        let token = null;
        for (const cookieStr of setCookies) {
            const match = cookieStr.match(/user_session=([^;]+)/);
            if (match) {
                token = match[1];
                break;
            }
        }

        if (token) {
            const cookieStore = await cookies();
            cookieStore.set('user_session', token, {
                maxAge: 7 * 24 * 60 * 60,
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
            });
        }

        return {
            success: true,
            user: data.user,
        };
    } catch (error) {
        console.error('[loginAction Error]:', error?.response?.data || error.message);
        return {
            success: false,
            message: error?.response?.data?.message || error.message || 'server',
        };
    }
}
