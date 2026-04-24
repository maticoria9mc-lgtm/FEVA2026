// ══════════════════════════════
// VARIABLES GLOBALES
// ══════════════════════════════
var MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
var MESES_FULL=MESES;
var KINE_MSHORT=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
var PASS_HASH='9c4bb2a2fa148d5d33bc2f8cb181646c6b9fcc566e16f736c81fd88c2d5ea944';

var RAW_FUND=[], RAW_ARM=[], RAW_PLAYERS=[], RAW_MATCHES=[], RAW_VIDEOS=[], RAW_KINE=[], RAW_VIAJES=[];
var ENT_DATES_WITH_DATA=new Set();
var entSelectedDates=null, entSelectedPlayers=new Set();
var entCalYear=new Date().getFullYear(), entCalMonth=new Date().getMonth();
var entRangeStart=null, entRangeEnd=null;
var entCharts={};
var CAL_EVENTS={};
var calYear=new Date().getFullYear(), calMonth=new Date().getMonth();
var currentDiaDate=null, entDiaCalYear=new Date().getFullYear(), entDiaCalMonth=new Date().getMonth();

// ══════════════════════════════
// FUNCIONES MATEMÁTICAS GLOBALES
// ══════════════════════════════
function entAvg(arr, field){
  var vals=arr.map(r=>r[field]).filter(v=>v!==null&&v!==undefined&&!isNaN(v)&&v!==0);
  return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
}
function entSum(arr, field){ return arr.reduce((a,r)=>a+(+(r[field]||0)),0); }
function weightedSum(rows, totCol, pctCol){ return rows.reduce((acc, r)=>acc + ((r[totCol]||0) * (r[pctCol]||0)), 0); }
function safePct(v){ return (v <= 1.2 && v >= -1.2) ? v * 100 : v; }
function destroyEntChart(id){ if(entCharts[id]){ entCharts[id].destroy(); delete entCharts[id]; } }

// ══════════════════════════════
// AUTH Y NAVEGACIÓN
// ══════════════════════════════
async function hashStr(s){
  var buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function doLogin(){
  var pass=document.getElementById('auth-pass').value;
  var h=await hashStr(pass);
  if(h===PASS_HASH){
    sessionStorage.setItem('sav_auth','1');
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('auth-hidden');
    initApp();
  } else { document.getElementById('auth-error').textContent='Contraseña incorrecta.'; }
}

function doLogout(){ sessionStorage.removeItem('sav_auth'); location.reload(); }

function updateRefreshTs(){
  var ts=document.getElementById('refresh-ts');
  if(ts){ var now=new Date(); ts.textContent='Actualizado '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'); }
}

var sidebarPinned=false, sidebarHovering=false;
function sidebarHover(on){ sidebarHovering=on; if(!sidebarPinned) document.getElementById('sidebar').classList.toggle('expanded', on); }
function togglePin(){
  sidebarPinned=!sidebarPinned; var sb=document.getElementById('sidebar'), pin=document.getElementById('sidebar-pin');
  if(sidebarPinned){ sb.classList.add('fixed'); sb.classList.remove('expanded'); pin.classList.add('pinned'); pin.title='Desfijar sidebar'; } 
  else { sb.classList.remove('fixed'); pin.classList.remove('pinned'); pin.title='Fijar sidebar'; if(!sidebarHovering) sb.classList.remove('expanded'); }
}

var PANEL_META={ home:{title:'Inicio · Calendario',badge:'Temporada 2026'}, 'ent-dia':{title:'Día a Día',badge:'Resumen de Sesión'}, entrenamiento:{title:'Entrenamiento',badge:'Análisis Técnico'}, partidos:{title:'Partidos',badge:'Estadísticas'}, fisico:{title:'Preparación Física',badge:'Carga & PSE'}, kinesiologia:{title:'Kinesiología',badge:'Seguimiento Médico'}, perfil:{title:'Perfil Individual',badge:'Jugadoras'} };

function switchPanel(name,el){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active')); el.classList.add('active');
  document.getElementById('topbar-title').textContent=(PANEL_META[name]||{}).title||'';
  document.getElementById('topbar-badge').textContent=(PANEL_META[name]||{}).badge||'';
  if(name === 'ent-dia' && typeof renderEntDia === 'function' && currentDiaDate) renderEntDia();
  if(name === 'entrenamiento') setTimeout(()=>Object.keys(entCharts).forEach(id=>{if(entCharts[id])entCharts[id].resize();}), 50);
}

// ══════════════════════════════
// UTILS DE DATOS
// ══════════════════════════════
function entFormatDate(d){
  if(!d) return '';
  if(d instanceof Date) return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
  if(typeof d==='string'){ var p=d.split('/'); if(p.length===3) return p[2]+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0'); return d.substring(0,10); }
  if(typeof d==='number') return new Date(Math.round((d-25569)*86400*1000)).toISOString().substring(0,10);
  return '';
}

function parseSheetDate(val){
  if(!val) return '';
  if(val instanceof Date || typeof val==='number') return entFormatDate(val);
  var s=String(val).split(' ')[0], p=s.split('/');
  if(p.length===3) return (p[2].length===4?p[2]:'20'+p[2])+'-'+String(p[1]).padStart(2,'0')+'-'+String(p[0]).padStart(2,'0');
  return s.substring(0,10);
}

function entStripNum(name){ return name?String(name).replace(/^\d+\s*/,'').trim():''; }
function findSheet(wb, possibleNames) {
    var namesNorm = possibleNames.map(n => n.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
    for(var i=0; i<wb.SheetNames.length; i++){ if(namesNorm.includes(wb.SheetNames[i].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim())) return wb.Sheets[wb.SheetNames[i]]; }
    return null;
}

function mapPlayerName(rawName) {
    if(!rawName) return '';
    var cleanRaw = entStripNum(rawName).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if(['EQUIPO','ARGENTINA','TEAM'].includes(cleanRaw)) return 'EQUIPO';
    var exact = RAW_PLAYERS.find(p => p.NAME.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === cleanRaw);
    if (exact) return exact.NAME;
    var fuzzy = RAW_PLAYERS.find(p => {
        var master = p.NAME.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        return cleanRaw.includes(master.split(' ')[0]) || master.includes(cleanRaw.split(' ')[0]);
    });
    return fuzzy ? fuzzy.NAME : entStripNum(rawName).toUpperCase(); 
}

// ══════════════════════════════
// DESCARGA DE GOOGLE SHEETS (SIN KINESIO)
// ══════════════════════════════
var ENT_URL_FUND='https://docs.google.com/spreadsheets/d/e/2PACX-1vTGBH7pAdzok9EWtLvXHbdwy04TM0k_OArRFQZfhGITLALbu0DfcRzJxYNu7He6GeM4fuHsGXm-eQK0/pub?output=xlsx';
var ENT_URL_PLAYERS='https://docs.google.com/spreadsheets/d/e/2PACX-1vRbl7rWKnvKe11-Ty6XejZZMcE0dh6EqQpBlxUpHZ9fL__w_sCc7x7OTbsbgoGbdzHYjMlCpeXVZ4gM/pub?output=xlsx';

function loadEntData(){
  var cb = '&nocache=' + new Date().getTime();
  // Solo pedimos 2 archivos a Google Sheets
  return Promise.all([
    fetch(ENT_URL_PLAYERS + cb, {cache: 'no-store'}).then(r=>r.arrayBuffer()),
    fetch(ENT_URL_FUND + cb, {cache: 'no-store'}).then(r=>r.arrayBuffer())
  ]).then(function(bufs){
    
    // INFO Y JUGADORES
    var wb2=XLSX.read(new Uint8Array(bufs[0]),{type:'array',cellDates:true});
    var wsP=findSheet(wb2, ['INFORMACION', 'HOJA 1', 'JUGADORES', 'REGISTRO DE JUGADORES']);
    if(wsP){
      var rawP=XLSX.utils.sheet_to_json(wsP,{header:1,defval:null});
      var head = rawP[0] || [], jIdx=-1, pIdx=-1;
      for(var c=0; c<head.length; c++){
         var hStr = String(head[c]||'').toUpperCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
         if(hStr.includes('JUGADOR') || hStr==='NOMBRE') jIdx=c;
         if(hStr.includes('POSICION') || hStr==='ROL') pIdx=c;
      }
      if(jIdx >= 0){
        for(var i=1; i<rawP.length; i++){
          if(rawP[i] && rawP[i][jIdx]) RAW_PLAYERS.push({NAME: String(rawP[i][jIdx]).trim(), POS: pIdx>=0 ? String(rawP[i][pIdx]||'').trim().toUpperCase() : ''});
        }
      }
    }

    // FUNDAMENTOS Y ENTRENAMIENTO
    var wb1=XLSX.read(new Uint8Array(bufs[1]),{type:'array',cellDates:true});
    var wsFund=findSheet(wb1, ['FUNDAMENTOS']);
    if(wsFund){
      var rawRows=XLSX.utils.sheet_to_json(wsFund,{header:1,defval:null});
      for(var i=3;i<rawRows.length;i++){
        var r=rawRows[i]; if(!r[0]||!r[1]) continue;
        var ds=entFormatDate(r[0]); if(!ds) continue;
        ENT_DATES_WITH_DATA.add(ds);
        RAW_FUND.push({ DATE:ds, JUGADOR:mapPlayerName(r[1]), SAQ_TOT:+(r[2]||0), SAQ_ACE:+(r[3]||0), SAQ_ERR:+(r[4]||0), SAQ_FOUL:+(r[5]||0), SAQ_EFF: r[6]==='----'?null:+(r[6]||0), REC_TOT:+(r[7]||0), REC_ERR:+(r[8]||0), REC_PERF:+(r[9]||0), REC_POS:+(r[10]||0), REC_NEG:+(r[11]||0), ATQ_TOT:+(r[12]||0), ATQ_KILL:+(r[13]||0), ATQ_ERR:+(r[14]||0), ATQ_BLK:+(r[15]||0), ATQ_PCT: r[16]==='----'?null:+(r[16]||0), ATQ_EFF: r[17]==='----'?null:+(r[17]||0), APR_TOT:+(r[18]||0), APR_KILL:+(r[19]||0), APR_ERR:+(r[20]||0), APR_BLK:+(r[21]||0), APR_PCT: r[22]==='----'?null:+(r[22]||0), APR_EFF: r[23]==='----'?null:+(r[23]||0), CTR_TOT:+(r[24]||0), CTR_KILL:+(r[25]||0), CTR_ERR:+(r[26]||0), CTR_BLK:+(r[27]||0), CTR_PCT: r[28]==='----'?null:+(r[28]||0), CTR_EFF: r[29]==='----'?null:+(r[29]||0), BLK_TOT:+(r[30]||0), DEF_TOT:+(r[31]||0), DEF_ERR:+(r[32]||0) });
      }
    }

    var wsArm=findSheet(wb1, ['ARMADORES']);
    if(wsArm){
      var rawArm=XLSX.utils.sheet_to_json(wsArm,{header:1,defval:null});
      for(var i=3;i<rawArm.length;i++){
        var r=rawArm[i]; if(!r[0]||!r[1]) continue;
        RAW_ARM.push({ DATE:entFormatDate(r[0]), ARMADOR:mapPlayerName(r[1]), AG_TOT:+(r[2]||0), AG_EFF:+(r[3]||0), AG_PCT_KILL:+(r[4]||0), AG_PCT_POS:+(r[5]||0), PP_TOT:+(r[8]||0), PP_EFF:+(r[9]||0), PP_PCT_KILL:+(r[10]||0), TR_TOT:+(r[16]||0), TR_EFF:+(r[17]||0), TR_PCT_KILL:+(r[18]||0) });
      }
    }

    var wsVid=findSheet(wb1, ['VIDEOS']);
    if(wsVid){
      var rawVid=XLSX.utils.sheet_to_json(wsVid,{header:1,defval:null});
      for(var i=1;i<rawVid.length;i++){ if(rawVid[i]&&rawVid[i][0]) RAW_VIDEOS.push({DATE:entFormatDate(rawVid[i][0]), TIPO:String(rawVid[i][1]||''), LINK:String(rawVid[i][2]||'')}); }
    }

    // PARTIDOS Y VIAJES
    var wsM=findSheet(wb2, ['CALENDARIO PARTIDOS', 'PARTIDOS', 'CALENDARIO']);
    if(wsM){
      var rawM=XLSX.utils.sheet_to_json(wsM,{header:1,defval:null});
      for(var i=1;i<rawM.length;i++){ if(rawM[i]&&rawM[i][0]){ var mds=parseSheetDate(rawM[i][0]); if(mds) RAW_MATCHES.push({DATE:mds, TORNEO:String(rawM[i][1]||'').trim(), RIVAL:String(rawM[i][2]||'').trim(), UBICACION:String(rawM[i][3]||'').trim()}); } }
    }

    var wsV = findSheet(wb1, ['VIAJES', 'VIAJE', 'UBICACIONES']) || findSheet(wb2, ['VIAJES', 'VIAJE', 'UBICACIONES']);
    if(wsV){
      var rawV=XLSX.utils.sheet_to_json(wsV,{header:1,defval:null});
      for(var i=0;i<rawV.length;i++){
        var r=rawV[i]; if(!r || r.length === 0) continue; 
        var datesInRow = []; var textInRow = '';
        for(var col=0; col<r.length; col++){
           var cellVal = r[col]; if(!cellVal) continue;
           var parsedD = parseSheetDate(cellVal);
           if(parsedD && parsedD.length >= 8 && parsedD.startsWith('20')) datesInRow.push(parsedD);
           else if(typeof cellVal === 'string' && !['FECHA','FIN','INICIO','UBICACION','UBICACIÓN'].includes(cellVal.trim().toUpperCase()) && !textInRow) textInRow = cellVal.trim();
        }
        if(datesInRow.length > 0 && textInRow){
           var dStart = datesInRow[0], dEnd = datesInRow.length > 1 ? datesInRow[1] : datesInRow[0];
           if(dStart > dEnd) { var tmp=dStart; dStart=dEnd; dEnd=tmp; }
           RAW_VIAJES.push({START: dStart, END: dEnd, UBICACION: textInRow});
        }
      }
    }
    
    // LLEVA A CABO EL RENDERIZADO SI LAS FUNCIONES EXISTEN
    if(typeof buildCalendarEvents==='function') buildCalendarEvents();
    if(typeof entRenderPlayerSelector==='function') entRenderPlayerSelector();
    if(typeof entRenderMiniCal==='function') entRenderMiniCal();
    if(typeof entRenderStats==='function') entRenderStats();
    if(typeof renderCalendar==='function') renderCalendar();
    // Kine se actualiza solo vía Firebase ahora, pero si lo llamamos acá no pasa nada.
    if(typeof kineRender==='function') kineRender(); 
    if(typeof renderEntDia==='function' && currentDiaDate!==null) renderEntDia();
    
    updateRefreshTs();
  });
}

function refreshAllData(){
    // RAW_KINE ya no se limpia acá porque Firebase lo controla en tiempo real
    RAW_FUND=[];RAW_ARM=[];RAW_PLAYERS=[];RAW_MATCHES=[];RAW_VIDEOS=[];RAW_VIAJES=[];
    ENT_DATES_WITH_DATA=new Set(); entSelectedDates=null;
    loadEntData();
}

function initApp(){ loadEntData(); }

window.addEventListener('DOMContentLoaded',function(){
  hashStr('SELARG2026').then(h=>PASS_HASH=h);
  if(sessionStorage.getItem('sav_auth')==='1') initApp();
});   