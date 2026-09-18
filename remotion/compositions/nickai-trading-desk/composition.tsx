import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Img, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ArrowUp, Check, ChevronDown, CircleDot, GitBranch, Link, MessageSquare, Play, Plus, Search, Send, Settings, SquareTerminal } from 'lucide-react';
import { WorkflowGraph, type RunStatus } from '../nick-launch-video/graph';
import type { TemplateGraph } from '../workflow-template-card/props';
import { screenMatrix } from './screen-map';
import { deskSources, type TradingDeskProps } from './props';

const BLUE = '#0178FF';
const INK = '#0b0e13';
const TEXT = '#e1e5ec';
const MUTED = '#717b8b';
const GREEN = '#51bd91';
const BORDER = '#242a34';
const W = 941;
const H = 1672;
const mono: React.CSSProperties = { fontFamily: 'Menlo, monospace', fontVariantNumeric: 'tabular-nums' };
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = (f: number, start = 0, duration = 25) => {
  const t = interpolate(f, [start, start + duration], [0, 1], clamp);
  return t * t * (3 - 2 * t);
};

function workflowGraph(story: TradingDeskProps) {
  const [input, check, output] = story.workflow.steps;
  const sources = deskSources(story);
  const reviews = story.review.models ?? [];
  const nodes = [
    { id: 'start', type: 'start', label: input.label, subtitle: input.detail, position: { x: 0, y: 400 }, at: 80 },
    ...sources.map((venue, i) => ({ id: `source${i}`, type: venue === 'Polymarket' ? 'polymarket' : 'price-data', label: venue, subtitle: input.label, position: { x: 650, y: i * 640 + 80 }, at: 145 })),
    ...reviews.map((model, i) => ({ id: `model${i}`, type: 'llm', label: model.name, subtitle: model.focus, position: { x: 1350, y: i * 400 }, at: 255 + i * 25 })),
    { id: 'review', type: 'function', label: check.label, subtitle: check.detail, position: { x: 2100, y: 400 }, at: 414 },
    { id: 'brief', type: story.result.delivery === 'telegram' ? 'telegram-notification' : 'function', label: output.label, subtitle: output.detail, position: { x: 2800, y: 400 }, at: 513 },
  ];
  const links = sources.flatMap((_, i) => [['start', `source${i}`], ...(reviews.length ? reviews.map((_, j) => [`source${i}`, `model${j}`]) : [[`source${i}`, 'review']])]);
  reviews.forEach((_, i) => links.push([`model${i}`, 'review']));
  links.push(['review', 'brief']);
  const edges = links.map(([source, target], i) => ({ id: `e${i}`, source, target }));
  const template: TemplateGraph = { slug: 'nick-desk-example', name: story.workflow.title, description: story.context.title, nickDescription: '', prompt: story.prompt, nodes, edges };
  return { nodes, edges, template };
}

function Mark({ size = 32 }: { size?: number }) {
  return <Img src={staticFile('nick/nick-mark.svg')} style={{ width: size, height: size }} />;
}

function Toolbar({ title, right = 'Sample data', size = 28 }: { title: string; right?: string; size?: number }) {
  return <div style={{ height: 90, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 18, padding: '0 26px', flexShrink: 0 }}><Mark size={38} /><span style={{ fontSize: size, fontWeight: 600 }}>{title}</span><span style={{ marginLeft: 'auto', fontSize: 19, color: MUTED }}>{right}</span><Settings size={21} color={MUTED} /></div>;
}

function Screen({ width, height, points, children, light = false }: { width: number; height: number; points: number[][]; children: React.ReactNode; light?: boolean }) {
  return <div style={{ position: 'absolute', top: 0, left: 0, width, height, overflow: 'hidden', transformOrigin: '0 0', transform: `matrix3d(${screenMatrix(width, height, points).join(',')})`, background: light ? '#eff1f4' : INK, color: TEXT }}>
    {children}
    <AbsoluteFill style={{ pointerEvents: 'none', background: '#00000029', zIndex: 98 }} />
    <AbsoluteFill style={{ pointerEvents: 'none', background: light ? 'linear-gradient(125deg,#fff2,transparent 65%,#0001)' : 'linear-gradient(128deg,#dad5c10b,transparent 28%,#1e355011 75%,#ffffff07)', zIndex: 99 }} />
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: light ? .015 : .04, background: 'repeating-linear-gradient(0deg,transparent 0 2px,#0007 2px 3px)', zIndex: 100 }} />
  </div>;
}

function Chart({ frame, width, height, base, phase = 0 }: { frame: number; width: number; height: number; base: number; phase?: number }) {
  const bars = 64;
  const reveal = Math.min(bars, 45 + Math.floor(frame / 21));
  const step = (width - 80) / bars;
  const wave = (i: number) => Math.sin(i * .14 + phase) * 5 + Math.sin(i * .49) * 2.4 + Math.cos(i * 1.73) * .8;
  const low = Math.max(1, base - 13), high = Math.min(99, base + 12);
  const value = (i: number) => Math.max(1, Math.min(99, base + wave(i) - wave(reveal)));
  const tick = (i: number) => Math.round(high - i * (high - low) / 5);
  const y = (v: number) => 36 + (high - v) / (high - low) * (height - 150);
  return <svg width={width} height={height} style={{ display: 'block' }}>
    {[0,1,2,3,4,5].map(i => <g key={i}><path d={`M0 ${y(tick(i))}H${width}`} stroke="#ffffff09" /><text x={width-47} y={y(tick(i))+5} fill={MUTED} fontSize="18" fontFamily="Menlo">{tick(i)}</text></g>)}
    {Array.from({ length: bars }, (_,i)=>{ const open=value(i), close=value(i+1)+(i===reveal-1?Math.sin(frame*.085)*.45:0), color=close>open?GREEN:'#c86f71', x=5+i*step; return i<reveal?<g key={i}>
      <path d={`M${x+step*.35} ${y(Math.max(open,close)+.6)}V${y(Math.min(open,close)-.7)}`} stroke={color} strokeWidth="1.7" />
      <rect x={x} y={Math.min(y(open),y(close))} width={step*.65} height={Math.max(2,Math.abs(y(close)-y(open)))} fill={color} />
      <rect x={x} y={height-32-((i*13)%28)} width={step*.65} height={20+((i*13)%28)} fill={color} opacity=".36" />
    </g>:null; })}
    <path d={`M0 ${y(value(reveal))}H${width-60}`} stroke={BLUE} strokeWidth="1" strokeDasharray="4 6" opacity=".7" />
    <text x="10" y={height-7} fill={MUTED} fontSize="17" fontFamily="Menlo">PRICE HISTORY</text>
  </svg>;
}

function MarketScreen({ frame, story }: { frame: number; story: TradingDeskProps }) {
  if (frame >= 90 && frame < 180) return <Connections frame={frame} story={story} primary />;
  const comparison = story.comparison;
  if (!comparison) return <AbsoluteFill style={{background:INK}}>
    <Toolbar title={story.category} right="Illustrative setup" />
    <div style={{padding:38,fontSize:51,fontWeight:600,lineHeight:1.15}}>{story.context.title}</div>
    {story.context.items.map((item,i)=><div key={i} style={{margin:'25px 38px',padding:36,border:`1px solid ${BORDER}`,borderRadius:15,background:'#101923',opacity:.45+.55*ease(frame,15+i*12,35)}}>
      <div style={{fontSize:36,fontWeight:600,color:'#8cbcff'}}>{item.label}</div><div style={{marginTop:20,fontSize:37,lineHeight:1.4,color:'#c7d2e2'}}>{item.detail}</div>
    </div>)}
    <div style={{padding:'30px 38px',fontSize:30,color:MUTED}}>{story.venues.join(' · ')}</div>
  </AbsoluteFill>;
  const quotes = [{...comparison.yes,side:'YES'},{...comparison.no,side:'NO'}];
  const tick = Math.floor(frame/22);
  const combined = comparison.yes.ask_cents + comparison.no.ask_cents;
  return <AbsoluteFill style={{background:INK}}>
    <Toolbar title={story.category} right="Illustrative quotes" />
    <div style={{display:'flex',alignItems:'center',gap:20,padding:'27px 29px',fontSize:26,color:'#a1abbb'}}><Search size={25}/><span>Prediction markets</span><ChevronDown size={24}/><span style={{marginLeft:'auto',color:BLUE}}>{quotes.map(q=>q.venue).join(' + ')}</span></div>
    <div style={{padding:'2px 28px 23px',fontSize:38,fontWeight:600}}>{comparison.title}</div>
    <div style={{display:'flex',borderTop:`1px solid ${BORDER}`,borderBottom:`1px solid ${BORDER}`}}>
      {quotes.map((q,i)=><div key={q.venue} style={{width:'50%',padding:25,borderRight:i?undefined:`1px solid ${BORDER}`}}>
        <div style={{fontSize:31,fontWeight:600}}>{q.venue}<span style={{float:'right',color:GREEN,fontSize:20}}>●</span></div>
        <div style={{display:'flex',alignItems:'baseline',gap:15,marginTop:18}}><span style={{color:MUTED,fontSize:23}}>{q.side} ask</span><span style={{fontSize:57,fontWeight:600}}>{q.ask_cents}¢</span></div>
        <Chart frame={frame} width={630} height={400} base={q.ask_cents} phase={i*2}/>
      </div>)}
    </div>
    <div style={{padding:'23px 27px',fontSize:25}}>Order books <span style={{color:MUTED,fontSize:20,marginLeft:17}}>Sample bid / ask · Size</span></div>
    <div style={{display:'flex',gap:28,padding:'0 28px'}}>{quotes.map((q,side)=><div key={q.venue} style={{flex:1,...mono}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',color:MUTED,fontSize:21,padding:'14px 8px'}}><span>Price</span><span>Size</span><span style={{textAlign:'right'}}>Total</span></div>
      {Array.from({length:9},(_,i)=>{ const size=120+((i*137+tick*41+side*71)%800);const cents=q.ask_cents+4-i;if(cents<1||cents>99)return null;const price=cents/100;return <div key={i} style={{position:'relative',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',padding:'12px 8px',fontSize:23,borderBottom:'1px solid #ffffff06'}}>
        <div style={{position:'absolute',right:0,top:2,bottom:2,width:`${size/10}%`,background:i<=4?'#cb6e7815':'#0178ff18'}}/><span style={{color:i<=4?'#c77b84':'#67a9ff',zIndex:1}}>{price.toFixed(2)}</span><span style={{zIndex:1}}>{size}</span><span style={{textAlign:'right',color:'#9da7b7',zIndex:1}}>{(size*price).toFixed(2)}</span>
      </div>;})}
    </div>)}</div>
    <div style={{margin:'26px 28px',padding:'23px 20px',background:'#111923',border:'1px solid #293647',fontSize:24,color:'#a9b7ca'}}>{combined}¢ combined ask · {combined<100?`${100-combined}¢ gross gap if settlement matches`:'No gross gap'} · Before fees</div>
  </AbsoluteFill>;
}

function ModelsScreen({ frame, story }: { frame: number; story: TradingDeskProps }) {
  const models = story.review.models ?? story.context.items.map(item => ({ name: item.label, focus: item.label, reply: item.detail }));
  return <AbsoluteFill style={{ background: INK }}><Toolbar title={story.review.models ? 'AI review' : 'Research notes'} right="Illustrative setup" size={31} />
    <div style={{ padding:'29px 28px', fontSize:25,color:'#a1abbb',borderBottom:`1px solid ${BORDER}` }}>{story.category} <ChevronDown size={22} style={{float:'right'}} /></div>
    <div style={{padding:29}}>
      <div style={{fontSize:Math.min(58,2600/story.review.title.length),lineHeight:1.05,fontWeight:700,marginBottom:17,whiteSpace:'pre-line'}}>{story.review.title}</div><div style={{fontSize:24,color:MUTED,marginBottom:30}}>{story.review.models ? 'Three models. Put the setup under pressure.' : story.context.title}</div>
      {models.map((model,i)=>{ const name=model.name;const start=225+i*22;const active=frame>=start;const done=frame>=start+77;const note=model.reply;return <div key={name} style={{padding:'27px 24px 30px',border:`1px solid ${active?'#2c5180':BORDER}`,borderRadius:15,background:active?'#101b2b':'#10141b',marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:15}}><div style={{width:42,height:42,flexShrink:0,borderRadius:11,background:['#173652','#242744','#392836'][i],display:'grid',placeItems:'center',fontSize:26,color:'#b4caff'}}>{name[0]}</div><span style={{fontSize:29,fontWeight:600}}>{name}</span><span style={{marginLeft:'auto',color:done?GREEN:active?'#70afff':MUTED,fontSize:21,flexShrink:0}}>{done?'Reviewed':active?'Reviewing':'Queued'}</span></div>
        <div style={{minHeight:142,marginTop:23,fontSize:32,lineHeight:1.35,color:'#c7d2e2'}}>{active?note.slice(0,Math.round(note.length*ease(frame,start+8,55))):'Reading the setup...'}</div>
        <div style={{height:4,marginTop:24,background:'#202b3b',borderRadius:8}}><div style={{height:4,width:`${100*ease(frame,start,77)}%`,background:done?GREEN:BLUE,borderRadius:8}} /></div>
      </div>;})}
      <div style={{padding:'25px 24px',background:'#111923',border:`1px solid ${BORDER}`,borderRadius:14,fontSize:29,lineHeight:1.3,color:'#aebdce'}}>{story.review.verdict}<br /><span style={{fontSize:22,color:MUTED}}>Your workflow. Your decision.</span></div>
    </div>
    <div style={{position:'absolute',bottom:30,left:29,right:29,borderTop:`1px solid ${BORDER}`,paddingTop:21,color:MUTED,fontSize:20}}>{story.review.models ? 'Illustrative setup · Scripted model replies' : 'Illustrative Nick workflow'}</div>
  </AbsoluteFill>;
}

const marketTypes: Record<string,string> = { Coinbase:'Spot',Hyperliquid:'Perpetuals',OKX:'Spot + derivatives',Polymarket:'Prediction markets',Kalshi:'Prediction markets',Alpaca:'US equities',Revolut:'Multiple assets','Trade[XYZ]':'Perpetuals' };
function Connections({ frame, story, compact=false, primary=false }: { frame:number; story:TradingDeskProps; compact?:boolean; primary?:boolean }) {
  const {nodes} = workflowGraph(story);
  return <AbsoluteFill style={{background:INK}}><Toolbar title={compact?'Activity':'Connections'} size={30} right="" />
    <div style={{padding:primary?38:28,fontSize:primary?46:31,fontWeight:600}}>Your connected exchanges</div>
    {story.venues.map((v,i)=>{ const active=frame>100+i*10;return <div key={v} style={{padding:primary?'32px 38px':'27px 25px',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',gap:19,background:active?'#0d1620':undefined}}>
      {v!=='Polymarket'?<Img src={staticFile(`brand/exchanges/${v==='Trade[XYZ]'?'tradexyz':v.toLowerCase()}.svg`)} style={{width:primary?110:95,height:36,objectFit:'contain',filter:'brightness(0) invert(1)'}}/>:<span style={{fontSize:23,fontWeight:600,width:primary?110:95}}>Poly</span>}
      <div style={{minWidth:0}}><div style={{fontSize:primary?37:27}}>{v}</div><div style={{fontSize:21,color:active?GREEN:MUTED,marginTop:8}}>{active?'Connected':'Connecting'}</div></div>
      {primary?<><span style={{fontSize:28,color:'#9aabc2',marginLeft:'auto'}}>{marketTypes[v]}</span><Check size={28} color={active?GREEN:MUTED}/></>:null}
    </div>;})}
    <div style={{padding:'33px 25px',fontSize:25,color:MUTED}}>Node activity</div>
    {nodes.slice(1).map(n=><div key={n.id} style={{padding:'17px 26px',display:'flex',gap:14,color:frame>n.at?TEXT:MUTED,fontSize:23}}><CircleDot size={21} color={frame>n.at+60?GREEN:BLUE}/><span>{n.label}<span style={{display:'block',fontSize:18,color:MUTED,marginTop:5}}>{frame>n.at+60?'Completed':frame>n.at?'Running':'Waiting'}</span></span></div>)}
  </AbsoluteFill>;
}

function Workspace({ frame, story }: { frame: number; story: TradingDeskProps }) {
  const {nodes,edges,template} = workflowGraph(story);
  const status: Record<string,RunStatus> = {};
  nodes.forEach(n=>{ if(frame>=n.at) status[n.id]=frame>=n.at+64?'completed':'running'; });
  const reveal = Object.fromEntries(nodes.map((n,i)=>[n.id,ease(frame,25+i*7,23)]));
  const edgeReveal=Object.fromEntries(edges.map((e,i)=>[e.id,ease(frame,42+i*6,25)]));
  const running=frame>=80;
  const done=frame>=580;
  const focus=ease(frame,390,128);
  return <AbsoluteFill style={{background:INK}}>
    <div style={{position:'absolute',left:0,top:0,bottom:0,width:244,borderRight:`1px solid ${BORDER}`,background:'#090c11'}}>
      <div style={{padding:'29px 28px 38px'}}><Img src={staticFile('swarm-arena-cards/assets/NickAI-wordmark-white.svg')} style={{width:165,height:47,objectFit:'contain'}} /></div>
      {[[MessageSquare,'Chat'],[GitBranch,'Workflows'],[SquareTerminal,'Agents'],[Link,'Connections'],[Settings,'Settings']].map(([Icon,label],i)=>{ const I=Icon as typeof MessageSquare;return <div key={String(label)} style={{display:'flex',alignItems:'center',gap:17,margin:'9px 13px',padding:'17px 15px',borderRadius:9,background:i===1?'#102541':undefined,color:i===1?'#72b0ff':'#8794a7',fontSize:24}}><I size={24}/>{String(label)}</div>;})}
      <div style={{fontSize:18,color:MUTED,margin:'44px 28px 16px'}}>YOUR WORKFLOWS</div>
      {[story.category,'Your workflows'].map((s,i)=><div key={s} style={{padding:'18px 28px',fontSize:21,color:i===0?TEXT:MUTED,borderLeft:i===0?`3px solid ${BLUE}`:undefined}}>{s}</div>)}
      <div style={{position:'absolute',bottom:33,left:28,display:'flex',alignItems:'center',gap:10,fontSize:20,color:MUTED}}><Mark size={25}/> Your workspace</div>
    </div>
    <div style={{position:'absolute',left:244,top:0,right:0,bottom:0}}>
      <Toolbar title={story.workflow.title} right={done?'Completed':running?'Running':'Draft'} size={31}/>
      <div style={{padding:'24px 29px',display:'flex',alignItems:'center',borderBottom:`1px solid ${BORDER}`,fontSize:24,gap:28}}><span style={{color:TEXT}}>Canvas</span><span style={{color:MUTED}}>Executions</span><span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10,color:done?GREEN:'#80b7ff'}}>{done?<Check size={23}/>:<Play size={22}/>} {done?'Complete':running?'Running workflow':'Run workflow'}</span></div>
      <div style={{margin:'24px 28px',padding:'21px 25px',border:`1px solid ${BORDER}`,borderRadius:14,background:'#111722',display:'flex',alignItems:'flex-start',gap:21,minHeight:143}}><Mark size={36}/><div style={{fontSize:27,lineHeight:1.42,color:'#c6d1df'}}>{story.prompt.slice(0,Math.round(story.prompt.length*ease(frame,4,64)))}{frame<70?<span style={{color:BLUE}}>▎</span>:null}</div><ArrowUp size={26} color={BLUE} style={{marginLeft:'auto',flexShrink:0}}/></div>
      <div style={{position:'absolute',left:0,right:0,top:346,height:835,backgroundImage:'radial-gradient(#343b482c 1.5px,transparent 1.5px)',backgroundSize:'24px 24px'}}>
        <WorkflowGraph template={template} vw={1356} vh={820} cw={3500} ch={1500} camera={{scale:.35+focus*.26,fx:1750+focus*610,fy:750}} nodeReveal={reveal} edgeReveal={edgeReveal} statusById={status} nodeVariant="cinematic" />
        <div style={{position:'absolute',left:26,bottom:25,display:'flex',gap:18,color:MUTED,fontSize:20}}><Plus size={22}/><span>−</span><span>{Math.round((.35+focus*.26)*100)}%</span></div>
      </div>
      <div style={{position:'absolute',left:0,right:0,top:1180,bottom:0,padding:'22px 29px',background:'#0c121c',borderTop:`1px solid ${BORDER}`}}>
        <div style={{display:'flex',gap:13,fontSize:25,marginBottom:18}}><SquareTerminal size={24} color={BLUE}/> Execution output <span style={{marginLeft:'auto',fontSize:20,color:MUTED}}>Illustrative run</span></div>
        {nodes.filter(n=>frame>n.at).slice(-3).map(n=><div key={n.id} style={{display:'flex',alignItems:'center',gap:13,padding:'12px 0',borderTop:'1px solid #ffffff06',fontSize:22,...mono}}><span style={{color:frame>n.at+64?GREEN:'#8fbcff'}}>{frame>n.at+64?'✓':'›'}</span><span>{n.label}</span><span style={{marginLeft:'auto',color:MUTED}}>{frame>n.at+64?'completed':'processing'}</span></div>)}
      </div>
    </div>
  </AbsoluteFill>;
}

function Tablet({ frame, story }: { frame: number; story: TradingDeskProps }) {
  const telegram = story.result.delivery === 'telegram';
  const visible=ease(frame,548,19);
  return <AbsoluteFill style={{background:'#e8edf2',color:'#19212c',fontFamily:'Duplet, sans-serif'}}>
    <div style={{padding:'27px 31px',background:'#fff',borderBottom:'1px solid #ccd4de',fontSize:30,display:'flex',alignItems:'center',gap:18}}>{telegram?<Send size={31} color={BLUE}/>:<SquareTerminal size={31} color={BLUE}/>}<span>{telegram?'Telegram':'Nick workspace'}</span><span style={{marginLeft:'auto',fontSize:20,color:'#89929c'}}>Example</span></div>
    <div style={{display:'flex',alignItems:'center',gap:20,padding:'31px 33px',background:'#f7f9fb'}}><Mark size={61}/><div><div style={{fontSize:37,fontWeight:600}}>NickAI</div><div style={{fontSize:22,color:'#76808b',marginTop:4}}>{story.category}</div></div></div>
    {frame<548?<div style={{margin:'18px 31px',padding:'18px 28px',fontSize:23,lineHeight:1.4,color:'#7b8591'}}>Your workflow will send its result here.</div>:null}
    <div style={{margin:'22px 31px',background:'#fff',borderRadius:'20px 20px 20px 4px',padding:'27px 29px',boxShadow:'0 2px 5px #00000009',opacity:visible,transform:`translateY(${(1-visible)*45}px)`}}>
      <div style={{fontSize:29,fontWeight:600,color:BLUE}}>Nick</div><div style={{fontSize:34,fontWeight:600,marginTop:14,lineHeight:1.2}}>{story.result.title}</div>
      <div style={{display:'flex',gap:11,marginTop:23}}>{deskSources(story).map(t=><div key={t} style={{padding:'9px 13px',borderRadius:7,fontSize:22,background:'#ebf3ff',color:'#1761ba'}}>{t}</div>)}</div>
      {story.result.rows.map((row,i)=><div key={row.label} style={{display:'flex',alignItems:'flex-start',gap:14,fontSize:27,padding:'18px 0',borderBottom:'1px solid #e7ecf0',opacity:ease(frame,565+i*9,14)}}><Check size={24} color={GREEN} style={{flexShrink:0}}/><div>{row.label}<div style={{fontSize:20,lineHeight:1.25,color:'#76808b',marginTop:6}}>{row.detail}</div></div></div>)}
      <div style={{fontSize:22,lineHeight:1.4,color:'#84909d',marginTop:23}}>Illustrative brief · Review the sources</div>
    </div>
  </AbsoluteFill>;
}

function Desk({ story }: { story: TradingDeskProps }) {
  const { fps, durationInFrames }=useVideoConfig();
  const f=useCurrentFrame()*750/durationInFrames;
  const rate=25*fps/durationInFrames;
  const volume=story.render_options?.audio_volume ?? 1;
  const shots=[
    {start:0,end:90,x:481,y:874,z:1.08,dx:15,dy:-18,dz:.17},
    {start:90,end:180,x:270,y:485,z:1.72,dx:2,dy:4,dz:.03},
    {start:180,end:255,x:268,y:485,z:1.74,dx:3,dy:5,dz:.03},
    {start:255,end:390,x:716,y:385,z:2.50,dx:-13,dy:43,dz:.08},
    {start:390,end:540,x:548,y:914,z:1.78,dx:28,dy:15,dz:.17},
    {start:540,end:645,x:552,y:1315,z:2.45,dx:7,dy:2,dz:.08},
    {start:645,end:750,x:481,y:856,z:1.16,dx:-5,dy:-6,dz:-.08},
  ];
  const shot=shots.find(s=>f>=s.start&&f<s.end)??shots[shots.length-1];
  const p=ease(f,shot.start,shot.end-shot.start);
  const x=shot.x+shot.dx*p+Math.sin(f*.071)*1.05;
  const y=shot.y+shot.dy*p+Math.sin(f*.043+.7)*1.4;
  const zoom=(shot.z+shot.dz*p)*1080/W;
  const roll=Math.sin(f*.032)*.08;
  return <AbsoluteFill style={{background:'#080a0d',overflow:'hidden'}}>
    <div style={{position:'absolute',width:W,height:H,left:540,top:960,transformOrigin:'0 0',transform:`rotate(${roll}deg) scale(${zoom}) translate(${-x}px,${-y}px)`}}>
      <Img src={staticFile('nick-desk/desk-plate.png')} style={{position:'absolute',inset:0,width:W,height:H}}/>
      <Screen width={1400} height={1450} points={[[0,-28],[527,26],[506,554],[-8,507]]}><MarketScreen frame={f} story={story}/></Screen>
      <Screen width={960} height={1640} points={[[563,40],[857,96],[830,617],[541,590]]}><ModelsScreen frame={f} story={story}/></Screen>
      <Screen width={700} height={1800} points={[[879,107],[1067,146],[1063,665],[852,622]]}><Connections frame={f} story={story} compact/></Screen>
      <Screen width={570} height={1850} points={[[-57,555],[173,600],[178,1313],[-40,1382]]}><Connections frame={f} story={story}/></Screen>
      <Screen width={1600} height={1490} points={[[228,594],[831,660],[851,1148],[229,1206]]}><Workspace frame={f} story={story}/></Screen>
      <Screen width={700} height={1550} points={[[874,704],[1088,730],[1106,1198],[885,1136]]}><Connections frame={f} story={story} compact/></Screen>
      <Img src={staticFile('nick-desk/desk-plate.png')} style={{position:'absolute',inset:0,width:W,height:H,clipPath:'polygon(37.3% 70.8%, 67.6% 68.6%, 81% 86.4%, 48% 91.8%)'}}/>
      <Screen width={760} height={1010} light points={[[387,1212],[628,1173],[724,1432],[463,1506]]}><Tablet frame={f} story={story}/></Screen>
      <Img src={staticFile('nick-desk/desk-plate.png')} style={{position:'absolute',inset:0,width:W,height:H,clipPath:'polygon(0px 1510px,448px 1487px,506px 1466px,518px 1468px,535px 1493px,577px 1496px,941px 1545px,941px 1672px,0px 1672px)'}}/>
    </div>
    <AbsoluteFill style={{pointerEvents:'none',background:'radial-gradient(ellipse at 50% 48%,transparent 40%,#00000038 100%)'}}/>
    {f<112?<div style={{position:'absolute',left:56,right:56,bottom:128,opacity:ease(f,7,17)*(1-ease(f,91,18)),textShadow:'0 3px 20px #000',fontSize:47,fontWeight:600,letterSpacing:-1.3,color:'#f3f1e9'}}>{story.hook}</div>:null}
    {f>=662?<div style={{position:'absolute',left:56,right:56,bottom:149,opacity:ease(f,665,24),display:'flex',alignItems:'center',gap:27,background:'#090d14c9',border:'1px solid #ffffff19',padding:'26px 29px',borderRadius:17}}><Mark size={76}/><div><div style={{fontSize:26,color:'#ced5df',marginBottom:9}}>{story.payoff}</div><div style={{fontSize:31,color:'#ced5df'}}>Try it for free now:</div><div style={{fontSize:59,fontWeight:600,letterSpacing:-2,color:'#fff'}}>getnick.ai</div></div></div>:null}
    <div style={{position:'absolute',left:56,bottom:45,color:'#d9dee7',opacity:.76,fontSize:20,textShadow:'0 2px 7px #000'}}>{story.review.models ? 'Illustrative setup · Scripted model replies' : 'Illustrative Nick workflow'}</div>
    <Audio src={staticFile('nick-desk/bed.m4a')} loop playbackRate={rate} volume={volume*.37*(1-ease(f,720,29))}/>
    <Audio src={staticFile('nick-desk/desk-sounds.m4a')} playbackRate={rate} volume={volume*.75}/>
  </AbsoluteFill>;
}

export function TradingDeskComposition(story: TradingDeskProps) {
  const [handle]=useState(()=>delayRender('Load Nick typography'));
  useEffect(()=>{Promise.all([document.fonts.load('400 32px Duplet'),document.fonts.load('600 60px Duplet'),document.fonts.load('700 60px Duplet')]).then(()=>continueRender(handle)).catch(cancelRender);},[handle]);
  return <AbsoluteFill style={{fontFamily:'Duplet, "Apple Color Emoji", "Noto Color Emoji", sans-serif'}}><style>{`@font-face{font-family:Duplet;src:url('${staticFile('fonts/Duplet-Regular.woff')}');font-weight:400}@font-face{font-family:Duplet;src:url('${staticFile('fonts/Duplet-Semibold.woff')}');font-weight:600}@font-face{font-family:Duplet;src:url('${staticFile('fonts/Duplet-Bold.woff')}');font-weight:700}*{box-sizing:border-box}`}</style><Desk story={story}/></AbsoluteFill>;
}
