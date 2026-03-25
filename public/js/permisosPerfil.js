document.addEventListener('DOMContentLoaded', () => {

    const perfilSelect = document.getElementById('perfilSelect');
    const tabla = document.getElementById('tablaPermisos');
    const btnGuardar = document.getElementById('btnGuardar');

    let permisos = [];

    /* =======================
       CARGAR PERFILES
    ======================= */
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

    /* =======================
       CARGAR PERMISOS
    ======================= */
    async function cargarPermisos(idPerfil) {
        const res = await fetch(`/api/permisosPerfil/${idPerfil}`);
        permisos = await res.json();

        tabla.innerHTML = '';

        permisos.forEach(p => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${p.strNombreModulo}</td>
                <td><input type="checkbox" ${p.bitAgregar ? 'checked' : ''} data-field="bitAgregar"></td>
                <td><input type="checkbox" ${p.bitEditar ? 'checked' : ''} data-field="bitEditar"></td>
                <td><input type="checkbox" ${p.bitConsulta ? 'checked' : ''} data-field="bitConsulta"></td>
                <td><input type="checkbox" ${p.bitEliminar ? 'checked' : ''} data-field="bitEliminar"></td>
                <td><input type="checkbox" ${p.bitDetalle ? 'checked' : ''} data-field="bitDetalle"></td>
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

    /* =======================
       GUARDAR
    ======================= */
    btnGuardar.addEventListener('click', async () => {

        const idPerfil = perfilSelect.value;
        if (!idPerfil) return alert('Selecciona un perfil');

        const res = await fetch('/api/permisosPerfil', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permisos })
        });

        const result = await res.json();

        if (result.ok) {
            alert('✅ Guardado correctamente');
        } else {
            alert('❌ Error');
        }
    });

    /* =======================
       EVENTO SELECT
    ======================= */
    perfilSelect.addEventListener('change', () => {
        const id = perfilSelect.value;
        if (id) cargarPermisos(id);
    });

    cargarPerfiles();
});