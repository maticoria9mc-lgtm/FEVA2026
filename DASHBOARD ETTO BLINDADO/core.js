// ══════════════════════════════
// VARIABLES Y FUNCIONES GLOBALES
// ══════════════════════════════
var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
var KINE_MSHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
var KINE_MNAMES = MESES;

var RAW_FUND=[], RAW_ARM=[], RAW_VIDEOS=[];
var RAW_MATCH_STATS=[];

var ENT_DATES_WITH_DATA = new Set(), MATCH_DATES_WITH_DATA = new Set();
var entSelectedDates = null, entSelectedPlayers = new Set();
var matchSelectedDates = [], matchSelectedPlayers = new Set();
var entCalYear = new Date().getFullYear(), entCalMonth = new Date().getMonth();
var matchCalYear = new Date().getFullYear(), matchCalMonth = new Date().getMonth();
var entRangeStart = null, entRangeEnd = null;
var entCharts = {};

function entAvg(arr, field){ var vals=arr.map(r=>r[field]).filter(v=>v!==null&&v!==undefined&&!isNaN(v)&&v!==0); return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0; }
function entSum(arr, field){ return arr.reduce((a,r)=>a+(+(r[field]||0)),0); }
function weightedSum(rows, totCol, pctCol){ return rows.reduce((acc, r)=>acc + ((r[totCol]||0) * (r[pctCol]||0)), 0); }
function safePct(v){ return (v <= 1.2 && v >= -1.2) ? v * 100 : v; }
function destroyEntChart(id){ if(entCharts[id]){ entCharts[id].destroy(); delete entCharts[id]; } }

var PASS_HASH='9c4bb2a2fa148d5d33bc2f8cb181646c6b9fcc566e16f736c81fd88c2d5ea944';
async function hashStr(s){ var buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)); return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join(''); }
async function doLogin(){ var pass=document.getElementById('auth-pass').value; var h=await hashStr(pass); if(h===PASS_HASH){ sessionStorage.setItem('sav_auth','1'); document.getElementById('auth-screen').classList.add('hidden'); document.getElementById('app').classList.remove('auth-hidden'); initApp(); } else { document.getElementById('auth-error').textContent='Contraseña incorrecta.'; } }
function doLogout(){ sessionStorage.removeItem('sav_auth'); location.reload(); }
function updateRefreshTs(){ var ts=document.getElementById('refresh-ts'); if(ts){ var now=new Date(); ts.textContent='Actualizado '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'); } }

var sidebarPinned=false, sidebarHovering=false;
function sidebarHover(on){ sidebarHovering=on; if(!sidebarPinned) document.getElementById('sidebar').classList.toggle('expanded', on); }
function togglePin(){ sidebarPinned=!sidebarPinned; var sb=document.getElementById('sidebar'), pin=document.getElementById('sidebar-pin'); if(sidebarPinned){ sb.classList.add('fixed'); sb.classList.remove('expanded'); pin.classList.add('pinned'); pin.title='Desfijar sidebar'; } else { sb.classList.remove('fixed'); pin.classList.remove('pinned'); pin.title='Fijar sidebar'; if(!sidebarHovering) sb.classList.remove('expanded'); } }

var PANEL_META={ home:{title:'Inicio · Calendario',badge:'Temporada 2026'}, 'ent-dia':{title:'Día a Día',badge:'Resumen de Sesión'}, entrenamiento:{title:'Entrenamiento',badge:'Análisis Técnico'}, partidos:{title:'Partidos',badge:'Estadísticas Oficiales'}, fisico:{title:'Preparación Física',badge:'Carga & PSE'}, kinesiologia:{title:'Kinesiología',badge:'Seguimiento Médico'}, perfil:{title:'Perfil Individual',badge:'Jugadores'}, config:{title:'Configuración',badge:'Base de Datos'} };

function switchPanel(name,el){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active')); document.getElementById('panel-'+name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active')); el.classList.add('active');
  document.getElementById('topbar-title').textContent=(PANEL_META[name]||{}).title||''; document.getElementById('topbar-badge').textContent=(PANEL_META[name]||{}).badge||'';
  
  if(name === 'ent-dia' && typeof renderEntDia === 'function') { 
      if(typeof currentDiaDate === 'undefined' || !currentDiaDate) { 
          var now = new Date();
          window.currentDiaDate = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
          window.entDiaCalYear = now.getFullYear();
          window.entDiaCalMonth = now.getMonth();
      } 
      renderEntDia(); 
  }
  
  if(name === 'entrenamiento') { setTimeout(function(){ if(typeof entRenderStats==='function') entRenderStats(); setTimeout(()=>Object.keys(entCharts).forEach(id=>{if(id.includes('ent-') && entCharts[id])entCharts[id].resize();}), 60); }, 30); }
  if(name === 'partidos' && typeof matchRenderMatchCards === 'function') { matchRenderMatchCards(); if(typeof matchRenderPlayerSelector==='function') matchRenderPlayerSelector(); setTimeout(function(){ if(matchSelectedDates.length>0 && typeof matchRenderStats==='function') matchRenderStats(); setTimeout(()=>Object.keys(entCharts).forEach(id=>{if(id.includes('match-') && entCharts[id])entCharts[id].resize();}), 60); }, 30); }
  if(name === 'kinesiologia' && typeof kineRender === 'function') { kineRender(); }
}

function parseSheetDate(val){
  if(!val) return '';
  if(val instanceof Date) return val.toISOString().substring(0,10);
  if(typeof val==='number') return new Date(Math.round((val-25569)*86400*1000)).toISOString().substring(0,10);
  var s=String(val).trim();
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0,10);
  var p=s.split(/[\/\-]/);
  if(p.length===3) { var y = p[2].length===2 ? '20'+p[2] : p[2]; var m = p[1].padStart(2,'0'); var d = p[0].padStart(2,'0'); return y+'-'+m+'-'+d; }
  return '';
}

function findSheet(wb, possibleNames) { 
    var namesNorm = possibleNames.map(n => n.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()); 
    for(var i=0; i<wb.SheetNames.length; i++){ if(namesNorm.includes(wb.SheetNames[i].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim())) return wb.Sheets[wb.SheetNames[i]]; } 
    return null; 
}

function smartPlayerMap(rawName) {
    if(!rawName) return null;
    var s = String(rawName).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    var ignoreList = ['FECHA', 'RESULTADO', 'SET', 'OPONENTE', 'RIVAL', 'TEAM', 'ENTRENAMIENTO', 'PARTIDO'];
    for(var i=0; i<ignoreList.length; i++) { if(s.includes(ignoreList[i])) return null; }
    if(s.includes('TOTAL') || s === 'EQUIPO' || s === 'ARGENTINA') return 'EQUIPO';
    s = s.replace(/^[\d\W_]+/, '').trim(); 
    if(!s) return null;
    
    if(window.RAW_PLAYERS) {
        var exact = window.RAW_PLAYERS.find(p => p.NAME.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === s);
        if(exact) return exact.NAME;
        var parts = s.split(' ').filter(x=>x.length>2);
        if(parts.length > 0) { 
            for(var j=0; j<window.RAW_PLAYERS.length; j++) { 
                var pName = window.RAW_PLAYERS[j].NAME.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); 
                if(parts.some(pt => pName.includes(pt)) || pName.includes(parts[0])) return window.RAW_PLAYERS[j].NAME; 
            } 
        }
    }
    return s; 
}

function upsertFund(d, jug, data) {
    var row = RAW_FUND.find(r => r.DATE === d && r.JUGADOR === jug);
    if(!row) { row = { DATE: d, JUGADOR: jug, SAQ_TOT:0, SAQ_ACE:0, SAQ_ERR:0, REC_TOT:0, REC_ERR:0, REC_PERF:0, REC_POS:0, ATQ_TOT:0, ATQ_KILL:0, ATQ_ERR:0, ATQ_BLK:0, APR_TOT:0, APR_KILL:0, APR_ERR:0, APR_BLK:0, CTR_TOT:0, CTR_KILL:0, CTR_ERR:0, CTR_BLK:0, BLK_TOT:0, DEF_TOT:0, DEF_ERR:0 }; RAW_FUND.push(row); }
    Object.assign(row, data);
}

function parseMatchSheetAdvanced(ws, tabType) {
    var raw = XLSX.utils.sheet_to_json(ws, {header:1, defval:null}); if(!raw.length) return;
    var headerRowIdx = -1;
    for(var i=0; i<Math.min(10, raw.length); i++) { var rowStr = raw[i].join(' ').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); if(rowStr.includes('FECHA') && (rowStr.includes('JUGADOR') || rowStr.includes('NOMBRE'))) { headerRowIdx = i; break; } }
    if(headerRowIdx === -1) return;
    var groupRow = headerRowIdx > 0 ? raw[headerRowIdx - 1] : []; var colRow = raw[headerRowIdx]; var currentGroup = "GENERAL"; var colMeta = [];
    for(var c=0; c<colRow.length; c++) { var g = String(groupRow[c] || '').trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); if(g) currentGroup = g; var colName = String(colRow[c] || '').trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); colMeta.push({ group: currentGroup, name: colName, index: c }); }
    var fIdx=-1, jIdx=-1; colMeta.forEach(m => { if(m.name === 'FECHA' || m.name === 'DATE') fIdx = m.index; if(m.name === 'JUGADOR' || m.name === 'NOMBRE') jIdx = m.index; });
    if(fIdx===-1) fIdx=0; if(jIdx===-1) jIdx=3;
    var currentMatchDate = null;
    for(var i = headerRowIdx + 1; i < raw.length; i++) {
        var r = raw[i]; if(!r || r.length < 2) continue;
        var cellF = r[fIdx]; if(cellF) { var pD = parseSheetDate(cellF); if(pD && pD.length === 10) currentMatchDate = pD; }
        var d = currentMatchDate; if(!d) continue;
        var rawJug = String(r[jIdx]||'').trim(); var rawJugUpper = rawJug.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if(!rawJug || rawJugUpper === 'FECHA' || rawJugUpper === 'JUGADOR' || rawJugUpper.includes('SET') || rawJugUpper.includes('RESULTADO')) continue;
        var jugMapped = smartPlayerMap(rawJugUpper); if(!jugMapped) continue;
        
        var groupsMap = {};
        colMeta.forEach(m => {
            if(['FECHA','RESULTADO','RIVAL','JUGADOR','NOMBRE','SET'].includes(m.name) || !m.name) return;
            if(!groupsMap[m.group]) groupsMap[m.group] = { TOT:0, ERR:0, BLK:0, POS:0, PERF:0, POS_PERF:0, EFF:0, ACE:0, KILL:0 };
            var val = r[m.index], num = 0; if(typeof val === 'string') num = parseFloat(val.replace('%','').replace(',','.')) || 0; else num = parseFloat(String(val).replace(',','.')) || 0;
            if(m.name === 'TOT') groupsMap[m.group].TOT = num; else if(m.name === '%=') groupsMap[m.group].ERR = num; else if(m.name === '%/') groupsMap[m.group].BLK = num; else if(m.name === '%+') groupsMap[m.group].POS = num; else if(m.name === '%#' || m.name === 'EXC' || m.name === 'ACES' || m.name === 'KILL' || m.name === 'PT' || m.name === 'PTS') { groupsMap[m.group].PERF = num; groupsMap[m.group].ACE = num; groupsMap[m.group].KILL = num; } else if(m.name === '%#+') groupsMap[m.group].POS_PERF = num; else if(m.name === 'EFF') groupsMap[m.group].EFF = num;
        });
        Object.keys(groupsMap).forEach(g => {
            var tabAssigned = tabType; if(tabType === 'SAQ_REC') tabAssigned = g.includes('SAQUE') ? 'SAQUE' : 'RECEPCION';
            RAW_MATCH_STATS.push({ DATE: d, TAB: tabAssigned, TAB_GROUP: g, JUGADOR_RAW: jugMapped === 'EQUIPO' ? 'EQUIPO' : rawJug, JUGADOR_MAPPED: jugMapped, TOT: groupsMap[g].TOT, ERR: groupsMap[g].ERR, BLK: groupsMap[g].BLK, POS: groupsMap[g].POS, PERF: groupsMap[g].PERF, POS_PERF: groupsMap[g].POS_PERF, EFF: groupsMap[g].EFF, ACE: groupsMap[g].ACE, KILL: groupsMap[g].KILL });
        });
        var gSaq = Object.keys(groupsMap).find(k=>k.includes('SAQUE')); var gRec = Object.keys(groupsMap).find(k=>k.includes('GENERAL') && k.includes('RECEPCION')); if(!gRec) gRec = Object.keys(groupsMap).find(k=>k.includes('GENERAL')); var gGen = Object.keys(groupsMap).find(k=>k.includes('GENERAL')) || Object.keys(groupsMap)[0];
        if(tabType === 'SAQ_REC') { if(gSaq) upsertFund(d, jugMapped, { SAQ_TOT: groupsMap[gSaq].TOT, SAQ_ERR: groupsMap[gSaq].ERR, SAQ_ACE: groupsMap[gSaq].ACE }); if(gRec) upsertFund(d, jugMapped, { REC_TOT: groupsMap[gRec].TOT, REC_ERR: groupsMap[gRec].ERR, REC_POS: groupsMap[gRec].POS, REC_PERF: groupsMap[gRec].PERF }); } else if(tabType === 'ATQ') { if(gGen) upsertFund(d, jugMapped, { ATQ_TOT: groupsMap[gGen].TOT, ATQ_ERR: groupsMap[gGen].ERR, ATQ_BLK: groupsMap[gGen].BLK, ATQ_KILL: groupsMap[gGen].KILL, APR_TOT: groupsMap[gGen].TOT, APR_KILL: groupsMap[gGen].KILL, APR_ERR: groupsMap[gGen].ERR, APR_BLK: groupsMap[gGen].BLK }); } else if(tabType === 'CA') { if(gGen) upsertFund(d, jugMapped, { CTR_TOT: groupsMap[gGen].TOT, CTR_ERR: groupsMap[gGen].ERR, CTR_BLK: groupsMap[gGen].BLK, CTR_KILL: groupsMap[gGen].KILL }); }
    }
}

// ── SINCRONIZADOR GLOBAL (Une Drive y Firebase) ──
window.syncGlobalState = function() {
    ENT_DATES_WITH_DATA.clear();
    MATCH_DATES_WITH_DATA.clear();

    if(RAW_FUND) RAW_FUND.forEach(r => { if(r.DATE) ENT_DATES_WITH_DATA.add(r.DATE); });
    if(RAW_MATCH_STATS) RAW_MATCH_STATS.forEach(r => { if(r.DATE) { ENT_DATES_WITH_DATA.add(r.DATE); MATCH_DATES_WITH_DATA.add(r.DATE); } });

    if(typeof window.CONF_MATCHES !== 'undefined') {
        window.RAW_MATCHES = []; window.RAW_MATCH_LINKS = [];
        window.CONF_MATCHES.forEach(m => { 
            if(m.DATE) { 
                ENT_DATES_WITH_DATA.add(m.DATE); MATCH_DATES_WITH_DATA.add(m.DATE);
                window.RAW_MATCHES.push({DATE: m.DATE, TORNEO: m.TORNEO || '', RIVAL: m.RIVAL, UBICACION: '', BANDERA: m.BANDERA || '', RESULTADO: ''});
                window.RAW_MATCH_LINKS.push({DATE: m.DATE, RIVAL: m.RIVAL, BANDERA: m.BANDERA || '', VIDEO: '', PDF: '', TABLA_P2: '', RESULTADO: ''});
            } 
        });
    }

    if(typeof window.RAW_KINE !== 'undefined') {
        window.RAW_KINE.forEach(k => { if(k.DATE) ENT_DATES_WITH_DATA.add(k.DATE); });
    }

    if(typeof buildCalendarEvents==='function') buildCalendarEvents();
    if(typeof entRenderPlayerSelector==='function') entRenderPlayerSelector();
    if(typeof entRenderMiniCal==='function') entRenderMiniCal();
    if(typeof matchRenderPlayerSelector==='function') matchRenderPlayerSelector();
    if(typeof matchRenderMatchCards==='function') matchRenderMatchCards();
    if(typeof updateUpcomingEvents==='function') updateUpcomingEvents();
    if(typeof renderCalendar==='function') { renderCalendar(); setTimeout(renderCalendar, 100); }
    if(typeof kineRender==='function') kineRender();
    if(typeof renderEntDia==='function' && typeof currentDiaDate !== 'undefined' && currentDiaDate!==null) renderEntDia();
};

var ENT_URL_FUND='https://docs.google.com/spreadsheets/d/e/2PACX-1vTGBH7pAdzok9EWtLvXHbdwy04TM0k_OArRFQZfhGITLALbu0DfcRzJxYNu7He6GeM4fuHsGXm-eQK0/pub?output=xlsx';
var MATCH_URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vQjQ0E9n_eGJ-yycK9Vbul6QJGmBATQnm9p29ddUE8Lazhyog37o7vyK6MeyR60X-WbZjOd-DetRkMo/pub?output=xlsx';

function loadEntData(){
  var cb = '&nocache=' + new Date().getTime();
  return Promise.all([
    fetch(ENT_URL_FUND + cb, {cache: 'no-store'}).then(r=>r.arrayBuffer()),
    fetch(MATCH_URL + cb, {cache: 'no-store'}).then(r=>r.arrayBuffer()) 
  ]).then(function(bufs){
    RAW_FUND=[]; RAW_ARM=[]; RAW_VIDEOS=[]; RAW_MATCH_STATS=[]; 

    var wb1=XLSX.read(new Uint8Array(bufs[0]),{type:'array',cellDates:true});
    var wsFund=findSheet(wb1, ['FUNDAMENTOS']);
    if(wsFund){ var rawRows=XLSX.utils.sheet_to_json(wsFund,{header:1,defval:null}); for(var i=3;i<rawRows.length;i++){ var r=rawRows[i]; if(!r[0]||!r[1]) continue; var ds=parseSheetDate(r[0]); if(!ds) continue; RAW_FUND.push({ DATE:ds, JUGADOR:smartPlayerMap(r[1]), SAQ_TOT:+(r[2]||0), SAQ_ACE:+(r[3]||0), SAQ_ERR:+(r[4]||0), SAQ_FOUL:+(r[5]||0), SAQ_EFF: r[6]==='----'?null:+(r[6]||0), REC_TOT:+(r[7]||0), REC_ERR:+(r[8]||0), REC_PERF:+(r[9]||0), REC_POS:+(r[10]||0), REC_NEG:+(r[11]||0), ATQ_TOT:+(r[12]||0), ATQ_KILL:+(r[13]||0), ATQ_ERR:+(r[14]||0), ATQ_BLK:+(r[15]||0), ATQ_PCT: r[16]==='----'?null:+(r[16]||0), ATQ_EFF: r[17]==='----'?null:+(r[17]||0), APR_TOT:+(r[18]||0), APR_KILL:+(r[19]||0), APR_ERR:+(r[20]||0), APR_BLK:+(r[21]||0), APR_PCT: r[22]==='----'?null:+(r[22]||0), APR_EFF: r[23]==='----'?null:+(r[23]||0), CTR_TOT:+(r[24]||0), CTR_KILL:+(r[25]||0), CTR_ERR:+(r[26]||0), CTR_BLK:+(r[27]||0), CTR_PCT: r[28]==='----'?null:+(r[28]||0), CTR_EFF: r[29]==='----'?null:+(r[29]||0), BLK_TOT:+(r[30]||0), DEF_TOT:+(r[31]||0), DEF_ERR:+(r[32]||0) }); } }

    var wsArm=findSheet(wb1, ['ARMADORES']);
    if(wsArm){ 
        var rawArm=XLSX.utils.sheet_to_json(wsArm,{header:1,defval:null}); 
        for(var i=3;i<rawArm.length;i++){ 
            var r=rawArm[i]; 
            if(!r[0]||!r[1]) continue; 
            // 🌟 LECTURA CORREGIDA SEGÚN LA TABLA DEL EXCEL 🌟
            RAW_ARM.push({ 
                DATE:parseSheetDate(r[0]), 
                ARMADOR:smartPlayerMap(r[1]), 
                AG_TOT:+(r[2]||0), 
                AG_EFF:+(r[3]||0), 
                AG_PCT_KILL:+(r[4]||0), 
                PP_TOT:+(r[10]||0), 
                PP_EFF:+(r[11]||0), 
                PP_PCT_KILL:+(r[12]||0), 
                TR_TOT:+(r[18]||0), 
                TR_EFF:+(r[19]||0), 
                TR_PCT_KILL:+(r[20]||0) 
            }); 
        } 
    }

    var wsVid=findSheet(wb1, ['VIDEOS']);
    if(wsVid){ var rawVid=XLSX.utils.sheet_to_json(wsVid,{header:1,defval:null}); for(var i=1;i<rawVid.length;i++){ if(rawVid[i]&&rawVid[i][0]) RAW_VIDEOS.push({DATE:parseSheetDate(rawVid[i][0]), TIPO:String(rawVid[i][1]||''), LINK:String(rawVid[i][2]||'')}); } }

    var wbMatch=XLSX.read(new Uint8Array(bufs[1]),{type:'array',cellDates:true});
    var wsMSaqRec=findSheet(wbMatch, ['SAQUE & RECEPCION', 'SAQUE Y RECEPCION', 'RECEPCION', 'SAQUE - RECEPCION']);
    if(wsMSaqRec) parseMatchSheetAdvanced(wsMSaqRec, 'SAQ_REC');
    
    var wsMAtq=findSheet(wbMatch, ['RECEPCION - ATAQUE', 'RECEPCION ATAQUE', 'RECEPCIÓN - ATAQUE', 'ATAQUE']);
    if(wsMAtq) parseMatchSheetAdvanced(wsMAtq, 'ATQ');
    
    var wsMCa=findSheet(wbMatch, ['CONTRA-ATAQUE', 'CONTRA ATAQUE']);
    if(wsMCa) parseMatchSheetAdvanced(wsMCa, 'CA');

    syncGlobalState();
    
    var dbg=document.getElementById('cal-debug');
    if(dbg) dbg.textContent='Sistema híbrido conectado (Estadísticas = Drive | Resto = Firebase)';
    updateRefreshTs();
  }).catch(function(e){
    console.error('Error cargando estadísticas:',e);
    var dbg=document.getElementById('cal-debug'); if(dbg) dbg.textContent='Error cargando estadísticas: '+e.message;
  });
}

function refreshAllData(){
    if(window.isRefreshing) return; window.isRefreshing = true;
    var icon=document.getElementById('refresh-icon'); if(icon){icon.style.transition='transform .6s ease';icon.style.transform='rotate(360deg)';}
    var prevDiaDate = typeof currentDiaDate !== 'undefined' ? currentDiaDate : null; 
    var prevMatchDates = [...matchSelectedDates];
    
    loadEntData().then(function(){ 
        if(icon){icon.style.transition='none';icon.style.transform='rotate(0deg)';} 
        window.isRefreshing = false; 
        if(prevDiaDate && ENT_DATES_WITH_DATA.has(prevDiaDate) && typeof verDetalleDia === 'function') verDetalleDia(prevDiaDate);
        if(prevMatchDates.length > 0) { matchSelectedDates = prevMatchDates; if(typeof matchRenderMatchCards==='function') matchRenderMatchCards(); if(typeof matchRenderStats==='function') matchRenderStats(); }
    }).catch(function(){ if(icon){icon.style.transition='none';icon.style.transform='rotate(0deg)';} window.isRefreshing = false; });
}

function initApp(){ if(typeof renderCalendar === 'function') renderCalendar(); loadEntData(); }

window.addEventListener('DOMContentLoaded',function(){ hashStr('SELARG2026').then(h=>PASS_HASH=h); if(sessionStorage.getItem('sav_auth')==='1') initApp(); });