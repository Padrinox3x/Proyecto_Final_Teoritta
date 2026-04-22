document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value.trim();

    console.log('USUARIO:', usuario);
    console.log('PASSWORD:', password);

    try {
        const res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ usuario, password, captcha: "" })
        });

        const result = await res.json();

        console.log('RESPUESTA:', result);

        if (result.ok) {
            window.location.href = '/principal';
        } else {
            alert(result.msg || 'Error en login');
        }

    } catch (error) {
        console.error('💥 ERROR FETCH:', error);
        alert('Error de conexión con el servidor');
    }
});