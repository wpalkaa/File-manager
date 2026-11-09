
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

async function getTokenPayload() {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session');
    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.SECRET_KEY);
        const { payload } = await jwtVerify(token.value, secret);
        return payload;
    } catch (error) {
        console.error(`[Error]: Couldn't verify session token:\n${error}`);
        return null;
    }
}

export async function getUsername() {
    const payload = await getTokenPayload();
    if (!payload) return {};
    return { name: payload.login || 'Unknown' };
}

export async function getGroup() {
    const payload = await getTokenPayload();
    return payload?.group ?? 'Unknown';
}
