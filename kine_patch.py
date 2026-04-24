filepath = 'C:/Users/matic/OneDrive/Documentos/verdent-projects/LAF2026-IACC ANALISIS RENDIMIENTO/SAV-DASHBOARD/index.html'
with open(filepath, encoding='utf-8') as f:
    content = f.read()

new_kine = '''// ══════════════════════════════
// KINESIOLOGIA MODULE
// ══════════════════════════════
var kineCalYear=new Date().getFullYear();
var kineCalMonth=new Date().getMonth();
var KINE_MNAMES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
var KINE_MSHORT=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
var KINE_AV_COLS=['#4F46E5','#0EA5E9','#EC4899','#F59E0B','#10B981','#EF4444','#6366F1','#14B8A6','#F97316','#8B5CF6','#06B6D4','#84CC16'];
var KINE_ROLE_COLS={CENTRAL:'#4F46E5',RECEPTOR:'#0EA5E9',OPUESTO:'#EC4899',ARMADOR:'#F59E0B',LIBERO:'#10B981',PUNTA:'#EF4444'};
function kineAvatarColor(n){var h=0;for(var i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))&0xFFFF;return KINE_AV_COLS[h%KINE_AV_COLS.length];}
function kineInitials(n){var p=n.trim().split(/\\s+/);return(p[0]?p[0][0].toUpperCase():'')+(p.length>1?p[p.length-1][0].toUpperCase():'');}
function kineAvatarHTML(n){var c=kineAvatarColor(n);return \'<div class="kine-avatar" style="background:\'+c+\'">\'+kineInitials(n)+\'</div>\';}
function kineRender(){
  var loading=document.getElementById(\'kine-loading\'),body=document.getElementById(\'kine-body\');
  if(!loading||!body)return;
  if(!RAW_KINE.length){loading.style.display=\'block\';loading.textContent=\'Sin datos de kinesiologia.\';body.innerHTML=\'\';return;}
  loading.style.display=\'none\';
  var ms=document.getElementById(\'kine-month-filter\');
  if(ms&&ms.options.length<=1){
    var months=[...new Set(RAW_KINE.map(function(r){return r.DATE.substring(0,7);}))].sort().reverse();
    months.forEach(function(m){var o=document.createElement(\'option\');o.value=m;var p=m.split(\'-\');o.textContent=KINE_MSHORT[+p[1]-1]+\' \'+p[0];ms.appendChild(o);});
  }
  kineRenderCal();kineRenderRoles();kineFilter();
}
function kineCalNav(d){kineCalMonth+=d;if(kineCalMonth>11){kineCalMonth=0;kineCalYear++;}if(kineCalMonth<0){kineCalMonth=11;kineCalYear--;}kineRenderCal();}
function kineRenderCal(){
  var title=document.getElementById(\'kine-cal-title\'),grid=document.getElementById(\'kine-cal-grid\');
  if(!title||!grid)return;
  title.textContent=KINE_MNAMES[kineCalMonth]+\' \'+kineCalYear;
  var dm={};RAW_KINE.forEach(function(r){if(!dm[r.DATE])dm[r.DATE]=[];dm[r.DATE].push(r);});
  var fd=(new Date(kineCalYear,kineCalMonth,1).getDay()+6)%7;
  var dim=new Date(kineCalYear,kineCalMonth+1,0).getDate();
  var h=\'<div class="kine-cal-dow"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="kine-cal-days">\';
  for(var i=0;i<fd;i++)h+=\'<div class="kine-cal-cell"></div>\';
  for(var d=1;d<=dim;d++){
    var ds=kineCalYear+\'-\'+String(kineCalMonth+1).padStart(2,\'0\')+\'-\'+String(d).padStart(2,\'0\');
    var recs=dm[ds]||[];var lvl=Math.min(5,recs.length);
    var cls=\'kine-cal-cell\'+(recs.length?\' has-kine level-\'+lvl:\'\');
    var oc=recs.length?\' onclick="kineCalDayClick(\\\'"+ds+"\\\')"\':\'\';
    h+=\'<div class="\'+cls+\'"\'+oc+\'><span class="kine-cal-num">\'+d+\'</span>\'+(recs.length?\'<span class="kine-cal-dot">\'+recs.length+\'</span>\':\'\')+\'</div>\';
  }
  h+=\'</div>\';grid.innerHTML=h;
  var pp=document.getElementById(\'kine-day-popup\');if(pp)pp.style.display=\'none\';
}
function kineCalDayClick(ds){
  var pp=document.getElementById(\'kine-day-popup\');if(!pp)return;
  var recs=RAW_KINE.filter(function(r){return r.DATE===ds;});
  if(!recs.length){pp.style.display=\'none\';return;}
  var p=ds.split(\'-\'),dd=p[2]+\' \'+KINE_MSHORT[+p[1]-1]+\' \'+p[0];
  pp.innerHTML=\'<div class="kine-popup-head">\'+dd+\' \u2014 \'+recs.length+\' atenci\u00f3n\'+(recs.length>1?\'es\':\'\')+
    \' <button onclick="document.getElementById(\\\'kine-day-popup\\\').style.display=\\\'none\\\'" class="kine-popup-close">\u2715</button></div>\'+
    \'<table class="kine-table"><thead><tr><th>Jugador</th><th>Turno</th><th>Intervenci\u00f3n</th><th>Observaciones</th></tr></thead><tbody>\'+
    recs.map(function(r){
      var tl=r.TURNO.toLowerCase(),tc=tl.indexOf(\'ma\')>=0?\'kine-turno-manana\':tl.indexOf(\'tard\')>=0?\'kine-turno-tarde\':tl.indexOf(\'noch\')>=0?\'kine-turno-noche\':\'kine-turno-otro\';
      return \'<tr><td class="kine-td-interv">\'+r.JUGADOR+\'</td><td class="kine-td-turno"><span class="kine-turno-pill \'+tc+\'">\'+r.TURNO+\'</span></td><td>\'+r.INTERVENCION+\'</td><td class="kine-td-obs">\'+r.OBSERVACIONES+\'</td></tr>\';
    }).join(\'\')+\'</tbody></table>\';
  pp.style.display=\'block\';
}
function kineRenderRoles(){
  var container=document.getElementById(\'kine-role-grid\');if(!container)return;
  var posMap={};
  RAW_PLAYERS.forEach(function(pl){var k=(pl.NAME||\'\').trim().toUpperCase();if(k)posMap[k]=pl.POS||pl.POSICION||\'?\';});
  function getPos(name){var u=name.toUpperCase();if(posMap[u])return posMap[u];var found=Object.keys(posMap).find(function(k){return u.indexOf(k)>=0||k.indexOf(u)>=0;});return found?posMap[found]:\'?\';}
  var rm={};
  RAW_KINE.forEach(function(r){var pos=getPos(r.JUGADOR);if(!rm[pos])rm[pos]={count:0,players:{}};rm[pos].count++;rm[pos].players[r.JUGADOR]=true;});
  var roles=Object.keys(rm).sort(function(a,b){return rm[b].count-rm[a].count;});
  if(!roles.length){container.innerHTML=\'<div class="kine-loading-msg" style="padding:20px">Sin datos.</div>\';return;}
  container.innerHTML=roles.map(function(role){
    var d=rm[role],col=KINE_ROLE_COLS[role.toUpperCase()]||\'#6366F1\';
    var pn=Object.keys(d.players),extra=pn.length>3?\' +\'+(pn.length-3):\'\';
    return \'<div class="kine-role-item" style="border-top:3px solid \'+col+\'">\'+
      \'<div class="kine-role-rname" style="color:\'+col+\'">\'+role+\'</div>\'+
      \'<div class="kine-role-rcount" style="color:\'+col+\'">\'+d.count+\'</div>\'+
      \'<div class="kine-role-rlabel">atenciones</div>\'+
      \'<div class="kine-role-rplayers">\'+pn.slice(0,3).map(function(n){var pp=n.split(\' \');return pp.length>1?pp[0]+\' \'+pp[pp.length-1]:n;}).join(\' \u00b7 \')+extra+\'</div>\'+
      \'</div>\';
  }).join(\'\');
}
function kineFilter(){
  var search=((document.getElementById(\'kine-search\')||{}).value||\'').trim().toLowerCase();
  var mf=((document.getElementById(\'kine-month-filter\')||{}).value||\'\');
  var filtered=RAW_KINE.filter(function(r){
    var ms=!search||(r.JUGADOR.toLowerCase().indexOf(search)>=0||r.INTERVENCION.toLowerCase().indexOf(search)>=0||r.OBSERVACIONES.toLowerCase().indexOf(search)>=0);
    return ms&&(!mf||r.DATE.indexOf(mf)===0);
  });
  kineRenderBody(filtered);
}
function kineRenderBody(data){
  var body=document.getElementById(\'kine-body\'),summary=document.getElementById(\'kine-summary\');
  if(!body)return;
  var pm={};data.forEach(function(r){if(!pm[r.JUGADOR])pm[r.JUGADOR]=[];pm[r.JUGADOR].push(r);});
  var pl=Object.keys(pm).sort(function(a,b){return pm[b].length-pm[a].length;});
  var ic={};data.forEach(function(r){if(r.INTERVENCION)ic[r.INTERVENCION]=(ic[r.INTERVENCION]||0)+1;});
  var topI=Object.keys(ic).sort(function(a,b){return ic[b]-ic[a];})[0]||\'\u2013\';
  if(summary){summary.innerHTML=
    \'<div class="kine-stat-pill"><div class="kine-stat-val">\'+data.length+\'</div><div class="kine-stat-lbl">Total Atenciones</div></div>\'+
    \'<div class="kine-stat-pill"><div class="kine-stat-val">\'+pl.length+\'</div><div class="kine-stat-lbl">Jugadores Atendidos</div></div>\'+
    \'<div class="kine-stat-pill" style="min-width:160px"><div class="kine-stat-val" style="font-size:1rem;text-align:center">\'+topI+\'</div><div class="kine-stat-lbl">Intervenci\u00f3n + Frecuente</div></div>\';}
  if(!pl.length){body.innerHTML=\'<div class="kine-loading-msg">Sin resultados.</div>\';return;}
  body.innerHTML=pl.map(function(p){
    var rows=pm[p].slice().sort(function(a,b){return b.DATE.localeCompare(a.DATE);});
    var tr=rows.map(function(r){
      var tl=r.TURNO.toLowerCase(),tc=tl.indexOf(\'ma\')>=0?\'kine-turno-manana\':tl.indexOf(\'tard\')>=0?\'kine-turno-tarde\':tl.indexOf(\'noch\')>=0?\'kine-turno-noche\':\'kine-turno-otro\';
      var dp=r.DATE.split(\'-\'),ddisp=(dp[2]||\'?\')+\' \'+KINE_MSHORT[+(dp[1]||1)-1]+\' \'+(dp[0]||\'\'');
      return \'<tr><td class="kine-td-date">\'+ddisp+\'</td><td class="kine-td-turno"><span class="kine-turno-pill \'+tc+\'">\'+r.TURNO+\'</span></td><td class="kine-td-interv">\'+r.INTERVENCION+\'</td><td class="kine-td-obs">\'+r.OBSERVACIONES+\'</td></tr>\';
    }).join(\'\');
    return \'<div class="kine-player-card">\'+
      \'<div class="kine-player-head"><div class="kine-player-info">\'+kineAvatarHTML(p)+\'<div class="kine-player-name">\'+p+\'</div></div>\'+
      \'<div class="kine-player-badge">\'+rows.length+\' \'+(rows.length===1?\'atenci\u00f3n\':\'atenciones\')+\'</div></div>\'+
      \'<table class="kine-table"><thead><tr><th>Fecha</th><th>Turno</th><th>Intervenci\u00f3n</th><th>Observaciones</th></tr></thead>\'+
      \'<tbody>\'+tr+\'</tbody></table></div>\';
  }).join(\'\');
}'''

start_idx = content.find('// KINESIOLOG')
sep2 = content.rfind('//', 0, start_idx-2)
# find the // == line
for i in range(start_idx, 0, -1):
    if content[i:i+5] == '// \u2550\u2550':
        sep2 = i
        break
block_start = sep2
script_close = content.find('</script>', block_start)
block_end = content.rfind('}', block_start, script_close)+1
new_content = content[:block_start] + new_kine + '\n' + content[block_end:]
with open(filepath,'w',encoding='utf-8') as f:
    f.write(new_content)
print('OK')
