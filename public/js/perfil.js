document.addEventListener('DOMContentLoaded', () => {

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

    async function cargarPerfil() {
        const buscar = inputBuscar.value.trim();

        const res = await fetch(`/api/perfil?buscar=${buscar}&limit=${limit}&page=${page}`);
        const result = await res.json();

        tabla.innerHTML = '';

        result.data.forEach(p => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${p.strNombrePerfil}</td>
                <td>${p.bitAdministrador ? '✅ Sí' : '❌ No'}</td>
                <td>
                    <button class="editar btn-edit">✏️</button>
                    <button class="eliminar btn-delete">🗑</button>
                </td>
            `;

            tr.querySelector('.editar').onclick = () => {
                document.getElementById('id').value = p.idPerfil;
                document.getElementById('strNombrePerfil').value = p.strNombrePerfil;
                document.getElementById('bitAdministrador').checked = p.bitAdministrador;
                abrirModal();
            };

            tr.querySelector('.eliminar').onclick = async () => {
                if (!confirm('¿Está seguro de eliminar este perfil?')) return;
                await fetch(`/api/perfil/${p.idPerfil}`, { method: 'DELETE' });
                cargarPerfil();
            };

            tabla.appendChild(tr);
        });

        totalPaginas = Math.ceil(result.total / limit) || 1;
        spanPagina.textContent = `Página ${page} de ${totalPaginas}`;

        btnFirst.disabled = page <= 1;
        btnPrev.disabled = page <= 1;
        btnNext.disabled = page >= totalPaginas;
        btnLast.disabled = page >= totalPaginas;
    }

    inputBuscar.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            page = 1;
            cargarPerfil();
        }, 300);
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

    /* 🛡 VALIDACIÓN Y ENVÍO */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('id').value;
        const nombreInput = document.getElementById('strNombrePerfil');
        const nombreValor = nombreInput.value.trim();

        // 1. Validación de longitud
        if (nombreValor.length > 50) {
            alert('❌ El nombre no puede exceder los 50 caracteres.');
            return;
        }

        // 2. Validación de formato (Solo letras y espacios)
        const regexLetras = /^[A-Za-zÁ-ú\s]+$/;
        if (!regexLetras.test(nombreValor)) {
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
            alert('❌ Error de conexión con el servidor');
        }
    });

    cargarPerfil();
});