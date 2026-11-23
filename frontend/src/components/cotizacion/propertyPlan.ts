import type { PropertyPlan, PropertyType } from '../../data/pricing';

export type RoomType = 'bed' | 'bath' | 'half' | 'hall' | 'living' | 'kitchen';

export interface Room {
  type: RoomType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Span {
  o: 'h' | 'v';
  c: number;
  a: number;
  b: number;
}

export interface Door extends Span {
  open?: boolean;
  front?: boolean;
  swing?: 'up' | 'down';
}

export interface Layout {
  W: number;
  D: number;
  m: number;
  house: boolean;
  rooms: Room[];
  doors: Door[];
  windows: Span[];
  front: Door;
  living: Room;
  kitchen: Room;
}

export const WALL_T = 0.2;
export const WALL_H = 0.95;
export const LAYERS = 10;

export const DEFAULT_PREVIEW_PLAN: Record<PropertyType, PropertyPlan> = {
  apartment: { beds: 2, baths: 1 },
  house: { beds: 3, baths: 2 },
};

export function buildLayout(p: PropertyPlan, type: PropertyType): Layout {
  const house = type === 'house';
  const BR_W = 4, BR_H = 4.5, BA_W = 3, HALL = 1.4, BOT_H = 5, KIT_W = 4.5, HALF_W = 2.6;

  type Draft = Omit<Room, 'x' | 'y' | 'h'> & Partial<Room>;
  const top: Draft[] = [];
  for (let i = 0; i < p.beds; i++) {
    top.push({ type: 'bed', w: BR_W, label: p.beds > 1 ? `BEDROOM ${i + 1}` : 'BEDROOM' });
    if (i === 0 && p.baths >= 1) top.push({ type: 'bath', w: BA_W, label: p.baths > 1 ? 'BATH 1' : 'BATH' });
  }
  for (let j = 1; j < p.baths; j++) top.push({ type: 'bath', w: BA_W, label: `BATH ${j + 1}` });

  const topW = top.reduce((s, r) => s + r.w, 0);
  const W = Math.max(topW, house ? 14 : 9);
  const extra = (W - topW) / p.beds;
  let x = 0;
  const topRooms: Room[] = top.map((r) => {
    const w = r.type === 'bed' ? r.w + extra : r.w;
    const room: Room = { type: r.type, label: r.label, x, y: 0, w, h: BR_H };
    x += w;
    return room;
  });

  const yB = BR_H + (house ? HALL : 0);
  const D = yB + BOT_H;
  const halfW = house && p.half ? HALF_W : 0;
  const livingW = W - KIT_W - halfW;

  const living: Room = { type: 'living', label: 'LIVING', x: 0, y: yB, w: livingW, h: BOT_H };
  const kitchen: Room = { type: 'kitchen', label: 'KITCHEN', x: livingW, y: yB, w: KIT_W, h: BOT_H };
  const rooms: Room[] = [...topRooms];
  if (house) rooms.push({ type: 'hall', label: 'HALL', x: 0, y: BR_H, w: W, h: HALL });
  rooms.push(living, kitchen);
  if (halfW) rooms.push({ type: 'half', label: '½ BATH', x: livingW + KIT_W, y: yB, w: halfW, h: BOT_H });

  const doors: Door[] = [];
  for (const r of topRooms) {
    const dx = r.type === 'bath' ? r.x + 0.5 : r.x + r.w - 1.5;
    doors.push({ o: 'h', c: BR_H, a: dx, b: dx + 0.95, swing: 'up' });
  }
  if (house) {
    doors.push({ o: 'h', c: yB, a: 1, b: Math.min(livingW - 1, 4), open: true });
    doors.push({ o: 'h', c: yB, a: kitchen.x + 0.7, b: kitchen.x + 1.7, open: true });
    if (halfW) doors.push({ o: 'h', c: yB, a: livingW + KIT_W + 0.8, b: livingW + KIT_W + 1.7, swing: 'down' });
  }
  doors.push({ o: 'v', c: kitchen.x, a: yB + 0.9, b: D - 0.9, open: true });
  const front: Door = { o: 'h', c: D, a: livingW / 2 - 0.6, b: livingW / 2 + 0.6, front: true };
  doors.push(front);

  const windows: Span[] = [];
  const win = (o: 'h' | 'v', c: number, center: number, len: number) =>
    windows.push({ o, c, a: center - len / 2, b: center + len / 2 });

  if (livingW > 8) {
    win('h', D, livingW * 0.2, 1.6);
    win('h', D, livingW * 0.8, 1.6);
  } else {
    win('h', D, livingW * 0.2, 1.2);
  }

  win('v', 0, yB + BOT_H / 2, 1.6);
  win('h', D, kitchen.x + KIT_W / 2, 1.4);

  for (const r of topRooms) {
    win('h', 0, r.x + r.w / 2, r.type === 'bath' ? 0.9 : 1.6);
  }

  win('v', 0, BR_H / 2, 1.4);

  if (topRooms[topRooms.length - 1].type === 'bed') {
    win('v', W, BR_H / 2, 1.4);
  }

  if (!halfW) {
    win('v', W, yB + BOT_H / 2, 1.2);
  }

  if (halfW) {
    win('h', D, livingW + KIT_W + halfW / 2, 0.7);
  }

  return { W, D, m: house ? 1.2 : 0.4, house, rooms, doors, windows, front, living, kitchen };
}

function wallSegments(L: Layout): Span[] {
  const seen = new Map<string, Span>();
  for (const r of L.rooms) {
    const edges: Span[] = [
      { o: 'h', c: r.y, a: r.x, b: r.x + r.w },
      { o: 'h', c: r.y + r.h, a: r.x, b: r.x + r.w },
      { o: 'v', c: r.x, a: r.y, b: r.y + r.h },
      { o: 'v', c: r.x + r.w, a: r.y, b: r.y + r.h },
    ];
    for (const e of edges) seen.set(`${e.o}${e.c.toFixed(2)}${e.a.toFixed(2)}${e.b.toFixed(2)}`, e);
  }
  return [...seen.values()];
}

function subtract(seg: Span, gaps: Span[]): Span[] {
  let pieces: [number, number][] = [[seg.a, seg.b]];
  for (const g of gaps) {
    if (g.o !== seg.o || Math.abs(g.c - seg.c) > 0.01) continue;
    pieces = pieces.flatMap(([a, b]): [number, number][] => {
      if (g.b <= a || g.a >= b) return [[a, b]];
      const out: [number, number][] = [];
      if (g.a > a) out.push([a, g.a]);
      if (g.b < b) out.push([g.b, b]);
      return out;
    });
  }
  return pieces.map(([a, b]) => ({ o: seg.o, c: seg.c, a, b }));
}

function spanRect(s: Span, t: number, cls = ''): string {
  const c = cls ? ` class="${cls}"` : '';
  return s.o === 'h'
    ? `<rect${c} x="${s.a - t / 2}" y="${s.c - t / 2}" width="${s.b - s.a + t}" height="${t}"/>`
    : `<rect${c} x="${s.c - t / 2}" y="${s.a - t / 2}" width="${t}" height="${s.b - s.a + t}"/>`;
}

const viewBox = (L: Layout) => `${-L.m} ${-L.m} ${L.W + 2 * L.m} ${L.D + 2 * L.m}`;

const FUR = 'class="pv-furn"';
const FIX = 'class="pv-fix"';

function furniture(r: Room, furnished: boolean): string {
  const f: string[] = [];
  const cx = r.x + r.w / 2;
  if (r.type === 'bed' && furnished) {
    const bw = 2.3, bh = 2.7, bx = cx - bw / 2, by = r.y + 1.25;
    f.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="0.15" ${FUR}/>`);
    f.push(`<rect x="${bx + 0.2}" y="${by + 0.15}" width="${bw - 0.4}" height="0.5" rx="0.12" ${FIX}/>`);
    f.push(`<rect x="${bx - 0.65}" y="${by + 0.1}" width="0.5" height="0.5" rx="0.06" ${FUR}/>`);
  }
  if (r.type === 'bath') {
    f.push(`<rect x="${r.x + 0.25}" y="${r.y + 0.25}" width="${Math.min(r.w - 0.5, 2.3)}" height="1.05" rx="0.35" ${FIX}/>`);
    f.push(`<ellipse cx="${r.x + 0.75}" cy="${r.y + r.h - 0.75}" rx="0.32" ry="0.42" ${FIX}/>`);
    f.push(`<rect x="${r.x + r.w - 1.05}" y="${r.y + r.h - 1.1}" width="0.8" height="0.6" rx="0.15" ${FIX}/>`);
  }
  if (r.type === 'half') {
    f.push(`<ellipse cx="${r.x + 0.75}" cy="${r.y + r.h - 0.8}" rx="0.32" ry="0.42" ${FIX}/>`);
    f.push(`<rect x="${r.x + r.w - 1.0}" y="${r.y + r.h - 1.2}" width="0.75" height="0.6" rx="0.15" ${FIX}/>`);
  }
  if (r.type === 'kitchen') {
    f.push(`<rect x="${r.x + 0.2}" y="${r.y + 0.2}" width="${r.w - 0.4}" height="0.75" ${FIX}/>`);
    f.push(`<rect x="${r.x + r.w - 0.95}" y="${r.y + 0.95}" width="0.75" height="${r.h - 2.1}" ${FIX}/>`);
    f.push(`<rect x="${r.x + r.w - 1.05}" y="${r.y + r.h - 1.15}" width="0.85" height="0.95" rx="0.08" ${FUR}/>`);

    for (const [dx, dy] of [[0.55, 0.38], [0.95, 0.38], [0.55, 0.72], [0.95, 0.72]]) {
      f.push(`<circle cx="${r.x + 0.5 + dx}" cy="${r.y + dy}" r="0.13" class="pv-burner"/>`);
    }

    if (furnished) {
      f.push(`<rect x="${r.x + 0.7}" y="${r.y + 2.1}" width="1.6" height="1.2" rx="0.15" ${FUR}/>`);
    }
  }
  if (r.type === 'living' && furnished) {
    const sx = r.x + 0.6;
    f.push(`<rect x="${sx - 0.2}" y="${r.y + 1.5}" width="${Math.min(4.2, r.w - 1.2)}" height="2.4" rx="0.2" class="pv-rug"/>`);
    f.push(`<rect x="${sx}" y="${r.y + r.h - 1.6}" width="${Math.min(3.4, r.w - 1.6)}" height="1" rx="0.25" ${FUR}/>`);
    f.push(`<rect x="${sx + 0.8}" y="${r.y + 2.2}" width="1.4" height="0.8" rx="0.15" ${FIX}/>`);
  }
  return f.join('');
}

function roomLabel(r: Room): string {
  const fs = Math.min(0.5, (r.w - 0.5) / (r.label.length * 0.66));
  const y =
    r.type === 'bed' || r.type === 'living' ? r.y + 0.8
    : r.type === 'kitchen' ? r.y + r.h / 2 + 0.6
    : r.y + r.h / 2 + 0.15;
  const x = r.type === 'kitchen' ? r.x + (r.w - 0.95) / 2 : r.x + r.w / 2;
  return `<text class="pv-label" x="${x}" y="${y}" text-anchor="middle" font-size="${fs}">${r.label}</text>`;
}

function doorSwings(L: Layout): string {
  return L.doors
    .filter((d) => !d.open && !d.front)
    .map((d) => {
      const w = d.b - d.a;
      const dir = d.swing === 'down' ? 1 : -1;
      return `<path class="pv-swing" d="M${d.a} ${d.c} L${d.a} ${d.c + dir * w} A${w} ${w} 0 0 ${dir < 0 ? 1 : 0} ${d.b} ${d.c}"/>`;
    })
    .join('');
}

export function floorSVG(L: Layout, furnished: boolean): string {
  const { W, D, m } = L;
  let s = `<svg viewBox="${viewBox(L)}" preserveAspectRatio="none" aria-hidden="true">`;
  if (L.house) {
    s += `<rect class="pv-grass" x="${-m}" y="${-m}" width="${W + 2 * m}" height="${D + 2 * m}" rx="0.3"/>`;
    const shrubs: [number, number, number][] = [
      [-m + 0.55, -m + 0.55, 0.38], [W + m - 0.6, -m + 0.6, 0.45], [-m + 0.6, D + m - 0.6, 0.42], [W + m - 0.65, D + m - 0.55, 0.36],
    ];
    for (const [x, y, r] of shrubs) s += `<circle class="pv-shrub" cx="${x}" cy="${y}" r="${r}"/>`;
    const fx = (L.front.a + L.front.b) / 2;
    s += `<rect class="pv-path" x="${fx - 0.55}" y="${D}" width="1.1" height="${m}"/>`;
  } else {
    s += `<rect class="pv-slab" x="${-m}" y="${-m}" width="${W + 2 * m}" height="${D + 2 * m}" rx="0.2"/>`;
  }
  L.rooms.forEach((r, i) => {
    s += `<g class="pv-room pv-enter" style="animation-delay:${i * 45}ms">`;
    s += `<rect class="pv-floor pv-floor--${r.type}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`;
    s += furniture(r, furnished);
    if (r.type !== 'hall') s += roomLabel(r);
    s += `</g>`;
  });
  return s + doorSwings(L) + `</svg>`;
}

export function wallLayerSVG(L: Layout, i: number): string {
  const isCap = i === LAYERS - 1;
  const inWindowBand = i >= 3 && i <= LAYERS - 3;
  const gaps: Span[] = inWindowBand ? [...L.doors, ...L.windows] : L.doors;
  let s = `<svg viewBox="${viewBox(L)}" preserveAspectRatio="none" class="${isCap ? 'pv-cap' : 'pv-side'}" aria-hidden="true">`;
  for (const seg of wallSegments(L)) for (const piece of subtract(seg, gaps)) s += spanRect(piece, WALL_T);
  if (inWindowBand) L.windows.forEach((w, n) => (s += spanRect(w, WALL_T * 0.35, `pv-glass pv-w${n}`)));
  if (isCap) L.windows.forEach((w, n) => (s += spanRect(w, WALL_T * 0.9, `pv-winmark pv-w${n}`)));
  return s + `</svg>`;
}
