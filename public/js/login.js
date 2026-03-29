document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value.trim();
    const captcha = grecaptcha.getResponse();

    if (!captcha) {
        alert('❌ Verifica el reCAPTCHA');
        return;
    }

    const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password, captcha })
    });

    const result = await res.json();

  if (result.ok) {
    window.location.href = '/Principal_1.1.html';
} else {
    grecaptcha.reset();
    window.location.href = '/404.html';
}
});