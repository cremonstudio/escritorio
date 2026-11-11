const DADOS = {"gids": {"vazio": [[2956]], "sinuca.parada": [[2957, 2958, 2959, 2960], [2973, 2974, 2975, 2976]], "sinuca.espalhada": [[2961, 2962, 2963, 2964], [2977, 2978, 2979, 2980]], "sinuca.pulando1": [[2965, 2966, 2967, 2968], [2981, 2982, 2983, 2984]], "sinuca.pulando2": [[2988, 2989, 2990, 2991], [3004, 3005, 3006, 3007]], "estouro": [[2992, 2993], [3008, 3009]], "pingpong": [[2994, 2995, 2996], [3010, 3011, 3012]], "bolinha.esq": [[2997]], "bolinha.dir": [[2998]], "porta.fechada": [[2999, 3000], [3015, 3016]], "porta.aberta": [[3001, 3002], [3017, 3018]], "tapete.logo": [[3020, 3021, 3022, 3023, 3024, 3025, 3026], [3036, 3037, 3038, 3039, 3040, 3041, 3042]], "mesa.mateus": [[3027, 3028, 3029], [3043, 3044, 3045]], "estante.led": [[3030, 3031], [3046, 3047]], "cadeira.mateus": [[3032]], "quadro": [[3033]], "tv.painel": [[3052, 3053, 3054], [3068, 3069, 3070]], "vapor.1": [[3055]], "vapor.2": [[3056]], "placa.prospeccao": [[3057, 3058, 3059]], "placa.previas": [[3060, 3061, 3062]], "placa.qualidade": [[3063, 3064, 3065]], "placa.design": [[3084, 3085, 3086]], "placa.reuniao": [[3087, 3088, 3089]], "placa.copa": [[3090, 3091, 3092]], "placa.mural": [[3093, 3094, 3095]], "placa.recepcao": [[3096, 3097, 3098]], "placa.lazer": [[3100, 3101, 3102]]}, "parede": 479, "colide": 3, "sinuca": {"x": 25, "y": 26}, "ping": {"x": 31, "y": 26}, "porta": {"x": 6, "y": 10}, "cafe": {"x": 29, "y": 3}};
"use strict";
/// <reference types="@workadventure/iframe-api-typings" />
(() => {
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
    function pintar(peca, layer, x0, y0) {
        const tiles = [];
        DADOS.gids[peca].forEach((linha, j) => linha.forEach((g, i) => tiles.push({ x: x0 + i, y: y0 + j, tile: g, layer })));
        WA.room.setTiles(tiles);
    }
    function apagar(layer, x0, y0, w, h) {
        const tiles = [];
        for (let j = 0; j < h; j++)
            for (let i = 0; i < w; i++)
                tiles.push({ x: x0 + i, y: y0 + j, tile: null, layer });
        WA.room.setTiles(tiles);
    }
    function tocar(nome, volume = 0.8) {
        try {
            WA.sound.loadSound(`sons/${nome}.wav`).play({ volume, loop: false, rate: 1, detune: 0, delay: 0, seek: 0, mute: false });
        }
        catch {
            // som é enfeite: sem ele, a animação segue
        }
    }
    // ------------------------------------------------------------ efeitos (sincronizados)
    let estadoSinuca = "sinuca.parada";
    let dentroDaSala = false;
    const EFEITOS = {
        async tapa() {
            const { x, y } = DADOS.sinuca;
            tocar("tapa", 1);
            pintar("estouro", "fx", x + 1, y - 1);
            for (const quadro of ["sinuca.pulando1", "sinuca.pulando2", "sinuca.pulando1", "sinuca.pulando2"]) {
                pintar(quadro, "sinuca", x, y);
                await esperar(90);
            }
            pintar(estadoSinuca, "sinuca", x, y);
            await esperar(450);
            apagar("fx", x + 1, y - 1, 2, 2);
        },
        async tacada() {
            const { x, y } = DADOS.sinuca;
            tocar("tacada");
            pintar("sinuca.pulando2", "sinuca", x, y);
            await esperar(80);
            estadoSinuca = "sinuca.espalhada";
            pintar(estadoSinuca, "sinuca", x, y);
        },
        arrumar() {
            tocar("clack", 0.5);
            estadoSinuca = "sinuca.parada";
            pintar(estadoSinuca, "sinuca", DADOS.sinuca.x, DADOS.sinuca.y);
        },
        async saque(d) {
            const { x, y } = DADOS.ping;
            const caminho = [];
            for (let c = 0; c < 3; c++)
                caminho.push([c, "bolinha.esq"], [c, "bolinha.dir"]);
            const volta = [...caminho].reverse();
            const rally = 3 + Math.floor(Number(d.semente ?? Math.random()) * 5);
            for (let r = 0; r < rally; r++) {
                for (const [c, peca] of r % 2 ? volta : caminho) {
                    pintar(peca, "fx", x + c, y);
                    await esperar(45);
                    apagar("fx", x + c, y, 1, 1);
                }
                tocar("toc", 0.7);
            }
            if (d.quem === WA.player.uuid) {
                // Só quem sacou soma o ponto, para não contar em dobro.
                const [a, b] = String(WA.state.loadVariable("placarPingPong") ?? "0x0").split("x").map(Number);
                const ganhouA = rally % 2 === 0;
                await WA.state.saveVariable("placarPingPong", `${(a ?? 0) + (ganhouA ? 1 : 0)}x${(b ?? 0) + (ganhouA ? 0 : 1)}`);
            }
        },
        async cafe() {
            const { x, y } = DADOS.cafe;
            tocar("cafe", 0.6);
            for (let i = 0; i < 10; i++) {
                pintar(i % 2 ? "vapor.2" : "vapor.1", "fx", x, y);
                await esperar(220);
            }
            apagar("fx", x, y, 1, 1);
        },
        bater(d) {
            tocar("batida", dentroDaSala ? 1 : 0.4);
            if (!dentroDaSala)
                return;
            const popup = WA.ui.openPopup("popup-sala", `${String(d.nome ?? "Alguém")} bateu na porta.`, [
                { label: "Agora não", className: "normal", callback: (p) => p.close() },
                {
                    label: "Deixar entrar",
                    className: "primary",
                    callback: (p) => {
                        p.close();
                        void abrirPorta(12_000);
                    },
                },
            ]);
            setTimeout(() => popup.close(), 15_000);
        },
    };
    const vistos = new Set();
    function efeito(acao, dados = {}, espalhar = true) {
        const id = String(dados.id ?? `${WA.player.uuid}-${Date.now()}-${Math.random()}`);
        if (vistos.has(id))
            return;
        vistos.add(id);
        const completo = { ...dados, acao, id };
        if (espalhar)
            void WA.event.broadcast("fx", completo);
        void EFEITOS[acao]?.(completo);
    }
    window.cremonFx = (acao, dados) => efeito(acao, dados);
    // ------------------------------------------------------------ porta da sua sala
    function desenharPorta(aberta) {
        const { x, y } = DADOS.porta;
        const tiles = [];
        for (let i = 0; i < 2; i++)
            tiles.push({ x: x + i, y, tile: aberta ? null : DADOS.parede, layer: "porta" });
        WA.room.setTiles(tiles);
        // A passagem: a colisão da porta vive na camada "porta-colisao" (trocar tile de colisão não pega).
        if (aberta)
            WA.room.hideLayer("porta-colisao");
        else
            WA.room.showLayer("porta-colisao");
        pintar(aberta ? "porta.aberta" : "porta.fechada", "porta", x, y + 1);
    }
    async function abrirPorta(fecharEm) {
        await WA.state.saveVariable("portaMateus", "aberta");
        if (fecharEm)
            setTimeout(() => void WA.state.saveVariable("portaMateus", "fechada"), fecharEm);
    }
    // ------------------------------------------------------------ áreas
    function aoChegar(area, mensagem, acao) {
        let aviso;
        WA.room.area.onEnter(area).subscribe(() => {
            const texto = mensagem();
            if (texto)
                aviso = WA.ui.displayActionMessage({ message: texto, callback: acao });
        });
        WA.room.area.onLeave(area).subscribe(() => {
            aviso?.remove();
            aviso = undefined;
        });
    }
    WA.onInit().then(async () => {
        const portaAberta = () => WA.state.loadVariable("portaMateus") === "aberta";
        desenharPorta(portaAberta());
        WA.state.onVariableChange("portaMateus").subscribe((v) => {
            desenharPorta(v === "aberta");
            tocar("porta", 0.5);
        });
        WA.event.on("fx").subscribe((ev) => {
            const d = ev.data;
            if (typeof d?.acao === "string")
                efeito(d.acao, d, false);
        });
        WA.room.area.onEnter("sala-mateus").subscribe(() => (dentroDaSala = true));
        WA.room.area.onLeave("sala-mateus").subscribe(() => (dentroDaSala = false));
        let popupSinuca;
        aoChegar("sinuca", () => "Espaço: jogar sinuca", () => {
            popupSinuca?.close();
            popupSinuca = WA.ui.openPopup("popup-sinuca", "Sinuca", [
                { label: "Arrumar", className: "normal", callback: () => efeito("arrumar") },
                { label: "Tacada", className: "primary", callback: () => efeito("tacada") },
                { label: "Tapa na mesa", className: "warning", callback: () => efeito("tapa") },
            ]);
        });
        WA.room.area.onLeave("sinuca").subscribe(() => popupSinuca?.close());
        aoChegar("pingpong", () => "Espaço: sacar", () => efeito("saque", { quem: WA.player.uuid, semente: Math.random() }));
        WA.state.onVariableChange("placarPingPong").subscribe((placar) => {
            const p = WA.ui.openPopup("popup-pingpong", `Placar do ping-pong: ${String(placar).replace("x", " x ")}`, []);
            setTimeout(() => p.close(), 2_500);
        });
        aoChegar("cafe", () => "Espaço: pegar um café", () => efeito("cafe"));
        aoChegar("mural", () => "Espaço: abrir o painel do estúdio", () => WA.nav.openTab("https://painel.cremonstudio.com"));
        aoChegar("porta-mateus", () => (portaAberta() ? null : "Espaço: bater na porta"), () => efeito("bater", { nome: WA.player.name }));
        aoChegar("porta-dentro", () => (portaAberta() ? "Espaço: fechar a porta" : "Espaço: abrir a porta"), () => void WA.state.saveVariable("portaMateus", portaAberta() ? "fechada" : "aberta"));
    });
})();
