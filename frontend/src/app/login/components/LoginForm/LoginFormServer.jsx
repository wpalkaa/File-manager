import { redirect } from 'next/navigation';
import { getUsername } from '@/lib/getClientInfo';
import LoginFormClient from './LoginFormClient';
import { loginAction } from '@/app/login/actions/loginAction';
import '../../LoginStyles.css';

export default async function LoginFormServer() {
    const user = await getUsername();

    // Auto-redirect if already logged in with a valid session
    if (user?.name && user.name !== 'Unknown') {
        redirect('/');
    }

    return (
        <div className="login-container">
            <LoginFormClient serverAction={loginAction} />
        </div>
    );
}
