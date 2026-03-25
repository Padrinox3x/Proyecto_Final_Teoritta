function activarMenu() {
    const menus = document.querySelectorAll(".menu > ul > li > a");

    menus.forEach(menu => {
        menu.addEventListener("click", function(e){
            e.preventDefault();

            const submenu = this.nextElementSibling;

            document.querySelectorAll(".submenu").forEach(sub => {
                if(sub !== submenu){
                    sub.classList.remove("activo");
                }
            });

            submenu.classList.toggle("activo");
        });
    });
}