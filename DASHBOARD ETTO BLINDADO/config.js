// ==========================================
// LÓGICA MODULAR DEL CENTRO DE CONFIGURACIÓN
// ==========================================

window.CONF_PLAYERS = [];
window.CONF_MATCHES = [];
window.CONF_TRAVELS = [];

function showConfigSection(sec) {
    document.getElementById('config-hub').style.display = 'none';
    document.getElementById('config-sections').style.display = 'block';
    document.getElementById('sec-players').style.display = (sec === 'players') ? 'block' : 'none';
    document.getElementById('sec-matches').style.display = (sec === 'matches') ? 'block' : 'none';
    document.getElementById('sec-travel').style.display = (sec === 'travel') ? 'block' : 'none';
    var titleMap = { players: "Jugadores", matches: "Partidos", travel: "Viajes" };
    document.getElementById('config-main-title').textContent = "⚙️ Configuración > " + titleMap[sec];
}

function backToHub() {
    document.getElementById('config-hub').style.display = 'grid';
    document.getElementById('config-sections').style.display = 'none';
    document.getElementById('config-main-title').textContent = "⚙️ Centro de Configuración";
    resetJugadorForm(); resetPartidoForm(); resetViajeForm();
}

// --- ESCUCHAS EN TIEMPO REAL CON INYECCIÓN AL DASHBOARD ---
function initConfigSnapshots() {
    
    // 1. JUGADORES
    db.collection("jugadores").onSnapshot(snap => {
        var h = ""; window.CONF_PLAYERS = []; window.RAW_PLAYERS = [];
        snap.forEach(doc => { 
            var d = doc.data(); d.id = doc.id; 
            window.CONF_PLAYERS.push(d); window.RAW_PLAYERS.push(d); // INYECTA A LA APP GLOBAL
            
            var avatar = d.FOTO ? `<img src="${d.FOTO}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;margin-right:10px;">` : `<div style="width:30px;height:30px;border-radius:50%;background:#e2e8f0;margin-right:10px;display:flex;align-items:center;justify-content:center;font-size:12px;">👤</div>`;
            h += `<div class="config-list-item" style="display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center;">${avatar}<span><b>${d.NAME}</b> <span style="color:var(--sub)">(${d.POS} ${d.YEAR ? '- '+d.YEAR : ''})</span></span></div>
                    <div><button onclick="editarJugador('${d.id}')" style="color:#0ea5e9; margin-right:8px;" title="Editar">✏️</button><button onclick="eliminarDoc('jugadores','${d.id}')" title="Eliminar">🗑️</button></div>
                  </div>`; 
        });
        document.getElementById('conf-list-jugadores').innerHTML = h || '<p style="color:var(--sub);font-size:0.8rem;">Sin jugadores cargados.</p>'; 
        if(typeof syncGlobalState === 'function') syncGlobalState();
    });

    // 2. PARTIDOS
    db.collection("calendario_partidos").orderBy("DATE", "asc").onSnapshot(snap => {
        var h = ""; window.CONF_MATCHES = []; 
        window.RAW_MATCHES = []; window.RAW_MATCH_LINKS = []; // INYECTA A LA APP GLOBAL
        
        snap.forEach(doc => { 
            var d = doc.data(); d.id = doc.id; window.CONF_MATCHES.push(d);
            
            // Llenamos las variables que usa Data Volley
            window.RAW_MATCHES.push({DATE: d.DATE, TORNEO: d.TORNEO || '', RIVAL: d.RIVAL, UBICACION: '', BANDERA: d.BANDERA || '', RESULTADO: ''});
            window.RAW_MATCH_LINKS.push({DATE: d.DATE, RIVAL: d.RIVAL, BANDERA: d.BANDERA || '', VIDEO: '', PDF: '', TABLA_P2: '', RESULTADO: ''});

            var flag = d.BANDERA ? `<img src="${d.BANDERA}" style="width:24px;height:16px;object-fit:cover;margin-right:10px;border-radius:2px;border:1px solid #ccc;">` : `<span style="font-size:16px;margin-right:10px;">🏐</span>`;
            h += `<div class="config-list-item" style="display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center;">${flag}<span>${d.DATE} - <b>${d.RIVAL}</b> <small style="color:var(--sub)">(${d.TORNEO || ''})</small></span></div>
                    <div><button onclick="editarPartido('${d.id}')" style="color:#0ea5e9; margin-right:8px;" title="Editar">✏️</button><button onclick="eliminarDoc('calendario_partidos','${d.id}')" title="Eliminar">🗑️</button></div>
                  </div>`; 
        });
        document.getElementById('conf-list-partidos').innerHTML = h || '<p style="color:var(--sub);font-size:0.8rem;">Sin partidos cargados.</p>';
        if(typeof syncGlobalState === 'function') syncGlobalState();
    });

    // 3. VIAJES
    db.collection("viajes").orderBy("START", "asc").onSnapshot(snap => {
        var h = ""; window.CONF_TRAVELS = []; window.RAW_VIAJES = [];
        snap.forEach(doc => { 
            var d = doc.data(); d.id = doc.id; window.CONF_TRAVELS.push(d);
            window.RAW_VIAJES.push(d); // INYECTA A LA APP GLOBAL
            
            h += `<div class="config-list-item" style="display:flex; align-items:center; justify-content:space-between;">
                    <span>${d.START} al ${d.END} - <b>${d.UBICACION}</b></span>
                    <div><button onclick="editarViaje('${d.id}')" style="color:#0ea5e9; margin-right:8px;" title="Editar">✏️</button><button onclick="eliminarDoc('viajes','${d.id}')" title="Eliminar">🗑️</button></div>
                  </div>`; 
        });
        document.getElementById('conf-list-viajes').innerHTML = h || '<p style="color:var(--sub);font-size:0.8rem;">Sin viajes cargados.</p>';
        if(typeof syncGlobalState === 'function') syncGlobalState();
    });
}

// --- EDICIÓN PRE-CARGA ---
function editarJugador(id) {
    var d = window.CONF_PLAYERS.find(p => p.id === id); if(!d) return;
    document.getElementById('edit-player-id').value = d.id; document.getElementById('conf-p-name').value = d.NAME;
    document.getElementById('conf-p-pos').value = d.POS; document.getElementById('conf-p-year').value = d.YEAR || "";
    document.getElementById('conf-p-photo').value = ""; document.getElementById('btn-save-jugador').textContent = "Actualizar Jugador";
}
function editarPartido(id) {
    var d = window.CONF_MATCHES.find(m => m.id === id); if(!d) return;
    document.getElementById('edit-match-id').value = d.id; document.getElementById('conf-m-date').value = d.DATE;
    document.getElementById('conf-m-rival').value = d.RIVAL; document.getElementById('conf-m-torneo').value = d.TORNEO || "";
    document.getElementById('conf-m-flag').value = ""; document.getElementById('btn-save-partido').textContent = "Actualizar Partido";
}
function editarViaje(id) {
    var d = window.CONF_TRAVELS.find(v => v.id === id); if(!d) return;
    document.getElementById('edit-travel-id').value = d.id; document.getElementById('conf-v-start').value = d.START;
    document.getElementById('conf-v-end').value = d.END; document.getElementById('conf-v-loc').value = d.UBICACION;
    document.getElementById('btn-save-viaje').textContent = "Actualizar Viaje";
}

// --- GUARDAR O ACTUALIZAR (STORAGE) ---
function guardarConfigJugador() {
    var id = document.getElementById('edit-player-id').value; var n = document.getElementById('conf-p-name').value.toUpperCase();
    var p = document.getElementById('conf-p-pos').value; var y = document.getElementById('conf-p-year').value;
    var file = document.getElementById('conf-p-photo').files[0];
    if(!n) return alert("Falta el nombre");
    var btn = document.getElementById('btn-save-jugador'); btn.textContent = "Subiendo... ⏳"; btn.disabled = true;
    var obj = { NAME: n, POS: p, YEAR: y, timestamp: new Date() };
    if (file) { storage.ref().child('jugadores/' + Date.now() + '_' + file.name).put(file).then(s => s.ref.getDownloadURL()).then(url => { obj.FOTO = url; ejecutarGuardadoDB('jugadores', id, obj, btn, resetJugadorForm); }).catch(e => { alert("Error: " + e.message); resetJugadorForm(); }); } 
    else { if(!id) obj.FOTO = ""; ejecutarGuardadoDB('jugadores', id, obj, btn, resetJugadorForm); }
}

function guardarConfigPartido() {
    var id = document.getElementById('edit-match-id').value; var d = document.getElementById('conf-m-date').value;
    var r = document.getElementById('conf-m-rival').value; var t = document.getElementById('conf-m-torneo').value;
    var file = document.getElementById('conf-m-flag').files[0];
    if(!d || !r) return alert("Fecha y Rival obligatorios");
    var btn = document.getElementById('btn-save-partido'); btn.textContent = "Subiendo... ⏳"; btn.disabled = true;
    var obj = { DATE: d, RIVAL: r, TORNEO: t, timestamp: new Date() };
    if (file) { storage.ref().child('banderas/' + Date.now() + '_' + file.name).put(file).then(s => s.ref.getDownloadURL()).then(url => { obj.BANDERA = url; ejecutarGuardadoDB('calendario_partidos', id, obj, btn, resetPartidoForm); }).catch(e => { alert("Error: " + e.message); resetPartidoForm(); }); } 
    else { if(!id) obj.BANDERA = ""; ejecutarGuardadoDB('calendario_partidos', id, obj, btn, resetPartidoForm); }
}

function guardarConfigViaje() { 
    var id = document.getElementById('edit-travel-id').value; var s = document.getElementById('conf-v-start').value; 
    var e = document.getElementById('conf-v-end').value; var l = document.getElementById('conf-v-loc').value; 
    if(!s||!l) return alert("Inicio y Destino obligatorios"); 
    var btn = document.getElementById('btn-save-viaje'); btn.textContent = "Guardando... ⏳"; btn.disabled = true;
    ejecutarGuardadoDB('viajes', id, { START: s, END: e||s, UBICACION: l, timestamp: new Date() }, btn, resetViajeForm);
}

function ejecutarGuardadoDB(coleccion, id, obj, btn, resetCallback) {
    var promesa = id ? db.collection(coleccion).doc(id).update(obj) : db.collection(coleccion).add(obj);
    promesa.then(() => { resetCallback(); }).catch(e => { alert("Error: " + e.message); resetCallback(); });
}

function resetJugadorForm() { document.getElementById('edit-player-id').value = ""; document.getElementById('conf-p-name').value = ""; document.getElementById('conf-p-year').value = ""; document.getElementById('conf-p-photo').value = ""; document.getElementById('btn-save-jugador').textContent = "Añadir Jugador"; document.getElementById('btn-save-jugador').disabled = false; }
function resetPartidoForm() { document.getElementById('edit-match-id').value = ""; document.getElementById('conf-m-date').value = ""; document.getElementById('conf-m-rival').value = ""; document.getElementById('conf-m-torneo').value = ""; document.getElementById('conf-m-flag').value = ""; document.getElementById('btn-save-partido').textContent = "Añadir Partido"; document.getElementById('btn-save-partido').disabled = false; }
function resetViajeForm() { document.getElementById('edit-travel-id').value = ""; document.getElementById('conf-v-start').value = ""; document.getElementById('conf-v-end').value = ""; document.getElementById('conf-v-loc').value = ""; document.getElementById('btn-save-viaje').textContent = "Añadir Viaje"; document.getElementById('btn-save-viaje').disabled = false; }
function eliminarDoc(c, i) { if(confirm("¿Eliminar registro permanentemente?")) db.collection(c).doc(i).delete(); }