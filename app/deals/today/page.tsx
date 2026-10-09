import type {Metadata} from 'next';
export const metadata:Metadata={title:'Minnesota Sports Food Deals Today | MN Food Wins',description:'Check today’s Minnesota sports food deals, including Timberwolves Chick-fil-A, Vikings wings, and Gophers Caribou BOGO. See status and claim instructions.',alternates:{canonical:'/deals/today'}};
import DealBoard from '../../deal-board';
export default function Deals(){return <main className="home-board"><DealBoard headline/></main>}
