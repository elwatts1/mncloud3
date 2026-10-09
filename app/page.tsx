import type {Metadata} from 'next';
export const metadata:Metadata={alternates:{canonical:'/'}};
import DealBoard from './deal-board';
export default function Home(){return <main className="home-board"><DealBoard headline/></main>}
