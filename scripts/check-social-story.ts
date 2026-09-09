/** Run with bun scripts/check-social-story.ts; no browser, network or writes. */
import assert from 'node:assert/strict';
import { socialStoryDefaultProps, validSocialStory } from '../remotion/compositions/nickai-social-story/props';
import { POST as exportVideo } from '../app/api/motion/export/route';
import { POST as exportStill } from '../app/api/motion/still/route';

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
