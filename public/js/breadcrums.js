/**
 * Lógica para el Menú de Navegación y Sidebar de Usuario
 */

// --- 🛡️ FUNCIÓN DE FILTRADO DE MENÚ ---
async function cargarPermisosMenu() {
    try {
        const res = await fetch('/api/permisosPerfil/mis-modulos'); 
        if (!res.ok) return;

        const data = await res.json(); 

        const modulosPermitidos = data.map(m => m.toLowerCase().trim());

        const links = document.querySelectorAll(".submenu li a");

        links.forEach(link => {
            const modulo = link.dataset.modulo?.toLowerCase().trim();

            const tienePermiso = modulosPermitidos.includes(modulo);

            const li = link.parentElement;

            li.style.display = tienePermiso ? "block" : "none";
        });

        // Ocultar menú padre si no tiene hijos visibles
        document.querySelectorAll(".menu > ul > li").forEach(menu => {
            const submenu = menu.querySelector(".submenu");

            if (!submenu) return;

            const visibles = Array.from(submenu.children)
                .filter(li => li.style.display !== "none");

            if (visibles.length === 0) {
                menu.style.display = "none";
            }
        });

    } catch (err) {
        console.error("Error filtrando menú:", err);
    }
}

// --- FUNCIONES COMPLEMENTARIAS ---
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
            // Corregimos error de columna 'FotoUrl' si el backend no la manda
            const foto = user.strFoto || user.FotoUrl || '/img/default-avatar.png';
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
            
            // Si el enlace es "#", evitamos el salto de página
            if(this.getAttribute("href") === "#") e.preventDefault();
            
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
        if (!e.target.closest(".menu")) {
            document.querySelectorAll(".submenu").forEach(sub => sub.classList.remove("activo"));
        }
        if (sidebar && !sidebar.contains(e.target) && !avatar.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// --- 🚀 INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    inicializarMenu();
    cargarDatosUsuario();
    cargarPermisosMenu(); 
});