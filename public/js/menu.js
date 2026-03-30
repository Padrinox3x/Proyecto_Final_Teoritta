document.addEventListener("DOMContentLoaded", () => {

    fetch("/breadcrum.html") // ✅ AQUÍ ESTÁ LA CLAVE
        .then(res => res.text())
        .then(html => {

            document.body.insertAdjacentHTML("afterbegin", html);

            // 🔥 ACTIVAR MENÚ DESPUÉS DE INSERTAR
            activarMenu();

        })
        .catch(err => console.error("Error cargando menú:", err));

});