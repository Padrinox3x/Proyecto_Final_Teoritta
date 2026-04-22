/**
 * Lógica para el Menú de Navegación y Sidebar de Usuario
 */
async function cargarDatosUsuario() {
    try {
        const res = await fetch('/api/usuario/me');
        if (!res.ok) throw new Error("No se pudo obtener la sesión");
        
        const user = await res.json();

        if (user) {
            // 1. Actualizar Textos en el Sidebar
            // Usamos querySelector para buscar por los labels de tu perfil
            const infoPs = document.querySelectorAll('.profile-info p span');
            if (infoPs.length >= 4) {
                infoPs[0].innerText = user.strNombreUsuario || '---';
                infoPs[1].innerText = user.PerfilNombre || 'Usuario';
                infoPs[2].innerText = user.strCorreo || '---';
                infoPs[3].innerText = user.strCelular || 'No registrado';
            }

            // 2. Actualizar Imágenes (Círculo Nav y Sidebar)
            const foto = user.FotoUrl || '/img/default-avatar.png';
            const navAvatar = document.getElementById('avatar-img');
            const sidebarAvatar = document.getElementById('sidebar-avatar-img');

            if (navAvatar) navAvatar.src = foto;
            if (sidebarAvatar) sidebarAvatar.src = foto;
        }
    } catch (err) {
        console.error("Error cargando datos del usuario:", err);
    }
}

function inicializarMenu() {
    // --- 1. LÓGICA DE SUBMENÚS ---
    const menus = document.querySelectorAll(".menu > ul > li > a");

    menus.forEach(menu => {
        menu.addEventListener("click", function(e) {
            const submenu = this.nextElementSibling;
            if (!submenu || !submenu.classList.contains("submenu")) return;

            e.preventDefault();
            document.querySelectorAll(".submenu").forEach(sub => {
                if (sub !== submenu) sub.classList.remove("activo");
            });
            submenu.classList.toggle("activo");
        });
    });

    // --- 2. LÓGICA DEL SIDEBAR ---
    const avatar = document.getElementById('user-avatar');
    const sidebar = document.getElementById('user-sidebar');
    const closeSidebar = document.getElementById('close-sidebar');

    if (avatar && sidebar) {
        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.add('open');
            cargarDatosUsuario(); // Refrescar datos al abrir
        });

        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                sidebar.classList.remove('open');
            });
        }
    }

    // Cerrar al hacer clic fuera
    document.addEventListener("click", function(e) {
        if (!e.target.closest(".menu")) {
            document.querySelectorAll(".submenu").forEach(sub => sub.classList.remove("activo"));
        }
        if (sidebar && !sidebar.contains(e.target) && !avatar.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    // --- 3. SUBIDA DE IMAGEN AL BACKEND ---
    const btnUpload = document.getElementById('btn-upload');
    const imageInput = document.getElementById('image-input');

    if (btnUpload && imageInput) {
        btnUpload.addEventListener('click', async () => {
            const file = imageInput.files[0];
            if (!file) return alert("Por favor, selecciona una imagen primero.");

            const formData = new FormData();
            formData.append('imagen', file); // 'imagen' debe coincidir con upload.single('imagen')

            btnUpload.innerText = "Subiendo...";
            btnUpload.disabled = true;

            try {
                const res = await fetch('/api/usuario/upload-avatar', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();

                if (data.success) {
                    alert("¡Imagen actualizada!");
                    await cargarDatosUsuario(); // Refrescar fotos y datos
                    imageInput.value = ""; // Limpiar el input
                } else {
                    alert("Error: " + (data.error || "No se pudo subir"));
                }
            } catch (err) {
                console.error("Error al subir:", err);
                alert("Error de conexión al subir la imagen.");
            } finally {
                btnUpload.innerText = "Actualizar Foto";
                btnUpload.disabled = false;
            }
        });
    }
}

// Inicializar y cargar datos iniciales
document.addEventListener("DOMContentLoaded", () => {
    inicializarMenu();
    cargarDatosUsuario(); // Carga la foto pequeña del nav al iniciar
});