document.addEventListener('DOMContentLoaded', () => {

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

    let page = 1;
    let limit = parseInt(selectLimit.value);
    let totalPaginas = 1;
    let timeout = null;

    /* =======================
       MODAL
    ======================= */
    function abrirModal() {
        modal.classList.add('activo');
    }

    function cerrarModal() {
        modal.classList.remove('activo');
    }

    btnNuevo.addEventListener('click', async () => {
        form.reset();
        document.getElementById('id').value = '';
        await cargarPerfilesSelect();
        abrirModal();
    });

    btnCancelar.addEventListener('click', cerrarModal);

    /* =======================
       CARGAR PERFILES (FK)
    ======================= */
    async function cargarPerfilesSelect(selected = null) {
        const res = await fetch('/api/perfil?limit=100&page=1');
        const result = await res.json();

        const select = document.getElementById('Perfil');
        select.innerHTML = '<option value="">Seleccione perfil</option>';

        result.data.forEach(p => {
            const option = document.createElement('option');
            option.value = p.idPerfil;
            option.textContent = p.strNombrePerfil;

            if (selected && selected == p.idPerfil) {
                option.selected = true;
            }

            select.appendChild(option);
        });
    }

    /* =======================
       CARGAR TABLA
    ======================= */
    async function cargarUsuarios() {
        const buscar = inputBuscar.value.trim();

        const res = await fetch(`/api/usuarios?buscar=${buscar}&limit=${limit}&page=${page}`);
        const result = await res.json();

        tabla.innerHTML = '';

        result.data.forEach(u => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${u.strNombreUsuario}</td>
                <td>${u.NombrePerfil || u.Perfil}</td>
                <td>${u.strCorreo || ''}</td>
                <td>${u.strCelular || ''}</td>
                <td>${u.estadoUsuario ? 'Activo' : 'Inactivo'}</td>
                <td>
                    <button class="editar">✏️</button>
                    <button class="eliminar">🗑</button>
                </td>
            `;

            // EDITAR
            tr.querySelector('.editar').addEventListener('click', async () => {
                document.getElementById('id').value = u.idUsuario;
                document.getElementById('strNombreUsuario').value = u.strNombreUsuario;
                document.getElementById('strPwd').value = u.strPwd;
                document.getElementById('strCorreo').value = u.strCorreo;
                document.getElementById('strCelular').value = u.strCelular;
                document.getElementById('estadoUsuario').value = u.estadoUsuario ? 1 : 0;

                await cargarPerfilesSelect(u.Perfil);

                abrirModal();
            });

            // ELIMINAR
            tr.querySelector('.eliminar').addEventListener('click', async () => {
                if (!confirm('¿Eliminar usuario?')) return;
                await fetch(`/api/usuarios/${u.idUsuario}`, { method: 'DELETE' });
                cargarUsuarios();
            });

            tabla.appendChild(tr);
        });

        totalPaginas = Math.ceil(result.total / limit) || 1;
        spanPagina.textContent = `Página ${page} de ${totalPaginas}`;

        btnFirst.disabled = page <= 1;
        btnPrev.disabled = page <= 1;
        btnNext.disabled = page >= totalPaginas;
        btnLast.disabled = page >= totalPaginas;
    }

    /* =======================
       BUSCAR
    ======================= */
    inputBuscar.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            page = 1;
            cargarUsuarios();
        }, 300);
    });

    /* =======================
       LIMIT
    ======================= */
    selectLimit.addEventListener('change', () => {
        limit = parseInt(selectLimit.value);
        page = 1;
        cargarUsuarios();
    });

    /* =======================
       PAGINACIÓN
    ======================= */
    btnFirst.onclick = () => { page = 1; cargarUsuarios(); };
    btnPrev.onclick = () => { if (page > 1) page--; cargarUsuarios(); };
    btnNext.onclick = () => { if (page < totalPaginas) page++; cargarUsuarios(); };
    btnLast.onclick = () => { page = totalPaginas; cargarUsuarios(); };

    /* =======================
       GUARDAR
    ======================= */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('id').value;

        const data = {
            strNombreUsuario: document.getElementById('strNombreUsuario').value.trim(),
            Perfil: document.getElementById('Perfil').value,
            strPwd: document.getElementById('strPwd').value,
            strCorreo: document.getElementById('strCorreo').value,
            strCelular: document.getElementById('strCelular').value,
            estadoUsuario: document.getElementById('estadoUsuario').value
        };

        if (!data.Perfil) {
            alert('❌ Selecciona un perfil');
            return;
        }

        const url = id ? `/api/usuarios/${id}` : '/api/usuarios';
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
            alert('❌ Error');
        }
    });

    cargarUsuarios();
});