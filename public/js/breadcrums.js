// ==========================================
// 1. MANEJO DE SUBMENÚS (NAVEGACIÓN)
// ==========================================
function activarMenu() {
    const menus = document.querySelectorAll(".menu > ul > li > a");
    menus.forEach(menu => {
        menu.addEventListener("click", function(e){
            const submenu = this.nextElementSibling;
            if(!submenu) return; 
            e.preventDefault();
            document.querySelectorAll(".submenu").forEach(sub => {
                if(sub !== submenu) sub.classList.remove("activo");
            });
            submenu.classList.toggle("activo");
        });
    });
}

// ==========================================
// 2. MENÚ LATERAL DEL USUARIO (DRAWER)
// ==========================================
function toggleUserMenu() {
    const drawer = document.getElementById("userDrawer");
    if(drawer) drawer.classList.toggle("open");
}

// Cierra menús si haces click fuera de ellos
document.addEventListener("click", function(e){
    // Cerrar submenús navegación
    if(!e.target.closest(".menu")){
        document.querySelectorAll(".submenu").forEach(sub => {
            sub.classList.remove("activo");
        });
    }
    // Cerrar drawer de usuario si clickeas fuera (opcional)
    const drawer = document.getElementById("userDrawer");
    if (drawer && drawer.classList.contains("open") && 
        !e.target.closest("#userDrawer") && !e.target.closest(".user-circle")) {
        drawer.classList.remove("open");
    }
});

// ==========================================
// 3. VALIDACIÓN Y SUBIDA DE AVATAR (SERVER-SIDE)
// ==========================================
const formatosPermitidos = ['image/png', 'image/jpeg', 'image/jpg'];

async function uploadToCloudinary(input) {
    const archivo = input.files[0];
    const previewImg = document.getElementById("previewImg");
    const userAvatar = document.getElementById("userAvatar");

    if (!archivo) return;

    // VALIDACIÓN DE FORMATO (Como en tu código del carrusel)
    if (!formatosPermitidos.includes(archivo.type)) {
        alert('❌ Solo se permiten imágenes PNG o JPG');
        input.value = ''; // Limpia el input
        return;
    }

    // PREPARAR ENVÍO AL BACKEND (app.js)
    const formData = new FormData();
    formData.append("imagen", archivo); // 'imagen' debe coincidir con upload.single('imagen')

    try {
        if(previewImg) previewImg.style.opacity = "0.5";

        const res = await fetch('/usuario/upload-avatar', {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (data.url) {
            // Actualizar imágenes en tiempo real
            if(previewImg) previewImg.src = data.url;
            if(userAvatar) userAvatar.src = data.url;
            
            // Persistencia en caché local
            localStorage.setItem("user_avatar_url", data.url);
            alert("¡Foto de perfil actualizada!");
        } else {
            throw new Error(data.error || "Error desconocido");
        }
    } catch (err) {
        console.error("🔥 Error al subir:", err);
        alert("Error al procesar la imagen en el servidor.");
    } finally {
        if(previewImg) previewImg.style.opacity = "1";
    }
}

// ==========================================
// 4. CARGA INICIAL Y LOGOUT
// ==========================================
function loadUserConfig() {
    const cachedAvatar = localStorage.getItem("user_avatar_url");
    if (cachedAvatar) {
        if(document.getElementById("userAvatar")) document.getElementById("userAvatar").src = cachedAvatar;
        if(document.getElementById("previewImg")) document.getElementById("previewImg").src = cachedAvatar;
    }
}

function logout() {
    if (confirm("¿Deseas cerrar sesión?")) {
        localStorage.removeItem("user_avatar_url"); // Opcional: limpiar caché de imagen
        window.location.href = "/logout"; // Ruta de tu backend
    }
}

// INICIALIZACIÓN
document.addEventListener("DOMContentLoaded", () => {
    activarMenu();
    loadUserConfig();
});