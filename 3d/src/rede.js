// Conexão com o servidor do escritório (WebSocket). Sem servidor, o jogo roda sozinho (modo solo).
export function urlDoServidor() {
  const param = new URLSearchParams(location.search).get("servidor");
  if (param) return param;
  // GitHub Pages e arquivo local não têm servidor: modo solo
  if (location.protocol === "file:" || location.hostname.endsWith("github.io") || location.hostname === "escritorio.cremonstudio.com") return null;
  return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
}

export function conectar(url, prazo = 3000) {
  return new Promise((ok) => {
    if (!url) return ok(null);
    let ws;
    try {
      ws = new WebSocket(url);
    } catch {
      return ok(null);
    }
    const desistir = setTimeout(() => {
      ws.close();
      ok(null);
    }, prazo);
    ws.onerror = () => {
      clearTimeout(desistir);
      ok(null);
    };
    ws.onopen = () => {
      clearTimeout(desistir);
      ok(new Rede(ws));
    };
  });
}

class Rede {
  constructor(ws) {
    this.ws = ws;
    this.ouvintes = new Map();
    ws.onmessage = (e) => {
      let m;
      try {
        m = JSON.parse(e.data);
      } catch {
        return;
      }
      for (const fn of this.ouvintes.get(m.t) ?? []) fn(m);
    };
    ws.onclose = () => for_each(this.ouvintes.get("caiu"), (fn) => fn());
  }
  on(tipo, fn) {
    if (!this.ouvintes.has(tipo)) this.ouvintes.set(tipo, []);
    this.ouvintes.get(tipo).push(fn);
  }
  enviar(t, dados = {}) {
    if (this.ws.readyState === 1) this.ws.send(JSON.stringify({ t, ...dados }));
  }
}

function for_each(lista, fn) {
  for (const x of lista ?? []) fn(x);
}
