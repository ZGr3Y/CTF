let token = null;
let currentUser = null;

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            token = data.token;
            currentUser = JSON.parse(atob(token.split('.')[1]));
            
            document.getElementById('login').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            
            loadUserData(currentUser.id);
        } else {
            document.getElementById('loginMessage').textContent = data.message;
        }
    } catch (error) {
        console.error('Errore:', error);
    }
}

async function loadUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/data`, {
            headers: { 'Authorization': token }
        });

        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('userData').innerHTML = `
                <div class="data-box">
                    <p><strong>Carta di Credito:</strong> ${data.personalData.creditCard}</p>
                    <p><strong>Codice Fiscale:</strong> ${data.personalData.codiceFiscale}</p>
                    <p><strong>IBAN:</strong> ${data.personalData.iban}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Errore:', error);
    }
}

async function accessAdminPanel() {
    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': token }
        });

        if (response.ok) {
            document.getElementById('adminPanel').style.display = 'block';
            const data = await response.json();
            displayUsersList(data.users);
        } else {
            alert('Accesso non autorizzato: solo gli amministratori possono accedere a questa sezione');
            document.getElementById('adminPanel').style.display = 'none';
        }
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore nell\'accesso al pannello admin');
    }
}

function displayUsersList(users) {
    const usersList = users.map(user => `
        <div class="user-item">
            <span>
                <strong>Username:</strong> ${user.username} 
                <strong>Ruolo:</strong> ${user.role}
                <strong>Password:</strong> ${user.password}
            </span>
            ${user.role !== 'admin' ? 
                `<button onclick="deleteUser(${user.id})">Elimina</button>
                 <button onclick="viewUserData(${user.id})">Vedi Dati</button>` 
                : ''}
        </div>
    `).join('');

    document.getElementById('usersList').innerHTML = usersList;
}

async function deleteUser(userId) {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;

    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });

        if (response.ok) {
            accessAdminPanel(); // Ricarica la lista utenti
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Errore:', error);
    }
}

async function viewUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/data`, {
            headers: { 'Authorization': token }
        });

        const data = await response.json();
        
        if (response.ok) {
            const userData = `
                <div class="user-data-view">
                    <h3>Dati Utente</h3>
                    <p><strong>Carta di Credito:</strong> ${data.personalData.creditCard}</p>
                    <p><strong>Codice Fiscale:</strong> ${data.personalData.codiceFiscale}</p>
                    <p><strong>IBAN:</strong> ${data.personalData.iban}</p>
                    <button onclick="closeUserData()">Chiudi</button>
                </div>
            `;
            document.getElementById('usersList').insertAdjacentHTML('afterend', userData);
        }
    } catch (error) {
        console.error('Errore:', error);
    }
}

function closeUserData() {
    const dataView = document.querySelector('.user-data-view');
    if (dataView) {
        dataView.remove();
    }
}
