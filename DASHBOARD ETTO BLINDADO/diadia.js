var currentDiaDate = null;
var entDiaCalYear = new Date().getFullYear();
var entDiaCalMonth = new Date().getMonth();

var URL_LOGO_FAV = 'https://firebasestorage.googleapis.com/v0/b/data-voley.appspot.com/o/1MXIzPSqTx5Mfvtr2W1RRLg9eClYOgLBh?alt=media'; // Ajustá esta URL con tu logo real de Firebase si es necesario

function verDetalleDia(ds) {
    if(typeof closePopup === 'function') closePopup();
    currentDiaDate = ds;
    var parts = ds.split('-');
    entDiaCalYear = parseInt(parts[0], 10);
    entDiaCalMonth = parseInt(parts[1], 10) - 1;
    var navBtn = document.querySelector('[data-panel="ent-dia"]');
    if(navBtn && typeof switchPanel === 'function') switchPanel('ent-dia', navBtn);
    renderEntDia();
}

function entDiaCalNav(delta){
    entDiaCalMonth+=delta;
    if(entDiaCalMonth>11){entDiaCalMonth=0;entDiaCalYear++;}
    if(entDiaCalMonth<0){entDiaCalMonth=11;entDiaCalYear--;}
    renderEntDiaCal();
}

function renderEntDiaCal() {
    var title=document.getElementById('ent-dia-cal-title'), grid=document.getElementById('ent-dia-cal-grid');
    if(!title||!grid)return;
    title.textContent = MESES[entDiaCalMonth] + ' ' + entDiaCalYear;
    var fd=(new Date(entDiaCalYear,entDiaCalMonth,1).getDay()+6)%7, dim=new Date(entDiaCalYear,entDiaCalMonth+1,0).getDate();
    var h='<div class="kine-cal-wd">L</div><div class="kine-cal-wd">M</div><div class="kine-cal-wd">X</div><div class="kine-cal-wd">J</div><div class="kine-cal-wd">V</div><div class="kine-cal-wd">S</div><div class="kine-cal-wd">D</div>';
    for(var i=0;i<fd;i++) h+='<div class="kine-cal-cell" style="border:none;background:transparent;cursor:default"></div>';
    
    var showTrain = document.getElementById('chk-dia-train') ? document.getElementById('chk-dia-train').checked : true;
    var showMatch = document.getElementById('chk-dia-match') ? document.getElementById('chk-dia-match').checked : true;

    for(var d=1;d<=dim;d++){
      var ds=entDiaCalYear+'-'+String(entDiaCalMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      
      // Verificamos si tiene datos reales (Stats o Videos)
      var hasStats = (typeof RAW_FUND !== 'undefined' && RAW_FUND.some(r => r.DATE === ds)) || 
                     (typeof RAW_MATCH_STATS !== 'undefined' && RAW_MATCH_STATS.some(r => r.DATE === ds));
      var hasVideos = (typeof RAW_VIDEOS !== 'undefined' && RAW_VIDEOS.some(v => v.DATE === ds && v.LINK));
      var hasRealData = hasStats || hasVideos;

      var isMatchData = MATCH_DATES_WITH_DATA.has(ds);
      var isTrainData = ENT_DATES_WITH_DATA.has(ds) && !isMatchData;
      
      var isMatch = isMatchData && showMatch;
      var isTrain = isTrainData && showTrain;
      var isSel = (ds === currentDiaDate);
      
      var cls='kine-cal-cell';
      if(isMatch) cls += ' match-day'; 
      else if(isTrain) cls += ' has-kine level-5';
      
      // Si no tiene datos reales (aunque esté planificado), lo ponemos más tenue
      if(!hasRealData) cls += ' no-real-data';

      var selStyle = '';
      if(isSel) {
          if(isMatch) selStyle = 'background:#DC2626 !important; color:#fff !important; border-color:#B91C1C !important;';
          else if(isTrain) selStyle = 'background:var(--celeste) !important; color:#fff !important; border-color:var(--celeste) !important;';
          else selStyle = 'background:#f8fafc !important; color:#94a3b8 !important; border-color:#e2e8f0 !important; box-shadow:inset 0 0 0 1px #cbd5e1 !important;';
      }
      
      // 🌟 MINIATURA DE BANDERA SI ES PARTIDO
      var flagHtml = '';
      if(isMatch) {
          var mLink = RAW_MATCH_LINKS.find(l => l.DATE === ds);
          if(mLink && mLink.BANDERA && mLink.BANDERA.startsWith('http')) {
              flagHtml = `<img src="${mLink.BANDERA}" style="position:absolute; top:2px; right:2px; width:12px; height:8px; border-radius:1px; object-fit:cover; opacity:0.8;">`;
          }
      }

      var oc=' onclick="verDetalleDia(\''+ds+'\')"';
      h+='<div class="'+cls+'"'+oc+' style="position:relative; '+selStyle+'">'+flagHtml+'<span class="kine-cal-num">'+d+'</span></div>';
    }
    grid.innerHTML=h;
}

function renderEntDia() {
    // 🌟 LÓGICA DE DÍA ACTUAL: Siempre abre en HOY si no se hizo clic en otra fecha.
    if(!currentDiaDate) {
        var now = new Date();
        currentDiaDate = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
        entDiaCalYear = now.getFullYear();
        entDiaCalMonth = now.getMonth();
    }
    
    renderEntDiaCal();
    
    var evs = CAL_EVENTS[currentDiaDate] || [], trainEv = evs.find(e => e.type === 'train' || e.type === 'match');
    var descEl = document.getElementById('ent-dia-desc');
    var vids = RAW_VIDEOS.filter(v => v.DATE===currentDiaDate && v.LINK), videoBtns = '';
    if(vids.length > 0) {
        videoBtns = '<div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">' + vids.map(v => '<a href="'+v.LINK+'" target="_blank" style="background:var(--celeste);color:#fff;padding:6px 14px;border-radius:8px;text-decoration:none;font-size:.8rem;font-weight:800;transition:all .2s;box-shadow:0 2px 4px rgba(0,0,0,.1);">▶ VIDEO: '+v.TIPO.toUpperCase()+'</a>').join('') + '</div>';
    }
    if(trainEv && trainEv.note) { descEl.innerHTML = '<strong style="color:var(--celeste-dark); font-size:.9rem;">PLANIFICACIÓN:</strong><br>' + trainEv.note + videoBtns; descEl.style.display = 'block'; } 
    else if (videoBtns) { descEl.innerHTML = '<strong style="color:var(--celeste-dark); font-size:.9rem;">SESIÓN:</strong>' + videoBtns; descEl.style.display = 'block'; } 
    else { descEl.style.display = 'none'; }

    var teamRow = RAW_FUND.find(r => r.DATE === currentDiaDate && r.JUGADOR === 'EQUIPO');
    var players = RAW_FUND.filter(r => r.DATE === currentDiaDate && r.JUGADOR !== 'EQUIPO');

    // Suma automática si no hay fila "EQUIPO" en el Excel
    if (!teamRow && players.length > 0) {
        teamRow = { SAQ_TOT:0, SAQ_ACE:0, SAQ_ERR:0, REC_TOT:0, REC_POS:0, REC_PERF:0, REC_ERR:0, ATQ_TOT:0, ATQ_KILL:0, ATQ_ERR:0, ATQ_BLK:0, CTR_TOT:0, CTR_KILL:0, CTR_ERR:0, CTR_BLK:0, APR_TOT:0, APR_KILL:0, APR_ERR:0, APR_BLK:0, BLK_TOT:0 };
        players.forEach(p => {
            teamRow.SAQ_TOT += p.SAQ_TOT||0; teamRow.SAQ_ACE += p.SAQ_ACE||0; teamRow.SAQ_ERR += p.SAQ_ERR||0;
            teamRow.REC_TOT += p.REC_TOT||0; teamRow.REC_POS += p.REC_POS||0; teamRow.REC_PERF += p.REC_PERF||0; teamRow.REC_ERR += p.REC_ERR||0;
            teamRow.ATQ_TOT += p.ATQ_TOT||0; teamRow.ATQ_KILL += p.ATQ_KILL||0; teamRow.ATQ_ERR += p.ATQ_ERR||0; teamRow.ATQ_BLK += p.ATQ_BLK||0;
            teamRow.CTR_TOT += p.CTR_TOT||0; teamRow.CTR_KILL += p.CTR_KILL||0; teamRow.CTR_ERR += p.CTR_ERR||0; teamRow.CTR_BLK += p.CTR_BLK||0;
            teamRow.APR_TOT += p.APR_TOT||0; teamRow.APR_KILL += p.APR_KILL||0; teamRow.APR_ERR += p.APR_ERR||0; teamRow.APR_BLK += p.APR_BLK||0;
            teamRow.BLK_TOT += p.BLK_TOT||0;
        });
    }

    var rL = ['Saque', 'Recepción', 'Ataque Gen.', 'Atq. Post-Rec', 'Contra-Ataque'], dEficacia = [0,0,0,0,0], dEficiencia = [0,0,0,0,0];
    var teamStatsEl = document.getElementById('ent-dia-team-stats');

    function getAbs(v, t) { return (v > 0 && v <= 1 && t > 1) ? Math.round(v * t) : v; }

    if (teamRow) {
         var sT = teamRow.SAQ_TOT||0, sA = getAbs(teamRow.SAQ_ACE||0, sT), sE = getAbs(teamRow.SAQ_ERR||0, sT);
         var rT = teamRow.REC_TOT||0, rP = getAbs(teamRow.REC_POS||0, rT), rPf = getAbs(teamRow.REC_PERF||0, rT), rE = getAbs(teamRow.REC_ERR||0, rT);
         var aT = teamRow.ATQ_TOT||0, aK = getAbs(teamRow.ATQ_KILL||0, aT), aE = getAbs(teamRow.ATQ_ERR||0, aT), aB = getAbs(teamRow.ATQ_BLK||0, aT);
         var cT = teamRow.CTR_TOT||0, cK = getAbs(teamRow.CTR_KILL||0, cT), cE = getAbs(teamRow.CTR_ERR||0, cT), cB = getAbs(teamRow.CTR_BLK||0, cT);
         var aprT = teamRow.APR_TOT||0, aprK = getAbs(teamRow.APR_KILL||0, aprT), aprE = getAbs(teamRow.APR_ERR||0, aprT), aprB = getAbs(teamRow.APR_BLK||0, aprT);

         dEficacia = [ sT>0 ? (sA/sT)*100 : 0, rT>0 ? ((rPf+rP)/rT)*100 : 0, aT>0 ? (aK/aT)*100 : 0, aprT>0 ? (aprK/aprT)*100 : 0, cT>0 ? (cK/cT)*100 : 0 ];
         dEficiencia = [ sT>0 ? ((sA-sE)/sT)*100 : 0, rT>0 ? ((rPf+rP-rE)/rT)*100 : 0, aT>0 ? ((aK-aE-aB)/aT)*100 : 0, aprT>0 ? ((aprK-aprE-aprB)/aprT)*100 : 0, cT>0 ? ((cK-cE-cB)/cT)*100 : 0 ];
         
         var statRecPct = rT>0 ? ((rPf+rP)/rT)*100 : 0;
         var statRecEff = rT>0 ? ((rPf+rP-rE)/rT)*100 : 0;
         var statAtqPct = aT>0 ? (aK/aT)*100 : 0;
         var statAtqEff = aT>0 ? ((aK-aE-aB)/aT)*100 : 0;
         
         var logoHtml = `<img src="${URL_LOGO_FAV}" style="max-width:85%; max-height:85%; object-fit:contain;">`;

         teamStatsEl.innerHTML = `
            <div class="dia-player-card" style="box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-color: var(--celeste);">
                <div class="dia-player-header">
                    <div class="dia-player-photo" style="background:#fff;">${logoHtml}</div>
                    <div class="dia-player-details">
                        <div class="dia-player-name">EQUIPO ARGENTINA</div>
                        <div class="dia-player-role">Resumen de Sesión</div>
                    </div>
                </div>
                <div class="dia-player-body">
                    <div class="dia-stat-group">
                        <div class="dia-stat-title">⚡ SAQUE</div>
                        <div class="dia-stat-line"><span class="dia-stat-lbl">Total:</span> <span class="dia-stat-val">${sT}</span></div>
                        <div class="dia-stat-line"><span class="dia-stat-lbl">Aces:</span> <span class="dia-stat-val" style="color:#16a34a">${sA}</span></div>
                        <div class="dia-stat-line"><span class="dia-stat-lbl">Err:</span> <span class="dia-stat-val" style="color:#e53e3e">${sE}</span></div>
                    </div>
                    <div class="dia-stat-group">
                        <div class="dia-stat-title">🤲 RECEPCIÓN</div>
                        <div class="dia-stat-line"><span class="dia-stat-lbl">Total:</span> <span class="dia-stat-val">${rT}</span></div>
                        <div class="dia-stat-line"><span class="dia-stat-lbl">Eficacia:</span> <span class="dia-stat-val">${statRecPct.toFixed(1)}%</span></div>
                        <div class="dia-stat-line"><span class="dia-stat-lbl">Eficiencia:</span> <span class="dia-stat-val">${statRecEff.toFixed(1)}%</span></div>
                    </div>
                    <div class="dia-stat-group">
                        <div class="dia-stat-title">🏐 ATAQUE</div>
                        <div class="dia-stat-line"><span class="dia-stat-lbl">Total:</span> <span class="dia-stat-val">${aT}</span></div>
                        <div class="dia-stat-line"><span class="dia-stat-lbl">Eficacia:</span> <span class="dia-stat-val">${statAtqPct.toFixed(1)}%</span></div>
                        <div class="dia-stat-line"><span class="dia-stat-lbl">Eficiencia:</span> <span class="dia-stat-val">${statAtqEff.toFixed(1)}%</span></div>
                    </div>
                </div>
            </div>
         `;
    } else {
         teamStatsEl.innerHTML = '<div class="no-data-msg" style="padding:20px; background:var(--card); border-radius:var(--radius);">Sin estadísticas para este día.</div>';
    }

    if(typeof destroyEntChart === 'function') destroyEntChart('chart-ent-dia-radar');
    var canvasR = document.getElementById('chart-ent-dia-radar');
    if(canvasR && (teamRow || players.length > 0)) {
        entCharts['chart-ent-dia-radar'] = new Chart(canvasR.getContext('2d'), { type: 'radar', data: { labels: rL, datasets: [ { label: 'Eficacia (% Acierto / % Kills)', data: dEficacia, borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.2)', borderWidth:2 }, { label: 'Eficiencia (EFF)', data: dEficiencia, borderColor: '#d97706', backgroundColor: 'rgba(217,119,6,0.2)', borderWidth:2 } ] }, options: { responsive:true, maintainAspectRatio:false, scales:{r:{min: -20, max: 100, ticks:{font:{size:9}, callback:v=>v+'%'} }} } });
    }

    var html = '', posNames = { 'AR':'Armadores', 'OP':'Opuestos', 'CT':'Centrales', 'PR':'Puntas', 'LI':'Líberos' };
    var ROLE_FG={AR:'#1D4ED8',OP:'#92400E',CT:'#15803D',PR:'#7C3AED',LI:'#B91C1C'};

    function getPos(name) { 
        var pObj = window.RAW_PLAYERS && window.RAW_PLAYERS.find(pl => pl.NAME === name); 
        return pObj ? (pObj.POS === 'LB' ? 'LI' : pObj.POS) : 'S/P'; 
    }

    var groups = {}; 
    players.forEach(r => { 
        var pos = getPos(r.JUGADOR); 
        if(!groups[pos]) groups[pos] = []; 
        groups[pos].push({row: r, info: window.RAW_PLAYERS && window.RAW_PLAYERS.find(pl => pl.NAME === r.JUGADOR)}); 
    });

    ['AR','OP','PR','CT','LI','S/P'].forEach(ro => {
        if(groups[ro]) {
            html += `<div class="dia-role-section"><div class="dia-role-title">${posNames[ro] || ro}</div><div class="dia-players-grid">`;
            groups[ro].forEach(data => {
                var p = data.row, pInfo = data.info;
                var psT = p.SAQ_TOT||0, psA = getAbs(p.SAQ_ACE||0, psT), psE = getAbs(p.SAQ_ERR||0, psT);
                var prT = p.REC_TOT||0, prP = getAbs(p.REC_POS||0, prT), prPf = getAbs(p.REC_PERF||0, prT), prE = getAbs(p.REC_ERR||0, prT);
                var paT = p.ATQ_TOT||0, paK = getAbs(p.ATQ_KILL||0, paT), paE = getAbs(p.ATQ_ERR||0, paT), paB = getAbs(p.ATQ_BLK||0, paT);
                
                var saqEff = psT>0 ? ((psA-psE)/psT)*100 : 0;
                var recPct = prT>0 ? ((prPf+prP)/prT)*100 : 0;
                var recEff = prT>0 ? ((prPf+prP-prE)/prT)*100 : 0;
                var atqPct = paT>0 ? (paK/paT)*100 : 0;
                var atqEff = paT>0 ? ((paK-paE-paB)/paT)*100 : 0;

                var photoHtml = (pInfo && pInfo.FOTO) ? `<img src="${pInfo.FOTO}" alt="${p.JUGADOR}">` : `<div style="background:${ROLE_FG[ro]||'#0070BF'};width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;">${p.JUGADOR.substring(0,2)}</div>`;

                html += `<div class="dia-player-card">
                            <div class="dia-player-header"><div class="dia-player-photo">${photoHtml}</div><div class="dia-player-details"><div class="dia-player-name">${p.JUGADOR}</div><div class="dia-player-role">${posNames[ro]||ro}</div></div></div>
                            <div class="dia-player-body">
                                <div class="dia-stat-group"><div class="dia-stat-title">SAQUE</div><div class="dia-stat-line"><span class="dia-stat-lbl">Aces:</span> <span class="dia-stat-val">${psA}</span></div><div class="dia-stat-line"><span class="dia-stat-lbl">EFF:</span> <span class="dia-stat-val">${saqEff.toFixed(1)}%</span></div></div>
                                <div class="dia-stat-group"><div class="dia-stat-title">REC.</div><div class="dia-stat-line"><span class="dia-stat-lbl">Efic:</span> <span class="dia-stat-val">${recPct.toFixed(1)}%</span></div><div class="dia-stat-line"><span class="dia-stat-lbl">EFF:</span> <span class="dia-stat-val">${recEff.toFixed(1)}%</span></div></div>
                                <div class="dia-stat-group"><div class="dia-stat-title">ATQ.</div><div class="dia-stat-line"><span class="dia-stat-lbl">Kills:</span> <span class="dia-stat-val">${paK}</span></div><div class="dia-stat-line"><span class="dia-stat-lbl">EFF:</span> <span class="dia-stat-val">${atqEff.toFixed(1)}%</span></div></div>
                            </div>
                         </div>`;
            });
            html += `</div></div>`;
        }
    });

    document.getElementById('ent-dia-players-area').innerHTML = html || '<div class="no-data-msg">No hay métricas cargadas para este día.</div>';
}