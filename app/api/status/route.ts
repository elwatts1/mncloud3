import {nbaStatus} from '../../../lib/game-checks';
export async function GET(){return Response.json(await nbaStatus(new Date()));}
