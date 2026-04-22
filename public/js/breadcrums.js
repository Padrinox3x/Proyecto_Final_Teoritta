/**
 * Lógica para el Menú de Navegación y Sidebar de Usuario
 */

// --- 🛡️ FUNCIÓN DE FILTRADO DE MENÚ ---
async function cargarPermisosMenu() {
    try {
        // Consultamos la lista de módulos donde el usuario tiene permiso de CONSULTA
        const res = await fetch('/api/permisosPerfil/mis-modulos'); 
        if (!res.ok) return;

        const modulosPermitidos = await res.json(); 
        // Ejemplo esperado del servidor: ["Usuario", "Modulo", "Perfil", "Principal_2_1"]

        // 1. Buscamos todos los enlaces que están dentro de submenús
        const linksSubmenu = document.querySelectorAll(".submenu li a");

        linksSubmenu.forEach(link => {
            // Obtenemos el nombre del módulo desde el href (ej: "/Principal_2_1" -> "Principal_2_1")
            const nombreModulo = link.getAttribute("href").replace("/", "");
            
            // Verificamos si tiene permiso
            const tienePermiso = modulosPermitidos.includes(nombreModulo);
            
            if (!tienePermiso) {
                link.parentElement.style.display = 'none'; // Oculta el <li>
            } else {
                link.parentElement.style.display = 'block';
            }
        });

        // 2. LÓGICA EXTRA: Ocultar el Padre (Seguridad, Principal 1, etc.) si no hay hijos visibles
        const itemsPrincipales = document.querySelectorAll(".menu > ul > li");

        itemsPrincipales.forEach(itemPrincipal => {
            const submenu = itemPrincipal.querySelector(".submenu");
            if (submenu) {
                // Contamos cuántos enlaces quedaron visibles en este submenú
                const hijosVisibles = Array.from(submenu.querySelectorAll("li"))
                                           .filter(li => li.style.display !== 'none');
                
                // Si no hay hijos, ocultamos toda la sección (ej. ocultar "Seguridad" completo)
                if (hijosVisibles.length === 0) {
                    itemPrincipal.style.display = 'none';
                } else {
                    itemPrincipal.style.display = 'block';
                }
            }
        });

    } catch (err) {
        console.error("Error filtrando el menú por permisos:", err);
    }
}

// --- RESTO DE TUS FUNCIONES (CARGAR DATOS USUARIO E INICIALIZAR) ---
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
    } catch (err) { console.error("Error datos usuario:", err); }
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
        if (closeSidebar) closeSidebar.addEventListener('click', () => sidebar.classList.remove('open'));
    }

    document.addEventListener("click", function(e) {
        if (!e.target.closest(".menu")) document.querySelectorAll(".submenu").forEach(sub => sub.classList.remove("activo"));
        if (sidebar && !sidebar.contains(e.target) && !avatar.contains(e.target)) sidebar.classList.remove('open');
    });
}

// --- 🚀 INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    inicializarMenu();
    cargarDatosUsuario();
    cargarPermisosMenu(); // <--- Filtrado activado
});