import { Topology } from './model.js';
import { initPaletteHandlers } from './drag.js';
import { saveTopology, loadLatestTopology } from './api.js';

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
    (node) => { topo.nodes.push(node); },
    // onMove
    (id, x, y) => {
      const n = topo.nodes.find(n => n.id === id);
      if (n) { n.x = x; n.y = y; }
    }
  );

  // ذخیره
  $('#saveBtn').addEventListener('click', async () => {
    const name = $('#topoName').value.trim() || 'untitled';
    topo.name = name;
    try {
      await saveTopology(topo);
      status('ذخیره شد ✅');
    } catch (e) {
      status('خطا در ذخیره ❌', false);
      console.error(e);
    }
  });

  // بارگذاری آخرین
  $('#loadBtn').addEventListener('click', async () => {
    try {
      const data = await loadLatestTopology();
      // پاک‌سازی بوم
      document.getElementById('nodes').innerHTML = '';
      topo = new Topology({ name: data.name, nodes:[], links:[] });

      // رندر دوباره نودها
      const { buildNode } = await import('./drag.js');
      for (const n of data.nodes) {
        const created = buildNode(n.type, n.x, n.y, (id, x, y) => {
          const tnode = topo.nodes.find(nn => nn.id === id);
          if (tnode) { tnode.x = x; tnode.y = y; }
        });
        // حفظ id/label اصلی
        created.id = n.id; created.label = n.label; created.ip = n.ip;
        // sync dataset id روی DOM:
        const last = document.getElementById('nodes').lastElementChild;
        if (last) last.setAttribute('data-id', n.id);
        topo.nodes.push(created);
      }
      $('#topoName').value = topo.name;
      status('بارگذاری شد 📥');
    } catch (e) {
      status('چیزی برای بارگذاری پیدا نشد ❌', false);
      console.warn(e);
    }
  });
}