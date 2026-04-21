var ENT_PLAYER_COLORS=[{line:'#0070BF',bg:'rgba(0,112,191,.12)'},{line:'#16a34a',bg:'rgba(22,163,74,.12)'},{line:'#d97706',bg:'rgba(217,119,6,.12)'},{line:'#7C3AED',bg:'rgba(124,58,237,.12)'},{line:'#B91C1C',bg:'rgba(185,28,28,.12)'},{line:'#0891B2',bg:'rgba(8,145,178,.12)'}];

// 🌟 VARIABLES GLOBALES PARA ESTADOS DE PESTAÑAS
var armRadarSelectedPlayers = new Set(['EQUIPO']); 
var armRadarAvailablePlayers = [];
var armRadarDataMap = {};
var armBarCurrentMode = 'AG'; 
var armRadarCurrentMetric = 'EFF'; 
var armVisibleDates = [];
var armValidArms = [];

var compRecMetric = 'PCT';
var compAtqMetric = 'PCT';
var compFaseType = 'APR';
var compFaseMetric = 'PCT';

var recEvolMetric = 'PCT';
var atqTabMode = 'AG';
var atqEvolMetric = 'PCT';

window.setCompRecMetric = function(m) { compRecMetric = m; entRenderStats(); };
window.setCompAtqMetric = function(m) { compAtqMetric = m; entRenderStats(); };
window.setCompFaseType = function(t) { compFaseType = t; entRenderStats(); };
window.setCompFaseMetric = function(m) { compFaseMetric = m; entRenderStats(); };

window.setRecEvolMetric = function(m) { recEvolMetric = m; entRenderStats(); };
window.setAtqTabMode = function(m) { atqTabMode = m; entRenderStats(); };
window.setAtqEvolMetric = function(m) { atqEvolMetric = m; entRenderStats(); };

function entCalNav(delta){ entCalMonth+=delta; if(entCalMonth>11){entCalMonth=0;entCalYear++;} if(entCalMonth<0){entCalMonth=11;entCalYear--;} entRenderMiniCal(); }

function entRenderMiniCal(){
  var titleEl = document.getElementById('ent-cal-title'); if(!titleEl) return;
  titleEl.textContent=MESES_FULL[entCalMonth]+' '+entCalYear;
  var firstDay=new Date(entCalYear,entCalMonth,1).getDay(); firstDay=(firstDay===0)?6:firstDay-1;
  var daysInMonth=new Date(entCalYear,entCalMonth+1,0).getDate(), prevDays=new Date(entCalYear,entCalMonth,0).getDate();
  var html='<div class="ent-mini-wd">Lu</div><div class="ent-mini-wd">Ma</div><div class="ent-mini-wd">Mi</div><div class="ent-mini-wd">Ju</div><div class="ent-mini-wd">Vi</div><div class="ent-mini-wd">Sá</div><div class="ent-mini-wd">Do</div>';
  
  for(var i=firstDay-1;i>=0;i--) html+='<div class="ent-mini-day other-month empty">'+(prevDays-i)+'</div>';
  
  for(var d=1;d<=daysInMonth;d++){
    var ds=entCalYear+'-'+String(entCalMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var isMatch = typeof MATCH_DATES_WITH_DATA !== 'undefined' && MATCH_DATES_WITH_DATA.has(ds);
    var hasData = typeof ENT_DATES_WITH_DATA !== 'undefined' && ENT_DATES_WITH_DATA.has(ds) && !isMatch;
    var isSel = entSelectedDates && entSelectedDates.includes(ds);
    var isRange = entRangeStart && entRangeEnd && ds > entRangeStart && ds < entRangeEnd;
    var hasVid = RAW_VIDEOS.some(v=>v.DATE===ds&&v.LINK);

    if(isMatch) {
        html+='<div class="ent-mini-day" style="cursor:not-allowed; opacity:0.5; position:relative; background:var(--bg); border:1px dashed var(--border);" title="Día de Partido (Excluido de entrenamientos)">'+d+'<span style="position:absolute; bottom:1px; right:2px; font-size:0.6rem;">🏐</span></div>';
    } else {
        var cls='ent-mini-day'+(hasData?' has-data':'')+(isSel?' selected':isRange?' in-range':'');
        html+='<div class="'+cls+'" '+(hasData?'onclick="entDayClick(\''+ds+'\')"':'')+'>'+d+(hasVid?'<span class="mini-vid-icon">🎬</span>':'')+'</div>';
    }
  }
  
  var rem=(7-(firstDay+daysInMonth)%7)%7; for(var n=1;n<=rem;n++) html+='<div class="ent-mini-day other-month empty">'+n+'</div>';
  document.getElementById('ent-mini-days').innerHTML=html; 
  if(typeof entUpdateSelInfo === 'function') entUpdateSelInfo();
}

var entClickFirst=null;
function entDayClick(ds){
  if(typeof MATCH_DATES_WITH_DATA !== 'undefined' && MATCH_DATES_WITH_DATA.has(ds)) return;
  document.querySelectorAll('.ent-range-btn').forEach(b=>b.classList.remove('active'));

  if(!entClickFirst){
    entClickFirst = ds; entRangeStart = ds; entRangeEnd = null; entSelectedDates = [ds];
  } else {
    var a = entClickFirst < ds ? entClickFirst : ds;
    var b2 = entClickFirst < ds ? ds : entClickFirst;
    entRangeStart = a; entRangeEnd = b2;
    var dates = [];
    var cur = new Date(a + 'T00:00:00'), end = new Date(b2 + 'T00:00:00');
    
    while(cur <= end){ 
        dates.push(cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0')); 
        cur.setDate(cur.getDate()+1); 
    }
    entSelectedDates = dates.filter(d => ENT_DATES_WITH_DATA.has(d) && !(typeof MATCH_DATES_WITH_DATA !== 'undefined' && MATCH_DATES_WITH_DATA.has(d)));
    if(!entSelectedDates.length) entSelectedDates = [a,b2];
    entClickFirst = null; 
  }
  
  entRenderMiniCal(); 
  if(typeof entRenderStats === 'function') entRenderStats();
}

function entSetRange(mode){
  document.querySelectorAll('.ent-range-btn').forEach(b=>b.classList.remove('active')); 
  if(event && event.currentTarget) event.currentTarget.classList.add('active');
  entClickFirst=null;
  var now=new Date(), getDates = (start, end) => {
      var dates = [], cur=new Date(start+'T00:00:00'), e=new Date(end+'T00:00:00');
      while(cur<=e){ dates.push(cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0')); cur.setDate(cur.getDate()+1); }
      return dates;
  };
  
  var isValidTrain = (d) => ENT_DATES_WITH_DATA.has(d) && !(typeof MATCH_DATES_WITH_DATA !== 'undefined' && MATCH_DATES_WITH_DATA.has(d));

  if(mode==='all'){ entSelectedDates=null; entRangeStart=null; entRangeEnd=null; } 
  else if(mode==='last7'){ var from=new Date(); from.setDate(from.getDate()-7); entRangeStart=from.toISOString().substring(0,10); entRangeEnd=now.toISOString().substring(0,10); entSelectedDates=getDates(entRangeStart,entRangeEnd).filter(isValidTrain); } 
  else if(mode==='last14'){ var from=new Date(); from.setDate(from.getDate()-14); entRangeStart=from.toISOString().substring(0,10); entRangeEnd=now.toISOString().substring(0,10); entSelectedDates=getDates(entRangeStart,entRangeEnd).filter(isValidTrain); } 
  else if(mode==='month'){ entRangeStart=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01'; var lastD=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(); entRangeEnd=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(lastD).padStart(2,'0'); entSelectedDates=getDates(entRangeStart,entRangeEnd).filter(isValidTrain); }
  
  if(mode === 'all') { entSelectedDates = Array.from(ENT_DATES_WITH_DATA).filter(isValidTrain).sort(); }

  entRenderMiniCal(); 
  if(typeof entRenderStats === 'function') entRenderStats();
}

function entUpdateSelInfo(){
  var el=document.getElementById('ent-sel-info'); 
  if(el) {
      if(!entSelectedDates || entSelectedDates.length === 0){ 
          var count = Array.from(ENT_DATES_WITH_DATA).filter(d => !(typeof MATCH_DATES_WITH_DATA !== 'undefined' && MATCH_DATES_WITH_DATA.has(d))).length;
          el.textContent=count?'Todas las fechas ('+count+' sesiones)':'Sin datos cargados'; 
      } else { 
          var uniq=[...new Set(entSelectedDates)].sort(); 
          el.textContent=uniq.length===1?'Fecha: '+uniq[0]:uniq.length+' fechas seleccionadas ('+uniq[0]+' → '+uniq[uniq.length-1]+')'; 
      }
  }
  
  var area=document.getElementById('ent-video-area');
  if(area) {
      if(entSelectedDates && entSelectedDates.length > 0) {
          var vids = RAW_VIDEOS.filter(v => entSelectedDates.includes(v.DATE) && v.LINK);
          if(vids.length > 0) {
              var vidsHtml = vids.map(vid => {
                  var fParts = vid.DATE.split('-');
                  var fShort = fParts.length === 3 ? fParts[2] + '/' + fParts[1] : vid.DATE;
                  return `<a href="${vid.LINK}" target="_blank" class="ent-video-chip" style="margin-right:6px; margin-bottom:6px; display:inline-flex; align-items:center; gap:4px; background:#0070BF; color:#fff; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:0.75rem; font-weight:800; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                              [${fShort}] ${vid.TIPO}
                          </a>`;
              }).join('');
              area.innerHTML = '<div style="display:flex; flex-wrap:wrap;">' + vidsHtml + '</div>';
          } else {
              area.innerHTML = '';
          }
      } else {
          area.innerHTML = '';
      }
  }
}

var entRoleFilter='all';
function entFilterRole(role, btn){ entRoleFilter=role; document.querySelectorAll('.psel-role-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); entRenderPlayerSelector(); }

function entRenderPlayerSelector(){
  var container=document.getElementById('ent-player-selector'); if(!container) return;
  if(!window.RAW_PLAYERS || !window.RAW_PLAYERS.length){ container.innerHTML='<div style="color:var(--sub);font-size:.8rem">No se pudieron cargar los jugadores desde la base de datos.</div>'; return; }
  
  var ROLE_BG={AR:'#DBEAFE',OP:'#FEF3C7',CT:'#DCFCE7',PR:'#F3E8FF',LI:'#FEE2E2',LB:'#FEE2E2'};
  var ROLE_FG={AR:'#1D4ED8',OP:'#92400E',CT:'#15803D',PR:'#7C3AED',LI:'#B91C1C',LB:'#B91C1C'};
  var ROLE_NAMES = {AR:'Armadores', OP:'Opuestos', PR:'Puntas', CT:'Centrales', LI:'Líberos', OTRO:'Otros'};
  
  var filtered=entRoleFilter==='all'?window.RAW_PLAYERS:window.RAW_PLAYERS.filter(p=>p.POS===entRoleFilter);

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
      var border = isLast ? 'border-right: none;' : 'border-right: 1px solid #cbd5e1;';
      var padding = 'padding: 0 10px;';
      if (isFirst) padding = 'padding: 0 10px 0 0;';
      if (isLast) padding = 'padding: 0 0 0 10px;';

      html += '<div style="display:flex; flex-direction:column; gap:6px; ' + border + ' ' + padding + '">';
      html += '<div style="font-size:0.65rem; font-weight:900; color:var(--sub, #64748b); text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #e2e8f0; padding-bottom:4px; margin-bottom:4px;">' + ROLE_NAMES[role] + '</div>';

      html += '<div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:4px;">';
      
      groups[role].forEach(p => {
          var sel = entSelectedPlayers.has(p.NAME);
          var bg = ROLE_BG[p.POS] || '#F1F5F9';
          var fg = ROLE_FG[p.POS] || '#475569';
          
          html += '<div class="player-chip'+(sel?' selected':'')+'" onclick="entTogglePlayer(\''+p.NAME+'\')" data-player="'+p.NAME+'" data-role="'+(p.POS||'')+'" style="width:100%; justify-content:flex-start; margin:0; padding:4px; font-size:0.65rem; box-sizing:border-box; overflow:hidden; display:flex; align-items:center;">';
          html += '<span class="pc-role" style="background:'+bg+';color:'+fg+';padding:1px 3px;border-radius:4px; min-width:16px; text-align:center; font-size:0.55rem; flex-shrink:0; margin-right:4px;">'+(p.POS||'-')+'</span>';
          html += '<span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; width:100%;">' + p.NAME + '</span>';
          html += '</div>';
      });
      
      html += '</div></div>';
  });

  html += '</div>';
  container.innerHTML=html;
}

function entTogglePlayer(name){ if(entSelectedPlayers.has(name)) entSelectedPlayers.delete(name); else entSelectedPlayers.add(name); document.querySelectorAll('[data-player="'+name+'"]').forEach(el=>el.classList.toggle('selected',entSelectedPlayers.has(name))); entRenderStats(); }
function entSelectAll(on){ var targets=entRoleFilter==='all'?RAW_PLAYERS:RAW_PLAYERS.filter(p=>p.POS===entRoleFilter); targets.forEach(p=>{ if(on) entSelectedPlayers.add(p.NAME); else entSelectedPlayers.delete(p.NAME); }); entRenderPlayerSelector(); entRenderStats(); }

function entMainTab(name, btn){ document.querySelectorAll('.ent-main-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); document.querySelectorAll('.ent-tab-content').forEach(tc=>tc.classList.remove('active')); var tb = document.getElementById('ent-tab-'+name); if(tb) tb.classList.add('active'); setTimeout(function(){ if(typeof entRenderStats==='function') entRenderStats(); },30); }
function entSubTab(group, name, btn){ var parent=btn.closest('.ent-tab-content'); parent.querySelectorAll('.ent-sub-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); parent.querySelectorAll('.ent-sub-content').forEach(sc=>sc.classList.remove('active')); var sub = document.getElementById('ent-sub-'+group+'-'+name); if(sub) sub.classList.add('active'); setTimeout(function(){ if(typeof entRenderStats==='function') entRenderStats(); },30); }

function entGetMode(players, dates){ return (players.length<=4&&(!dates||dates.length>1))?'evolution':'comparison'; }
function modeBadge(mode){ return mode==='evolution'?'<div class="mode-badge evolution">📈 Modo evolución — progreso por sesión</div>':'<div class="mode-badge comparison">📊 Modo comparativa — jugadores seleccionados</div>'; }

function toggleChartEmpty(canvasId, isEmpty) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var wrap = canvas.parentNode;
  var msg = wrap.querySelector('.chart-empty-msg');
  if (isEmpty) {
      canvas.style.display = 'none';
      if (!msg) {
          wrap.insertAdjacentHTML('beforeend', '<div class="chart-empty-msg" style="text-align:center;padding:30px;color:var(--sub);font-size:.8rem;">Sin acciones en el período.</div>');
      } else {
          msg.style.display = 'block';
      }
  } else {
      canvas.style.display = 'block';
      if (msg) msg.style.display = 'none';
  }
}

// 🌟 FONDOS BLANCOS OBLIGATORIOS Y TÍTULOS DINÁMICOS
function applyWhiteBgToCanvas(canvasId, titleText) {
    var canvas = document.getElementById(canvasId);
    if(canvas && canvas.parentNode) {
        var wrap = canvas.parentNode;
        wrap.style.backgroundColor = '#ffffff';
        wrap.style.borderRadius = '8px';
        wrap.style.padding = '12px';
        wrap.style.border = '1px solid #e2e8f0';
        wrap.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';

        if(titleText) {
            var existingTitle = wrap.querySelector('.dyn-chart-title');
            if(!existingTitle) {
                var t = document.createElement('div');
                t.className = 'dyn-chart-title';
                t.style.cssText = 'margin: 0 0 10px 0; color: #64748b; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; width: 100%; flex-shrink: 0; text-align: left;';
                t.textContent = titleText;
                wrap.insertBefore(t, canvas);
            } else {
                existingTitle.textContent = titleText;
            }
        }
    }
}

// 🌟 MOTOR PARA GRÁFICOS AGRUPADOS-APILADOS CON TOOLTIPS INTELIGENTES Y LEYENDAS ARRIBA
function makeGroupedStackedChart(canvasId, labels, dataTot, dataGood, dataBad, lblGood, lblBad, titleText) {
  destroyEntChart(canvasId); var canvas=document.getElementById(canvasId); if(!canvas) return;
  applyWhiteBgToCanvas(canvasId, titleText);

  var hasData = dataTot.some(v => v > 0);
  if(!hasData){ toggleChartEmpty(canvasId, true); return; }
  toggleChartEmpty(canvasId, false);

  entCharts[canvasId] = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
          labels: labels.map(p=>{var pt=p.split(' ');return pt.length>1?pt[0]+' '+pt[pt.length-1]:p;}),
          datasets: [
              { label: 'Total', data: dataTot, backgroundColor: 'rgba(0,112,191,.25)', stack: 'stack0', borderRadius: 4 },
              { label: lblGood, data: dataGood, backgroundColor: 'rgba(22,163,74,.8)', stack: 'stack1', borderRadius: 4 },
              { label: lblBad, data: dataBad, backgroundColor: 'rgba(220,38,38,.7)', stack: 'stack1', borderRadius: 4 }
          ]
      },
      options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { 
              legend: { position: 'top', align: 'center', labels:{font:{size:12, weight:'bold'}, padding:15, boxWidth:14} },
              tooltip: {
                  callbacks: {
                      label: function(context) {
                          var val = context.raw || 0;
                          var dsLabel = context.dataset.label || '';
                          if (context.datasetIndex === 0) return dsLabel + ': ' + val; 
                          var tot = context.chart.data.datasets[0].data[context.dataIndex] || 0;
                          var pct = tot > 0 ? ((val / tot) * 100).toFixed(1) : 0;
                          return dsLabel + ': ' + val + ' (' + pct + '%)';
                      }
                  }
              }
          },
          scales: { 
              x: { stacked: true, grid:{display:false} }, 
              y: { stacked: true, grid:{color:'#f0f0f0'} } 
          }
      }
  });
}

// 🌟 MOTOR PARA GRÁFICOS DE EVOLUCIÓN (Barra Fondo + Línea)
function makeTeamEvolDualChart(canvasId, dates, dataTot, dataLine, lineLabel, lineColor, titleText) {
  destroyEntChart(canvasId); var canvas=document.getElementById(canvasId); if(!canvas) return;
  applyWhiteBgToCanvas(canvasId, titleText);
  
  var hasData = dataTot.some(v => v > 0);
  if(!hasData){ toggleChartEmpty(canvasId, true); return; }
  toggleChartEmpty(canvasId, false);

  var lbls = dates.map(d => d.substring(5)); 
  entCharts[canvasId] = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
          labels: lbls,
          datasets: [
              { type: 'bar', label: 'Total Intentos', data: dataTot, backgroundColor: 'rgba(0,112,191,.2)', yAxisID: 'y', borderRadius:4, order: 2 },
              { type: 'line', label: lineLabel, data: dataLine, borderColor: lineColor, backgroundColor: lineColor, borderWidth: 3, pointRadius: 4, yAxisID: 'y2', tension: 0.3, order: 1 }
          ]
      },
      options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { 
              legend: { position: 'top', align: 'center', labels:{font:{size:12, weight:'bold'}, padding:15, boxWidth:14} },
              tooltip: {
                  callbacks: {
                      label: function(context) {
                          var val = context.raw || 0;
                          var dsLabel = context.dataset.label || '';
                          if (context.datasetIndex === 1) return dsLabel + ': ' + val + '%';
                          return dsLabel + ': ' + val;
                      }
                  }
              }
          },
          scales: {
              x: { grid:{display:false} },
              y: { position: 'left', grid:{color:'#f0f0f0'}, title: {display:true, text:'Cantidad', font:{size:9}, color:'#94a3b8'} },
              y2: { position: 'right', grid:{drawOnChartArea:false}, min:-10, max:100, ticks:{font:{size:9}, callback: v=>v+'%'}, title: {display:true, text:'Porcentaje / EFF', font:{size:9}, color:'#94a3b8'} }
          }
      }
  });
}

function makeComparisonChart(canvasId, players, datasets, totField, playerMap, isDualAxis, titleText){
  destroyEntChart(canvasId); var canvas=document.getElementById(canvasId); if(!canvas) return;
  applyWhiteBgToCanvas(canvasId, titleText);
  
  var filteredPlayers = players;
  if(totField && playerMap){
      filteredPlayers = players.filter(p => entSum(playerMap[p], totField) > 0);
  }
  if (isDualAxis) filteredPlayers = players; 

  if(!filteredPlayers.length){ toggleChartEmpty(canvasId, true); return; }
  toggleChartEmpty(canvasId, false);

  var filteredDatasets = datasets.map(ds => {
      var newData = [];
      players.forEach((p, idx) => { if (filteredPlayers.includes(p)) newData.push(ds.data[idx]); });
      var res = { label: ds.label, data: newData, backgroundColor: ds.backgroundColor, borderRadius: ds.borderRadius };
      if(isDualAxis && ds.yAxisID) res.yAxisID = ds.yAxisID;
      if(ds.type) res.type = ds.type;
      if(ds.borderColor) res.borderColor = ds.borderColor;
      if(ds.borderWidth) res.borderWidth = ds.borderWidth;
      if(ds.pointRadius) res.pointRadius = ds.pointRadius;
      if(ds.tension) res.tension = ds.tension;
      if(ds.order) res.order = ds.order;
      return res;
  });

  var labels = filteredPlayers.map(p=>{var pt=p.split(' ');return pt.length>1?pt[0]+' '+pt[pt.length-1]:p;});

  var scales = {
      x: {ticks: {font: {size: 9}}, grid: {display: false}},
      y: {ticks: {font: {size: 9}}, grid: {color: '#f0f0f0'}}
  };

  if(isDualAxis) {
      scales.y.title = {display: true, text: 'Cantidad (Total)', font: {size: 9}, color: '#94a3b8'};
      scales.y.position = 'left';
      scales.y2 = {
          position: 'right',
          ticks: {font: {size: 9}, callback: v => v + '%'},
          grid: {drawOnChartArea: false},
          title: {display: true, text: 'Porcentaje / EFF', font: {size: 9}, color: '#94a3b8'},
          min: -10, max: 100
      };
  }

  entCharts[canvasId]=new Chart(canvas.getContext('2d'),{ 
      type:'bar', 
      data:{labels:labels,datasets:filteredDatasets}, 
      options:{
          responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false}, 
          plugins:{
              legend:{position:'top', align: 'center', labels:{font:{size:12, weight:'bold'}, padding:15, boxWidth:14}},
              tooltip: {
                  callbacks: {
                      label: function(context) {
                          var val = context.raw || 0;
                          var dsLabel = context.dataset.label || '';
                          if (isDualAxis && context.datasetIndex > 0) {
                              return dsLabel + ': ' + val + '%';
                          }
                          if (!isDualAxis && context.datasetIndex > 0) {
                              var tot = context.chart.data.datasets[0].data[context.dataIndex] || 0;
                              var pct = tot > 0 ? ((val / tot) * 100).toFixed(1) : 0;
                              return dsLabel + ': ' + val + ' (' + pct + '%)';
                          }
                          return dsLabel + ': ' + val;
                      }
                  }
              }
          }, 
          scales: scales
      } 
  });
}

function makePlayerLineChart(canvasId, playerMap, allDates, eqByDate, getVal, getEqVal, yLabel, isPercent, filterFn, titleText){
  destroyEntChart(canvasId); var canvas=document.getElementById(canvasId); if(!canvas) return;
  applyWhiteBgToCanvas(canvasId, titleText);
  var datasets=[], players=Object.keys(playerMap).sort(), colorIdx=0;
  
  players.forEach(function(p){
    var byDate={}; playerMap[p].forEach(r=>{if(!byDate[r.DATE])byDate[r.DATE]=[];byDate[r.DATE].push(r);});
    var dData = allDates.map(d=>{ var rs=byDate[d]; if(!rs) return null; var vals=rs.map(getVal).filter(v=>v!=null&&!isNaN(v)); return vals.length?+(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2):null; });
    
    var hasData = filterFn ? allDates.some(d => byDate[d] && filterFn(byDate[d])) : dData.some(v => v !== null && v !== 0);
    if (hasData) {
        var col=ENT_PLAYER_COLORS[colorIdx%ENT_PLAYER_COLORS.length];
        datasets.push({ type:'line', label:p, data:dData, borderColor:col.line, backgroundColor:'transparent', borderWidth:2.5, pointRadius:4, pointBackgroundColor:col.line, fill:false, tension:.3, spanGaps:true });
        colorIdx++;
    }
  });
  
  if(eqByDate&&Object.keys(eqByDate).length){
    var datesArr=[...ENT_DATES_WITH_DATA].sort();
    var equipData=datesArr.map(d=>{ var rs=RAW_FUND.filter(r=>r.DATE===d&&entStripNum(r.JUGADOR)==='EQUIPO'); return rs.length?getEqVal(rs[0]):null; });
    datasets.push({ type:'line', label:'EQUIPO', data:equipData, borderColor:'rgba(0,0,0,.55)', backgroundColor:'transparent', borderWidth:2.5, borderDash:[7,4], pointRadius:4, pointBackgroundColor:'rgba(0,0,0,.55)', fill:false, tension:.3, spanGaps:true });
  }

  if(!datasets.length){ toggleChartEmpty(canvasId, true); return; }
  toggleChartEmpty(canvasId, false);

  entCharts[canvasId]=new Chart(canvas.getContext('2d'),{
    type:'line', data:{labels:allDates.map(d=>d.substring(5)), datasets:datasets},
    options:{
        responsive:true, maintainAspectRatio:false, interaction:{mode:'index', intersect:false}, 
        plugins:{
            legend:{position:'top', align: 'center', labels:{font:{size:12, weight:'bold'}, padding:15, boxWidth:14}},
            tooltip: { callbacks: { label: function(context) { return context.dataset.label + ': ' + Number(context.raw||0).toFixed(1) + (isPercent?'%':''); } } }
        }, 
        scales:{x:{ticks:{font:{size:9}}, grid:{display:false}}, y:{min:isPercent?0:undefined, ticks:{font:{size:9}, callback:v=>isPercent?v+'%':v.toFixed(2)}, grid:{color:'#f0f0f0'}, title:{display:true, text:yLabel, font:{size:9}}}}
    }
  });
}

function makeEvolutionChart(canvasId, playerMap, sortedDates, getTot, getM1, getM2, m1Label, m2Label, m1Color, m2Color, unit2, titleText){
  destroyEntChart(canvasId); var canvas=document.getElementById(canvasId); if(!canvas) return;
  applyWhiteBgToCanvas(canvasId, titleText);
  var datasets=[], players=Object.keys(playerMap).sort(), colorIdx=0;
  
  players.forEach(function(p){
    var byDate={}; playerMap[p].forEach(r=>{if(!byDate[r.DATE])byDate[r.DATE]=[];byDate[r.DATE].push(r);});
    var dTot = sortedDates.map(d=>{ var rs=byDate[d]; return rs?rs.reduce((a,r)=>a+getTot(r),0)/rs.length:null; });
    
    if (dTot.some(v => v !== null && v > 0)) {
        var col=ENT_PLAYER_COLORS[colorIdx%ENT_PLAYER_COLORS.length];
        datasets.push({ type:'bar', label:p+' (Total)', order:10+colorIdx, data:dTot, backgroundColor:col.bg, borderColor:col.bg.replace('.12','.4'), borderWidth:1, borderRadius:3, yAxisID:'y' });
        var dM1 = sortedDates.map(d=>{ var rs=byDate[d]; return rs?rs.reduce((a,r)=>a+getM1(r),0)/rs.length:null; });
        datasets.push({ type:'line', label:p+' '+m1Label, order:colorIdx, data:dM1, borderColor:m1Color||col.line, backgroundColor:'transparent', borderWidth:2.5, pointRadius:4, pointBackgroundColor:m1Color||col.line, tension:.3, yAxisID:'y2', spanGaps:true }); 
        if(getM2){
            var dM2 = sortedDates.map(d=>{ var rs=byDate[d]; if(!rs) return null; var vals=rs.map(getM2).filter(v=>v!==null&&!isNaN(v)); return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null; });
            datasets.push({ type:'line', label:p+' '+m2Label, order:colorIdx, data:dM2, borderColor:m2Color||'#d97706', backgroundColor:'transparent', borderWidth:2, borderDash:[5,3], pointRadius:4, pointBackgroundColor:m2Color||'#d97706', tension:.3, yAxisID:'y2', spanGaps:true }); 
        }
        colorIdx++;
    }
  });

  if(!datasets.length){ toggleChartEmpty(canvasId, true); return; }
  toggleChartEmpty(canvasId, false);

  entCharts[canvasId]=new Chart(canvas.getContext('2d'),{
    type:'bar', data:{labels:sortedDates.map(d=>d.substring(5)),datasets:datasets},
    options:{
        responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false}, 
        plugins:{
            legend:{position:'top', align: 'center', labels:{font:{size:12, weight:'bold'}, padding:15, boxWidth:14, filter:item=>item.text.indexOf('Total')<0||datasets.length/2===1}},
            tooltip: { callbacks: { label: function(context) { return context.dataset.label + ': ' + Number(context.raw||0).toFixed(1) + (context.datasetIndex>0 && unit2==='%'?'%':''); } } }
        }, 
        scales:{x:{ticks:{font:{size:9}}, grid:{display:false}}, y:{position:'left', ticks:{font:{size:9}}, grid:{color:'#f0f0f0'}, title:{display:true,text:'Cantidad',font:{size:9}}}, y2:{position:'right', grid:{drawOnChartArea:false}, min:-10, max:100, ticks:{font:{size:9},callback:v=>unit2==='%'?(v).toFixed(0)+'%':v.toFixed(2)}, title:{display:true,text:unit2==='%'?'Porcentaje':'EFF',font:{size:9}}} }
    }
  });
}

function entGetFilteredFund(){ 
    return RAW_FUND.filter(function(r){ 
        if(typeof MATCH_DATES_WITH_DATA !== 'undefined' && MATCH_DATES_WITH_DATA.has(r.DATE)) return false; 
        var dateOk=!entSelectedDates||(entSelectedDates.indexOf(r.DATE)>=0); 
        if(!dateOk) return false; 
        if(entSelectedPlayers.size===0) return true; 
        return entSelectedPlayers.has(entStripNum(r.JUGADOR).toUpperCase())||entSelectedPlayers.has(r.JUGADOR); 
    }); 
}
function entGetFilteredArm(){ 
    return RAW_ARM.filter(function(r){ 
        if(typeof MATCH_DATES_WITH_DATA !== 'undefined' && MATCH_DATES_WITH_DATA.has(r.DATE)) return false; 
        var dateOk=!entSelectedDates||(entSelectedDates.indexOf(r.DATE)>=0); 
        if(!dateOk) return false; 
        return true; 
    }); 
}

function getTrueArmTot(r, field) {
    var t = r[field] || 0;
    if (field !== 'AG_TOT' && t > 0 && t <= 1) return Math.round((r.AG_TOT || 0) * t);
    return Math.round(t);
}

function getAvgMetric(rs, totField, metricField) {
    var totAttempts = rs.reduce((a, r) => a + getTrueArmTot(r, totField), 0);
    if (totAttempts === 0) return 0;
    var weightedSum = rs.reduce((a, r) => {
        var w = getTrueArmTot(r, totField);
        var m = r[metricField] || 0;
        if (m > 1.2 || m < -1.2) m = m / 100; 
        return a + (w * m);
    }, 0);
    return (weightedSum / totAttempts) * 100;
}


// 🌟 FUNCIONES EXCLUSIVAS PARA ARMADORES
function setArmRadarMetric(metric) {
    armRadarCurrentMetric = metric;
    renderArmadoresRadar();
    document.querySelectorAll('.arm-radar-metric-btn').forEach(b => {
        b.style.background = b.dataset.metric === metric ? '#1D4ED8' : '#e2e8f0';
        b.style.color = b.dataset.metric === metric ? '#fff' : '#64748b';
    });
}

function toggleArmRadarPlayer(pName) {
    if(armRadarSelectedPlayers.has(pName)) {
        if(armRadarSelectedPlayers.size > 1) armRadarSelectedPlayers.delete(pName);
    } else {
        armRadarSelectedPlayers.add(pName);
    }
    renderArmadoresRadar();
}

function renderArmRadarButtons() {
    var container = document.getElementById('arm-radar-btns');
    if(!container) return;
    var html = '<button onclick="toggleArmRadarPlayer(\'EQUIPO\')" style="margin-right:8px; margin-bottom:4px; padding:4px 10px; border-radius:12px; border:none; cursor:pointer; font-weight:800; font-size:0.75rem; transition:0.2s; '+(armRadarSelectedPlayers.has('EQUIPO')?'background:#1D4ED8;color:#fff;':'background:#e2e8f0;color:#64748b;')+'">EQUIPO</button>';
    armRadarAvailablePlayers.forEach(p => {
        if(p==='EQUIPO') return;
        var isSel = armRadarSelectedPlayers.has(p);
        html += '<button onclick="toggleArmRadarPlayer(\''+p+'\')" style="margin-right:8px; margin-bottom:4px; padding:4px 10px; border-radius:12px; border:none; cursor:pointer; font-weight:800; font-size:0.75rem; transition:0.2s; '+(isSel?'background:#1D4ED8;color:#fff;':'background:#e2e8f0;color:#64748b;')+'">'+p+'</button>';
    });
    container.innerHTML = html;
}

function renderArmadoresRadar() {
    destroyEntChart('chart-radar-armadores');
    var canvas = document.getElementById('chart-radar-armadores');
    if(!canvas) return;
    
    var datasets = [];
    var radarColors = ['rgba(29, 78, 216, .7)', 'rgba(22, 163, 74, .7)', 'rgba(217, 119, 6, .7)', 'rgba(124, 58, 237, .7)'];
    var colIdx = 0;

    armRadarSelectedPlayers.forEach(p => {
        var rs = [];
        if (p === 'EQUIPO') {
            armValidArms.forEach(armName => { if (armRadarDataMap[armName]) rs = rs.concat(armRadarDataMap[armName]); });
        } else {
            rs = armRadarDataMap[p] || [];
        }

        if(rs.length > 0) {
            var color = p === 'EQUIPO' ? 'rgba(15, 23, 42, .8)' : radarColors[colIdx % radarColors.length];
            var valAG, valPP, valTR;
            if(armRadarCurrentMetric === 'EFF') {
                valAG = getAvgMetric(rs, 'AG_TOT', 'AG_EFF');
                valPP = getAvgMetric(rs, 'PP_TOT', 'PP_EFF');
                valTR = getAvgMetric(rs, 'TR_TOT', 'TR_EFF');
            } else {
                valAG = getAvgMetric(rs, 'AG_TOT', 'AG_PCT_KILL');
                valPP = getAvgMetric(rs, 'PP_TOT', 'PP_PCT_KILL');
                valTR = getAvgMetric(rs, 'TR_TOT', 'TR_PCT_KILL');
            }

            datasets.push({ label: p, data: [valAG, valPP, valTR], borderColor: color, backgroundColor: color.replace('.8','.1').replace('.7','.15'), borderWidth: 2.5, pointRadius: 4 });
            if(p !== 'EQUIPO') colIdx++;
        }
    });

    if(datasets.length === 0) { toggleChartEmpty('chart-radar-armadores', true); return; }
    toggleChartEmpty('chart-radar-armadores', false);

    var lbls = armRadarCurrentMetric === 'EFF' ? ['Ataque Gen (EFF)', '1ª Pelota (EFF)', 'Transición (EFF)'] : ['Ataque Gen (% Kills)', '1ª Pelota (% Kills)', 'Transición (% Kills)'];

    entCharts['chart-radar-armadores'] = new Chart(canvas.getContext('2d'), {
        type: 'radar', data: { labels: lbls, datasets: datasets },
        options: { responsive: true, maintainAspectRatio: false, layout: { padding: 0 }, plugins: { legend: { position: 'top', align: 'center', labels: { font: { size: 12, weight: 'bold' }, padding: 15, boxWidth: 14 } }, tooltip: { callbacks: { label: function(context) { return context.dataset.label + ': ' + Number(context.raw || 0).toFixed(1) + '%'; } } } }, scales: { r: { min: armRadarCurrentMetric === 'EFF' ? -10 : 0, ticks: { font: { size: 9 }, backdropColor: 'transparent', callback: v => v.toFixed(0) + '%' }, pointLabels: { font: { size: 12, weight: 'bold' }, padding: 8 }, grid: { color: 'rgba(0,0,0,.08)' } } } }
    });
    renderArmRadarButtons();
}

function setArmBarMode(mode) {
    armBarCurrentMode = mode;
    renderArmadoresBar();
    document.querySelectorAll('.arm-bar-btn').forEach(b => {
        b.style.background = b.dataset.mode === mode ? '#1D4ED8' : '#e2e8f0';
        b.style.color = b.dataset.mode === mode ? '#fff' : '#64748b';
    });
    var titles = {AG: 'Ataque General (AG)', PP: 'Primera Pelota (PP)', TR: 'Transición (TR)'};
    var tEl = document.getElementById('arm-bar-title');
    if(tEl) tEl.textContent = titles[mode];
}

function renderArmadoresBar() {
    var validArmMap = {};
    armValidArms.forEach(p => validArmMap[p] = armRadarDataMap[p] || []);
    var totF, pctF, effF;
    if(armBarCurrentMode === 'AG') { totF = 'AG_TOT'; pctF = 'AG_PCT_KILL'; effF = 'AG_EFF'; }
    else if(armBarCurrentMode === 'PP') { totF = 'PP_TOT'; pctF = 'PP_PCT_KILL'; effF = 'PP_EFF'; }
    else if(armBarCurrentMode === 'TR') { totF = 'TR_TOT'; pctF = 'TR_PCT_KILL'; effF = 'TR_EFF'; }

    makeComparisonChart('chart-arm-bar', armValidArms, [ 
        { label:'Total (Cantidad)', data: armValidArms.map(p => { var rs = validArmMap[p] || []; return rs.reduce((a,r) => a + getTrueArmTot(r, totF), 0); }), backgroundColor:'rgba(0,112,191,.25)', borderRadius:4, yAxisID: 'y' }, 
        { label:'% Kills', data: armValidArms.map(p => +(getAvgMetric(validArmMap[p]||[], totF, pctF)).toFixed(1)), backgroundColor:'rgba(22,163,74,.8)', borderRadius:4, yAxisID: 'y2' }, 
        { label:'EFF', data: armValidArms.map(p => +(getAvgMetric(validArmMap[p]||[], totF, effF)).toFixed(1)), backgroundColor:'rgba(217,119,6,.7)', borderRadius:4, yAxisID: 'y2' } 
    ], null, validArmMap, true, null); 
}


function entRenderStats(){
  var fund=entGetFilteredFund(), arm=entGetFilteredArm();
  var statSec=document.getElementById('ent-stats-section'), noData=document.getElementById('ent-nodata');

  if(!fund.length&&!arm.length){ if(statSec) statSec.classList.remove('visible'); if(noData) noData.style.display='block'; return; }
  if(statSec) statSec.classList.add('visible'); if(noData) noData.style.display='none';

  var playerMap={}, equipoRows=[];
  fund.forEach(r=>{ var key=entStripNum(r.JUGADOR)||r.JUGADOR; if(key==='EQUIPO'){ equipoRows.push(r); return; } if(!playerMap[key]) playerMap[key]=[]; playerMap[key].push(r); });
  var players=Object.keys(playerMap).sort(), visibleDates=[...new Set(fund.map(r=>r.DATE))].sort();
  var mode=entGetMode(players, visibleDates);
  var teamRows=equipoRows.length?equipoRows:fund, eqByDate={}; equipoRows.forEach(r=>{if(!eqByDate[r.DATE])eqByDate[r.DATE]=[];eqByDate[r.DATE].push(r);});

  // KPIs Header
  var tSaqTot=entSum(teamRows,'SAQ_TOT'), tSaqAce=entSum(teamRows,'SAQ_ACE'), tSaqErr=entSum(teamRows,'SAQ_ERR'), kpiSaqEff=tSaqTot>0?(tSaqAce-tSaqErr)/tSaqTot:0;
  var tRecTot=entSum(teamRows,'REC_TOT'), kpiRecPos=tRecTot>0?(weightedSum(teamRows,'REC_TOT','REC_PERF')+weightedSum(teamRows,'REC_TOT','REC_POS'))/tRecTot:0;
  var tAtqTot=entSum(teamRows,'ATQ_TOT'), kpiAtqEff=tAtqTot>0?(entSum(teamRows,'ATQ_KILL')-entSum(teamRows,'ATQ_ERR')-entSum(teamRows,'ATQ_BLK'))/tAtqTot:0;
  var eqBlkTot=entSum(equipoRows.filter(r=>visibleDates.includes(r.DATE)),'BLK_TOT');

  document.getElementById('ent-kpis-dyn').innerHTML=
    '<div class="ent-kpi"><div class="kval">'+tSaqTot+'</div><div class="klbl">Saques</div></div>'+
    '<div class="ent-kpi green"><div class="kval">'+(kpiSaqEff*100).toFixed(1)+'%</div><div class="klbl">EFF Saque</div></div>'+
    '<div class="ent-kpi"><div class="kval">'+tRecTot+'</div><div class="klbl">Recepciones</div></div>'+
    '<div class="ent-kpi blue"><div class="kval">'+(kpiRecPos*100).toFixed(1)+'%</div><div class="klbl">% Acierto Rec.</div></div>'+
    '<div class="ent-kpi"><div class="kval">'+tAtqTot+'</div><div class="klbl">Ataques</div></div>'+
    '<div class="ent-kpi gold"><div class="kval">'+(kpiAtqEff*100).toFixed(1)+'%</div><div class="klbl">EFF Ataque</div></div>'+
    '<div class="ent-kpi red"><div class="kval">'+eqBlkTot+'</div><div class="klbl">Bloqueos</div></div>';

  var mbComp = document.getElementById('mode-badge-comparar');
  if(mbComp) mbComp.innerHTML = modeBadge(mode);

  var bSt = "padding:6px 12px; border-radius:8px; border:none; cursor:pointer; font-weight:800; font-size:0.75rem; transition:0.2s;";
  var aSt = '#1D4ED8', iSt = '#e2e8f0', aCol = '#fff', iCol = '#64748b';

  // 🌟 PESTAÑA SAQUE
  var saqCont = document.querySelector('[id*="saque" i].ent-tab-content');
  if(saqCont) {
      var sTot = 0, sAce = 0, sErr = 0, sVend = 0;
      players.forEach(p => {
          var rs = playerMap[p].filter(r => visibleDates.includes(r.DATE));
          sTot += entSum(rs, 'SAQ_TOT'); sAce += entSum(rs, 'SAQ_ACE'); sErr += entSum(rs, 'SAQ_ERR'); sVend += entSum(rs, 'SAQ_FOUL');
      });
      
      var html = `<div class="stats-header" style="margin-bottom:16px;"><h3>Rendimiento de Saque</h3></div>`;
      html += `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:14px;">
          <div class="ent-chart-card" style="background:#fff; border-radius:8px; padding:20px; border:1px solid #e2e8f0; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size:2.5rem; font-weight:900; color:#0070BF;">${sTot}</div><div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase;">Total Saques</div>
          </div>
          <div class="ent-chart-card" style="background:#fff; border-radius:8px; padding:20px; border:1px solid #e2e8f0; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size:2.5rem; font-weight:900; color:#16a34a;">${sAce}</div><div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase;">Puntos (#)</div>
          </div>
          <div class="ent-chart-card" style="background:#fff; border-radius:8px; padding:20px; border:1px solid #e2e8f0; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size:2.5rem; font-weight:900; color:#0284c7;">${sVend}</div><div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase;">Positivos (/)</div>
          </div>
          <div class="ent-chart-card" style="background:#fff; border-radius:8px; padding:20px; border:1px solid #e2e8f0; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size:2.5rem; font-weight:900; color:#dc2626;">${sErr}</div><div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase;">Errores (=)</div>
          </div>
      </div>`;
      html += `<div class="ent-chart-wrap xl" style="height:400px;"><canvas id="chart-saq-bar"></canvas></div>`;
      saqCont.innerHTML = html;
      
      var arrTot = players.map(p => entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)), 'SAQ_TOT'));
      var arrGood = players.map(p => entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)), 'SAQ_ACE') + entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)), 'SAQ_FOUL'));
      var arrBad = players.map(p => entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)), 'SAQ_ERR'));
      makeGroupedStackedChart('chart-saq-bar', players, arrTot, arrGood, arrBad, 'Aces + Positivos (# y /)', 'Errores (=)', 'Comparativa de Saque: Total vs Efectividad');
  }

  // 🌟 PESTAÑA RECEPCIÓN
  var recCont = document.querySelector('[id*="recepcion" i].ent-tab-content');
  if(recCont) {
      var html = `<div class="stats-header" style="margin-bottom:16px;"><h3>Rendimiento en Recepción</h3></div>`;
      html += `<div style="display:flex; flex-wrap:wrap; gap:14px;">
          <div style="flex:1 1 450px;"><div class="ent-chart-wrap xl" style="height:400px;"><canvas id="chart-rec-gs"></canvas></div></div>
          <div style="flex:1 1 450px; background:#fff; border-radius:8px; padding:12px; border:1px solid #e2e8f0; display:flex; flex-direction:column; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
              <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #f1f5f9; padding-bottom:10px; align-items:center;">
                  <h4 style="margin:0; color:#64748b; font-size:0.85rem; font-weight:800; text-transform:uppercase;">Evolución en el Tiempo</h4>
                  <div style="display:flex; gap:6px;">
                      <button onclick="setRecEvolMetric('PCT')" style="${bSt} ${recEvolMetric==='PCT'?`background:${aSt};color:${aCol};`:`background:${iSt};color:${iCol};`}">Eficacia (#+)</button>
                      <button onclick="setRecEvolMetric('EFF')" style="${bSt} ${recEvolMetric==='EFF'?`background:${aSt};color:${aCol};`:`background:${iSt};color:${iCol};`}">Eficiencia</button>
                  </div>
              </div>
              <div class="ent-chart-wrap" style="flex-grow:1; position:relative; min-height:300px; padding:0;"><canvas id="chart-rec-evol"></canvas></div>
          </div>
      </div>`;
      recCont.innerHTML = html;
      
      var rTotArr = players.map(p => entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)), 'REC_TOT'));
      var rGoodArr = players.map(p => Math.round(playerMap[p].filter(r=>visibleDates.includes(r.DATE)).reduce((a,r) => a + (r.REC_TOT * (r.REC_PERF||0)) + (r.REC_TOT * (r.REC_POS||0)), 0)));
      var rBadArr = players.map(p => entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)), 'REC_ERR'));
      
      makeGroupedStackedChart('chart-rec-gs', players, rTotArr, rGoodArr, rBadArr, 'Aciertos (#+)', 'Errores (=)', 'Comparativa: Total de Intentos vs Calidad');
      
      var dTotArr = [], dLineArr = [];
      visibleDates.forEach(d => {
          var dRs = []; players.forEach(p => { if(playerMap[p]) { var matched = playerMap[p].filter(r=>r.DATE===d); if(matched.length) dRs = dRs.concat(matched); } });
          var dt = entSum(dRs, 'REC_TOT'); 
          var dPerf = dRs.reduce((a,r) => a + (r.REC_TOT*(r.REC_PERF||0)) + (r.REC_TOT*(r.REC_POS||0)), 0); 
          var dErr = entSum(dRs, 'REC_ERR');
          dTotArr.push(dt);
          if(dt === 0) dLineArr.push(0);
          else if(recEvolMetric === 'PCT') dLineArr.push(+((dPerf/dt)*100).toFixed(1));
          else dLineArr.push(+(((dPerf-dErr)/dt)*100).toFixed(1));
      });
      makeTeamEvolDualChart('chart-rec-evol', visibleDates, dTotArr, dLineArr, recEvolMetric==='PCT'?'Eficacia (#+)':'Eficiencia (EFF)', recEvolMetric==='PCT'?'rgba(22,163,74,1)':'rgba(217,119,6,1)', null);
  }

  // 🌟 PESTAÑA ATAQUE
  var atqCont = document.querySelector('[id*="ataque" i].ent-tab-content');
  if(atqCont) {
      var html = `<div class="stats-header" style="margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
          <h3>Rendimiento en Ataque</h3>
          <div style="display:flex; gap:6px;">
              <button onclick="setAtqTabMode('AG')" style="${bSt} ${atqTabMode==='AG'?`background:${aSt};color:${aCol};`:`background:${iSt};color:${iCol};`}">Ataque General</button>
              <button onclick="setAtqTabMode('APR')" style="${bSt} ${atqTabMode==='APR'?`background:${aSt};color:${aCol};`:`background:${iSt};color:${iCol};`}">Post-Recepción</button>
              <button onclick="setAtqTabMode('CTR')" style="${bSt} ${atqTabMode==='CTR'?`background:${aSt};color:${aCol};`:`background:${iSt};color:${iCol};`}">Contra-Ataque</button>
          </div>
      </div>`;
      html += `<div style="display:flex; flex-wrap:wrap; gap:14px;">
          <div style="flex:1 1 450px;"><div class="ent-chart-wrap xl" style="height:400px;"><canvas id="chart-atq-gs"></canvas></div></div>
          <div style="flex:1 1 450px; background:#fff; border-radius:8px; padding:12px; border:1px solid #e2e8f0; display:flex; flex-direction:column; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
              <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #f1f5f9; padding-bottom:10px; align-items:center;">
                  <h4 style="margin:0; color:#64748b; font-size:0.85rem; font-weight:800; text-transform:uppercase;">Evolución en el Tiempo</h4>
                  <div style="display:flex; gap:6px;">
                      <button onclick="setAtqEvolMetric('PCT')" style="${bSt} ${atqEvolMetric==='PCT'?`background:${aSt};color:${aCol};`:`background:${iSt};color:${iCol};`}">Eficacia (% Kills)</button>
                      <button onclick="setAtqEvolMetric('EFF')" style="${bSt} ${atqEvolMetric==='EFF'?`background:${aSt};color:${aCol};`:`background:${iSt};color:${iCol};`}">Eficiencia</button>
                  </div>
              </div>
              <div class="ent-chart-wrap" style="flex-grow:1; position:relative; min-height:300px; padding:0;"><canvas id="chart-atq-evol"></canvas></div>
          </div>
      </div>`;
      atqCont.innerHTML = html;
      
      var tF = atqTabMode==='AG'?'ATQ_TOT':atqTabMode+'_TOT';
      var kF = atqTabMode==='AG'?'ATQ_KILL':atqTabMode+'_KILL';
      var eF = atqTabMode==='AG'?'ATQ_ERR':atqTabMode+'_ERR';
      var bF = atqTabMode==='AG'?'ATQ_BLK':atqTabMode+'_BLK';
      
      var aTotArr = players.map(p => entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)), tF));
      var aGoodArr = players.map(p => entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)), kF));
      var aBadArr = players.map(p => entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)), eF) + entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)), bF));
      
      makeGroupedStackedChart('chart-atq-gs', players, aTotArr, aGoodArr, aBadArr, 'Kills (#)', 'Err+Blk (//=)', 'Comparativa: Total de Intentos vs Calidad ('+atqTabMode+')');
      
      var dATotArr = [], dALineArr = [];
      visibleDates.forEach(d => {
          var dRs = []; players.forEach(p => { if(playerMap[p]) { var matched = playerMap[p].filter(r=>r.DATE===d); if(matched.length) dRs = dRs.concat(matched); } });
          var dt = entSum(dRs, tF); var dK = entSum(dRs, kF); var dE = entSum(dRs, eF) + entSum(dRs, bF);
          dATotArr.push(dt);
          if(dt === 0) dALineArr.push(0);
          else if(atqEvolMetric === 'PCT') dALineArr.push(+((dK/dt)*100).toFixed(1));
          else dALineArr.push(+(((dK-dE)/dt)*100).toFixed(1));
      });
      makeTeamEvolDualChart('chart-atq-evol', visibleDates, dATotArr, dALineArr, atqEvolMetric==='PCT'?'Eficacia (% Kills)':'Eficiencia (EFF)', atqEvolMetric==='PCT'?'rgba(22,163,74,1)':'rgba(217,119,6,1)', null);
  }

  // 🌟 MÓDULO ARMADORES
  var armContainer = document.getElementById('ent-tab-armadores') || document.getElementById('ent-tab-ARMADORES') || document.querySelector('[id*="armadores" i].ent-tab-content');
  if(armContainer) {
      armRadarDataMap = {}; armRadarAvailablePlayers = ['EQUIPO']; armVisibleDates = [...new Set(arm.map(r=>r.DATE))].sort();
      arm.forEach(r => {
          if(!armVisibleDates.includes(r.DATE)) return;
          var k = entStripNum(r.ARMADOR) || r.ARMADOR;
          if(k === 'EQUIPO') return; 
          if(r.AG_TOT || r.PP_TOT || r.TR_TOT){
              if(!armRadarDataMap[k]) { armRadarDataMap[k] = []; armRadarAvailablePlayers.push(k); }
              armRadarDataMap[k].push(r);
          }
      });
      
      armValidArms = armRadarAvailablePlayers.filter(p => p !== 'EQUIPO');
      var armMode = entGetMode(armValidArms, armVisibleDates);
      
      var html = '<div class="stats-header" style="margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;"><h3>Distribución y Eficiencia del Armado</h3>'+modeBadge(armMode)+'</div>';
      
      if(armValidArms.length > 0) {
          html += '<div style="display:flex; flex-wrap:wrap; gap:14px;">';
          
          html += '<div style="flex: 1 1 400px; min-width:0;">';
          html += '<div class="ent-chart-card" style="background:#fff; border-radius:8px; padding:12px; border:1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); height:100%; display:flex; flex-direction:column; position:relative;">';
          html += '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">';
          html += '<div><h4 style="margin-bottom:8px; margin-top:0; color:#475569; font-size:1.1rem;">Comparativa por Sistema</h4>';
          html += '<div id="arm-radar-btns" style="display:flex; flex-wrap:wrap; gap:6px;"></div></div>';
          var btnMetricStyle = "padding:4px 10px; border-radius:8px; border:none; cursor:pointer; font-weight:800; font-size:0.7rem; transition:0.2s; width:100%; text-align:center;";
          html += '<div style="display:flex; flex-direction:column; gap:4px; min-width:80px;">';
          html += `<button class="arm-radar-metric-btn" data-metric="KILLS" onclick="setArmRadarMetric('KILLS')" style="${btnMetricStyle} ${armRadarCurrentMetric==='KILLS'?'background:#1D4ED8;color:#fff;':'background:#e2e8f0;color:#64748b;'}">Eficacia</button>`;
          html += `<button class="arm-radar-metric-btn" data-metric="EFF" onclick="setArmRadarMetric('EFF')" style="${btnMetricStyle} ${armRadarCurrentMetric==='EFF'?'background:#1D4ED8;color:#fff;':'background:#e2e8f0;color:#64748b;'}">Eficiencia</button>`;
          html += '</div></div>';
          html += '<div class="ent-chart-wrap" style="flex-grow:1; min-height:400px; position:relative; padding:0;"><canvas id="chart-radar-armadores"></canvas></div>';
          html += '</div></div>';
          
          html += '<div style="flex: 1 1 500px; min-width:0;">';
          html += '<div class="ent-chart-card" style="background:#fff; border-radius:8px; padding:12px; border:1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); height:100%; display:flex; flex-direction:column;">';
          html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">';
          html += '<h4 id="arm-bar-title" style="margin:0; color:#475569; font-size:1.1rem;">Ataque General (AG)</h4>';
          var btnStyle = "padding:6px 12px; border-radius:12px; border:none; cursor:pointer; font-weight:800; font-size:0.8rem; transition:0.2s;";
          html += '<div style="display:flex; gap:6px;">';
          html += `<button class="arm-bar-btn" data-mode="AG" onclick="setArmBarMode('AG')" style="${btnStyle} ${armBarCurrentMode==='AG'?'background:#1D4ED8;color:#fff;':'background:#e2e8f0;color:#64748b;'}">General</button>`;
          html += `<button class="arm-bar-btn" data-mode="PP" onclick="setArmBarMode('PP')" style="${btnStyle} ${armBarCurrentMode==='PP'?'background:#1D4ED8;color:#fff;':'background:#e2e8f0;color:#64748b;'}">1ª Pelota</button>`;
          html += `<button class="arm-bar-btn" data-mode="TR" onclick="setArmBarMode('TR')" style="${btnStyle} ${armBarCurrentMode==='TR'?'background:#1D4ED8;color:#fff;':'background:#e2e8f0;color:#64748b;'}">Transición</button>`;
          html += '</div></div>'; 
          html += '<div class="ent-chart-wrap xl" style="position:relative; flex-grow:1; min-height:400px;"><canvas id="chart-arm-bar"></canvas></div>';
          html += '</div></div>';
          
          html += '</div>';
          armContainer.innerHTML = html;
          renderArmadoresRadar(); 
          renderArmadoresBar();
      } else {
          armContainer.innerHTML = '<div class="no-data-msg">No hay métricas de armadores para la selección actual.</div>';
      }
  }

  // 🌟 MÓDULO COMPARATIVA (Solo se activa si players.length >= 2)
  var compContainer = document.getElementById('ent-tab-comparar') || document.getElementById('ent-tab-COMPARAR') || document.querySelector('[id*="comparar" i].ent-tab-content');
  if (compContainer) {
      if (players.length >= 2) {
          if(!compContainer.querySelector('.comp-injected')) {
              compContainer.innerHTML = `
                  <div class="comp-injected stats-header" style="margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                      <h3>Comparativa de Jugadores Seleccionados</h3>${modeBadge('comparison')}
                  </div>
                  <div class="ent-chart-card" style="background:#fff; border-radius:8px; padding:12px; border:1px solid #e2e8f0; margin-bottom:14px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                      <div class="ent-chart-wrap" style="position:relative; height:450px; padding:0;"><canvas id="chart-radar-comp"></canvas></div>
                  </div>
                  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(450px, 1fr)); gap:14px;">
                      <div class="ent-chart-card" style="background:#fff; border-radius:8px; padding:12px; border:1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                          <div class="ent-chart-wrap xl" style="position:relative; height:350px;"><canvas id="chart-comp-saq"></canvas></div>
                      </div>
                      <div class="ent-chart-card" style="background:#fff; border-radius:8px; padding:12px; border:1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                          <div style="display:flex; justify-content:flex-end; margin-bottom:10px; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">
                              <div style="display:flex; gap:6px;">
                                  <button class="comp-rec-btn" data-metric="PCT" onclick="setCompRecMetric('PCT')" style="${bSt}">Eficacia (#+)</button>
                                  <button class="comp-rec-btn" data-metric="EFF" onclick="setCompRecMetric('EFF')" style="${bSt}">Eficiencia</button>
                              </div>
                          </div>
                          <div class="ent-chart-wrap xl" style="position:relative; height:310px;"><canvas id="chart-comp-rec"></canvas></div>
                      </div>
                      <div class="ent-chart-card" style="background:#fff; border-radius:8px; padding:12px; border:1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                          <div style="display:flex; justify-content:flex-end; margin-bottom:10px; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">
                              <div style="display:flex; gap:6px;">
                                  <button class="comp-atq-btn" data-metric="PCT" onclick="setCompAtqMetric('PCT')" style="${bSt}">Eficacia (% Kills)</button>
                                  <button class="comp-atq-btn" data-metric="EFF" onclick="setCompAtqMetric('EFF')" style="${bSt}">Eficiencia</button>
                              </div>
                          </div>
                          <div class="ent-chart-wrap xl" style="position:relative; height:310px;"><canvas id="chart-comp-atq"></canvas></div>
                      </div>
                      <div class="ent-chart-card" style="background:#fff; border-radius:8px; padding:12px; border:1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                          <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:10px; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">
                              <div style="display:flex; justify-content:flex-end;">
                                  <div style="display:flex; gap:6px;">
                                      <button class="comp-fase-type-btn" data-type="APR" onclick="setCompFaseType('APR')" style="${bSt}">Post-Rec</button>
                                      <button class="comp-fase-type-btn" data-type="CTR" onclick="setCompFaseType('CTR')" style="${bSt}">Transición</button>
                                  </div>
                              </div>
                              <div style="display:flex; justify-content:flex-end;">
                                  <div style="display:flex; gap:6px;">
                                      <button class="comp-fase-metric-btn" data-metric="PCT" onclick="setCompFaseMetric('PCT')" style="${bSt}">Eficacia (% Kills)</button>
                                      <button class="comp-fase-metric-btn" data-metric="EFF" onclick="setCompFaseMetric('EFF')" style="${bSt}">Eficiencia</button>
                                  </div>
                              </div>
                          </div>
                          <div class="ent-chart-wrap xl" style="position:relative; height:270px;"><canvas id="chart-comp-fase"></canvas></div>
                      </div>
                  </div>
              `;
          }

          document.querySelectorAll('.comp-rec-btn').forEach(b => { b.style.background = b.dataset.metric === compRecMetric ? aSt : iSt; b.style.color = b.dataset.metric === compRecMetric ? aCol : iCol; });
          document.querySelectorAll('.comp-atq-btn').forEach(b => { b.style.background = b.dataset.metric === compAtqMetric ? aSt : iSt; b.style.color = b.dataset.metric === compAtqMetric ? aCol : iCol; });
          document.querySelectorAll('.comp-fase-type-btn').forEach(b => { b.style.background = b.dataset.type === compFaseType ? aSt : iSt; b.style.color = b.dataset.type === compFaseType ? aCol : iCol; });
          document.querySelectorAll('.comp-fase-metric-btn').forEach(b => { b.style.background = b.dataset.metric === compFaseMetric ? aSt : iSt; b.style.color = b.dataset.metric === compFaseMetric ? aCol : iCol; });

          var wAggAvg=function(pRows, totFn, countFn){ var t=pRows.reduce((a,r)=>a+totFn(r),0); return t>0 ? (pRows.reduce((a,r)=>a+countFn(r),0)/t)*100 : 0; };
          destroyEntChart('chart-radar-comp');
          var cRdr=document.getElementById('chart-radar-comp'), radarDatasets = [], rColorIdx = 0;
          var radarColors=['rgba(0,112,191,.7)','rgba(22,163,74,.7)','rgba(217,119,6,.7)','rgba(124,58,237,.7)','rgba(220,38,38,.7)','rgba(8,145,178,.7)','rgba(236,72,153,.7)'];
          players.forEach(function(p){
              var rs=playerMap[p].filter(r => visibleDates.includes(r.DATE));
              var tAcc = entSum(rs, 'SAQ_TOT') + entSum(rs, 'REC_TOT') + entSum(rs, 'APR_TOT') + entSum(rs, 'CTR_TOT');
              if (tAcc > 0) { 
                  var col = radarColors[rColorIdx % radarColors.length], pt = p.split(' ');
                  radarDatasets.push({
                      label: pt.length>1 ? pt[0]+' '+pt[pt.length-1] : p,
                      data: [ 
                          wAggAvg(rs, r=>r.SAQ_TOT||0, r=>(r.SAQ_ACE||0)+(r.SAQ_FOUL||0)), 
                          wAggAvg(rs, r=>r.REC_TOT||0, r=>(r.REC_TOT*(r.REC_PERF||0))+(r.REC_TOT*(r.REC_POS||0))), 
                          wAggAvg(rs, r=>r.REC_TOT||0, r=>(r.REC_TOT*(r.REC_PERF||0))+(r.REC_TOT*(r.REC_POS||0))-(r.REC_ERR||0)), 
                          wAggAvg(rs, r=>r.APR_TOT||0, r=>r.APR_KILL||0), wAggAvg(rs, r=>r.APR_TOT||0, r=>(r.APR_KILL||0)-(r.APR_ERR||0)-(r.APR_BLK||0)), 
                          wAggAvg(rs, r=>r.CTR_TOT||0, r=>r.CTR_KILL||0), wAggAvg(rs, r=>r.CTR_TOT||0, r=>(r.CTR_KILL||0)-(r.CTR_ERR||0)-(r.CTR_BLK||0)) 
                      ],
                      borderColor: col, backgroundColor: col.replace('.7','.12'), borderWidth: 2, pointRadius: 4
                  });
                  rColorIdx++;
              }
          });
          if(cRdr) entCharts['chart-radar-comp']=new Chart(cRdr.getContext('2d'),{ type:'radar', data:{labels:['Pts Saque\n(# y /)','#+%\nRecepción','EFF\nRecepción','#%\nAtq-Recepción','EFF\nAtq-Recepción','#%\nContra-Ataque','EFF\nContra-Ataque'], datasets: radarDatasets}, options:{responsive:true,maintainAspectRatio:false, layout: { padding: 10 }, plugins:{legend:{position:'top', align:'center',labels:{font:{size:12, weight:'bold'}, padding:15, boxWidth:14}}, tooltip:{callbacks:{label:function(context){return context.dataset.label+': '+Number(context.raw||0).toFixed(1)+'%';}}}}, scales:{r:{min:0,ticks:{font:{size:9},backdropColor:'transparent',callback:v=>v.toFixed(0)+'%'}, pointLabels:{font:{size:11, weight:'bold'}, padding:10}, grid:{color:'rgba(0,0,0,.08)'}}}} });

          makeGroupedStackedChart('chart-comp-saq', players, 
              players.map(p=>entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)),'SAQ_TOT')),
              players.map(p=>entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)),'SAQ_ACE') + entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)),'SAQ_FOUL')),
              players.map(p=>entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)),'SAQ_ERR')),
              'Aciertos (# y /)', 'Errores (=)', 'Saque: Volumen y Errores');

          var recBar = players.map(p=>entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)),'REC_TOT'));
          var recLine = players.map(p=>{
              var rs = playerMap[p].filter(r=>visibleDates.includes(r.DATE));
              var sTot = entSum(rs,'REC_TOT');
              if(sTot===0) return 0;
              if(compRecMetric==='EFF') return +(((weightedSum(rs,'REC_TOT','REC_PERF')+weightedSum(rs,'REC_TOT','REC_POS')-entSum(rs,'REC_ERR'))/sTot)*100).toFixed(1);
              else return +(((weightedSum(rs,'REC_TOT','REC_PERF')+weightedSum(rs,'REC_TOT','REC_POS'))/sTot)*100).toFixed(1);
          });
          makeComparisonChart('chart-comp-rec', players, [
              { type:'bar', label:'Total Intentos', data:recBar, backgroundColor:'rgba(0,112,191,.2)', borderRadius:4, yAxisID:'y', order:2 },
              { type:'line', label:compRecMetric==='EFF'?'Eficiencia (EFF)':'Eficacia (#+)', data:recLine, borderColor:'rgba(22,163,74,1)', backgroundColor:'rgba(22,163,74,1)', borderWidth:3, pointRadius:5, tension:0.3, yAxisID:'y2', order:1 }
          ], 'REC_TOT', playerMap, true, 'Recepción: Comparativa (' + (compRecMetric==='EFF'?'Eficiencia':'Eficacia') + ')');

          var atqBar = players.map(p=>entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)),'ATQ_TOT'));
          var atqLine = players.map(p=>{
              var rs = playerMap[p].filter(r=>visibleDates.includes(r.DATE));
              var sTot = entSum(rs,'ATQ_TOT');
              if(sTot===0) return 0;
              if(compAtqMetric==='EFF') return +(((entSum(rs,'ATQ_KILL')-entSum(rs,'ATQ_ERR')-entSum(rs,'ATQ_BLK'))/sTot)*100).toFixed(1);
              else return +((entSum(rs,'ATQ_KILL')/sTot)*100).toFixed(1);
          });
          makeComparisonChart('chart-comp-atq', players, [
              { type:'bar', label:'Total Intentos', data:atqBar, backgroundColor:'rgba(0,112,191,.2)', borderRadius:4, yAxisID:'y', order:2 },
              { type:'line', label:compAtqMetric==='EFF'?'Eficiencia (EFF)':'Eficacia (% Kills)', data:atqLine, borderColor:'rgba(217,119,6,1)', backgroundColor:'rgba(217,119,6,1)', borderWidth:3, pointRadius:5, tension:0.3, yAxisID:'y2', order:1 }
          ], 'ATQ_TOT', playerMap, true, 'Ataque General: Comparativa (' + (compAtqMetric==='EFF'?'Eficiencia':'Eficacia') + ')');

          var fTotCol = compFaseType+'_TOT', fKillCol = compFaseType+'_KILL', fErrCol = compFaseType+'_ERR', fBlkCol = compFaseType+'_BLK';
          var fColStr = compFaseType==='APR' ? 'rgba(124,58,237,1)' : 'rgba(8,145,178,1)';
          var fBar = players.map(p=>entSum(playerMap[p].filter(r=>visibleDates.includes(r.DATE)),fTotCol));
          var fLine = players.map(p=>{
              var rs = playerMap[p].filter(r=>visibleDates.includes(r.DATE));
              var sTot = entSum(rs,fTotCol);
              if(sTot===0) return 0;
              if(compFaseMetric==='EFF') return +(((entSum(rs,fKillCol)-entSum(rs,fErrCol)-entSum(rs,fBlkCol))/sTot)*100).toFixed(1);
              else return +((entSum(rs,fKillCol)/sTot)*100).toFixed(1);
          });
          makeComparisonChart('chart-comp-fase', players, [
              { type:'bar', label:'Total Intentos', data:fBar, backgroundColor:'rgba(0,112,191,.2)', borderRadius:4, yAxisID:'y', order:2 },
              { type:'line', label:compFaseMetric==='EFF'?'Eficiencia (EFF)':'Eficacia (% Kills)', data:fLine, borderColor:fColStr, backgroundColor:fColStr, borderWidth:3, pointRadius:5, tension:0.3, yAxisID:'y2', order:1 }
          ], fTotCol, playerMap, true, 'Ataque por Fase (' + (compFaseType==='APR'?'Post-Rec':'Transición') + ')');
      } else {
          compContainer.innerHTML = '<div class="no-data-msg">La vista de comparativa se activa al seleccionar 2 o más jugadores.</div>';
      }
  }

  // 🌟 MÓDULO BLOQUEO & DEFENSA
  var blkDefContainer=document.getElementById('blkdef-cards');
  if(blkDefContainer){
    var blkHtml='', eqBlk=equipoRows.filter(r=>visibleDates.includes(r.DATE));
    if(eqBlk.length > 0){ 
      blkHtml+='<div class="blk-player-card has-blk"><div class="blk-player-name">★ EQUIPO</div><div class="blk-stats-row"><div class="blk-stat good"><div class="bval">'+eqBlkTot+'</div><div class="blbl">Bloqueos</div></div><div class="blk-stat good"><div class="bval">'+entSum(eqBlk, 'DEF_TOT')+'</div><div class="blbl">Defensas</div></div><div class="blk-stat bad"><div class="bval">'+entSum(eqBlk, 'DEF_ERR')+'</div><div class="blbl">Err. Def.</div></div></div></div>'; 
    }
    players.forEach(function(p){
      var rs=playerMap[p].filter(r=>visibleDates.includes(r.DATE)), blkTot=entSum(rs,'BLK_TOT'), defTot=entSum(rs,'DEF_TOT'), defErr=entSum(rs,'DEF_ERR');
      if(blkTot+defTot===0) return;
      var cls='blk-player-card'+(blkTot>0?' has-blk':defTot>0?' has-def':'');
      blkHtml+='<div class="'+cls+'"><div class="blk-player-name">'+p+'</div><div class="blk-stats-row"><div class="blk-stat good"><div class="bval">'+blkTot+'</div><div class="blbl">Bloqueos</div></div><div class="blk-stat good"><div class="bval">'+defTot+'</div><div class="blbl">Defensas</div></div><div class="blk-stat bad"><div class="bval">'+defErr+'</div><div class="blbl">Err. Def.</div></div></div></div>';
    });
    blkDefContainer.innerHTML=blkHtml||'<div class="no-data-msg">Sin datos de bloqueo/defensa para la selección actual.</div>';
  }
}