/* Shared mini-canvas renderer for the starter-agents trio. */

const COLORS = {
  "start":                 {bg:"#e7f7ee", fg:"#0f9d58"},
  "price-data":            {bg:"#e9ebfb", fg:"#4f56d6"},
  "function":              {bg:"#eef0f3", fg:"#5b6472"},
  "conditional":           {bg:"#fdf1dd", fg:"#c98a12"},
  "storage":               {bg:"#e4f4fb", fg:"#0e8fbf"},
  "exchange":              {bg:"#e6effd", fg:"#2563eb"},
  "telegram-notification": {bg:"#f2ebfc", fg:"#8b46d9"},
  "notification":          {bg:"#f2ebfc", fg:"#8b46d9"},
  "llm":                   {bg:"#efe7fd", fg:"#7c3aed"},
  "coinglass":             {bg:"#fdeede", fg:"#ea7317"},
  "defillama":             {bg:"#d9f2ef", fg:"#0d9488"},
  "rss-feed":              {bg:"#fce4e9", fg:"#e11d48"},
  "polymarket-data":       {bg:"#e6effd", fg:"#2563eb"},
};
const BADGE = {
  "start":"START","price-data":"PRICE DATA","function":"FUNCTION",
  "conditional":"CONDITIONAL","storage":"STORAGE","exchange":"EXCHANGE",
  "telegram-notification":"NOTIFICATION","notification":"NOTIFICATION",
  "llm":"LLM","coinglass":"COINGLASS","defillama":"DEFILLAMA",
  "rss-feed":"RSS FEED","polymarket-data":"POLYMARKET",
};

/* ---- layout constants ---- */
const CW = 172, CH = 58;      // chip size
const COL_W = 238;            // column pitch
const ROW_H = 92;             // row pitch
const PAD = 30;               // inner canvas padding

/* ---- workflow specs (grid coords: c=col, r=row) ---- */
const SPECS = {
  smart: {
    name: "Smart Price Alert",
    pills: ["9 nodes", "11 connections", "Every hour"],
    nodes: [
      {id:"start",    c:0, r:0, type:"start",                 label:"Every Hour"},
      {id:"price",    c:1, r:0, type:"price-data",            label:"BTC / ETH / SOL Prices"},
      {id:"detect",   c:2, r:0, type:"function",              label:"Detect Alert Conditions"},
      {id:"hasalert", c:3, r:0, type:"conditional",           label:"Has Alert?"},
      {id:"readlast", c:4, r:0, type:"storage",               label:"Read Last Alert Time"},
      {id:"cooldown", c:5, r:0, type:"function",              label:"Check Cooldown"},
      {id:"passed",   c:6, r:0, type:"conditional",           label:"Cooldown Passed?"},
      {id:"writelast",c:7, r:0, type:"storage",               label:"Write Last Alert Time"},
      {id:"send",     c:8, r:0, type:"telegram-notification", label:"Send Alert"},
    ],
    edges: [
      {s:"start",   t:"price"},
      {s:"price",   t:"detect"},
      {s:"detect",  t:"hasalert"},
      {s:"hasalert",t:"readlast", l:"true"},
      {s:"readlast",t:"cooldown"},
      {s:"cooldown",t:"passed"},
      {s:"passed",  t:"writelast", l:"true"},
      {s:"writelast",t:"send"},
      {s:"passed",  t:"send",  l:"true", arc:1},
      {s:"cooldown",t:"writelast", arc:2},
      {s:"detect",  t:"send",  arc:3},
    ],
  },

  paper: {
    name: "Disciplined BTC Paper Trader",
    pills: ["12 nodes", "13 connections", "Every 6 hours"],
    nodes: [
      {id:"start", c:0, r:2, type:"start",                 label:"Every 6 Hours"},
      {id:"price", c:1, r:1, type:"price-data",            label:"BTC Price + Indicators"},
      {id:"loadts",c:1, r:3, type:"storage",               label:"Load Last Trade Time"},
      {id:"eval",  c:2, r:2, type:"function",              label:"Evaluate Setup & Risk"},
      {id:"gate",  c:3, r:2, type:"conditional",           label:"Should Trade?"},
      {id:"ls",    c:4, r:1, type:"conditional",           label:"Long or Short?"},
      {id:"buy",   c:5, r:0, type:"exchange",              label:"Paper Buy BTC"},
      {id:"sell",  c:5, r:2, type:"exchange",              label:"Paper Sell BTC"},
      {id:"merge", c:6, r:1, type:"function",              label:"Merge Order Result"},
      {id:"savets",c:7, r:0, type:"storage",               label:"Save Last Trade Time"},
      {id:"noset", c:4, r:3, type:"telegram-notification", label:"No Setup Telegram"},
      {id:"alert", c:7, r:2, type:"telegram-notification", label:"Trade Alert Telegram"},
    ],
    edges: [
      {s:"start", t:"price"},
      {s:"start", t:"loadts"},
      {s:"price", t:"eval"},
      {s:"loadts",t:"eval"},
      {s:"eval",  t:"gate"},
      {s:"gate",  t:"ls",    l:"true"},
      {s:"gate",  t:"noset", l:"false"},
      {s:"ls",    t:"buy",   l:"true"},
      {s:"ls",    t:"sell",  l:"false"},
      {s:"buy",   t:"merge"},
      {s:"sell",  t:"merge"},
      {s:"merge", t:"savets"},
      {s:"merge", t:"alert"},
    ],
  },

  morning: {
    name: "Morning Edge Brief",
    pills: ["9 nodes", "13 connections", "Daily 8AM"],
    nodes: [
      {id:"start",    c:0, r:2.5, type:"start",                 label:"Daily 8AM Trigger"},
      {id:"price",    c:1, r:0,   type:"price-data",            label:"Crypto Prices"},
      {id:"funding",  c:1, r:1,   type:"coinglass",             label:"Funding Rates"},
      {id:"feargreed",c:1, r:2,   type:"coinglass",             label:"Fear & Greed Index"},
      {id:"tvl",      c:1, r:3,   type:"defillama",             label:"Chain TVL"},
      {id:"rss",      c:1, r:4,   type:"rss-feed",              label:"CoinDesk RSS"},
      {id:"poly",     c:1, r:5,   type:"polymarket-data",       label:"Polymarket Signals"},
      {id:"llm",      c:2, r:2.5, type:"llm",                   label:"Morning Brief LLM"},
      {id:"telegram", c:3, r:2.5, type:"telegram-notification", label:"Morning Brief Telegram"},
    ],
    edges: [
      {s:"start", t:"price"},
      {s:"start", t:"funding"},
      {s:"start", t:"feargreed"},
      {s:"start", t:"tvl"},
      {s:"start", t:"rss"},
      {s:"start", t:"poly"},
      {s:"price",    t:"llm"},
      {s:"funding",  t:"llm"},
      {s:"feargreed",t:"llm"},
      {s:"tvl",      t:"llm"},
      {s:"rss",      t:"llm"},
      {s:"poly",     t:"llm"},
      {s:"llm",   t:"telegram"},
    ],
  },
};

/* common node-area width = widest workflow (so all panels align) */
function nodeAreaW(spec){
  const maxC = Math.max(...spec.nodes.map(n=>n.c));
  return maxC*COL_W + CW;
}
const COMMON_NODE_W = Math.max(...Object.values(SPECS).map(nodeAreaW));

function renderPanel(spec, panelW){
  panelW = panelW || COMMON_NODE_W;
  const maxC = Math.max(...spec.nodes.map(n=>n.c));
  const maxR = Math.max(...spec.nodes.map(n=>n.r));
  const thisW = maxC*COL_W + CW;
  const xOff = PAD + (panelW - thisW)/2;   // center narrower graphs

  // arc depth below the row baseline
  const arcDip = a => 52 + (a-1)*30;
  let extraBottom = 0;
  spec.edges.forEach(e=>{ if(e.arc) extraBottom = Math.max(extraBottom, arcDip(e.arc)+18); });

  const pos = {};
  spec.nodes.forEach(n=>{
    pos[n.id] = { x: xOff + n.c*COL_W, y: PAD + n.r*ROW_H };
  });

  const BW = PAD + panelW + PAD;
  const BH = PAD + maxR*ROW_H + CH + extraBottom + PAD;

  // edges svg
  let sHTML = "";
  spec.edges.forEach(e=>{
    const s = pos[e.s], t = pos[e.t];
    const sx = s.x + CW, sy = s.y + CH/2;
    const tx = t.x,      ty = t.y + CH/2;
    let d;
    if (e.arc){
      const dip = arcDip(e.arc);
      const span = tx - sx;
      const c1x = sx + span*0.18, c2x = tx - span*0.18;
      const by = Math.max(sy, ty) + dip;
      d = `M ${sx} ${sy} C ${c1x} ${by}, ${c2x} ${by}, ${tx} ${ty}`;
    } else {
      const dx = Math.max(38, (tx - sx) * 0.5);
      d = `M ${sx} ${sy} C ${sx+dx} ${sy}, ${tx-dx} ${ty}, ${tx} ${ty}`;
    }
    sHTML += `<path d="${d}" fill="none" stroke="var(--edge)" stroke-width="1.7" stroke-linecap="round"/>`;
    if (e.l){
      let mx, my;
      if (e.arc){ mx = (sx+tx)/2; my = Math.max(sy,ty) + arcDip(e.arc) - 4; }
      else { mx = (sx+tx)/2; my = (sy+ty)/2 - 5; }
      sHTML += `<rect x="${mx-16}" y="${my-9}" width="32" height="15" rx="7.5" fill="#fbfbfc" opacity="0.92"/>`;
      sHTML += `<text x="${mx}" y="${my+1.5}" text-anchor="middle" class="elabel">${e.l}</text>`;
    }
  });

  const nodesHTML = spec.nodes.map(n=>{
    const c = COLORS[n.type];
    return `<div class="node" style="left:${pos[n.id].x}px;top:${pos[n.id].y}px;width:${CW}px;height:${CH}px">
      <span class="h l"></span><span class="h r"></span>
      <span class="badge" style="background:${c.bg};color:${c.fg}">${BADGE[n.type]}</span>
      <div class="title">${n.label}</div>
    </div>`;
  }).join("");

  const pills = spec.pills.map((p,i)=>
    i===spec.pills.length-1
      ? `<span class="pill"><span class="dotm"></span>${p}</span>`
      : `<span class="pill">${p}</span>`
  ).join("");

  return `<section class="panel">
    <div class="hdr">
      <span class="avatar"></span>
      <span class="wname">${spec.name}</span>
      ${pills}
    </div>
    <div class="canvas" style="width:${BW}px;height:${BH}px">
      <div class="grid"></div>
      <svg width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}">${sHTML}</svg>
      <div class="nodes">${nodesHTML}</div>
    </div>
  </section>`;
}

function renderInto(rootId, keys, opts){
  opts = opts || {};
  const root = document.getElementById(rootId);
  root.innerHTML = keys.map((k,i)=>{
    const spec = SPECS[k];
    const w = opts.fit ? nodeAreaW(spec) : COMMON_NODE_W;
    const html = renderPanel(spec, w);
    return i < keys.length-1 ? html + `<div class="divider"></div>` : html;
  }).join("");
}
