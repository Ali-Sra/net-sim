// انواع نود
export const NodeType = { PC: 'pc', SWITCH: 'switch', ROUTER: 'router' };

// مدل نود
export class Node {
  constructor({ id, type, x, y, label = '', ip = '' }) {
    this.id = id; this.type = type; this.x = x; this.y = y;
    this.label = label; this.ip = ip;
  }
}

// مدل لینک
export class Link {
  constructor({ id, a, b }) { this.id = id; this.a = a; this.b = b; }
}

// توپولوژی
export class Topology {
  constructor({ name = 'unnamed', nodes = [], links = [] }) {
    this.name = name; this.nodes = nodes; this.links = links;
  }
  toJSON() { return { name: this.name, nodes: this.nodes, links: this.links }; }
}