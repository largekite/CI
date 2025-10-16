import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), 'content/insights');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f=>f.endsWith('.mdx')).map(f=>({ slug: f.replace(/\.mdx$/,'') }));
}

export default function Post({ params }: { params: { slug:string }}) {
  const file = path.join(process.cwd(), 'content/insights', `${params.slug}.mdx`);
  const raw = fs.readFileSync(file, 'utf8');
  const { content, data } = matter(raw);
  return (
    <main className="section">
      <div className="eyebrow">Insights</div>
      <h1 className="h2">{data.title}</h1>
      <div className="tiny">{data.date}</div>
      <article className="content">
        <MDXRemote source={content} />
      </article>
    </main>
  );
}
