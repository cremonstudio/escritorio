// Painel de chat com um funcionário (clicar nele abre). As respostas vêm do OpenBot, pelo servidor do escritório.
const TITULOS = { helena: "Prospecção", sobrinho: "Prévias", tio: "Qualidade" };

export function criarChatBot({ rede, conta, online }) {
  const painel = document.createElement("aside");
  painel.className = "chatbot";
  painel.innerHTML = `<header><div><b></b><small></small></div><button type="button" aria-label="Fechar">×</button></header>
    <div class="aviso" hidden></div><div class="msgs"></div>
    <form><input maxlength="2000" placeholder="Escreva para o funcionário" autocomplete="off"><button>Enviar</button></form>`;
  document.body.append(painel);
  const $ = (s) => painel.querySelector(s);
  const msgs = $(".msgs"), aviso = $(".aviso"), campo = $("input"), form = $("form");
  let bot = null, esperando = false;

  const add = (de, texto) => {
    const d = document.createElement("div");
    d.className = `m ${de}`;
    d.textContent = texto;
    msgs.append(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  };
  const digitando = (sim) => {
    msgs.querySelector(".m.dig")?.remove();
    if (sim) add("bot dig", "digitando…");
  };
  const travar = (motivo) => {
    aviso.hidden = !motivo;
    aviso.textContent = motivo ?? "";
    campo.disabled = form.querySelector("button").disabled = Boolean(motivo);
  };

  painel.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Escape") fechar();
  });
  painel.addEventListener("pointerdown", (e) => e.stopPropagation());
  $("header button").onclick = fechar;
  function fechar() {
    painel.classList.remove("on");
    bot = null;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = campo.value.trim();
    if (!texto || esperando || !bot) return;
    campo.value = "";
    add("eu", texto);
    esperando = true;
    digitando(true);
    rede.enviar("chatbot", { bot: bot.id, texto });
  });

  rede?.on("chatbot", (m) => {
    if (!bot || m.bot !== bot.id) return;
    if (m.tipo === "historico") {
      msgs.innerHTML = "";
      if (!m.conta) travar("Entre com a sua conta (não como visitante) para conversar com o OpenBot.");
      else if (!m.ligado) travar("O OpenBot não está conectado a este escritório ainda.");
      else travar(null);
      if (!m.msgs.length && m.conta) add("bot", `Oi! Aqui é ${bot.nome}. Se for a primeira vez, me manda "link" + o código do OpenBot para a gente se conectar.`);
      for (const x of m.msgs) add(x.de, x.texto);
    } else if (m.tipo === "texto") {
      digitando(false);
      add("bot", m.texto);
      digitando(true);
    } else if (m.tipo === "fim") {
      digitando(false);
      esperando = false;
    } else if (m.tipo === "erro") {
      digitando(false);
      add("erro", m.texto);
      esperando = false;
    }
  });

  return {
    abrir(b) {
      bot = { id: b.id, nome: b.nome };
      $("header b").textContent = b.nome;
      $("header small").textContent = `${TITULOS[b.id] ?? ""} · conversa com o OpenBot`;
      msgs.innerHTML = "";
      painel.classList.add("on");
      if (!online) {
        travar("O escritório está no modo solo. O chat com o OpenBot precisa do escritório ligado e da sua conta.");
        return;
      }
      rede.enviar("chatbot", { bot: b.id, abrir: true });
      setTimeout(() => campo.focus(), 60);
    },
  };
}
