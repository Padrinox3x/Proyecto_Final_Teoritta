function activarMenu() {
    const menus = document.querySelectorAll(".menu > ul > li > a");

    menus.forEach(menu => {
        menu.addEventListener("click", function(e){

            const submenu = this.nextElementSibling;

            // 🔥 SI NO TIENE SUBMENU → NO BLOQUEAR LINK
            if(!submenu){
                return; // deja que navegue normal
            }

            e.preventDefault();

            document.querySelectorAll(".submenu").forEach(sub => {
                if(sub !== submenu){
                    sub.classList.remove("activo");
                }
            });

            submenu.classList.toggle("activo");
        });
    });
}

document.addEventListener("click", function(e){

    // si el click NO fue dentro del menú
    if(!e.target.closest(".menu")){
        
        document.querySelectorAll(".submenu").forEach(sub => {
            sub.classList.remove("activo");
        });

    }
});

document.addEventListener("DOMContentLoaded", activarMenu);