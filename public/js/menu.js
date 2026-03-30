document.addEventListener("DOMContentLoaded", () => {

    fetch("/breadcrum.html") // 🔥 IMPORTANTE: con /
        .then(res => {
            if(!res.ok) throw new Error("No se encontró breadcrum.html");
            return res.text();
        })
        .then(html => {

            document.body.insertAdjacentHTML("afterbegin", html);

            if(typeof activarMenu === "function"){
                activarMenu();
            }

        })
        .catch(err => {
            console.error("❌ Error cargando menú:", err);
        });

});