import {day} from './trigger';
import {qualifyingPairs} from './trigger';
export const liveTeams=[
 {key:'timberwolves',label:'Timberwolves',name:'Timberwolves',full:'Minnesota Timberwolves',league:'basketball/nba',id:'16'},
 {key:'vikings',label:'Vikings',name:'Vikings',full:'Minnesota Vikings',league:'football/nfl',id:'16'},
 {key:'gophers-football',label:'Gophers football',name:'Gophers',full:'Minnesota Golden Gophers Football',league:'football/college-football',id:'135'},
 {key:'gophers-hockey',label:'Gophers hockey',name:'Gophers',full:'Minnesota Golden Gophers Hockey',league:'hockey/mens-college-hockey',id:'135'},
 {key:'minnesota-united',label:'Minnesota United',name:'Minnesota United',full:'Minnesota United FC',league:'soccer/usa.1',id:'17362'},
 {key:'twins',label:'Twins',name:'Twins',full:'Minnesota Twins',league:'baseball/mlb',id:'9'}];
export type LiveTeam=typeof liveTeams[number];
const API='https://site.api.espn.com/apis/site/v2/sports/';
const recentCache=new Map<string,{until:number;data:any}>(),pending=new Map<string,Promise<any>>();
export async function gameJSON(url:string){
 const cached=recentCache.get(url);if(cached&&cached.until>Date.now())return cached.data;
 if(pending.has(url))return pending.get(url);
 const promise=(async()=>{const response=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json'}});if(!response.ok)throw Error('Game feed unavailable');const data=await response.json();if(recentCache.size>160)recentCache.clear();recentCache.set(url,{until:Date.now()+15000,data});return data;})();
 pending.set(url,promise);try{return await promise;}finally{pending.delete(url);}
}
function number(x:any){if(x===null||x===undefined||x==='')return null;const n=Number(typeof x==='object'?x.value??x.displayValue:x);return Number.isFinite(n)?n:null;}
export function normalizeGame(e:any,t:LiveTeam){
 const c=e.competitions?.[0],ours=c?.competitors?.find((v:any)=>String(v.team?.id)===t.id),other=c?.competitors?.find((v:any)=>String(v.team?.id)!==t.id);
 if(!ours||!other||!e.id||!Number.isFinite(Date.parse(e.date)))return null;
 const st=e.status||c.status||{};
 return {id:String(e.id),date:e.date,team:t.key,stage:number(e.season?.type??e.seasonType?.type??e.seasonType?.id),home:ours.homeAway==='home',neutral:c.neutralSite===true,venue:c.venue?.fullName||'',ours:{id:t.id,name:t.name,full:t.full,score:number(ours.score)},other:{id:String(other.team.id),name:other.team.shortDisplayName||other.team.name,full:other.team.displayName,score:number(other.score)},state:st.type?.state||'pre',completed:st.type?.completed===true,statusName:st.type?.name||'',detail:st.type?.shortDetail||st.type?.detail||'',period:number(st.period),clock:st.displayClock||'',metrics:{pairs:null as number|null,sacks:null as number|null,interceptions:null as number|null,quarter3:null as number|null},statsAvailable:false};
}
export function selectGames(games:any[],now=Date.now()){
 const sorted=[...games].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
 const live=sorted.find(g=>g.state==='in');const recent=sorted.filter(g=>g.completed&&Date.parse(g.date)<=now).at(-1);
 const next=sorted.find(g=>g.state==='pre'&&!/POSTPONED|CANCELED|SUSPENDED/i.test(g.statusName)&&Date.parse(g.date)>=now);
 return {display:live||(recent&&day(new Date(recent.date))===day(new Date(now))?recent:next)||recent||null,next:next||null,recent:recent||null};
}
export function gameTitle(g:any){return g.home?`${g.other.name} vs. ${g.ours.name}`:`${g.ours.name} vs. ${g.other.name}`;}
export function gamePath(g:any){const slug=gameTitle(g).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');return `/games/${g.team}/${slug}-${day(new Date(g.date))}-${g.id}`;}
export function enrichGame(g:any,s:any,t:LiveTeam){
 const h=s.header;
 if(h&&String(h.id)===g.id){const fresh=normalizeGame({...h,date:g.date,season:{type:g.stage}},t);if(fresh)for(const key of ['ours','other','state','completed','statusName','detail','period','clock'])g[key]=fresh[key as keyof typeof fresh];}
 const plays=s.plays;
 if(t.key==='timberwolves'&&Array.isArray(plays)&&plays.length&&(!g.completed||plays.some(p=>Number(p.period?.number)===4))){g.metrics.pairs=qualifyingPairs(plays,g.other.id).length;g.statsAvailable=true;}
 if(t.key==='vikings'){
  const defense=s.boxscore?.players?.find((p:any)=>String(p.team?.id)===t.id)?.statistics?.find((v:any)=>v.name==='defensive');
  const ix=defense?.labels?.findIndex((v:string)=>v.toUpperCase()==='SACKS');
  if(ix>=0&&defense.totals?.[ix]!==undefined)g.metrics.sacks=number(defense.totals[ix]);
  if(g.metrics.sacks===null){const stats=s.boxscore?.teams?.find((p:any)=>String(p.team?.id)===t.id)?.statistics||[];const found=stats.find((v:any)=>['sacks','sacksTotal'].includes(v.name));if(found)g.metrics.sacks=number(found.displayValue??found.value);}
  const interception=s.boxscore?.players?.find((p:any)=>String(p.team?.id)===t.id)?.statistics?.find((v:any)=>v.name==='interceptions');
  const intIndex=interception?.labels?.findIndex((v:string)=>v.toUpperCase()==='INT');
  if(intIndex>=0)g.metrics.interceptions=number(interception.totals?.[intIndex]);
  if(g.metrics.interceptions===null){const other=s.boxscore?.teams?.find((p:any)=>String(p.team?.id)!==t.id);const stat=other?.statistics?.find((v:any)=>v.name==='interceptions');if(stat)g.metrics.interceptions=number(stat.displayValue??stat.value);}
  g.statsAvailable=g.metrics.sacks!==null||g.metrics.interceptions!==null;
 }
 if(t.key==='gophers-football'){
  const ours=s.header?.competitions?.[0]?.competitors?.find((c:any)=>String(c.team?.id)===t.id);
  const line=ours?.linescores?.find((l:any)=>Number(l.period)===3)||ours?.linescores?.[2];
  g.metrics.quarter3=number(line?.value??line?.displayValue);g.statsAvailable=g.metrics.quarter3!==null;
 }
 return g;
}
export async function loadGames(t:LiveTeam,now=Date.now(),eventId?:string){
 const date=new Date(now);const year=date.getUTCFullYear()+(['timberwolves','gophers-hockey'].includes(t.key)&&date.getUTCMonth()>=6?1:0);
 const types=!['timberwolves','gophers-hockey'].includes(t.key)?[2,3]:[1,2,3];
 const requests=types.map(type=>gameJSON(`${API}${t.league}/teams/${t.id}/schedule?season=${year}&seasontype=${type}`));
 requests.push(gameJSON(`${API}${t.league}/scoreboard?dates=${day(date).replaceAll('-','')}`));
 const results=await Promise.allSettled(requests);const map=new Map<string,any>();let available=false;
 for(let i=0;i<results.length;i++){const r=results[i];if(r.status!=='fulfilled'||!Array.isArray(r.value.events))continue;available=true;for(const e of r.value.events){const g=normalizeGame({...e,season:{...e.season,type:e.season?.type??types[i]}},t);if(g)map.set(g.id,g);}}
 if(eventId&&!map.has(eventId)){try{const summary=await gameJSON(`${API}${t.league}/summary?event=${eventId}`);const h=summary.header;const g=normalizeGame({...h,date:h?.competitions?.[0]?.date,season:h?.season},t);if(g){enrichGame(g,summary,t);map.set(g.id,g);available=true;}}catch{}}
 const games=[...map.values()];const chosen=selectGames(games,now);
 const targets=games.filter(g=>g.state==='in'||g.id===eventId||g.id===chosen.recent?.id||g.id===chosen.display?.id);
 await Promise.all(targets.map(async g=>{try{enrichGame(g,await gameJSON(`${API}${t.league}/summary?event=${g.id}`),t);}catch{}}));
 return {team:t.key,games,error:!available,checkedAt:available?new Date(now).toISOString():null};
}
export function dealProgress(dealId:string,g:any){
 if(!g||!['bricken','wings','vcoffee','gcoffee','curds'].includes(dealId))return null;
 const eligible=[2,3].includes(g.stage)&&(!['bricken','curds'].includes(dealId)||g.home);
 let value:number|null=null,target=1,label='',note=null;
 if(dealId==='bricken'){value=g.metrics.pairs;label=g.period<4?'Waiting for the fourth quarter':value===null?'Free-throw check updating':value>=1?'Two consecutive misses · trigger met':'Waiting for two consecutive opponent misses';}
 if(dealId==='wings'){value=g.metrics.sacks;target=2;label=value===null?'Sack count updating':`${value} of 2 sacks`;}
 if(dealId==='vcoffee'){value=g.metrics.interceptions;label=value===null?'Interception count updating':`${value} interception${value===1?'':'s'}`;}
 if(dealId==='gcoffee'){value=g.completed&&g.ours.score!==null&&g.other.score!==null?Number(g.ours.score>g.other.score):null;label='Game underway · win needs the final whistle';}
 if(dealId==='curds'){value=g.period<3?0:g.metrics.quarter3;label=g.period<3?'Waiting for the third quarter':value===null?'Third-quarter score updating':value>0?'Third-quarter points · trigger met':'Waiting for third-quarter points';}
 const met=eligible&&value!==null&&value>=target;
 return {label:eligible?label:'Not eligible',eligible,met,target,value,note:eligible?note:!g.home?'Only home games qualify.':'Preseason games do not qualify.'};
}
