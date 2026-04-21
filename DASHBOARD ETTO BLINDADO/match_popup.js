// ══════════════════════════════════════════════════════
// MATCH POPUP — Popup interactivo de partidos en el calendario
// ══════════════════════════════════════════════════════

var matchPopupState = { ds: null, tab: 'SAQUE', group: null };

// Determina si el resultado es victoria, derrota o empate
function matchGetWinLoss(resultado) {
    if(!resultado) return 'unknown';
    var parts = resultado.replace(/\s/g,'').split('-');
    if(parts.length < 2) return 'unknown';
    var a = parseInt(parts[0]), b = parseInt(parts[1]);
    if(isNaN(a)||isNaN(b)) return 'unknown';
    if(a > b) return 'win';
    if(a < b) return 'loss';
    return 'draw';
}

// Obtiene grupos (sub-tabs) disponibles para un tab y fecha
function matchPopupGetGroups(ds, tab) {
    var rows = RAW_MATCH_STATS.filter(r => r.DATE === ds && r.TAB === tab);
    var groups = [...new Set(rows.map(r => r.TAB_GROUP))].filter(Boolean);
    groups.sort((a, b) => {
        if(a.includes('GENERAL') || a === 'SAQUE') return -1;
        if(b.includes('GENERAL') || b === 'SAQUE') return 1;
        return a.localeCompare(b);
    });
    return groups;
}

// Convierte fracción almacenada → conteo entero (ACE=0.08 con TOT=102 → 8)
function mCount(val, tot) {
    if(!val || !tot) return 0;
    if(val > 0 && val <= 1.0 && tot > 1) return Math.round(val * tot);
    return Math.round(val);
}

// Fracción → porcentaje legible  "0.082" → "8.2%"
function mPct(val) {
    if(val === null || val === undefined || isNaN(val)) return '—';
    var v = (val > 0 && val <= 1.0) ? val * 100 : val;
    return v.toFixed(1) + '%';
}

// Renderiza las stat pills del equipo para un tab+grupo
function matchPopupRenderStatGrid(ds, tab, group) {
    var rows = RAW_MATCH_STATS.filter(r =>
        r.DATE === ds && r.TAB === tab && r.TAB_GROUP === group && r.JUGADOR_MAPPED === 'EQUIPO'
    );
    if(!rows.length) {
        return '<div style="padding:16px;text-align:center;color:var(--sub);font-size:.8rem;">Sin datos de equipo para este grupo.</div>';
    }
    var r = rows[0];
    var tot = r.TOT || 0;
    var err = r.ERR || 0, blk = r.BLK || 0;
    var perf = r.PERF || 0, kill = r.KILL || 0, ace = r.ACE || 0;
    var posPerf = r.POS_PERF || ((r.POS || 0) + perf);
    var html = '<div class="popup-match-stat-grid">';
    var effVal, effColor;

    if(tab === 'SAQUE') {
        var aceN = mCount(ace, tot), blkN = mCount(blk, tot), errN = mCount(err, tot);
        effVal = mPct(ace - err);
        effColor = (ace - err) >= 0 ? 'green' : 'red';
        html += pill(tot, 'Total', '') +
                pill(aceN, 'Aces #', 'green') +
                pill(blkN, 'Bloq /', 'blue') +
                pill(errN, 'Err =', 'red') +
                pill(effVal, 'EFF', effColor);
    } else if(tab === 'RECEPCION') {
        var posN = mCount(posPerf, tot), blkN2 = mCount(blk, tot), errN2 = mCount(err, tot);
        effVal = mPct(posPerf - err);
        effColor = (posPerf - err) >= 0 ? 'green' : 'red';
        html += pill(tot, 'Total', '') +
                pill(posN, 'Acierto #+', 'green') +
                pill(blkN2, 'Bloq /', 'blue') +
                pill(errN2, 'Err =', 'red') +
                pill(mPct(posPerf), '%#+', 'gold');
    } else {
        var killN = mCount(kill, tot), blkN3 = mCount(blk, tot), errN3 = mCount(err, tot);
        effVal = mPct(kill - err - blk);
        effColor = (kill - err - blk) >= 0 ? 'green' : 'red';
        html += pill(tot, 'Intentos', '') +
                pill(killN, 'Kills #', 'green') +
                pill(blkN3, 'Bloq /', 'blue') +
                pill(errN3, 'Err =', 'red') +
                pill(effVal, 'EFF', effColor);
    }
    html += '</div>';
    return html;
}

function pill(val, lbl, color) {
    var colorClass = color ? ' pmp-' + color : '';
    return '<div class="popup-match-stat-pill' + colorClass + '"><div class="pmp-val">' + val + '</div><div class="pmp-lbl">' + lbl + '</div></div>';
}

// Renderiza el cuerpo del popup (tabs + sub-tabs + stats)
function matchPopupRenderBody(ds) {
    var tab = matchPopupState.tab;
    var groups = matchPopupGetGroups(ds, tab);
    if(!matchPopupState.group || !groups.includes(matchPopupState.group)) {
        matchPopupState.group = groups[0] || null;
    }

    groups.sort((a, b) => {
        var sa = a.toUpperCase();
        var sb = b.toUpperCase();
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

    if(!matchPopupState.group || !groups.includes(matchPopupState.group)) { matchPopupState.group = groups[0] || null; }
    var group = matchPopupState.group;

    var TABS = [
        { id: 'SAQUE', label: '⚡ Saque' },
        { id: 'RECEPCION', label: '🤲 Recepción' },
        { id: 'ATQ', label: '🏐 Rec-Ataque' },
        { id: 'CA', label: '🛡️ Contra' }
    ];

    var availableTabs = TABS.filter(t => { return RAW_MATCH_STATS.some(r => r.DATE === ds && r.TAB === t.id); });

    var tabsHtml = '<div class="popup-match-tabs">';
    availableTabs.forEach(function(t) { var active = t.id === tab ? ' active' : ''; tabsHtml += '<button class="popup-match-tab' + active + '" onclick="matchPopupTab(\'' + t.id + '\')">' + t.label + '</button>'; });
    tabsHtml += '</div>';

    var subTabsHtml = '';
    if(groups.length > 1) {
        subTabsHtml = '<div class="popup-match-sub-tabs">';
        groups.forEach(function(g) {
            var active = g === group ? ' active' : '';
            subTabsHtml += '<button class="popup-match-sub-tab' + active + '" onclick="matchPopupSubTab(\'' + g.replace(/'/g,"\\'") + '\',\'' + tab + '\')">' + g + '</button>';
        });
        subTabsHtml += '</div>';
    }

    var statsHtml = group ? matchPopupRenderStatGrid(ds, tab, group) : '<div style="padding:16px;text-align:center;color:var(--sub);font-size:.8rem;">Sin datos para este partido.</div>';
    return tabsHtml + subTabsHtml + statsHtml;
}

// Función principal — devuelve el HTML completo del popup de partido
function renderMatchCalPopup(ds) {
    matchPopupState.ds = ds;
    if(!matchPopupState.tab) matchPopupState.tab = 'SAQUE';
    matchPopupState.group = null;

    var linkData = RAW_MATCH_LINKS.find(l => l.DATE === ds) || {};
    var rival = linkData.RIVAL || 'Partido Oficial';
    var banderaRaw = linkData.BANDERA || '🏐';
    var resultado = linkData.RESULTADO || '';
    var video = linkData.VIDEO || '';
    var tablaP2 = linkData.TABLA_P2 || linkData.PDF || '';
    var wl = matchGetWinLoss(resultado);
    var wlLabel = { win: '● GANADO', loss: '● PERDIDO', draw: '● EMPATE', unknown: '' }[wl] || '';
    var wlColor = { win: '#166534', loss: '#991B1B', draw: '#92400E', unknown: '#475569' }[wl];

    var dt = new Date(ds + 'T00:00:00');
    var fechaStr = dt.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

    var banderaHtml = (banderaRaw && banderaRaw.startsWith('http')) 
        ? '<img src="' + banderaRaw + '" style="width:28px;height:18px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:8px;box-shadow:0 2px 4px rgba(0,0,0,0.3);">' 
        : '<span style="font-size:1.2rem; margin-right:8px;">' + banderaRaw + '</span>';

    var html = '';

    // === HEADER ===
    html += '<div class="popup-match-header">';
    html += '<div class="pmh-top-row">';
    html += '<div class="pmh-rival" style="display:flex; align-items:center;">' + banderaHtml + '<span class="pmh-rival-name" style="font-weight:900;">vs. ' + rival.toUpperCase() + '</span></div>';
    
    if(resultado) {
        html += '<div class="pmh-score-wrap"><span class="pmh-score">' + resultado + '</span>';
        if(wlLabel) html += '<span class="pmh-wl-badge" style="background:' + (wl==='win'?'rgba(22,163,74,.2)':wl==='loss'?'rgba(220,38,38,.2)':'rgba(146,64,14,.2)') + ';color:' + wlColor + '">' + wlLabel + '</span>';
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="pmh-date">' + fechaStr + '</div>';
    html += '</div>';

    // === LINKS ===
    if(video || tablaP2) {
        html += '<div class="popup-match-links">';
        if(video) html += '<a href="' + video + '" target="_blank" class="popup-match-link-btn video">▶ Video</a>';
        if(tablaP2) html += '<a href="' + tablaP2 + '" target="_blank" class="popup-match-link-btn p2">📊 Tabla P2</a>';
        html += '</div>';
    }

    // === JUGADORES PARTICIPANTES (ROSTER DEL PARTIDO) ===
    var matchPlayersRaw = RAW_MATCH_STATS.filter(r => r.DATE === ds && r.JUGADOR_MAPPED !== 'EQUIPO').map(r => r.JUGADOR_MAPPED);
    var matchPlayers = [...new Set(matchPlayersRaw)];

    if(matchPlayers.length > 0) {
        html += '<div class="popup-section" style="margin:12px 14px 16px;">';
        html += '<div class="popup-section-title" style="color:var(--sub);font-size:.7rem;margin-bottom:10px;text-transform:uppercase;font-weight:900;letter-spacing:1px;border-bottom:1px solid var(--border);padding-bottom:4px;">👥 Roster del Partido</div>';
        
        // MODIFICACIÓN DE LOS LABELS PARA USAR ABREVIACIONES
        var rolesDef = [
            { id: 'AR', label: 'AR' },
            { id: 'CT', label: 'CT' },
            { id: 'PR', label: 'PR' },
            { id: 'OP', label: 'OP' },
            { id: 'LI', label: 'LI' },
            { id: 'OTRO', label: 'OTR' }
        ];

        var pByRole = { 'AR':[], 'OP':[], 'CT':[], 'PR':[], 'LI':[], 'OTRO':[] };
        
        matchPlayers.forEach(pName => {
            var dbPlayer = (typeof window.RAW_PLAYERS !== 'undefined' ? window.RAW_PLAYERS : []).find(p => p.NAME === pName);
            var role = dbPlayer ? dbPlayer.POS : 'OTRO';
            if (role === 'LB') role = 'LI'; // Por si en algún momento guardan como LB
            
            var photo = (dbPlayer && dbPlayer.FOTO) ? dbPlayer.FOTO : '';
            
            if(pByRole[role]) pByRole[role].push({name: pName, photo: photo});
            else pByRole['OTRO'].push({name: pName, photo: photo});
        });

        html += '<div style="display:flex; flex-direction:column; gap:8px;">';
        
        rolesDef.forEach(rDef => {
            if(pByRole[rDef.id].length > 0) {
                html += '<div style="display:flex; align-items:center; gap:8px;">';
                // El ancho (width) volvió a 30px y el tamaño de letra un poquito más grande para resaltar
                html += '<div style="width:30px; font-size:0.75rem; color:var(--celeste); font-weight:900; text-align:right;">' + rDef.label + '</div>';
                html += '<div style="display:flex; flex-wrap:wrap; gap:6px; flex:1;">';
                
                pByRole[rDef.id].forEach(p => {
                    var avatar = p.photo ? '<img src="'+p.photo+'" style="width:20px;height:20px;border-radius:50%;object-fit:cover;">' : '<div style="width:20px;height:20px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:10px;">👤</div>';
                    
                    html += '<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:15px; padding:2px 8px 2px 2px; display:flex; align-items:center; gap:5px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">';
                    html += avatar;
                    html += '<span style="color:var(--text); font-size:0.65rem; font-weight:800;">' + p.name + '</span>';
                    html += '</div>';
                });
                html += '</div></div>';
            }
        });
        
        html += '</div></div>';
    }

    // === STATS INTERACTIVAS ===
    var hasStats = RAW_MATCH_STATS.some(r => r.DATE === ds);
    if(hasStats) {
        html += '<div id="popup-match-body">';
        html += matchPopupRenderBody(ds);
        html += '</div>';
    } else {
        html += '<div style="padding:12px 0;text-align:center;color:var(--sub);font-size:.8rem;">Estadísticas detalladas no disponibles.</div>';
    }

    // === BOTÓN IR AL PANEL ===
    html += '<button class="popup-match-panel-btn" onclick="goToMatchPanel(\'' + ds + '\')">📊 Ver análisis completo</button>';

    return html;
}

// Cambia la pestaña activa del popup
window.matchPopupTab = function(tabName) {
    matchPopupState.tab = tabName;
    matchPopupState.group = null;
    var ds = matchPopupState.ds;
    var bodyEl = document.getElementById('popup-match-body');
    if(bodyEl && ds) bodyEl.innerHTML = matchPopupRenderBody(ds);
};

// Cambia la sub-pestaña activa del popup
window.matchPopupSubTab = function(groupName, tabName) {
    matchPopupState.tab = tabName;
    matchPopupState.group = groupName;
    var ds = matchPopupState.ds;
    var bodyEl = document.getElementById('popup-match-body');
    if(bodyEl && ds) bodyEl.innerHTML = matchPopupRenderBody(ds);
};

// Navega al panel de partidos y selecciona la fecha
window.goToMatchPanel = function(ds) {
    var navItem = document.querySelector('[data-panel="partidos"]');
    if(navItem && typeof switchPanel === 'function') switchPanel('partidos', navItem);
    if(typeof matchSelectedDates !== 'undefined') {
        matchSelectedDates = [ds];
        if(typeof matchRenderMatchCards === 'function') matchRenderMatchCards();
        if(typeof matchRenderStats === 'function') matchRenderStats();
    }
    if(typeof closePopup === 'function') closePopup();
};