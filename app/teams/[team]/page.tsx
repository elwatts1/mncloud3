import {notFound} from 'next/navigation';
import {liveTeams,loadGames} from '../../../lib/live-games';
import DealBoard from '../../deal-board';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{team:string}>}){const {team}=await params;const t=liveTeams.find(t=>t.key===team);if(!t)return {};return {title:`${t.label} Food Deals & Live Scores | MN Food Wins`,description:`Check ${t.label} food deals, reward status, and claim instructions. Follow the score and deal progress while the game is live.`,alternates:{canonical:`https://mnfoodwins.com/teams/${t.key}`}};}
export default async function Page({params}:{params:Promise<{team:string}>}){const {team}=await params;const t=liveTeams.find(t=>t.key===team);if(!t)notFound();const b=await loadGames(t);return <main className="home-board"><div className="page-title"><h1>{t.label} food deals</h1></div><DealBoard initialTeam={t.label} teamPage initialGames={b.error?[]:b.games}/><a className="back" href="/">Back to all deals</a></main>}
