const assert=require('node:assert/strict');
const {friesFromGames,custardFromGames,friesStatus,renewedStatuses}=require('../.sites-runtime/test/renewed-deals.js');
const now=new Date('2026-10-29T14:00:00Z');
function game(team,score,home=true){return {id:'test',date:'2026-10-29T00:00:00Z',season:{type:2},status:{type:{state:'post',completed:true}},competitions:[{competitors:[{team:{id:team},homeAway:home?'home':'away',score:String(score),statistics:[{name:'threePointFieldGoalsMade',displayValue:String(score)}]},{team:{id:'other'},homeAway:home?'away':'home',score:'3'}]}]};}
for(const home of [true,false]){
 assert.equal(friesFromGames([game('16',11,home)],now).status,'ACTIVE');
 assert.equal(friesFromGames([game('16',10,home)],now).status,'NOT ACTIVE');
}
const fries=game('16',11);
assert.equal(friesFromGames([fries],new Date('2026-10-29T04:59:59Z')).status,'ACTIVE TOMORROW');
assert.equal(friesFromGames([fries],new Date('2026-10-30T14:00:00Z')).status,'ACTIVE');
assert.equal(friesFromGames([fries],new Date('2026-10-31T05:00:00Z')).status,'NOT ACTIVE');
assert.equal(friesFromGames([game('other',11)],now).status,'NOT ACTIVE');
assert.equal(friesFromGames([{...fries,status:{type:{state:'in',completed:false}}}],now).status,'NOT ACTIVE');
assert.equal(friesFromGames([game('16','bad')],now).availabilityUnconfirmed,true);
assert.match(friesFromGames([],new Date('2027-07-01T14:00:00Z')).message,/ended June 30, 2027/);
const hockey=game('135',5);hockey.endDate='2026-10-29T02:30:00Z';
assert.equal(custardFromGames([hockey],now).status,'ACTIVE');
assert.equal(custardFromGames([hockey],new Date('2026-10-30T02:29:59Z')).status,'ACTIVE');
assert.equal(custardFromGames([hockey],new Date('2026-10-30T02:30:00Z')).status,'NOT ACTIVE');
for(const bad of [game('135',4),game('135',5,false),{...hockey,season:{type:1}},{...hockey,season:{type:3}},{...hockey,status:{type:{state:'in',completed:false}}}])assert.equal(custardFromGames([bad],now).status,'NOT ACTIVE');
const neutral=game('135',5);neutral.competitions[0].neutralSite=true;assert.equal(custardFromGames([neutral],now).status,'NOT ACTIVE');
assert.equal(custardFromGames([game('135',6)],now).status,'ACTIVE');
const unknownEnd=game('135',5);let result=custardFromGames([unknownEnd],new Date('2026-10-30T01:00:00Z'));assert.equal(result.status,'NOT ACTIVE');assert.equal(result.availabilityUnconfirmed,true);assert.match(result.message,/24-hour expiration/);
assert.equal(custardFromGames([game('135','bad')],now).availabilityUnconfirmed,true);
(async()=>{
 const saved=global.fetch;
 try{
  const missing=game('16',0);missing.competitions[0].competitors[0].statistics=[];
  global.fetch=async url=>({ok:true,json:async()=>String(url).includes('/summary?')?{boxscore:{teams:[{team:{id:'16'},statistics:[{name:'threePointFieldGoalsMade-threePointFieldGoalsAttempted',displayValue:'12-34'}]}]}}:{events:[missing]}});
  assert.equal((await friesStatus(now)).status,'ACTIVE');
  global.fetch=async url=>{if(String(url).includes('/hockey/'))throw Error('hockey down');return {ok:true,json:async()=>({events:[fries]})};};
  result=await renewedStatuses(now);assert.equal(result.fries.status,'ACTIVE');assert.equal(result.custard.status,'NOT ACTIVE');assert.equal(result.custard.availabilityUnconfirmed,true);
  console.log('Renewed deals passed: 11-threes threshold, home/away, two Central days, expiry, five-goal regular-season home games, 24-hour boundary, missing scores/end times and independent feed failures.');
 }finally{global.fetch=saved;}
})().catch(error=>{console.error(error);process.exitCode=1;});
