const withMDX = require('@next/mdx')();
/** @type {import('next').NextConfig} */
module.exports = withMDX({
  pageExtensions: ['tsx', 'ts', 'mdx'],
  experimental: { typedRoutes: true },
});
