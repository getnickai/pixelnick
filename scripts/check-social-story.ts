/** Run with bun scripts/check-social-story.ts; no browser, network or writes. */
import assert from 'node:assert/strict';
import { socialStoryDefaultProps, validSocialStory } from '../remotion/compositions/nickai-social-story/props';
import { POST as exportVideo } from '../app/api/motion/export/route';
import { POST as exportStill } from '../app/api/motion/still/route';
import { deskSources, tradingDeskDefaultProps, validTradingDesk } from '../remotion/compositions/nickai-trading-desk/props';
import { screenMatrix } from '../remotion/compositions/nickai-trading-desk/screen-map';

assert(validSocialStory(socialStoryDefaultProps));
const invalid = [undefined, null, {}, { headline: 'A title is not a story' },
  { ...socialStoryDefaultProps, version: 2 },
  { ...socialStoryDefaultProps, hook: ['x'.repeat(23), 'Too long'] },
  { ...socialStoryDefaultProps, questions: ['Only one?'] },
  { ...socialStoryDefaultProps, prompt: '<script>alert(1)</script>' },
];
for (const inputProps of invalid) {
  assert(!validSocialStory(inputProps));
  for (const handler of [exportVideo, exportStill]) {
    const response = await handler(new Request('http://localhost/api/motion/export', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-render-key': process.env.MOTION_RENDER_KEY ?? '' },
      body: JSON.stringify({ id: 'nickai-social-story', inputProps }),
    }));
    assert.equal(response.status, 400);
  }
}
console.log('Social story contract and both render boundaries pass.');

assert(validTradingDesk(tradingDeskDefaultProps));
assert.deepEqual(deskSources(tradingDeskDefaultProps), ['Polymarket', 'Kalshi']);
const deskWithoutModels = { ...tradingDeskDefaultProps, comparison: null, venues: ['Hyperliquid', 'OKX'], review: { ...tradingDeskDefaultProps.review, models: null }, result: { ...tradingDeskDefaultProps.result, delivery: 'workspace' } };
assert(validTradingDesk(deskWithoutModels));
if (validTradingDesk(deskWithoutModels)) assert.deepEqual(deskSources(deskWithoutModels), ['Hyperliquid', 'OKX']);
for (const inputProps of [undefined, {}, socialStoryDefaultProps,
  { ...tradingDeskDefaultProps, comparison: undefined },
  { ...tradingDeskDefaultProps, hook: 'x'.repeat(57) },
  { ...tradingDeskDefaultProps, venues: ['Polymarket', 'Polymarket'] },
  { ...tradingDeskDefaultProps, venues: ['Unknown exchange'] },
  { ...tradingDeskDefaultProps, venues: ['Coinbase'] },
  { ...tradingDeskDefaultProps, comparison: { ...tradingDeskDefaultProps.comparison, yes: { venue: 'Polymarket', ask_cents: 100 } } },
  { ...tradingDeskDefaultProps, comparison: { ...tradingDeskDefaultProps.comparison, no: { venue: 'Polymarket', ask_cents: 40 } } },
  { ...tradingDeskDefaultProps, review: { ...tradingDeskDefaultProps.review, models: undefined } },
  { ...tradingDeskDefaultProps, review: { ...tradingDeskDefaultProps.review, models: Array(3).fill(tradingDeskDefaultProps.review.models![0]) } },
  { ...tradingDeskDefaultProps, prompt: '<script>alert(1)</script>' },
  { ...tradingDeskDefaultProps, result: { ...tradingDeskDefaultProps.result, delivery: 'https://outside.example' } },
]) {
  assert(!validTradingDesk(inputProps));
  for (const handler of [exportVideo, exportStill]) {
    const response = await handler(new Request('http://localhost/api/motion/export', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-render-key': process.env.MOTION_RENDER_KEY ?? '' },
      body: JSON.stringify({ id: 'nickai-trading-desk', inputProps }),
    }));
    assert.equal(response.status, 400);
  }
}
for (const quad of [[[227,593],[833,660],[852,1147],[228,1207]],[[386,1210],[631,1170],[725,1434],[463,1510]],[[0,0],[600,0],[600,400],[0,400]]]) {
  const matrix = screenMatrix(1600, 1400, quad);
  [[0,0],[1600,0],[1600,1400],[0,1400]].forEach(([x,y], i) => {
    const d = matrix[3]*x + matrix[7]*y + 1;
    assert(Math.abs((matrix[0]*x+matrix[4]*y+matrix[12])/d - quad[i][0]) < 1e-6);
    assert(Math.abs((matrix[1]*x+matrix[5]*y+matrix[13])/d - quad[i][1]) < 1e-6);
  });
}
assert.throws(() => screenMatrix(0, 100, [[0,0],[1,0],[1,1],[0,1]]));
assert.throws(() => screenMatrix(100, 100, [[0,0],[0,0],[0,0],[0,0]]));
assert.throws(() => screenMatrix(100, 100, [[0],[1,0],[1,1],[0,1]]));
console.log('Trading desk contract, source routing, render boundaries and perspective mapping pass.');
