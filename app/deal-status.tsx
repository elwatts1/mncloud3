'use client';
import {useEffect,useState} from 'react';
type Result={status:string;message:string};
export default function DealStatus({id,initial}:{id:string;initial:Result}){
 const [data,setData]=useState(initial);
 useEffect(()=>{let cancelled=false;async function refresh(){try{const r=await fetch('/api/deals');if(!r.ok)throw Error();const result=await r.json() as {deals?:Array<Result&{id:string}>};const deal=result.deals?.find((d:any)=>d.id===id);if(deal&&!cancelled)setData(deal);}catch{if(!cancelled)setData({status:'NOT ACTIVE',message:'Game data is unavailable. Checking again soon.'});}}refresh();const timer=setInterval(refresh,60000);return()=>{cancelled=true;clearInterval(timer);};},[id]);
 const active=data.status==='ACTIVE',tomorrow=data.status==='ACTIVE TOMORROW',soon=data.status==='COMING SOON';
 return <section className="guide-status" aria-label="Today’s deal status" aria-live="polite"><span className={'scan-status '+(active?'scan-active':tomorrow||soon?'scan-uncertain':'scan-inactive')}>{active?'Active':tomorrow?'Active tomorrow':soon?'Coming soon':'Not active'}</span><p className={active||tomorrow?'status-celebration':''}>{data.message}</p></section>;
}
