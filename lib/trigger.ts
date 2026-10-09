export type QualifyingPair={player:string;period:number;clock:string;playIds:string[]};

// One activation is a non-overlapping pair from the SAME free-throw trip.
// Minnesota published trigger: fourth quarter only. Overtime eligibility is unconfirmed.
export function qualifyingPairs(plays:any[], opponent:string, periods:number[]=[4]):QualifyingPair[] {
 const pairs:QualifyingPair[]=[];
 const seen=new Set<string>();
 let previous:{player:string;name:string;period:number;clock:string;n:number;total:number;id:string}|null=null;
 for(const p of plays){
  const id=p.id==null?'':String(p.id);
  if(id&&seen.has(id))continue;
  if(id)seen.add(id);
  const text=String(p.text||'');
  const m=text.match(/^(.*?) (makes|misses) free throw (\d+) of (\d+)/i);
  if(!m){
   // Substitutions, timeouts and dead-ball rebounds can occur between attempts.
   const teamRebound=/team rebound/i.test(text)&&previous?.clock===String(p.clock?.displayValue||'');
   const admin=teamRebound||/substitution|enters the game|timeout|deadball|dead ball|review|replay/i.test(text+' '+String(p.type?.text||''));
   if(!admin)previous=null;
   continue;
  }
  const period=Number(p.period?.number),n=Number(m[3]),total=Number(m[4]);
  const clock=String(p.clock?.displayValue||'');
  const player=String(p.participants?.[0]?.athlete?.id||m[1].trim());
  const valid=m[2].toLowerCase()==='misses'&&Number.isInteger(period)&&periods.includes(period)&&String(p.team?.id)===opponent&&!!clock&&n>=1&&n<=total&&[2,3].includes(total);
  if(!valid){previous=null;continue;}
  if(previous&&previous.player===player&&previous.period===period&&previous.clock===clock&&previous.total===total&&previous.n+1===n){
   pairs.push({player:m[1].trim(),period,clock,playIds:[previous.id,id]});
   previous=null; // A third miss cannot reuse the second miss for another tier.
  }else previous={player,name:m[1].trim(),period,clock,n,total,id};
 }
 return pairs;
}
export function triggers(plays:any[],opponent:string){return qualifyingPairs(plays,opponent).length;}
export function day(date:Date){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
