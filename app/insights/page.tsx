
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export const metadata = { title: 'Insights — LargeKiteCapitalIntelligence' };

function safeStringDate(d: any): string {
  try {
    if (!d) return '';
    if (typeof d === 'string') return d;
    const dt = new Date(d);
    if (String(dt) !== 'Invalid Date') return dt.toISOString().slice(0, 10);
    return String(d);
  } catch {
    return '';
  }
}

function getPosts(){
  const dir = path.join(process.cwd(), 'content/insights');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => {
      const slug = f.replace(/\.mdx$/, '');
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      const { data } = matter(raw);
      const title = String(data?.title || slug);
      const date = safeStringDate(data?.date);
      const summary = String(data?.summary || '');
      return { slug, title, date, summary };
    })
    .sort((a,b)=> (a.date < b.date ? 1 : -1));
}

export default function Insights(){
  const posts = getPosts();
  return (
    <main className="section">
      <div className="eyebrow">Clarity, not hype</div>
      <h1 className="h2">Insights</h1>
      <div className="cards" style={{marginTop:16}}>
        {posts.map(p => (
          <a key={p.slug} className="card" href={`/insights/${p.slug}`}>
            <h3>{p.title}</h3>
            {p.date && <div className="tiny">{p.date}</div>}
            <p className="content">{p.summary}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
