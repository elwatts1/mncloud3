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
