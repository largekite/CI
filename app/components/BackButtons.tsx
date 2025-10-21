'use client';
export default function BackButtons(){ const top=()=>{try{window.scrollTo({top:0,behavior:'smooth'})}catch{window.scrollTo(0,0)}}; return (<div style={{display:'flex',gap:12,flexWrap:'wrap'}}><button className="btn" onClick={top}>Back to top ↑</button><a className="btn ghost" href="/">Back to main page</a></div>); }
