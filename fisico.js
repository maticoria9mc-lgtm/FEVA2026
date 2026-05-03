// ==========================================
// MÓDULO DE PREPARACIÓN FÍSICA (WELLNESS, RPE & STAFF)
// 100% CONECTADO A FIREBASE FIRESTORE
// ==========================================

var fisicoCurrentMode = ''; // 'PRE', 'POST' o 'STAFF'
var fisicoSelectedPlayer = null;

// Estados de los formularios
var fPreData = { sueno: null, fatiga: null, animo: null, dolorLvl: 0, dolorZona: '' };
var fPostData = { rpe: null, comentario: '' }; // Se eliminó el tiempo de sesión
var fStaffData = { pesasMin: '', pelotaMin: '', rpeFisico: null, rpeTecnico: null, comentario: '' };

function fisicoAbrirModal(mode) {
    fisicoCurrentMode = mode;
    fisicoSelectedPlayer = null;
    
    // Resetear datos
    fPreData = { sueno: null, fatiga: null, animo: null, dolorLvl: 0, dolorZona: '' };
    fPostData = { rpe: null, comentario: '' };
    fStaffData = { pesasMin: '', pelotaMin: '', rpeFisico: null, rpeTecnico: null, comentario: '' };

    document.getElementById('fisico-modal-overlay').style.display = 'flex';
    
    // Si es STAFF no hace falta elegir jugador, va directo al formulario
    if (mode === 'STAFF') {
        fisicoRenderStaffForm();
    } else {
        fisicoRenderSelector();
    }
}

function fisicoCerrarModal() {
    document.getElementById('fisico-modal-overlay').style.display = 'none';
}

// 🌟 PANTALLA 1: SELECTOR DE JUGADORES (Solo para PRE y POST)
function fisicoRenderSelector() {
    var content = document.getElementById('fisico-modal-content');
    var title = fisicoCurrentMode === 'PRE' ? 'Carga Previa (Wellness)' : 'Carga Posterior (RPE)';
    var subtitle = 'Seleccioná un jugador para cargar sus datos';

    var html = `
        <button class="fisico-close-btn" onclick="fisicoCerrarModal()">✕</button>
        <div style="padding:30px; border-bottom:1px solid #e2e8f0; background:#f8fafc; border-radius:20px 20px 0 0;">
            <h2 style="margin:0 0 5px 0; color:#0f172a;">${title}</h2>
            <p style="margin:0; color:#64748b; font-size:0.9rem;">${subtitle}</p>
        </div>
        <div style="padding:30px; overflow-y:auto; display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:15px;">
    `;

    var players = window.RAW_PLAYERS || [];
    if(players.length === 0) {
        html += `<div class="no-data-msg" style="grid-column:1/-1;">No hay jugadores en la base de datos.</div>`;
    } else {
        players.sort((a,b) => a.NAME.localeCompare(b.NAME)).forEach(p => {
            var photoHtml = p.FOTO ? `<img src="${p.FOTO}" class="fisico-player-img">` : `<div class="fisico-player-img">${p.NAME.substring(0,2)}</div>`;
            var pos = p.POS === 'LB' ? 'LI' : (p.POS || 'S/P');
            html += `
                <div class="fisico-player-card" onclick="fisicoSelectPlayer('${p.NAME}', '${p.FOTO||''}', '${pos}')">
                    ${photoHtml}
                    <div class="fisico-player-name">${p.NAME}</div>
                    <div style="font-size:0.7rem; font-weight:800; color:#94a3b8;">${pos}</div>
                </div>
            `;
        });
    }

    html += `</div>`;
    content.innerHTML = html;
}

function fisicoSelectPlayer(name, foto, pos) {
    fisicoSelectedPlayer = { name: name, foto: foto, pos: pos };
    if (fisicoCurrentMode === 'PRE') { fisicoRenderPreForm(); } 
    else { fisicoRenderPostForm(); }
}

function fisicoGetHeaderHtml(titleStr, subtitleStr) {
    var photoHtml = fisicoSelectedPlayer.foto ? `<img src="${fisicoSelectedPlayer.foto}" style="width:50px; height:50px; border-radius:50%; object-fit:cover;">` : `<div style="width:50px; height:50px; border-radius:50%; background:#e2e8f0; display:flex; justify-content:center; align-items:center; font-weight:800; color:#64748b;">${fisicoSelectedPlayer.name.substring(0,2)}</div>`;
    
    return `
        <button class="fisico-close-btn" onclick="fisicoRenderSelector()">←</button>
        <div style="padding:20px 30px; border-bottom:1px solid #e2e8f0; background:#f8fafc; border-radius:20px 20px 0 0; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h2 style="margin:0 0 5px 0; color:#0f172a;">${titleStr}</h2>
                <p style="margin:0; color:#64748b; font-size:0.9rem;">${subtitleStr}</p>
            </div>
            <div style="display:flex; align-items:center; gap:12px; text-align:right;">
                <div>
                    <div style="font-weight:900; color:#0f172a;">${fisicoSelectedPlayer.name}</div>
                    <div style="font-size:0.7rem; font-weight:800; color:#94a3b8;">${fisicoSelectedPlayer.pos}</div>
                </div>
                ${photoHtml}
            </div>
        </div>
    `;
}

// ==========================================
// FORMULARIO: CARGA PREVIA (WELLNESS JUGADORES)
// ==========================================
function fisicoRenderPreForm() {
    var content = document.getElementById('fisico-modal-content');
    function buildScale(category, options) {
        var html = `<div class="f-scale-group">`;
        options.forEach((opt, i) => {
            var val = i + 1;
            var isActive = fPreData[category] === val ? ' active-blue' : '';
            html += `<div class="f-scale-btn${isActive}" onclick="fisicoSetPre('${category}', ${val})"><span class="fs-lbl">${opt}</span><span class="fs-num">${val}</span></div>`;
        });
        html += `</div>`;
        return html;
    }

    var html = fisicoGetHeaderHtml('¿Cómo llegás hoy?', 'Bienestar antes de entrenar');
    html += `
        <div style="padding:30px; display:flex; flex-direction:column; gap:20px;">
            <div><div style="font-size:0.8rem; font-weight:900; color:#64748b; margin-bottom:10px; text-transform:uppercase;">CALIDAD DEL SUEÑO</div>${buildScale('sueno', ['Muy mal', 'Mal', 'Regular', 'Bien', 'Excelente'])}</div>
            <div><div style="font-size:0.8rem; font-weight:900; color:#64748b; margin-bottom:10px; text-transform:uppercase;">NIVEL DE FATIGA</div>${buildScale('fatiga', ['Sin fatiga', 'Leve', 'Moderada', 'Alta', 'Agotado'])}</div>
            <div><div style="font-size:0.8rem; font-weight:900; color:#64748b; margin-bottom:10px; text-transform:uppercase;">ESTADO DE ÁNIMO</div>${buildScale('animo', ['Muy bajo', 'Bajo', 'Neutro', 'Bien', 'Excelente'])}</div>
            <div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="font-size:0.8rem; font-weight:900; color:#64748b; text-transform:uppercase;">DOLOR MUSCULAR O ARTICULAR</div>
                    <div style="font-weight:900; font-size:1.2rem; color:#3b82f6;" id="dolor-val-display">${fPreData.dolorLvl}</div>
                </div>
                <div style="font-size:0.75rem; color:#94a3b8;">(0 = Sin dolor · 10 = Máximo)</div>
                <input type="range" min="0" max="10" value="${fPreData.dolorLvl}" class="f-slider" oninput="fisicoSetPreDolor(this.value)">
                <input type="text" class="f-input" placeholder="¿Dónde? (Ej: Rodilla izquierda)" value="${fPreData.dolorZona}" onchange="fPreData.dolorZona = this.value" style="margin-top:10px;">
            </div>
            <div style="display:flex; gap:15px; margin-top:10px;">
                <button onclick="fisicoRenderSelector()" style="flex:1; padding:15px; border-radius:12px; border:none; background:#e2e8f0; color:#475569; font-weight:900; cursor:pointer;">Cancelar</button>
                <button onclick="fisicoGuardarBD()" style="flex:2; padding:15px; border-radius:12px; border:none; background:#16a34a; color:#fff; font-weight:900; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(22,163,74,0.3);">❤️ Guardar en Nube</button>
            </div>
        </div>
    `;
    content.innerHTML = html;
}

function fisicoSetPre(category, val) { fPreData[category] = val; fisicoRenderPreForm(); }
function fisicoSetPreDolor(val) { fPreData.dolorLvl = val; document.getElementById('dolor-val-display').textContent = val; }


// ==========================================
// FORMULARIO: CARGA POSTERIOR (RPE JUGADORES)
// ==========================================
function fisicoRenderPostForm() {
    var content = document.getElementById('fisico-modal-content');
    
    var rpeOptions = [
        {lbl: 'Muy fácil', cls: 'rpe-1'}, {lbl: 'Fácil', cls: 'rpe-2'}, {lbl: 'Moderado', cls: 'rpe-3'}, {lbl: 'Duro', cls: 'rpe-4'}, {lbl: 'Muy duro', cls: 'rpe-5'}
    ];

    var rpeHtml = `<div class="f-scale-group">`;
    rpeOptions.forEach((opt, i) => {
        var val = i + 1;
        var isActive = fPostData.rpe === val ? ' active-rpe' : '';
        rpeHtml += `<div class="f-scale-btn rpe-btn ${opt.cls}${isActive}" onclick="fisicoSetPost('rpe', ${val})"><span class="fs-num" style="color:#fff;">${val}</span><span class="fs-lbl" style="color:rgba(255,255,255,0.9);">${opt.lbl}</span></div>`;
    });
    rpeHtml += `</div>`;

    var html = fisicoGetHeaderHtml('¿Cómo fue la sesión?', 'Esfuerzo percibido del entrenamiento');
    
    html += `
        <div style="padding:30px; display:flex; flex-direction:column; gap:25px;">
            <div>
                <div style="font-size:0.8rem; font-weight:900; color:#64748b; margin-bottom:10px; text-transform:uppercase;">ESFUERZO PERCIBIDO (RPE)</div>
                ${rpeHtml}
            </div>
            <div>
                <textarea class="f-input" rows="3" placeholder="Comentarios de la sesión (lesiones, sensaciones, notas)..." onchange="fPostData.comentario = this.value">${fPostData.comentario}</textarea>
            </div>
            <div style="display:flex; gap:15px; margin-top:10px;">
                <button onclick="fisicoRenderSelector()" style="flex:1; padding:15px; border-radius:12px; border:none; background:#e2e8f0; color:#475569; font-weight:900; cursor:pointer;">Cancelar</button>
                <button onclick="fisicoGuardarBD()" style="flex:2; padding:15px; border-radius:12px; border:none; background:#3b82f6; color:#fff; font-weight:900; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(59,130,246,0.3);">☁️ Guardar en Nube</button>
            </div>
        </div>
    `;
    content.innerHTML = html;
}

function fisicoSetPost(category, val) { fPostData[category] = val; fisicoRenderPostForm(); }


// ==========================================
// NUEVO FORMULARIO: CARGA DEL STAFF (PF)
// ==========================================
function fisicoRenderStaffForm() {
    var content = document.getElementById('fisico-modal-content');
    
    var rpeOptions = [
        {lbl: 'Muy fácil', cls: 'rpe-1'}, {lbl: 'Fácil', cls: 'rpe-2'}, {lbl: 'Moderado', cls: 'rpe-3'}, {lbl: 'Duro', cls: 'rpe-4'}, {lbl: 'Muy duro', cls: 'rpe-5'}
    ];

    function getRpeHtml(category, currentVal) {
        var h = `<div class="f-scale-group">`;
        rpeOptions.forEach((opt, i) => {
            var val = i + 1;
            var isActive = currentVal === val ? ' active-rpe' : '';
            h += `<div class="f-scale-btn rpe-btn ${opt.cls}${isActive}" onclick="fisicoSetStaff('${category}', ${val})"><span class="fs-num" style="color:#fff;">${val}</span><span class="fs-lbl" style="color:rgba(255,255,255,0.9);">${opt.lbl}</span></div>`;
        });
        h += `</div>`;
        return h;
    }

    var html = `
        <button class="fisico-close-btn" onclick="fisicoCerrarModal()">✕</button>
        <div style="padding:20px 30px; border-bottom:1px solid #e2e8f0; background:#f8fafc; border-radius:20px 20px 0 0; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h2 style="margin:0 0 5px 0; color:#0f172a;">Carga Global del Staff (PF)</h2>
                <p style="margin:0; color:#64748b; font-size:0.9rem;">Volumen e intensidad general del entrenamiento</p>
            </div>
            <div style="font-size:2rem; background:#ede9fe; width:50px; height:50px; display:flex; justify-content:center; align-items:center; border-radius:50%; border:2px solid #ddd6fe;">📋</div>
        </div>
        
        <div style="padding:30px; display:flex; flex-direction:column; gap:25px;">
            
            <div style="display:flex; gap:15px; flex-wrap:wrap;">
                <div style="flex:1; min-width:180px; display:flex; align-items:center; gap:10px; background:#f8fafc; padding:15px; border-radius:12px; border:1px solid #e2e8f0;">
                    <div style="flex:1;">
                        <div style="font-size:0.8rem; font-weight:900; color:#64748b; margin-bottom:5px; text-transform:uppercase;">🏋️ TIEMPO PESAS</div>
                        <div style="font-size:0.75rem; color:#94a3b8;">Minutos gimnasio</div>
                    </div>
                    <div style="width:80px;">
                        <input type="number" class="f-input" placeholder="Min" value="${fStaffData.pesasMin}" onchange="fStaffData.pesasMin = this.value" style="font-size:1.3rem; font-weight:900; text-align:center; color:#8b5cf6; background:#ede9fe; border-color:#c4b5fd;">
                    </div>
                </div>
                <div style="flex:1; min-width:180px; display:flex; align-items:center; gap:10px; background:#f8fafc; padding:15px; border-radius:12px; border:1px solid #e2e8f0;">
                    <div style="flex:1;">
                        <div style="font-size:0.8rem; font-weight:900; color:#64748b; margin-bottom:5px; text-transform:uppercase;">🏐 TIEMPO PELOTA</div>
                        <div style="font-size:0.75rem; color:#94a3b8;">Minutos en cancha</div>
                    </div>
                    <div style="width:80px;">
                        <input type="number" class="f-input" placeholder="Min" value="${fStaffData.pelotaMin}" onchange="fStaffData.pelotaMin = this.value" style="font-size:1.3rem; font-weight:900; text-align:center; color:#1d4ed8; background:#dbeafe; border-color:#93c5fd;">
                    </div>
                </div>
            </div>

            <div>
                <div style="font-size:0.8rem; font-weight:900; color:#64748b; margin-bottom:10px; text-transform:uppercase;">INTENSIDAD FÍSICA (1-5)</div>
                ${getRpeHtml('rpeFisico', fStaffData.rpeFisico)}
            </div>

            <div>
                <div style="font-size:0.8rem; font-weight:900; color:#64748b; margin-bottom:10px; text-transform:uppercase;">INTENSIDAD TÉCNICA (1-5)</div>
                ${getRpeHtml('rpeTecnico', fStaffData.rpeTecnico)}
            </div>

            <div>
                <textarea class="f-input" rows="3" placeholder="Comentarios del Staff (objetivos cumplidos, problemas, notas)..." onchange="fStaffData.comentario = this.value">${fStaffData.comentario}</textarea>
            </div>
            
            <div style="display:flex; gap:15px; margin-top:10px;">
                <button onclick="fisicoCerrarModal()" style="flex:1; padding:15px; border-radius:12px; border:none; background:#e2e8f0; color:#475569; font-weight:900; cursor:pointer;">Cancelar</button>
                <button onclick="fisicoGuardarBD()" style="flex:2; padding:15px; border-radius:12px; border:none; background:#8b5cf6; color:#fff; font-weight:900; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(139,92,246,0.3);">☁️ Guardar Carga Global</button>
            </div>
        </div>
    `;
    content.innerHTML = html;
}

function fisicoSetStaff(category, val) { 
    fStaffData[category] = val; 
    fisicoRenderStaffForm(); 
}


// ==========================================
// GUARDADO EN FIREBASE FIRESTORE
// ==========================================
function fisicoGuardarBD() {
    var payload = {
        fecha: new Date().toISOString().substring(0,10), // Guardado de la fecha actual
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // Sello de tiempo de Firebase
    };

    var collectionName = '';

    if (fisicoCurrentMode === 'PRE') {
        if (!fPreData.sueno || !fPreData.fatiga || !fPreData.animo) {
            alert("⚠️ Por favor, completá sueño, fatiga y ánimo antes de registrar.");
            return;
        }
        payload.jugador = fisicoSelectedPlayer.name;
        payload.tipo = 'WELLNESS';
        payload.datos = fPreData;
        collectionName = 'fisico_wellness';

    } else if (fisicoCurrentMode === 'POST') {
        if (!fPostData.rpe) {
            alert("⚠️ Por favor, seleccioná el esfuerzo (RPE).");
            return;
        }
        payload.jugador = fisicoSelectedPlayer.name;
        payload.tipo = 'RPE';
        payload.datos = fPostData;
        collectionName = 'fisico_rpe';

    } else if (fisicoCurrentMode === 'STAFF') {
        if (!fStaffData.pesasMin || !fStaffData.pelotaMin || !fStaffData.rpeFisico || !fStaffData.rpeTecnico) {
            alert("⚠️ Por favor, completá los tiempos de sesión y ambas intensidades.");
            return;
        }
        payload.tipo = 'STAFF_GLOBAL';
        payload.datos = {
            pesasMin: Number(fStaffData.pesasMin),
            pelotaMin: Number(fStaffData.pelotaMin),
            rpeFisico: fStaffData.rpeFisico,
            rpeTecnico: fStaffData.rpeTecnico,
            comentario: fStaffData.comentario
        };
        collectionName = 'fisico_staff';
    }

    // Inyectamos directo en Firestore
    db.collection(collectionName).add(payload)
        .then(() => {
            alert("✅ ¡Datos guardados exitosamente en la nube!");
            fisicoCerrarModal();
        })
        .catch(err => {
            console.error("Error guardando datos físicos:", err);
            alert("❌ Ocurrió un error de conexión al guardar.");
        });
}