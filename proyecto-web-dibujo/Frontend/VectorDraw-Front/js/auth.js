const form = document.getElementById('authForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const emailInput = document.getElementById('email');
const toggleBtn = document.getElementById('toggleMode');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const errorMsg = document.getElementById('errorMsg');

let isRegisterMode = false;

toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    
    if (isRegisterMode) {
        formTitle.innerText = "Crear Cuenta";
        submitBtn.innerText = "REGISTRARSE";
        toggleBtn.innerText = "¿Ya tienes cuenta? Inicia Sesión";
        emailInput.style.display = 'block';
        emailInput.required = true;
    } else {
        formTitle.innerText = "Iniciar Sesión";
        submitBtn.innerText = "ENTRAR";
        toggleBtn.innerText = "¿No tienes cuenta? Regístrate";
        emailInput.style.display = 'none';
        emailInput.required = false;
    }
    errorMsg.style.display = 'none';
});

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const payload = {
        Username: usernameInput.value,
        Password: passwordInput.value
    };

    let endpoint = `${CONFIG.API_URL}/auth/login`;
    
    if (isRegisterMode) {
        endpoint = `${CONFIG.API_URL}/auth/register`;
        payload.Email = emailInput.value;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = "Procesando...";
        errorMsg.style.display = 'none';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Error en el servidor");
        }

        if (isRegisterMode) {
            alert("Cuenta creada con éxito. Por favor inicia sesión.");
            toggleBtn.click(); // Cambiar a vista login automáticamente
        } else {
            console.log("Respuesta del servidor (LOGIN):", data);

            const validToken = data.token || data.Token;
            const validUser = data.username || data.Username;

            if (validToken) {
                localStorage.removeItem('vector_token');
                localStorage.removeItem('vector_user');

                localStorage.setItem('vector_token', validToken);
                localStorage.setItem('vector_user', validUser);
                
                console.log("Token guardado correctamente. Redirigiendo...");
                window.location.href = 'dashboard.html';
            } else {
                console.error("Objeto recibido:", data);
                throw new Error("El servidor respondió OK, pero no envió un token válido.");
            }
        }

    } catch (error) {
        console.error(error);
        errorMsg.innerText = error.message;
        errorMsg.style.display = 'block';
        localStorage.removeItem('vector_token');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = isRegisterMode ? "REGISTRARSE" : "ENTRAR";
    }
});