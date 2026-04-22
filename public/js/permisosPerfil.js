document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. REFERENCIAS AL DOM ---
    const perfilSelect = document.getElementById('perfilSelect');
    const tabla = document.getElementById('tablaPermisos');
    const btnGuardar = document.getElementById('btnGuardar');

    // --- 2. ESTADO GLOBAL ---
    let permisos = [];
    let permisosModuloSeguridad = {
        bitAgregar: 0, bitEditar: 0, bitConsulta: 0, bitEliminar: 0, bitDetalle: 0
    };

    // --- 3. FUNCIONES DE PERMISOS DEL SISTEMA ---
    async function cargarPermisosDeUsuario() {
        try {
            // Suponiendo que este módulo se llama "Seguridad" en tu tabla Modulo
            const res = await fetch('/api/permisosPerfil/mis-permisos?modulo=Permisos');
            permisosModuloSeguridad = await res.json();
            
            // Si no tiene permiso de editar/agregar, bloqueamos el botón de guardar global
            if (!permisosModuloSeguridad.bitEditar && !permisosModuloSeguridad.bitAgregar) {
                btnGuardar.style.display = 'none';
            }
        } catch (error) {
            console.error("Error cargando permisos de Seguridad:", error);
        }
    }

    /* ============================================================
       CARGAR PERFILES (Para el dropdown)
    ============================================================ */
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

    /* ============================================================
       CARGAR MATRIZ DE PERMISOS (Para el perfil seleccionado)
    ============================================================ */
    async function cargarPermisos(idPerfil) {
        const res = await fetch(`/api/permisosPerfil/${idPerfil}`);
        permisos = await res.json();

        tabla.innerHTML = '';

        permisos.forEach(p => {
            const tr = document.createElement('tr');

            // Los checkboxes se deshabilitan si el usuario actual no tiene permiso de editar la seguridad
            const isDisabled = (!permisosModuloSeguridad.bitEditar) ? 'disabled' : '';

            tr.innerHTML = `
                <td><strong>${p.strNombreModulo}</strong></td>
                <td><input type="checkbox" ${p.bitAgregar ? 'checked' : ''} data-field="bitAgregar" ${isDisabled}></td>
                <td><input type="checkbox" ${p.bitEditar ? 'checked' : ''} data-field="bitEditar" ${isDisabled}></td>
                <td><input type="checkbox" ${p.bitConsulta ? 'checked' : ''} data-field="bitConsulta" ${isDisabled}></td>
                <td><input type="checkbox" ${p.bitEliminar ? 'checked' : ''} data-field="bitEliminar" ${isDisabled}></td>
                <td><input type="checkbox" ${p.bitDetalle ? 'checked' : ''} data-field="bitDetalle" ${isDisabled}></td>
            `;

            // Escuchar cambios en los checkboxes para actualizar el array 'permisos'
            const checks = tr.querySelectorAll('input');
            checks.forEach(chk => {
                chk.addEventListener('change', () => {
                    p[chk.dataset.field] = chk.checked ? 1 : 0;
                });
            });

            tabla.appendChild(tr);
        });
    }

    /* ============================================================
       GUARDAR CAMBIOS EN LA MATRIZ
    ============================================================ */
    btnGuardar.addEventListener('click', async () => {
        const idPerfil = perfilSelect.value;
        if (!idPerfil) return alert('Selecciona un perfil primero');

        // Confirmación extra por ser una acción crítica
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
                alert('✅ Matriz de permisos actualizada correctamente');
                // Opcional: Recargar para asegurar sincronía
                cargarPermisos(idPerfil);
            } else {
                alert('❌ Error al guardar: ' + (result.error || 'Desconocido'));
            }
        } catch (error) {
            console.error('Error al guardar permisos:', error);
            alert('❌ Error de conexión con el servidor');
        }
    });

    /* ============================================================
       EVENTOS
    ============================================================ */
    perfilSelect.addEventListener('change', () => {
        const id = perfilSelect.value;
        if (id) {
            cargarPermisos(id);
        } else {
            tabla.innerHTML = '';
        }
    });

    // --- INICIALIZACIÓN ---
    await cargarPermisosDeUsuario(); // Primero saber quién es el usuario actual
    cargarPerfiles();                // Luego cargar la lista de perfiles
});