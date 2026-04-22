/**
 * Lógica para el Menú de Navegación y Sidebar de Usuario
 */
function inicializarMenu() {
    // 1. LÓGICA DE SUBMENÚS (Tu código original optimizado)
    const menus = document.querySelectorAll(".menu > ul > li > a");

    menus.forEach(menu => {
        menu.addEventListener("click", function(e) {
            const submenu = this.nextElementSibling;

            // Si no tiene submenú (como el caso del avatar o links directos), navegar normal
            if (!submenu || !submenu.classList.contains("submenu")) {
                return; 
            }

            e.preventDefault();

            // Cerrar otros submenús abiertos
            document.querySelectorAll(".submenu").forEach(sub => {
                if (sub !== submenu) {
                    sub.classList.remove("activo");
                }
            });

            submenu.classList.toggle("activo");
        });
    });

    // 2. LÓGICA DEL SIDEBAR (Perfil de Usuario)
    const avatar = document.getElementById('user-avatar');
    const sidebar = document.getElementById('user-sidebar');
    const closeSidebar = document.getElementById('close-sidebar');

    if (avatar && sidebar) {
        // Abrir Sidebar al dar clic en el círculo
        avatar.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el evento llegue al document
            sidebar.classList.add('open');
        });

        // Cerrar Sidebar con la "X"
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                sidebar.classList.remove('open');
            });
        }
    }

    // 3. CERRAR TODO AL HACER CLIC FUERA
    document.addEventListener("click", function(e) {
        // Cerrar submenús si se hace clic fuera del nav
        if (!e.target.closest(".menu")) {
            document.querySelectorAll(".submenu").forEach(sub => {
                sub.classList.remove("activo");
            });
        }

        // Cerrar sidebar si se hace clic fuera de él y no es el avatar
        if (sidebar && !sidebar.contains(e.target) && !avatar.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    // 4. GESTIÓN DE CLOUDINARY (Carga de Imagen)
    const btnUpload = document.getElementById('btn-upload');
    const imageInput = document.getElementById('image-input');
    const avatarImg = document.getElementById('avatar-img');

    if (btnUpload && imageInput) {
        btnUpload.addEventListener('click', async () => {
            const file = imageInput.files[0];
            if (!file) return alert("Por favor, selecciona una imagen primero.");

            // Mostrar estado de carga (opcional)
            btnUpload.innerText = "Subiendo...";
            btnUpload.disabled = true;

            const formData = new FormData();
            formData.append('file', file);
            // IMPORTANTE: Cambia 'tu_preset' y 'tu_user' por tus credenciales de Cloudinary
            formData.append('upload_preset', 'tu_preset_aqui'); 

            try {
                const res = await fetch('https://api.cloudinary.com/v1_1/tu_user_aqui/image/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();

                if (data.secure_url) {
                    // 1. Actualizar la vista previa inmediatamente
                    avatarImg.src = data.secure_url;
                    
                    // 2. ENVIAR AL BACKEND (Ejemplo de cómo guardarlo en tu SQL Server)
                    await actualizarFotoEnBaseDeDatos(data.secure_url);

                    alert("¡Imagen actualizada con éxito!");
                } else {
                    throw new Error("No se recibió la URL de la imagen");
                }
            } catch (err) {
                console.error("Error en Cloudinary:", err);
                alert("Error al subir la imagen.");
            } finally {
                btnUpload.innerText = "Actualizar Imagen";
                btnUpload.disabled = false;
            }
        });
    }
}

/**
 * Función auxiliar para persistir la URL en tu servidor Node/Express
 */
async function actualizarFotoEnBaseDeDatos(urlImagen) {
    try {
        await fetch('/api/usuario/update-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlImagen })
        });
    } catch (error) {
        console.error("Error guardando en BD:", error);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", inicializarMenu);