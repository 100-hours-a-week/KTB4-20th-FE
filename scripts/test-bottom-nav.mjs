import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import react from '@vitejs/plugin-react';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
});

try {
  const { default: BottomNav } = await server.ssrLoadModule(
    '/src/components/BottomNav/BottomNav.tsx',
  );
  const markup = renderToStaticMarkup(
    React.createElement(MemoryRouter, null, React.createElement(BottomNav)),
  );

  const links = [...markup.matchAll(/<a\b/g)];

  assert.equal(links.length, 3, '하단 내비게이션은 3개 링크만 렌더링해야 합니다.');
  assert.match(markup, /href="\/"/, '메인 링크가 있어야 합니다.');
  assert.match(markup, /href="\/photo-missions"/, '포토미션 링크가 있어야 합니다.');
  assert.match(markup, /href="\/open-chat"/, '오픈 채팅 링크가 있어야 합니다.');
  assert.doesNotMatch(markup, /href="\/community"/, '커뮤니티 링크는 없어야 합니다.');
  assert.doesNotMatch(markup, /커뮤니티/, '커뮤니티 레이블은 없어야 합니다.');

  console.log('BottomNav renders only the three intended links.');
} finally {
  await server.close();
}
