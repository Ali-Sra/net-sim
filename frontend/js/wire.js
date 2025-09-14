
import { CableType, Link } from './model.js';

const stage = () => document.getElementById('stage');
const nodesLayer = () => document.getElementById('nodes');
const linksLayer = () => document.getElementById('links');

let currentCable = CableType.AUTO;
let srcNodeId = null;
let tempLine = null;
let topoRef = null;

function getNodeCenter(g) {
  const tr = g.getAttribute('transform') || '';
  const m = /translate\(([-\d.]+)[ ,]([-\d.]+)\)/.exec(tr);
  const x = m ? parseFloat(m[1]) : 0;
  const y = m ? parseFloat(m[2]) : 0;
  // node box size is 100x50 in drag.js; take center
  return { x: x + 50, y: y + 25 };
}

function lineStyle(el, type) {
  el.setAttribute('stroke-width', '3');
  el.setAttribute('fill', 'none');
  switch (type) {
    case CableType.COPPER: el.setAttribute('stroke', '#f39c12'); break;    // orange
    case CableType.CROSS:  el.setAttribute('stroke', '#e74c3c'); el.setAttribute('stroke-dasharray', '8 6'); break; // red dashed
    case CableType.FIBER:  el.setAttribute('stroke', '#2980b9'); break;    // blue
    case CableType.SERIAL: el.setAttribute('stroke', '#27ae60'); el.setAttribute('stroke-dasharray', '4 4'); break; // green dotted
    default:               el.setAttribute('stroke', '#7f8c8d');           // gray (auto)
  }
}

function makeTempLine(x1,y1,x2,y2,type) {
  if (!tempLine) {
    tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tempLine.setAttribute('data-temp', '1');
    linksLayer().appendChild(tempLine);
  }
  tempLine.setAttribute('x1', x1); tempLine.setAttribute('y1', y1);
  tempLine.setAttribute('x2', x2); tempLine.setAttribute('y2', y2);
  tempLine.removeAttribute('stroke-dasharray');
  lineStyle(tempLine, type);
}

function removeTemp() {
  if (tempLine && tempLine.parentNode) tempLine.parentNode.removeChild(tempLine);
  tempLine = null;
}

function activeButton(btn) {
  document.querySelectorAll('.cable-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

export function initWiring(topo) {
  topoRef = topo;

  // wire tool buttons
  document.querySelectorAll('[data-cable]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCable = btn.dataset.cable;
      activeButton(btn);
      // reset any half-started wire
      srcNodeId = null; removeTemp();
    });
  });

  // node click-to-connect
  nodesLayer().addEventListener('click', (e) => {
    const g = e.target.closest('g.node');
    if (!g) return;
    const nid = g.getAttribute('data-id');
    if (!srcNodeId) {
      srcNodeId = nid;
      const c = getNodeCenter(g);
      makeTempLine(c.x, c.y, c.x, c.y, currentCable);
    } else if (srcNodeId && srcNodeId !== nid) {
      // finalize link
      const id = 'L' + Date.now() + Math.random().toString(36).slice(2,7);
      const link = new Link({ id, a: srcNodeId, b: nid, type: currentCable });
      topoRef.links.push(link);
      removeTemp();
      srcNodeId = null;
      drawAllLinks(topoRef);
    } else {
      // clicked same node -> cancel
      srcNodeId = null; removeTemp();
    }
  });

  // follow mouse for temp line
  stage().addEventListener('mousemove', (e) => {
    if (!tempLine || !srcNodeId) return;
    const g = document.querySelector(`g.node[data-id="${srcNodeId}"]`);
    if (!g) return;
    const a = getNodeCenter(g);
    const pt = stage().createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(stage().getScreenCTM().inverse());
    makeTempLine(a.x, a.y, p.x, p.y, currentCable);
  });
}

export function drawAllLinks(topo) {
  const layer = linksLayer();
  // clear
  while (layer.firstChild) layer.removeChild(layer.firstChild);

  topo.links.forEach(link => {
    const aEl = document.querySelector(`g.node[data-id="${link.a}"]`);
    const bEl = document.querySelector(`g.node[data-id="${link.b}"]`);
    if (!aEl || !bEl) return;
    const a = getNodeCenter(aEl); const b = getNodeCenter(bEl);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('data-link-id', link.id);
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    lineStyle(line, link.type);
    layer.appendChild(line);
  });
}
