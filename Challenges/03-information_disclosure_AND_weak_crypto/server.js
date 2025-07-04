const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = 3010;
const SECRET_KEY = '877e2ff60af622d440d73115c72401eb0c7728b481fbf3a8936e6a5ce1566080c9381048acacd8128f6cc6065f504b1bda1f673787aff4528df9374f84ab5dac';
const HOST = '0.0.0.0';

app.use(express.json());
app.use(express.static('public'));

// Funzione per creare hash MD5
function hashPassword(password) {
    return crypto.createHash('md5').update(password).digest('hex');
}

let users = [
    { 
        id: 1, 
        username: 'giampaolo', 
        password: 'ef1a5131a0f62733d8b599b93658e829', 
        role: 'standard',
        personalData: {
            creditCard: "4539-7894-5698-1234",
            codiceFiscale: "RSSMRA80A01H501U",
            iban: "IT60X0542811101000000123456",
            flag:"FLAG{bb8fe507db893922a742babe76395bc4fb3529ee9c2befe4bc2b387a3caef637384680b0f3e749b5358ede1f16f2429004de4de1a330acf37551dccc6ab61427}"
        }
    },
    { 
        id: 2, 
        username: 'paolo', 
        password: 'f1bdf5ed1d7ad7ede4e3809bd35644b0', 
        role: 'standard',
        personalData: {
            creditCard: "4532-1234-5678-9012",
            codiceFiscale: "VRDLGU85B15H501V",
            iban: "IT60X0542811101000000789012",
            flag: "FLAG{0d0d000f6aed27b0ac626f1dd105e32f05fb97cd41591337ce60173246b784d82b184d40c1db18027544ddcaa7bd5966b63a4001882059d3ddddc4aaaf7ba7c1}"
        }
    },
    { 
        id: 3, 
        username: 'sergio', 
        password: 'c4f830de47c37abf9b3e9922aef85763', 
        role: 'admin',
        personalData: {
            creditCard: "4532-7891-2345-6789",
            codiceFiscale: "BRNGNN82C14H501W",
            iban: "IT60X0542811101000000456789",
            flag:" FLAG{941146560ecfc6e54a93014c3b5c951944635ddcdfafe6f8c26645e8300b17eb439485ae077f296ece656410c3187669c2432b969a0512dd0af28d969e6cf31d}"
        }
    }
];

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === hashPassword(password));

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
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Token non valido' });
        }
    } else {
        res.status(401).json({ message: 'Token mancante' });
    }
}

// Endpoint per ottenere i dati personali di un utente
app.get('/api/users/:userId/data', authenticate, (req, res) => {
    const requestedId = parseInt(req.params.userId);

    if (req.user.id !== requestedId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accesso negato' });
    }

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
