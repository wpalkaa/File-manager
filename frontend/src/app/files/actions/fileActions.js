'use server';

import axios from 'axios';
import { revalidatePath } from 'next/cache';

function getBackendUrl() {
    return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://nginx';
}

export async function listFilesAction(path = '/') {
    try {
        const baseURL = getBackendUrl();
        const response = await axios.post(`${baseURL}/api/files/listFiles`, { path });
        return response.data;
    } catch (error) {
        console.error('[listFilesAction Error]:', error?.response?.data || error.message);
        return {
            success: false,
            message: error?.response?.data?.message || error.message || 'server',
            files: []
        };
    }
}

export async function getFileInfoAction(path = '/') {
    try {
        const baseURL = getBackendUrl();
        const response = await axios.post(`${baseURL}/api/files/getFileInfo`, { path });
        return response.data;
    } catch (error) {
        console.error('[getFileInfoAction Error]:', error?.response?.data || error.message);
        return {
            success: false,
            message: error?.response?.data?.message || error.message || 'server',
            fileInfo: null
        };
    }
}

export async function createFileAction(path, name, isDirectory) {
    try {
        const baseURL = getBackendUrl();
        const response = await axios.post(`${baseURL}/api/files/create`, { path, name, isDirectory });
        if (response.data?.success) {
            revalidatePath('/files');
        }
        return response.data;
    } catch (error) {
        console.error('[createFileAction Error]:', error?.response?.data || error.message);
        return {
            success: false,
            message: error?.response?.data?.message || error.message || 'server'
        };
    }
}

export async function renameFileAction(path, newName) {
    try {
        const baseURL = getBackendUrl();
        const response = await axios.patch(`${baseURL}/api/files/rename`, { path, newName });
        if (response.data?.success) {
            revalidatePath('/files');
        }
        return response.data;
    } catch (error) {
        console.error('[renameFileAction Error]:', error?.response?.data || error.message);
        return {
            success: false,
            message: error?.response?.data?.message || error.message || 'server'
        };
    }
}

export async function deleteFileAction(path) {
    try {
        const baseURL = getBackendUrl();
        const response = await axios.delete(`${baseURL}/api/files/delete`, { data: { path } });
        if (response.data?.success) {
            revalidatePath('/files');
        }
        return response.data;
    } catch (error) {
        console.error('[deleteFileAction Error]:', error?.response?.data || error.message);
        return {
            success: false,
            message: error?.response?.data?.message || error.message || 'server'
        };
    }
}

export async function getFileContentAction(path) {
    try {
        const baseURL = getBackendUrl();
        const response = await axios.get(`${baseURL}/api/files/content`, {
            params: { path }
        });
        return response.data;
    } catch (error) {
        console.error('[getFileContentAction Error]:', error?.response?.data || error.message);
        return {
            success: false,
            message: error?.response?.data?.message || error.message || 'server'
        };
    }
}

export async function saveFileContentAction(path, content) {
    try {
        const baseURL = getBackendUrl();
        const response = await axios.put(`${baseURL}/api/files/content`, { path, content });
        if (response.data?.success) {
            revalidatePath('/files');
        }
        return response.data;
    } catch (error) {
        console.error('[saveFileContentAction Error]:', error?.response?.data || error.message);
        return {
            success: false,
            message: error?.response?.data?.message || error.message || 'server'
        };
    }
}
