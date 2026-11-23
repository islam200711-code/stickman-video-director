/**
 * Screen graphics & HUD — original, reusable storytelling interfaces driven by scene `ui` events.
 * Each component animates in/out from its event times (deterministic, frame-based):
 *   news      broadcast lower-third + scrolling ticker + live bug (generic, no real brands)
 *   terminal  window that types lines, then stamps a status ("SIGNAL FOUND")
 *   alert     pulsing warning modal
 *   status    small corner chip (e.g. "REC", "OFFLINE", battery/signal)
 *   target    lock-on reticle tracking a character or world point, with label + readout
 *   videocall call chrome: caller bar, timer, buttons, self-view tile
 *   map       minimap / full map: grid, route drawing itself, blinking position, destination
 *   scope / binocular / fisheye  POV masks
 *   glitch / scanwipe  screen transitions
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from '../schema/scene';
import {project} from '../vfx/Effects2D';
import {evaluateCharacter} from '../animations/library';
import {rng} from '../three/assets';
import {protectedRects} from '../remotion/safezones';

type U = Scene['ui'][number];
const MONO = '"DejaVu Sans Mono", "Liberation Mono", monospace';
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const inOut = (t: number, a: number, b: number, k = 0.25) => clamp((t - a) / k) * clamp((b - t) / k);

const Window: React.FC<{x: number; y: number; w: number; h: number; title: string; color: string; o: number; u: number; children: React.ReactNode}> = ({x, y, w, h, title, color, o, u, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h * (0.15 + 0.85 * clamp(o * 1.4)), overflow: 'hidden', opacity: o,
    background: 'rgba(6,14,10,0.9)', border: `${2 * u}px solid ${color}`, borderRadius: 6 * u, boxShadow: `0 0 ${18 * u}px ${color}55`, fontFamily: MONO}}>
    <div style={{height: 26 * u, background: color, color: '#06120c', fontSize: 15 * u, fontWeight: 700, padding: `${3 * u}px ${10 * u}px`, display: 'flex', justifyContent: 'space-between'}}>
      <span>{title}</span><span>● ● ●</span>
    </div>
    <div style={{padding: 12 * u, color, fontSize: 18 * u, lineHeight: 1.35}}>{children}</div>
  </div>
);

export const Hud: React.FC<{scene: Scene}> = ({scene}) => {
  const {fps, width: w, height: h} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const u = h / 720;
  const out: React.ReactNode[] = [];
  scene.ui.forEach((e: U, i) => {
    const end = e.until ?? e.at + 3;
    if (t < e.at - 0.01 || t > end) return;
    const lt = t - e.at, o = inOut(t, e.at, end);
    const color = e.color ?? '#3dff8a';
    switch (e.type) {
      case 'news': {
        const ticker = (e.lines ?? ['LIVE COVERAGE']).join('   •   ');
        out.push(<AbsoluteFill key={i} style={{opacity: o, fontFamily: 'Inter, Helvetica, Arial, sans-serif'}}>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 34 * u, height: 92 * u, transform: `translateX(${(1 - clamp(lt * 3)) * -100}%)`}}>
            <div style={{display: 'inline-block', background: e.color ?? '#d6262e', color: '#fff', fontWeight: 900, fontSize: 18 * u, padding: `${4 * u}px ${14 * u}px`, letterSpacing: 2}}>BREAKING</div>
            <div style={{background: 'rgba(255,255,255,0.96)', color: '#111', fontWeight: 900, fontSize: 34 * u, padding: `${6 * u}px ${18 * u}px`, width: '70%'}}>{e.title ?? 'HEADLINE'}</div>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 34 * u, background: '#101820', color: '#fff', fontSize: 18 * u, lineHeight: `${34 * u}px`, whiteSpace: 'nowrap', overflow: 'hidden'}}>
            <span style={{display: 'inline-block', transform: `translateX(${w - lt * 140 * u}px)`}}>{ticker}   •   {ticker}</span>
          </div>
          <div style={{position: 'absolute', right: 30 * u, top: 26 * u, color: '#fff', fontWeight: 900, fontSize: 20 * u, background: 'rgba(214,38,46,0.92)', padding: `${4 * u}px ${10 * u}px`, borderRadius: 4 * u}}>● LIVE</div>
        </AbsoluteFill>);
        break;
      }
      case 'terminal': {
        const lines = e.lines ?? ['> scanning...'];
        const cps = 32; let budget = Math.floor(Math.max(0, lt - 0.3) * cps);
        const shown = lines.map((l) => {const s = l.slice(0, Math.max(0, budget)); budget -= l.length; return s;}).filter((_, k) => k === 0 || budget > -lines[k].length);
        const typedAll = Math.max(0, lt - 0.3) * cps >= lines.join('').length;
        const stampT = lt - (0.3 + lines.join('').length / cps);
        const ww = e.anchor === 'full' ? w * 0.84 : w * 0.37, hh = e.anchor === 'full' ? h * 0.78 : h * 0.42;
        // windows obey the safe-zone system: pick the side that covers the fewest heads (at the event start)
        let anchor = e.anchor;
        if (anchor !== 'full') {
          const heads = protectedRects(scene, e.at + 0.5, w, h).filter((r) => r.kind === 'head');
          const cover = (x0: number) => heads.reduce((a, r) => a + Math.max(0, Math.min(r.x1, x0 + ww) - Math.max(r.x0, x0)) * Math.max(0, Math.min(r.y1, h * 0.12 + hh) - Math.max(r.y0, h * 0.12)), 0);
          const L = cover(w * 0.05), R = cover(w * 0.95 - ww);
          if (L === 0 && R === 0 && anchor === 'center') anchor = 'center'; else if (L <= R) anchor = anchor === 'right' && R === 0 ? 'right' : 'left'; else anchor = 'right';
        }
        const x = anchor === 'left' ? w * 0.05 : anchor === 'right' ? w * 0.95 - ww : (w - ww) / 2, y = anchor === 'full' ? h * 0.1 : h * 0.12;
        out.push(<Window key={i} x={x} y={y} w={ww} h={hh} title={e.title ?? 'TERMINAL'} color={color} o={o} u={u}>
          {shown.map((l, k) => <div key={k}>{l}{k === shown.length - 1 && !typedAll && Math.floor(t * 3) % 2 ? '█' : ''}</div>)}
          {e.stamp && typedAll && stampT > 0 && <div style={{marginTop: 18 * u, display: 'inline-block', border: `${3 * u}px solid ${color}`, padding: `${6 * u}px ${16 * u}px`, fontSize: 30 * u, fontWeight: 900,
            transform: `scale(${1 + 0.6 * Math.exp(-stampT * 10)}) rotate(-4deg)`, background: `${color}22`}}>{e.stamp}</div>}
        </Window>);
        break;
      }
      case 'alert': {
        const pulse = 0.5 + 0.5 * Math.sin(lt * 10); const c = e.color ?? '#ff3b3b';
        // the modal obeys head safe zones: centre if clear, else the top or bottom band
        const heads = protectedRects(scene, e.at + 0.3, w, h).filter((r) => r.kind === 'head');
        const bandHit = (y0: number, y1: number) => heads.reduce((a, r) => a + Math.max(0, Math.min(r.y1, y1) - Math.max(r.y0, y0)) * Math.max(0, Math.min(r.x1, w * 0.72) - Math.max(r.x0, w * 0.28)), 0);
        const bands = [[h * 0.36, h * 0.64, 'center'], [h * 0.06, h * 0.34, 'flex-start'], [h * 0.66, h * 0.94, 'flex-end']] as const;
        const band = [...bands].sort((a, b2) => bandHit(a[0], a[1]) - bandHit(b2[0], b2[1]))[0];
        out.push(<AbsoluteFill key={i} style={{opacity: o, alignItems: 'center', justifyContent: band[2], padding: `${h * 0.06}px 0`}}>
          <AbsoluteFill style={{boxShadow: `inset 0 0 ${120 * u}px ${c}${Math.round(80 + pulse * 100).toString(16)}`}} />
          <div style={{background: 'rgba(20,4,6,0.9)', border: `${4 * u}px solid ${c}`, color: c, fontFamily: MONO, padding: `${18 * u}px ${34 * u}px`, textAlign: 'center', transform: `scale(${0.9 + 0.1 * clamp(lt * 5)})`}}>
            <div style={{fontSize: 56 * u, lineHeight: 1}}>⚠</div>
            <div style={{fontSize: 34 * u, fontWeight: 900, letterSpacing: 3}}>{e.title ?? 'WARNING'}</div>
            {e.text && <div style={{fontSize: 18 * u, opacity: 0.9}}>{e.text}</div>}
          </div>
        </AbsoluteFill>);
        break;
      }
      case 'status': {
        out.push(<div key={i} style={{position: 'absolute', top: 24 * u, [e.anchor === 'left' ? 'left' : 'right']: 28 * u, opacity: o, fontFamily: MONO, fontSize: 20 * u, color: e.color ?? '#ffffff',
          background: 'rgba(0,0,0,0.55)', padding: `${4 * u}px ${12 * u}px`, borderRadius: 4 * u}}>{Math.floor(t * 2) % 2 ? '●' : '○'} {e.title ?? 'REC'}</div>);
        break;
      }
      case 'target': {
        let p: [number, number, number] | undefined = e.position;
        if (e.target) {const ch = scene.characters.find((c) => c.id === e.target); if (ch) {const f = evaluateCharacter(ch, t, scene.duration); p = [f.position[0], 1.15, f.position[2]];}}
        if (!p) break;
        const sp = project(scene, t, p, w, h); if (!sp.visible) break;
        const lock = clamp(lt / 0.9), size = (1.6 - 0.6 * lock) * Math.max(90 * u, sp.pxPerM * 1.6), c = lock >= 1 ? (e.color ?? '#ff4040') : '#ffd24a';
        const br = size / 2, k = br * 0.35, sw = 3 * u;
        out.push(<svg key={i} width={w} height={h} style={{position: 'absolute', inset: 0, opacity: o}}>
          <g transform={`translate(${sp.x},${sp.y})`} stroke={c} strokeWidth={sw} fill="none">
            {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b2], m) => <path key={m} d={`M ${a * br} ${b2 * (br - k)} V ${b2 * br} H ${a * (br - k)}`} />)}
            <circle r={br * 0.42} strokeDasharray={`${br * 0.3} ${br * 0.18}`} transform={`rotate(${lt * 90})`} />
            <line x1={-br * 0.15} x2={br * 0.15} /><line y1={-br * 0.15} y2={br * 0.15} />
          </g>
          <text x={sp.x + br + 10 * u} y={sp.y - br + 18 * u} fill={c} fontFamily={MONO} fontSize={18 * u} fontWeight={700}>{lock >= 1 ? (e.title ?? 'TARGET LOCKED') : 'ACQUIRING…'}</text>
          <text x={sp.x + br + 10 * u} y={sp.y - br + 40 * u} fill={c} fontFamily={MONO} fontSize={15 * u}>{e.text ?? `DIST ${(12.4 - lt * 0.7).toFixed(1)} m`}</text>
        </svg>);
        break;
      }
      case 'videocall': {
        const secs = Math.floor(lt), mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
        out.push(<AbsoluteFill key={i} style={{opacity: o, fontFamily: 'Inter, Helvetica, Arial, sans-serif', color: '#fff'}}>
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 64 * u, background: 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0))', display: 'flex', alignItems: 'center', gap: 14 * u, paddingLeft: 26 * u}}>
            <div style={{width: 36 * u, height: 36 * u, borderRadius: '50%', background: e.color ?? '#3d7bff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18 * u}}>{(e.title ?? 'Caller')[0]}</div>
            <div style={{fontSize: 22 * u, fontWeight: 700}}>{e.title ?? 'Caller'}</div>
            <div style={{fontSize: 18 * u, opacity: 0.85}}>{lt < 1.2 ? 'Calling…' : `${mm}:${ss}`}</div>
          </div>
          <div style={{position: 'absolute', right: 26 * u, top: 80 * u, width: 200 * u, height: 128 * u, borderRadius: 10 * u, background: '#202734', border: `${2 * u}px solid #fff`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 * u, opacity: 0.95}}>{e.text ?? 'You'}</div>
          <div style={{position: 'absolute', bottom: 26 * u, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22 * u}}>
            {['#3a4150', '#3a4150', '#e5383b'].map((bg, k) => <div key={k} style={{width: 58 * u, height: 58 * u, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 * u}}>{['🎤', '📷', '✆'][k]}</div>)}
          </div>
        </AbsoluteFill>);
        break;
      }
      case 'map': {
        const full = e.anchor === 'full'; const mw = full ? w * 0.8 : w * 0.26, mh = full ? h * 0.78 : h * 0.3;
        const x = full ? (w - mw) / 2 : w - mw - 26 * u, y = full ? h * 0.11 : h - mh - 26 * u;
        const route = e.route ?? [[0.1, 0.8], [0.35, 0.6], [0.55, 0.65], [0.8, 0.25]];
        const prog = clamp(lt / Math.max(0.5, (end - e.at) * 0.7)) * (route.length - 1);
        const seg = Math.min(route.length - 2, Math.floor(prog)), fr = prog - seg;
        const cur: [number, number] = [route[seg][0] + (route[seg + 1][0] - route[seg][0]) * fr, route[seg][1] + (route[seg + 1][1] - route[seg][1]) * fr];
        const pts = [...route.slice(0, seg + 1), cur].map(([a, b2]) => `${a * mw},${b2 * mh}`).join(' ');
        const r = rng(9);
        out.push(<svg key={i} width={w} height={h} style={{position: 'absolute', inset: 0, opacity: o}}>
          <g transform={`translate(${x},${y})`}>
            <rect width={mw} height={mh} rx={8 * u} fill="rgba(8,20,28,0.88)" stroke={color} strokeWidth={2 * u} />
            {Array.from({length: 9}, (_, k) => <line key={k} x1={(k / 8) * mw} x2={(k / 8) * mw} y2={mh} stroke={`${color}22`} />)}
            {Array.from({length: 6}, (_, k) => <line key={k} y1={(k / 5) * mh} y2={(k / 5) * mh} x2={mw} stroke={`${color}22`} />)}
            {Array.from({length: 7}, (_, k) => <rect key={k} x={r() * mw * 0.85} y={r() * mh * 0.85} width={mw * (0.06 + r() * 0.1)} height={mh * (0.06 + r() * 0.12)} fill={`${color}18`} />)}
            <polyline points={route.map(([a, b2]) => `${a * mw},${b2 * mh}`).join(' ')} fill="none" stroke={`${color}44`} strokeWidth={3 * u} strokeDasharray={`${6 * u} ${6 * u}`} />
            <polyline points={pts} fill="none" stroke={color} strokeWidth={4 * u} />
            <circle cx={route[route.length - 1][0] * mw} cy={route[route.length - 1][1] * mh} r={10 * u} fill="none" stroke="#ff4d4d" strokeWidth={3 * u} />
            <circle cx={cur[0] * mw} cy={cur[1] * mh} r={(6 + 3 * Math.sin(t * 8)) * u} fill={color} />
            <text x={12 * u} y={24 * u} fill={color} fontFamily={MONO} fontSize={16 * u} fontWeight={700}>{e.title ?? 'ROUTE'}</text>
          </g>
        </svg>);
        break;
      }
      case 'scope': case 'binocular': case 'fisheye': {
        const R = h * (e.type === 'fisheye' ? 0.47 : e.type === 'scope' ? 0.42 : 0.36);
        const holes = e.type === 'binocular' ? [[w / 2 - R * 0.78, h / 2], [w / 2 + R * 0.78, h / 2]] : [[w / 2, h / 2]];
        const mask = `M0 0 H${w} V${h} H0 Z ` + holes.map(([cx, cy]) => `M${cx - R} ${cy} a${R} ${R} 0 1 0 ${2 * R} 0 a${R} ${R} 0 1 0 ${-2 * R} 0 Z`).join(' ');
        const c = e.color ?? '#9fe8ff';
        out.push(<svg key={i} width={w} height={h} style={{position: 'absolute', inset: 0, opacity: Math.min(1, o * 1.6)}}>
          <defs><radialGradient id={`v${i}`}><stop offset={e.type === 'fisheye' ? '55%' : '70%'} stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity={e.type === 'fisheye' ? 0.9 : 0.75} /></radialGradient></defs>
          {holes.map(([cx, cy], k) => <circle key={k} cx={cx} cy={cy} r={R} fill={`url(#v${i})`} />)}
          <path d={mask} fill="#040406" fillRule="evenodd" />
          {e.type === 'scope' && <g stroke={c} strokeWidth={2 * u}>
            <line x1={w / 2 - R} x2={w / 2 - R * 0.12} y1={h / 2} y2={h / 2} /><line x1={w / 2 + R * 0.12} x2={w / 2 + R} y1={h / 2} y2={h / 2} />
            <line y1={h / 2 - R} y2={h / 2 - R * 0.12} x1={w / 2} x2={w / 2} /><line y1={h / 2 + R * 0.12} y2={h / 2 + R} x1={w / 2} x2={w / 2} />
            {[-3, -2, -1, 1, 2, 3].map((k) => <line key={k} x1={w / 2 + k * R * 0.2} x2={w / 2 + k * R * 0.2} y1={h / 2 - 8 * u} y2={h / 2 + 8 * u} />)}
            <text x={w / 2 + R * 0.55} y={h / 2 - R * 0.62} fill={c} stroke="none" fontFamily={MONO} fontSize={16 * u}>{e.text ?? 'ZOOM ×8'}</text></g>}
          {e.type === 'fisheye' && Array.from({length: 7}, (_, k) => <ellipse key={k} cx={w / 2} cy={h / 2} rx={R * (0.3 + k * 0.1)} ry={R * (0.3 + k * 0.1) * 0.98} fill="none" stroke="#ffffff10" />)}
          {e.type === 'fisheye' && <text x={w / 2 - R * 0.62} y={h / 2 - R * 0.7} fill="#ff4040" fontFamily={MONO} fontSize={18 * u}>{Math.floor(t * 2) % 2 ? '● ' : '○ '}{e.title ?? 'CAM 04'}</text>}
        </svg>);
        break;
      }
      case 'glitch': {
        const r = rng(Math.floor(t * 24) + i); const strength = Math.sin(clamp(lt / (end - e.at)) * Math.PI);
        out.push(<AbsoluteFill key={i} style={{mixBlendMode: 'screen'}}>{Array.from({length: 7}, (_, k) => {const y = r() * h, hh = (4 + r() * 40) * u * strength;
          return <div key={k} style={{position: 'absolute', left: (r() - 0.5) * 60 * u * strength, top: y, width: w, height: hh, background: ['#ff004c55', '#00e5ff55', '#ffffff40'][k % 3]}} />;})}</AbsoluteFill>);
        break;
      }
      case 'scanwipe': {
        const p = clamp(lt / (end - e.at)); const y = p * h;
        out.push(<AbsoluteFill key={i}><div style={{position: 'absolute', left: 0, right: 0, top: 0, height: y, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.85) 0 3px, rgba(0,20,10,0.7) 3px 6px)'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: y - 3 * u, height: 6 * u, background: color, boxShadow: `0 0 ${20 * u}px ${color}`}} /></AbsoluteFill>);
        break;
      }
    }
  });
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{out}</AbsoluteFill>;
};
