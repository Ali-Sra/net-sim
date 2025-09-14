
import { Node, NodeType } from './model.js';
import { drawAllLinks } from './wire.js';

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
  switch (type) {
    case NodeType.PC: return { fill:'#eaf4ff', stroke:'#2b6cff' };
    case NodeType.SWITCH: return { fill:'#fff8e6', stroke:'#f39c12' };
    case NodeType.ROUTER: return { fill:'#fceaea', stroke:'#e74c3c' };
    default: return { fill:'#eee', stroke:'#999' };
  }
}

function buildNode(type, x, y, onMove) {
  const id = 'N' + (++nodeSeq);
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.classList.add('node');
  g.setAttribute('data-id', id);
  g.setAttribute('transform', `translate(${x},${y})`);

  const { fill, stroke } = colors(type);
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '0'); rect.setAttribute('y', '0');
  rect.setAttribute('width', '100'); rect.setAttribute('height', '50');
  rect.setAttribute('fill', fill); rect.setAttribute('stroke', stroke);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', '50'); label.setAttribute('y', '30');
  label.setAttribute('text-anchor', 'middle'); label.textContent = type.toUpperCase();

  g.appendChild(rect); g.appendChild(label);
  nodesLayer().appendChild(g);

  // drag move
  let dragging = false, sx=0, sy=0, ox=x, oy=y;
  g.addEventListener('mousedown', (e) => { dragging = true; g.classList.add('dragging'); sx=e.clientX; sy=e.clientY; });
  window.addEventListener('mouseup', () => { if (dragging){ dragging=false; g.classList.remove('dragging'); } });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    const nx = snap(ox + dx), ny = snap(oy + dy);
    g.setAttribute('transform', `translate(${nx},${ny})`);
    if (onMove) onMove({ id, x:nx, y:ny });
  });

  return new Node({ id, type, x, y, label:type.toUpperCase() });
}

export function initPaletteHandlers(onCreate, onMove) {
  // draggable from aside
  document.querySelectorAll('.palette-item[draggable="true"]').forEach(el => {
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
