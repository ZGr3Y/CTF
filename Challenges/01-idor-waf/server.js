const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();


const PORT = 3003;
const SECRET_KEY = '28ef610f0acc8621c036933ef3ff7e27c367d06bbb7f0b0733cbf1c20af63d62aeaddae233093786ed33b22b2d9dbdf3ff017ac7d804403989188e9eab871abc'; // Cambiata da stringa vuota
const HOST = '0.0.0.0';

function wafMiddleware(req, res, next) {
    console.log(`[WAF CHECK] ${req.method} ${req.originalUrl}`);
    
    const url = req.originalUrl.toLowerCase();
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    
    // Pattern da bloccare
    const blockedPatterns = [
        /\/api\/users\/37\/data/,  // Blocca accesso diretto a giampaolo
        /\/api\/users\/3\/data/     // Blocca accesso a sergio (admin)
    ];
    
    // Check User-Agent
    if (userAgent.includes('burp') || userAgent.includes('sqlmap')) {
        return res.status(403).json({ 
            message: "WAF: Tool di scanning rilevato" 
        });
    }
    
    // Check URL patterns
    for (const pattern of blockedPatterns) {
        if (pattern.test(url)) {
            return res.status(403).json({ 
                message: "WAF: Accesso negato - Pattern sospetto" 
            });
        }
    }
    
    next();
}

// Applica WAF GLOBALMENTE prima di tutto
app.use(wafMiddleware);


app.use(express.json());
app.use(express.static('public'));

let users = [
    { 
        id: 37, 
        username: 'Sergio', 
        password: 'pippo', 
        role: 'admin',
        personalData: {
            creditCard: "4539-7894-5698-1234",
            codiceFiscale: "RSSMRA80A01H501U",
            iban: "IT60X0542811101000000123456",
            flag: "FLAG{e108c267a83877d24ec160399d6d11495547066723c5834195b465852d3f0dcab52af2ee5970d052b5997228e4ed3f2e70d77b190e5846af1f66c5c55089feec}"
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
        username: 'Giampaolo', 
        password: 'paperon_de_paperoni', 
        role: 'standard',
        personalData: {
            creditCard: "4532-7891-2345-6789",
            codiceFiscale: "BRNGNN82C14H501W",
            iban: "IT60X0542811101000000456789",
            hint:"se solo questo fosse l'account giusto!"
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
        try {
            // FIXED: Usando jwt.verify invece di jwt.decode per validare il token
            const decoded = jwt.verify(token, SECRET_KEY);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Token non valido' });
        }
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
