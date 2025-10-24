# PHA Integration Guide

This guide explains how to integrate PHA (Phone Authorization) authentication into your web or mobile client application.

## Overview

PHA provides a two-step authentication flow:

1. **Initiate authentication** - User provides phone number or email, receives a verification code
2. **Verify code** - User enters the code, receives a long-lived access token

## Base URL

Replace `{BASE_URL}` with your PHA server URL (e.g., `https://pha.example.com`).

## Authentication Flow

### Step 1: Initiate Authentication

Request a verification code for an existing user.

**Endpoint:** `POST /auth`

**Request Body:**

```json
{
  "mobileNumber": "+370612345678"
}
```

OR

```json
{
  "email": "user@example.com"
}
```

**IMPORTANT:** If the user account has an `env` field specified (e.g., "staging", "dev"), you **must** include the `programCode` parameter:

```json
{
  "mobileNumber": "+370612345678",
  "programCode": "myapp"
}
```

The system will verify that:
1. A Program exists with the provided `programCode`
2. The Program's `env` matches the account's `env`

If either condition fails, no SMS/email will be sent and the request will be rejected with a `403` error.

**Response (200 OK):**

```json
{
  "ID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

The `ID` is a temporary token identifier that you'll use in the next step. The user will receive a 6-digit verification code via SMS or email.

**Error Responses:**

- `404` - Phone number or email not found
- `403` - Account suspended (too many failed attempts), or programCode is required/invalid for this account
- `400` - Invalid request

### Step 2: Verify Code and Get Access Token

Submit the verification code to receive a long-lived access token.

**Endpoint:** `POST /auth`

**Request Body:**

```json
{
  "ID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "smsCode": "123456"
}
```

OR use `emailCode` for email verification:

```json
{
  "ID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "emailCode": "123456"
}
```

OR use generic `code` field:

```json
{
  "ID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "code": "123456"
}
```

**Optional:** Include `programCode` to receive application-specific configuration in the response:

```json
{
  "ID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "code": "123456",
  "programCode": "myapp"
}
```

**Note:** If the account has an `env` field, the `programCode` was already validated in Step 1 when requesting the verification code.

**Response (200 OK):**

```json
{
  "ID": 1,
  "accessToken": "abcdefgh12345678@pha",
  "apiUrl": "https://socket2.sistemium.com/socket.io-client",
  "name": "John Doe",
  "redirectUri": "org/Entity",
  "config": {}
}
```

**Response Fields:**

- `ID` - User's numeric account ID
- `accessToken` - Long-lived access token (use for subsequent API calls)
- `apiUrl` - API server URL for this organization
- `name` - User's display name
- `redirectUri` - Suggested redirect path after authentication
- `config` - Application-specific configuration (if `programCode` was provided)

**Error Responses:**

- `400` - Missing required parameters (ID, code)
- `401` - Invalid verification code, auth code expired (max 3 attempts exceeded), or invalid auth token ID

## User Registration

For new users who don't have an account yet.

### Step 1: Initiate Registration

**Endpoint:** `POST /register`

**Request Body:**

```json
{
  "mobileNumber": "+370612345678",
  "name": "John Doe"
}
```

OR with email:

```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

OR with both:

```json
{
  "mobileNumber": "+370612345678",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response (200 OK):**

```json
{
  "ID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Error Responses:**

- `403` - Account already exists
- `400` - Missing required fields (name, mobileNumber or email)

### Step 2: Confirm Registration

**Endpoint:** `POST /confirm`

**Request Body:**

```json
{
  "ID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "code": "123456"
}
```

**Response (200 OK):**

```json
{
  "accessToken": "abcdefgh12345678@pha",
  "email": "user@example.com",
  "mobileNumber": "+370612345678",
  "name": "John Doe",
  "accountId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

## Using Access Tokens

Once you have an access token, use it to access protected resources.

### Get User Roles and Permissions

**Endpoint:** `GET /roles`

**Authentication Methods:**

1. **Authorization Header (Recommended):**

```http
GET /roles
Authorization: abcdefgh12345678@pha
```

2. **Query Parameter:**

```http
GET /roles?access-token=abcdefgh12345678@pha
```

OR

```http
GET /roles?access_token=abcdefgh12345678@pha
```

3. **Path Parameter:**

```http
GET /roles/abcdefgh12345678@pha
```

**Response (200 OK):**

```json
{
  "id": "abcdefgh12345678@pha",
  "account": {
    "code": "1",
    "name": "John Doe",
    "email": "user@example.com",
    "mobile-number": "+370612345678",
    "org": "myorg",
    "authId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "token": {
    "expiresAt": "2025-10-22 12:00:00",
    "expiresIn": 31536000
  },
  "roles": {
    "authenticated": true,
    "org": "myorg",
    "stc": true,
    "salesman": [123, 456],
    "supervisor": ["s1", "s2"],
    "auth": "*"
  }
}
```

**XML Format:**

For XML response, use `/roles.xml`:

```http
GET /roles.xml?access-token=abcdefgh12345678@pha
```

**Response (200 OK):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<response xmlns="http://unact.net/xml/oauth">
  <account>
    <code>1</code>
    <name>John Doe</name>
    <email>user@example.com</email>
    <mobile-number>+370612345678</mobile-number>
    <org>myorg</org>
    <authId>a1b2c3d4-e5f6-7890-abcd-ef1234567890</authId>
  </account>
  <token>
    <expiresAt>2025-10-22 12:00:00</expiresAt>
    <expiresIn>31536000</expiresIn>
  </token>
  <roles>
    <role>
      <code>authenticated</code>
    </role>
    <role>
      <code>salesman</code>
      <data>[123,456]</data>
    </role>
  </roles>
</response>
```

**Error Responses:**

- `401` - Invalid or missing access token
- `403` - Account blocked

## Understanding Roles

The `roles` object contains permissions and metadata for the authenticated user:

- **Boolean roles**: `authenticated: true` - Simple permission flags
- **Numeric roles**: `salesman: 123` - Single numeric value
- **Array roles**: `salesman: [123, 456]` - Multiple values
- **String roles**: `auth: "*"` - String values (often used for wildcards)
- **Object roles**: Custom data structures (e.g., feature configurations)

### Common Role Examples

```javascript
{
  "authenticated": true,      // User is logged in
  "org": "myorg",            // Organization identifier
  "stc": true,               // Base product access
  "salesman": [123, 456],    // Assigned salesman IDs
  "supervisor": ["s1", "s2"], // Supervisor groups
  "auth": "*",               // Admin authentication rights
  "stcTabs": [               // Feature-specific configurations
    { "name": "Dashboard", "url": "/dash" }
  ]
}
```

## Client Implementation Example

### JavaScript/TypeScript

```javascript
class PHAClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // Step 1: Request verification code
  async requestCode(mobileNumber, email, programCode = null) {
    const body = {};
    if (mobileNumber) body.mobileNumber = mobileNumber;
    if (email) body.email = email;
    if (programCode) body.programCode = programCode;

    const response = await fetch(`${this.baseURL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 403 && errorText.includes('programCode')) {
        throw new Error('This account requires a programCode parameter');
      }
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const { ID } = await response.json();
    return ID;
  }

  // Step 2: Verify code and get token
  async verifyCode(ID, code, programCode = null) {
    const body = { ID, code };
    if (programCode) body.programCode = programCode;

    const response = await fetch(`${this.baseURL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Verification failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get user roles
  async getRoles(accessToken) {
    const response = await fetch(`${this.baseURL}/roles`, {
      headers: { 'Authorization': accessToken }
    });

    if (!response.ok) {
      throw new Error(`Failed to get roles: ${response.statusText}`);
    }

    return await response.json();
  }

  // Register new user
  async register(name, mobileNumber, email) {
    const body = { name };
    if (mobileNumber) body.mobileNumber = mobileNumber;
    if (email) body.email = email;

    const response = await fetch(`${this.baseURL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    const { ID } = await response.json();
    return ID;
  }

  // Confirm registration
  async confirmRegistration(ID, code) {
    const response = await fetch(`${this.baseURL}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ID, code })
    });

    if (!response.ok) {
      throw new Error(`Confirmation failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Usage example
const client = new PHAClient('https://pha.example.com');

// Login flow (without env)
const ID = await client.requestCode('+370612345678');
// User receives SMS with code
const authData = await client.verifyCode(ID, '123456');
localStorage.setItem('accessToken', authData.accessToken);

// Login flow for account with env (e.g., staging)
try {
  const ID = await client.requestCode('+370612345678', null, 'myapp');
  // User receives SMS with code
  const authData = await client.verifyCode(ID, '123456', 'myapp');
  localStorage.setItem('accessToken', authData.accessToken);
} catch (error) {
  if (error.message.includes('programCode')) {
    console.error('This account requires a valid programCode');
  }
}

// Get roles
const roles = await client.getRoles(authData.accessToken);
console.log('User roles:', roles.roles);
```

## Important Notes

### Security Considerations

1. **Store access tokens securely** - Use httpOnly cookies or secure storage
2. **Use HTTPS** - All API calls must use HTTPS in production
3. **Token expiration** - Tokens expire after TOKEN_LIFETIME_DAYS (default 365 days)
4. **Rate limiting** - After 3 failed verification attempts, the code expires
5. **Account suspension** - Multiple auth requests within BAD_ATTEMPTS_MINUTES (default 3) will suspend the account temporarily

### Best Practices

1. **User-Agent header** - Include a descriptive User-Agent header for feature flagging:

   ```javascript
   headers: {
     'User-Agent': 'MyApp/1.0.0 (Build 250)'
   }
   ```

2. **Token storage** - Store the access token and reuse it for all subsequent requests

3. **Role caching** - The `/roles` endpoint is cached (default 300 seconds), so roles may not update immediately

4. **Error handling** - Implement proper error handling for network failures and invalid responses

5. **Retry logic** - Implement exponential backoff for failed requests

6. **Token refresh** - Monitor `token.expiresIn` and prompt for re-authentication before expiration

### Testing

For testing environments, you can set `FIXED_AUTH_CODE` environment variable to bypass SMS/email sending:

```bash
FIXED_AUTH_CODE=123456
```

This will always use "123456" as the verification code instead of generating random codes.

## Support

For issues or questions, please contact the PHA service administrator or refer to the [project repository](https://github.com/Sistemium/pha).
