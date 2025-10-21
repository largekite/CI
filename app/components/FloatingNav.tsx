'use client';
export default function FloatingNav(){ const top=()=>{try{window.scrollTo({top:0,behavior:'smooth'})}catch{window.scrollTo(0,0)}}; return (<div className="floating-nav"><button className="fab" onClick={top} aria-label="Back to top">↑</button><a className="fab" href="/" aria-label="Back to main page">⌂</a></div>); }
