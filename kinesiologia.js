var kineCalYear=new Date().getFullYear();
var kineCalMonth=new Date().getMonth();
var KINE_AV_COLS=['#4F46E5','#0EA5E9','#EC4899','#F59E0B','#10B981','#EF4444','#6366F1','#14B8A6','#F97316','#8B5CF6','#06B6D4','#84CC16'];
// 🌟 Agregamos el color especial para "GRUPO"
var KINE_ROLE_COLS={CENTRAL:'#4F46E5',RECEPTOR:'#0EA5E9',OPUESTO:'#EC4899',ARMADOR:'#F59E0B',LIBERO:'#10B981',PUNTA:'#EF4444',GRUPO:'#8B5CF6'};

function kineAvatarColor(n){var h=0;for(var i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))&0xFFFF;return KINE_AV_COLS[h%KINE_AV_COLS.length];}
function kineInitials(n){var p=n.trim().split(/\s+/);return(p[0]?p[0][0].toUpperCase():'')+(p.length>1?p[p.length-1][0].toUpperCase():'');}

// 🌟 Si el nombre es Equipo Completo, le pone el icono de grupo
function kineAvatarHTML(n){
  if(n.toUpperCase() === 'EQUIPO COMPLETO') return '<div class="kine-avatar" style="background:#8B5CF6;font-size:1.1rem">👥</div>';
  var c=kineAvatarColor(n);
  return '<div class="kine-avatar" style="background:'+c+'">'+kineInitials(n)+'</div>';
}

function kineRender(){
  var loading=document.getElementById('kine-loading'),body=document.getElementById('kine-body');
  if(!loading||!body)return;
  if(!RAW_KINE.length){loading.style.display='block';loading.textContent='Sin datos de kinesiologia.';body.innerHTML='';return;}
  loading.style.display='none';
  var ms=document.getElementById('kine-month-filter');
  if(ms&&ms.options.length<=1){
    var months=[...new Set(RAW_KINE.map(r=>r.DATE.substring(0,7)))].sort().reverse();
    months.forEach(m=>{var o=document.createElement('option');o.value=m;var p=m.split('-');o.textContent=KINE_MSHORT[+p[1]-1]+' '+p[0];ms.appendChild(o);});
  }
  kineRenderCal(); kineRenderRoles(); kineFilter();
}

function kineCalNav(d){kineCalMonth+=d;if(kineCalMonth>11){kineCalMonth=0;kineCalYear++;}if(kineCalMonth<0){kineCalMonth=11;kineCalYear--;}kineRenderCal();kineRenderRoles();kineFilter();}

function kineRenderCal(){
  var title=document.getElementById('kine-cal-title'),grid=document.getElementById('kine-cal-grid');
  if(!title||!grid)return;
  title.textContent=KINE_MNAMES[kineCalMonth]+' '+kineCalYear;
  var dm={};RAW_KINE.forEach(r=>{if(!dm[r.DATE])dm[r.DATE]=[];dm[r.DATE].push(r);});
  var fd=(new Date(kineCalYear,kineCalMonth,1).getDay()+6)%7;
  var dim=new Date(kineCalYear,kineCalMonth+1,0).getDate();
  
  var h='<div class="kine-cal-wd">Lun</div><div class="kine-cal-wd">Mar</div><div class="kine-cal-wd">Mié</div><div class="kine-cal-wd">Jue</div><div class="kine-cal-wd">Vie</div><div class="kine-cal-wd">Sáb</div><div class="kine-cal-wd">Dom</div>';
  for(var i=0;i<fd;i++) h+='<div class="kine-cal-cell" style="border:none;background:transparent;cursor:default"></div>';
  for(var d=1;d<=dim;d++){
    var ds=kineCalYear+'-'+String(kineCalMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var recs=dm[ds]||[]; var lvl=Math.min(5,recs.length);
    var cls='kine-cal-cell'+(recs.length?' has-kine level-'+lvl:'');
    var oc=recs.length?' onclick="kineCalDayClick(\''+ds+'\')"':'';
    h+='<div class="'+cls+'"'+oc+'><span class="kine-cal-num">'+d+'</span>'+(recs.length?'<span class="kine-cal-dot">'+recs.length+'</span>':'')+'</div>';
  }
  grid.innerHTML=h;
  var pp=document.getElementById('kine-day-popup');if(pp)pp.style.display='none';
}

function kineCalDayClick(ds){
  var pp=document.getElementById('kine-day-popup');if(!pp)return;
  var recs=RAW_KINE.filter(r=>r.DATE===ds);
  if(!recs.length){pp.style.display='none';return;}
  var p=ds.split('-'),dd=p[2]+' '+KINE_MSHORT[+p[1]-1]+' '+p[0];
  
  var h = '<div class="kpp-head"><div class="kpp-title">'+dd+' — '+recs.length+' registro'+(recs.length>1?'s':'')+'</div><button class="kpp-close" onclick="document.getElementById(\'kine-day-popup\').style.display=\'none\'">✕</button></div>';
  h += '<div class="kpp-table"><div class="kpp-th-row"><div class="kpp-th">PACIENTE / GRUPO</div><div class="kpp-th" style="text-align:center">TURNO</div><div class="kpp-th">INTERVENCIÓN</div></div>';
  
  recs.forEach(r=>{
      var tl=r.TURNO.toLowerCase(), tc=tl.includes('ma')?'manana':tl.includes('tard')?'tarde':tl.includes('noch')?'noche':'otro';
      h += '<div class="kpp-tr-main">';
      h += '<div class="kpp-td kpp-td-jug"><strong>'+r.JUGADOR+'</strong></div>';
      h += '<div class="kpp-td" style="text-align:center"><span class="kpp-turno-pill '+tc+'">'+r.TURNO+'</span></div>';
      h += '<div class="kpp-td kpp-td-int">'+r.INTERVENCION+'</div>';
      h += '</div>';
      if(r.OBSERVACIONES){
          h += '<div class="kpp-tr-obs"><span style="opacity:0.8">📝</span> <strong>Obs:</strong> '+r.OBSERVACIONES+'</div>';
      }
  });
  h += '</div>';

  pp.innerHTML=h;
  pp.style.display='block';
}

function kineRenderRoles(){
  var container=document.getElementById('kine-role-grid');if(!container)return;
  var posMap={};
  RAW_PLAYERS.forEach(pl=>{var k=(pl.NAME||'').trim().toUpperCase();if(k)posMap[k]=pl.POS||pl.POSICION||'?';});
  
  function getPos(name){
      var u=name.toUpperCase();
      if(u === 'EQUIPO COMPLETO') return 'GRUPO'; // 🌟 Lo clasificamos en la estadística como Grupo
      if(posMap[u])return posMap[u];
      var found=Object.keys(posMap).find(k=>u.includes(k)||k.includes(u));
      return found?posMap[found]:'?';
  }
  
  var rm={};
  RAW_KINE.forEach(r=>{var pos=getPos(r.JUGADOR);if(!rm[pos])rm[pos]={count:0,players:{}};rm[pos].count++;rm[pos].players[r.JUGADOR]=true;});
  var roles=Object.keys(rm).sort((a,b)=>rm[b].count-rm[a].count);
  if(!roles.length){container.innerHTML='<div class="kine-loading-msg" style="padding:20px">Sin datos.</div>';return;}
  container.innerHTML=roles.map(role=>{
    var d=rm[role],col=KINE_ROLE_COLS[role.toUpperCase()]||'#6366F1';
    var pn=Object.keys(d.players),extra=pn.length>3?' +'+(pn.length-3):'';
    return '<div class="kine-role-item" style="border-top:3px solid '+col+'"><div class="kine-role-rname" style="color:'+col+'">'+role+'</div><div class="kine-role-rcount" style="color:'+col+'">'+d.count+'</div><div class="kine-role-rlabel">registros</div><div class="kine-role-rplayers">'+pn.slice(0,3).map(n=>{var pp=n.split(' ');return pp.length>1?pp[0]+' '+pp[pp.length-1]:n;}).join(' · ')+extra+'</div></div>';
  }).join('');
}

function kineFilter(){
  var search=((document.getElementById('kine-search')||{}).value||'').trim().toLowerCase();
  var mf=((document.getElementById('kine-month-filter')||{}).value||'');
  var filtered=RAW_KINE.filter(r=>{
    var ms=!search||((r.JUGADOR||'').toLowerCase().includes(search)||(r.INTERVENCION||'').toLowerCase().includes(search)||(r.OBSERVACIONES||'').toLowerCase().includes(search));
    return ms&&(!mf||r.DATE.startsWith(mf));
  });
  kineRenderBody(filtered);
}

function kineRenderBody(data){
  var body=document.getElementById('kine-body'),summary=document.getElementById('kine-summary');
  if(!body)return;
  var pm={};data.forEach(r=>{if(!pm[r.JUGADOR])pm[r.JUGADOR]=[];pm[r.JUGADOR].push(r);});
  var pl=Object.keys(pm).sort((a,b)=>pm[b].length-pm[a].length);
  var ic={};data.forEach(r=>{if(r.INTERVENCION)ic[r.INTERVENCION]=(ic[r.INTERVENCION]||0)+1;});
  var topI=Object.keys(ic).sort((a,b)=>ic[b]-ic[a])[0]||'–';
  
  if(summary){summary.innerHTML='<div class="kine-stat-pill"><div class="kine-stat-val">'+data.length+'</div><div class="kine-stat-lbl">Total Registros</div></div><div class="kine-stat-pill"><div class="kine-stat-val">'+pl.length+'</div><div class="kine-stat-lbl">Pacientes / Grupos</div></div><div class="kine-stat-pill" style="min-width:160px"><div class="kine-stat-val" style="font-size:1rem;text-align:center">'+topI+'</div><div class="kine-stat-lbl">Intervención + Frecuente</div></div>';}
  
  if(!pl.length){body.innerHTML='<div class="kine-loading-msg">Sin resultados.</div>';return;}
  
  body.innerHTML=pl.map(p=>{
    var rows=pm[p].slice().sort((a,b)=>b.DATE.localeCompare(a.DATE));
    var isEquipo = (p.toUpperCase() === 'EQUIPO COMPLETO');
    var pInfo = isEquipo ? null : RAW_PLAYERS.find(pl => pl.NAME === p); 
    var posLabel = isEquipo ? 'GRUPO' : (pInfo && pInfo.POS ? pInfo.POS : '');
    var badgeBg = isEquipo ? '#8B5CF6' : (pInfo && KINE_ROLE_COLS[pInfo.POS] ? KINE_ROLE_COLS[pInfo.POS] : '#16a34a');

    var tr=rows.map(r=>{
      var tl=r.TURNO.toLowerCase(),tc=tl.includes('ma')?'kine-turno-manana':tl.includes('tard')?'kine-turno-tarde':tl.includes('noch')?'kine-turno-noche':'kine-turno-otro';
      var dp=r.DATE.split('-'),ddisp=(dp[2]||'?')+' '+KINE_MSHORT[+(dp[1]||1)-1]+' '+(dp[0]||'');
      return '<tr><td class="kine-td-date">'+ddisp+'</td><td class="kine-td-turno"><span class="kine-turno-pill '+tc+'">'+r.TURNO+'</span></td><td class="kine-td-interv">'+r.INTERVENCION+'</td><td class="kine-td-obs">'+r.OBSERVACIONES+'</td></tr>';
    }).join('');
    return '<div class="kine-player-card"><div class="kine-player-head"><div class="kine-player-info">'+kineAvatarHTML(p)+'<div class="kine-player-name">'+p+'</div></div>'+(posLabel ? '<div class="kine-player-badge" style="background:'+badgeBg+'">'+posLabel+'</div>' : '')+'</div><table class="kine-table"><thead><tr><th>Fecha</th><th>Turno</th><th>Intervención</th><th>Observaciones</th></tr></thead><tbody>'+tr+'</tbody></table></div>';
  }).join('');
}