// ============================================================================
// ObraClara — Maternidade Porte I
// Controle financeiro da obra: o que entra, o que sai, e se está sobrando.
// ============================================================================

// === CONTRATO (3 propostas MSE de 14/07/2026 + números passados pelo Maurício) ===
var CONTRATO = {
  cliente: 'Sr. Rafael',
  obra: 'Maternidade Porte I',
  metros: 16639.19,
  pecas: 4567,
  bruto: 277341.79,
  descontoPct: 18,
  entradaPct: 50,
  prazoMeses: 3,
  metaMDia: 300,
  diasUteisMes: 22,
  concretoTotal: 52156.00,   // já com perda de 10%; ferragem é 100% do contratante

  // As contas que se repetem todo mês. O app gera essas 5 sozinho.
  contasFixas: [
    {id:'mao_obra',    nome:'Mão de obra da fábrica', valor:21760, grupo:'obra'},
    {id:'patio',       nome:'Pátio da fábrica',       valor:3000,  grupo:'obra'},
    {id:'salario',     nome:'Salário escritório',     valor:16000, grupo:'estrutura'},
    {id:'divida',      nome:'Dívida Mateus',          valor:5000,  grupo:'estrutura'},
    {id:'escritorio',  nome:'Escritório',             valor:4000,  grupo:'estrutura'},
  ],

  lotes: [
    {id:'est26', codigo:'EST 26', pecas:1874, metros:7381.12},
    {id:'est27', codigo:'EST 27', pecas:1765, metros:6332.99},
    {id:'est28', codigo:'EST 28', pecas:928,  metros:2925.08},
  ],
};

CONTRATO.liquido      = CONTRATO.bruto * (1 - CONTRATO.descontoPct/100);
CONTRATO.entradaValor = CONTRATO.liquido * CONTRATO.entradaPct/100;
CONTRATO.precoM       = CONTRATO.liquido / CONTRATO.metros;
CONTRATO.concretoM    = CONTRATO.concretoTotal / CONTRATO.metros;
CONTRATO.fixoMensal   = CONTRATO.contasFixas.reduce(function(s,c){return s+c.valor},0);

// Quanto sobra no plano original (300 m/dia): referência fixa pra comparar
var PLANO = (function(){
  var meses = CONTRATO.metros / (CONTRATO.metaMDia * CONTRATO.diasUteisMes);
  var custo = CONTRATO.concretoTotal + CONTRATO.fixoMensal * meses;
  return {
    meses: meses,
    custo: custo,
    resultado: CONTRATO.liquido - custo,
    margemPct: (CONTRATO.liquido - custo) / CONTRATO.liquido * 100,
    // ritmo mínimo pra obra não dar prejuízo
    ritmoMinimo: (CONTRATO.fixoMensal / (CONTRATO.precoM - CONTRATO.concretoM)) / CONTRATO.diasUteisMes,
  };
})();

// === O QUE A EQUIPE LANÇA ===
var STATE = {
  contas: [],        // a pagar  {id,descricao,categoria,valor,vencimento,status,pagoEm,fixaId,mes}
  recebimentos: [],  // a receber {id,descricao,valor,previsao,status,recebidoEm}
  producao: [],      // {id,data,loteId,metros,pecas,m3,obs}
  config: { dataInicio:null, mesesGerados:[], recebimentosIniciados:false },
};

// ============================================================================
// DATAS
// ============================================================================
function todayStr(){ return new Date().toISOString().slice(0,10); }
function parseDate(s){ return new Date(s + 'T12:00:00'); }
function diasAte(dataStr){
  if(!dataStr) return null;
  var hoje = parseDate(todayStr());
  return Math.round((parseDate(dataStr) - hoje) / 864e5);
}
function addBusinessDays(dateObj, n){
  var d = new Date(dateObj.getTime());
  var left = Math.abs(Math.round(n));
  var dir = n >= 0 ? 1 : -1;
  while(left > 0){
    d.setDate(d.getDate() + dir);
    var dow = d.getDay();
    if(dow !== 0 && dow !== 6) left--;
  }
  return d;
}
function mesAtualStr(){ return todayStr().slice(0,7); }
function nomeMes(mesStr){
  var m = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var p = mesStr.split('-');
  return m[parseInt(p[1],10)-1] + ' de ' + p[0];
}

// ============================================================================
// CONTAS A PAGAR
// ============================================================================
function statusConta(c){
  if(c.status === 'paga') return 'paga';
  var d = diasAte(c.vencimento);
  if(d === null) return 'aberta';
  if(d < 0) return 'vencida';
  if(d <= 7) return 'vence';
  return 'aberta';
}
function contasAbertas(){ return STATE.contas.filter(function(c){return c.status!=='paga'}); }
function contasVencidas(){ return contasAbertas().filter(function(c){return statusConta(c)==='vencida'}); }
function contasProximas(dias){
  return contasAbertas().filter(function(c){
    var d = diasAte(c.vencimento);
    return d !== null && d >= 0 && d <= (dias||7);
  });
}
function totalPago(){
  return STATE.contas.filter(function(c){return c.status==='paga'}).reduce(function(s,c){return s+(c.valor||0)},0);
}
function totalAPagar(){ return contasAbertas().reduce(function(s,c){return s+(c.valor||0)},0); }

// Gera as 5 contas fixas de um mês. Não duplica se o mês já foi gerado.
function gerarContasDoMes(mes, dia){
  if(STATE.config.mesesGerados.indexOf(mes) >= 0) return 0;
  var d = Math.min(28, Math.max(1, parseInt(dia,10) || 5));
  var venc = mes + '-' + (d<10 ? '0'+d : d);
  CONTRATO.contasFixas.forEach(function(f){
    STATE.contas.push({
      id: uid(), descricao: f.nome, categoria: f.grupo === 'obra' ? 'Obra' : 'Estrutura',
      valor: f.valor, vencimento: venc, status: 'aberta', fixaId: f.id, mes: mes,
    });
  });
  STATE.config.mesesGerados.push(mes);
  return CONTRATO.contasFixas.length;
}

// ============================================================================
// CONTAS A RECEBER
// ============================================================================
function recebimentosAbertos(){ return STATE.recebimentos.filter(function(r){return r.status!=='recebido'}); }
function totalRecebido(){
  return STATE.recebimentos.filter(function(r){return r.status==='recebido'}).reduce(function(s,r){return s+(r.valor||0)},0);
}
function totalAReceber(){ return recebimentosAbertos().reduce(function(s,r){return s+(r.valor||0)},0); }
function recebimentosAtrasados(){
  return recebimentosAbertos().filter(function(r){
    var d = diasAte(r.previsao);
    return d !== null && d < 0;
  });
}

// Cria a entrada + o saldo previsto, uma única vez
function criarRecebimentosIniciais(){
  if(STATE.config.recebimentosIniciados) return 0;
  STATE.recebimentos.push({
    id: uid(), descricao: 'Entrada do contrato (' + CONTRATO.entradaPct + '%)',
    valor: CONTRATO.entradaValor, previsao: null, status: 'aberto',
  });
  STATE.recebimentos.push({
    id: uid(), descricao: 'Saldo — a medir conforme produção',
    valor: CONTRATO.liquido - CONTRATO.entradaValor, previsao: null, status: 'aberto',
  });
  STATE.config.recebimentosIniciados = true;
  return 2;
}

// ============================================================================
// CAIXA
// ============================================================================
function saldoCaixa(){ return totalRecebido() - totalPago(); }

// ============================================================================
// PRODUÇÃO
// ============================================================================
function metrosRealizados(){ return STATE.producao.reduce(function(s,p){return s+(p.metros||0)},0); }
function metrosPorLote(loteId){
  return STATE.producao.filter(function(p){return p.loteId===loteId}).reduce(function(s,p){return s+(p.metros||0)},0);
}
function producaoOrdenada(){
  return STATE.producao.slice().sort(function(a,b){return a.data<b.data?-1:a.data>b.data?1:0});
}
function ritmoRecente(){
  var ord = producaoOrdenada();
  if(!ord.length) return 0;
  var ult = ord.slice(-7);
  return ult.reduce(function(s,p){return s+(p.metros||0)},0) / ult.length;
}
function pctFisico(){ return CONTRATO.metros>0 ? metrosRealizados()/CONTRATO.metros*100 : 0; }

// ============================================================================
// RESULTADO — quanto deve sobrar no fim, do jeito que a obra está indo
// ============================================================================
function resultado(){
  var feitos = metrosRealizados();
  var faltam = Math.max(0, CONTRATO.metros - feitos);
  var ritmo = ritmoRecente() > 0 ? ritmoRecente() : CONTRATO.metaMDia;

  // O custo da obra é o tempo que ela ocupa a fábrica: o que já passou + o que falta.
  // Assim o resultado só muda com ritmo e prazo — pagar uma conta não piora a obra,
  // só tira o valor de "ainda vamos gastar" e põe em "já pagamos".
  var mesesDecorridos = 0;
  if(STATE.config.dataInicio){
    var diasCorridos = (parseDate(todayStr()) - parseDate(STATE.config.dataInicio)) / 864e5;
    mesesDecorridos = Math.max(0, diasCorridos / 30.4);
  }
  var mesesQueFaltam = ritmo > 0 ? faltam / (ritmo * CONTRATO.diasUteisMes) : 0;
  var mesesTotais = mesesDecorridos + mesesQueFaltam;

  var custoTotalEstimado = CONTRATO.concretoTotal + CONTRATO.fixoMensal * mesesTotais;
  var jaPago = totalPago();
  var custoQueFalta = Math.max(0, custoTotalEstimado - jaPago);
  var res = CONTRATO.liquido - custoTotalEstimado;

  var diasUteisQueFaltam = ritmo > 0 ? faltam / ritmo : 0;
  var base = producaoOrdenada().length ? parseDate(producaoOrdenada().slice(-1)[0].data) : new Date();
  var terminoPrevisto = faltam > 0 ? addBusinessDays(base, diasUteisQueFaltam) : base;

  var inicio = STATE.config.dataInicio ? parseDate(STATE.config.dataInicio) : null;
  var prazoContratual = inicio ? addBusinessDays(inicio, CONTRATO.prazoMeses*CONTRATO.diasUteisMes) : null;

  return {
    metrosFeitos: feitos, metrosFaltam: faltam, pct: pctFisico(),
    ritmo: ritmoRecente(),
    jaPago: jaPago, custoQueFalta: custoQueFalta, custoTotalEstimado: custoTotalEstimado,
    resultado: res,
    margemPct: CONTRATO.liquido>0 ? res/CONTRATO.liquido*100 : 0,
    terminoPrevisto: faltam>0 ? terminoPrevisto : null,
    prazoContratual: prazoContratual,
    diasDeAtraso: (faltam>0 && prazoContratual) ? Math.round((terminoPrevisto-prazoContratual)/864e5) : null,
    mesesQueFaltam: mesesQueFaltam,
    mesesTotais: mesesTotais,
  };
}

// ============================================================================
// PERSISTÊNCIA — salva no aparelho e sincroniza com o Firebase do mse-gestao
// ============================================================================
var LS_KEY = 'obraclara_maternidade_v2';
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
} catch(e) { console.log('Firebase init:', e); }

function setSyncStatus(s){
  var el = document.getElementById('syncStatus');
  if(!el) return;
  var map = {
    loading:['Carregando…','#FFD166'], syncing:['Salvando…','#FFD166'],
    synced:['Tudo salvo','#52B788'], offline:['Salvo no aparelho','rgba(255,255,255,.45)'],
  };
  var m = map[s] || map.offline;
  el.innerHTML = '<span class="dot" style="color:'+m[1]+'"></span><span>'+m[0]+'</span>';
}

var syncTimer = null;
function persist(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(STATE)); }catch(e){}
  if(!db){ setSyncStatus('offline'); return; }
  setSyncStatus('syncing');
  clearTimeout(syncTimer);
  syncTimer = setTimeout(function(){
    db.collection(FB_COLLECTION).doc('estado').set({d: JSON.stringify(STATE), ts: Date.now()})
      .then(function(){ setSyncStatus('synced'); })
      .catch(function(){ setSyncStatus('offline'); });
  }, 500);
}

function loadState(cb){
  try{
    var local = JSON.parse(localStorage.getItem(LS_KEY));
    if(local) Object.assign(STATE, local);
  }catch(e){}
  if(!db){ setSyncStatus('offline'); cb && cb(); return; }
  setSyncStatus('loading');
  db.collection(FB_COLLECTION).doc('estado').get().then(function(doc){
    if(doc.exists && doc.data().d){
      try{ Object.assign(STATE, JSON.parse(doc.data().d)); }catch(e){}
    }
    setSyncStatus('synced');
    cb && cb();
  }).catch(function(){ setSyncStatus('offline'); cb && cb(); });
}

// ============================================================================
// FORMATAÇÃO
// ============================================================================
var fmt   = function(v){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0); };
var fmtK  = function(v){
  var a = Math.abs(v||0);
  if(a >= 1000) return (v<0?'-':'')+'R$ '+new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(a);
  return fmt(v);
};
var fmtN  = function(v,d){ return new Intl.NumberFormat('pt-BR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}).format(v||0); };
var fmtPct= function(v,d){ return fmtN(v,d!=null?d:0)+'%'; };
var fmtDate = function(d){
  if(!d) return '—';
  try{ var dt = typeof d==='string'?parseDate(d):d; return dt.toLocaleDateString('pt-BR'); }catch(e){ return '—'; }
};
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

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
    painel:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    pagar:'<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
    receber:'<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    producao:'<rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    resultado:'<path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.1-3-3L5 15.5"/>',
    plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    check:'<polyline points="20 6 9 17 4 12"/>',
    trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    alert:'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    ok:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  };
  return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(s[name]||'')+'</svg>';
}
