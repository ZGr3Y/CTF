const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = ' ';
const HOST = '0.0.0.0';

app.use(express.json());
app.use(express.static('public'));

let users = [
    { 
        id: 1, 
        username: 'giampaolo', 
        password: 'adminpass', 
        role: 'admin',
        personalData: {
            creditCard: "4539-7894-5698-1234",
            codiceFiscale: "RSSMRA80A01H501U",
            iban: "IT60X0542811101000000123456"
        }
    },
    { 
        id: 2, 
        username: 'paolo', 
        password: 'password1', 
        role: 'standard',
        personalData: {
            creditCard: "4532-1234-5678-9012",
            codiceFiscale: "VRDLGU85B15H501V",
            iban: "IT60X0542811101000000789012"
        }
    },
    { 
        id: 3, 
        username: 'sergio', 
        password: 'password2', 
        role: 'standard',
        personalData: {
            creditCard: "4532-7891-2345-6789",
            codiceFiscale: "BRNGNN82C14H501W",
            iban: "IT60X0542811101000000456789"
        }
    }
];

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const token = jwt.sign({ 
            id: user.id,
            username: user.username, 
            role: user.role 
        }, SECRET_KEY);
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Credenziali non valide' });
    }
});

function authenticate(req, res, next) {
    const token = req.headers['authorization'];

    if (token) {
        const decoded = jwt.decode(token);
        req.user = decoded;
        next();
    } else {
        res.status(401).json({ message: 'Token mancante' });
    }
}

// Endpoint vulnerabile a IDOR
app.get('/api/users/:userId/data', authenticate, (req, res) => {
    const requestedId = parseInt(req.params.userId);
    const user = users.find(u => u.id === requestedId);
    
    if (user) {
        res.json({ personalData: user.personalData });
    } else {
        res.status(404).json({ message: 'Utente non trovato' });
    }
});

// API per ottenere la lista degli utenti (solo admin)
app.get('/api/admin/users', authenticate, (req, res) => {
    if (req.user.role === 'admin') {
        const userList = users.map(u => ({
            id: u.id,
            username: u.username,
            password: u.password,
            role: u.role
        }));
        res.json({ users: userList });
    } else {
        res.status(403).json({ message: 'Accesso negato' });
    }
});

// API per eliminare un utente (solo admin)
app.delete('/api/admin/users/:userId', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accesso negato' });
    }

    const userIdToDelete = parseInt(req.params.userId);
    const userIndex = users.findIndex(u => u.id === userIdToDelete);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'Utente non trovato' });
    }

    if (users[userIndex].role === 'admin') {
        return res.status(403).json({ message: 'Non puoi eliminare un admin' });
    }

    users.splice(userIndex, 1);
    res.json({ message: 'Utente eliminato con successo' });
});

app.listen(PORT, HOST, () => {
    console.log(`Server in ascolto su http://${HOST}:${PORT}`);
});
