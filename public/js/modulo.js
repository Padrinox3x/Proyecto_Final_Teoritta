document.addEventListener('DOMContentLoaded', () => {

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

    let page = 1;
    let limit = parseInt(selectLimit.value);
    let totalPaginas = 1;
    let timeout = null;

    function abrirModal() {
        modal.classList.add('activo');
    }

    function cerrarModal() {
        modal.classList.remove('activo');
    }

    btnNuevo.onclick = () => {
        form.reset();
        document.getElementById('id').value = '';
        abrirModal();
    };

    btnCancelar.onclick = cerrarModal;

    async function cargarModulo() {
        const buscar = inputBuscar.value.trim();

        const res = await fetch(`/api/modulo?buscar=${buscar}&limit=${limit}&page=${page}`);
        const result = await res.json();

        tabla.innerHTML = '';

        result.data.forEach(m => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${m.strNombreModulo}</td>
                <td>
                    <button class="editar btn-edit">✏️</button>
                    <button class="eliminar btn-delete">🗑</button>
                </td>
            `;

            tr.querySelector('.editar').onclick = () => {
                document.getElementById('id').value = m.idModulo;
                document.getElementById('strNombreModulo').value = m.strNombreModulo;
                abrirModal();
            };

            tr.querySelector('.eliminar').onclick = async () => {
                if (!confirm('¿Eliminar módulo?')) return;
                await fetch(`/api/modulo/${m.idModulo}`, { method: 'DELETE' });
                cargarModulo();
            };

            tabla.appendChild(tr);
        });

        totalPaginas = Math.ceil(result.total / limit) || 1;
        spanPagina.textContent = `Página ${page} de ${totalPaginas}`;

        // Desactivar botones si no hay más páginas
        btnFirst.disabled = page <= 1;
        btnPrev.disabled = page <= 1;
        btnNext.disabled = page >= totalPaginas;
        btnLast.disabled = page >= totalPaginas;
    }

    inputBuscar.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            page = 1;
            cargarModulo();
        }, 300);
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

    /* 🛡 VALIDACIÓN Y ENVÍO */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('id').value;
        const nombreInput = document.getElementById('strNombreModulo');
        const nombreValor = nombreInput.value.trim();

        // VALIDACIÓN: Solo letras y espacios, máximo 50
        const regexLetras = /^[A-Za-zÁ-ú\sñÑ]+$/;
        
        if (nombreValor.length > 50) {
            alert('❌ El nombre no puede tener más de 50 caracteres.');
            return;
        }

        if (!regexLetras.test(nombreValor)) {
            alert('❌ El nombre solo debe contener letras.');
            nombreInput.focus();
            return;
        }

        const data = {
            strNombreModulo: nombreValor
        };

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
            alert('❌ Error al guardar el módulo');
        }
    });

    cargarModulo();
});