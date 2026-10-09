import {qualifyingPairs,day} from './trigger';
export async function json(url:string):Promise<any>{const r=await fetch(url,{signal:AbortSignal.timeout(9000)});if(!r.ok)throw new Error('Game feed unavailable');return r.json();}
export function ageDays(date:string,now:Date){return Math.round((Date.parse(day(now)+'T12:00:00Z')-Date.parse(day(new Date(date))+'T12:00:00Z'))/86400000);}
export function isHome(event:any,team:string){return event.competitions?.[0]?.competitors?.some((c:any)=>String(c.team?.id)===team&&c.homeAway==='home');}
export function isFinal(event:any){return (event.status?.type||event.competitions?.[0]?.status?.type)?.completed===true;}
export function isRegular(event:any){return [2,3].includes(Number(event.season?.type));}
export function won(event:any,team:string){return event.competitions?.[0]?.competitors?.some((c:any)=>String(c.team?.id)===team&&c.winner===true);}
export function stat(summary:any,team:string,category:string,label:string):number|null{const row=summary.boxscore?.players?.find((p:any)=>String(p.team?.id)===team)?.statistics?.find((s:any)=>s.name===category);const i=row?.labels?.indexOf(label);const v=i>=0?row?.totals?.[i]:undefined;return v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;}
export function thirdQuarterPoints(event:any,team:string):number|null{const c=event.competitions?.[0]?.competitors?.find((c:any)=>String(c.team?.id)===team);const line=c?.linescores?.find((l:any)=>Number(l.period)===3)||c?.linescores?.[2];return line&&Number.isFinite(Number(line.value))?Number(line.value):null;}
export function qualifiedNBA(event:any,plays:any[],team='16'){if(!isHome(event,team)||!isRegular(event))return [];const opponent=event.competitions[0].competitors.find((c:any)=>String(c.team?.id)!==team);return opponent?qualifyingPairs(plays,String(opponent.team.id)):[];}
export function windowStatus(dates:string[],now:Date,days:number){const ages=dates.map(d=>ageDays(d,now));return ages.some(a=>a>=1&&a<=days)?'ACTIVE':ages.includes(0)?'ACTIVE TOMORROW':'NOT ACTIVE';}
export async function scoreboard(sport:string,league:string,now:Date,back=3){
 // ESPN rejects date ranges for these feeds. Fetch each Central calendar day.
 const dates=[...new Set(Array.from({length:back+1},(_,i)=>day(new Date(now.getTime()-i*86400000)).replaceAll('-','')))];
 const feeds=await Promise.all(dates.map(date=>json(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?dates=${date}&limit=1000${league==='college-football'?'&groups=80':''}`)));
 if(feeds.some(data=>!Array.isArray(data.events)))throw Error('Incomplete schedule');
 const events=new Map<string,any>();
 for(const data of feeds)for(const event of data.events)events.set(String(event.id),event);
 return [...events.values()];
}
export function nbaExplanation(event:any,plays:any[]){
 const opponent=event.competitions?.[0]?.competitors?.find((c:any)=>String(c.team?.id)!=='16');
 if(!isRegular(event))return 'Preseason games don’t count for this deal.';
 if(!opponent)return 'Game data is incomplete.';
 const id=String(opponent.team.id);
 if(!isHome(event,'16'))return qualifyingPairs(plays,id,[1,2,3,4,5,6,7,8]).length?'The missed free throws happened in an away game.':'The Timberwolves played away. This deal needs a home game.';
 if(qualifyingPairs(plays,id,[1,2,3]).length)return 'The missed free throws happened before the fourth quarter.';
 if(qualifyingPairs(plays,id,[5,6,7,8]).length)return 'The missed free throws happened in overtime.';
 return isFinal(event)?'The opposing team didn’t miss two fourth-quarter free throws in a row.':'No qualifying misses yet. The game is still underway.';
}
export async function nbaStatus(now:Date){
 const date=day(now);
 if(date<'2026-10-21')return {status:'COMING SOON',message:'Coming soon! 🏀 The regular season starts October 21.',availabilityUnconfirmed:false,gameCheck:{label:'Game check',detail:'Preseason games don’t qualify for this deal.'}};
 if(date>'2027-06-30')return {status:'NOT ACTIVE',message:'This promotion ended June 30.',availabilityUnconfirmed:false};
 let status='NOT ACTIVE',uncertain=false,message='The Timberwolves didn’t play yesterday.';
 let gameCheck:{label:string;detail:string}|undefined;
 const dates:string[]=[],reasons:{date:string;message:string}[]=[];
 try{
  const events=(await scoreboard('basketball','nba',now,1)).filter((e:any)=>[0,1].includes(ageDays(e.date,now))&&e.competitions?.[0]?.competitors?.some((c:any)=>String(c.team?.id)==='16'));
  const latest=events.filter((e:any)=>(e.status?.type||e.competitions?.[0]?.status?.type)?.state!=='pre').sort((a:any,b:any)=>Date.parse(b.date)-Date.parse(a.date))[0];
  if(latest){
   const opponent=latest.competitions[0].competitors.find((c:any)=>String(c.team?.id)!=='16');
   const name=opponent?.team?.displayName||opponent?.team?.name||'opponent';
   const gameDate=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'long',day:'numeric',year:'numeric'}).format(new Date(latest.date));
   gameCheck={label:'Latest game',detail:`Timberwolves ${isHome(latest,'16')?'vs.':'at'} ${name} · ${gameDate} · ${isHome(latest,'16')?'Home':'Away'} · ${isFinal(latest)?'Final':'In progress'}`};
  }else gameCheck={label:'Game check',detail:'No Timberwolves game yesterday or underway today.'};
  for(const e of events){
   const state=e.status?.type||e.competitions[0].status?.type;
   if(state?.state==='pre')continue;
   if(!isRegular(e)){reasons.push({date:e.date,message:'Preseason games don’t count for this deal.'});continue;}
   try{
    const s=await json('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event='+e.id);
    if(!Array.isArray(s.plays)||!s.plays.length||isFinal(e)&&!s.plays.some((p:any)=>Number(p.period?.number)===4)){
     // Away games cannot activate the deal, even if their play-by-play is missing.
     if(!isHome(e,'16'))reasons.push({date:e.date,message:'The Timberwolves played away. This deal needs a home game.'});
     else uncertain=true;
     continue;
    }
    if(qualifiedNBA(e,s.plays).length)dates.push(e.date);
    else reasons.push({date:e.date,message:nbaExplanation(e,s.plays)});
   }catch{if(isHome(e,'16'))uncertain=true;else reasons.push({date:e.date,message:'The Timberwolves played away. This deal needs a home game.'});}
  }
  status=windowStatus(dates,now,1);
  if(status==='ACTIVE')message='Two misses, free chicken! 🎉';
  else if(status==='ACTIVE TOMORROW')message='Two misses! Free chicken tomorrow! 🎉';
  else if(uncertain)message='Game data is incomplete. Checking again soon.';
  else message=reasons.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))[0]?.message||message;
 }catch{uncertain=true;message='Game data is unavailable. Checking again soon.';}
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(now);
 const val=(t:string)=>parts.find(p=>p.type===t)?.value;
 const mins=Number(val('hour'))*60+Number(val('minute'));
 if(status==='ACTIVE'&&val('weekday')==='Sun'){status='NOT ACTIVE';uncertain=true;message='Sunday redemption isn’t confirmed.';}
 else if(status==='ACTIVE'&&mins>=1260){status='NOT ACTIVE';message='Today’s deal ended at 9 p.m.';}
 else if(status==='ACTIVE'&&mins>=630)message='Two misses, free chicken! 🎉 Already claimed? Redeem by 9 p.m.';
 return {status,message,availabilityUnconfirmed:uncertain&&status==='NOT ACTIVE',gameCheck};
}
export function footballExplanation(id:string,event:any,now:Date){
 const team=id==='wings'||id==='vcoffee'?'Vikings':'Gophers';
 if(!event)return `The ${team} didn’t play yesterday.`;
 if(!isFinal(event))return `The ${team} game hasn’t finished yet.`;
 if(ageDays(event.date,now)>(id==='wings'?3:id==='curds'?2:1))return 'The last offer window has ended.';
 if(id==='gcoffee')return 'The Gophers didn’t win.';
 if(id==='vcoffee')return 'The Vikings didn’t make an interception.';
 if(id==='wings')return 'The Vikings didn’t record two sacks.';
 return isHome(event,'135')?'The Gophers didn’t score in the third quarter.':'The Gophers played away. This deal needs a home game.';
}
export async function footballStatuses(now:Date){
 const out:Record<string,any>={};
 const cheers:Record<string,string>={wings:'Two sacks, wings unlocked! 🎉',vcoffee:'An interception means BOGO drinks! ☕🎉',gcoffee:'Gophers win, BOGO drinks! ☕🎉',curds:'Third-quarter points, cheese curds unlocked! 🎉'};
 const tomorrow:Record<string,string>={wings:'Two sacks! Wings tomorrow! 🎉',vcoffee:'An interception! BOGO drinks tomorrow! ☕🎉',gcoffee:'Gophers win! BOGO drinks tomorrow! ☕🎉',curds:'Third-quarter points! Cheese curds tomorrow! 🎉'};
 for(const [league,team,ids] of [['nfl','16',['wings','vcoffee']],['college-football','135',['gcoffee','curds']]] as const){
  try{
   const teamEvents=(await scoreboard('football',league,now)).filter((e:any)=>isRegular(e)&&e.competitions?.[0]?.competitors?.some((c:any)=>String(c.team?.id)===team)).sort((a:any,b:any)=>Date.parse(b.date)-Date.parse(a.date));
   const events=teamEvents.filter((e:any)=>isFinal(e));
   const dates:Record<string,string[]>={},uncertain:Record<string,boolean>={};
   ids.forEach(id=>{dates[id]=[];uncertain[id]=false;});
   for(const e of events){
    if(league==='nfl'){
     try{
      const s=await json(`https://site.api.espn.com/apis/site/v2/sports/football/${league}/summary?event=${e.id}`);
      const sacks=stat(s,team,'defensive','SACKS'),ints=stat(s,team,'interceptions','INT');
      if(sacks===null)uncertain.wings=true;else if(sacks>=2)dates.wings.push(e.date);
      if(ints===null)uncertain.vcoffee=true;else if(ints>=1)dates.vcoffee.push(e.date);
     }catch{uncertain.wings=true;uncertain.vcoffee=true;}
    }else{
     if(won(e,team))dates.gcoffee.push(e.date);
     if(isHome(e,team)){const q=thirdQuarterPoints(e,team);if(q===null)uncertain.curds=true;else if(q>0)dates.curds.push(e.date);}
    }
   }
   for(const id of ids){
    const status=windowStatus(dates[id],now,id==='wings'?3:id==='curds'?2:1);
    const latest=teamEvents.find((e:any)=>(e.status?.type||e.competitions?.[0]?.status?.type)?.state!=='pre');
    out[id]={status,availabilityUnconfirmed:status==='NOT ACTIVE'&&uncertain[id],message:status==='ACTIVE'?cheers[id]:status==='ACTIVE TOMORROW'?tomorrow[id]:uncertain[id]?'Game data is incomplete. Checking again soon.':footballExplanation(id,latest,now)};
   }
  }catch{for(const id of ids)out[id]={status:'NOT ACTIVE',availabilityUnconfirmed:true,message:'Game data is unavailable. Checking again soon.'};}
 }
 return out;
}
