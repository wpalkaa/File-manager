import LanguageSwitch from '../LanguageSwitch/LanguageSwitch';
import NavListClient from './NavListClient';
import UserSectionClient from './UserSectionClient';

export default function NavBarServer({ username }) {
    return (
        <aside className="navbar">
            <div className="navbar-logo">WP</div>
            <NavListClient />

            <footer className="navbar-footer">
                {username && <UserSectionClient username={username} />}
                <LanguageSwitch />
            </footer>
        </aside>
    );
}
