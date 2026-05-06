// ==========================================
// MÓDULO DE GENERACIÓN DE REPORTES PDF
// ==========================================

var repCharts = [];

function reporteAbrirModal() {
    // Sugerimos el mes actual por defecto
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('rep-fecha-inicio').value = `${y}-${m}-01`;
    document.getElementById('rep-fecha-fin').value = `${y}-${m}-${String(new Date(y, now.getMonth() + 1, 0).getDate()).padStart(2,'0')}`;
    
    document.getElementById('reporte-modal-overlay').style.display = 'flex';
}

function reporteGenerarVista() {
    var start = document.getElementById('rep-fecha-inicio').value;
    var end = document.getElementById('rep-fecha-fin').value;
    
    if(!start || !end || start > end) { alert("⚠️ Rango de fechas inválido."); return; }

    var validDates = [...ENT_DATES_WITH_DATA].filter(d => d >= start && d <= end).sort();
    
    if(validDates.length === 0) {
        alert("No hay datos estadísticos, físicos ni planificaciones en estas fechas.");
        return;
    }

    document.getElementById('reporte-modal-overlay').style.display = 'none';
    document.getElementById('reporte-preview-overlay').style.display = 'block';

    // Limpiar gráficos viejos
    repCharts.forEach(c => c.destroy());
    repCharts = [];

    renderizarHoja(validDates, start, end);
}

function fr(val, tot) { return (val > 0 && tot > 0) ? val/tot : 0; }
function pct(val, tot) { return (fr(val, tot)*100).toFixed(1) + '%'; }

function renderizarHoja(dates, start, end) {
    var hoja = document.getElementById('reporte-hoja');
    
    // 1. Filtrar data del equipo (excluyendo JUGADOR='EQUIPO' para no duplicar sumas si existiera, o usándolo si es necesario. En nuestro sistema calculamos sumando los jugadores)
    var rawData = window.RAW_FUND.filter(r => dates.includes(r.DATE) && r.JUGADOR !== 'EQUIPO');
    var armData = window.RAW_ARM.filter(r => dates.includes(r.DATE) && r.ARMADOR !== 'EQUIPO');

    // MÉTRICAS GENERALES EQUIPO
    var sTot = entSum(rawData,'SAQ_TOT'), sAce = entSum(rawData,'SAQ_ACE'), sErr = entSum(rawData,'SAQ_ERR');
    var rTot = entSum(rawData,'REC_TOT'), rPosPerf = entSum(rawData,'REC_POS') + entSum(rawData,'REC_PERF'), rErr = entSum(rawData,'REC_ERR');
    var aTot = entSum(rawData,'ATQ_TOT'), aKill = entSum(rawData,'ATQ_KILL'), aErr = entSum(rawData,'ATQ_ERR'), aBlk = entSum(rawData,'ATQ_BLK');
    
    var rEficacia = pct(rPosPerf, rTot);
    var rEficiencia = pct(rPosPerf - rErr, rTot);
    var aEficacia = pct(aKill, aTot);
    var aEficiencia = pct(aKill - aErr - aBlk, aTot);

    // PLANIFICACIÓN
    var planesHtml = '';
    dates.forEach(d => {
        if(window.RAW_PLAN && window.RAW_PLAN[d]) {
            var f = new Date(d+'T12:00:00').toLocaleDateString('es-AR', {day:'2-digit', month:'short'});
            planesHtml += `<div style="margin-bottom:8px; font-size:0.85rem; border-left:3px solid #3b82f6; padding-left:8px;"><strong>${f}:</strong> ${window.RAW_PLAN[d]}</div>`;
        }
    });
    if(!planesHtml) planesHtml = '<div style="color:#94a3b8; font-size:0.85rem;">No hay planificaciones cargadas en este período.</div>';

    var html = `
        <!-- ENCABEZADO Y CALENDARIO -->
        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
                <h1 style="margin:0; font-size:1.8rem; color:#0f172a; text-transform:uppercase;">Reporte de Rendimiento</h1>
                <div style="color:#64748b; font-weight:800;">Período: ${start} al ${end}</div>
            </div>
            <img src="https://firebasestorage.googleapis.com/v0/b/dashboard-seleccion.firebasestorage.app/o/FeVA%20vertical%20colores%20y%20sombras.png?alt=media&token=77913fe1-f3f0-47d2-b1a4-d4045f60b2c0" style="height:50px;">
        </div>

        <div class="rep-grid-2">
            <div>
                <div class="rep-card-title">Días Activos (${dates.length})</div>
                <div style="display:flex; flex-wrap:wrap; gap:5px;">
                    ${dates.map(d => {
                        var f = new Date(d+'T12:00:00').toLocaleDateString('es-AR', {day:'2-digit', month:'short'});
                        return `<span style="background:#dbeafe; color:#1e40af; padding:5px 10px; border-radius:4px; font-size:0.75rem; font-weight:800;">${f}</span>`;
                    }).join('')}
                </div>
            </div>
            <div>
                <div class="rep-card-title">Planificación del Período</div>
                ${planesHtml}
            </div>
        </div>

        <!-- RESUMEN DE EQUIPO -->
        <h3 style="color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:5px;">RENDIMIENTO GENERAL DEL EQUIPO</h3>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:15px; margin-bottom:20mm;">
            <div class="rep-card">
                <div class="rep-card-title">⚡ Saque</div>
                <div class="rep-kpi-row"><span class="rep-kpi-lbl">Intentos</span><span class="rep-kpi-val">${sTot}</span></div>
                <div class="rep-kpi-row"><span class="rep-kpi-lbl" style="color:#16a34a">Aciertos (Aces)</span><span class="rep-kpi-val" style="color:#16a34a">${sAce}</span></div>
                <div class="rep-kpi-row"><span class="rep-kpi-lbl" style="color:#dc2626">Errores</span><span class="rep-kpi-val" style="color:#dc2626">${sErr}</span></div>
            </div>
            <div class="rep-card">
                <div class="rep-card-title">🤲 Recepción</div>
                <div class="rep-kpi-row"><span class="rep-kpi-lbl">Intentos</span><span class="rep-kpi-val">${rTot}</span></div>
                <div class="rep-kpi-row"><span class="rep-kpi-lbl" style="color:#3b82f6">Eficacia (#+)</span><span class="rep-kpi-val" style="color:#3b82f6">${rEficacia}</span></div>
                <div class="rep-kpi-row"><span class="rep-kpi-lbl" style="color:#8b5cf6">Eficiencia</span><span class="rep-kpi-val" style="color:#8b5cf6">${rEficiencia}</span></div>
            </div>
            <div class="rep-card">
                <div class="rep-card-title">🏐 Ataque General</div>
                <div class="rep-kpi-row"><span class="rep-kpi-lbl">Intentos</span><span class="rep-kpi-val">${aTot}</span></div>
                <div class="rep-kpi-row"><span class="rep-kpi-lbl" style="color:#3b82f6">Eficacia (Kills)</span><span class="rep-kpi-val" style="color:#3b82f6">${aEficacia}</span></div>
                <div class="rep-kpi-row"><span class="rep-kpi-lbl" style="color:#8b5cf6">Eficiencia</span><span class="rep-kpi-val" style="color:#8b5cf6">${aEficiencia}</span></div>
            </div>
        </div>

        <!-- GRÁFICOS EVOLUCIÓN (Línea de tiempo) -->
        <div class="rep-avoid-break" style="margin-bottom:20mm;">
            <h3 style="color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:5px;">EVOLUCIÓN TEMPORAL</h3>
            
            <div style="display:flex; flex-direction:column; gap:15px;">
                <div class="rep-card"><div class="rep-card-title">Evolución: Recepción</div><div style="height:200px; width:100%;"><canvas id="rep-chart-rec"></canvas></div></div>
                <div class="rep-card"><div class="rep-card-title">Evolución: Ataque General</div><div style="height:200px; width:100%;"><canvas id="rep-chart-atq"></canvas></div></div>
                <div class="rep-card"><div class="rep-card-title">Evolución: Ataque de Salida (Post-Recepción)</div><div style="height:200px; width:100%;"><canvas id="rep-chart-apr"></canvas></div></div>
            </div>
        </div>

        <!-- JUGADORES (Salto de página) -->
        <div class="rep-page-break">
            <h3 style="color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:5px; margin-bottom:15px;">RENDIMIENTO INDIVIDUAL</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;" id="rep-players-grid">
                <!-- Tarjetas individuales -->
            </div>
        </div>
    `;

    hoja.innerHTML = html;

    // Procesar datos para gráficos
    var dLbls = dates.map(d => d.substring(5)); // Mes-Dia
    
    var recPct = dates.map(d => { var f=rawData.filter(x=>x.DATE===d); return fr(entSum(f,'REC_POS')+entSum(f,'REC_PERF'), entSum(f,'REC_TOT'))*100; });
    var recEff = dates.map(d => { var f=rawData.filter(x=>x.DATE===d); return fr(entSum(f,'REC_POS')+entSum(f,'REC_PERF')-entSum(f,'REC_ERR'), entSum(f,'REC_TOT'))*100; });
    
    var atqPct = dates.map(d => { var f=rawData.filter(x=>x.DATE===d); return fr(entSum(f,'ATQ_KILL'), entSum(f,'ATQ_TOT'))*100; });
    var atqEff = dates.map(d => { var f=rawData.filter(x=>x.DATE===d); return fr(entSum(f,'ATQ_KILL')-entSum(f,'ATQ_ERR')-entSum(f,'ATQ_BLK'), entSum(f,'ATQ_TOT'))*100; });
    
    var aprPct = dates.map(d => { var f=rawData.filter(x=>x.DATE===d); return fr(entSum(f,'APR_KILL'), entSum(f,'APR_TOT'))*100; });
    var aprEff = dates.map(d => { var f=rawData.filter(x=>x.DATE===d); return fr(entSum(f,'APR_KILL')-entSum(f,'APR_ERR')-entSum(f,'APR_BLK'), entSum(f,'APR_TOT'))*100; });

    // Renderizar Gráficos (Sin animación para que se puedan imprimir al instante)
    var chartOpts = { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: 'top' } }, scales: { y: { min: -10, max: 100 } } };
    
    repCharts.push(new Chart(document.getElementById('rep-chart-rec'), { type:'line', data:{ labels:dLbls, datasets:[{label:'Eficacia %', data:recPct, borderColor:'#3b82f6', tension:0.3}, {label:'Eficiencia %', data:recEff, borderColor:'#8b5cf6', tension:0.3}] }, options: chartOpts }));
    repCharts.push(new Chart(document.getElementById('rep-chart-atq'), { type:'line', data:{ labels:dLbls, datasets:[{label:'Eficacia %', data:atqPct, borderColor:'#3b82f6', tension:0.3}, {label:'Eficiencia %', data:atqEff, borderColor:'#8b5cf6', tension:0.3}] }, options: chartOpts }));
    repCharts.push(new Chart(document.getElementById('rep-chart-apr'), { type:'line', data:{ labels:dLbls, datasets:[{label:'Eficacia %', data:aprPct, borderColor:'#3b82f6', tension:0.3}, {label:'Eficiencia %', data:aprEff, borderColor:'#8b5cf6', tension:0.3}] }, options: chartOpts }));

    // Renderizar Jugadores
    var players = [...new Set(rawData.map(r => r.JUGADOR))].sort();
    var pGrid = document.getElementById('rep-players-grid');
    
    players.forEach(p => {
        var pData = rawData.filter(r => r.JUGADOR === p);
        var pt = entSum(pData,'ATQ_TOT'), pk = entSum(pData,'ATQ_KILL'), pe = entSum(pData,'ATQ_ERR'), pb = entSum(pData,'ATQ_BLK');
        var rt = entSum(pData,'REC_TOT'), rpp = entSum(pData,'REC_POS')+entSum(pData,'REC_PERF'), re = entSum(pData,'REC_ERR');
        var st = entSum(pData,'SAQ_TOT'), sa = entSum(pData,'SAQ_ACE');
        
        var pInfo = (window.RAW_PLAYERS || []).find(pl => pl.NAME === p) || {};
        var posColor = pInfo.POS ? (KINE_ROLE_COLS[pInfo.POS] || '#64748b') : '#64748b';

        pGrid.innerHTML += `
            <div class="rep-card rep-avoid-break" style="padding:10px; display:flex; gap:10px;">
                <div style="width:40px; height:40px; border-radius:50%; background:${posColor}; color:#fff; display:flex; justify-content:center; align-items:center; font-weight:900; font-size:0.8rem; flex-shrink:0;">${pInfo.POS||'S/P'}</div>
                <div style="flex:1;">
                    <div style="font-weight:900; color:#0f172a; margin-bottom:8px;">${p}</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; font-size:0.75rem;">
                        <div><strong style="color:#64748b">ATQ:</strong> ${pt} int (${pct(pk,pt)} efic)</div>
                        <div><strong style="color:#64748b">REC:</strong> ${rt} int (${pct(rpp,rt)} efic)</div>
                        <div><strong style="color:#64748b">SAQ:</strong> ${st} int (${sa} aces)</div>
                        <div><strong style="color:#64748b">EFF ATQ:</strong> ${pct(pk-pe-pb,pt)}</div>
                    </div>
                </div>
            </div>
        `;
    });
}