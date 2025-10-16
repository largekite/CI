export const Y_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
export async function fetchYahoo(symbol, range='1y', interval='1d'){
  const url = `${Y_BASE}${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('Yahoo fetch failed: ' + res.status);
  const j = await res.json();
  const r = j?.chart?.result?.[0];
  const closes = r?.indicators?.quote?.[0]?.close || [];
  const t = (r?.timestamp || []).map(x=> x*1000);
  return { closes, t };
}
export function smaArr(series, window){ const out=new Array(series.length).fill(null); let sum=0, cnt=0; for(let i=0;i<series.length;i++){ const v=series[i]; if(isFinite(v)){sum+=v;cnt++;} if(i>=window){ const old=series[i-window]; if(isFinite(old)){sum-=old;cnt--;}} if(i>=window-1 && cnt===window) out[i]=sum/window;} return out;}
export function pct(a,b){ if(!a||!b||!isFinite(a)||!isFinite(b)||b===0) return 0; return (a/b-1)*100; }
export function summarize(closes, periods=20){ const n=closes.length; const last=closes[n-1]; const p20=n>periods?closes[n-1-periods]:closes[0]; const p5=n>5?closes[n-1-5]:closes[0]; const p60=n>60?closes[n-1-60]:closes[0]; const ma50=smaArr(closes,50); const ma200=smaArr(closes,200); const lastMa50=ma50[ma50.length-1]; const lastMa200=ma200[ma200.length-1]; return { last, chg5d:pct(last,p5), chg20d:pct(last,p20), chg60d:pct(last,p60), ma50:lastMa50, ma200:lastMa200, ma50Arr:ma50, ma200Arr:ma200 }; }
export function computeCrossovers(t, a, b){ const ev=[]; let prev=null; for(let i=0;i<t.length;i++){ const x=a[i], y=b[i]; if(x==null||y==null) continue; const d=x-y; if(prev!=null){ if(prev<=0 && d>0) ev.push({t:t[i], type:'bull'}); else if(prev>=0 && d<0) ev.push({t:t[i], type:'bear'});} prev=d;} return ev; }
export function computeHeat(spx, vix){ let heat=50; heat += (spx.chg20d||0)*2; heat -= Math.max(0,(vix.last||0)-18)*1.5; heat=Math.max(0,Math.min(100,heat)); let label='Neutral'; if(heat>=60) label='Hot'; else if(heat<=40) label='Cool'; const trendUp=!!(spx.ma50!=null&&spx.ma200!=null&&spx.ma50>spx.ma200); const trendDown=!!(spx.ma50!=null&&spx.ma200!=null&&spx.ma50<spx.ma200); if(label==='Hot' && !trendUp){ label='Neutral'; heat=Math.min(59,heat);} return { heat:Math.round(heat), label, trendUp, trendDown }; }
export async function getSentimentFull(){ const [spxRaw,vixRaw]=await Promise.all([fetchYahoo('^GSPC','1y','1d'),fetchYahoo('^VIX','1y','1d')]); const spx=summarize(spxRaw.closes,20); const vix=summarize(vixRaw.closes,20); const status=computeHeat(spx,vix); const crossovers=computeCrossovers(spxRaw.t, spx.ma50Arr, spx.ma200Arr); return { ok:true, asOf: Date.now(), status, spx, vix, spxSeries:{t:spxRaw.t, close:spxRaw.closes, ma50:spx.ma50Arr, ma200:spx.ma200Arr}, vixSeries:{t:vixRaw.t, close:vixRaw.closes}, crossovers }; }
export async function getSentimentCompact(){ const f=await getSentimentFull(); return { asOf: f.asOf, label: f.status.label, heat: f.status.heat, trendUp: f.status.trendUp, spx:{last:f.spx.last, chg20d:f.spx.chg20d}, vix:{last:f.vix.last, chg20d:f.vix.chg20d} }; }
