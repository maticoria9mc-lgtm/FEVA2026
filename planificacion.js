// ==========================================
// MÓDULO DE PLANIFICACIÓN DE ENTRENAMIENTOS (CONECTADO A FIREBASE)
// ==========================================

window.RAW_PLAN = {}; 
var planEditingDate = null;

function planAbrirModal() {
    document.getElementById('plan-modal-overlay').style.display = 'flex';
    planRenderInterface();
}

function planCerrarModal() {
    document.getElementById('plan-modal-overlay').style.display = 'none';
    planEditingDate = null;
}

function planRenderInterface() {
    var content = document.getElementById('plan-modal-content');
    var html = `
        <div style="padding:20px; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h2 style="margin:0; font-size:1.2rem; color:#0f172a; font-weight:900;">Planificación</h2>
                <div style="color:#64748b; font-size:0.8rem; font-weight:600;">Temas de Entrenamiento</div>
            </div>
            <button onclick="planCerrarModal()" style="background:#e2e8f0; border:none; width:30px; height:30px; border-radius:50%; font-weight:bold; color:#64748b; cursor:pointer;">✕</button>
        </div>
        
        <div style="padding:0; flex-grow:1; overflow-y:auto; max-height:40vh;" id="plan-list-container">
            <!-- La lista se inyecta acá -->
        </div>
        
        <div style="padding:20px; background:#fff; border-top:1px solid #e2e8f0;">
            <h3 style="margin:0 0 10px 0; font-size:0.9rem; font-weight:900; color:#475569; text-transform:uppercase;" id="plan-form-title">Cargar Nueva Sesión</h3>
            <div style="display:flex; gap:10px;">
                <input type="date" id="plan-date" class="plan-input" style="cursor:pointer; flex:1;">
            </div>
            <textarea id="plan-text" class="plan-input" rows="3" maxlength="200" placeholder="Escribí el tema principal del entrenamiento (máx 200 caracteres)..."></textarea>
            <div style="text-align:right; font-size:0.75rem; color:#94a3b8; margin-top:-8px; margin-bottom:12px;" id="plan-char-count">0 / 200</div>
            
            <button onclick="planSave()" class="plan-btn plan-btn-primary" style="width:100%;">☁️ Guardar en la Nube</button>
        </div>
    `;
    content.innerHTML = html;
    
    document.getElementById('plan-text').addEventListener('input', function(e) {
        document.getElementById('plan-char-count').innerText = e.target.value.length + ' / 200';
    });

    planPopulateList();
}

function planPopulateList() {
    var container = document.getElementById('plan-list-container');
    var html = '';
    var dates = Object.keys(window.RAW_PLAN).sort((a,b) => b.localeCompare(a)); 
    
    if(dates.length === 0) {
        html = '<div style="color:#94a3b8; text-align:center; font-size:0.9rem; padding:30px;">No hay planificaciones cargadas en la nube.</div>';
    } else {
        dates.forEach(d => {
            var text = window.RAW_PLAN[d];
            var dt = new Date(d + 'T12:00:00');
            var fDate = dt.toLocaleDateString('es-AR', {day:'numeric', month:'short'});
            
            html += `
                <div class="plan-item">
                    <div style="flex:1; padding-right:15px;">
                        <div style="font-weight:900; color:#3b82f6; font-size:0.85rem; margin-bottom:2px;">🗓️ ${fDate}</div>
                        <div style="color:#475569; font-size:0.9rem; font-weight:600; line-height:1.3; word-wrap:break-word;">${text}</div>
                    </div>
                    <div style="display:flex; gap:6px; flex-shrink:0;">
                        <button onclick="planEdit('${d}')" style="background:#f1f5f9; border:none; padding:8px; border-radius:8px; cursor:pointer; transition:0.2s;" title="Editar">✏️</button>
                        <button onclick="planDelete('${d}')" style="background:#fee2e2; border:none; padding:8px; border-radius:8px; cursor:pointer; transition:0.2s;" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `;
        });
    }
    container.innerHTML = html;
}

function planSave() {
    var d = document.getElementById('plan-date').value;
    var t = document.getElementById('plan-text').value.trim();
    if(!d || !t) { alert("⚠️ Tenés que elegir una fecha y escribir la planificación."); return; }
    
    // GUARDADO REAL EN FIREBASE (Colección "planificacion")
    db.collection("planificacion").doc(d).set({ texto: t })
    .then(() => {
        // Limpiar Formulario visualmente
        document.getElementById('plan-date').value = '';
        document.getElementById('plan-text').value = '';
        document.getElementById('plan-char-count').innerText = '0 / 200';
        document.getElementById('plan-form-title').innerText = 'Cargar Nueva Sesión';
        planEditingDate = null;
    })
    .catch(error => {
        console.error("Error guardando plan:", error);
        alert("Hubo un error al guardar en la nube.");
    });
}

function planEdit(d) {
    document.getElementById('plan-date').value = d;
    document.getElementById('plan-text').value = window.RAW_PLAN[d];
    document.getElementById('plan-char-count').innerText = window.RAW_PLAN[d].length + ' / 200';
    document.getElementById('plan-form-title').innerText = '✏️ Editando Sesión: ' + d;
    planEditingDate = d;
}

function planDelete(d) {
    if(confirm("⚠️ ¿Estás seguro de eliminar la planificación del " + d + "?")) {
        // BORRADO REAL EN FIREBASE
        db.collection("planificacion").doc(d).delete()
        .catch(error => {
            console.error("Error borrando plan:", error);
        });
    }
}