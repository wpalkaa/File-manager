import { LanguageProvider } from '@/context/LanguageProvider';
import NavBarServer from '@/components/NavBar/NavBarServer';
import './globals.css';

import { getUsername } from '@/lib/getClientInfo';

export default async function RootLayout({ children }) {
    const user = await getUsername();

    return (
        <html lang="en">
            <body>
                <LanguageProvider>
                    <NavBarServer username={user?.name || ''} />

                    {children}

                    <div id="dialogs"></div>
                </LanguageProvider>

                <script src="https://kit.fontawesome.com/c0e27db627.js" crossOrigin="anonymous"></script>
            </body>
        </html>
    );
}
