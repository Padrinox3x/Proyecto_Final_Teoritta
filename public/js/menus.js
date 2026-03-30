document.addEventListener('DOMContentLoaded', () => {

    const modal = document.getElementById('modal');
    const btnNuevo = document.getElementById('btnNuevo');
    const btnCancelar = document.getElementById('btnCancelar');
    const form = document.getElementById('formMenu');
    const tabla = document.getElementById('tablaMenu');

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
        await cargarModulosSelect(); // 🔥 importante
        abrirModal();
    });

    btnCancelar.addEventListener('click', cerrarModal);

    /* =======================
       CARGAR MODULOS (FK)
    ======================= */
    async function cargarModulosSelect(selected = null) {
        const res = await fetch('/api/modulo?limit=100&page=1');
        const result = await res.json();

        const select = document.getElementById('Modulo');
        select.innerHTML = '<option value="">Seleccione módulo</option>';

        result.data.forEach(m => {
            const option = document.createElement('option');
            option.value = m.idModulo;
            option.textContent = m.strNombreModulo;

            if (selected && selected == m.idModulo) {
                option.selected = true;
            }

            select.appendChild(option);
        });
    }

    /* =======================
       CARGAR TABLA
    ======================= */
    async function cargarMenu() {
        const buscar = inputBuscar.value.trim();

        const res = await fetch(`/api/menu?buscar=${buscar}&limit=${limit}&page=${page}`);
        const result = await res.json();

        tabla.innerHTML = '';

        result.data.forEach(m => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${m.strNombreMenu}</td>
                <td>${m.NombreModulo || m.Modulo}</td>
                <td>
                    <button class="editar">✏️</button>
                    <button class="eliminar">🗑</button>
                </td>
            `;

            // ✏️ EDITAR
            tr.querySelector('.editar').addEventListener('click', async () => {
                document.getElementById('id').value = m.idMenu;
                document.getElementById('strNombreMenu').value = m.strNombreMenu;

                await cargarModulosSelect(m.Modulo); // 🔥 selecciona el correcto

                abrirModal();
            });

            // 🗑 ELIMINAR
            tr.querySelector('.eliminar').addEventListener('click', async () => {
                if (!confirm('¿Eliminar menú?')) return;
                await fetch(`/api/menu/${m.idMenu}`, { method: 'DELETE' });
                cargarMenu();
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
            cargarMenu();
        }, 300);
    });

    /* =======================
       LIMIT
    ======================= */
    selectLimit.addEventListener('change', () => {
        limit = parseInt(selectLimit.value);
        page = 1;
        cargarMenu();
    });

    /* =======================
       PAGINACIÓN
    ======================= */
    btnFirst.onclick = () => { page = 1; cargarMenu(); };
    btnPrev.onclick = () => { if (page > 1) page--; cargarMenu(); };
    btnNext.onclick = () => { if (page < totalPaginas) page++; cargarMenu(); };
    btnLast.onclick = () => { page = totalPaginas; cargarMenu(); };

    /* =======================
       GUARDAR
    ======================= */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('id').value;

        const data = {
            strNombreMenu: document.getElementById('strNombreMenu').value.trim(),
            Modulo: document.getElementById('Modulo').value
        };

        if (!data.Modulo) {
            alert('❌ Selecciona un módulo');
            return;
        }

        const url = id ? `/api/menu/${id}` : '/api/menu';
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (result.ok) {
            cerrarModal();
            cargarMenu();
        } else {
            alert('❌ Error');
        }
    });

    /* =======================
       INIT
    ======================= */
    cargarMenu();
});