var matchRoleFilter='all';

// 🌟 MOTOR GRÁFICO RESTITUIDO Y EXCLUSIVO PARA PARTIDOS
window.makeAggregateBarChart = function(canvasId, playerMap, dates, m1Logic, m2Logic, m1Label, m2Label, totField, titleText) {
    if(typeof destroyEntChart === 'function') destroyEntChart(canvasId); 
    var canvas=document.getElementById(canvasId); if(!canvas) return;
    
    // Aplicar el fondo blanco de los nuevos gráficos
    if(typeof applyWhiteBgToCanvas === 'function') applyWhiteBgToCanvas(canvasId, titleText);
    
    var players = Object.keys(playerMap);
    var filteredPlayers = players.filter(function(p){
        var playerRows = playerMap[p].filter(r => dates.includes(r.DATE));
        return totField ? (typeof entSum === 'function' ? entSum(playerRows, totField) > 0 : playerRows.length > 0) : playerRows.length > 0;
    }).sort();

    if(!filteredPlayers.length){ 
        if(typeof toggleChartEmpty === 'function') toggleChartEmpty(canvasId, true); 
        return; 
    }
    if(typeof toggleChartEmpty === 'function') toggleChartEmpty(canvasId, false);

    var ds1 = filteredPlayers.map(p=>m1Logic(playerMap[p].filter(r=>dates.includes(r.DATE))));
    var ds2 = filteredPlayers.map(p=>m2Logic(playerMap[p].filter(r=>dates.includes(r.DATE))));

    var lbls = filteredPlayers.map(p=>{var pt=p.split(' ');return pt.length>1?pt[0]+' '+pt[pt.length-1]:p;});

    entCharts[canvasId]=new Chart(canvas.getContext('2d'),{
        type:'bar', 
        data:{
            labels: lbls,
            datasets:[ 
                {label:m1Label, data:ds1, backgroundColor:'rgba(22,163,74,.8)', borderRadius:4}, 
                {label:m2Label, data:ds2, backgroundColor:'rgba(217,119,6,.7)', borderRadius:4} 
            ]
        },
        options:{
            responsive:true,maintainAspectRatio:false,
            plugins:{
                // Leyenda Arriba y Centrada (Nuevo Estilo)
                legend:{position:'top', align:'center', labels:{font:{size:12, weight:'bold'}, padding:15, boxWidth:14}},
                tooltip: { callbacks: { label: function(c) { return c.dataset.label + ': ' + Number(c.raw||0).toFixed(1) + '%'; } } }
            },
            scales:{
                x:{ticks:{font:{size:9}},grid:{display:false}},
                y:{min:-10,max:100,ticks:{font:{size:9},callback:v=>v+'%'},grid:{color:'#f0f0f0'}}
            }
        }
    });
}

function matchRenderMatchCards(){
  var container = document.getElementById('match-cards-bar');
  if(!container) return;

  var matches = [...(window.RAW_MATCH_LINKS || [])];
  
  matches.sort((a, b) => a.DATE.localeCompare(b.DATE));

  if(!matches.length){
    container.innerHTML = '<div class="no-data-msg">No hay partidos cargados.</div>';
    matchUpdateLinks();
    return;
  }

  var html = '';
  matches.forEach(function(m){
    var isSel = matchSelectedDates.includes(m.DATE);
    
    var hasStats = (typeof RAW_MATCH_STATS !== 'undefined') && RAW_MATCH_STATS.some(r => r.DATE === m.DATE);
    
    var wl = typeof matchGetWinLoss === 'function' ? matchGetWinLoss(m.RESULTADO) : 'unknown';
    var dt = new Date(m.DATE + 'T12:00:00'); 
    var dateStr = dt.toLocaleDateString('es-AR', {day:'numeric', month:'short'});
    var rivalShort = (m.RIVAL||'?').length > 8 ? (m.RIVAL||'').substring(0,7)+'…' : (m.RIVAL||'?');
    
    var flagHtml = (m.BANDERA && m.BANDERA.startsWith('http')) 
        ? '<img src="' + m.BANDERA + '" style="width:36px;height:24px;border-radius:4px;object-fit:cover;box-shadow:0 2px 4px rgba(0,0,0,0.15);display:block;margin:0 auto 6px auto;">' 
        : '<div style="width:30px;height:30px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:14px;margin:0 auto 6px auto;">' + (m.BANDERA || '🏐') + '</div>';

    var selStyle = isSel ? 'border: 2px solid var(--celeste); background: var(--card); transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.1);' : 'border: 2px solid transparent; background: var(--card);';
    var opacityStyle = hasStats ? 'opacity: 1;' : 'opacity: 0.45; filter: grayscale(80%);'; 

    var tooltip = "vs. " + (m.RIVAL||'Partido') + (m.RESULTADO ? ' · '+m.RESULTADO : '') + (!hasStats ? ' (Sin estadísticas)' : '');

    html += '<div class="match-card ' + wl + (isSel ? ' selected' : '') + '" onclick="matchDayClick(\'' + m.DATE + '\')" title="' + tooltip + '" style="cursor:pointer; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; padding:12px; border-radius:12px; min-width:110px; transition:all 0.2s; ' + selStyle + ' ' + opacityStyle + '">';
    html += flagHtml;
    html += '<div class="mc-rival" style="font-weight:900; font-size:0.85rem; text-align:center; color:var(--text); text-transform:uppercase;">' + rivalShort + '</div>';
    if(m.RESULTADO) html += '<div class="mc-result" style="text-align:center; font-weight:800; font-size:0.75rem; margin-top:2px;">' + m.RESULTADO + '</div>';
    html += '<div class="mc-date" style="font-size:0.75rem; color:var(--sub); text-align:center; margin-top:2px;">' + dateStr + '</div>';
    html += '</div>';
  });

  container.innerHTML = html;
  matchUpdateLinks();
}

function matchDayClick(ds){
    var idx = matchSelectedDates.indexOf(ds);
    if(idx > -1) { matchSelectedDates.splice(idx, 1); }
    else { matchSelectedDates.push(ds); }
    matchSelectedDates.sort();
    matchRenderMatchCards();
    matchRenderStats();
}

function matchUpdateLinks(){
  var infoEl = document.getElementById('match-sel-info');
  var areaEl = document.getElementById('match-links-area');
  var wrapper = document.getElementById('match-links-wrapper');
  if(!infoEl || !areaEl) return;

  if(matchSelectedDates.length === 0){
      infoEl.textContent = 'Seleccioná un partido para ver detalles';
      if(wrapper) wrapper.style.display = 'none';
      return;
  }

  infoEl.textContent = matchSelectedDates.length + ' partido(s) seleccionado(s)';
  if(wrapper) wrapper.style.display = 'block';

  if(matchSelectedDates.length === 1) {
      var ds = matchSelectedDates[0];
      var linkData = RAW_MATCH_LINKS.find(l => l.DATE === ds);
      if(linkData) {
          var rival = linkData.RIVAL || 'Partido Oficial';
          var bandera = linkData.BANDERA || '🏐';
          
          var banderaHtml = (bandera && bandera.startsWith('http'))
              ? '<img src="' + bandera + '" style="width:24px;height:16px;border-radius:2px;object-fit:cover;">'
              : '<span class="mlh-flag">' + bandera + '</span>';

          var dt = new Date(ds+'T12:00:00');
          var fechaStr = dt.toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});
          
          var html = '<div class="match-links-header" style="display:flex; align-items:center; gap:10px;">' + banderaHtml + '<div class="mlh-info"><div class="mlh-rival" style="font-weight:900;">vs. '+rival.toUpperCase()+'</div><div class="mlh-date" style="font-size:0.75rem; color:var(--sub);">'+fechaStr+'</div></div></div><div class="match-links-btns" style="margin-top:10px;">';
          
          if(linkData.VIDEO) html += '<a href="'+linkData.VIDEO+'" target="_blank" class="match-link-btn video" style="margin-right:8px;">▶ Video del partido</a>';
          var p2 = linkData.TABLA_P2 || linkData.PDF || '';
          if(p2) html += '<a href="'+p2+'" target="_blank" class="match-link-btn p2">📊 Tabla P2</a>';
          html += '</div>';
          
          if(!linkData.VIDEO && !p2) html = '<div class="no-data-msg" style="padding:10px;">Sin archivos/links cargados para este partido.</div>';
          areaEl.innerHTML = html;
      } else {
          areaEl.innerHTML = '<div class="no-data-msg" style="padding:10px;">Sin archivos/links cargados para este partido.</div>';
      }
  } else {
      areaEl.innerHTML = '<div style="padding:8px 0;color:var(--sub);font-size:.8rem;">'+matchSelectedDates.length+' partidos seleccionados — mostrando comparativa.</div>';
  }
}

function matchFilterRole(role, btn){ matchRoleFilter=role; document.querySelectorAll('#panel-partidos .psel-role-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); matchRenderPlayerSelector(); }

function matchRenderPlayerSelector(){
  var container=document.getElementById('match-player-selector'); if(!container) return;
  if(!window.RAW_PLAYERS || !window.RAW_PLAYERS.length){ container.innerHTML='<div style="color:var(--sub);font-size:.8rem">No se pudieron cargar los jugadores desde la base de datos.</div>'; return; }
  
  var ROLE_BG={AR:'#DBEAFE',OP:'#FEF3C7',CT:'#DCFCE7',PR:'#F3E8FF',LI:'#FEE2E2',LB:'#FEE2E2'};
  var ROLE_FG={AR:'#1D4ED8',OP:'#92400E',CT:'#15803D',PR:'#7C3AED',LI:'#B91C1C',LB:'#B91C1C'};
  var ROLE_NAMES = {AR:'Armadores', OP:'Opuestos', PR:'Puntas', CT:'Centrales', LI:'Líberos', OTRO:'Otros'};
  
  var filtered=matchRoleFilter==='all'?window.RAW_PLAYERS:window.RAW_PLAYERS.filter(p=>p.POS===matchRoleFilter);

  var groups = { 'AR': [], 'OP': [], 'PR': [], 'CT': [], 'LI': [], 'OTRO': [] };
  
  filtered.forEach(p => {
      var pos = p.POS;
      if (pos === 'LB') pos = 'LI'; 
      if (groups[pos]) groups[pos].push(p);
      else groups['OTRO'].push(p);
  });

  var colOrder = ['AR', 'OP', 'PR', 'CT', 'LI'];
  if(groups['OTRO'].length > 0) colOrder.push('OTRO');

  var html = '<div style="display:grid; grid-template-columns:repeat(' + colOrder.length + ', minmax(0, 1fr)); width:100%; align-items:start;">';

  colOrder.forEach((role, idx) => {
      var isLast = idx === colOrder.length - 1;
      var isFirst = idx === 0;
      
      // 🌟 LÍNEAS DIVISORIAS MÁS MARCADAS (#cbd5e1)
      var border = isLast ? 'border-right: none;' : 'border-right: 1px solid #cbd5e1;';
      var padding = 'padding: 0 10px;';
      if (isFirst) padding = 'padding: 0 10px 0 0;';
      if (isLast) padding = 'padding: 0 0 0 10px;';

      html += '<div style="display:flex; flex-direction:column; gap:6px; ' + border + ' ' + padding + '">';
      
      // TÍTULO DE LA COLUMNA CON LÍNEA INFERIOR MÁS MARCADA (#e2e8f0)
      html += '<div style="font-size:0.65rem; font-weight:900; color:var(--sub, #64748b); text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #e2e8f0; padding-bottom:4px; margin-bottom:4px;">' + ROLE_NAMES[role] + '</div>';

      html += '<div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:4px;">';
      
      groups[role].forEach(p => {
          var sel = matchSelectedPlayers.has(p.NAME);
          var bg = ROLE_BG[p.POS] || '#F1F5F9';
          var fg = ROLE_FG[p.POS] || '#475569';
          
          html += '<div class="player-chip'+(sel?' selected':'')+'" onclick="matchTogglePlayer(\''+p.NAME+'\')" data-player="'+p.NAME+'" style="width:100%; justify-content:flex-start; margin:0; padding:4px; font-size:0.65rem; box-sizing:border-box; overflow:hidden; display:flex; align-items:center;">';
          html += '<span class="pc-role" style="background:'+bg+';color:'+fg+';padding:1px 3px;border-radius:4px; min-width:16px; text-align:center; font-size:0.55rem; flex-shrink:0; margin-right:4px;">'+(p.POS||'-')+'</span>';
          html += '<span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; width:100%;">' + p.NAME + '</span>';
          html += '</div>';
      });
      
      html += '</div></div>';
  });

  html += '</div>';
  container.innerHTML=html;
}

function matchTogglePlayer(name){ if(matchSelectedPlayers.has(name)) matchSelectedPlayers.delete(name); else matchSelectedPlayers.add(name); document.querySelectorAll('#panel-partidos [data-player="'+name+'"]').forEach(el=>el.classList.toggle('selected',matchSelectedPlayers.has(name))); matchRenderStats(); }
function matchSelectAll(on){ var targets=matchRoleFilter==='all'?window.RAW_PLAYERS:window.RAW_PLAYERS.filter(p=>p.POS===matchRoleFilter); targets.forEach(p=>{ if(on) matchSelectedPlayers.add(p.NAME); else matchSelectedPlayers.delete(p.NAME); }); matchRenderPlayerSelector(); matchRenderStats(); }

var currentMatchTab = 'SAQUE';
var currentMatchSubTab = '';

function matchMainTab(name, btn) {
    document.querySelectorAll('#panel-partidos .ent-main-tab').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    currentMatchTab = name;
    currentMatchSubTab = ''; 
    matchRenderStats();
}

function matchSubTab(name, btn) {
    document.querySelectorAll('#panel-partidos .ent-sub-tab').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    currentMatchSubTab = name;
    matchRenderCharts(); 
}

function matchRenderStats() {
    var statSec = document.getElementById('match-stats-section');
    if (matchSelectedDates.length === 0) { if (statSec) statSec.classList.remove('visible'); return; }
    if (statSec) statSec.classList.add('visible');

    var scoreboardEl = document.getElementById('match-scoreboard');
    if(scoreboardEl) {
        if(matchSelectedDates.length === 1) {
            var sbDs = matchSelectedDates[0];
            var sbLink = RAW_MATCH_LINKS.find(l => l.DATE === sbDs);
            if(sbLink) {
                var wl = typeof matchGetWinLoss === 'function' ? matchGetWinLoss(sbLink.RESULTADO) : 'unknown';
                var wlText = {win:'GANADO', loss:'PERDIDO', draw:'EMPATE', unknown:''}[wl] || '';
                var wlBg = {win:'var(--green-bg,#dcfce7)', loss:'#fee2e2', draw:'#fef9c3', unknown:'var(--bg)'}[wl];
                var wlFg = {win:'var(--green,#15803d)', loss:'#991b1b', draw:'#92400e', unknown:'var(--sub)'}[wl];
                var sbDt = new Date(sbDs+'T12:00:00');
                var sbFecha = sbDt.toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});
                
                var sbBanderaHtml = (sbLink.BANDERA && sbLink.BANDERA.startsWith('http')) 
                    ? '<img src="' + sbLink.BANDERA + '" style="width:40px;height:26px;border-radius:4px;object-fit:cover;box-shadow:0 2px 4px rgba(0,0,0,0.2);">' 
                    : '<span class="sb-flag" style="font-size:1.5rem;">' + (sbLink.BANDERA || '🏐') + '</span>';

                scoreboardEl.style.display = 'flex';
                scoreboardEl.innerHTML =
                    '<div class="sb-flag-rival" style="display:flex; align-items:center; gap:12px;">' + sbBanderaHtml + '<div><div class="sb-rival" style="font-weight:900; font-size:1.1rem;">vs. '+(sbLink.RIVAL||'Rival').toUpperCase()+'</div><div class="sb-fecha" style="color:var(--sub); font-size:0.8rem;">'+sbFecha+'</div></div></div>' +
                    (sbLink.RESULTADO ? '<div class="sb-score-wrap"><div class="sb-score">'+(sbLink.RESULTADO)+'</div>'+(wlText?'<div class="sb-wl-badge" style="background:'+wlBg+';color:'+wlFg+'">'+wlText+'</div>':'')+'</div>' : '');
            } else { scoreboardEl.style.display = 'none'; scoreboardEl.innerHTML = ''; }
        } else { scoreboardEl.style.display = 'none'; scoreboardEl.innerHTML = ''; }
    }

    var tabData = RAW_MATCH_STATS.filter(r => 
        matchSelectedDates.includes(r.DATE) && 
        r.TAB === currentMatchTab &&
        (matchSelectedPlayers.size === 0 || matchSelectedPlayers.has(r.JUGADOR_MAPPED))
    );

    var groups = [...new Set(tabData.map(r => r.TAB_GROUP))];
    if(groups.length === 0) {
        document.getElementById('match-sub-tabs-container').innerHTML = '';
        document.getElementById('match-charts-container').innerHTML = '<div class="no-data-msg" style="padding:30px; background:var(--card); border-radius:12px;">No hay métricas de Data Volley cargadas para este partido. Las estadísticas aparecerán cuando se sincronice el Excel.</div>';
        document.getElementById('match-kpis-dyn').innerHTML = '';
        return;
    }

    var subTabsHtml = '';
    
    groups.sort((a, b) => {
        var sa = a.toUpperCase(); var sb = b.toUpperCase();
        var saGen = sa.includes('GENERAL') || sa === 'SAQUE';
        var sbGen = sb.includes('GENERAL') || sb === 'SAQUE';
        
        if (saGen && !sbGen) return -1;
        if (!saGen && sbGen) return 1;
        
        var getWeight = function(str) {
            if (str.includes('#')) return 1;
            if (str.includes('+')) return 2;
            if (str.includes('!')) return 3;
            if (str.includes('-')) return 4;
            return 5; 
        };
        
        var wA = getWeight(sa); var wB = getWeight(sb);
        if (wA !== wB) return wA - wB;
        return a.localeCompare(b);
    });

    if(!currentMatchSubTab || !groups.includes(currentMatchSubTab)) currentMatchSubTab = groups[0];

    groups.forEach(g => {
        var activeCls = g === currentMatchSubTab ? ' active' : '';
        subTabsHtml += `<button class="ent-sub-tab${activeCls}" onclick="matchSubTab('${g}', this)">${g}</button>`;
    });
    
    document.getElementById('match-sub-tabs-container').innerHTML = groups.length > 1 ? subTabsHtml : '';
    matchRenderCharts();
}

function matchRenderCharts() {
    try {
        var subTabData = RAW_MATCH_STATS.filter(r => 
            matchSelectedDates.includes(r.DATE) && 
            r.TAB === currentMatchTab && 
            r.TAB_GROUP === currentMatchSubTab &&
            (matchSelectedPlayers.size === 0 || matchSelectedPlayers.has(r.JUGADOR_MAPPED))
        );

        var eqData = subTabData.filter(r => r.JUGADOR_MAPPED === 'EQUIPO');
        var playersData = subTabData.filter(r => r.JUGADOR_MAPPED !== 'EQUIPO');

        var tTot = entSum(eqData, 'TOT'), tErr = entSum(eqData, 'ERR'), tBlk = entSum(eqData, 'BLK');
        var tPosPerf = entSum(eqData, 'POS_PERF') || (entSum(eqData, 'POS') + entSum(eqData, 'PERF'));
        var tKill = entSum(eqData, 'KILL'), tAce = entSum(eqData, 'ACE');
        var htmlKpi = '';

        function fr(val, tot) { return (val > 0 && val <= 1 && tot > 1) ? val : (tot > 0 ? val/tot : 0); }
        function cnt(val, tot) { return Math.round(fr(val, tot) * tot); }
        function pct(val, tot) { return (fr(val, tot) * 100).toFixed(1) + '%'; }

        if (currentMatchTab === 'SAQUE') {
            var aceF = fr(tAce, tTot), errF = fr(tErr, tTot);
            var sEff = ((aceF - errF) * 100).toFixed(1);
            htmlKpi += `<div class="ent-kpi"><div class="kval">${tTot}</div><div class="klbl">Saques</div></div>
                        <div class="ent-kpi green"><div class="kval">${sEff}%</div><div class="klbl">EFF Saque</div></div>
                        <div class="ent-kpi blue"><div class="kval">${cnt(tAce, tTot)}</div><div class="klbl">Aces #</div></div>
                        <div class="ent-kpi red"><div class="kval">${cnt(tErr, tTot)}</div><div class="klbl">Errores =</div></div>`;
        } else if (currentMatchTab === 'RECEPCION') {
            var posF = fr(tPosPerf, tTot), errFr = fr(tErr, tTot);
            htmlKpi += `<div class="ent-kpi"><div class="kval">${tTot}</div><div class="klbl">Recepciones</div></div>
                        <div class="ent-kpi blue"><div class="kval">${(posF*100).toFixed(1)}%</div><div class="klbl">% Acierto (#+)</div></div>
                        <div class="ent-kpi gold"><div class="kval">${((posF - errFr)*100).toFixed(1)}%</div><div class="klbl">EFF Rec.</div></div>
                        <div class="ent-kpi red"><div class="kval">${cnt(tErr, tTot)}</div><div class="klbl">Errores =</div></div>`;
        } else { 
            var killF = fr(tKill, tTot), errFa = fr(tErr, tTot), blkFa = fr(tBlk, tTot);
            htmlKpi += `<div class="ent-kpi"><div class="kval">${tTot}</div><div class="klbl">Ataques</div></div>
                        <div class="ent-kpi blue"><div class="kval">${(killF*100).toFixed(1)}%</div><div class="klbl">% Kills #</div></div>
                        <div class="ent-kpi gold"><div class="kval">${((killF - errFa - blkFa)*100).toFixed(1)}%</div><div class="klbl">EFF Ataque</div></div>
                        <div class="ent-kpi red"><div class="kval">${cnt(tErr,tTot)+cnt(tBlk,tTot)}</div><div class="klbl">Err = + Blk /</div></div>`;
        }
        document.getElementById('match-kpis-dyn').innerHTML = htmlKpi;

        var chartTitle1 = currentMatchSubTab + " — ACUMULADO DEL EQUIPO";
        var chartTitle2 = currentMatchSubTab + " — Evolución / Comparativa %";
        var chartTitle3 = currentMatchSubTab + " — Evolución / Comparativa EFF";
        
        document.getElementById('match-charts-container').innerHTML = `
            <div class="ent-chart-card" style="margin-bottom:14px; border: 2px solid var(--celeste-light);"><h4>${chartTitle1}</h4><div class="ent-chart-wrap"><canvas id="chart-match-agg"></canvas></div></div>
            <div class="ent-chart-card" style="margin-bottom:14px;"><h4>${chartTitle2}</h4><div class="ent-chart-wrap xl"><canvas id="chart-match-pct"></canvas></div></div>
            <div class="ent-chart-card" id="match-eff-card"><h4>${chartTitle3}</h4><div class="ent-chart-wrap xl"><canvas id="chart-match-eff"></canvas></div></div>
        `;

        var pMap = {}, eqByDate = {};
        eqData.forEach(r => { eqByDate[r.DATE] = r; });
        playersData.forEach(r => {
            var key = r.JUGADOR_RAW;
            if(!pMap[key]) pMap[key] = [];
            pMap[key].push(r);
        });

        if(Object.keys(pMap).length === 0 && eqData.length > 0) {
            pMap['EQUIPO'] = eqData;
        }

        var dates = matchSelectedDates, players = Object.keys(pMap).sort();

        function rPct(r, field, totField) {
            var v = r[field]||0, t = r[totField||'TOT']||0;
            if(!v) return null;
            return fr(v, t) * 100;
        }
        function rsPct(rs, field) {
            var v = entSum(rs, field), t = entSum(rs, 'TOT');
            if(!t) return 0;
            return fr(v, t) * 100;
        }
        function rsEff(rs, posField, errField, blkField) {
            var t = entSum(rs, 'TOT');
            var pF = fr(entSum(rs, posField), t), eF = fr(entSum(rs, errField), t), bF = blkField ? fr(entSum(rs, blkField), t) : 0;
            return (pF - eF - bF) * 100;
        }

        if(currentMatchTab === 'SAQUE') {
            makeAggregateBarChart('chart-match-agg', pMap, dates, rs => rsPct(rs, 'ACE'), rs => rsEff(rs, 'ACE', 'ERR'), 'Aces (#%)', 'Eficiencia E (%)', 'TOT', null);
            if(dates.length > 1) {
                makePlayerLineChart('chart-match-pct', pMap, dates, null, r => rPct(r,'ACE'), null, 'Aces (#%)', true, rs => entSum(rs,'TOT')>0, null);
                makePlayerLineChart('chart-match-eff', pMap, dates, null, r => { var t=r.TOT||0; return t>0?(fr(r.ACE,t)-fr(r.ERR,t))*100:null; }, null, 'Eficiencia E (%)', false, rs => entSum(rs,'TOT')>0, null);
            } else {
                document.getElementById('match-eff-card').style.display = 'none';
                makeComparisonChart('chart-match-pct', players, [
                    {label:'Total', data:players.map(p=>entSum(pMap[p],'TOT')), backgroundColor:'rgba(0,112,191,.3)'},
                    {label:'Aces', data:players.map(p=>cnt(entSum(pMap[p],'ACE'), entSum(pMap[p],'TOT'))), backgroundColor:'rgba(22,163,74,.8)'},
                    {label:'Errores', data:players.map(p=>cnt(entSum(pMap[p],'ERR'), entSum(pMap[p],'TOT'))), backgroundColor:'rgba(220,38,38,.7)'}
                ], 'TOT', pMap, false, null);
            }
        } else if(currentMatchTab === 'RECEPCION') {
            makeAggregateBarChart('chart-match-agg', pMap, dates, rs => rsPct(rs, 'POS_PERF') || rsEff(rs,'POS','PERF') + rsPct(rs,'PERF'), rs => rsEff(rs,'POS_PERF','ERR'), '% Acierto (#+)', 'Eficiencia E (%)', 'TOT', null);
            if(dates.length > 1) {
                makePlayerLineChart('chart-match-pct', pMap, dates, null, r => { var pp=r.POS_PERF||(r.POS+r.PERF)||0; return rPct({...r,'_pp':pp},'_pp'); }, null, '% Acierto (#+)', true, rs => entSum(rs,'TOT')>0, null);
                makePlayerLineChart('chart-match-eff', pMap, dates, null, r => { var t=r.TOT||0; var pp=fr(r.POS_PERF||(r.POS+r.PERF)||0,t); return t>0?(pp-fr(r.ERR,t))*100:null; }, null, 'Eficiencia E (%)', false, rs => entSum(rs,'TOT')>0, null);
            } else {
                document.getElementById('match-eff-card').style.display = 'none';
                makeComparisonChart('chart-match-pct', players, [
                    {label:'Total', data:players.map(p=>entSum(pMap[p],'TOT')), backgroundColor:'rgba(0,112,191,.3)'},
                    {label:'Aciertos', data:players.map(p=>cnt(entSum(pMap[p],'POS_PERF')||(entSum(pMap[p],'POS')+entSum(pMap[p],'PERF')), entSum(pMap[p],'TOT'))), backgroundColor:'rgba(22,163,74,.8)'},
                    {label:'Errores', data:players.map(p=>cnt(entSum(pMap[p],'ERR'), entSum(pMap[p],'TOT'))), backgroundColor:'rgba(220,38,38,.7)'}
                ], 'TOT', pMap, false, null);
            }
        } else { 
            makeAggregateBarChart('chart-match-agg', pMap, dates, rs => rsPct(rs, 'KILL'), rs => rsEff(rs,'KILL','ERR','BLK'), '% Kills (#%)', 'Eficiencia E (%)', 'TOT', null);
            if(dates.length > 1) {
                makePlayerLineChart('chart-match-pct', pMap, dates, null, r => rPct(r,'KILL'), null, '% Kills (#%)', true, rs => entSum(rs,'TOT')>0, null);
                makePlayerLineChart('chart-match-eff', pMap, dates, null, r => { var t=r.TOT||0; return t>0?(fr(r.KILL,t)-fr(r.ERR,t)-fr(r.BLK,t))*100:null; }, null, 'Eficiencia E (%)', false, rs => entSum(rs,'TOT')>0, null);
            } else {
                document.getElementById('match-eff-card').style.display = 'none';
                makeComparisonChart('chart-match-pct', players, [
                    {label:'Total', data:players.map(p=>entSum(pMap[p],'TOT')), backgroundColor:'rgba(0,112,191,.3)'},
                    {label:'Kills', data:players.map(p=>cnt(entSum(pMap[p],'KILL'), entSum(pMap[p],'TOT'))), backgroundColor:'rgba(22,163,74,.8)'},
                    {label:'Err+Blk', data:players.map(p=>cnt(entSum(pMap[p],'ERR'), entSum(pMap[p],'TOT'))+cnt(entSum(pMap[p],'BLK'), entSum(pMap[p],'TOT'))), backgroundColor:'rgba(220,38,38,.7)'}
                ], 'TOT', pMap, false, null);
            }
        }
    } catch(e) {
        console.error("Error renderizando gráficos de partido:", e);
    }
}