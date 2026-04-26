document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener valores
    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value.trim();
    const btnSubmit = document.getElementById('btnSubmit');
    
    // ✅ VALIDACIÓN 1: Obtener el token del reCAPTCHA
    const captchaResponse = grecaptcha.getResponse();
    
    // Mostrar/ocultar error del captcha
    const captchaErrorDiv = document.getElementById('captchaError');
    
    // ✅ VALIDACIÓN 2: Verificar que el captcha NO esté vacío
    if (!captchaResponse) {
        captchaErrorDiv.style.display = 'block';
        
        // Resaltar el captcha con un borde rojo
        const captchaFrame = document.querySelector('.g-recaptcha');
        if (captchaFrame) {
            captchaFrame.style.border = '2px solid #dc2626';
            captchaFrame.style.borderRadius = '4px';
            captchaFrame.style.padding = '2px';
        }
        
        // Hacer scroll suave hasta el captcha
        document.querySelector('.captcha').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
    // Ocultar error si el captcha está completado
    captchaErrorDiv.style.display = 'none';
    
    // Restaurar estilo normal del captcha
    const captchaFrame = document.querySelector('.g-recaptcha');
    if (captchaFrame) {
        captchaFrame.style.border = 'none';
        captchaFrame.style.padding = '0';
    }

    // Validaciones básicas
    if (!usuario || !password) {
        alert('❌ Usuario y contraseña son obligatorios');
        return;
    }

    // Deshabilitar botón para evitar múltiples envíos
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Verificando...';
    
    console.log('✅ Enviando login con captcha validado');

    try {
        // ✅ Enviar el token del captcha al backend
        const res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
                usuario, 
                password, 
                captcha: captchaResponse  // ✅ Ahora envía el token real
            })
        });

        const result = await res.json();
        console.log('RESPUESTA SERVIDOR:', result);

        if (result.ok) {
            // Redirigir al dashboard
            window.location.href = '/principal';
        } else {
            // Mostrar error específico
            let errorMsg = result.msg || 'Error en login';
            
            if (result.captchaError) {
                errorMsg = '❌ Error de verificación de captcha. Intente nuevamente.';
                // Resetear captcha si falló
                grecaptcha.reset();
            }
            
            alert(errorMsg);
            
            // Resetear captcha en caso de error general
            grecaptcha.reset();
        }

    } catch (error) {
        console.error('💥 ERROR FETCH:', error);
        alert('❌ Error de conexión con el servidor. Verifique su internet.');
        
        // Resetear captcha
        grecaptcha.reset();
        
    } finally {
        // Rehabilitar botón
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Ingresar';
    }
});

// ✅ Opcional: Limpiar error del captcha cuando el usuario lo completa
window.onload = function() {
    // Verificar cambios en el captcha
    const checkCaptcha = setInterval(() => {
        const captchaResponse = grecaptcha.getResponse();
        const captchaErrorDiv = document.getElementById('captchaError');
        const captchaFrame = document.querySelector('.g-recaptcha');
        
        if (captchaResponse && captchaErrorDiv.style.display === 'block') {
            captchaErrorDiv.style.display = 'none';
            if (captchaFrame) {
                captchaFrame.style.border = 'none';
                captchaFrame.style.padding = '0';
            }
        }
    }, 500);
    
    // Limpiar intervalo después de 30 segundos (opcional)
    setTimeout(() => clearInterval(checkCaptcha), 30000);
};

// ✅ Mejora: Validar captcha antes de enviar (al presionar Enter)
document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('formLogin').dispatchEvent(new Event('submit'));
    }
});