// ============================================================================
// ObraClara — Telas
// ============================================================================

var PAGES = [
  {id:'hoje',        label:'Hoje',        icon:'hoje'},
  {id:'cronograma',  label:'Cronograma',  icon:'cronograma'},
  {id:'financeiro',  label:'Financeiro',  icon:'financeiro'},
  {id:'caixa',       label:'Caixa',       icon:'caixa'},
  {id:'simulador',   label:'Simulador',   icon:'simulador'},
  {id:'restricoes',  label:'Restrições',  icon:'restricoes'},
];
var currentPage = 'hoje';

function renderNav(){
  document.getElementById('nav').innerHTML = PAGES.map(function(p){
    return '<a class="nav-item '+(currentPage===p.id?'active':'')+'" onclick="navigate(\''+p.id+'\')" href="#">'+
      svg(p.icon)+'<span class="nav-label">'+p.label+'</span></a>';
  }).join('');
}
function navigate(page){
  currentPage = page;
  renderNav();
  renderPage();
  closeSidebar();
  window.scrollTo(0,0);
  document.getElementById('headerTitle').textContent = PAGES.find(function(p){return p.id===page}).label + ' · Maternidade Porte I';
}
function openSidebar(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
  document.body.style.overflow='';
}

function renderPage(){
  var c = document.getElementById('content');
  switch(currentPage){
    case 'hoje': c.innerHTML = renderHoje(); break;
    case 'cronograma': c.innerHTML = renderCronograma(); break;
    case 'financeiro': c.innerHTML = renderFinanceiro(); break;
    case 'caixa': c.innerHTML = renderCaixa(); break;
    case 'simulador': c.innerHTML = renderSimulador(); initSimulador(); break;
    case 'restricoes': c.innerHTML = renderRestricoes(); break;
  }
}

// ============================================================================
// KPI BAR — os 4 números, no topo de toda tela
// ============================================================================
function kpiBar(){
  var p = projecao();
  var ritmoTone = p.ritmoReal === 0 ? '' : p.ritmoUsado >= CONTRATO.metaMDia ? 'ok' : p.ritmoUsado >= MODELO_PLANO.breakEvenTotalMDia ? 'warn' : 'danger';
  var prazoTone = p.metrosRealizados === 0 || p.atrasoDias == null ? '' : p.atrasoDias <= 0 ? 'ok' : p.atrasoDias <= 7 ? 'warn' : 'danger';
  var resTone = p.resultadoProjetado >= MODELO_PLANO.resultado*0.9 ? 'ok' : p.resultadoProjetado >= 0 ? 'warn' : 'danger';

  var temApontamento = p.metrosRealizados > 0;
  var prazoTxt = temApontamento && p.dataProjetada ? fmtDate(p.dataProjetada) : '—';
  var prazoNote = !temApontamento ? 'aguardando 1º apontamento'
    : p.atrasoDias == null ? ''
    : p.atrasoDias <= 0 ? Math.abs(p.atrasoDias) + ' dias de folga vs. contrato'
    : p.atrasoDias + ' dias além do prazo pedido';

  return '<div class="kpi-bar">'+
    '<div class="kpi-tile '+ritmoTone+'"><div class="k-label">Ritmo (média 7 dias)</div>'+
      '<div class="k-value">'+(p.ritmoReal>0?fmtN(p.ritmoReal):'—')+' m/dia</div>'+
      '<div class="k-note">meta '+CONTRATO.metaMDia+' · equilíbrio '+fmtN(MODELO_PLANO.breakEvenTotalMDia)+'</div></div>'+
    '<div class="kpi-tile '+prazoTone+'"><div class="k-label">Término projetado</div>'+
      '<div class="k-value" style="font-size:17px">'+prazoTxt+'</div>'+
      '<div class="k-note">'+prazoNote+'</div></div>'+
    '<div class="kpi-tile '+resTone+'"><div class="k-label">Resultado projetado</div>'+
      '<div class="k-value">'+fmt(p.resultadoProjetado)+'</div>'+
      '<div class="k-note">plano: '+fmt(MODELO_PLANO.resultado)+' ('+fmtPct(MODELO_PLANO.margemPct)+')</div></div>'+
    '<div class="kpi-tile"><div class="k-label">Avanço físico</div>'+
      '<div class="k-value">'+fmtPct(p.pctFisico)+'</div>'+
      '<div class="k-note">'+fmtN(p.metrosRealizados)+' de '+fmtN(CONTRATO.metros)+' m</div></div>'+
  '</div>';
}

function fraseHoje(){
  var p = projecao();
  if(p.metrosRealizados === 0){
    return '<div class="kpi-frase">Nenhum apontamento ainda. Lance a produção de hoje para o painel começar a projetar ritmo, prazo e resultado.</div>';
  }
  var diff = MODELO_PLANO.resultado - p.resultadoProjetado;
  var diffTxt = diff > 500 ? ('−'+fmt(diff)+' vs. plano') : diff < -500 ? ('+'+fmt(-diff)+' vs. plano') : 'em linha com o plano';
  return '<div class="kpi-frase">Ritmo dos últimos dias: <strong>'+fmtN(p.ritmoReal)+' m/dia</strong>. '+
    'No ritmo atual a obra termina em <strong>'+fmtDate(p.dataProjetada)+'</strong> e fecha com <strong>'+fmt(p.resultadoProjetado)+'</strong> ('+diffTxt+').</div>';
}

// ============================================================================
// TELA 1 — HOJE
// ============================================================================
function renderHoje(){
  var ord = producaoOrdenada().slice().reverse().slice(0,10);

  return '<div class="page-header"><div><h1 class="page-title">Hoje</h1><p class="page-sub">Apontamento diário — leva 30 segundos</p></div></div>'+
    kpiBar() + fraseHoje() +
    '<div class="card" style="margin-bottom:16px">'+
      '<div class="card-title" style="margin-bottom:12px">Lançar produção de hoje</div>'+
      '<div class="form-grid cols2">'+
        '<div class="fgroup"><label>Data</label><input type="date" id="p-data" value="'+todayStr()+'"></div>'+
        '<div class="fgroup"><label>Lote</label><select id="p-lote">'+CONTRATO.lotes.map(function(l){return '<option value="'+l.id+'">'+l.codigo+'</option>'}).join('')+'</select></div>'+
        '<div class="fgroup"><label>Metros produzidos</label><input type="number" step="0.1" id="p-metros" placeholder="Ex: 285"></div>'+
        '<div class="fgroup"><label>Peças</label><input type="number" id="p-pecas" placeholder="Ex: 78"></div>'+
        '<div class="fgroup"><label>Efetivo (pessoas)</label><input type="number" id="p-efetivo" placeholder="Ex: 6"></div>'+
        '<div class="fgroup"><label>m³ de concreto recebido</label><input type="number" step="0.1" id="p-m3" placeholder="Ex: 12"></div>'+
        '<div class="fgroup"><label>Nº de viagens (concreto)</label><input type="number" id="p-viagens" placeholder="Ex: 2"></div>'+
        '<div class="fgroup" style="grid-column:1/-1"><label>Ocorrência (opcional)</label><input type="text" id="p-obs" placeholder="Ex: chuva à tarde, parou 2h"></div>'+
      '</div>'+
      '<button class="btn btn-primary" onclick="salvarProducao()">'+svg('plus',16,16)+' Salvar apontamento</button>'+
    '</div>'+
    '<div class="card">'+
      '<div class="card-title" style="margin-bottom:10px">Últimos apontamentos</div>'+
      (ord.length===0 ? '<div class="empty">'+svg('truck')+'<p>Nenhum apontamento lançado ainda.</p></div>' :
      '<div class="table-wrap"><table><thead><tr><th>Data</th><th>Lote</th><th class="n">Metros</th><th class="n">Peças</th><th class="n">Efetivo</th><th class="n">m³</th><th></th></tr></thead><tbody>'+
        ord.map(function(p){
          var lote = CONTRATO.lotes.find(function(l){return l.id===p.loteId});
          return '<tr><td>'+fmtDate(p.data)+'</td><td>'+(lote?lote.codigo:'—')+'</td><td class="n">'+fmtN(p.metros,1)+'</td><td class="n">'+(p.pecas||'—')+'</td><td class="n">'+(p.efetivo||'—')+'</td><td class="n">'+(p.m3||'—')+'</td>'+
            '<td><button class="btn-icon" onclick="excluirProducao(\''+p.id+'\')">'+svg('trash',15,15)+'</button></td></tr>';
        }).join('')+
      '</tbody></table></div>')+
    '</div>';
}

function salvarProducao(){
  var metros = parseFloat(document.getElementById('p-metros').value);
  if(!metros || metros<=0){ toast('Informe os metros produzidos'); return; }
  var data = document.getElementById('p-data').value || todayStr();
  var reg = {
    id: uid(),
    data: data,
    loteId: document.getElementById('p-lote').value,
    metros: metros,
    pecas: parseInt(document.getElementById('p-pecas').value)||0,
    efetivo: parseInt(document.getElementById('p-efetivo').value)||0,
    m3: parseFloat(document.getElementById('p-m3').value)||0,
    viagens: parseInt(document.getElementById('p-viagens').value)||0,
    obs: document.getElementById('p-obs').value||'',
  };
  STATE.producao.push(reg);
  if(!STATE.config.dataInicio || data < STATE.config.dataInicio) STATE.config.dataInicio = data;
  persist();
  toast('Apontamento salvo');
  renderPage();
}
function excluirProducao(id){
  STATE.producao = STATE.producao.filter(function(p){return p.id!==id});
  persist();
  renderPage();
}

// ============================================================================
// TELA 2 — CRONOGRAMA
// ============================================================================
function renderCronograma(){
  var p = projecao();

  // curva S simplificada em % por "mês de obra" (meses do plano contratual)
  var meses = Math.max(3, Math.ceil(MODELO_PLANO.mesesNecessarios)+1);
  var linhas = [];
  for(var i=1;i<=meses;i++){
    var prevPct = Math.min(100, (i / MODELO_PLANO.mesesNecessarios) * 100);
    linhas.push({mes:'Mês '+i, prev: prevPct});
  }
  // realizado: distribui metros realizados proporcionalmente ao tempo decorrido (aprox simples, mês corrente)
  var mesAtual = STATE.config.dataInicio ? Math.max(1, Math.ceil((new Date()-parseDate(STATE.config.dataInicio))/(30.4*864e5))) : 0;

  return '<div class="page-header"><div><h1 class="page-title">Cronograma</h1><p class="page-sub">Curva de produção — previsto × realizado × projetado</p></div></div>'+
    kpiBar() +
    '<div class="card" style="margin-bottom:16px">'+
      '<div class="card-title" style="margin-bottom:14px">Curva S — % do contrato (em metros)</div>'+
      '<div class="bar-chart">'+
        linhas.map(function(l,idx){
          var real = (idx+1)<=mesAtual ? Math.min(100, p.pctFisico) : null;
          return '<div class="bar-row"><span class="bar-label">'+l.mes+'</span><div class="bar-track">'+
            '<div class="bar-fill bar-expected" style="width:'+l.prev+'%"></div>'+
            (real!==null?'<div class="bar-fill bar-actual" style="width:'+real+'%"></div>':'')+
            '</div><span class="bar-value">'+(real!=null?fmtN(real,0)+'%':'—')+'</span></div>';
        }).join('')+
      '</div>'+
      '<div class="legend-row">'+
        '<span><i style="background:rgba(45,106,79,.18)"></i>Previsto (plano contratual)</span>'+
        '<span><i style="background:var(--primary)"></i>Realizado</span>'+
      '</div>'+
    '</div>'+
    '<div class="grid-2">'+
      '<div class="card">'+
        '<div class="card-title" style="margin-bottom:10px">Datas</div>'+
        '<div style="display:flex;flex-direction:column;gap:10px;font-size:13px">'+
          '<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">Início da produção</span><b>'+(STATE.config.dataInicio?fmtDate(STATE.config.dataInicio):'ainda não iniciada')+'</b></div>'+
          '<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">Prazo pedido (3 meses)</span><b>'+(p.dataFimContratual?fmtDate(p.dataFimContratual):'—')+'</b></div>'+
          '<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">Término projetado</span><b style="color:'+(p.atrasoDias>0?'var(--danger)':'var(--ok)')+'">'+(p.dataProjetada?fmtDate(p.dataProjetada):'—')+'</b></div>'+
          '<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">Dias úteis restantes</span><b>'+(isFinite(p.diasUteisRestantes)?fmtN(p.diasUteisRestantes,0):'—')+'</b></div>'+
        '</div>'+
      '</div>'+
      '<div class="card">'+
        '<div class="card-title" style="margin-bottom:10px">Avanço por lote</div>'+
        CONTRATO.lotes.map(function(l){
          var real = metrosRealizadosPorLote(l.id);
          var pct = l.metros>0 ? (real/l.metros*100) : 0;
          var tone = pct>=100?'var(--ok)':pct>0?'var(--primary)':'var(--border)';
          return '<div class="lote-row"><div class="lote-head"><b>'+l.codigo+'</b><span class="meta">'+fmtN(real,1)+' / '+fmtN(l.metros,1)+' m</span></div>'+
            '<div class="progress-bar"><div class="fill" style="width:'+Math.min(100,pct)+'%;background:'+tone+'"></div></div></div>';
        }).join('')+
      '</div>'+
    '</div>';
}

// ============================================================================
// TELA 3 — FINANCEIRO
// ============================================================================
function renderFinanceiro(){
  var p = projecao();
  var custosOrdenados = STATE.custos.slice().sort(function(a,b){return a.data<b.data?1:-1});
  var medOrdenadas = STATE.medicoes.slice().sort(function(a,b){return (a.periodo||'')<(b.periodo||'')?1:-1});

  return '<div class="page-header"><div><h1 class="page-title">Financeiro</h1><p class="page-sub">Orçado, comprometido, realizado e projetado</p></div></div>'+
    kpiBar() +
    '<div class="card" style="margin-bottom:16px">'+
      '<div class="card-title" style="margin-bottom:12px">Contrato</div>'+
      '<div class="table-wrap"><table><tbody>'+
        '<tr><td>Valor bruto</td><td class="n">'+fmt(CONTRATO.bruto)+'</td></tr>'+
        '<tr><td>Desconto negociado ('+CONTRATO.descontoPct+'%)</td><td class="n">−'+fmt(CONTRATO.bruto-MODELO_PLANO.liquido)+'</td></tr>'+
        '<tr class="tot"><td>Valor líquido</td><td class="n">'+fmt(MODELO_PLANO.liquido)+'</td></tr>'+
        '<tr><td>Entrada ('+CONTRATO.entradaPct+'%)</td><td class="n">'+fmt(MODELO_PLANO.liquido*CONTRATO.entradaPct/100)+'</td></tr>'+
      '</tbody></table></div>'+
    '</div>'+
    '<div class="card" style="margin-bottom:16px">'+
      '<div class="card-title" style="margin-bottom:12px">Orçado × comprometido × realizado × projetado</div>'+
      '<div class="table-wrap"><table><thead><tr><th>Linha</th><th class="n">Plano (300 m/dia)</th><th class="n">Realizado</th><th class="n">Projetado (EAC)</th></tr></thead><tbody>'+
        '<tr><td>Custo direto (concreto + fábrica)</td><td class="n">'+fmt(MODELO_PLANO.custoDireto)+'</td><td class="n">'+fmt(p.lancado)+'</td><td class="n">—</td></tr>'+
        '<tr><td>Custo total</td><td class="n">'+fmt(MODELO_PLANO.custoTotal)+'</td><td class="n">'+fmt(p.lancado)+'</td><td class="n">'+fmt(p.eac)+'</td></tr>'+
        '<tr class="tot"><td>Resultado</td><td class="n">'+fmt(MODELO_PLANO.resultado)+'</td><td class="n">'+fmt(MODELO_PLANO.liquido-p.lancado)+'</td><td class="n" style="color:'+(p.resultadoProjetado>=0?'var(--ok)':'var(--danger)')+'">'+fmt(p.resultadoProjetado)+'</td></tr>'+
      '</tbody></table></div>'+
      '<div class="k-note" style="margin-top:8px">Projetado = custos já lançados + estimativa do que falta, no ritmo real atual.</div>'+
    '</div>'+

    '<div class="card" style="margin-bottom:16px">'+
      '<div class="card-title" style="margin-bottom:12px">Lançar custo</div>'+
      '<div class="form-grid">'+
        '<div class="fgroup"><label>Data</label><input type="date" id="c-data" value="'+todayStr()+'"></div>'+
        '<div class="fgroup"><label>Categoria</label><input type="text" id="c-cat" list="cat-dl" placeholder="Ex: Concreto, Mão de obra..."><datalist id="cat-dl"><option value="Concreto"></option><option value="Mão de obra"></option><option value="Pátio"></option><option value="Escritório"></option><option value="Combustível"></option><option value="Outros"></option></datalist></div>'+
        '<div class="fgroup"><label>Valor (R$)</label><input type="number" step="0.01" id="c-valor" placeholder="0,00"></div>'+
      '</div>'+
      '<div class="fgroup" style="margin-bottom:10px"><label>Observação</label><input type="text" id="c-obs" placeholder="opcional"></div>'+
      '<button class="btn btn-primary" onclick="salvarCusto()">'+svg('plus',16,16)+' Salvar custo</button>'+
    '</div>'+

    '<div class="card" style="margin-bottom:16px">'+
      '<div class="card-title" style="margin-bottom:10px">Custos lançados</div>'+
      (custosOrdenados.length===0?'<div class="empty">'+svg('financeiro')+'<p>Nenhum custo lançado ainda.</p></div>':
      '<div class="table-wrap"><table><thead><tr><th>Data</th><th>Categoria</th><th>Obs.</th><th class="n">Valor</th><th></th></tr></thead><tbody>'+
        custosOrdenados.map(function(c){
          return '<tr><td>'+fmtDate(c.data)+'</td><td>'+c.categoria+'</td><td style="color:var(--text3)">'+(c.obs||'—')+'</td><td class="n">'+fmt(c.valor)+'</td>'+
            '<td><button class="btn-icon" onclick="excluirCusto(\''+c.id+'\')">'+svg('trash',15,15)+'</button></td></tr>';
        }).join('')+
      '</tbody></table></div>')+
    '</div>'+

    '<div class="card">'+
      '<div class="card-title" style="margin-bottom:12px">Medições</div>'+
      '<div class="form-grid">'+
        '<div class="fgroup"><label>Período</label><input type="text" id="m-periodo" placeholder="Ex: Medição 1"></div>'+
        '<div class="fgroup"><label>Metros medidos</label><input type="number" step="0.1" id="m-metros" placeholder="0"></div>'+
        '<div class="fgroup"><label>Valor líquido (R$)</label><input type="number" step="0.01" id="m-valor" placeholder="0,00"></div>'+
        '<div class="fgroup"><label>Data prevista de pagamento</label><input type="date" id="m-data"></div>'+
        '<div class="fgroup"><label>Status</label><select id="m-status"><option value="prevista">Prevista</option><option value="enviada">Enviada</option><option value="aprovada">Aprovada</option><option value="paga">Paga</option></select></div>'+
      '</div>'+
      '<button class="btn btn-primary" onclick="salvarMedicao()">'+svg('plus',16,16)+' Salvar medição</button>'+
      (medOrdenadas.length>0 ? '<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Período</th><th class="n">Metros</th><th class="n">Valor</th><th>Previsão</th><th>Status</th><th></th></tr></thead><tbody>'+
        medOrdenadas.map(function(m){
          var statusMap={prevista:'badge-neutral',enviada:'badge-blue',aprovada:'badge-warn',paga:'badge-ok'};
          return '<tr><td>'+m.periodo+'</td><td class="n">'+fmtN(m.metros,1)+'</td><td class="n">'+fmt(m.valorLiquido)+'</td><td>'+fmtDate(m.dataPrevista)+'</td><td><span class="badge '+statusMap[m.status]+'">'+m.status+'</span></td>'+
            '<td><button class="btn-icon" onclick="excluirMedicao(\''+m.id+'\')">'+svg('trash',15,15)+'</button></td></tr>';
        }).join('')+'</tbody></table></div>' : '')+
    '</div>';
}

function salvarCusto(){
  var valor = parseFloat(document.getElementById('c-valor').value);
  var cat = document.getElementById('c-cat').value;
  if(!valor || valor<=0 || !cat){ toast('Preencha categoria e valor'); return; }
  STATE.custos.push({id:uid(), data:document.getElementById('c-data').value||todayStr(), categoria:cat, valor:valor, obs:document.getElementById('c-obs').value||''});
  persist(); toast('Custo salvo'); renderPage();
}
function excluirCusto(id){ STATE.custos = STATE.custos.filter(function(c){return c.id!==id}); persist(); renderPage(); }

function salvarMedicao(){
  var valor = parseFloat(document.getElementById('m-valor').value);
  var periodo = document.getElementById('m-periodo').value;
  if(!valor || !periodo){ toast('Preencha período e valor'); return; }
  STATE.medicoes.push({
    id:uid(), periodo:periodo, metros:parseFloat(document.getElementById('m-metros').value)||0,
    valorLiquido:valor, dataPrevista:document.getElementById('m-data').value||null,
    status:document.getElementById('m-status').value,
  });
  persist(); toast('Medição salva'); renderPage();
}
function excluirMedicao(id){ STATE.medicoes = STATE.medicoes.filter(function(m){return m.id!==id}); persist(); renderPage(); }

// ============================================================================
// TELA 4 — CAIXA
// ============================================================================
function renderCaixa(){
  var buckets = projetarCaixa(12);
  var minSaldo = Math.min.apply(null, buckets.map(function(b){return b.saldo}));
  var minIdx = buckets.findIndex(function(b){return b.saldo===minSaldo});
  var maxAbs = Math.max.apply(null, buckets.map(function(b){return Math.max(Math.abs(b.recebe),Math.abs(b.paga))}), 1);

  return '<div class="page-header"><div><h1 class="page-title">Caixa</h1><p class="page-sub">Projeção de 12 semanas — recebimento × desembolso</p></div></div>'+
    kpiBar() +
    (minSaldo<0 ? '<div class="alert danger">'+svg('alert')+'<div><h3>Alerta de furo de caixa</h3><p>O saldo projetado fica negativo na semana '+(minIdx+1)+' ('+fmtDate(buckets[minIdx].dataIni)+'), em '+fmt(minSaldo)+'.</p></div></div>'
      : '<div class="alert" style="border-left-color:var(--ok);background:var(--primary-pale)">'+svg('check')+'<div><h3>Caixa não fica negativo nas 12 semanas</h3><p>Saldo mínimo projetado: '+fmt(minSaldo)+', na semana '+(minIdx+1)+'.</p></div></div>')+
    '<div class="card" style="margin-bottom:16px">'+
      '<div class="card-title" style="margin-bottom:12px">Fluxo semanal</div>'+
      '<div class="bar-chart">'+
        buckets.map(function(b,i){
          var pct = Math.abs(b.recebe-b.paga)/maxAbs*100;
          var cor = (b.recebe-b.paga)>=0?'var(--primary)':'var(--danger)';
          return '<div class="bar-row"><span class="bar-label">S'+(i+1)+'</span><div class="bar-track">'+
            '<div class="bar-fill" style="width:'+Math.min(100,pct)+'%;background:'+cor+'"></div></div>'+
            '<span class="bar-value" style="color:'+(b.saldo<0?'var(--danger)':'var(--text)')+'">'+fmtN(b.saldo/1000,0)+'k</span></div>';
        }).join('')+
      '</div>'+
      '<div class="legend-row"><span><i style="background:var(--primary)"></i>Saldo positivo na semana</span><span><i style="background:var(--danger)"></i>Saldo negativo na semana</span><span style="color:var(--text3)">valores à direita = saldo acumulado (milhares)</span></div>'+
    '</div>'+
    '<div class="card">'+
      '<div class="table-wrap"><table><thead><tr><th>Semana</th><th>Data</th><th class="n">Recebe</th><th class="n">Paga</th><th class="n">Saldo acumulado</th></tr></thead><tbody>'+
        buckets.map(function(b,i){
          return '<tr'+(i===minIdx&&minSaldo<0?' style="background:#FFF2F1"':'')+'><td>S'+(i+1)+'</td><td>'+fmtDate(b.dataIni)+'</td><td class="n" style="color:var(--ok)">'+fmt(b.recebe)+'</td><td class="n" style="color:var(--danger)">'+fmt(b.paga)+'</td><td class="n" style="font-weight:700;color:'+(b.saldo<0?'var(--danger)':'var(--text)')+'">'+fmt(b.saldo)+'</td></tr>';
        }).join('')+
      '</tbody></table></div>'+
    '</div>';
}

// ============================================================================
// TELA 5 — SIMULADOR
// ============================================================================
function renderSimulador(){
  return '<div class="page-header"><div><h1 class="page-title">Simulador</h1><p class="page-sub">Mexa nos parâmetros e veja o resultado em tempo real</p></div></div>'+
    '<div class="card">'+
      '<div class="sim-slider"><div class="sl-head"><span>Ritmo de produção</span><b id="sv-ritmo">300 m/dia</b></div><input type="range" id="s-ritmo" min="100" max="500" step="5" value="300"></div>'+
      '<div class="sim-slider"><div class="sl-head"><span>Desconto negociado</span><b id="sv-desc">18%</b></div><input type="range" id="s-desc" min="0" max="30" step="1" value="18"></div>'+
      '<div class="sim-slider"><div class="sl-head"><span>Custo do concreto (total)</span><b id="sv-conc">'+fmt(CONTRATO.concretoTotal)+'</b></div><input type="range" id="s-conc" min="20000" max="90000" step="1000" value="'+CONTRATO.concretoTotal+'"></div>'+
      '<div class="sim-slider"><div class="sl-head"><span>Custo fixo mensal (fábrica + estrutura)</span><b id="sv-fixo">'+fmt(MODELO_PLANO.custoFixoMensalTotal)+'</b></div><input type="range" id="s-fixo" min="20000" max="90000" step="1000" value="'+MODELO_PLANO.custoFixoMensalTotal+'"></div>'+
      '<div class="sim-result" id="sim-result"></div>'+
    '</div>'+
    '<div class="card" style="margin-top:16px">'+
      '<div class="card-title" style="margin-bottom:8px">Ponto de equilíbrio</div>'+
      '<div id="sim-be" style="font-size:13px;color:var(--text2)"></div>'+
    '</div>';
}

function initSimulador(){
  var $ = function(id){return document.getElementById(id)};
  function recalc(){
    var ritmo = parseFloat($('s-ritmo').value);
    var desc = parseFloat($('s-desc').value);
    var conc = parseFloat($('s-conc').value);
    var fixoTotal = parseFloat($('s-fixo').value);
    // distribui o fixo total mantendo a proporção direto/estrutura original do contrato
    var propDireto = MODELO_PLANO.custoDiretoMensal / MODELO_PLANO.custoFixoMensalTotal;
    var custosFixosSim = [
      {id:'direto', nome:'Direto', valor: fixoTotal*propDireto, grupo:'direto'},
      {id:'estrutura', nome:'Estrutura', valor: fixoTotal*(1-propDireto), grupo:'estrutura'},
    ];
    var m = calcModel({ritmoMDia:ritmo, descontoPct:desc, concretoTotal:conc, custosFixos:custosFixosSim});

    $('sv-ritmo').textContent = ritmo+' m/dia';
    $('sv-desc').textContent = desc+'%';
    $('sv-conc').textContent = fmt(conc);
    $('sv-fixo').textContent = fmt(fixoTotal);

    document.getElementById('sim-result').innerHTML =
      '<div class="sr-item"><div class="l">Prazo</div><div class="v">'+fmtN(m.diasUteisNecessarios,0)+' du</div></div>'+
      '<div class="sr-item"><div class="l">Custo total</div><div class="v">'+fmt(m.custoTotal)+'</div></div>'+
      '<div class="sr-item"><div class="l">Resultado</div><div class="v" style="color:'+(m.resultado>=0?'var(--ok)':'var(--danger)')+'">'+fmt(m.resultado)+'</div></div>'+
      '<div class="sr-item"><div class="l">Margem</div><div class="v" style="color:'+(m.margemPct>=0?'var(--ok)':'var(--danger)')+'">'+fmtPct(m.margemPct)+'</div></div>';

    document.getElementById('sim-be').innerHTML =
      'Equilíbrio total: <b>'+fmtN(m.breakEvenTotalMDia)+' m/dia</b> · Equilíbrio direto (só fábrica): <b>'+fmtN(m.breakEvenDiretoMDia)+' m/dia</b>'+
      (ritmo < m.breakEvenTotalMDia ? '<div style="color:var(--danger);margin-top:6px;font-weight:600">Nesse ritmo a obra não paga a estrutura.</div>' : '');
  }
  ['s-ritmo','s-desc','s-conc','s-fixo'].forEach(function(id){ $(id).addEventListener('input', recalc); });
  recalc();
}

// ============================================================================
// TELA 6 — RESTRIÇÕES
// ============================================================================
function semanaAtualStr(){
  var d = new Date();
  var onejan = new Date(d.getFullYear(),0,1);
  var week = Math.ceil((((d-onejan)/864e5)+onejan.getDay()+1)/7);
  return d.getFullYear()+'-S'+week;
}

function renderRestricoes(){
  var abertas = STATE.restricoes.filter(function(r){return r.status!=='liberada'});
  var liberadas = STATE.restricoes.filter(function(r){return r.status==='liberada'});
  var planoOrd = STATE.planoSemanal.slice().sort(function(a,b){return (a.semana||'')<(b.semana||'')?1:-1});

  var tipoIcon = {ferragem:'Ferragem', concreto:'Concreto', formas:'Formas', projeto:'Projeto', pagamento:'Pagamento', outro:'Outro'};

  return '<div class="page-header"><div><h1 class="page-title">Restrições</h1><p class="page-sub">O que trava a produção da semana — Last Planner enxuto</p></div></div>'+
    kpiBar() +
    '<div class="card" style="margin-bottom:16px">'+
      '<div class="card-title" style="margin-bottom:12px">Nova restrição</div>'+
      '<div class="form-grid">'+
        '<div class="fgroup"><label>Tipo</label><select id="r-tipo">'+Object.keys(tipoIcon).map(function(k){return '<option value="'+k+'">'+tipoIcon[k]+'</option>'}).join('')+'</select></div>'+
        '<div class="fgroup"><label>Responsável</label><input type="text" id="r-resp" placeholder="Ex: Mauricio"></div>'+
        '<div class="fgroup"><label>Prazo</label><input type="date" id="r-prazo"></div>'+
      '</div>'+
      '<div class="fgroup" style="margin-bottom:10px"><label>Descrição</label><input type="text" id="r-desc" placeholder="Ex: Ferragem do lote EST 27 ainda não chegou"></div>'+
      '<button class="btn btn-primary" onclick="salvarRestricao()">'+svg('plus',16,16)+' Adicionar restrição</button>'+
    '</div>'+

    '<div class="card" style="margin-bottom:16px">'+
      '<div class="card-title" style="margin-bottom:10px">Em aberto ('+abertas.length+')</div>'+
      (abertas.length===0 ? '<div class="empty">'+svg('check')+'<p>Nenhuma restrição travando a produção.</p></div>' :
      abertas.map(function(r){
        return '<div class="restr-card '+r.status+'">'+
          '<div class="restr-top"><b>'+tipoIcon[r.tipo]+' — '+r.desc+'</b>'+
            '<select onchange="mudarStatusRestricao(\''+r.id+'\',this.value)" style="border:1px solid var(--border);border-radius:6px;padding:3px 6px;font-size:11px">'+
              '<option value="aberta"'+(r.status==='aberta'?' selected':'')+'>Aberta</option>'+
              '<option value="andamento"'+(r.status==='andamento'?' selected':'')+'>Em andamento</option>'+
              '<option value="liberada"'+(r.status==='liberada'?' selected':'')+'>Liberada</option>'+
            '</select></div>'+
          '<div class="restr-meta"><span>'+svg('clock',13,13)+' '+(r.prazo?fmtDate(r.prazo):'sem prazo')+'</span><span>Resp.: '+(r.responsavel||'—')+'</span>'+
          '<button class="btn-icon" onclick="excluirRestricao(\''+r.id+'\')" style="margin-left:auto">'+svg('trash',14,14)+'</button></div>'+
        '</div>';
      }).join(''))+
    '</div>'+

    (liberadas.length>0 ? '<div class="card" style="margin-bottom:16px"><div class="card-title" style="margin-bottom:10px">Liberadas ('+liberadas.length+')</div>'+
      liberadas.map(function(r){ return '<div class="restr-card liberada"><div class="restr-top"><b>'+tipoIcon[r.tipo]+' — '+r.desc+'</b></div></div>'; }).join('')+
    '</div>' : '')+

    '<div class="card">'+
      '<div class="card-title" style="margin-bottom:12px">PPC semanal — Percentual do Plano Concluído</div>'+
      '<div class="form-grid cols2" style="margin-bottom:10px">'+
        '<div class="fgroup"><label>Semana</label><input type="text" id="pp-semana" value="'+semanaAtualStr()+'"></div>'+
        '<div class="fgroup"><label>Meta (m)</label><input type="number" id="pp-meta" placeholder="Ex: 1500"></div>'+
        '<div class="fgroup" style="grid-column:1/-1"><label>Realizado (m)</label><input type="number" id="pp-real" placeholder="Ex: 1260"></div>'+
      '</div>'+
      '<button class="btn btn-primary" onclick="salvarPlanoSemanal()">'+svg('plus',16,16)+' Salvar semana</button>'+
      (planoOrd.length>0 ? '<div style="margin-top:14px">'+planoOrd.map(function(pl){
        var ppc = pl.metaM>0 ? Math.min(100,(pl.realizadoM/pl.metaM*100)) : 0;
        var tone = ppc>=85?'var(--ok)':ppc>=70?'var(--warn)':'var(--danger)';
        return '<div class="ppc-row"><span class="ppc-week">'+pl.semana+'</span>'+
          '<div class="progress-bar" style="flex:1"><div class="fill" style="width:'+ppc+'%;background:'+tone+'"></div></div>'+
          '<span style="font-family:var(--font-mono);width:50px;text-align:right;color:'+tone+';font-weight:700">'+fmtN(ppc,0)+'%</span>'+
          '<button class="btn-icon" onclick="excluirPlanoSemanal(\''+pl.id+'\')">'+svg('trash',14,14)+'</button></div>';
      }).join('')+'</div>' : '')+
      '<div class="k-note" style="margin-top:10px">Referência lean: PPC 70–85% é obra sob controle; acima de 85% é excelência operacional.</div>'+
    '</div>';
}

function salvarRestricao(){
  var desc = document.getElementById('r-desc').value;
  if(!desc){ toast('Descreva a restrição'); return; }
  STATE.restricoes.push({
    id:uid(), tipo:document.getElementById('r-tipo').value, desc:desc,
    responsavel:document.getElementById('r-resp').value||'', prazo:document.getElementById('r-prazo').value||null,
    status:'aberta', criadaEm:todayStr(),
  });
  persist(); toast('Restrição adicionada'); renderPage();
}
function mudarStatusRestricao(id,status){
  var r = STATE.restricoes.find(function(x){return x.id===id});
  if(r){ r.status = status; persist(); renderPage(); }
}
function excluirRestricao(id){ STATE.restricoes = STATE.restricoes.filter(function(r){return r.id!==id}); persist(); renderPage(); }

function salvarPlanoSemanal(){
  var meta = parseFloat(document.getElementById('pp-meta').value);
  var real = parseFloat(document.getElementById('pp-real').value);
  var semana = document.getElementById('pp-semana').value;
  if(!meta || !semana){ toast('Preencha semana e meta'); return; }
  STATE.planoSemanal.push({id:uid(), semana:semana, metaM:meta, realizadoM:real||0});
  persist(); toast('Semana salva'); renderPage();
}
function excluirPlanoSemanal(id){ STATE.planoSemanal = STATE.planoSemanal.filter(function(p){return p.id!==id}); persist(); renderPage(); }

// ============================================================================
// LOGIN GATE — senha simples de equipe (mesmo padrão de segurança leve dos outros apps MSE)
// ============================================================================
var APP_PIN = '2027';
function tentarEntrar(){
  var v = document.getElementById('gatePin').value;
  if(v === APP_PIN){
    document.getElementById('gate').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    try{ sessionStorage.setItem('oc_mat_auth','1'); }catch(e){}
    boot();
  } else {
    document.getElementById('gateErr').textContent = 'PIN incorreto';
    document.getElementById('gatePin').value = '';
  }
}
document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('gatePin').addEventListener('keydown', function(e){ if(e.key==='Enter') tentarEntrar(); });
  var jaAutenticado = false;
  try{ jaAutenticado = sessionStorage.getItem('oc_mat_auth')==='1'; }catch(e){}
  if(jaAutenticado){
    document.getElementById('gate').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    boot();
  }
});

function boot(){
  loadState(function(){
    renderNav();
    renderPage();
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('sw.js').catch(function(){});
    }
  });
}
