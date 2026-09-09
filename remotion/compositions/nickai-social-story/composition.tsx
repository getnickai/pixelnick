import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';

import type { SocialStoryProps } from './props';

const BLUE = '#0178FF';
const INK = '#101318';
const PAPER = '#F3F1E9';
const LIME = '#D9FE74';
const FPS = 30;
const DURATION = 660;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = (f: number, start: number, length = 22) => {
  const p = interpolate(f, [start, start + length], [0, 1], clamp);
  return 1 - Math.pow(1 - p, 3);
};
const pop = (f: number, start = 0) => spring({ frame: f - start, fps: FPS, config: { damping: 18, stiffness: 150, mass: 0.9 } });
const mono: React.CSSProperties = { fontFamily: 'Menlo, monospace', fontSize: 21, letterSpacing: 1 };

function Mark({ size = 46, white = false }: { size?: number; white?: boolean }) {
  return <Img src={staticFile('nick/nick-mark.svg')} style={{ width: size, height: size, filter: white ? 'brightness(0) invert(1)' : undefined }} />;
}

function Header({ dark = false, index, title }: { dark?: boolean; index: string; title: string }) {
  return <div style={{ position: 'absolute', left: 64, right: 64, top: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: dark ? PAPER : INK, zIndex: 20 }}>
    <Img src={staticFile(`swarm-arena-cards/assets/NickAI-wordmark-${dark ? 'white' : 'dark'}.svg`)} style={{ width: 178, height: 46, objectFit: 'contain' }} />
    <div style={{ ...mono, display: 'flex', alignItems: 'center', gap: 18 }}><span style={{ opacity: .65 }}>{title}</span><span style={{ width: 42, height: 42, borderRadius: 50, border: '1px solid currentColor', display: 'grid', placeItems: 'center', fontSize: 18 }}>{index}</span></div>
  </div>;
}

function Label({ children, color = INK }: { children: React.ReactNode; color?: string }) {
  return <div style={{ ...mono, color, fontSize: 21, lineHeight: 1.5 }}>{children}</div>;
}

function Arrow({ color = INK, size = 52 }: { color?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none"><path d="M12 32h38M34 15l17 17-17 17" stroke={color} strokeWidth="4" /></svg>;
}

function Intro({ story }: { story: SocialStoryProps }) {
  const f = useCurrentFrame();
  const rush = ease(f, 100, 20);
  return <AbsoluteFill style={{ backgroundColor: PAPER, overflow: 'hidden' }}>
    <Header index="01" title={story.category} />
    <div style={{ position: 'absolute', top: 178, left: 64, right: 50, zIndex: 5, transform: `translateY(${-rush * 450}px)`, opacity: 1 - rush }}>
      {story.hook.map((line, i) => <div key={line} style={{ overflow: 'hidden', height: 125 }}><div style={{ fontSize: Math.min(106, 1850 / line.length), fontWeight: 700, lineHeight: 1, letterSpacing: -4, transform: `translateY(${(1 - ease(f, i * 6 - 20, 18)) * 150}px)` }}>{line}</div></div>)}
      <div style={{ marginTop: 26, display: 'flex', gap: 15, alignItems: 'center', transform: `translateY(${(1 - ease(f, 16)) * 30}px)`, opacity: ease(f, 16) }}><div style={{ width: 12, height: 12, background: BLUE, borderRadius: 12 }} /><Label>FOLLOW THE QUESTION</Label></div>
    </div>
    <div style={{ position: 'absolute', left: 540, top: 920, transform: `scale(${1 + rush * 9})`, zIndex: 1 }}>
      {Array.from({ length: 15 }, (_, i) => {
        const travel = (i / 15 + f / 490) % 1;
        const s = .18 + travel * 2.1;
        return <div key={i} style={{ position: 'absolute', left: -310, top: -295, width: 620, height: 590, border: `${2 + travel * 3}px solid ${i % 3 ? BLUE : INK}`, borderRadius: 150, transform: `rotate(${-24 + i * 9 + f * .25}deg) scale(${s})`, opacity: .12 + travel * .38 }} />;
      })}
      <div style={{ position: 'absolute', width: 380, height: 380, left: -190, top: -190, borderRadius: '50%', background: BLUE, boxShadow: `0 0 0 32px ${PAPER}, 0 0 0 34px ${BLUE}`, display: 'grid', placeItems: 'center', transform: `rotate(${-10 + f * .15}deg)` }}><Mark size={174} white /></div>
    </div>
    <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 620, background: `linear-gradient(${PAPER} 0%, ${PAPER} 79%, transparent 100%)`, zIndex: 2 }} />
    {[
      { text: story.questions[0], tag: 'THE QUESTION', x: 35, y: 633, r: -9, delay: 12, color: INK, fg: PAPER },
      { text: story.questions[1], tag: 'THE DETAIL', x: 667, y: 861, r: 9, delay: 24, color: LIME, fg: INK },
      { text: story.questions[2], tag: 'THE CONTEXT', x: 55, y: 1125, r: -5, delay: 36, color: PAPER, fg: INK },
    ].map((c, i) => <div key={c.tag} style={{ position: 'absolute', left: c.x, top: c.y, width: i === 1 ? 350 : 450, zIndex: 3, padding: '28px 30px 30px', borderRadius: 15, background: c.color, color: c.fg, border: `2px solid ${INK}`, boxShadow: '0 18px 45px #10131818', transform: `translate(${rush * (540 - c.x)}px, ${(1 - pop(f, c.delay)) * 170 + Math.sin(f / 21 + i) * 9 + rush * (870 - c.y)}px) rotate(${c.r - rush * c.r}deg) scale(${1 - rush * .95})`, opacity: ease(f, c.delay) * (1 - rush) }}><div style={{ ...mono, fontSize: 17, marginBottom: 19, opacity: .65 }}>{c.tag}</div><div style={{ fontSize: i === 1 ? 32 : 38, fontWeight: 600, letterSpacing: -1 }}>{c.text}</div></div>)}
  </AbsoluteFill>;
}

function Example({ story }: { story: SocialStoryProps }) {
  const f = useCurrentFrame();
  const exit = ease(f, 114, 20);
  return <AbsoluteFill style={{ background: INK, color: PAPER, overflow: 'hidden' }}>
    <Header dark index="02" title="FOLLOW THE CONTEXT" />
    <div style={{ position: 'absolute', left: 64, right: 64, top: 175, opacity: 1 - exit }}>
      <Label color={LIME}>A WORKED EXAMPLE</Label>
      <div style={{ fontSize: 86, fontWeight: 700, lineHeight: 1.03, letterSpacing: -3, marginTop: 28, minHeight: 200 }}>{story.example.title}</div>
      {story.example.items.map((item, i) => <div key={i} style={{ display: 'flex', gap: 32, padding: '30px 0', borderTop: '1px solid #FFFFFF30', opacity: ease(f, 12 + i * 18), transform: `translateX(${(1 - ease(f, 12 + i * 18)) * 130}px)` }}>
        <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: -6, color: LIME, minWidth: 100, lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 37, fontWeight: 600 }}>{item.label}</div><div style={{ color: '#B7BBC2', fontSize: 31, lineHeight: 1.25, marginTop: 12 }}>{item.detail}</div></div>
      </div>)}
    </div>
    <div style={{ position: 'absolute', left: 64, right: 64, bottom: 90, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: ease(f, 66) }}><span style={{ fontSize: 43, fontWeight: 600 }}>Bring the pieces together.</span><Arrow color={LIME} /></div>
    <div style={{ position: 'absolute', inset: 0, background: BLUE, clipPath: `circle(${exit * 155}% at 100% 100%)` }} />
  </AbsoluteFill>;
}

function Research({ story }: { story: SocialStoryProps }) {
  const f = useCurrentFrame();
  const cards = [
    { x: 66, y: 537, r: -7, name: story.workflow.steps[0].label, detail: story.workflow.steps[0].detail, step: 10, icon: '01' },
    { x: 548, y: 533, r: 6, name: story.workflow.steps[1].label, detail: story.workflow.steps[1].detail, step: 23, icon: '02' },
    { x: 166, y: 1040, r: -4, name: story.workflow.steps[2].label, detail: story.workflow.steps[2].detail, step: 37, icon: '03' },
  ];
  const gather = ease(f, 78, 33);
  return <AbsoluteFill style={{ background: BLUE, color: PAPER, overflow: 'hidden' }}>
    <Header dark index="03" title="YOUR WORKFLOW" />
    <div style={{ position: 'absolute', left: 64, top: 180, zIndex: 8, fontSize: Math.min(105, 1850 / Math.max(...story.workflow.title.map(s => s.length))), fontWeight: 700, lineHeight: .97, letterSpacing: -3, transform: `translateY(${(1 - ease(f, 0)) * 60}px)` }}>{story.workflow.title[0]}<br /><span style={{ color: LIME }}>{story.workflow.title[1]}</span></div>
    <svg width="1080" height="1350" style={{ position: 'absolute', inset: 0 }}>
      <circle cx="550" cy="879" r={190 + Math.sin(f / 12) * 8} stroke="#FFFFFF20" strokeWidth="1" fill="none" />
      <circle cx="550" cy="879" r={295 + Math.sin(f / 17) * 12} stroke="#FFFFFF15" strokeWidth="1" fill="none" />
      {[0, 1, 2].map(i => <path key={i} d={['M270 655 Q250 879 550 879','M715 680 Q780 879 550 879','M405 1120 Q550 1120 550 879'][i]} fill="none" stroke={LIME} strokeWidth="3" strokeDasharray="8 12" strokeDashoffset={-f * 3} opacity={ease(f, 40) * (1 - gather)} />)}
    </svg>
    <div style={{ position: 'absolute', left: 431, top: 760, width: 238, height: 238, background: PAPER, borderRadius: 62, boxShadow: '0 20px 90px #00337155', display: 'grid', placeItems: 'center', transform: `rotate(${-5 + Math.sin(f / 24) * 3}deg) scale(${.7 + .3 * pop(f, 0) + gather * .3})`, zIndex: 7 }}><Mark size={143} /></div>
    {cards.map(c => <div key={c.name} style={{ position: 'absolute', left: c.x, top: c.y, width: c.icon === '03' ? 615 : 454, borderRadius: 15, background: c.icon === '03' ? LIME : PAPER, color: INK, padding: '24px 27px 28px', transform: `translate(${gather * (550 - c.x - 225)}px, ${(1 - pop(f, c.step)) * 100 + gather * (790 - c.y)}px) rotate(${c.r * (1 - gather)}deg) scale(${1 - gather * .85})`, opacity: ease(f, c.step) * (1 - gather), zIndex: 5 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 }}><span style={{ ...mono, fontSize: 18 }}>{c.icon}</span><Arrow size={31} /></div><div style={{ fontSize: 36, fontWeight: 600, letterSpacing: -1.2 }}>{c.name}</div><div style={{ fontSize: 24, lineHeight: 1.2, marginTop: 10, opacity: .65 }}>{c.detail}</div></div>)}
    <div style={{ position: 'absolute', left: 64, right: 64, bottom: 55, ...mono, fontSize: 18, opacity: .8 }}>WORKFLOW ILLUSTRATION</div>
    <div style={{ position: 'absolute', inset: 0, background: PAPER, clipPath: `circle(${ease(f, 108, 12) * 160}% at 50% 63%)`, zIndex: 10 }} />
  </AbsoluteFill>;
}

function Brief({ story }: { story: SocialStoryProps }) {
  const f = useCurrentFrame();
  const fold = ease(f, 131, 19);
  const reveal = (start: number): React.CSSProperties => ({ opacity: ease(f, start, 17), transform: `translateY(${(1 - ease(f, start, 17)) * 32}px)` });
  return <AbsoluteFill style={{ background: PAPER, color: INK, overflow: 'hidden' }}>
    <Header index="04" title="THE RESULT" />
    <div style={{ position: 'absolute', left: 64, right: 64, top: 170, fontSize: Math.min(100, 1850 / Math.max(...story.result.title.map(s => s.length))), lineHeight: 1.03, fontWeight: 700, letterSpacing: -3, ...reveal(0) }}>{story.result.title[0]}<br /><span style={{ color: BLUE }}>{story.result.title[1]}</span></div>
    <div style={{ position: 'absolute', left: 64, top: 443, width: 952, background: '#FFF', border: '1px solid #DCDDD9', borderRadius: 27, boxShadow: '0 30px 80px #24271818', transformOrigin: '50% 50%', transform: `perspective(1600px) translateY(${(1 - pop(f, 3)) * 120 - fold * 130}px) rotateX(${fold * 65}deg) rotateZ(${-3 + ease(f, 3, 25) * 3 + fold * 14}deg) scale(${1 - fold * .35})`, opacity: 1 - fold }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 17, padding: '24px 30px', background: '#E9F2FF', borderRadius: '27px 27px 0 0' }}><Mark size={44} /><div style={{ fontSize: 32, fontWeight: 600 }}>{story.result.label}</div></div>
      <div style={{ padding: '10px 32px 30px' }}>
        {story.result.rows.map((row, i) => <div key={i} style={{ padding: '29px 0', borderBottom: i < 2 ? '1px solid #E1E4E7' : undefined, ...reveal(18 + i * 23) }}>
          <div style={{ ...mono, fontSize: 20, color: BLUE, marginBottom: 13 }}>{row.label}</div>
          <div style={{ fontSize: 35, lineHeight: 1.23, letterSpacing: -.6 }}>{row.detail}</div>
        </div>)}
        <div style={{ fontSize: 22, color: '#626974', ...reveal(85) }}>Illustrative output</div>
      </div>
    </div>
    <div style={{ position: 'absolute', left: 64, bottom: 47, fontSize: 21, color: '#717780' }}>Workflow illustration · Not a product screen recording</div>
    <div style={{ position: 'absolute', inset: 0, background: LIME, clipPath: `inset(${(1 - fold) * 100}% 0 0 0)`, zIndex: 10 }} />
  </AbsoluteFill>;
}

function Outro({ story }: { story: SocialStoryProps }) {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: LIME, color: INK, overflow: 'hidden' }}>
    <Header index="05" title="BUILD YOUR WORKFLOW" />
    <div style={{ position: 'absolute', right: -105, top: 148, width: 630, height: 630, border: `2px solid ${INK}22`, borderRadius: '50%', transform: `rotate(${f * .5}deg)` }}>
      {Array.from({ length: 24 }, (_, i) => <div key={i} style={{ position: 'absolute', left: 300, top: -8, width: 2, height: 16, background: INK, transformOrigin: '1px 324px', transform: `rotate(${i * 15}deg)` }} />)}
    </div>
    <div style={{ position: 'absolute', left: 64, top: 240 }}>
      {story.payoff.map((text, i) => <div key={text} style={{ height: 129, overflow: 'hidden' }}><div style={{ fontSize: Math.min(121, 1850 / text.length), fontWeight: 700, lineHeight: 1.03, letterSpacing: -4, transform: `translateY(${(1 - ease(f, i * 6, 20)) * 145}px)` }}>{text}</div></div>)}
      <div style={{ marginTop: 31, background: INK, color: LIME, padding: '18px 28px 28px', fontSize: Math.min(108, 1650 / story.stamp.length), fontWeight: 700, lineHeight: 1, letterSpacing: -4, transformOrigin: '0 50%', transform: `rotate(${-3 * pop(f, 17)}deg) scale(${.83 + .17 * pop(f, 17)})`, opacity: ease(f, 17) }}>{story.stamp}</div>
    </div>
    <div style={{ position: 'absolute', left: 64, right: 64, top: 808, background: PAPER, padding: '28px 32px', border: `2px solid ${INK}`, borderRadius: 17, transform: `translateY(${(1 - pop(f, 32)) * 90}px)`, opacity: ease(f, 32) }}>
      <div style={{ ...mono, fontSize: 17, color: '#657063', marginBottom: 14 }}>YOUR PROMPT TO NICK</div>
      <div style={{ fontSize: 34, lineHeight: 1.23, letterSpacing: -.8, paddingRight: 48 }}>“{story.prompt}”</div>
      <div style={{ position: 'absolute', right: 27, bottom: 23, background: BLUE, borderRadius: '50%', width: 50, height: 50, display: 'grid', placeItems: 'center' }}><Arrow size={30} color={PAPER} /></div>
    </div>
    <div style={{ position: 'absolute', left: 64, right: 64, bottom: 85, opacity: ease(f, 49), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div><div style={{ fontSize: 29, marginBottom: 5 }}>Try it for free now:</div><div style={{ fontSize: 67, lineHeight: 1, letterSpacing: -3, fontWeight: 700 }}>getnick.ai</div></div><Arrow size={76} /></div>
  </AbsoluteFill>;
}

export function SocialStoryComposition(story: SocialStoryProps) {
  const [fontHandle] = useState(() => delayRender('Load Nick brand typography'));
  const f = useCurrentFrame();
  useEffect(() => {
    Promise.all([document.fonts.load('700 100px Duplet'), document.fonts.load('600 100px Duplet'), document.fonts.load('400 32px Duplet')]).then(() => continueRender(fontHandle)).catch(cancelRender);
  }, [fontHandle]);
  return <AbsoluteFill style={{ fontFamily: 'Duplet, sans-serif', background: PAPER, color: INK }}>
    <style>{`@font-face{font-family:Duplet;src:url('${staticFile('fonts/Duplet-Regular.woff')}');font-weight:400}@font-face{font-family:Duplet;src:url('${staticFile('fonts/Duplet-Semibold.woff')}');font-weight:600}@font-face{font-family:Duplet;src:url('${staticFile('fonts/Duplet-Bold.woff')}');font-weight:700}*{box-sizing:border-box}`}</style>
    <Sequence from={0} durationInFrames={120}><Intro story={story} /></Sequence>
    <Sequence from={120} durationInFrames={135}><Example story={story} /></Sequence>
    <Sequence from={255} durationInFrames={120}><Research story={story} /></Sequence>
    <Sequence from={375} durationInFrames={150}><Brief story={story} /></Sequence>
    <Sequence from={525} durationInFrames={135}><Outro story={story} /></Sequence>
    <Audio src={staticFile('audio/social-story.m4a')} volume={.7} />
    <div style={{ position: 'absolute', left: 0, bottom: 0, height: 5, width: `${100 * f / (DURATION - 1)}%`, background: f >= 525 ? INK : BLUE, zIndex: 99 }} />
  </AbsoluteFill>;
}

