/**
 * Lógica para el Menú de Navegación y Sidebar de Usuario
 */

// 🔥 NORMALIZADOR (CLAVE)
function normalizar(texto) {
    return (texto || "")
        .toLowerCase()
        .replace(/\s+/g, "_")
        .trim();
}

// --- 🛡️ FUNCIÓN DE FILTRADO DE MENÚ ---
async function cargarPermisosMenu() {
    try {
        const res = await fetch('/api/menu/mis-menus', {
            credentials: 'include'
        });

        if (!res.ok) return;

        const data = await res.json();

        console.log("🔥 MENUS BACKEND:", data);

        // 🔥 DETECTAR ADMIN (por si lo mandas)
        const esAdmin = data.some(m =>
            m.bitAdministrador == 1 || m.bitAdministrador === true
        );

        // 🔥 NORMALIZAR MENÚS
        const menusPermitidos = data.map(m =>
            normalizar(m.strNombreMenu)
        );

        console.log("🔥 MENUS NORMALIZADOS:", menusPermitidos);

        // 🔥 FILTRAR ITEMS
        document.querySelectorAll(".submenu li").forEach(li => {
            const menuHTML = normalizar(li.dataset.menu);

            if (!menuHTML) return;

            const tienePermiso = esAdmin || menusPermitidos.includes(menuHTML);

            console.log("CHECK:", menuHTML, tienePermiso);

            li.style.display = tienePermiso ? "block" : "none";
        });

        // 🔥 OCULTAR MENÚS PADRE VACÍOS
        document.querySelectorAll(".menu > ul > li").forEach(menu => {
            const submenu = menu.querySelector(".submenu");
            if (!submenu) return;

            const visibles = Array.from(submenu.querySelectorAll("li"))
                .filter(li => li.style.display !== "none");

            menu.style.display = visibles.length > 0 ? "block" : "none";
        });

    } catch (err) {
        console.error("❌ Error filtrando menú:", err);
    }
}

// --- FUNCIONES COMPLEMENTARIAS ---
async function cargarDatosUsuario() {
    try {
        const res = await fetch('/api/usuario/me', {
            credentials: 'include'
        });

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

            const foto = user.strFoto || user.FotoUrl || '/img/default-avatar.png';

            const navAvatar = document.getElementById('avatar-img');
            const sidebarAvatar = document.getElementById('sidebar-avatar-img');

            if (navAvatar) navAvatar.src = foto;
            if (sidebarAvatar) sidebarAvatar.src = foto;
        }

    } catch (err) {
        console.error("❌ Error datos usuario:", err);
    }
}

// --- MENÚ INTERACTIVO ---
function inicializarMenu() {
    const menus = document.querySelectorAll(".menu > ul > li > a");

    menus.forEach(menu => {
        menu.addEventListener("click", function(e) {
            const submenu = this.nextElementSibling;

            if (!submenu || !submenu.classList.contains("submenu")) return;

            if (this.getAttribute("href") === "#") e.preventDefault();

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
            document.querySelectorAll(".submenu").forEach(sub => {
                sub.classList.remove("activo");
            });
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