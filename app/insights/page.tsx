import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  try {
    const dir = path.join(process.cwd(), 'content/insights');
    if (!fs.existsSync(dir)) return [];

    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.mdx')) // ✅ Fixed: endsWith (capital W)
      .map((f) => ({
        slug: f.replace(/\.mdx$/, ''),
      }));
  } catch {
    return [];
  }
}

export default function Post({ params }: { params: { slug: string } }) {
  try {
    const file = path.join(
      process.cwd(),
      'content/insights',
      `${params.slug}.mdx`
    );

    if (!fs.existsSync(file)) return notFound();

    const raw = fs.readFileSync(file, 'utf8');
    const { content, data } = matter(raw);

    const title = String(data?.title || params.slug);
    const date = data?.date ? String(data.date) : '';

    return (
      <main className="section">
        <div className="eyebrow">Insights</div>
        <h1 className="h2">{title}</h1>
        {date && <div className="tiny">{date}</div>}
        <article className="content">
          <MDXRemote source={content} />
        </article>
      </main>
    );
  } catch {
    return notFound();
  }
}
