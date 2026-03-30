document.addEventListener("DOMContentLoaded", () => {

    fetch("/breadcrum.html") // tu archivo del menú
        .then(res => res.text())
        .then(html => {

            document.body.insertAdjacentHTML("afterbegin", html);

        });

});