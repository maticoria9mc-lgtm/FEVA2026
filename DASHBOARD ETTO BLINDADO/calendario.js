var CAL_EVENTS = {};
var calYear = new Date().getFullYear();
var calMonth = new Date().getMonth();
var TYPE_COLORS_DOT={train:'#0070BF',match:'#e53e3e',kine:'#16a34a',rest:'#94a3b8',load:'#f97316'};

function buildCalendarEvents(){
  Object.keys(CAL_EVENTS).forEach(k => delete CAL_EVENTS[k]);
  
  if (typeof RAW_MATCHES !== 'undefined') {
      RAW_MATCHES.forEach(m => {
        if(!CAL_EVENTS[m.DATE]) CAL_EVENTS[m.DATE]=[];
        var title = (m.RIVAL||'Partido').toUpperCase().startsWith('VS ')?m.RIVAL:'vs. '+m.RIVAL;
        CAL_EVENTS[m.DATE].push({type:'match', title:title, note: 'Partido Oficial', flag: m.BANDERA});
      });
  }

  var trainMap={};
  RAW_FUND.forEach(r => { if(r.DATE && r.JUGADOR !== 'EQUIPO'){ if(!trainMap[r.DATE]) trainMap[r.DATE]=new Set(); trainMap[r.DATE].add(r.JUGADOR); } });
  Object.keys(trainMap).forEach(ds => {
    if(MATCH_DATES_WITH_DATA.has(ds)) return;
    var players=Array.from(trainMap[ds]).filter(Boolean);
    if(!CAL_EVENTS[ds]) CAL_EVENTS[ds]=[];
    CAL_EVENTS[ds].push({ type:'train', title:'Entrenamiento', note:players.length+' jugador'+(players.length!==1?'es':'')+' — '+players.slice(0,4).join(', ')+(players.length>4?' +'+(players.length-4):'') });
  });

  var kineMap={};
  if (typeof RAW_KINE !== 'undefined') {
      RAW_KINE.forEach(r => { if(r.DATE){ if(!kineMap[r.DATE]) kineMap[r.DATE]=[]; kineMap[r.DATE].push(r); } });
      Object.keys(kineMap).forEach(ds => {
        if(!CAL_EVENTS[ds]) CAL_EVENTS[ds]=[];
        CAL_EVENTS[ds].push({ type:'kine', title:'Kinesiología', kine:kineMap[ds].map(r => ({player:r.JUGADOR, note:r.INTERVENCION+(r.OBSERVACIONES?' — '+r.OBSERVACIONES:'')})) });
      });
  }

  var VIAJE_COLORS = [{bg:'#FFF0F5',fg:'#900020'},{bg:'#FFF5E6',fg:'#B85E00'},{bg:'#FFFFE0',fg:'#8A8A00'},{bg:'#F0FFF0',fg:'#006400'},{bg:'#F0F8FF',fg:'#00008B'},{bg:'#F8F0FF',fg:'#4B0082'},{bg:'#E0FFFF',fg:'#008B8B'}];
  window.ubiColorMap = {}; var ubiCount = 0;
  if (typeof RAW_VIAJES !== 'undefined') {
      RAW_VIAJES.forEach(v => {
        if(!window.ubiColorMap[v.UBICACION]){ window.ubiColorMap[v.UBICACION] = VIAJE_COLORS[ubiCount % VIAJE_COLORS.length]; ubiCount++; }
        var cur = new Date(v.START+'T12:00:00'), end = new Date(v.END+'T12:00:00');
        while(cur<=end){ 
          var ds = cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
          if(!CAL_EVENTS[ds]) CAL_EVENTS[ds]=[];
          CAL_EVENTS[ds].push({ type:'viaje', title: v.UBICACION, note:'Periodo de estadía', colorObj: window.ubiColorMap[v.UBICACION], _isViaje: true });
          cur.setDate(cur.getDate()+1); 
        }
      });
  }
}

function calNav(delta){ calMonth+=delta; if(calMonth>11){calMonth=0;calYear++;} if(calMonth<0){calMonth=11;calYear--;} renderCalendar(); }

function renderCalendar(){
  document.getElementById('cal-title').textContent=MESES[calMonth]+' '+calYear;
  var grid=document.getElementById('cal-days-grid');
  var today=new Date(), firstDay=new Date(calYear,calMonth,1).getDay(); firstDay=(firstDay===0)?6:firstDay-1;
  var daysInMonth=new Date(calYear,calMonth+1,0).getDate(), prevDays=new Date(calYear,calMonth,0).getDate();
  var html='<div class="cal-wd">Lun</div><div class="cal-wd">Mar</div><div class="cal-wd">Mié</div><div class="cal-wd">Jue</div><div class="cal-wd">Vie</div><div class="cal-wd">Sáb</div><div class="cal-wd">Dom</div>';

  for(var i=firstDay-1;i>=0;i--) html+='<div class="cal-day-cell other-month empty"><div class="cal-day-num">'+(prevDays-i)+'</div></div>';

  for(var d=1;d<=daysInMonth;d++){
    var ds=calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var isToday=(today.getFullYear()===calYear&&today.getMonth()===calMonth&&today.getDate()===d);
    var evs=CAL_EVENTS[ds]||[], cls='cal-day-cell'+(isToday?' today':''), viajeEv = evs.find(e=>e._isViaje), regularEvs = evs.filter(e=>!e._isViaje);
    var cellStyle='', viajeHtml='';
    
    var matchLinkData = typeof RAW_MATCH_LINKS !== 'undefined' ? RAW_MATCH_LINKS.find(l => l.DATE === ds) : null;
    var isMatchDay = MATCH_DATES_WITH_DATA.has(ds);
    
    // EL TRUCO: Solo agregamos 'has-match' si NO hay un viaje.
    // Esto evita que el CSS viejo pise nuestro color de fondo pastel.
    if(isMatchDay && !viajeEv) {
        cls += ' has-match';
    }
    
    if(viajeEv){
        // Forzamos el background para que ignore reglas CSS rebeldes
        cellStyle = 'background: ' + viajeEv.colorObj.bg + ' !important; ';
        
        if (isMatchDay) {
            cellStyle += 'border: 2px solid #DC2626 !important;';
        } else {
            cellStyle += 'border-color:transparent;';
        }
        
        viajeHtml='<div style="position:absolute; bottom:5px; left:7px; right:7px; font-size:0.65rem; color:#6B7280; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="📍 '+viajeEv.title+'">📍 '+viajeEv.title+'</div>';
    }

    var dotsHtml='<div class="cal-event-dots">', chipsHtml='', maxChips=3;
    
    if(isMatchDay && matchLinkData) {
        var wl = typeof matchGetWinLoss === 'function' ? matchGetWinLoss(matchLinkData.RESULTADO) : 'unknown';
        var rivalShort = (matchLinkData.RIVAL||'').length > 8 ? (matchLinkData.RIVAL||'').substring(0,7)+'…' : (matchLinkData.RIVAL||'');
        
        var flagHtml = (matchLinkData.BANDERA && matchLinkData.BANDERA.startsWith('http')) 
                       ? '<img src="'+matchLinkData.BANDERA+'" style="width:20px;height:14px;border-radius:2px;object-fit:cover;vertical-align:middle;">' 
                       : (matchLinkData.BANDERA || '🏐');

        // Etiqueta del partido con un toque de blanco transparente para que resalte sobre cualquier viaje
        chipsHtml = '<div class="cal-match-chip" style="background:rgba(255,255,255,0.7); box-shadow:0 1px 3px rgba(0,0,0,0.1);">';
        chipsHtml += '<span class="cal-match-flag" style="display:flex;align-items:center;">'+flagHtml+'</span>';
        chipsHtml += '<span class="cal-match-rival" style="margin-left:4px;">'+rivalShort+'</span>';
        chipsHtml += '</div>';
        if(matchLinkData.RESULTADO) {
            chipsHtml += '<div class="match-result-badge '+ wl +'">'+ matchLinkData.RESULTADO +'</div>';
        }
    } else {
        chipsHtml = '<div class="cal-event-labels">';
        regularEvs.forEach((ev,idx) => { 
            dotsHtml+='<div class="cal-dot '+ev.type+'"></div>'; 
            if(idx<maxChips) {
                var evIcon = '';
                if(ev.type === 'match' && ev.flag && ev.flag.startsWith('http')) {
                    evIcon = '<img src="'+ev.flag+'" style="width:14px;height:10px;border-radius:2px;object-fit:cover;vertical-align:middle;margin-right:4px;">';
                }
                chipsHtml+='<div class="cal-ev-chip '+ev.type+'">'+evIcon+ev.title+'</div>'; 
            }
        });
        if(regularEvs.length>maxChips) chipsHtml+='<div class="cal-ev-chip rest">+' +(regularEvs.length-maxChips)+' más</div>';
        chipsHtml += '</div>';
    }
    dotsHtml+='</div>';

    html+='<div class="'+cls+'" style="'+cellStyle+'" onclick="openDayPopup(\''+ds+'\',event)"><div class="cal-day-num">'+d+'</div>';
    if(regularEvs.length || isMatchDay) html+=chipsHtml; html+=viajeHtml;
    if(!isMatchDay && RAW_VIDEOS.some(v=>v.DATE===ds&&v.LINK)) html+='<div class="cal-video-badge" style="'+(viajeEv?'bottom:20px;':'')+'">🎬</div>';
    html+='</div>';
  }
  var rem=(7-(firstDay+daysInMonth)%7)%7;
  for(var n=1;n<=rem;n++) html+='<div class="cal-day-cell other-month empty"><div class="cal-day-num">'+n+'</div></div>';
  grid.innerHTML=html; renderMonthStats(); renderUpcoming();
}

function renderMonthStats(){
  var counts={train:0,match:0,kine:0,rest:0,load:0};
  Object.keys(CAL_EVENTS).forEach(ds => {
    if(parseInt(ds.split('-')[1])-1 === calMonth && parseInt(ds.split('-')[0]) === calYear){ CAL_EVENTS[ds].forEach(ev => {if(counts[ev.type]!==undefined)counts[ev.type]++;}); }
  });
  ['train','match','kine','rest'].forEach(t => { var el = document.getElementById('qs-'+t); if(el) el.textContent=counts[t]; });
}

function renderUpcoming(){
  var today=new Date(); today.setHours(0,0,0,0); var upcoming=[];
  Object.keys(CAL_EVENTS).sort().forEach(ds => {
    var dt=new Date(ds+'T12:00:00');
    if(dt>=today) CAL_EVENTS[ds].forEach(ev => { if(!ev._isViaje && ev.type!=='viaje') upcoming.push({date:dt,ds:ds,ev:ev}); });
  });
  upcoming.sort((a,b)=>a.date-b.date); upcoming=upcoming.slice(0,6);
  var TYPE_COLORS={train:'#DBEAFE:#1D4ED8',match:'#FEE2E2:#B91C1C',kine:'#DCFCE7:#15803D',rest:'#F1F5F9:#475569',load:'#FFEDD5:#C2410C'};
  
  var listEl = document.getElementById('upcoming-list');
  if(!listEl) return;

  listEl.innerHTML=upcoming.map(u => {
    var colors = (TYPE_COLORS[u.ev.type]||'#F1F5F9:#475569').split(':');
    var evIcon = '';
    if(u.ev.type === 'match' && u.ev.flag && u.ev.flag.startsWith('http')) {
         evIcon = '<img src="'+u.ev.flag+'" style="width:20px;height:14px;border-radius:2px;object-fit:cover;vertical-align:middle;margin-right:6px;">';
    }
    return '<div class="upcoming-item"><div class="upcoming-date-col"><div class="upcoming-day">'+u.date.getDate()+'</div><div class="upcoming-mon">'+MESES[u.date.getMonth()].substring(0,3).toUpperCase()+'</div></div><div class="upcoming-sep"></div><div class="upcoming-info"><div class="upcoming-title">'+evIcon+u.ev.title+'</div>'+(u.ev.note?'<div class="upcoming-sub">'+u.ev.note.substring(0,45)+(u.ev.note.length>45?'…':'')+'</div>':'')+'</div><span class="upcoming-badge" style="background:'+colors[0]+';color:'+colors[1]+'">'+u.ev.type.toUpperCase()+'</span></div>';
  }).join('')||'<div style="color:var(--sub);font-size:.8rem;text-align:center;padding:16px 0">Sin eventos próximos</div>';
}

function openDayPopup(ds, e){
  var evs=CAL_EVENTS[ds]||[]; if(!evs.length && !MATCH_DATES_WITH_DATA.has(ds)) return;

  var dt=new Date(ds+'T12:00:00');
  document.getElementById('popup-date-label').textContent=dt.toLocaleDateString('es-AR',{weekday:'long'}).toUpperCase();
  document.getElementById('popup-day-title').textContent=dt.toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});

  var popup=document.getElementById('day-popup');
  popup.classList.remove('day-popup--match');

  if(MATCH_DATES_WITH_DATA.has(ds) && typeof renderMatchCalPopup === 'function') {
    var headerEl = document.querySelector('#day-popup .popup-header'), closeBtn = document.querySelector('#day-popup .popup-close');
    if(headerEl){ headerEl.style.backgroundImage='linear-gradient(135deg,#7F1D1D,#DC2626)'; headerEl.style.backgroundColor=''; headerEl.style.color='#fff'; if(closeBtn){ closeBtn.style.color='#fff'; closeBtn.style.background='rgba(255,255,255,.2)'; } }
    document.getElementById('popup-body').innerHTML = renderMatchCalPopup(ds);
    popup.classList.add('day-popup--match');
    popup.style.display='block';
    document.getElementById('popup-overlay').style.display='block';
    var vw=window.innerWidth, vh=window.innerHeight;
    var left=Math.min(e.clientX+10, vw-500-16), top=Math.max(10, Math.min(e.clientY-40, vh-520));
    popup.style.left=left+'px'; popup.style.top=top+'px';
    return;
  }

  var viajeEv = evs.find(ev => ev._isViaje), headerEl = document.querySelector('#day-popup .popup-header'), closeBtn = document.querySelector('#day-popup .popup-close');
  if(headerEl){
      if(viajeEv){ headerEl.style.backgroundImage='none'; headerEl.style.backgroundColor=viajeEv.colorObj.bg; headerEl.style.color=viajeEv.colorObj.fg; if(closeBtn){ closeBtn.style.color=viajeEv.colorObj.fg; closeBtn.style.background='transparent'; } } 
      else { headerEl.style.backgroundImage=''; headerEl.style.backgroundColor=''; headerEl.style.color=''; if(closeBtn){ closeBtn.style.color=''; closeBtn.style.background=''; } }
  }

  var html='', nonKine=evs.filter(ev=>ev.type!=='kine'), kineEvs=evs.filter(ev=>ev.type==='kine');

  if(nonKine.length){
    html+='<div class="popup-section"><div class="popup-section-title">PLANIFICACIÓN / PARTIDO</div>';
    nonKine.forEach(ev => {
        var evIcon = '';
        if (ev._isViaje) evIcon = '📍 ';
        else if (ev.type === 'match' && ev.flag && ev.flag.startsWith('http')) {
            evIcon = '<img src="'+ev.flag+'" style="width:16px;height:11px;border-radius:2px;object-fit:cover;vertical-align:middle;margin-right:6px;">';
        }
        html+='<div class="popup-event-row"><div class="ev-dot" style="background:'+(ev._isViaje?ev.colorObj.fg:TYPE_COLORS_DOT[ev.type]||'#94a3b8')+'"></div><div class="popup-event-content"><div class="popup-event-name">'+evIcon+ev.title+'</div>'+(ev.note?'<div class="popup-event-note">'+ev.note+'</div>':'')+'</div></div>';
    });
    
    var vids=RAW_VIDEOS.filter(v=>v.DATE===ds&&v.LINK);
    vids.forEach(v => html+='<a href="'+v.LINK+'" target="_blank" class="popup-video-btn">▶ VER VIDEO — '+v.TIPO.toUpperCase()+'</a>');
    if(nonKine.some(e=>e.type==='train'||e.type==='match')) html+='<button class="popup-resumen-btn" onclick="if(typeof verDetalleDia===\'function\') verDetalleDia(\''+ds+'\'); closePopup();">📊 VER RESUMEN DE LA SESIÓN</button>';
    html+='</div>';
  }

  var teamRow=RAW_FUND.find(r=>r.DATE===ds&&r.JUGADOR==='EQUIPO');
  if(teamRow){
      var statRecTot = teamRow.REC_TOT||0, statRecPosPerf = (teamRow.REC_POS||0)+(teamRow.REC_PERF||0);
      var statRecPct = statRecTot>0 ? (safePct(teamRow.REC_PERF)+safePct(teamRow.REC_POS)) : 0;
      var statRecEff = statRecTot>0 ? statRecPct - ((teamRow.REC_ERR||0)/statRecTot)*100 : 0;
      var statAtqTot = teamRow.ATQ_TOT||0, statAtqEff = statAtqTot>0 ? (((teamRow.ATQ_KILL||0)-(teamRow.ATQ_ERR||0)-(teamRow.ATQ_BLK||0))/statAtqTot)*100 : 0;
      var statSaqTot = teamRow.SAQ_TOT||0, statSaqEff = statSaqTot>0 ? (((teamRow.SAQ_ACE||0)-(teamRow.SAQ_ERR||0))/statSaqTot)*100 : 0;
      html+='<div class="popup-section" style="margin-top:16px;"><div class="popup-section-title">STATS DEL EQUIPO</div><div class="popup-team-stats"><div class="pop-stat-pill"><div><div class="pop-stat-val">'+teamRow.SAQ_TOT+'</div>'+(statSaqTot>0?'<div class="pop-stat-sub">'+statSaqEff.toFixed(0)+'% EFF</div>':'')+'<div class="pop-stat-lbl">Saques</div></div></div><div class="pop-stat-pill"><div><div class="pop-stat-val">'+teamRow.REC_TOT+'</div><div class="pop-stat-sub">'+statRecEff.toFixed(0)+'% E</div><div class="pop-stat-lbl">Rec.</div></div></div><div class="pop-stat-pill"><div><div class="pop-stat-val">'+teamRow.ATQ_TOT+'</div>'+(statAtqTot>0?'<div class="pop-stat-sub">'+statAtqEff.toFixed(0)+'% EFF</div>':'')+'<div class="pop-stat-lbl">Ataques</div></div></div><div class="pop-stat-pill"><div><div class="pop-stat-val">'+(teamRow.BLK_TOT||0)+'</div><div class="pop-stat-lbl">Bloqueos</div></div></div></div></div>';
  }

  if(kineEvs.length){
      html+='<div class="popup-section" style="margin-top:16px;"><div class="popup-section-title">ATENCIONES KINESIOLÓGICAS</div>';
      kineEvs.forEach(ev => { if(ev.kine) ev.kine.forEach(k => html+='<div class="popup-kine-row"><div class="popup-kine-player">'+k.player+'</div><div class="popup-kine-note">'+k.note+'</div></div>'); });
      html+='</div>';
  }

  document.getElementById('popup-body').innerHTML=html;
  popup.style.display='block';
  document.getElementById('popup-overlay').style.display='block';
  var rect={left:e.clientX, top:e.clientY}, vw=window.innerWidth, vh=window.innerHeight;
  var left=Math.min(rect.left+10, vw-340-16), top=Math.max(10, Math.min(rect.top-40, vh-(popup.offsetHeight||300)-16));
  popup.style.left=left+'px'; popup.style.top=top+'px';
}

function closePopup(){ document.getElementById('day-popup').style.display='none'; document.getElementById('popup-overlay').style.display='none'; }