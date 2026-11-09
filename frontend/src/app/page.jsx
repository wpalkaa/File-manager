import HomePageServer from '@/components/HomePage/HomePageServer';
import { getUsername } from '@/lib/getClientInfo';

export default async function Home() {
    const user = await getUsername();

    return (
        <HomePageServer username={user?.name || ''} />
    );
}