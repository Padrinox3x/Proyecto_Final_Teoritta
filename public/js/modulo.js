document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. REFERENCIAS AL DOM ---
    const modal = document.getElementById('modal');
    const form = document.getElementById('formModulo');
    const tabla = document.getElementById('tablaModulo');

    const inputBuscar = document.getElementById('buscar');
    const selectLimit = document.getElementById('limit');

    const btnNuevo = document.getElementById('btnNuevo');
    const btnCancelar = document.getElementById('btnCancelar');

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
            // Se solicita el módulo "Modulo" (o el nombre que tengas en tu DB para este CRUD)
            const res = await fetch('/api/permisosPerfil/mis-permisos?modulo=Modulo');
            permisosModulo = await res.json();
            
            // Ocultar botón "Nuevo" si no tiene permiso bitAgregar
            if (!permisosModulo.bitAgregar) {
                btnNuevo.style.display = 'none';
            }
        } catch (error) {
            console.error("Error cargando permisos de Módulo:", error);
        }
    }

    // --- 4. FUNCIONES DEL MODAL ---
    const abrirModal = () => modal.classList.add('activo');
    const cerrarModal = () => modal.classList.remove('activo');

    // --- 5. LÓGICA PRINCIPAL (CARGAR DATOS) ---
    async function cargarModulo() {
        const buscar = inputBuscar.value.trim();
        const res = await fetch(`/api/modulo?buscar=${buscar}&limit=${limit}&page=${page}`);
        const result = await res.json();

        tabla.innerHTML = '';
        result.data.forEach(m => {
            const tr = document.createElement('tr');
            
            // Renderizado dinámico de botones según bits de permisos
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
                <td>${m.strNombreModulo}</td>
                <td>${botonesAccion}</td>
            `;

            // Evento Editar (solo si tiene bitEditar)
            const btnEdit = tr.querySelector('.editar');
            if (btnEdit) {
                btnEdit.onclick = () => {
                    document.getElementById('id').value = m.idModulo;
                    document.getElementById('strNombreModulo').value = m.strNombreModulo;
                    abrirModal();
                };
            }

            // Evento Eliminar (solo si tiene bitEliminar)
            const btnDel = tr.querySelector('.eliminar');
            if (btnDel) {
                btnDel.onclick = async () => {
                    if (!confirm('¿Eliminar módulo?')) return;
                    await fetch(`/api/modulo/${m.idModulo}`, { method: 'DELETE' });
                    cargarModulo();
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
        timeout = setTimeout(() => { page = 1; cargarModulo(); }, 300);
    });

    selectLimit.onchange = () => {
        limit = parseInt(selectLimit.value);
        page = 1;
        cargarModulo();
    };

    btnFirst.onclick = () => { page = 1; cargarModulo(); };
    btnPrev.onclick = () => { if (page > 1) page--; cargarModulo(); };
    btnNext.onclick = () => { if (page < totalPaginas) page++; cargarModulo(); };
    btnLast.onclick = () => { page = totalPaginas; cargarModulo(); };

    // Envío de Formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('id').value;
        const nombreInput = document.getElementById('strNombreModulo');
        const nombreValor = nombreInput.value.trim();
        const regexLetras = /^[A-Za-zÁ-ú\sñÑ]+$/;
        
        if (nombreValor.length > 50) return alert('❌ El nombre no puede exceder 50 caracteres.');
        if (!regexLetras.test(nombreValor)) {
            alert('❌ El nombre solo debe contener letras.');
            nombreInput.focus();
            return;
        }

        const data = { strNombreModulo: nombreValor };
        const url = id ? `/api/modulo/${id}` : '/api/modulo';
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.ok) {
            cerrarModal();
            cargarModulo();
        } else {
            alert('❌ Error al guardar');
        }
    });

    // --- 7. INICIALIZACIÓN ---
    await cargarPermisosDeUsuario(); 
    cargarModulo();
});