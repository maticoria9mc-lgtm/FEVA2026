var currentDiaDate = null;
var entDiaCalYear = new Date().getFullYear();
var entDiaCalMonth = new Date().getMonth();

// 🌟 VARIABLES GLOBALES PARA EL RADAR DINÁMICO DE DÍA A DÍA
var diaArmRadarSelectedPlayers = new Set(['EQUIPO']);
var diaArmRadarCurrentMetric = 'EFF';
var diaArmRadarDataMap = {};
var diaArmRadarAvailableArms = [];

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
      
      var hasStats = (typeof RAW_FUND !== 'undefined' && RAW_FUND.some(r => r.DATE === ds)) || 
                     (typeof RAW_MATCH_STATS !== 'undefined' && RAW_MATCH_STATS.some(r => r.DATE === ds));
      var hasVideos = (typeof RAW_VIDEOS !== 'undefined' && RAW_VIDEOS.some(v => v.DATE === ds && v.LINK));
      var hasRealData = hasStats || hasVideos;

      var isMatchData = typeof MATCH_DATES_WITH_DATA !== 'undefined' && MATCH_DATES_WITH_DATA.has(ds);
      var isTrainData = typeof ENT_DATES_WITH_DATA !== 'undefined' && ENT_DATES_WITH_DATA.has(ds) && !isMatchData;
      
      var isMatch = isMatchData && showMatch;
      var isTrain = isTrainData && showTrain;
      var isSel = (ds === currentDiaDate);
      
      var cls='kine-cal-cell';
      if(isMatch) cls += ' match-day'; 
      else if(isTrain) cls += ' has-kine level-5';
      
      if(!hasRealData) cls += ' no-real-data';

      var selStyle = '';
      if(isSel) {
          if(isMatch) selStyle = 'background:#DC2626 !important; color:#fff !important; border-color:#B91C1C !important;';
          else if(isTrain) selStyle = 'background:var(--celeste) !important; color:#fff !important; border-color:var(--celeste) !important;';
          else selStyle = 'background:#f8fafc !important; color:#94a3b8 !important; border-color:#e2e8f0 !important; box-shadow:inset 0 0 0 1px #cbd5e1 !important;';
      }
      
      var flagHtml = '';
      if(isMatch && typeof RAW_MATCH_LINKS !== 'undefined') {
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

// 🌟 FUNCIONES DEL NUEVO RADAR INTERACTIVO 🌟
window.setDiaArmRadarMetric = function(metric) {
    diaArmRadarCurrentMetric = metric;
    renderDiaArmRadar();
};

window.toggleDiaArmRadarPlayer = function(pName) {
    if(diaArmRadarSelectedPlayers.has(pName)) {
        if(diaArmRadarSelectedPlayers.size > 1) diaArmRadarSelectedPlayers.delete(pName);
    } else {
        diaArmRadarSelectedPlayers.add(pName);
    }
    renderDiaArmRadar();
};

function renderDiaArmRadarButtons() {
    var container = document.getElementById('dia-arm-radar-btns');
    if(!container) return;
    var html = '<button onclick="toggleDiaArmRadarPlayer(\'EQUIPO\')" style="margin-right:6px; margin-bottom:6px; padding:6px 12px; border-radius:8px; border:none; cursor:pointer; font-weight:800; font-size:0.75rem; transition:0.2s; '+(diaArmRadarSelectedPlayers.has('EQUIPO')?'background:#1D4ED8;color:#fff;':'background:#e2e8f0;color:#64748b;')+'">EQUIPO</button>';
    diaArmRadarAvailableArms.forEach(p => {
        var isSel = diaArmRadarSelectedPlayers.has(p);
        html += '<button onclick="toggleDiaArmRadarPlayer(\''+p+'\')" style="margin-right:6px; margin-bottom:6px; padding:6px 12px; border-radius:8px; border:none; cursor:pointer; font-weight:800; font-size:0.75rem; transition:0.2s; '+(isSel?'background:#1D4ED8;color:#fff;':'background:#e2e8f0;color:#64748b;')+'">'+p+'</button>';
    });
    container.innerHTML = html;
    
    document.querySelectorAll('.dia-arm-metric-btn').forEach(b => {
        b.style.background = b.dataset.metric === diaArmRadarCurrentMetric ? '#1D4ED8' : '#e2e8f0';
        b.style.color = b.dataset.metric === diaArmRadarCurrentMetric ? '#fff' : '#64748b';
    });
}

function renderDiaArmRadar() {
    if(typeof destroyEntChart === 'function') destroyEntChart('chart-dia-armadores');
    var canvasArm = document.getElementById('chart-dia-armadores');
    if(!canvasArm) return;
    
    var armDatasets = [];
    var colIdx = 0;
    var radarColors = ['rgba(29, 78, 216, .8)', 'rgba(22, 163, 74, .8)', 'rgba(217, 119, 6, .8)', 'rgba(124, 58, 237, .8)'];
    
    var _calcAvg = function(rs, tF, eF) {
        var sumT = 0, sumEff = 0;
        rs.forEach(r => {
            var t = Math.round(r[tF]||0);
            if (t > 0) {
                sumT += t;
                var effVal = r[eF] || 0;
                if (effVal > 1.2 || effVal < -1.2) effVal = effVal / 100;
                sumEff += (t * effVal);
            }
        });
        return sumT > 0 ? (sumEff / sumT) * 100 : 0;
    };

    diaArmRadarSelectedPlayers.forEach(p => {
        var rs = [];
        if (p === 'EQUIPO') {
            diaArmRadarAvailableArms.forEach(armName => { if(diaArmRadarDataMap[armName]) rs = rs.concat(diaArmRadarDataMap[armName]); });
        } else {
            rs = diaArmRadarDataMap[p] || [];
        }

        if(rs.length > 0) {
            var color = p === 'EQUIPO' ? 'rgba(15, 23, 42, .8)' : radarColors[colIdx % radarColors.length];
            var valAG, valPP, valTR;
            
            if(diaArmRadarCurrentMetric === 'EFF') {
                valAG = _calcAvg(rs, 'AG_TOT', 'AG_EFF');
                valPP = _calcAvg(rs, 'PP_TOT', 'PP_EFF');
                valTR = _calcAvg(rs, 'TR_TOT', 'TR_EFF');
            } else {
                valAG = _calcAvg(rs, 'AG_TOT', 'AG_PCT_KILL');
                valPP = _calcAvg(rs, 'PP_TOT', 'PP_PCT_KILL');
                valTR = _calcAvg(rs, 'TR_TOT', 'TR_PCT_KILL');
            }
            
            armDatasets.push({
                label: p,
                data: [valAG, valPP, valTR],
                borderColor: color,
                backgroundColor: color.replace('.8', '.15'),
                borderWidth: 2.5,
                pointRadius: 4
            });
            if(p !== 'EQUIPO') colIdx++;
        }
    });

    var lbls = diaArmRadarCurrentMetric === 'EFF' ? ['Ataque Gen (EFF)', '1ª Pelota (EFF)', 'Transición (EFF)'] : ['Ataque Gen (% Kills)', '1ª Pelota (% Kills)', 'Transición (% Kills)'];

    // ACHICAMOS LOS MÁRGENES PARA QUE EL RADAR OCUPE MÁS ESPACIO
    entCharts['chart-dia-armadores'] = new Chart(canvasArm.getContext('2d'), {
        type: 'radar',
        data: { labels: lbls, datasets: armDatasets },
        options: { 
            responsive: true, maintainAspectRatio: false, layout: { padding: 5 },
            plugins: { legend: { position: 'top', align:'center', labels:{font:{size:11, weight:'bold'}, padding:15, boxWidth:12} }, tooltip: { callbacks: { label: function(c) { return c.dataset.label + ': ' + Number(c.raw||0).toFixed(1) + '%'; } } } }, 
            scales: { r: { min: diaArmRadarCurrentMetric === 'EFF' ? -10 : 0, ticks: { font: { size: 9 }, backdropColor: 'transparent', callback: v => v.toFixed(0) + '%' }, pointLabels: { font: { size: 12, weight: 'bold' }, padding: 8 }, grid: { color: 'rgba(0,0,0,.08)' } } } 
        }
    });
    renderDiaArmRadarButtons();
}


function renderEntDia() {
    if(!currentDiaDate) {
        var now = new Date();
        currentDiaDate = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
        entDiaCalYear = now.getFullYear();
        entDiaCalMonth = now.getMonth();
    }
    
    renderEntDiaCal();
    
    var descEl = document.getElementById('ent-dia-desc');
    var vids = typeof RAW_VIDEOS !== 'undefined' ? RAW_VIDEOS.filter(v => v.DATE===currentDiaDate && v.LINK) : [];
    var videoBtns = '';
    if(vids.length > 0) {
        videoBtns = '<div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">' + vids.map(v => '<a href="'+v.LINK+'" target="_blank" style="background:var(--celeste);color:#fff;padding:6px 14px;border-radius:8px;text-decoration:none;font-size:.8rem;font-weight:800;transition:all .2s;box-shadow:0 2px 4px rgba(0,0,0,.1);">▶ VIDEO: '+v.TIPO.toUpperCase()+'</a>').join('') + '</div>';
    }
    
    var evs = typeof CAL_EVENTS !== 'undefined' ? (CAL_EVENTS[currentDiaDate] || []) : [];
    var trainEv = evs.find(e => e.type === 'train' || e.type === 'match');
    
    if(trainEv && trainEv.note) { descEl.innerHTML = '<strong style="color:var(--celeste-dark); font-size:.9rem;">PLANIFICACIÓN:</strong><br>' + trainEv.note + videoBtns; descEl.style.display = 'block'; } 
    else if (videoBtns) { descEl.innerHTML = '<strong style="color:var(--celeste-dark); font-size:.9rem;">SESIÓN:</strong>' + videoBtns; descEl.style.display = 'block'; } 
    else { descEl.style.display = 'none'; }

    var teamStatsEl = document.getElementById('ent-dia-team-stats');
    var teamRow = typeof RAW_FUND !== 'undefined' ? RAW_FUND.find(r => r.DATE === currentDiaDate && r.JUGADOR === 'EQUIPO') : null;
    var players = typeof RAW_FUND !== 'undefined' ? RAW_FUND.filter(r => r.DATE === currentDiaDate && r.JUGADOR !== 'EQUIPO') : [];

    function toAbs(v, t) {
        if (!v) return 0;
        if (v % 1 !== 0) return Math.round(v * t);
        return Math.round(v);
    }

    if (!teamRow && players.length > 0) {
        teamRow = { SAQ_TOT:0, SAQ_ACE:0, SAQ_FOUL:0, SAQ_ERR:0, REC_TOT:0, REC_POS:0, REC_PERF:0, REC_ERR:0, REC_NEG:0, ATQ_TOT:0, ATQ_KILL:0, ATQ_ERR:0, ATQ_BLK:0, CTR_TOT:0, CTR_KILL:0, CTR_ERR:0, CTR_BLK:0, APR_TOT:0, APR_KILL:0, APR_ERR:0, APR_BLK:0, BLK_TOT:0, DEF_TOT:0, DEF_ERR:0 };

        players.forEach(p => {
            var tS = p.SAQ_TOT||0;
            teamRow.SAQ_TOT += tS; 
            teamRow.SAQ_ACE += toAbs(p.SAQ_ACE, tS); 
            teamRow.SAQ_ERR += toAbs(p.SAQ_ERR, tS); 
            teamRow.SAQ_FOUL += toAbs(p.SAQ_FOUL, tS);
            
            var tR = p.REC_TOT||0;
            teamRow.REC_TOT += tR; 
            teamRow.REC_POS += toAbs(p.REC_POS, tR);
            teamRow.REC_PERF += toAbs(p.REC_PERF, tR);
            teamRow.REC_ERR += toAbs(p.REC_ERR, tR);
            teamRow.REC_NEG += toAbs(p.REC_NEG, tR);

            var tA = p.ATQ_TOT||0;
            teamRow.ATQ_TOT += tA; 
            teamRow.ATQ_KILL += toAbs(p.ATQ_KILL, tA); 
            teamRow.ATQ_ERR += toAbs(p.ATQ_ERR, tA); 
            teamRow.ATQ_BLK += toAbs(p.ATQ_BLK, tA);

            var tC = p.CTR_TOT||0;
            teamRow.CTR_TOT += tC; 
            teamRow.CTR_KILL += toAbs(p.CTR_KILL, tC); 
            teamRow.CTR_ERR += toAbs(p.CTR_ERR, tC); 
            teamRow.CTR_BLK += toAbs(p.CTR_BLK, tC);

            var tApr = p.APR_TOT||0;
            teamRow.APR_TOT += tApr; 
            teamRow.APR_KILL += toAbs(p.APR_KILL, tApr); 
            teamRow.APR_ERR += toAbs(p.APR_ERR, tApr); 
            teamRow.APR_BLK += toAbs(p.APR_BLK, tApr);

            teamRow.BLK_TOT += p.BLK_TOT||0; 
            teamRow.DEF_TOT += p.DEF_TOT||0; 
            teamRow.DEF_ERR += p.DEF_ERR||0;
        });
    }

    var rL = ['Saque', 'Recepción', 'Ataque Gen.', 'Atq. Post-Rec', 'Contra-Ataque'], dEficacia = [0,0,0,0,0], dEficiencia = [0,0,0,0,0];

    // TARJETA GIGANTE DEL EQUIPO
    if (teamRow) {
         var sT = teamRow.SAQ_TOT||0, sA = toAbs(teamRow.SAQ_ACE, sT) + toAbs(teamRow.SAQ_FOUL, sT), sE = toAbs(teamRow.SAQ_ERR, sT);
         var rT = teamRow.REC_TOT||0, rP = toAbs(teamRow.REC_POS, rT), rPf = toAbs(teamRow.REC_PERF, rT), rE = toAbs(teamRow.REC_ERR, rT);
         var aT = teamRow.ATQ_TOT||0, aK = toAbs(teamRow.ATQ_KILL, aT), aE = toAbs(teamRow.ATQ_ERR, aT), aB = toAbs(teamRow.ATQ_BLK, aT);
         var cT = teamRow.CTR_TOT||0, cK = toAbs(teamRow.CTR_KILL, cT), cE = toAbs(teamRow.CTR_ERR, cT), cB = toAbs(teamRow.CTR_BLK, cT);
         var aprT = teamRow.APR_TOT||0, aprK = toAbs(teamRow.APR_KILL, aprT), aprE = toAbs(teamRow.APR_ERR, aprT), aprB = toAbs(teamRow.APR_BLK, aprT);
         var blkP = teamRow.BLK_TOT||0, defN = (teamRow.DEF_TOT||0) - (teamRow.DEF_ERR||0);

         dEficacia = [ sT>0 ? (sA/sT)*100 : 0, rT>0 ? ((rPf+rP)/rT)*100 : 0, aT>0 ? (aK/aT)*100 : 0, aprT>0 ? (aprK/aprT)*100 : 0, cT>0 ? (cK/cT)*100 : 0 ];
         dEficiencia = [ sT>0 ? ((sA-sE)/sT)*100 : 0, rT>0 ? ((rPf+rP-rE)/rT)*100 : 0, aT>0 ? ((aK-aE-aB)/aT)*100 : 0, aprT>0 ? ((aprK-aprE-aprB)/aprT)*100 : 0, cT>0 ? ((cK-cE-cB)/cT)*100 : 0 ];
         
         var sEff = sT>0 ? ((sA-sE)/sT)*100 : 0;
         var statRecPct = rT>0 ? ((rPf+rP)/rT)*100 : 0;
         var statRecEff = rT>0 ? ((rPf+rP-rE)/rT)*100 : 0;
         var statAtqPct = aT>0 ? (aK/aT)*100 : 0;
         var statAtqEff = aT>0 ? ((aK-aE-aB)/aT)*100 : 0;
         
         var logoHtml = `<img src="${URL_LOGO_FAV}" style="max-width:85%; max-height:85%; object-fit:contain;">`;

         teamStatsEl.innerHTML = `
            <div class="dia-player-card" style="box-shadow: 0 4px 16px rgba(0,0,0,0.05); border-color: #e2e8f0; width:100%; display:flex; flex-direction:column; background:#fff; border-radius:12px; overflow:hidden;">
                <div class="dia-player-header" style="padding:16px 20px; background:#fff; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; gap:16px;">
                    <div class="dia-player-photo" style="width:60px; height:60px; background:#fff; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:4px; display:flex; align-items:center; justify-content:center; border:1px solid #e2e8f0;">${logoHtml}</div>
                    <div class="dia-player-details">
                        <div class="dia-player-name" style="font-size:1.3rem; font-weight:900; color:#0f172a;">EQUIPO ARGENTINA</div>
                        <div class="dia-player-role" style="font-size:0.85rem; font-weight:800; color:var(--celeste); text-transform:uppercase; letter-spacing:0.5px;">Resumen de Sesión</div>
                    </div>
                </div>
                <div class="dia-player-body" style="display:flex; flex-wrap:wrap; gap:12px; padding:20px;">
                    <div class="dia-stat-group" style="flex:1 1 18%; min-width:140px; background:#f8fafc; padding:12px; border-radius:8px;">
                        <div class="dia-stat-title" style="font-size:0.75rem; font-weight:900; color:#475569; margin-bottom:8px;">SAQUE</div>
                        <div class="dia-stat-line" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;"><span style="color:#64748b; font-weight:600;">Total:</span> <span style="font-weight:900; color:#0f172a;">${sT}</span></div>
                        <div class="dia-stat-line" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;"><span style="color:#64748b; font-weight:600;">Aces:</span> <span style="font-weight:900; color:#16a34a;">${sA}</span></div>
                        <div class="dia-stat-line" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:#64748b; font-weight:600;">Err:</span> <span style="font-weight:900; color:#dc2626;">${sE}</span></div>
                    </div>
                    <div class="dia-stat-group" style="flex:1 1 18%; min-width:140px; background:#f8fafc; padding:12px; border-radius:8px;">
                        <div class="dia-stat-title" style="font-size:0.75rem; font-weight:900; color:#475569; margin-bottom:8px;">RECEPCIÓN</div>
                        <div class="dia-stat-line" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;"><span style="color:#64748b; font-weight:600;">Total:</span> <span style="font-weight:900; color:#0f172a;">${rT}</span></div>
                        <div class="dia-stat-line" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;"><span style="color:#64748b; font-weight:600;">Eficacia:</span> <span style="font-weight:900; color:#0f172a;">${statRecPct.toFixed(1)}%</span></div>
                        <div class="dia-stat-line" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:#64748b; font-weight:600;">Eficiencia:</span> <span style="font-weight:900; color:#0f172a;">${statRecEff.toFixed(1)}%</span></div>
                    </div>
                    <div class="dia-stat-group" style="flex:1 1 18%; min-width:140px; background:#f8fafc; padding:12px; border-radius:8px;">
                        <div class="dia-stat-title" style="font-size:0.75rem; font-weight:900; color:#475569; margin-bottom:8px;">ATAQUE GEN</div>
                        <div class="dia-stat-line" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;"><span style="color:#64748b; font-weight:600;">Total:</span> <span style="font-weight:900; color:#0f172a;">${aT}</span></div>
                        <div class="dia-stat-line" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;"><span style="color:#64748b; font-weight:600;">Eficacia:</span> <span style="font-weight:900; color:#0f172a;">${statAtqPct.toFixed(1)}%</span></div>
                        <div class="dia-stat-line" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:#64748b; font-weight:600;">Eficiencia:</span> <span style="font-weight:900; color:#0f172a;">${statAtqEff.toFixed(1)}%</span></div>
                    </div>
                    <div class="dia-stat-group" style="flex:1 1 18%; min-width:140px; background:#f8fafc; padding:12px; border-radius:8px;">
                        <div class="dia-stat-title" style="font-size:0.75rem; font-weight:900; color:#475569; margin-bottom:8px;">BLOQ & DEF</div>
                        <div class="dia-stat-line" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;"><span style="color:#64748b; font-weight:600;">Bloqueos Pt:</span> <span style="font-weight:900; color:#16a34a;">${blkP}</span></div>
                        <div class="dia-stat-line" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:#64748b; font-weight:600;">Def Netas:</span> <span style="font-weight:900; color:${defN>=0?'#16a34a':'#dc2626'};">${defN}</span></div>
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

    // 🌟 ESTILOS CSS INYECTADOS PARA FORZAR LA GRILLA DE 4 COLUMNAS
    var html = `
    <style>
        .grid-4-cols { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1400px) { .grid-4-cols { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 1024px) { .grid-4-cols { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .grid-4-cols { grid-template-columns: 1fr; } }
    </style>
    `;
    
    var posNames = { 'AR':'Armadores', 'OP':'Opuestos', 'CT':'Centrales', 'PR':'Puntas', 'LI':'Líberos' };
    
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
            html += `<div class="dia-role-section" style="margin-top:30px;">
                        <div class="dia-role-title" style="font-size:1.1rem; font-weight:900; color:#334155; margin-bottom:15px; text-transform:uppercase; border-bottom:2px solid #e2e8f0; padding-bottom:8px;">${posNames[ro] || ro}</div>`;
            
            // 🌟 INYECCIÓN DEL RADAR EXCLUSIVO PARA ARMADORES (FORMATO SIDE-BY-SIDE)
            if (ro === 'AR') {
                html += `<div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:16px; align-items:stretch;">
                            
                            <div style="flex:1 1 500px; background:#fff; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04); border:1px solid #e2e8f0; display:flex; flex-direction:column;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">
                                    <div>
                                        <h4 style="margin:0 0 10px 0; color:#475569; font-size:1.05rem;">Comparativa por Sistema</h4>
                                        <div id="dia-arm-radar-btns" style="display:flex; flex-wrap:wrap; gap:6px;"></div>
                                    </div>
                                    <div style="display:flex; flex-direction:column; gap:6px; min-width:90px;">
                                        <button class="dia-arm-metric-btn" data-metric="KILLS" onclick="setDiaArmRadarMetric('KILLS')" style="padding:6px 12px; border-radius:8px; border:none; cursor:pointer; font-weight:800; font-size:0.75rem; transition:0.2s;">Eficacia</button>
                                        <button class="dia-arm-metric-btn" data-metric="EFF" onclick="setDiaArmRadarMetric('EFF')" style="padding:6px 12px; border-radius:8px; border:none; cursor:pointer; font-weight:800; font-size:0.75rem; transition:0.2s;">Eficiencia</button>
                                    </div>
                                </div>
                                <div style="flex-grow:1; position:relative; min-height:420px; width:100%;">
                                    <canvas id="chart-dia-armadores"></canvas>
                                </div>
                            </div>

                            <div style="flex:1 1 500px; display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:16px; align-content:start;">`;
            } else {
                html += `<div class="grid-4-cols">`;
            }

            groups[ro].forEach(data => {
                var p = data.row, pInfo = data.info;
                
                var psT = p.SAQ_TOT||0;
                var psA = toAbs(p.SAQ_ACE, psT) + toAbs(p.SAQ_FOUL, psT);
                var psE = toAbs(p.SAQ_ERR, psT);
                
                var prT = p.REC_TOT||0;
                var prP = toAbs(p.REC_POS, prT);
                var prPf = toAbs(p.REC_PERF, prT);
                var prE = toAbs(p.REC_ERR, prT);
                var prGood = prPf + prP;
                var recEff = prT > 0 ? ((prGood - prE)/prT)*100 : 0;
                
                var paT = p.ATQ_TOT||0;
                var paK = toAbs(p.ATQ_KILL, paT);
                var paE = toAbs(p.ATQ_ERR, paT);
                var paB = toAbs(p.ATQ_BLK, paT);
                var atqEff = paT > 0 ? ((paK - paE - paB)/paT)*100 : 0;

                var aprT = p.APR_TOT||0;
                var aprK = toAbs(p.APR_KILL, aprT);
                var aprE = toAbs(p.APR_ERR, aprT);
                var aprB = toAbs(p.APR_BLK, aprT);
                var aprEff = aprT > 0 ? ((aprK - aprE - aprB)/aprT)*100 : 0;

                var blkT = p.BLK_TOT||0;
                var defT = p.DEF_TOT||0;
                var defE = p.DEF_ERR||0;
                var defNet = defT - defE;

                var recPctStr = prT > 0 ? ((prGood/prT)*100).toFixed(1) + '%' : '0.0%';
                var atqPctStr = paT > 0 ? ((paK/paT)*100).toFixed(1) + '%' : '0.0%';
                var aprPctStr = aprT > 0 ? ((aprK/aprT)*100).toFixed(1) + '%' : '0.0%';

                var photoHtml = (pInfo && pInfo.FOTO) ? `<img src="${pInfo.FOTO}" alt="${p.JUGADOR}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="background:#f1f5f9; width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#64748b; font-weight:800; font-size:1.2rem;">${p.JUGADOR.substring(0,2)}</div>`;

                html += `
                <div style="background:#fff; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04); border:1px solid #e2e8f0; font-family:sans-serif; display:flex; flex-direction:column; min-width:0;">
                    
                    <div style="display:flex; gap:12px; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:12px; margin-bottom:12px;">
                        <div style="width:48px; height:48px; border-radius:50%; overflow:hidden; flex-shrink:0; border:2px solid #f8fafc;">
                            ${photoHtml}
                        </div>
                        <div style="flex:1; overflow:hidden;">
                            <div style="font-weight:900; color:#0f172a; font-size:1.05rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.JUGADOR}</div>
                            <div style="color:#0284c7; font-weight:800; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px;">${posNames[ro]||ro}</div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                        <div style="background:#f8fafc; border-radius:8px; padding:10px;">
                            <div style="font-size:0.65rem; font-weight:900; color:#475569; margin-bottom:8px; text-transform:uppercase;">SAQUE</div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;"><span style="color:#64748b; font-weight:600;">Total:</span> <b style="color:#0f172a">${psT}</b></div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;"><span style="color:#64748b; font-weight:600;">Aces:</span> <b style="color:#16a34a">${psA}</b></div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem;"><span style="color:#64748b; font-weight:600;">Err:</span> <b style="color:#dc2626">${psE}</b></div>
                        </div>
                        
                        <div style="background:#f8fafc; border-radius:8px; padding:10px;">
                            <div style="font-size:0.65rem; font-weight:900; color:#475569; margin-bottom:8px; text-transform:uppercase;">RECEPCIÓN</div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;"><span style="color:#64748b; font-weight:600;">Total:</span> <b style="color:#0f172a">${prT}</b></div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;"><span style="color:#64748b; font-weight:600;">Eficacia:</span> <b style="color:#0f172a">${recPctStr}</b></div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem;"><span style="color:#64748b; font-weight:600;">Eficiencia:</span> <b style="color:#0f172a">${recEff.toFixed(1)}%</b></div>
                        </div>

                        <div style="background:#f8fafc; border-radius:8px; padding:10px;">
                            <div style="font-size:0.65rem; font-weight:900; color:#475569; margin-bottom:8px; text-transform:uppercase;">ATAQUE GEN.</div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;"><span style="color:#64748b; font-weight:600;">Total:</span> <b style="color:#0f172a">${paT}</b></div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;"><span style="color:#64748b; font-weight:600;">Eficacia:</span> <b style="color:#0f172a">${atqPctStr}</b></div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem;"><span style="color:#64748b; font-weight:600;">Eficiencia:</span> <b style="color:#0f172a">${atqEff.toFixed(1)}%</b></div>
                        </div>

                        <div style="background:#f8fafc; border-radius:8px; padding:10px;">
                            <div style="font-size:0.65rem; font-weight:900; color:#475569; margin-bottom:8px; text-transform:uppercase;">ATQ POST-REC</div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;"><span style="color:#64748b; font-weight:600;">Total:</span> <b style="color:#0f172a">${aprT}</b></div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;"><span style="color:#64748b; font-weight:600;">Eficacia:</span> <b style="color:#0f172a">${aprPctStr}</b></div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem;"><span style="color:#64748b; font-weight:600;">Eficiencia:</span> <b style="color:#0f172a">${aprEff.toFixed(1)}%</b></div>
                        </div>

                        <div style="background:#f8fafc; border-radius:8px; padding:10px; grid-column: span 2;">
                            <div style="font-size:0.65rem; font-weight:900; color:#475569; margin-bottom:8px; text-transform:uppercase;">BLOQUEO & DEFENSA</div>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div style="flex:1; display:flex; justify-content:space-between; padding-right:12px; border-right:1px solid #e2e8f0; font-size:0.75rem;">
                                    <span style="color:#64748b; font-weight:600;">Bloqueos Pt:</span> <b style="color:#1d4ed8">${blkT}</b>
                                </div>
                                <div style="flex:1; display:flex; justify-content:space-between; padding-left:12px; font-size:0.75rem;">
                                    <span style="color:#64748b; font-weight:600;">Defensas Netas:</span> <b style="color:${defNet>=0?'#16a34a':'#dc2626'}">${defNet}</b>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            });
            html += `</div>`;
            if (ro === 'AR') html += `</div>`; // Cierra el wrapper side-by-side
        }
    });

    var area = document.getElementById('ent-dia-players-area');
    if (area) {
        area.innerHTML = html || '<div class="no-data-msg">No hay métricas cargadas para este día.</div>';
        
        // 🌟 RENDERIZAR RADAR 
        if (document.getElementById('chart-dia-armadores')) {
            diaArmRadarDataMap = {};
            diaArmRadarAvailableArms = [];
            
            var armData = typeof RAW_ARM !== 'undefined' ? RAW_ARM.filter(r => r.DATE === currentDiaDate && (r.ARMADOR||'').replace(/\d+/g, '').trim() !== 'EQUIPO') : [];
            
            if(armData.length > 0) {
                armData.forEach(r => {
                    var name = r.ARMADOR.replace(/\d+/g, '').trim(); 
                    if(!diaArmRadarDataMap[name]) { diaArmRadarDataMap[name] = []; diaArmRadarAvailableArms.push(name); }
                    diaArmRadarDataMap[name].push(r);
                });
                
                var newSelected = new Set();
                diaArmRadarSelectedPlayers.forEach(p => {
                    if(p === 'EQUIPO' || diaArmRadarAvailableArms.includes(p)) newSelected.add(p);
                });
                if(newSelected.size === 0) newSelected.add('EQUIPO');
                diaArmRadarSelectedPlayers = newSelected;
                
                renderDiaArmRadar();
            } else {
                 document.getElementById('chart-dia-armadores').parentElement.innerHTML = '<div class="no-data-msg" style="padding:40px 10px;">Sin datos de armado en este día.</div>';
            }
        }
    }
}