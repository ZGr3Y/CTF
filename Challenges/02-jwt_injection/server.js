const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = 3007;
const HOST = '0.0.0.0';

app.use(express.json());
app.use(express.static('public'));

// Generate server RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

// Users del sistema
let users = [
    { 
        id: 1, 
        username: 'giampaolo', 
        password: 'palazzolo_acreide', 
        role: 'user',
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
        role: 'user',
        personalData: {
            creditCard: "4532-1234-5678-9012",
            codiceFiscale: "VRDLGU85B15H501V",
            iban: "IT60X0542811101000000789012"
        }
    },
    { 
        id: 3, 
        username: 'sergio', 
        password: 'stefano_rapone', 
        role: 'admin',
        personalData: {
            creditCard: "4532-7891-2345-6789",
            codiceFiscale: "BRNGNN82C14H501W",
            iban: "IT60X0542811101000000456789"
        }
    }
];

// Flag per la challenge
const JWT_FLAG = 'FLAG{e134282b98e54d2be15be2333ba24dc90e24b5e8942fb22314b8c01bbc47b36dee015c94b2d8d907bed7b160b4d6c0fa00b8e66ab25563f31e947095b9100f64}';

// Utility function to convert PEM to JWK format
function pemToJwk(pemKey) {
    try {
        const keyObject = crypto.createPublicKey(pemKey);
        const jwk = keyObject.export({ format: 'jwk' });
        return jwk;
    } catch (error) {
        return null;
    }
}

// Utility function to convert JWK to PEM
function jwkToPem(jwk) {
    try {
        const keyObject = crypto.createPublicKey({ key: jwk, format: 'jwk' });
        return keyObject.export({ type: 'spki', format: 'pem' });
    } catch (error) {
        return null;
    }
}

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Genera JWT con RSA signature
    const payload = {
        sub: user.username,  // subject claim (PortSwigger style)
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
    };

    const token = jwt.sign(payload, privateKey, { 
        algorithm: 'RS256',
        header: {
            typ: 'JWT',
            alg: 'RS256'
        }
    });

    res.json({ 
        token: token,  // Frontend si aspetta 'token', non 'access_token'
        message: `Welcome ${user.username}!`
    });
});

// Authentication middleware VULNERABILE a RSA JWK Injection
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token missing or invalid format' });
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    
    try {
        // Decodifica header per controllare JWK
        const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        
        let decoded;
        let jwkExploited = false;

        console.log(`\n🔐 JWT Auth Check:`);
        console.log(`Algorithm: ${header.alg}`);
        console.log(`Subject: ${payload.sub} (${payload.role})`);

        // 🚨 VULNERABILITÀ: Se c'è JWK nell'header, usala per verificare!
        if (header.jwk) {
            console.log(`🚨 EMBEDDED JWK DETECTED!`);
            console.log(`JWK Type: ${header.jwk.kty}`);
            
            if (header.jwk.kty === 'RSA') {
                // Converte JWK embedded in PEM format
                const embeddedPublicKey = jwkToPem(header.jwk);
                
                if (embeddedPublicKey) {
                    console.log(`🔑 Using embedded RSA public key for verification`);
                    
                    try {
                        // VULNERABILE: Usa chiave pubblica embedded!
                        decoded = jwt.verify(token, embeddedPublicKey, { algorithms: ['RS256'] });
                        jwkExploited = true;
                        console.log(`✅ JWK EXPLOIT SUCCESS!`);
                    } catch (error) {
                        console.log(`❌ JWK verification failed: ${error.message}`);
                        return res.status(401).json({ message: 'Invalid embedded JWK signature' });
                    }
                } else {
                    return res.status(401).json({ message: 'Invalid JWK format' });
                }
            } else {
                return res.status(401).json({ message: 'Unsupported JWK key type - RSA required' });
            }
        }
        else {
            // Verificazione normale con chiave server
            console.log(`🔒 Normal RSA verification with server public key`);
            decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        }

        req.user = decoded;
        req.jwkExploited = jwkExploited;
        next();

    } catch (error) {
        console.log(`❌ JWT verification failed: ${error.message}`);
        res.status(401).json({ message: 'Invalid token' });
    }
}

// My Account endpoint (PortSwigger style)
app.get('/my-account', authenticate, (req, res) => {
    const user = users.find(u => u.username === req.user.sub);
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({
        username: user.username,
        role: user.role,
        account_data: user.personalData,
        message: `Welcome to your account, ${user.username}!`
    });
});

// Admin panel endpoint (PortSwigger target style)
app.get('/admin', authenticate, (req, res) => {
    console.log(`\n🎯 ADMIN ACCESS ATTEMPT:`);
    console.log(`Subject: ${req.user.sub}`);
    console.log(`Role: ${req.user.role}`);
    console.log(`JWK Exploited: ${req.jwkExploited}`);

    // Solo admin role può accedere
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Admin panel access denied',
            required_role: 'admin',
            current_role: req.user.role,
            current_user: req.user.sub
        });
    }

    // Success - Admin panel access
    console.log(`🏆 ADMIN PANEL ACCESS GRANTED!`);
    
    res.json({
        message: 'Welcome to the admin panel!',
        admin_user: req.user.sub,
        flag: JWT_FLAG,
        users: users.map(u => ({
            username: u.username,
            role: u.role,
            id: u.id
        })),
        exploit_used: req.jwkExploited ? 'RSA JWK Injection' : 'Legitimate Access',
        success: true
    });
});

// Endpoint per compatibilità frontend (stesso risultato di /admin)
app.get('/api/admin/jwt-flag', authenticate, (req, res) => {
    console.log(`\n🎯 JWT FLAG ACCESS ATTEMPT:`);
    console.log(`Subject: ${req.user.sub}`);
    console.log(`Role: ${req.user.role}`);
    console.log(`JWK Exploited: ${req.jwkExploited}`);

    // Solo admin role può accedere
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Admin panel access denied',
            required_role: 'admin',
            current_role: req.user.role,
            current_user: req.user.sub
        });
    }

    // Success - JWT Flag access
    console.log(`🏆 JWT FLAG ACCESS GRANTED!`);
    
    res.json({
        success: true,
        flag: JWT_FLAG,
        message: 'Congratulations! You successfully exploited RSA JWK Injection!',
        technique: 'RSA JWK Injection',
        exploit_used: req.jwkExploited ? 'RSA JWK Injection' : 'Legitimate Access'
    });
});

// Endpoint per ottenere la chiave pubblica server (per reference)
app.get('/jwks', (req, res) => {
    const serverJwk = pemToJwk(publicKey);
    
    res.json({
        keys: [
            {
                ...serverJwk,
                use: 'sig',
                kid: 'server-key-2024',
                alg: 'RS256'
            }
        ]
    });
});

// Root endpoint con istruzioni
app.get('/', (req, res) => {
    res.send(`
    <h1>🔐 BankSecure Corp - Advanced JWT Challenge</h1>
    <h2>RSA JWK Injection Vulnerability</h2>
    
    <h3>🎯 Challenge Goal:</h3>
    <p>Access the <strong>/admin</strong> endpoint with <code>admin</code> role</p>
    
    <h3>📋 Available Endpoints:</h3>
    <ul>
        <li><strong>POST /login</strong> - Authenticate user</li>
        <li><strong>GET /my-account</strong> - User account page</li>
        <li><strong>GET /admin</strong> - Admin panel (TARGET)</li>
        <li><strong>GET /jwks</strong> - Server public keys</li>
    </ul>
    
    <h3>👤 Test Accounts:</h3>
    <ul>
        <li><strong>paolo / password1</strong> (regular user)</li>
        <li><strong>sergio / password2</strong> (regular user)</li>
        <li><strong>giampaolo / adminpass</strong> (admin user)</li>
    </ul>
    
    <h3>🛠️ Required Tools:</h3>
    <p>Use <strong>Burp Suite JWT Editor extension</strong> for this challenge</p>
    
    <p><em>Hint: The server trusts embedded RSA public keys in JWT headers...</em></p>
    `);
});

app.listen(PORT, HOST, () => {
    console.log(`🚀 Advanced RSA JWT Challenge running on http://${HOST}:${PORT}`);
    console.log(`🎯 Target: Access /admin with 'admin' role`);
    console.log(`🔑 Server uses RSA256 with embedded JWK vulnerability`);
    console.log(`🛠️  Use Burp Suite JWT Editor extension for exploitation`);
    console.log(`\n📋 Test flow:`);
    console.log(`1. POST /login with paolo/password1`);
    console.log(`2. GET /my-account (works)`);
    console.log(`3. GET /admin (denied - need admin role)`);
    console.log(`4. Use JWT Editor 'Embedded JWK' attack`);
    console.log(`5. Change 'role' to 'admin'`);
    console.log(`6. Access /admin successfully`);
});
