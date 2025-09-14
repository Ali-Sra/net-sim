
import { Topology } from './model.js';
import { initPaletteHandlers } from './drag.js';
import { saveTopology, loadLatestTopology } from './api.js';
import { initWiring, drawAllLinks } from './wire.js';

let topo = new Topology({ name:'untitled', nodes:[], links:[] });
const $ = s => document.querySelector(s);
const status = (msg, ok=true) => {
  const el = $('#status'); el.textContent = msg; el.style.color = ok ? '#09ad59' : '#d33';
  setTimeout(()=> el.textContent = '', 2500);
};

export function initApp() {
  // هندل پالت
  initPaletteHandlers(
    // onCreate
    (node) => {
      topo.nodes.push(node);
      drawAllLinks(topo); // ensure links re-render on new nodes
    },
    // onMove
    ({ id, x, y }) => {
      const n = topo.nodes.find(n => n.id === id);
      if (n) { n.x = x; n.y = y; }
      drawAllLinks(topo); // update link positions while dragging
    }
  );

  // wiring
  initWiring(topo);

  // Controls
  $('#saveBtn').addEventListener('click', async () => {
    topo.name = $('#topoName').value || 'untitled';
    try {
      await saveTopology(topo);
      status('ذخیره شد ✅');
    } catch (e) {
      status('ذخیره نشد ❌', false);
    }
  });

  $('#loadBtn').addEventListener('click', async () => {
    try {
      const loaded = await loadLatestTopology();
      topo = new Topology(loaded);
      // Rebuild nodes visually
      const nodesLayer = document.getElementById('nodes');
      nodesLayer.innerHTML = '';
      const evt = new Event('drop'); // dummy to access builder in drag.js not needed now

      // simple rebuild using same builder logic via synthetic drag is heavy; instead create invisible palette builder:
      // We'll just re-create DOM nodes matching saved positions:
      topo.nodes.forEach(n => {
        // create minimal DOM group matching drag.js expectations
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('node');
        g.setAttribute('data-id', n.id);
        g.setAttribute('transform', `translate(${n.x},${n.y})`);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '0'); rect.setAttribute('y', '0');
        rect.setAttribute('width', '100'); rect.setAttribute('height', '50');
        rect.setAttribute('fill', '#eaeaea'); rect.setAttribute('stroke', '#555');

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', '50'); label.setAttribute('y', '30');
        label.setAttribute('text-anchor', 'middle'); label.textContent = (n.type || '').toUpperCase();

        g.appendChild(rect); g.appendChild(label);
        nodesLayer.appendChild(g);
      });

      drawAllLinks(topo);
      $('#topoName').value = topo.name;
      status('بارگذاری شد 📥');
    } catch (e) {
      status('چیزی برای بارگذاری پیدا نشد ❌', false);
      console.warn(e);
    }
  });
}
