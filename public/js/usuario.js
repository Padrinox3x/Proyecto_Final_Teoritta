document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. REFERENCIAS AL DOM ---
    const modal = document.getElementById('modal');
    const btnNuevo = document.getElementById('btnNuevo');
    const btnCancelar = document.getElementById('btnCancelar');
    const form = document.getElementById('formUsuario');
    const tabla = document.getElementById('tablaUsuarios');

    const inputBuscar = document.getElementById('buscar');
    const selectLimit = document.getElementById('limit');

    const btnFirst = document.getElementById('first');
    const btnPrev = document.getElementById('prev');
    const btnNext = document.getElementById('next');
    const btnLast = document.getElementById('last');
    const spanPagina = document.getElementById('pagina');

    // --- 2. ESTADO GLOBAL ---
    let page = 1;
    let limit = parseInt(selectLimit.value);
    let totalPaginas = 1;
    let timeout = null;
    let permisosModulo = {
        bitAgregar: 0, bitEditar: 0, bitConsulta: 0, bitEliminar: 0, bitDetalle: 0
    };

    // --- 3. FUNCIONES DE PERMISOS ---
    async function cargarPermisosDeUsuario() {
        try {
            const res = await fetch('/api/mis-permisos?modulo=Usuario');
            permisosModulo = await res.json();
            
            // Ocultar botón "Nuevo" si no tiene permiso bitAgregar
            if (!permisosModulo.bitAgregar) {
                btnNuevo.style.display = 'none';
            }
        } catch (error) {
            console.error("Error cargando permisos:", error);
        }
    }

    // --- 4. FUNCIONES DEL MODAL Y AUXILIARES ---
    const abrirModal = () => modal.classList.add('activo');
    const cerrarModal = () => modal.classList.remove('activo');

    async function cargarPerfilesSelect(selected = null) {
        const res = await fetch('/api/perfil?limit=100&page=1');
        const result = await res.json();
        const select = document.getElementById('Perfil');
        select.innerHTML = '<option value="">Seleccione perfil</option>';

        result.data.forEach(p => {
            const option = document.createElement('option');
            option.value = p.idPerfil;
            option.textContent = p.strNombrePerfil;
            if (selected && selected == p.idPerfil) option.selected = true;
            select.appendChild(option);
        });
    }

    // --- 5. LÓGICA PRINCIPAL (CARGAR DATOS) ---
    async function cargarUsuarios() {
        const buscar = inputBuscar.value.trim();
        const res = await fetch(`/api/usuario?buscar=${buscar}&limit=${limit}&page=${page}`);
        const result = await res.json();

        tabla.innerHTML = '';
        result.data.forEach(u => {
            const tr = document.createElement('tr');
            
            // Renderizado dinámico de botones según bits
            let botonesAccion = '';
            if (permisosModulo.bitEditar) {
                botonesAccion += `<button class="editar btn-edit">✏️</button>`;
            }
            if (permisosModulo.bitEliminar) {
                botonesAccion += `<button class="eliminar btn-delete">🗑</button>`;
            }
            if (!permisosModulo.bitEditar && !permisosModulo.bitEliminar) {
                botonesAccion = '<span style="color:gray; font-size:12px;">Sin permisos</span>';
            }

            tr.innerHTML = `
                <td>${u.strNombreUsuario}</td>
                <td>${u.NombrePerfil || ''}</td>
                <td>${u.strCorreo || ''}</td>
                <td>${u.strCelular || ''}</td>
                <td>${u.estadoUsuario ? '✅ Activo' : '❌ Inactivo'}</td>
                <td>${botonesAccion}</td>
            `;

            // Asignar eventos solo si los botones existen en el DOM de la fila
            const btnEdit = tr.querySelector('.editar');
            if (btnEdit) {
                btnEdit.onclick = async () => {
                    document.getElementById('id').value = u.idUsuario;
                    document.getElementById('strNombreUsuario').value = u.strNombreUsuario;
                    document.getElementById('strPwd').value = u.strPwd || '';
                    document.getElementById('strCorreo').value = u.strCorreo || '';
                    document.getElementById('strCelular').value = u.strCelular || '';
                    document.getElementById('estadoUsuario').value = u.estadoUsuario ? 1 : 0;
                    await cargarPerfilesSelect(u.Perfil);
                    abrirModal();
                };
            }

            const btnDel = tr.querySelector('.eliminar');
            if (btnDel) {
                btnDel.onclick = async () => {
                    if (!confirm('¿Eliminar usuario?')) return;
                    await fetch(`/api/usuario/${u.idUsuario}`, { method: 'DELETE' });
                    cargarUsuarios();
                };
            }
            
            tabla.appendChild(tr);
        });

        // Paginación
        totalPaginas = Math.ceil(result.total / limit) || 1;
        spanPagina.textContent = `Página ${page} de ${totalPaginas}`;
        btnFirst.disabled = page <= 1;
        btnPrev.disabled = page <= 1;
        btnNext.disabled = page >= totalPaginas;
        btnLast.disabled = page >= totalPaginas;
    }

    // --- 6. EVENT LISTENERS ---
    btnNuevo.addEventListener('click', async () => {
        form.reset();
        document.getElementById('id').value = '';
        await cargarPerfilesSelect();
        abrirModal();
    });

    btnCancelar.addEventListener('click', cerrarModal);

    inputBuscar.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => { page = 1; cargarUsuarios(); }, 300);
    });

    selectLimit.addEventListener('change', () => {
        limit = parseInt(selectLimit.value);
        page = 1;
        cargarUsuarios();
    });

    btnFirst.onclick = () => { page = 1; cargarUsuarios(); };
    btnPrev.onclick = () => { if (page > 1) page--; cargarUsuarios(); };
    btnNext.onclick = () => { if (page < totalPaginas) page++; cargarUsuarios(); };
    btnLast.onclick = () => { page = totalPaginas; cargarUsuarios(); };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('id').value;
        const nombre = document.getElementById('strNombreUsuario').value.trim();
        const perfil = document.getElementById('Perfil').value;
        const correo = document.getElementById('strCorreo').value.trim();

        // Validaciones básicas
        if (!/^[A-Za-zÁ-ú\sñÑ]+$/.test(nombre)) return alert('❌ El nombre solo permite letras.');
        if (!perfil) return alert('❌ Selecciona un perfil.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return alert('❌ Correo inválido.');

        const data = {
            strNombreUsuario: nombre,
            Perfil: parseInt(perfil),
            strPwd: document.getElementById('strPwd').value,
            strCorreo: correo,
            strCelular: document.getElementById('strCelular').value,
            estadoUsuario: parseInt(document.getElementById('estadoUsuario').value)
        };

        const url = id ? `/api/usuario/${id}` : '/api/usuario';
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.ok) {
            cerrarModal();
            cargarUsuarios();
        } else {
            alert('❌ Error al guardar');
        }
    });

    // --- 7. INICIALIZACIÓN ---
    await cargarPermisosDeUsuario(); // Primero saber qué puede hacer el usuario
    cargarUsuarios();               // Luego cargar la lista con esos permisos aplicados
});