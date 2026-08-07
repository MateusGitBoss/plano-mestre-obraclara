// ============================================================================
// ObraClara — Telas
// ============================================================================

var PAGES = [
  {id:'painel',    label:'Painel',           icon:'painel'},
  {id:'pagar',     label:'Contas a pagar',   icon:'pagar'},
  {id:'receber',   label:'Contas a receber', icon:'receber'},
  {id:'producao',  label:'Produção',         icon:'producao'},
  {id:'resultado', label:'Resultado',        icon:'resultado'},
];
var currentPage = 'painel';

function renderNav(){
  var vencidas = contasVencidas().length;
  document.getElementById('nav').innerHTML = PAGES.map(function(p){
    var alerta = (p.id==='pagar' && vencidas>0) ? '<span class="nav-badge">'+vencidas+'</span>' : '';
    return '<a class="nav-item '+(currentPage===p.id?'active':'')+'" onclick="navigate(\''+p.id+'\')" href="#">'+
      svg(p.icon)+'<span class="nav-label">'+p.label+'</span>'+alerta+'</a>';
  }).join('');
}
function navigate(page){
  currentPage = page;
  renderNav(); renderPage(); closeSidebar();
  window.scrollTo(0,0);
  document.getElementById('headerTitle').textContent =
    PAGES.find(function(p){return p.id===page}).label;
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
  if(currentPage==='painel')    c.innerHTML = renderPainel();
  if(currentPage==='pagar')     c.innerHTML = renderPagar();
  if(currentPage==='receber')   c.innerHTML = renderReceber();
  if(currentPage==='producao')  c.innerHTML = renderProducao();
  if(currentPage==='resultado'){c.innerHTML = renderResultado(); initSimulador();}
}

// ============================================================================
// TELA 1 — PAINEL
// ============================================================================
function renderPainel(){
  var saldo = saldoCaixa();
  var venc = contasVencidas();
  var prox = contasProximas(7);
  var vencTotal = venc.reduce(function(s,c){return s+c.valor},0);
  var proxTotal = prox.reduce(function(s,c){return s+c.valor},0);
  var r = resultado();

  var alertas = '';
  if(venc.length){
    alertas += '<div class="alert danger">'+svg('alert')+'<div>'+
      '<h3>'+venc.length+(venc.length===1?' conta vencida':' contas vencidas')+' — '+fmt(vencTotal)+'</h3>'+
      '<p>'+venc.slice(0,3).map(function(c){return c.descricao+' ('+fmtDate(c.vencimento)+')'}).join(' · ')+
      (venc.length>3?' e mais '+(venc.length-3):'')+'</p>'+
      '<button class="btn btn-danger-outline btn-sm" style="margin-top:8px" onclick="navigate(\'pagar\')">Ver contas</button>'+
      '</div></div>';
  }
  var atrasadosReceber = recebimentosAtrasados();
  if(atrasadosReceber.length){
    alertas += '<div class="alert">'+svg('clock')+'<div>'+
      '<h3>'+atrasadosReceber.length+' recebimento(s) atrasado(s)</h3>'+
      '<p>'+atrasadosReceber.map(function(x){return x.descricao}).join(' · ')+'</p>'+
      '<button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="navigate(\'receber\')">Ver</button>'+
      '</div></div>';
  }

  // últimos movimentos: pagos e recebidos juntos
  var movs = [];
  STATE.contas.filter(function(c){return c.status==='paga'}).forEach(function(c){
    movs.push({data:c.pagoEm||c.vencimento, desc:c.descricao, valor:-c.valor});
  });
  STATE.recebimentos.filter(function(r){return r.status==='recebido'}).forEach(function(x){
    movs.push({data:x.recebidoEm||x.previsao, desc:x.descricao, valor:x.valor});
  });
  movs.sort(function(a,b){return (b.data||'')<(a.data||'')?-1:1});
  movs = movs.slice(0,8);

  return '<h1 class="page-title">Painel</h1>'+
    '<p class="page-sub">Maternidade Porte I · Sr. Rafael</p>'+

    '<div class="hero '+(saldo>=0?'pos':'neg')+'">'+
      '<div class="hero-label">Saldo em caixa da obra</div>'+
      '<div class="hero-value">'+fmt(saldo)+'</div>'+
      '<div class="hero-note">'+fmt(totalRecebido())+' recebido · '+fmt(totalPago())+' pago</div>'+
    '</div>'+

    '<div class="duo">'+
      '<div class="card mini '+(vencTotal>0?'red':'')+'" onclick="navigate(\'pagar\')">'+
        '<div class="mini-label">A pagar nos próximos 7 dias</div>'+
        '<div class="mini-value">'+fmt(proxTotal+vencTotal)+'</div>'+
        '<div class="mini-note">'+(venc.length? venc.length+' vencida(s) · ' : '')+prox.length+' a vencer</div>'+
      '</div>'+
      '<div class="card mini green" onclick="navigate(\'receber\')">'+
        '<div class="mini-label">Ainda a receber do cliente</div>'+
        '<div class="mini-value">'+fmt(totalAReceber())+'</div>'+
        '<div class="mini-note">de '+fmt(CONTRATO.liquido)+' do contrato</div>'+
      '</div>'+
    '</div>'+

    alertas +

    '<div class="card" style="margin-bottom:14px">'+
      '<div class="card-title" style="margin-bottom:12px">Como está a obra</div>'+
      '<div class="linha"><span>Produção entregue</span><b>'+fmtPct(r.pct,1)+'</b></div>'+
      '<div class="progress-bar" style="margin:6px 0 14px"><div class="fill" style="width:'+Math.min(100,r.pct)+'%;background:var(--primary)"></div></div>'+
      '<div class="linha"><span>Contrato fechado</span><b>'+fmt(CONTRATO.liquido)+'</b></div>'+
      '<div class="linha"><span>Já pagamos</span><b>'+fmt(r.jaPago)+'</b></div>'+
      '<div class="linha"><span>Ainda vamos gastar (estimado)</span><b>'+fmt(r.custoQueFalta)+'</b></div>'+
      '<div class="linha destaque"><span>Deve sobrar no fim</span>'+
        '<b style="color:'+(r.resultado>=0?'var(--ok)':'var(--danger)')+'">'+fmt(r.resultado)+'</b></div>'+
      '<button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="navigate(\'resultado\')">Ver detalhe</button>'+
    '</div>'+

    '<div class="card">'+
      '<div class="card-title" style="margin-bottom:10px">Últimos movimentos</div>'+
      (movs.length===0
        ? '<div class="empty">'+svg('painel')+'<p>Nada lançado ainda. Comece pelas contas a pagar.</p></div>'
        : movs.map(function(m){
            return '<div class="mov"><div><div class="mov-desc">'+m.desc+'</div>'+
              '<div class="mov-data">'+fmtDate(m.data)+'</div></div>'+
              '<div class="mov-valor '+(m.valor>=0?'in':'out')+'">'+(m.valor>=0?'+ ':'− ')+fmt(Math.abs(m.valor))+'</div></div>';
          }).join(''))+
    '</div>';
}

// ============================================================================
// TELA 2 — CONTAS A PAGAR
// ============================================================================
var filtroPagar = 'abertas';
var mesPagar = null;
function setFiltroPagar(f){ filtroPagar = f; renderPage(); }
function mudarMesPagar(v){ mesPagar = v; renderPage(); }

function renderPagar(){
  var mes = mesPagar || mesAtualStr();
  var jaGerado = STATE.config.mesesGerados.indexOf(mes) >= 0;

  var lista = STATE.contas.slice();
  if(filtroPagar==='abertas') lista = lista.filter(function(c){return c.status!=='paga'});
  if(filtroPagar==='pagas')   lista = lista.filter(function(c){return c.status==='paga'});
  lista.sort(function(a,b){
    if(a.status!==b.status) return a.status==='paga'?1:-1;
    return (a.vencimento||'') < (b.vencimento||'') ? -1 : 1;
  });

  var rotulo = {vencida:'Vencida', vence:'Vence essa semana', aberta:'Em dia', paga:'Paga'};

  return '<h1 class="page-title">Contas a pagar</h1>'+
    '<p class="page-sub">Total em aberto: <b>'+fmt(totalAPagar())+'</b></p>'+

    '<div class="card" style="margin-bottom:14px">'+
      '<div class="card-title" style="margin-bottom:6px">Contas fixas do mês</div>'+
      '<p class="hint">'+CONTRATO.contasFixas.map(function(f){return f.nome}).join(', ')+' — total '+fmt(CONTRATO.fixoMensal)+'. O app lança as cinco de uma vez.</p>'+
      '<div class="form-grid cols2">'+
        '<div class="fgroup"><label>Mês</label><input type="month" id="gm-mes" value="'+mes+'" onchange="mudarMesPagar(this.value)"></div>'+
        '<div class="fgroup"><label>Vencem no dia</label><input type="number" id="gm-dia" min="1" max="28" value="5"></div>'+
      '</div>'+
      (jaGerado
        ? '<div class="ok-line">'+svg('ok',16,16)+' '+nomeMes(mes)+' já foi lançado</div>'
        : '<button class="btn btn-primary" onclick="gerarMes()">'+svg('plus',16,16)+' Lançar as 5 contas de '+nomeMes(mes)+'</button>')+
    '</div>'+

    '<div class="card" style="margin-bottom:14px">'+
      '<div class="card-title" style="margin-bottom:12px">Nova conta</div>'+
      '<div class="fgroup"><label>O que é</label><input type="text" id="ct-desc" placeholder="Ex: Concreto — 3ª viagem"></div>'+
      '<div class="form-grid cols2">'+
        '<div class="fgroup"><label>Valor</label><input type="number" step="0.01" id="ct-valor" placeholder="0,00"></div>'+
        '<div class="fgroup"><label>Vence em</label><input type="date" id="ct-venc" value="'+todayStr()+'"></div>'+
      '</div>'+
      '<div class="fgroup" style="margin-bottom:12px"><label>Categoria</label>'+
        '<select id="ct-cat"><option>Concreto</option><option>Obra</option><option>Estrutura</option><option>Frete</option><option>Outros</option></select></div>'+
      '<button class="btn btn-primary" onclick="salvarConta()">'+svg('plus',16,16)+' Adicionar conta</button>'+
    '</div>'+

    '<div class="chips">'+
      ['abertas','pagas','todas'].map(function(f){
        var nome = {abertas:'Em aberto',pagas:'Pagas',todas:'Todas'}[f];
        return '<button class="chip '+(filtroPagar===f?'on':'')+'" onclick="setFiltroPagar(\''+f+'\')">'+nome+'</button>';
      }).join('')+
    '</div>'+

    (lista.length===0
      ? '<div class="card"><div class="empty">'+svg('pagar')+'<p>Nenhuma conta aqui.</p></div></div>'
      : lista.map(function(c){
          var st = statusConta(c);
          var d = diasAte(c.vencimento);
          var quando = st==='paga' ? 'Paga em '+fmtDate(c.pagoEm)
            : st==='vencida' ? 'Venceu há '+Math.abs(d)+(Math.abs(d)===1?' dia':' dias')
            : d===0 ? 'Vence hoje'
            : 'Vence em '+fmtDate(c.vencimento);
          return '<div class="conta '+st+'">'+
            '<div class="conta-info">'+
              '<div class="conta-desc">'+c.descricao+'</div>'+
              '<div class="conta-meta"><span class="tag '+st+'">'+rotulo[st]+'</span> '+quando+' · '+c.categoria+'</div>'+
            '</div>'+
            '<div class="conta-acao">'+
              '<div class="conta-valor">'+fmt(c.valor)+'</div>'+
              (c.status==='paga'
                ? '<button class="btn-link" onclick="desfazerPagamento(\''+c.id+'\')">desfazer</button>'
                : '<button class="btn btn-primary btn-sm" onclick="pagarConta(\''+c.id+'\')">'+svg('check',14,14)+' Paguei</button>')+
            '</div>'+
            '<button class="btn-icon del" onclick="excluirConta(\''+c.id+'\')">'+svg('trash',15,15)+'</button>'+
          '</div>';
        }).join(''));
}

function gerarMes(){
  var mes = document.getElementById('gm-mes').value || mesAtualStr();
  var dia = document.getElementById('gm-dia').value || 5;
  var n = gerarContasDoMes(mes, dia);
  persist();
  toast(n>0 ? n+' contas lançadas' : 'Esse mês já foi lançado');
  renderNav(); renderPage();
}
function salvarConta(){
  var desc = document.getElementById('ct-desc').value.trim();
  var valor = parseFloat(document.getElementById('ct-valor').value);
  if(!desc || !valor || valor<=0){ toast('Preencha o que é e o valor'); return; }
  STATE.contas.push({
    id:uid(), descricao:desc, valor:valor,
    vencimento:document.getElementById('ct-venc').value||todayStr(),
    categoria:document.getElementById('ct-cat').value, status:'aberta',
  });
  persist(); toast('Conta adicionada'); renderNav(); renderPage();
}
function pagarConta(id){
  var c = STATE.contas.find(function(x){return x.id===id});
  if(c){ c.status='paga'; c.pagoEm=todayStr(); persist(); toast('Conta paga'); renderNav(); renderPage(); }
}
function desfazerPagamento(id){
  var c = STATE.contas.find(function(x){return x.id===id});
  if(c){ c.status='aberta'; c.pagoEm=null; persist(); renderNav(); renderPage(); }
}
function excluirConta(id){
  STATE.contas = STATE.contas.filter(function(c){return c.id!==id});
  persist(); renderNav(); renderPage();
}

// ============================================================================
// TELA 3 — CONTAS A RECEBER
// ============================================================================
function renderReceber(){
  var lista = STATE.recebimentos.slice().sort(function(a,b){
    if(a.status!==b.status) return a.status==='recebido'?1:-1;
    return (a.previsao||'9999') < (b.previsao||'9999') ? -1 : 1;
  });
  var temIniciais = STATE.config.recebimentosIniciados;

  return '<h1 class="page-title">Contas a receber</h1>'+
    '<p class="page-sub">Já recebido: <b>'+fmt(totalRecebido())+'</b> · Falta: <b>'+fmt(totalAReceber())+'</b></p>'+

    (!temIniciais
      ? '<div class="card" style="margin-bottom:14px">'+
          '<div class="card-title" style="margin-bottom:6px">Começar pelo contrato</div>'+
          '<p class="hint">Lança a entrada de '+fmt(CONTRATO.entradaValor)+' ('+CONTRATO.entradaPct+'%) e o saldo de '+fmt(CONTRATO.liquido-CONTRATO.entradaValor)+' que vem por medição.</p>'+
          '<button class="btn btn-primary" onclick="iniciarRecebimentos()">'+svg('plus',16,16)+' Lançar entrada e saldo</button>'+
        '</div>'
      : '')+

    '<div class="card" style="margin-bottom:14px">'+
      '<div class="card-title" style="margin-bottom:12px">Nova cobrança / medição</div>'+
      '<div class="fgroup"><label>O que é</label><input type="text" id="rc-desc" placeholder="Ex: Medição de agosto"></div>'+
      '<div class="form-grid cols2">'+
        '<div class="fgroup"><label>Valor</label><input type="number" step="0.01" id="rc-valor" placeholder="0,00"></div>'+
        '<div class="fgroup"><label>Previsão de pagamento</label><input type="date" id="rc-prev"></div>'+
      '</div>'+
      '<button class="btn btn-primary" onclick="salvarRecebimento()">'+svg('plus',16,16)+' Adicionar</button>'+
    '</div>'+

    (lista.length===0
      ? '<div class="card"><div class="empty">'+svg('receber')+'<p>Nada lançado ainda.</p></div></div>'
      : lista.map(function(r){
          var recebido = r.status==='recebido';
          var d = diasAte(r.previsao);
          var quando = recebido ? 'Recebido em '+fmtDate(r.recebidoEm)
            : !r.previsao ? 'Sem data definida'
            : d < 0 ? 'Atrasado há '+Math.abs(d)+(Math.abs(d)===1?' dia':' dias')
            : d===0 ? 'Previsto para hoje'
            : 'Previsto para '+fmtDate(r.previsao);
          var st = recebido ? 'paga' : (d!==null && d<0 ? 'vencida' : 'aberta');
          return '<div class="conta '+st+'">'+
            '<div class="conta-info">'+
              '<div class="conta-desc">'+r.descricao+'</div>'+
              '<div class="conta-meta">'+quando+'</div>'+
            '</div>'+
            '<div class="conta-acao">'+
              '<div class="conta-valor '+(recebido?'':'verde')+'">'+fmt(r.valor)+'</div>'+
              (recebido
                ? '<button class="btn-link" onclick="desfazerRecebimento(\''+r.id+'\')">desfazer</button>'
                : '<button class="btn btn-primary btn-sm" onclick="receberValor(\''+r.id+'\')">'+svg('check',14,14)+' Recebi</button>')+
            '</div>'+
            '<button class="btn-icon del" onclick="excluirRecebimento(\''+r.id+'\')">'+svg('trash',15,15)+'</button>'+
          '</div>';
        }).join(''));
}

function iniciarRecebimentos(){
  criarRecebimentosIniciais(); persist(); toast('Entrada e saldo lançados'); renderPage();
}
function salvarRecebimento(){
  var desc = document.getElementById('rc-desc').value.trim();
  var valor = parseFloat(document.getElementById('rc-valor').value);
  if(!desc || !valor || valor<=0){ toast('Preencha o que é e o valor'); return; }
  STATE.recebimentos.push({
    id:uid(), descricao:desc, valor:valor,
    previsao:document.getElementById('rc-prev').value||null, status:'aberto',
  });
  persist(); toast('Cobrança adicionada'); renderPage();
}
function receberValor(id){
  var r = STATE.recebimentos.find(function(x){return x.id===id});
  if(r){ r.status='recebido'; r.recebidoEm=todayStr(); persist(); toast('Recebimento registrado'); renderPage(); }
}
function desfazerRecebimento(id){
  var r = STATE.recebimentos.find(function(x){return x.id===id});
  if(r){ r.status='aberto'; r.recebidoEm=null; persist(); renderPage(); }
}
function excluirRecebimento(id){
  STATE.recebimentos = STATE.recebimentos.filter(function(r){return r.id!==id});
  persist(); renderPage();
}

// ============================================================================
// TELA 4 — PRODUÇÃO (quem entende de obra lança aqui)
// ============================================================================
function renderProducao(){
  var ord = producaoOrdenada().slice().reverse().slice(0,15);
  var r = resultado();

  return '<h1 class="page-title">Produção</h1>'+
    '<p class="page-sub">Quanto a fábrica produziu por dia</p>'+

    '<div class="duo">'+
      '<div class="card mini"><div class="mini-label">Já produzido</div>'+
        '<div class="mini-value">'+fmtN(metrosRealizados())+' m</div>'+
        '<div class="mini-note">de '+fmtN(CONTRATO.metros)+' m · '+fmtPct(r.pct,1)+'</div></div>'+
      '<div class="card mini"><div class="mini-label">Média por dia</div>'+
        '<div class="mini-value">'+(r.ritmo>0?fmtN(r.ritmo):'—')+' m</div>'+
        '<div class="mini-note">meta '+CONTRATO.metaMDia+' m/dia</div></div>'+
    '</div>'+

    '<div class="card" style="margin-bottom:14px">'+
      '<div class="card-title" style="margin-bottom:12px">Lançar o dia</div>'+
      '<div class="form-grid cols2">'+
        '<div class="fgroup"><label>Data</label><input type="date" id="pr-data" value="'+todayStr()+'"></div>'+
        '<div class="fgroup"><label>Projeto</label><select id="pr-lote">'+
          CONTRATO.lotes.map(function(l){return '<option value="'+l.id+'">'+l.codigo+'</option>'}).join('')+'</select></div>'+
        '<div class="fgroup"><label>Metros produzidos</label><input type="number" step="0.1" id="pr-metros" placeholder="Ex: 285"></div>'+
        '<div class="fgroup"><label>Peças</label><input type="number" id="pr-pecas" placeholder="Ex: 78"></div>'+
      '</div>'+
      '<button class="btn btn-primary" onclick="salvarProducao()">'+svg('plus',16,16)+' Salvar</button>'+
    '</div>'+

    '<div class="card" style="margin-bottom:14px">'+
      '<div class="card-title" style="margin-bottom:12px">Andamento por projeto</div>'+
      CONTRATO.lotes.map(function(l){
        var feito = metrosPorLote(l.id);
        var pct = l.metros>0 ? feito/l.metros*100 : 0;
        return '<div class="lote"><div class="linha"><span>'+l.codigo+'</span>'+
          '<b>'+fmtN(feito)+' / '+fmtN(l.metros)+' m</b></div>'+
          '<div class="progress-bar" style="margin-top:5px"><div class="fill" style="width:'+Math.min(100,pct)+'%;background:'+(pct>=100?'var(--ok)':'var(--primary)')+'"></div></div></div>';
      }).join('')+
    '</div>'+

    '<div class="card">'+
      '<div class="card-title" style="margin-bottom:10px">Últimos dias</div>'+
      (ord.length===0
        ? '<div class="empty">'+svg('producao')+'<p>Nenhum dia lançado ainda.</p></div>'
        : ord.map(function(p){
            var l = CONTRATO.lotes.find(function(x){return x.id===p.loteId});
            return '<div class="mov"><div><div class="mov-desc">'+fmtN(p.metros,1)+' m'+(p.pecas?' · '+p.pecas+' peças':'')+'</div>'+
              '<div class="mov-data">'+fmtDate(p.data)+' · '+(l?l.codigo:'—')+'</div></div>'+
              '<button class="btn-icon del" onclick="excluirProducao(\''+p.id+'\')">'+svg('trash',15,15)+'</button></div>';
          }).join(''))+
    '</div>';
}

function salvarProducao(){
  var metros = parseFloat(document.getElementById('pr-metros').value);
  if(!metros || metros<=0){ toast('Informe os metros'); return; }
  var data = document.getElementById('pr-data').value || todayStr();
  STATE.producao.push({
    id:uid(), data:data, loteId:document.getElementById('pr-lote').value,
    metros:metros, pecas:parseInt(document.getElementById('pr-pecas').value)||0,
  });
  if(!STATE.config.dataInicio || data < STATE.config.dataInicio) STATE.config.dataInicio = data;
  persist(); toast('Produção salva'); renderPage();
}
function excluirProducao(id){
  STATE.producao = STATE.producao.filter(function(p){return p.id!==id});
  persist(); renderPage();
}

// ============================================================================
// TELA 5 — RESULTADO
// ============================================================================
function renderResultado(){
  var r = resultado();
  var bom = r.resultado >= PLANO.resultado*0.9;
  var ruim = r.resultado < 0;

  var frase;
  if(r.metrosFeitos === 0){
    frase = 'A obra ainda não começou a produzir. Pelo plano fechado, deve sobrar <b>'+fmt(PLANO.resultado)+'</b> no fim, produzindo '+CONTRATO.metaMDia+' m por dia.';
  } else if(ruim){
    frase = 'No ritmo de agora a obra <b>fecha no vermelho</b>. Precisa produzir pelo menos <b>'+fmtN(PLANO.ritmoMinimo)+' m por dia</b> pra não dar prejuízo.';
  } else if(bom){
    frase = 'A obra está <b>indo bem</b>. No ritmo de agora deve sobrar <b>'+fmt(r.resultado)+'</b> no fim.';
  } else {
    frase = 'A obra ainda dá lucro, mas <b>abaixo do previsto</b>. Deve sobrar '+fmt(r.resultado)+', contra '+fmt(PLANO.resultado)+' do plano.';
  }

  return '<h1 class="page-title">Resultado</h1>'+
    '<p class="page-sub">Quanto deve sobrar no fim da obra</p>'+

    '<div class="hero '+(r.resultado>=0?'pos':'neg')+'">'+
      '<div class="hero-label">Deve sobrar no fim</div>'+
      '<div class="hero-value">'+fmt(r.resultado)+'</div>'+
      '<div class="hero-note">'+fmtPct(r.margemPct,1)+' do contrato · plano era '+fmt(PLANO.resultado)+'</div>'+
    '</div>'+

    '<div class="frase">'+frase+'</div>'+

    '<div class="card" style="margin-bottom:14px">'+
      '<div class="card-title" style="margin-bottom:12px">A conta</div>'+
      '<div class="linha"><span>Contrato (já com os '+CONTRATO.descontoPct+'% de desconto)</span><b>'+fmt(CONTRATO.liquido)+'</b></div>'+
      '<div class="linha"><span>Concreto da obra inteira</span><b>− '+fmt(CONTRATO.concretoTotal)+'</b></div>'+
      '<div class="linha"><span>Fábrica e estrutura — '+fmtN(r.mesesTotais,1)+' meses a '+fmt(CONTRATO.fixoMensal)+'/mês</span>'+
        '<b>− '+fmt(CONTRATO.fixoMensal*r.mesesTotais)+'</b></div>'+
      '<div class="linha destaque"><span>Sobra</span><b style="color:'+(r.resultado>=0?'var(--ok)':'var(--danger)')+'">'+fmt(r.resultado)+'</b></div>'+
      '<p class="hint" style="margin-top:10px">Desse custo total, <b>'+fmt(r.jaPago)+'</b> já foi pago e <b>'+fmt(r.custoQueFalta)+'</b> ainda vai sair. '+
        'Quanto mais rápido a fábrica produzir, menos meses de custo fixo a obra carrega — é isso que muda o resultado.</p>'+
    '</div>'+

    '<div class="card" style="margin-bottom:14px">'+
      '<div class="card-title" style="margin-bottom:12px">Prazo</div>'+
      '<div class="linha"><span>Início da produção</span><b>'+(STATE.config.dataInicio?fmtDate(STATE.config.dataInicio):'não iniciada')+'</b></div>'+
      '<div class="linha"><span>Prazo combinado (3 meses)</span><b>'+(r.prazoContratual?fmtDate(r.prazoContratual):'—')+'</b></div>'+
      '<div class="linha"><span>Previsão no ritmo de agora</span><b style="color:'+(r.diasDeAtraso>0?'var(--danger)':'var(--ok)')+'">'+
        (r.terminoPrevisto?fmtDate(r.terminoPrevisto):'—')+'</b></div>'+
      (r.diasDeAtraso!=null
        ? '<div class="linha"><span>Situação</span><b style="color:'+(r.diasDeAtraso>0?'var(--danger)':'var(--ok)')+'">'+
            (r.diasDeAtraso>0 ? r.diasDeAtraso+' dias atrasado' : Math.abs(r.diasDeAtraso)+' dias de folga')+'</b></div>'
        : '')+
    '</div>'+

    '<div class="card">'+
      '<div class="card-title" style="margin-bottom:4px">E se mudar?</div>'+
      '<p class="hint" style="margin-bottom:16px">Arraste pra ver o efeito no resultado da obra.</p>'+
      '<div class="slider"><div class="sl-head"><span>Produção por dia</span><b id="sv-ritmo">'+CONTRATO.metaMDia+' m</b></div>'+
        '<input type="range" id="s-ritmo" min="100" max="450" step="10" value="'+CONTRATO.metaMDia+'"></div>'+
      '<div class="slider"><div class="sl-head"><span>Desconto dado ao cliente</span><b id="sv-desc">'+CONTRATO.descontoPct+'%</b></div>'+
        '<input type="range" id="s-desc" min="0" max="30" step="1" value="'+CONTRATO.descontoPct+'"></div>'+
      '<div class="sim-out" id="sim-out"></div>'+
    '</div>';
}

function initSimulador(){
  var el = function(id){ return document.getElementById(id); };
  if(!el('s-ritmo')) return;
  function calc(){
    var ritmo = parseFloat(el('s-ritmo').value);
    var desc  = parseFloat(el('s-desc').value);
    var liquido = CONTRATO.bruto * (1 - desc/100);
    var meses = CONTRATO.metros / (ritmo * CONTRATO.diasUteisMes);
    var custo = CONTRATO.concretoTotal + CONTRATO.fixoMensal * meses;
    var res = liquido - custo;
    var minimo = (CONTRATO.fixoMensal / (liquido/CONTRATO.metros - CONTRATO.concretoM)) / CONTRATO.diasUteisMes;

    el('sv-ritmo').textContent = ritmo + ' m';
    el('sv-desc').textContent = desc + '%';
    el('sim-out').innerHTML =
      '<div class="sim-box '+(res>=0?'pos':'neg')+'">'+
        '<div class="sim-label">Deve sobrar</div>'+
        '<div class="sim-value">'+fmt(res)+'</div>'+
        '<div class="sim-note">obra levaria '+fmtN(meses*CONTRATO.diasUteisMes,0)+' dias de trabalho · '+fmtPct(res/liquido*100,1)+' do contrato</div>'+
      '</div>'+
      (ritmo < minimo
        ? '<div class="sim-aviso">Nesse ritmo a obra dá prejuízo. O mínimo é '+fmtN(minimo)+' m por dia.</div>'
        : '<div class="sim-ok">Acima do mínimo de '+fmtN(minimo)+' m por dia.</div>');
  }
  el('s-ritmo').addEventListener('input', calc);
  el('s-desc').addEventListener('input', calc);
  calc();
}

// ============================================================================
// ENTRADA NO APP
// ============================================================================
var APP_PIN = '2027';
function tentarEntrar(){
  if(document.getElementById('gatePin').value === APP_PIN){
    document.getElementById('gate').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    try{ sessionStorage.setItem('oc_mat_auth','1'); }catch(e){}
    boot();
  } else {
    document.getElementById('gateErr').textContent = 'Senha incorreta';
    document.getElementById('gatePin').value = '';
  }
}
document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('gatePin').addEventListener('keydown', function(e){
    if(e.key==='Enter') tentarEntrar();
  });
  var ja = false;
  try{ ja = sessionStorage.getItem('oc_mat_auth')==='1'; }catch(e){}
  if(ja){
    document.getElementById('gate').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    boot();
  }
});

function boot(){
  loadState(function(){
    renderNav(); renderPage();
    if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(){});
  });
}
