/**
 * Lógica para el Menú de Navegación y Sidebar de Usuario
 */

// --- 🛡️ FUNCIÓN NUEVA: FILTRAR MENÚ POR PERMISOS ---
async function cargarPermisosMenu() {
    try {
        // Consultamos un endpoint que nos devuelva la lista de módulos permitidos
        // Si no tienes este endpoint, deberás crearlo en tu backend
        const res = await fetch('/api/permisosPerfil/mis-modulos'); 
        if (!res.ok) return;

        const modulosPermitidos = await res.json(); 
        // Ejemplo esperado: ["Usuario", "Principal_2.1"]

        // Buscamos todos los enlaces del menú
        const itemsMenu = document.querySelectorAll(".menu ul li a, .submenu li a");

        itemsMenu.forEach(item => {
            const textoEnlace = item.innerText.trim();
            
            // Si es un enlace de módulo (y no un disparador de submenú como "Seguridad")
            // Verificamos si el nombre del módulo está en la lista de permitidos
            const esModulo = textoEnlace.includes("Principal") || textoEnlace === "Usuario" || textoEnlace === "Perfil";
            
            if (esModulo) {
                const tienePermiso = modulosPermitidos.includes(textoEnlace);
                // Ocultamos el <li> completo que contiene el enlace si no tiene permiso
                if (!tienePermiso) {
                    item.parentElement.style.display = 'none';
                } else {
                    item.parentElement.style.display = 'block';
                }
            }
        });

    } catch (err) {
        console.error("Error filtrando el menú por permisos:", err);
    }
}

async function cargarDatosUsuario() {
    try {
        const res = await fetch('/api/usuario/me');
        if (!res.ok) throw new Error("No se pudo obtener la sesión");
        
        const user = await res.json();

        if (user) {
            const infoPs = document.querySelectorAll('.profile-info p span');
            if (infoPs.length >= 4) {
                infoPs[0].innerText = user.strNombreUsuario || '---';
                infoPs[1].innerText = user.PerfilNombre || 'Usuario';
                infoPs[2].innerText = user.strCorreo || '---';
                infoPs[3].innerText = user.strCelular || 'No registrado';
            }

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

    const avatar = document.getElementById('user-avatar');
    const sidebar = document.getElementById('user-sidebar');
    const closeSidebar = document.getElementById('close-sidebar');

    if (avatar && sidebar) {
        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.add('open');
            cargarDatosUsuario(); 
        });

        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                sidebar.classList.remove('open');
            });
        }
    }

    document.addEventListener("click", function(e) {
        if (!e.target.closest(".menu")) {
            document.querySelectorAll(".submenu").forEach(sub => sub.classList.remove("activo"));
        }
        if (sidebar && !sidebar.contains(e.target) && !avatar.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    const btnUpload = document.getElementById('btn-upload');
    const imageInput = document.getElementById('image-input');

    if (btnUpload && imageInput) {
        btnUpload.addEventListener('click', async () => {
            const file = imageInput.files[0];
            if (!file) return alert("Por favor, selecciona una imagen primero.");

            const formData = new FormData();
            formData.append('imagen', file);

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
                    await cargarDatosUsuario();
                    imageInput.value = "";
                } else {
                    alert("Error: " + (data.error || "No se pudo subir"));
                }
            } catch (err) {
                console.error("Error al subir:", err);
            } finally {
                btnUpload.innerText = "Actualizar Foto";
                btnUpload.disabled = false;
            }
        });
    }
}

// --- 🚀 INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    inicializarMenu();
    cargarDatosUsuario();
    cargarPermisosMenu(); // Llamamos a la nueva función de filtrado
});