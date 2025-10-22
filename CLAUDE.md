# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PHA (Phone Authorization) is a Koa-based authentication service that handles phone/email-based authentication with SMS/email verification codes. It manages user accounts, access tokens, and role-based authorization for mobile applications.

## Development Commands

### Running the API Server
```bash
npm run api
```
Starts the API server using nodemon with ESM support on port 3130 (configurable via PORT env var).

### Running Tests
```bash
npm test
```
Runs all Mocha tests with ESM support. Tests include authentication flows, API endpoints, and data models.

### Building for Deployment
```bash
npm run build
```
Copies source files and package.json to `dist/` directory.

## Architecture

### Tech Stack
- **Framework**: Koa 2 with @koa/router for routing
- **Database**: MongoDB via sistemium-mongo and sistemium-data packages
- **Caching**: Redis (optional, via ioredis)
- **Authentication**: Custom SMS/Email verification with access tokens
- **Messaging**: AWS SNS for SMS, nodemailer for emails
- **Module System**: ESM with `esm` package for Node.js compatibility

### Project Structure

```
src/
├── api/           # Koa routes and controllers
│   ├── index.js   # Application entry point
│   ├── router.js  # Route definitions
│   ├── auth.js    # Authentication endpoints
│   ├── register.js # Registration endpoints
│   ├── account.js # Account management
│   ├── roles.js   # Role/permission queries (JSON/XML)
│   ├── sms.js     # SMS sending (AWS SNS, SMS Traffic)
│   ├── email.js   # Email sending
│   └── helpers.js # Utility functions
├── services/      # Business logic
│   ├── authorizing.js  # Auth token creation and validation
│   ├── accounting.js   # Account creation logic
│   └── validating.js   # Input validation
├── models/        # Data models
│   ├── Account.js      # User accounts
│   ├── AccessToken.js  # Authentication tokens
│   ├── Profile.js      # Role profiles
│   └── Program.js      # Application configurations
└── lib/           # Utilities
    ├── dates.js   # dayjs wrapper
    └── random.js  # Random string generation
```

### Authentication Flow

1. **Login/Registration**:
   - POST `/auth` or `/register` with `mobileNumber` or `email`
   - System generates 6-digit code and sends via SMS/email
   - Returns `ID` (AccessToken ID) to client

2. **Code Verification**:
   - POST `/auth` with `ID` and `code` (or `smsCode`/`emailCode`)
   - Validates code (max 3 attempts via `CODE_ATTEMPTS`)
   - Account suspension after multiple failed attempts within `BAD_ATTEMPTS_MINUTES`
   - Returns long-lived access token (365 days default)

3. **Authorization**:
   - GET `/roles` with `authorization` header or `access-token` query param
   - Returns account info, token expiry, and computed roles
   - Supports both JSON and XML output (`/roles.xml`)
   - Redis caching per token + user agent build

### Data Models

**Account**: User accounts with roles, org affiliation, and contact info
- `num`: Auto-incremented unique number
- `mobileNumber`, `email`: Contact methods
- `stringRoles`: Comma-separated roles (e.g., "stc,auth:*,salesman:123")
- `roles`: Object with additional role data
- `org`: Organization code
- `env`: Environment (prod/staging)

**AccessToken**: Two-phase tokens (verification → long-lived)
- Initial: Contains `code` and `accountData` for verification
- After verification: Contains `token` with `expiresAt`
- `attempts`: Failed verification attempts counter

**Profile**: Dynamic role assignments based on regex matching
- Matches accounts by `orgRe` and `rolesRe` patterns
- Can inject additional roles based on user-agent build version
- Used for feature flags and version-specific configurations

### Role System

Roles are computed from multiple sources:
1. **String roles**: Parsed from `Account.stringRoles` (format: `role:value,role2`)
2. **Account roles**: Direct `Account.roles` object
3. **Profile roles**: Dynamically injected based on Profile rules
4. **Built-in roles**: `authenticated: true`, `stc: true`, `org: <orgCode>`

String role parsing:
- `stg` → `{ stg: true }`
- `salesman:123` → `{ salesman: 123 }`
- `auth:*` → `{ auth: "*" }`
- Multiple values merge into arrays: `salesman:123,salesman:456` → `{ salesman: [123, 456] }`

### Configuration

Key environment variables (see [nodemon.json](nodemon.json)):
- `MONGO_URL`: MongoDB connection string
- `PORT`: API server port (default: 3130)
- `DEBUG_NAMESPACE`, `ERROR_NAMESPACE`: Logging namespaces
- `SMS_METHOD`: SMS provider ("awsSNS" or "smsTraffic")
- `SMS_URL`, `SMS_LOGIN`, `SMS_PASSWORD`: SMS Traffic API credentials
- `AWS_LOGIN`, `AWS_PASSWORD`, `AWS_REGION`: AWS SNS credentials
- `REDIS_URL`: Redis connection string for caching
- `REDIS_EXPIRE`: Cache TTL in seconds (default: 300)
- `TOKEN_LIFETIME_DAYS`: Access token lifetime (default: 365)
- `CODE_ATTEMPTS`: Max verification attempts (default: 3)
- `BAD_ATTEMPTS_MINUTES`: Suspension window (default: 3)
- `FIXED_AUTH_CODE`: Fixed code for testing (bypasses SMS/email)

### Testing

Tests use Mocha + Chai + Supertest. Before running tests:
- MongoDB connection is established
- Database is reset using helper functions
- After tests, connection is closed

Run single test file:
```bash
npx mocha -r esm test/testAuth.js --exit
```

### Important Notes

- **ESM Support**: All imports use ES6 modules, executed via `node -r esm`
- **MongoDB Models**: Uses sistemium-data abstraction layer (not raw Mongoose)
- **User Agent Parsing**: Build version extracted from user-agent for feature flags
- **Redis Optional**: System works without Redis, just without caching
- **Dual Format**: `/roles` supports both JSON and XML output
- **SQL Directory**: Contains legacy SQL stored procedures for reference (not actively used)
