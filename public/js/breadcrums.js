/**
 * Lógica para el Menú de Navegación y Sidebar de Usuario
 */

// 🔥 NORMALIZADOR GLOBAL (CLAVE DEL ÉXITO)
function normalizar(texto) {
    return (texto || "")
        .toLowerCase()
        .replace(/\./g, "_")   // 👈 convierte . → _
        .trim();
}

// --- 🛡️ FUNCIÓN DE FILTRADO DE MENÚ ---
async function cargarPermisosMenu() {
    try {
        const res = await fetch('/api/permisosPerfil/mis-modulos'); 
        if (!res.ok) return;

        const data = await res.json();

        console.log("PERMISOS BACKEND:", data); // 🔥 DEBUG

        // 🔥 Detectar ADMIN correctamente
        const esAdmin = data.some(p => 
            p.bitAdministrador == 1 || 
            p.bitAdministrador === true
        );

        // 🔥 Normalizar módulos (soporta string u objeto)
        const modulosPermitidos = data.map(m => {
            if (typeof m === "string") return normalizar(m);
            return normalizar(m.strNombreModulo);
        });

        console.log("MODULOS NORMALIZADOS:", modulosPermitidos); // 🔥 DEBUG

        // 🔥 Seleccionamos TODOS los items con data-modulo
        const items = document.querySelectorAll(".submenu li");

        items.forEach(li => {
            const moduloHTML = normalizar(li.dataset.modulo);

            if (!moduloHTML) return;

            const tienePermiso = esAdmin || modulosPermitidos.includes(moduloHTML);

            console.log("CHECK:", moduloHTML, tienePermiso); // 🔥 DEBUG

            li.style.display = tienePermiso ? "block" : "none";
        });

        // 🔥 Ocultar menús padres sin hijos visibles
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