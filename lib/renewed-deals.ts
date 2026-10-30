import {ageDays,isFinal,isHome,json,scoreboard,windowStatus} from './game-checks';
import {day} from './trigger';

function number(value:any):number|null{
 const raw=value&&typeof value==='object'?value.value??value.displayValue:value;
 if(raw===undefined||raw===null||raw===''||!/^\d+$/.test(String(raw)))return null;
 const n=Number(raw);return Number.isSafeInteger(n)?n:null;
}
function ours(event:any,team:string){return event.competitions?.[0]?.competitors?.find((c:any)=>String(c.team?.id)===team);}
function recent(events:any[],team:string,now:Date,days:number){return events.filter(e=>ours(e,team)&&ageDays(e.date,now)>=0&&ageDays(e.date,now)<=days&&Date.parse(e.date)<=now.getTime()).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));}
export function threes(event:any):number|null{
 const stat=ours(event,'16')?.statistics?.find((s:any)=>s.name==='threePointFieldGoalsMade');
 return number(stat?.value??stat?.displayValue);
}
export function friesFromGames(events:any[],now:Date){
 const date=day(now);
 if(date>'2027-06-30')return {status:'NOT ACTIVE',message:'This fries promotion ended June 30, 2027.',availabilityUnconfirmed:false};
 const games=recent(events,'16',now,2),finals=games.filter(isFinal);
 const status=windowStatus(finals.filter(e=>(threes(e)??-1)>=11).map(e=>e.date),now,2);
 if(status==='ACTIVE')return {status,message:'Eleven threes, free fries! 🍟🎉 Add a $2 purchase in the McDonald’s app.',availabilityUnconfirmed:false};
 if(status==='ACTIVE TOMORROW')return {status,message:'Eleven threes! Free fries tomorrow! 🍟🎉 A $2 purchase is required.',availabilityUnconfirmed:false};
 const missing=finals.some(e=>threes(e)===null);
 const message=missing?'Three-point data is incomplete. Checking again soon.':!games.length?'The Timberwolves haven’t played in the last two days.':!isFinal(games[0])?'The Timberwolves game hasn’t finished yet.':`The Timberwolves made ${threes(games[0])} threes. This deal needs 11.`;
 return {status:'NOT ACTIVE',message,availabilityUnconfirmed:missing};
}
export async function friesStatus(now:Date){
 const games=await scoreboard('basketball','nba',now,2);
 await Promise.all(recent(games,'16',now,2).filter(e=>isFinal(e)&&threes(e)===null).map(async e=>{
  try{
   const summary=await json('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event='+e.id);
   const stat=summary.boxscore?.teams?.find((t:any)=>String(t.team?.id)==='16')?.statistics?.find((s:any)=>s.name==='threePointFieldGoalsMade-threePointFieldGoalsAttempted');
   const match=String(stat?.displayValue??'').match(/^(\d+)-\d+$/);
   if(match){const team=ours(e,'16');team.statistics=[...(team.statistics||[]),{name:'threePointFieldGoalsMade',displayValue:match[1]}];}
  }catch{}
 }));
 return friesFromGames(games,now);
}
export function custardFromGames(events:any[],now:Date){
 const games=recent(events,'135',now,2);
 let missing=false,uncertainExpiry=false;
 for(const e of games){
  const season=Number(e.season?.type??e.seasonType?.type??e.seasonType?.id);
  if(season!==2||!isHome(e,'135')||e.competitions?.[0]?.neutralSite===true||!isFinal(e))continue;
  const goals=number(ours(e,'135')?.score);
  if(goals===null){missing=true;continue;}
  if(goals<5)continue;
  const start=Date.parse(e.date),end=Date.parse(e.endDate??e.competitions?.[0]?.endDate??'');
  const knownEnd=Number.isFinite(end)&&end>=start&&end<=now.getTime();
  // Never estimate a finish time. Before start+24h, a completed game's
  // after-game 24h window is certainly still open. Beyond that, require
  // an actual end timestamp rather than silently expiring a valid coupon.
  const expiry=(knownEnd?end:start)+86400000;
  if(now.getTime()<expiry)return {status:'ACTIVE',message:'Five goals, free custard! 🍦🎉 Redeem within 24 hours after the home game.',availabilityUnconfirmed:false};
  if(!knownEnd&&now.getTime()<start+2*86400000)uncertainExpiry=true;
 }
 const latest=games[0];
 const message=missing?'The Gophers’ final score is incomplete. Checking again soon.':uncertainExpiry?'Five goals were scored. Check the offer’s 24-hour expiration at Culvers.com/GopherScore.':!latest?'The Gophers men’s hockey team hasn’t played in the last two days.':Number(latest.season?.type??latest.seasonType?.type??latest.seasonType?.id)!==2?'This deal needs a regular-season men’s hockey game.':!isHome(latest,'135')||latest.competitions?.[0]?.neutralSite===true?'The Gophers played away. This deal needs a home game.':!isFinal(latest)?'The Gophers hockey game hasn’t finished yet.':number(ours(latest,'135')?.score)===null?'The Gophers’ final score is incomplete. Checking again soon.':number(ours(latest,'135')?.score)!>=5?'The last custard offer window has ended.':'The Gophers didn’t score five goals at home.';
 return {status:'NOT ACTIVE',message,availabilityUnconfirmed:missing||uncertainExpiry||!!(latest&&isFinal(latest)&&number(ours(latest,'135')?.score)===null)};
}
export async function renewedStatuses(now:Date){
 const results=await Promise.allSettled([friesStatus(now),scoreboard('hockey','mens-college-hockey',now,2).then(events=>custardFromGames(events,now))]);
 const out:Record<string,any>={};
 for(const [i,id] of ['fries','custard'].entries()){const result=results[i];out[id]=result.status==='fulfilled'?result.value:{status:'NOT ACTIVE',message:'Game data is unavailable. Checking again soon.',availabilityUnconfirmed:true};}
 return out;
}
