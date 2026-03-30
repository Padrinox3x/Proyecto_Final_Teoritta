document.addEventListener("DOMContentLoaded", () => {

    fetch("/Principal_1.1.html") // tu archivo del menú
        .then(res => res.text())
        .then(html => {

            document.body.insertAdjacentHTML("afterbegin", html);

        });

});