function activarMenu() {
    const menus = document.querySelectorAll(".menu > ul > li > a");

    menus.forEach(menu => {
        menu.addEventListener("click", function(e){

            const submenu = this.nextElementSibling;

            if(!submenu) return;

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

/* CERRAR AL HACER CLICK FUERA */
document.addEventListener("click", function(e){
    if(!e.target.closest(".menu")){
        document.querySelectorAll(".submenu").forEach(sub => {
            sub.classList.remove("activo");
        });
    }
});