document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. REFERENCIAS AL DOM ---
    const modal = document.getElementById('modal');
    const btnNuevo = document.getElementById('btnNuevo');
    const btnCancelar = document.getElementById('btnCancelar');
    const form = document.getElementById('formPerfil');
    const tabla = document.getElementById('tablaPerfil');

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
            // Se solicita el módulo "Perfil" tal como está en tu base de datos
            const res = await fetch('/api/permisosPerfil/mis-permisos?modulo=Perfil');
            permisosModulo = await res.json();
            
            // Ocultar botón "Nuevo" si no tiene permiso bitAgregar
            if (!permisosModulo.bitAgregar) {
                btnNuevo.style.display = 'none';
            }
        } catch (error) {
            console.error("Error cargando permisos de Perfil:", error);
        }
    }

    // --- 4. FUNCIONES DEL MODAL ---
    const abrirModal = () => modal.classList.add('activo');
    const cerrarModal = () => modal.classList.remove('activo');

    // --- 5. LÓGICA PRINCIPAL (CARGAR DATOS) ---
    async function cargarPerfil() {
        const buscar = inputBuscar.value.trim();
        const res = await fetch(`/api/perfil?buscar=${buscar}&limit=${limit}&page=${page}`);
        const result = await res.json();

        tabla.innerHTML = '';
        result.data.forEach(p => {
            const tr = document.createElement('tr');
            
            // Renderizado dinámico de botones según bits de permisosModulo
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
                <td>${p.strNombrePerfil}</td>
                <td>${p.bitAdministrador ? '✅ Sí' : '❌ No'}</td>
                <td>${botonesAccion}</td>
            `;

            // Asignar eventos solo si el usuario tiene los permisos correspondientes
            const btnEdit = tr.querySelector('.editar');
            if (btnEdit) {
                btnEdit.onclick = () => {
                    document.getElementById('id').value = p.idPerfil;
                    document.getElementById('strNombrePerfil').value = p.strNombrePerfil;
                    document.getElementById('bitAdministrador').checked = p.bitAdministrador;
                    abrirModal();
                };
            }

            const btnDel = tr.querySelector('.eliminar');
            if (btnDel) {
                btnDel.onclick = async () => {
                    if (!confirm('¿Está seguro de eliminar este perfil?')) return;
                    await fetch(`/api/perfil/${p.idPerfil}`, { method: 'DELETE' });
                    cargarPerfil();
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
    btnNuevo.onclick = () => {
        form.reset();
        document.getElementById('id').value = '';
        abrirModal();
    };

    btnCancelar.onclick = cerrarModal;

    inputBuscar.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => { page = 1; cargarPerfil(); }, 300);
    });

    selectLimit.onchange = () => {
        limit = parseInt(selectLimit.value);
        page = 1;
        cargarPerfil();
    };

    btnFirst.onclick = () => { page = 1; cargarPerfil(); };
    btnPrev.onclick = () => { if (page > 1) page--; cargarPerfil(); };
    btnNext.onclick = () => { if (page < totalPaginas) page++; cargarPerfil(); };
    btnLast.onclick = () => { page = totalPaginas; cargarPerfil(); };

    // Envío del Formulario con validaciones
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('id').value;
        const nombreInput = document.getElementById('strNombrePerfil');
        const nombreValor = nombreInput.value.trim();

        if (nombreValor.length > 50) return alert('❌ El nombre no puede exceder los 50 caracteres.');
        if (!/^[A-Za-zÁ-ú\s]+$/.test(nombreValor)) {
            alert('❌ El nombre solo debe contener letras y espacios.');
            nombreInput.focus();
            return;
        }

        const data = {
            strNombrePerfil: nombreValor,
            bitAdministrador: document.getElementById('bitAdministrador').checked ? 1 : 0
        };

        const url = id ? `/api/perfil/${id}` : '/api/perfil';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.ok) {
                cerrarModal();
                cargarPerfil();
            } else {
                alert('❌ Error al guardar el perfil');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error de conexión');
        }
    });

    // --- 7. INICIALIZACIÓN ---
    await cargarPermisosDeUsuario(); // Esperar a saber qué puede hacer el usuario
    cargarPerfil();                 // Cargar la tabla con la seguridad aplicada
});