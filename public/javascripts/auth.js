document.addEventListener('DOMContentLoaded', function() {
    const loginbtn = document.getElementById('loginApply');
    const registerbtn = document.getElementById('registerApply');


    loginbtn.addEventListener('click', async function () {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const result = await response.json();
            alert('Logged in successfully');

            window.location.href = '/';
        } catch (error) {
            console.error('Error during login:', error);
            alert('Login failed. Please check your credentials and try again.');
        } finally {
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
        }
    });

    registerbtn.addEventListener('click', async function() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, pots: [] })
        });

        const result = await response.json();


        if (result.success) {
            alert('Account created successfully');
        } else {
            alert('Registration failed');
        }
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
    });

    document.getElementById('btn-logout').addEventListener('click', async () => {
        const response = await fetch('/auth/logout', {
            method: 'GET',
        });

        const result = await response.json();
        if (result.success) {
            alert('Logged out successfully');
            window.location.reload();
        } else {
            alert('Logout failed');
        }
    });
})