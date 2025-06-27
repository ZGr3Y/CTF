# CTF

CTF project for bachelor degree.

## Overview
This repository hosts three Node.js based challenges. Each one runs in its own Docker container and listens on a dedicated port.

- **IDOR WAF Challenge** (`01-idor-waf`, port **3003**): demonstrates an Insecure Direct Object Reference protected by a basic Web Application Firewall.
- **JWT Injection Challenge** (`02-jwt_injection`, port **3007**): vulnerable JWT authentication where RSA JWKs embedded in the token header are trusted.
- **Information Disclosure & Weak Crypto** (`03-information_disclosure_AND_weak_crypto`, port **3010**): exposes sensitive data and relies on weak MD5 password hashes.

## Prerequisites
- [Docker](https://docs.docker.com/get-docker/) with Docker Compose support.
- Optional: Node.js 18+ if you prefer running the services without containers.

## Build and Run
Use `docker compose` to build all images and start the services:

```bash
cd Challenges
docker compose build
docker compose up -d
```

Once running, each challenge is accessible at the following URLs:

- http://localhost:3003 – IDOR WAF
- http://localhost:3007 – JWT Injection
- http://localhost:3010 – Information Disclosure & Weak Crypto

Stop the environment with:

```bash
docker compose down
```

## Ports
- **3003** – IDOR WAF service
- **3007** – JWT Injection service
- **3010** – Information Disclosure & Weak Crypto service
