
'use client';
import { useEffect, useState } from 'react';

export type Compact = {
  asOf: number;
  label: 'Hot'|'Neutral'|'Cool'|string;
  heat: number;
  trendUp?: boolean;
  spx: { last:number; chg20d:number };
  vix: { last:number; chg20d:number };
};

function cls(label:string) {
  const l = (label||'').toLowerCase();
  if (l==='hot') return 'pill hot';
  if (l==='cool') return 'pill cool';
  return 'pill neutral';
}

export default function SentimentPillClient({ initial }: { initial: Compact | null }) {
  const [data, setData] = useState<Compact | null>(initial);
  const [err, setErr] = useState<string>('');

  useEffect(()=>{
    fetch('/api/sentiment?format=compact', { next: { revalidate: 1800 }} as any)
      .then(r=>r.json())
      .then(setData)
      .catch(e=>setErr(String(e)));
  },[]);

  const label = data?.label || 'Neutral';
  const heat = data?.heat ?? 50;
  const trendUp = !!data?.trendUp;

  return (
    <a href="/market-sentiment" className={cls(label)} title={`Heat ${heat}/100 • TrendUp ${trendUp?'yes':'no'}`}>
      Market: {label}
    </a>
  );
}
