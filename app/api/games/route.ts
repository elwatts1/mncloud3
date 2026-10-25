import {liveTeams,loadGames} from '../../../lib/live-games';
export async function GET(request:Request){const key=new URL(request.url).searchParams.get('team');const t=liveTeams.find(t=>t.key===key);if(!t)return Response.json({error:'Unknown team'},{status:404});return Response.json(await loadGames(t),{headers:{'Cache-Control':'no-store'}});}
