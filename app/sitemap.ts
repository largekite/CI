export default async function sitemap() {
  const base = 'https://www.largekitecapital.com';
  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/services`, lastModified: new Date() },
    { url: `${base}/insights`, lastModified: new Date() },
    { url: `${base}/market-sentiment`, lastModified: new Date() },
    { url: `${base}/contact`, lastModified: new Date() },
    { url: `${base}/legal`, lastModified: new Date() },
  ];
}
