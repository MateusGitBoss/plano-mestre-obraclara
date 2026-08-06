// ============================================================================
// ObraClara — Maternidade Porte I
// App de gestão de uma obra: ritmo, cronograma, financeiro, caixa, restrições.
// ============================================================================

// === CONTRATO (fonte: 3 propostas MSE de 14/07/2026 + parâmetros do Maurício) ===
var CONTRATO = {
  cliente: 'Sr. Rafael',
  obra: 'Maternidade Porte I',
  fornecedor: 'MSE — Maranhão Soluções de Engenharia',
  metros: 16639.19,
  pecas: 4567,
  bruto: 277341.79,
  descontoPct: 18,
  entradaPct: 50,
  prazoMeses: 3,          // pedido de prazo na negociação
  metaMDia: 300,
  diasUteisMes: 22,
  concretoTotal: 52156.00, // já com perda de 10%, ferragem 100% do contratante
  custosFixos: [
    {id:'mao_obra',    nome:'Mão de obra da fábrica', valor:21760, grupo:'direto'},
    {id:'patio',       nome:'Pátio da fábrica',        valor:3000,  grupo:'direto'},
    {id:'escritorio1', nome:'Salário escritório',      valor:16000, grupo:'estrutura'},
    {id:'divida',      nome:'Dívida Mateus',           valor:5000,  grupo:'estrutura'},
    {id:'escritorio2', nome:'Escritório',              valor:4000,  grupo:'estrutura'},
  ],
  lotes: [
    {id:'est26', codigo:'EST 26', proposta:'MSE-2026-076', pecas:1874, metros:7381.12, valorBruto:107222.38},
    {id:'est27', codigo:'EST 27', proposta:'MSE-2026-077', pecas:1765, metros:6332.99, valorBruto:97312.22},
    {id:'est28', codigo:'EST 28', proposta:'MSE-2026-078', pecas:928,  metros:2925.08, valorBruto:72807.19},
  ],
};

// === ESTADO (o que a equipe lança no dia a dia) ===
var STATE = {
  producao: [],     // {id,data,loteId,metros,pecas,efetivo,m3,viagens,obs}
  custos: [],       // {id,data,categoria,tipo(fixo|variavel),valor,obs}
  medicoes: [],      // {id,periodo,metros,valorLiquido,status,dataPrevista,dataPgto}
  restricoes: [],   // {id,tipo,desc,responsavel,prazo,status,criadaEm}
  planoSemanal: [],  // {id,semana,metaM,realizadoM}
  config: {
    dataInicio: null,       // definida no primeiro apontamento
    metaMDia: CONTRATO.metaMDia,
    descontoPctAplicado: CONTRATO.descontoPct,
    entradaRecebida: false,
  },
};

// ============================================================================
// MOTOR DE CÁLCULO
// ============================================================================

function calcModel(opts){
  opts = opts || {};
  var ritmoMDia   = opts.ritmoMDia   != null ? opts.ritmoMDia   : CONTRATO.metaMDia;
  var diasUteisMes= opts.diasUteisMes!= null ? opts.diasUteisMes: CONTRATO.diasUteisMes;
  var descontoPct = opts.descontoPct != null ? opts.descontoPct : CONTRATO.descontoPct;
  var concretoTotal = opts.concretoTotal != null ? opts.concretoTotal : CONTRATO.concretoTotal;
  var custosFixos = opts.custosFixos || CONTRATO.custosFixos;
  var metros = opts.metros != null ? opts.metros : CONTRATO.metros;
  var bruto = opts.bruto != null ? opts.bruto : CONTRATO.bruto;

  var liquido = bruto * (1 - descontoPct/100);
  var custoDiretoMensal = custosFixos.filter(function(c){return c.grupo==='direto'}).reduce(function(s,c){return s+c.valor},0);
  var custoEstruturaMensal = custosFixos.filter(function(c){return c.grupo==='estrutura'}).reduce(function(s,c){return s+c.valor},0);
  var custoFixoMensalTotal = custoDiretoMensal + custoEstruturaMensal;

  var mesesNecessarios = ritmoMDia > 0 ? metros / (ritmoMDia * diasUteisMes) : Infinity;
  var custoDireto = concretoTotal + custoDiretoMensal * mesesNecessarios;
  var custoTotal = custoDireto + custoEstruturaMensal * mesesNecessarios;
  var resultado = liquido - custoTotal;
  var margemPct = liquido > 0 ? (resultado/liquido*100) : 0;

  var precoM = liquido / metros;
  var concretoM = concretoTotal / metros;
  var contribM = precoM - concretoM;
  var breakEvenTotalMMes = contribM > 0 ? custoFixoMensalTotal / contribM : Infinity;
  var breakEvenDiretoMMes = contribM > 0 ? custoDiretoMensal / contribM : Infinity;

  return {
    liquido: liquido,
    precoM: precoM,
    concretoM: concretoM,
    contribM: contribM,
    custoDiretoMensal: custoDiretoMensal,
    custoEstruturaMensal: custoEstruturaMensal,
    custoFixoMensalTotal: custoFixoMensalTotal,
    mesesNecessarios: mesesNecessarios,
    diasUteisNecessarios: mesesNecessarios * diasUteisMes,
    custoDireto: custoDireto,
    custoTotal: custoTotal,
    custoPorM: custoTotal / metros,
    resultado: resultado,
    margemPct: margemPct,
    breakEvenTotalMDia: breakEvenTotalMMes / diasUteisMes,
    breakEvenDiretoMDia: breakEvenDiretoMMes / diasUteisMes,
  };
}

var MODELO_PLANO = calcModel(); // cenário base, 300 m/dia — referência fixa do contrato

// --- dias úteis (seg-sex) ---
function addBusinessDays(dateObj, n){
  var d = new Date(dateObj.getTime());
  var dir = n >= 0 ? 1 : -1;
  var left = Math.abs(Math.round(n));
  while(left > 0){
    d.setDate(d.getDate() + dir);
    var dow = d.getDay();
    if(dow !== 0 && dow !== 6) left--;
  }
  return d;
}
function parseDate(s){ return new Date(s + 'T12:00:00'); }
function todayStr(){ return new Date().toISOString().slice(0,10); }

// --- produção realizada ---
function metrosRealizados(){
  return STATE.producao.reduce(function(s,p){return s + (p.metros||0)}, 0);
}
function pecasRealizadas(){
  return STATE.producao.reduce(function(s,p){return s + (p.pecas||0)}, 0);
}
function metrosRealizadosPorLote(loteId){
  return STATE.producao.filter(function(p){return p.loteId===loteId}).reduce(function(s,p){return s+(p.metros||0)},0);
}
function producaoOrdenada(){
  return STATE.producao.slice().sort(function(a,b){return a.data < b.data ? -1 : a.data > b.data ? 1 : 0});
}
// ritmo médio dos últimos 7 dias com apontamento (não 7 dias corridos — 7 registros)
function ritmoReal7d(){
  var ord = producaoOrdenada();
  if(ord.length === 0) return 0;
  var ultimos = ord.slice(-7);
  var soma = ultimos.reduce(function(s,p){return s+(p.metros||0)},0);
  return soma / ultimos.length;
}
function ultimaDataProducao(){
  var ord = producaoOrdenada();
  return ord.length ? ord[ord.length-1].data : null;
}

function custosLancados(){
  return STATE.custos.reduce(function(s,c){return s+(c.valor||0)},0);
}

// --- projeção viva: usa ritmo real quando existe apontamento, senão a meta ---
function projecao(){
  var realizados = metrosRealizados();
  var restantes = Math.max(0, CONTRATO.metros - realizados);
  var ritmoR = ritmoReal7d();
  var ritmo = ritmoR > 0 ? ritmoR : STATE.config.metaMDia;
  var diasUteisRestantes = ritmo > 0 ? restantes / ritmo : Infinity;

  var dataBase = ultimaDataProducao() ? parseDate(ultimaDataProducao()) : new Date();
  var dataProjetada = isFinite(diasUteisRestantes) ? addBusinessDays(dataBase, diasUteisRestantes) : null;

  var dataInicio = STATE.config.dataInicio ? parseDate(STATE.config.dataInicio) : (ultimaDataProducao() ? parseDate(producaoOrdenada()[0].data) : null);
  var dataFimContratual = dataInicio ? addBusinessDays(dataInicio, CONTRATO.prazoMeses*CONTRATO.diasUteisMes) : null;

  // custo: o que já foi lançado + o que falta, estimado no ritmo projetado
  var lancado = custosLancados();
  var modeloRitmo = calcModel({ritmoMDia: ritmo});
  var custoRestanteEstimado = restantes * modeloRitmo.custoPorM;
  var eac = lancado > 0 ? (lancado + custoRestanteEstimado) : modeloRitmo.custoTotal;
  var resultadoProjetado = MODELO_PLANO.liquido - eac;

  return {
    metrosRealizados: realizados,
    metrosRestantes: restantes,
    pctFisico: CONTRATO.metros>0 ? (realizados/CONTRATO.metros*100) : 0,
    ritmoReal: ritmoR,
    ritmoUsado: ritmo,
    diasUteisRestantes: diasUteisRestantes,
    dataProjetada: dataProjetada,
    dataFimContratual: dataFimContratual,
    atrasoDias: (dataProjetada && dataFimContratual) ? Math.round((dataProjetada-dataFimContratual)/864e5) : null,
    eac: eac,
    resultadoProjetado: resultadoProjetado,
    margemProjetadaPct: MODELO_PLANO.liquido>0 ? (resultadoProjetado/MODELO_PLANO.liquido*100) : 0,
    lancado: lancado,
  };
}

// --- caixa: 12 semanas, entrada + medições (lançadas ou projetadas) - custo fixo prorrateado - concreto proporcional ---
function projetarCaixa(semanas){
  semanas = semanas || 12;
  var p = projecao();
  var hoje = new Date();
  var buckets = [];
  for(var i=0;i<semanas;i++){
    var ini = new Date(hoje.getTime() + i*7*864e5);
    buckets.push({semana:i+1, dataIni:ini, recebe:0, paga:0, detalhe:[]});
  }

  // entrada — cai na semana 0 se ainda não marcada como recebida
  if(!STATE.config.entradaRecebida){
    buckets[0].recebe += MODELO_PLANO.liquido * CONTRATO.entradaPct/100;
    buckets[0].detalhe.push('Entrada (' + CONTRATO.entradaPct + '%)');
  }

  // medições lançadas manualmente pelo usuário, pelas datas previstas
  STATE.medicoes.forEach(function(m){
    if(m.status === 'paga' || !m.dataPrevista) return;
    var dt = parseDate(m.dataPrevista);
    var idx = Math.floor((dt - hoje) / (7*864e5));
    if(idx >= 0 && idx < semanas){
      buckets[idx].recebe += m.valorLiquido || 0;
      buckets[idx].detalhe.push('Medição ' + (m.periodo||''));
    }
  });

  // despesas: custo fixo semanal enquanto durar a produção projetada + concreto proporcional
  var custoFixoSemanal = MODELO_PLANO.custoFixoMensalTotal / 4.33;
  var concretoRestante = Math.max(0, CONTRATO.concretoTotal - (p.metrosRealizados/CONTRATO.metros*CONTRATO.concretoTotal));
  var semanasProducaoRestantes = p.ritmoUsado>0 ? Math.ceil(p.metrosRestantes / (p.ritmoUsado*5)) : 0; // 5 dias úteis/semana
  var concretoPorSemana = semanasProducaoRestantes>0 ? concretoRestante/semanasProducaoRestantes : 0;

  for(var i=0;i<semanas;i++){
    if(i < semanasProducaoRestantes){
      buckets[i].paga += custoFixoSemanal + concretoPorSemana;
      buckets[i].detalhe.push('Fábrica + concreto');
    } else {
      buckets[i].paga += CONTRATO.custosFixos.filter(function(c){return c.grupo==='estrutura'}).reduce(function(s,c){return s+c.valor},0) / 4.33;
      buckets[i].detalhe.push('Estrutura');
    }
  }

  // custos já lançados manualmente na semana corrente (informativo, não duplicado no futuro)
  var saldo = 0;
  buckets.forEach(function(b){
    saldo += b.recebe - b.paga;
    b.saldo = saldo;
  });
  return buckets;
}

// ============================================================================
// PERSISTÊNCIA — localStorage sempre + Firebase (mesmo projeto do mse-gestao)
// ============================================================================

var LS_KEY = 'obraclara_maternidade_v1';
var FB_COLLECTION = 'obraclara_maternidade';
var db = null;

var firebaseConfig = {
  apiKey: "AIzaSyCGn3xhDnxMpfahlDEvZ0EqMBpWgV7DnwA",
  authDomain: "mse-gestao-8aa6a.firebaseapp.com",
  projectId: "mse-gestao-8aa6a",
  storageBucket: "mse-gestao-8aa6a.firebasestorage.app",
  messagingSenderId: "1099129099521",
  appId: "1:1099129099521:web:f52ba0383a490507163700"
};
try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    try { db.enablePersistence({synchronizeTabs:true}).catch(function(){}); } catch(e){}
  }
} catch(e) { console.log('Firebase init error:', e); }

function setSyncStatus(status){
  var el = document.getElementById('syncStatus');
  if(!el) return;
  var map = {
    loading: ['Carregando…', '#FFD166'],
    syncing: ['Salvando…', '#FFD166'],
    synced:  ['Sincronizado', '#52B788'],
    offline: ['Somente local', 'rgba(255,255,255,.4)'],
  };
  var m = map[status] || map.offline;
  el.innerHTML = '<span class="dot" style="color:'+m[1]+'"></span><span>'+m[0]+'</span>';
}

function saveLocal(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(STATE)); }catch(e){}
}

var syncTimer = null;
function persist(){
  saveLocal();
  if(!db){ setSyncStatus('offline'); return; }
  setSyncStatus('syncing');
  clearTimeout(syncTimer);
  syncTimer = setTimeout(function(){
    var payload = JSON.stringify(STATE);
    db.collection(FB_COLLECTION).doc('estado').set({d: payload, ts: Date.now()})
      .then(function(){ setSyncStatus('synced'); })
      .catch(function(e){ console.log('sync err', e); setSyncStatus('offline'); });
  }, 500);
}

function loadState(cb){
  var local = null;
  try{ local = JSON.parse(localStorage.getItem(LS_KEY)); }catch(e){}
  if(local){ Object.assign(STATE, local); }

  if(!db){ setSyncStatus('offline'); cb && cb(); return; }
  setSyncStatus('loading');
  db.collection(FB_COLLECTION).doc('estado').get().then(function(doc){
    if(doc.exists && doc.data().d){
      try{
        var remoto = JSON.parse(doc.data().d);
        // usa o mais recente entre local e remoto de forma simples: remoto vence se existir
        Object.assign(STATE, remoto);
      }catch(e){}
    }
    setSyncStatus('synced');
    cb && cb();
  }).catch(function(){
    setSyncStatus('offline');
    cb && cb();
  });
}

// ============================================================================
// HELPERS DE FORMATAÇÃO
// ============================================================================

var fmt = function(v){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0); };
var fmtN = function(v,d){ return new Intl.NumberFormat('pt-BR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}).format(v||0); };
var fmtDate = function(d){ if(!d) return '—'; try{ var dt = typeof d==='string'?parseDate(d):d; return dt.toLocaleDateString('pt-BR'); }catch(e){return '—'} };
var fmtPct = function(v,d){ return fmtN(v,d!=null?d:1) + '%'; };
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function toast(msg){
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._tm);
  toast._tm = setTimeout(function(){ t.classList.remove('show'); }, 2200);
}

function svg(name,w,h){
  w=w||20;h=h||20;
  var s = {
    hoje:'<path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    cronograma:'<path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.1-3-3L5 15.5"/>',
    financeiro:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    caixa:'<rect x="1" y="5" width="22" height="14" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    simulador:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    restricoes:'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    up:'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    down:'<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
    clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    check:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    truck:'<rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    camera:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    menu:'<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    close:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    alert:'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  };
  return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(s[name]||'')+'</svg>';
}
