export const FALAS = {
    convitePing: {
        helena: ["{b}, bora um ping-pong? Preciso esfriar a cabeça.", "{b}, uma partidinha? Acabei de mandar um monte de mensagem.", "Ô {b}, ping-pong? Prometo não deixar você ganhar."],
        sobrinho: ["{b}, ping-pong. Agora. Tô invicto hoje.", "{b}, bora uma melhor de cinco? Subi uma prévia e mereço.", "Partidinha, {b}? Juro que dessa vez eu não falo da rede."],
        tio: ["{b}, vamos ver se o seu saque passa no portão.", "{b}, ping-pong. Quem perder revisa o checklist do outro.", "Uma partida, {b}. Rápida. Tenho prévia pra reprovar."],
        padrao: ["{b}, bora um ping-pong?", "Partidinha, {b}?"],
    },
    aceita: {
        helena: ["Bora! Só deixa eu responder esse lead.", "Fechou. Mas é rapidinho, hein.", "Vamos! Tava precisando."],
        sobrinho: ["Bora. Vou te amassar.", "Já é. Pega a raquete.", "Fechou, mas eu saco primeiro."],
        tio: ["Aceito. Com regra, hein.", "Vamos. Sem chororô depois.", "Pode ser. Cinco minutos."],
        padrao: ["Bora!", "Fechou."],
    },
    recusa: {
        helena: ["Agora não dá, {b}. Tô no meio de um lote.", "Depois do almoço, prometo. Tô com três leads respondendo."],
        sobrinho: ["Agora não, {b}, tô exportando uma prévia.", "Me dá dez minutos que eu termino esse topo e vou."],
        tio: ["Não. Tenho dezessete itens pra conferir.", "Depois. Tem prévia reprovada esperando conserto."],
        padrao: ["Agora não dá.", "Depois, pode ser?"],
    },
    provocaPing: {
        helena: ["Pode sacar, que eu tô aquecida.", "Valendo o café de amanhã."],
        sobrinho: ["Treinei a semana inteira no intervalo do render.", "Esse saque eu tirei de referência do Awwwards."],
        tio: ["Vou anotar cada erro seu.", "Saque baixo, bola na mesa. Simples."],
        padrao: ["Valendo!", "Pode vir."],
    },
    ponto: {
        padrao: ["Essa foi na rede, hein.", "Que bola!", "{placar}. Tá apertado.", "Opa, essa pegou na quina.", "{placar}. Respira.", "Saque de quem sabe.", "Ih, essa foi pra fora."],
    },
    ganhou: {
        helena: ["Ganhei! Vou contar pra todo mundo no grupo.", "Fechei a partida igual fecho call."],
        sobrinho: ["Invicto. Pode printar.", "GG. Na próxima eu jogo com a esquerda."],
        tio: ["Aprovado. Raro, mas aprovado.", "Ganhei. Item por item."],
        padrao: ["Ganhei!", "Boa partida."],
    },
    perdeu: {
        helena: ["Perdi, mas foi por pouco.", "Tá, essa foi sua. Revanche amanhã."],
        sobrinho: ["A mesa tá torta, certeza.", "Perdi porque tava pensando na prévia."],
        tio: ["Reprovado. Eu, no caso.", "Perdi. Vou abrir um item novo no checklist: saque."],
        padrao: ["Perdi.", "Essa foi sua."],
    },
    revanche: { padrao: ["Revanche?", "Amanhã tem revanche.", "Melhor de três na sexta."] },
    conviteSinuca: {
        helena: ["{b}, sinuca? Cinco minutinhos.", "{b}, me ensina a jogar sinuca direito?"],
        sobrinho: ["{b}, uma sinuca rapidinha?", "Sinuca, {b}? Tô travado num layout."],
        tio: ["{b}, sinuca. Eu quebro.", "Vamos ver sua mira, {b}."],
        padrao: ["Sinuca?"],
    },
    tacadaBoa: { padrao: ["Caçapa!", "Essa foi bonita.", "Na mosca.", "Duas de uma vez!"] },
    tacadaRuim: { padrao: ["Errei feio.", "Bateu e voltou.", "Quase.", "Essa não foi."] },
    tapa: {
        tio: ["Não é possível!", "Reprovada essa tacada!", "Tá de brincadeira."],
        sobrinho: ["Aaah, que raiva!", "Essa era fácil!"],
        helena: ["Não acredito!", "Poxa vida!"],
        padrao: ["Não é possível!"],
    },
    fimSinuca: { padrao: ["Boa. Voltando pro trabalho.", "Valeu o jogo.", "Chega por hoje, bora trabalhar."] },
    cafeSolo: {
        helena: ["Café antes do próximo lote.", "Terceiro café do dia. Ninguém conta."],
        sobrinho: ["Café pra aguentar o render.", "Um café e volto pro Framer."],
        tio: ["Café. Sem açúcar, como deve ser.", "Pausa de dois minutos. Cronometrada."],
        padrao: ["Hora do café."],
    },
    conviteCafe: { padrao: ["{b}, um café?", "Café, {b}?", "{b}, bora um cafezinho?"] },
    papoLeve: {
        padrao: [
            "Viu o tempo hoje? Parece que vai chover.|Tomara, tá um calor.",
            "Dormiu bem?|Mais ou menos. Sonhei com layout.",
            "Esse café tá forte hoje.|Tá ótimo, isso sim.",
            "Já almoçou?|Ainda não. Tô pensando em pedir alguma coisa.",
            "Sexta tem happy hour?|Se o Mateus liberar, tem.",
            "Alguém mexeu na minha caneca.|Não fui eu. Juro.",
        ],
    },
    abreVisita: {
        helena: ["E aí, {b}, tudo certo?", "{b}, tem um minuto?"],
        sobrinho: ["{b}, olha isso aqui rapidinho.", "Fala, {b}!"],
        tio: ["{b}. Um minuto.", "{b}, preciso falar com você."],
        padrao: ["E aí, {b}?"],
    },
    perguntaTarefa: {
        helena: ["Como tá {tarefaB}?", "E {tarefaB}, andou?"],
        sobrinho: ["Me conta, como ficou {tarefaB}?", "Terminou {tarefaB}?"],
        tio: ["Qual o status de {tarefaB}?", "{tarefaB}. Já conferiu tudo?"],
        padrao: ["Como tá {tarefaB}?"],
    },
    respondeTarefa: {
        helena: ["Andando! Hoje foi {tarefa}.", "Fechei {tarefa}. Agora é esperar resposta."],
        sobrinho: ["Quase. Tô fechando {tarefa}.", "Subi {tarefa}. Ficou bonito, vai."],
        tio: ["Fiz {tarefa}. Teve item reprovado, claro.", "Terminei {tarefa}. Detalhado."],
        padrao: ["Tô em {tarefa}."],
    },
    respondeSemTarefa: {
        helena: ["Tô organizando a lista de amanhã.", "Calmo hoje. Respondendo quem voltou."],
        sobrinho: ["Tô caçando referência nova.", "Estudando um site do Framer que achei."],
        tio: ["Revisando o checklist. Sempre dá pra apertar.", "Esperando prévia nova pra conferir."],
        padrao: ["Tranquilo por aqui."],
    },
    reage: {
        helena: ["Boa! Me avisa se precisar de mim.", "Show. Qualquer coisa, chama."],
        sobrinho: ["Massa. Depois me mostra.", "Top. Bora que bora."],
        tio: ["Certo. Vou conferir depois.", "Anotado."],
        padrao: ["Boa!"],
    },
    abreDaily: {
        tio: ["Daily. Rápida e objetiva.", "Bom dia. Status de cada um, sem enrolação."],
        padrao: ["Bom dia, pessoal! Daily rapidinha."],
    },
    statusDaily: {
        helena: ["Ontem: {tarefa}. Hoje sigo nos retornos.", "Eu fiz {tarefa}. Hoje mais leads."],
        sobrinho: ["Eu fiz {tarefa}. Hoje mais prévia.", "{tarefa} saiu. Hoje ajusto o que voltar do portão."],
        tio: ["Eu: {tarefa}. Hoje sigo no portão.", "{tarefa}. Ninguém passa sem os dezessete itens."],
        padrao: ["Eu tô em {tarefa}."],
    },
    statusDailySemTarefa: { padrao: ["Hoje sigo no que ficou de ontem.", "Sem novidade, sigo na fila."] },
    fechaDaily: { padrao: ["Bora trabalhar!", "Fechou. Bom dia pra todo mundo.", "Daily encerrada."] },
    interrompido: { padrao: ["Opa, chegou gente. Depois a gente continua.", "Peraí, tenho visita. Volto já."] },
};
const recentes = [];
/** Sorteia uma fala da persona (ou a padrão), evitando repetir as últimas 30. */
export function fala(cat, persona, vars = {}) {
    const banco = FALAS[cat];
    const lista = banco[persona] ?? banco.padrao;
    const opcoes = lista.filter((f) => !recentes.includes(f));
    const escolhida = (opcoes.length ? opcoes : lista)[Math.floor(Math.random() * (opcoes.length || lista.length))];
    recentes.push(escolhida);
    if (recentes.length > 30)
        recentes.shift();
    return escolhida.replace(/\{(\w+)\}/g, (_m, k) => vars[k] ?? "");
}
//# sourceMappingURL=falas.js.map