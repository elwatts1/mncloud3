require('node:fs').writeFileSync(require('node:path').join(__dirname,'../.sites-runtime/test/package.json'),JSON.stringify({type:'commonjs'}));
const assert=require('node:assert/strict');
const {qualifiedNBA,stat,windowStatus,thirdQuarterPoints}=require('../.sites-runtime/test/game-checks.js');
const now=new Date('2026-10-01T04:00:00Z'); // Sep 30 in Minnesota.
const event={date:'2026-10-01T02:00:00Z',season:{type:2},competitions:[{competitors:[{team:{id:'16'},homeAway:'home'},{team:{id:'20'},homeAway:'away'}]}]};
function ft(n,q=4,player='10',clock='3:00',made=false){return{id:String(n)+q+player+clock,text:`Player ${made?'makes':'misses'} free throw ${n} of 2`,team:{id:'20'},participants:[{athlete:{id:player}}],period:{number:q},clock:{displayValue:clock}};}
assert.equal(qualifiedNBA(event,[ft(1),ft(2)]).length,1);
for(const q of [1,2,3,5,6])assert.equal(qualifiedNBA(event,[ft(1,q),ft(2,q)]).length,0);
assert.equal(qualifiedNBA({...event,competitions:[{competitors:[{team:{id:'16'},homeAway:'away'},{team:{id:'20'},homeAway:'home'}]}]},[ft(1),ft(2)]).length,0);
assert.equal(qualifiedNBA({...event,season:{type:1}},[ft(1),ft(2)]).length,0);
assert.equal(qualifiedNBA(event,[ft(1),ft(2,4,'11')]).length,0);
assert.equal(qualifiedNBA(event,[ft(1),ft(2,4,'10','2:59')]).length,0);
assert.equal(qualifiedNBA(event,[ft(1),{text:'Player enters the game'},ft(2)]).length,1);
assert.equal(qualifiedNBA(event,[ft(1),ft(2,4,'10','3:00',true)]).length,0);
assert.equal(windowStatus([event.date],now,1),'ACTIVE TOMORROW');
assert.equal(windowStatus(['2026-09-30T02:00:00Z'],now,1),'ACTIVE');
assert.equal(windowStatus(['2026-09-28T02:00:00Z'],now,3),'ACTIVE');
assert.equal(windowStatus(['2026-09-27T02:00:00Z'],now,3),'NOT ACTIVE');
assert.equal(stat({boxscore:{players:[{team:{id:'16'},statistics:[{name:'defensive',labels:['SACKS'],totals:['2.5']}]}]}},'16','defensive','SACKS'),2.5);
assert.equal(stat({},'16','defensive','SACKS'),null);
assert.equal(thirdQuarterPoints({competitions:[{competitors:[{team:{id:'135'},linescores:[{value:0},{value:7},{value:3}]}]}]},'135'),3);
console.log('Minnesota rules passed: same-trip fourth-quarter misses, home/away, preseason, Central dates, expiry, defense totals and quarter scoring.');
const {nbaStatus,nbaExplanation,footballStatuses,footballExplanation}=require('../.sites-runtime/test/game-checks.js');
const away={...event,competitions:[{competitors:[{team:{id:'16'},homeAway:'away'},{team:{id:'20'},homeAway:'home'}]}]};
assert.match(nbaExplanation(away,[ft(1),ft(2)]),/away game/);
assert.match(nbaExplanation({...event,status:{type:{completed:true}}},[ft(1,3),ft(2,3)]),/before the fourth quarter/);
assert.match(nbaExplanation(event,[ft(1,5),ft(2,5)]),/overtime/);
assert.match(footballExplanation('gcoffee',null,now),/didn’t play yesterday/);
assert.match(footballExplanation('curds',{date:now.toISOString(),status:{type:{completed:true}},competitions:[{competitors:[{team:{id:'135'},homeAway:'away'}]}]},now),/away/);
(async()=>{
 const savedFetch=global.fetch;
 const checkNow=new Date('2026-10-23T14:00:00Z');
 const final={...event,id:'game',date:'2026-10-23T02:00:00Z',status:{type:{completed:true,state:'post'}}};
 function mock(events,plays){global.fetch=async url=>({ok:true,json:async()=>String(url).includes('/summary?')?{plays}:{events}});}
 try{
  mock([],[]);assert.match((await nbaStatus(checkNow)).message,/didn’t play yesterday/);
  mock([final],[ft(1),ft(2)]);let result=await nbaStatus(checkNow);assert.equal(result.status,'ACTIVE');assert.equal(result.message,'Two misses, free chicken! 🎉');
  result=await nbaStatus(new Date('2026-10-23T16:00:00Z'));assert.match(result.message,/Already claimed/);
  result=await nbaStatus(new Date('2026-10-24T02:00:00Z'));assert.equal(result.status,'NOT ACTIVE');assert.match(result.message,/ended at 9 p.m/);
  mock([{...final,date:'2026-10-23T13:00:00Z'}],[ft(1),ft(2)]);result=await nbaStatus(checkNow);assert.equal(result.status,'ACTIVE TOMORROW');assert.match(result.message,/tomorrow/);
  mock([{...final,competitions:away.competitions}],[ft(1),ft(2)]);result=await nbaStatus(checkNow);assert.equal(result.status,'NOT ACTIVE');assert.match(result.message,/away game/);
  mock([final],[ft(1,3),ft(2,3),{period:{number:4},text:'Player makes jump shot'}]);result=await nbaStatus(checkNow);assert.equal(result.status,'NOT ACTIVE');assert.match(result.message,/before the fourth quarter/);
  mock([final],[]);result=await nbaStatus(checkNow);assert.equal(result.availabilityUnconfirmed,true);assert.match(result.message,/incomplete/);
  mock([{...final,season:{type:1}}],[ft(1),ft(2)]);result=await nbaStatus(checkNow);assert.equal(result.status,'NOT ACTIVE');assert.match(result.message,/Preseason/);
  mock([{...final,date:'2026-10-25T02:00:00Z'}],[ft(1),ft(2)]);result=await nbaStatus(new Date('2026-10-25T14:00:00Z'));assert.equal(result.status,'NOT ACTIVE');assert.match(result.message,/Sunday/);
  assert.equal((await nbaStatus(new Date('2026-10-09T14:00:00Z'))).status,'COMING SOON');
  const gopher={...final,competitions:[{competitors:[{team:{id:'135'},homeAway:'away',winner:true},{team:{id:'1'},homeAway:'home',winner:false}]}]};
  global.fetch=async url=>({ok:true,json:async()=>({events:String(url).includes('college-football')?[gopher]:[]})});
  let football=await footballStatuses(checkNow);assert.equal(football.gcoffee.status,'ACTIVE');assert.match(football.gcoffee.message,/Gophers win/);assert.equal(football.curds.status,'NOT ACTIVE');assert.match(football.curds.message,/away/);
  gopher.competitions[0].competitors[0].winner=false;gopher.competitions[0].competitors[1].winner=true;
  football=await footballStatuses(checkNow);assert.equal(football.gcoffee.status,'NOT ACTIVE');assert.match(football.gcoffee.message,/didn’t win/);
  const vikings={...final};
  global.fetch=async url=>({ok:true,json:async()=>String(url).includes('/summary?')?{boxscore:{players:[{team:{id:'16'},statistics:[{name:'defensive',labels:['SACKS'],totals:['3']},{name:'interceptions',labels:['INT'],totals:['1']}]}]}}:{events:String(url).includes('/nfl/')?[vikings]:[]}});
  football=await footballStatuses(checkNow);assert.equal(football.wings.status,'ACTIVE');assert.equal(football.vcoffee.status,'ACTIVE');assert.match(football.wings.message,/Two sacks/);assert.match(football.vcoffee.message,/interception/);
  global.fetch=async()=>{throw Error('feed unavailable');};result=await nbaStatus(checkNow);assert.equal(result.status,'NOT ACTIVE');assert.match(result.message,/unavailable/);
  console.log('Automatic explanations passed: no game, away, early misses, overtime, active/tomorrow, deadlines, preseason, incomplete data, wins and defensive triggers.');
 }finally{global.fetch=savedFetch;}
})().catch(error=>{console.error(error);process.exitCode=1;});
