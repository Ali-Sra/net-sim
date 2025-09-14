import { Node, NodeType } from './model.js';

const stage = () => document.getElementById('stage');
const nodesLayer = () => document.getElementById('nodes');

let nodeSeq = 0;
const snap = (n, step=10) => Math.round(n / step) * step;

function mousePos(evt) {
  const svg = stage();
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function colors(type) {
  if (type === NodeType.PC) return { fill:'#d8ecff', stroke:'#2b6cff' };
  if (type === NodeType.SWITCH) return { fill:'#e8ffd8', stroke:'#2b6cff' };
  return { fill:'#ffe8d8', stroke:'#2b6cff' }; // router
}

// ساخت شکل SVG برای نود (بدون عکس)
function nodeGlyph(type, labelText) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.classList.add('node');

  const { fill, stroke } = colors(type);

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x','0'); rect.setAttribute('y','0');
  rect.setAttribute('width','120'); rect.setAttribute('height','72');
  rect.setAttribute('fill', fill); rect.setAttribute('stroke', stroke); rect.setAttribute('stroke-width','2');

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x','12'); label.setAttribute('y','42');
  label.textContent = labelText;

  const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  badge.setAttribute('x','12'); badge.setAttribute('y','20'); badge.setAttribute('class','badge');
  badge.textContent = type.toUpperCase();

  g.appendChild(rect); g.appendChild(badge); g.appendChild(label);
  return g;
}

// API داخلی برای ساخت نود روی بوم
export function buildNode(type, x, y, onMove) {
  const id = `n-${++nodeSeq}`;
  const label = type === 'pc' ? `PC${nodeSeq}` : type === 'switch' ? `SW${nodeSeq}` : `R${nodeSeq}`;
  const g = nodeGlyph(type, label);
  g.setAttribute('data-id', id);
  g.setAttribute('data-type', type);
  g.setAttribute('transform', `translate(${x},${y})`);
  enableDrag(g, onMove);
  nodesLayer().appendChild(g);
  return new Node({ id, type, x, y, label });
}

let dragging = null;
function enableDrag(g, onMove) {
  g.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const pos = mousePos(e);
    const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(g.getAttribute('transform')||'translate(0,0)');
    const curX = parseFloat(m?.[1] ?? 0), curY = parseFloat(m?.[2] ?? 0);
    dragging = { g, dx: pos.x - curX, dy: pos.y - curY };
    g.classList.add('dragging'); g.setPointerCapture(e.pointerId);
  });

  g.addEventListener('pointermove', (e) => {
    if (!dragging || dragging.g !== g) return;
    const pos = mousePos(e);
    const nx = snap(pos.x - dragging.dx), ny = snap(pos.y - dragging.dy);
    g.setAttribute('transform', `translate(${nx},${ny})`);
    if (onMove) {
      const id = g.dataset.id;
      onMove(id, nx, ny);
    }
  });

  g.addEventListener('pointerup', (e) => {
    if (!dragging || dragging.g !== g) return;
    g.classList.remove('dragging'); g.releasePointerCapture(e.pointerId);
    dragging = null;
  });
}

// فعال‌سازی درگ‌دراپ پالت → بوم
export function initPaletteHandlers(onCreate, onMove) {
  document.querySelectorAll('.palette-item').forEach(el => {
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('type', el.dataset.type);
    });
  });

  const svg = stage();
  svg.addEventListener('dragover', (e) => e.preventDefault());
  svg.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    if (!type) return;
    const pt = mousePos(e);
    const nx = snap(pt.x), ny = snap(pt.y);
    const node = buildNode(type, nx, ny, onMove);
    if (onCreate) onCreate(node);
  });
}