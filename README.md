# CTF

This project contains a set of purposely vulnerable web services created for a bachelor degree Capture The Flag (CTF) event.  Every challenge is implemented in **Node.js** using the **Express** framework and is packaged as an independent **Docker** container so they can be run locally or deployed on a competition platform.

## Challenge Overview

The repository hosts three separate scenarios, each demonstrating a different class of vulnerability:

- **IDOR WAF Challenge** (`01-idor-waf`, port **3003**)
  - Implements an Insecure Direct Object Reference (IDOR) vulnerability.
  - Includes a very simple Web Application Firewall written in Express middleware.
  - Front‑end is a minimal HTML/JavaScript/CSS interface served by the same Node.js app.

- **JWT Injection Challenge** (`02-jwt_injection`, port **3007**)
  - Showcases a flaw where **JSON Web Tokens (JWTs)** with embedded **RSA JWK** public keys are blindly trusted.
  - The service generates its own RSA key pair using Node's `crypto` module and signs tokens with `RS256`.
  - Attackers can forge admin tokens by injecting a JWK that contains their own public key.

- **Information Disclosure & Weak Crypto** (`03-information_disclosure_AND_weak_crypto`, port **3010**)
  - Demonstrates poor secrets management and weak password storage.
  - User passwords are hashed with **MD5**, which is considered insecure.
  - Sensitive data such as flags and example credit card details are exposed via the API.

Each challenge listens on its own port so they can run simultaneously without conflicts.  Docker Compose is used to orchestrate the containers and create a private bridge network between them.

## Technologies Used

- **Node.js 18** – runtime for all challenge servers.
- **Express 4** – web framework handling HTTP routes and middleware.
- **jsonwebtoken** – library to create and verify JWTs.
- **crypto** – Node.js built‑in module for RSA key generation and MD5 hashing.
- **Docker & Docker Compose** – containerization and multi‑service orchestration.
- Front‑end assets are plain **HTML**, **CSS** and **JavaScript** served statically by Express.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Docker Compose installed.
- Optionally **Node.js 18+** if you want to run the services directly without containers.

## Building and Running the Challenges

To start all services with Docker Compose:

```bash
cd Challenges
docker compose build
docker compose up -d
```

The services will be available at:

- <http://localhost:3003> – IDOR WAF
- <http://localhost:3007> – JWT Injection
- <http://localhost:3010> – Information Disclosure & Weak Crypto

Stop everything with `docker compose down`.

## Manual Execution Without Docker

If you prefer running a single challenge with Node.js, install dependencies and start the server from its folder.  Example for the IDOR challenge:

```bash
cd Challenges/01-idor-waf
npm install
node server.js
```

The same approach works for the other two directories.

## Ports Summary

- **3003** – IDOR WAF service
- **3007** – JWT Injection service
- **3010** – Information Disclosure & Weak Crypto service

These three scenarios provide a hands‑on environment to practice finding and exploiting common web vulnerabilities while illustrating how misconfigurations or weak cryptography can be abused.
