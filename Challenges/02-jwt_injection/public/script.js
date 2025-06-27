let token = null;
let currentUser = null;

// Utility functions
function showMessage(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message ${type}`;
}

function showSection(sectionId) {
    // Hide all sections
    const sections = ['loginSection', 'dashboardSection', 'userDataSection', 'adminSection'];
    sections.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    
    // Show requested section
    document.getElementById(sectionId).classList.remove('hidden');
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('currentUser').textContent = currentUser.sub;
        document.getElementById('currentRole').textContent = currentUser.role;
    }
}

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await login();
});

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
            
            // Decode JWT payload to get user info
            const payloadBase64 = token.split('.')[1];
            currentUser = JSON.parse(atob(payloadBase64));
            
            showMessage('loginMessage', `Welcome ${currentUser.sub}!`, 'success');
            
            // Show dashboard
            showSection('dashboardSection');
            updateUserInfo();
            
        } else {
            showMessage('loginMessage', data.message, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('loginMessage', 'Connection error', 'error');
    }
}

// Load user data - CORRECTED to use /my-account endpoint
async function loadUserData() {
    if (!token) return;

    try {
        const response = await fetch('/my-account', {
            headers: { 'Authorization': `Bearer ${token}` }  // FIXED: Added Bearer prefix
        });

        const data = await response.json();
        
        if (response.ok) {
            const userDataHtml = `
                <h4>Your Personal Data:</h4>
                <p><strong>Username:</strong> ${data.username}</p>
                <p><strong>Role:</strong> ${data.role}</p>
                <p><strong>Credit Card:</strong> ${data.account_data.creditCard}</p>
                <p><strong>Codice Fiscale:</strong> ${data.account_data.codiceFiscale}</p>
                <p><strong>IBAN:</strong> ${data.account_data.iban}</p>
            `;
            document.getElementById('userData').innerHTML = userDataHtml;
            document.getElementById('userDataSection').classList.remove('hidden');
        } else {
            const errorHtml = `<p class="error">❌ ${data.message}</p>`;
            document.getElementById('userData').innerHTML = errorHtml;
            document.getElementById('userDataSection').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Load data error:', error);
        const errorHtml = `<p class="error">❌ Connection error</p>`;
        document.getElementById('userData').innerHTML = errorHtml;
        document.getElementById('userDataSection').classList.remove('hidden');
    }
}

// Admin panel access - CORRECTED to use /admin endpoint
async function accessAdminPanel() {
    if (!token) return;

    try {
        const response = await fetch('/admin', {
            headers: { 'Authorization': `Bearer ${token}` }  // FIXED: Added Bearer prefix
        });

        const data = await response.json();
        
        if (response.ok) {
            const adminHtml = `
                <h4>🏆 Admin Panel Access Successful!</h4>
                <p><strong>Welcome:</strong> ${data.admin_user}</p>
                <p><strong>Exploit Used:</strong> ${data.exploit_used}</p>
                <div class="users-list">
                    <h5>Users List:</h5>
                    ${data.users.map(user => `
                        <div class="user-item">
                            <p><strong>ID:</strong> ${user.id} | <strong>Username:</strong> ${user.username} | <strong>Role:</strong> ${user.role}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="flag-info">
                    <h5>🚩 Flag:</h5>
                    <code>${data.flag}</code>
                </div>
            `;
            document.getElementById('adminContent').innerHTML = adminHtml;
            document.getElementById('adminSection').classList.remove('hidden');
        } else {
            const adminHtml = `
                <p class="error">❌ <strong>${data.message}</strong></p>
                <p>Required role: <strong>${data.required_role}</strong></p>
                <p>Current role: <strong>${data.current_role}</strong></p>
                <p>Current user: <strong>${data.current_user}</strong></p>
                <p><em>Hint: You need admin privileges to access this panel...</em></p>
            `;
            document.getElementById('adminContent').innerHTML = adminHtml;
            document.getElementById('adminSection').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Admin panel error:', error);
        const adminHtml = `<p class="error">❌ Connection error</p>`;
        document.getElementById('adminContent').innerHTML = adminHtml;
        document.getElementById('adminSection').classList.remove('hidden');
    }
}


// Logout
function logout() {
    token = null;
    currentUser = null;
    
    // Clear forms
    document.getElementById('username').value = 'paolo';
    document.getElementById('password').value = 'password1';
    document.getElementById('loginMessage').textContent = '';
    
    // Clear data sections
    document.getElementById('userData').innerHTML = '';
    document.getElementById('adminContent').innerHTML = '';
    
    // Show login section
    showSection('loginSection');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 JWT Challenge loaded');
    console.log('💡 Challenge Goal: Use RSA JWK Injection to access admin endpoints');
    console.log('🛠️ Required: Burp Suite with JWT Editor extension');
    showSection('loginSection');
});
