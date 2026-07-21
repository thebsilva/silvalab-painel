/* Aba ESTEIRA DE CRIATIVOS — lê window.CRIATIVOS_DATA (criativos_collect.py).
   Método e réguas: silva-co/MODELO-MCP-META.md · fila = posts do IG que nunca
   viraram anúncio. Período: VIDA INTEIRA de cada criativo (o seletor de período
   do painel não se aplica aqui e fica oculto nesta aba).
   Regra de acessibilidade: estado NUNCA é só cor — sempre ícone + rótulo
   (vermelho×âmbar são iguais pra daltônico: ΔE deutan 0,7, medido). */
(function () {
  "use strict";
  const C = window.CRIATIVOS_DATA || null;

  const ESTADOS = {
    aprovado:   { icone: "✔", rotulo: "aprovado",        cor: "var(--green-hi)" },
    graduado:   { icone: "🎓", rotulo: "graduado",        cor: "var(--green-hi)" },
    rodando:    { icone: "▶", rotulo: "rodando",         cor: "var(--cyan-hi)" },
    na_mira:    { icone: "✂", rotulo: "na mira",         cor: "var(--red-hi)" },
    sem_volume: { icone: "◌", rotulo: "sem volume",      cor: "var(--muted-2)" },
    destino:    { icone: "→", rotulo: "direto no destino", cor: "var(--muted)" },
  };
  const ORDEM_ESTEIRA = ["aprovado", "rodando", "na_mira", "sem_volume"];
  const TIPO_MIDIA = { VIDEO: "Reels", CAROUSEL_ALBUM: "Carrossel", IMAGE: "Foto" };

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fR$ = (v) => v == null ? "—" :
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const fPct = (v) => v == null ? "—" :
    new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(v) + "%";
  const fInt = (v) => v == null ? "—" : new Intl.NumberFormat("pt-BR").format(v);
  const fData = (s) => { const [y, m, d] = (s || "").split("-"); return d ? `${d}/${m}/${y.slice(2)}` : "—"; };
  const diasAtras = (s) => {
    if (!s) return null;
    const dias = Math.floor((Date.now() - new Date(s + "T12:00:00Z")) / 864e5);
    return dias <= 0 ? "hoje" : dias === 1 ? "ontem" : `há ${dias} dias`;
  };

  let cliSel = null;
  try { cliSel = localStorage.getItem("cri_cliente"); } catch (e) {}

  function badge(estado) {
    const e = ESTADOS[estado] || ESTADOS.sem_volume;
    return `<span class="cri-badge" style="--sc:${e.cor}"><i>${e.icone}</i>${e.rotulo}</span>`;
  }

  function barra(gasto, regua, checkpoint, cor) {
    const pct = Math.min(100, gasto / regua * 100);
    const tick = Math.min(100, checkpoint / regua * 100);
    const estouro = gasto > regua * 1.05
      ? `<b class="cri-estouro">${(gasto / regua).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}× a régua</b>` : "";
    return `<div class="cri-barra" title="checkpoint ${fR$(checkpoint)} · régua ${fR$(regua)}">
      <i class="cri-tick" style="left:${tick}%"></i>
      <b style="width:${pct}%;background:${cor}"></b></div>${estouro}`;
  }

  /* ── leitura rápida: narra as decisões, não despeja números ── */
  function leituraRapida(c) {
    const fr = [];
    const nome = (x) => `“${esc(x.nome.length > 52 ? x.nome.slice(0, 52) + "…" : x.nome)}”`;
    const teste = c.criativos.filter(x => ORDEM_ESTEIRA.includes(x.estado));
    c.criativos.filter(x => x.estado === "aprovado").forEach(x =>
      fr.push(`<b class="ok">✔ ${nome(x)}</b> bateu a régua (${fR$(x.gasto_teste)} · CTR ${fPct(x.ctr)}${x.custo_visita ? ` · ${fR$(x.custo_visita)}/visita` : ""}) — <b>decidir graduação</b>.`));
    c.criativos.filter(x => x.estado === "na_mira").forEach(x =>
      fr.push(`<b class="mira">✂ ${nome(x)}</b> venceu o checkpoint com CTR ${fPct(x.ctr)} (corte ${fPct(c.corte_ctr)}) — candidato a corte.`));
    teste.filter(x => x.estado === "rodando" && x.falta_para_regua <= c.regua * 0.25).forEach(x =>
      fr.push(`⏳ ${nome(x)} a <b>${fR$(x.falta_para_regua)}</b> da régua (CTR ${fPct(x.ctr)}).`));
    const ct = c.campanha_teste;
    if (ct && !ct.ativa) {
      fr.push(`⏸ Janela de teste <b>pausada</b> (estratégia de verba — normal). Fila pronta: <b>${c.fila.filter(f => !f.sazonal).length} posts</b> nunca anunciados.`);
    } else if (c.fila_dias != null) {
      fr.push(c.fila_dias > 21
        ? `🐌 Fila lenta: ~<b>${c.fila_dias} dias</b> pra cada criativo fechar a régua (${c.testando_agora} testando ao mesmo tempo). Menos criativos por vez = veredito mais rápido.`
        : `▶ Janela ativa: ${c.testando_agora} em teste, ~${c.fila_dias} dias por régua.`);
    }
    if (!fr.length) fr.push("Sem decisão pendente na esteira — acompanhar a fila e a próxima janela.");
    return fr;
  }

  function cardCriativo(x, c) {
    const e = ESTADOS[x.estado] || ESTADOS.sem_volume;
    const ctrOk = x.ctr != null ? x.ctr >= c.corte_ctr : null;
    const linhas = [
      `<span><b>${fR$(x.gasto_teste)}</b> de ${fR$(c.regua)}${x.falta_para_regua > 0 ? ` · falta ${fR$(x.falta_para_regua)}` : ""}</span>`,
      x.ctr != null ? `<span title="corte ${fPct(c.corte_ctr)}">CTR <b>${fPct(x.ctr)}</b> ${ctrOk ? "✓" : "✗"}</span>` : "",
      x.custo_visita != null ? `<span><b>${fR$(x.custo_visita)}</b>/visita</span>` : "",
      x.freq != null ? `<span title="frequência só condena em público FRIO — veja o ad set">freq <b>${x.freq.toLocaleString("pt-BR")}</b>${x.adset_teste ? ` <i class="cri-aset">(${esc(x.adset_teste)})</i>` : ""}</span>` : "",
    ].filter(Boolean).join("");
    const avisoAdset = x.adset_pausado ? `<span class="cri-aviso" title="anúncio ativo dentro de ad set desligado: não gasta nada">⚠ ad set desligado</span>` : "";
    const vivo = x.ativo_teste ? "" : `<span class="cri-off">pausado</span>`;
    const ig = x.ig ? `<a class="cri-ver" href="${esc(x.ig.permalink)}" target="_blank" rel="noopener">post ↗</a>` : "";
    return `<div class="cri-item">
      <div class="cri-topo">${badge(x.estado)}<span class="cri-nome" title="${esc(x.nome)}">${esc(x.nome)}</span>${vivo}${avisoAdset}${ig}</div>
      ${barra(x.gasto_teste, c.regua, c.checkpoint, e.cor)}
      <div class="cri-nums">${linhas}</div>
    </div>`;
  }

  function cardFila(f) {
    return `<a class="cri-post" href="${esc(f.permalink)}" target="_blank" rel="noopener">
      <div class="cri-post-meta"><b>${TIPO_MIDIA[f.media_type] || f.product_type || "Post"}</b>
        <span>${diasAtras(f.timestamp) || ""}</span>
        <span class="cri-eng">♥ ${fInt(f.likes)} · 💬 ${fInt(f.comments)}</span></div>
      <p>${esc(f.caption_curta)}</p>
      <span class="cri-abrir">testar este ↗</span></a>`;
  }

  function renderCliente(c) {
    if (!c.ok) {
      return `<div class="cri-vazio">Coleta do cliente falhou: <code>${esc(c.motivo || "?")}</code>. Roda de novo no próximo ciclo (2h).</div>`;
    }
    const ct = c.campanha_teste;
    const esteira = ORDEM_ESTEIRA.flatMap(e => c.criativos.filter(x => x.estado === e));
    const grad = c.criativos.filter(x => x.estado === "graduado");
    const dest = c.criativos.filter(x => x.estado === "destino");
    const filaViva = c.fila.filter(f => !f.sazonal);
    const RECENTE = 60;
    const ehRecente = (f) => f.timestamp && (Date.now() - new Date(f.timestamp)) / 864e5 <= RECENTE;
    const filaRec = filaViva.filter(ehRecente), filaVelha = filaViva.filter(f => !ehRecente(f));
    const sazonais = c.fila.filter(f => f.sazonal);

    let h = `<div class="cri-cab">
      <div class="cri-reguas" role="note">régua <b>${fR$(c.regua)}</b> · checkpoint <b>${fR$(c.checkpoint)}</b> · corte CTR <b>${fPct(c.corte_ctr)}</b> · verba do cliente <b>${fR$(c.verba_dia)}/dia</b></div>
      ${ct ? `<div class="cri-campteste">campanha de teste: <b>${esc(ct.nome || "?")}</b>
        <span class="cri-status ${ct.ativa ? "on" : "off"}">${ct.ativa ? "● ativa" : "⏸ em janela de pausa"}</span>
        ${ct.verba_dia ? `· ${fR$(ct.verba_dia)}/dia` : ""}</div>` : ""}
    </div>`;

    h += `<div class="hero cri-hero"><div><div class="cri-titulo">Decisões de hoje</div><ul class="cri-frases">` +
      leituraRapida(c).map(f => `<li>${f}</li>`).join("") + `</ul></div></div>`;

    h += `<h2 class="section">Esteira de teste <span class="cnt">${esteira.length} criativo(s) · gasto de vida inteira</span></h2>`;
    h += esteira.length
      ? `<div class="cri-lista">${esteira.map(x => cardCriativo(x, c)).join("")}</div>`
      : `<div class="cri-vazio">Nenhum criativo em teste agora${filaViva.length ? " — a fila abaixo está pronta pra próxima janela" : ""}.</div>`;

    if (grad.length) {
      h += `<h2 class="section">Graduados <span class="cnt">passaram pelo teste e rodam no destino</span></h2>
      <div class="cri-lista">` + grad.map(x => `<div class="cri-item">
        <div class="cri-topo">${badge("graduado")}<span class="cri-nome" title="${esc(x.nome)}">${esc(x.nome)}</span>
          ${x.ativo_destino ? `<span class="cri-status on">● no destino</span>`
            : x.gasto_destino > 0 ? `<span class="cri-off">destino pausado</span>`
            : `<span class="cri-off">entrando no destino</span>`}
          ${x.ig ? `<a class="cri-ver" href="${esc(x.ig.permalink)}" target="_blank" rel="noopener">post ↗</a>` : ""}</div>
        <div class="cri-nums"><span>teste <b>${fR$(x.gasto_teste)}</b>${x.ctr != null ? ` · CTR ${fPct(x.ctr)}` : ""}${x.custo_visita ? ` · ${fR$(x.custo_visita)}/visita` : ""}</span>
        <span>${x.gasto_destino > 0
          ? `destino <b>${fR$(x.gasto_destino)}</b>${x.conversas_destino
              ? ` · ${fInt(x.conversas_destino)} conversas a <b>${fR$(x.custo_conversa_destino)}</b>`
              : x.custo_conversa_campanha != null
                ? ` · campanha a <b>${fR$(x.custo_conversa_campanha)}</b>/conversa` : ""}`
          : `recém-subido ao destino — sem gasto ainda`}</span></div>
      </div>`).join("") + `</div>`;
    }

    h += `<h2 class="section">Fila do Instagram <span class="cnt">nunca viraram anúncio — o estoque da próxima janela</span></h2>`;
    h += filaRec.length
      ? `<div class="cri-fila">${filaRec.map(cardFila).join("")}</div>`
      : `<div class="cri-vazio">Nenhum post novo sem anúncio nos últimos ${RECENTE} dias${filaVelha.length ? " — só o estoque antigo abaixo" : ""}. <b>Sem post novo, a esteira seca.</b></div>`;
    if (filaVelha.length)
      h += `<details class="cri-mais"><summary>estoque mais antigo (${filaVelha.length})</summary><div class="cri-fila">${filaVelha.map(cardFila).join("")}</div></details>`;
    if (sazonais.length)
      h += `<details class="cri-mais"><summary>sazonais vencidos (${sazonais.length}) — reaproveitar só na próxima data</summary><div class="cri-fila">${sazonais.map(cardFila).join("")}</div></details>`;

    if (dest.length) {
      h += `<details class="cri-mais"><summary>Direto no destino, sem passar pelo teste (${dest.length})</summary>
      <div class="table-wrap"><table><thead><tr><th style="text-align:left">Criativo</th><th>Gasto destino</th><th>Conversas</th><th>Custo/conversa</th><th>Status</th></tr></thead><tbody>` +
        dest.map(x => `<tr><td style="text-align:left" title="${esc(x.nome)}">${esc(x.nome.slice(0, 70))}</td>
          <td>${fR$(x.gasto_destino)}</td><td>${fInt(x.conversas_destino) || "—"}</td>
          <td>${x.custo_conversa_destino != null ? fR$(x.custo_conversa_destino)
               : x.custo_conversa_campanha != null ? `${fR$(x.custo_conversa_campanha)} <span title="agregado da campanha — a Meta não devolve por criativo aqui">(camp.)</span>` : "—"}</td>
          <td>${x.ativo_destino ? "● ativo" : "pausado"}</td></tr>`).join("") +
        `</tbody></table></div></details>`;
    }
    if (c.nao_rastreaveis && c.nao_rastreaveis.length) {
      const tot = c.nao_rastreaveis.reduce((s, x) => s + x.gasto, 0);
      h += `<details class="cri-mais"><summary>⚠ fora do padrão de nome (${c.nao_rastreaveis.length} · ${fR$(tot)}) — não rastreáveis pela legenda</summary>
        <p class="cri-nota">Nome de anúncio ≠ copy da legenda quebra o rastreio (Seção 5 do MODELO). A fila acima pode conter posts que já rodaram sob um destes nomes:</p>
        <div class="table-wrap"><table><tbody>` +
        c.nao_rastreaveis.map(x => `<tr><td style="text-align:left">${esc(x.nome.slice(0, 80))}</td><td>${fR$(x.gasto)}</td></tr>`).join("") +
        `</tbody></table></div></details>`;
    }
    return h;
  }

  window.renderCriativosTab = function (mount) {
    if (!C || !Array.isArray(C.clientes) || !C.clientes.length) {
      mount.innerHTML = `<div class="cri-vazio" style="margin-top:20px">A esteira ainda não coletou (roda no ciclo de 2h — <code>criativos_collect.py</code>).</div>`;
      return;
    }
    const clientes = C.clientes;
    if (!cliSel || !clientes.some(c => c.client === cliSel)) cliSel = clientes[0].client;
    const quando = (C.gerado_em || "").replace("T", " ").slice(0, 16);
    mount.innerHTML = `<div class="cri-wrap">
      <div class="controls" style="margin-top:14px">
        <div class="seg" id="criSeg">` +
        clientes.map(c => `<button data-c="${esc(c.client)}" class="${c.client === cliSel ? "on" : ""}">${esc(c.client)}${c.ok === false ? " ⚠" : ""}</button>`).join("") +
        `</div><span class="cri-quando">período: vida inteira de cada criativo · coletado ${esc(quando)} UTC</span>
      </div><div id="criBody">${renderCliente(clientes.find(c => c.client === cliSel))}</div></div>`;
    mount.querySelectorAll("#criSeg button").forEach(b => {
      b.onclick = () => {
        cliSel = b.dataset.c;
        try { localStorage.setItem("cri_cliente", cliSel); } catch (e) {}
        window.renderCriativosTab(mount);
      };
    });
  };
})();
