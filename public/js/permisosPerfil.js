document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. REFERENCIAS AL DOM ---
    const perfilSelect = document.getElementById('perfilSelect');
    const tabla = document.getElementById('tablaPermisos');
    const btnGuardar = document.getElementById('btnGuardar');

    // --- 2. ESTADO GLOBAL ---
    let permisos = [];
    let permisosModuloSeguridad = {
        bitAgregar: 0, bitEditar: 0, bitConsulta: 0, bitEliminar: 0, bitDetalle: 0,
        bitAdministrador: 0 // Añadimos el bit de admin global
    };

    // --- 3. FUNCIONES DE PERMISOS DEL SISTEMA ---
    async function cargarPermisosDeUsuario() {
        try {
            // Asegúrate que el nombre 'Permisos' coincida con el INSERT que hiciste en la tabla Modulo
            const res = await fetch('/api/permisosPerfil/mis-permisos?modulo=Permisos');
            const data = await res.json();
            
            // Asignamos los datos recibidos
            permisosModuloSeguridad = data;
            
            console.log("Mis permisos actuales:", permisosModuloSeguridad);

            // LOGICA DE DESBLOQUEO:
            // Si tiene bitEditar O es Administrador global, puede ver el botón de guardar
            if (permisosModuloSeguridad.bitEditar || permisosModuloSeguridad.bitAdministrador) {
                btnGuardar.style.display = 'block';
            } else {
                btnGuardar.style.display = 'none';
            }
        } catch (error) {
            console.error("Error cargando permisos de Seguridad:", error);
        }
    }

    async function cargarPerfiles() {
        const res = await fetch('/api/perfil?limit=100&page=1');
        const result = await res.json();
        perfilSelect.innerHTML = '<option value="">Seleccione perfil</option>';
        result.data.forEach(p => {
            const option = document.createElement('option');
            option.value = p.idPerfil;
            option.textContent = p.strNombrePerfil;
            perfilSelect.appendChild(option);
        });
    }

    async function cargarPermisos(idPerfil) {
        const res = await fetch(`/api/permisosPerfil/${idPerfil}`);
        permisos = await res.json();

        tabla.innerHTML = '';

        permisos.forEach(p => {
            const tr = document.createElement('tr');

            // --- 🛡️ CORRECCIÓN CRÍTICA AQUÍ ---
            // Si permisosModuloSeguridad.bitEditar es 1 O bitAdministrador es 1, isDisabled será vacío (habilitado)
            const canEdit = (permisosModuloSeguridad.bitEditar || permisosModuloSeguridad.bitAdministrador);
            const isDisabled = !canEdit ? 'disabled' : '';

            tr.innerHTML = `
                <td><strong>${p.strNombreModulo}</strong></td>
                <td><input type="checkbox" ${p.bitAgregar ? 'checked' : ''} data-field="bitAgregar" ${isDisabled}></td>
                <td><input type="checkbox" ${p.bitEditar ? 'checked' : ''} data-field="bitEditar" ${isDisabled}></td>
                <td><input type="checkbox" ${p.bitConsulta ? 'checked' : ''} data-field="bitConsulta" ${isDisabled}></td>
                <td><input type="checkbox" ${p.bitEliminar ? 'checked' : ''} data-field="bitEliminar" ${isDisabled}></td>
                <td><input type="checkbox" ${p.bitDetalle ? 'checked' : ''} data-field="bitDetalle" ${isDisabled}></td>
            `;

            const checks = tr.querySelectorAll('input');
            checks.forEach(chk => {
                chk.addEventListener('change', () => {
                    p[chk.dataset.field] = chk.checked ? 1 : 0;
                });
            });

            tabla.appendChild(tr);
        });
    }

    btnGuardar.addEventListener('click', async () => {
    const idPerfil = perfilSelect.value;
    if (!idPerfil) return alert('Selecciona un perfil primero');
    if (!confirm('¿Desea actualizar los privilegios para este perfil?')) return;

    try {
        const res = await fetch('/api/permisosPerfil', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Perfil: parseInt(idPerfil),
                permisos: permisos
            })
        });
        const result = await res.json();
        if (result.ok) {
            alert('✅ Matriz de permisos actualizada');
            cargarPermisos(idPerfil);
            
            // 🆕 DISPARAR EVENTO GLOBAL
            window.dispatchEvent(new CustomEvent('permisosActualizados', {
                detail: { 
                    idPerfil: parseInt(idPerfil),
                    timestamp: Date.now()
                }
            }));
            
        } else {
            alert('❌ Error: ' + (result.error || 'Desconocido'));
        }
    } catch (error) {
        alert('❌ Error de conexión');
    }
});
    // --- INICIALIZACIÓN ---
    await cargarPermisosDeUsuario(); 
    cargarPerfiles();
});