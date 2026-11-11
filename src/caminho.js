// Grade de passagem e A* (8 direções, sem cortar quina).
import { LARGURA, ALTURA, celula } from "./planta.js";

export class Grade {
  constructor() {
    this.livre = new Uint8Array(LARGURA * ALTURA);
    for (let y = 0; y < ALTURA; y++)
      for (let x = 0; x < LARGURA; x++) this.livre[y * LARGURA + x] = celula(x, y) === "#" ? 0 : 1;
  }
  pode(x, y) {
    return x >= 0 && y >= 0 && x < LARGURA && y < ALTURA && this.livre[y * LARGURA + x] === 1;
  }
  /** Bloqueia o retângulo de um móvel (em metros, centro e tamanho). */
  bloquear(cx, cz, w, d, valor = 0) {
    for (let y = Math.floor(cz - d / 2 + 0.3); y <= Math.floor(cz + d / 2 - 0.3); y++)
      for (let x = Math.floor(cx - w / 2 + 0.3); x <= Math.floor(cx + w / 2 - 0.3); x++)
        if (x >= 0 && y >= 0 && x < LARGURA && y < ALTURA) this.livre[y * LARGURA + x] = valor;
  }
  maisPerto(x, y) {
    if (this.pode(x, y)) return [x, y];
    for (let r = 1; r < 6; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) if (this.pode(x + dx, y + dy)) return [x + dx, y + dy];
    return [x, y];
  }
  caminho(de, para) {
    const [sx, sy] = this.maisPerto(Math.floor(de[0]), Math.floor(de[1]));
    const [tx, ty] = this.maisPerto(Math.floor(para[0]), Math.floor(para[1]));
    const chave = (x, y) => y * LARGURA + x;
    const g = new Map([[chave(sx, sy), 0]]);
    const veio = new Map();
    const aberto = [[sx, sy, Math.hypot(tx - sx, ty - sy)]];
    const fechado = new Set();
    while (aberto.length) {
      aberto.sort((a, b) => a[2] - b[2]);
      const [x, y] = aberto.shift();
      const k = chave(x, y);
      if (x === tx && y === ty) {
        const pontos = [[x + 0.5, y + 0.5]];
        let c = k;
        while (veio.has(c)) {
          c = veio.get(c);
          pontos.unshift([(c % LARGURA) + 0.5, Math.floor(c / LARGURA) + 0.5]);
        }
        return pontos;
      }
      if (fechado.has(k)) continue;
      fechado.add(k);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!this.pode(nx, ny)) continue;
        if (dx && dy && (!this.pode(x + dx, y) || !this.pode(x, y + dy))) continue;
        const nk = chave(nx, ny);
        const custo = g.get(k) + (dx && dy ? 1.414 : 1);
        if (custo < (g.get(nk) ?? Infinity)) {
          g.set(nk, custo);
          veio.set(nk, k);
          aberto.push([nx, ny, custo + Math.hypot(tx - nx, ty - ny)]);
        }
      }
    }
    return null;
  }
}
