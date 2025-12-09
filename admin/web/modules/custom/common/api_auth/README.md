# UWEZO Auth API Module

## JWT Authentication

The JWT authentication system in this module implements the following security features:

### Token Storage and Management

- **Complete Token Lifecycle Tracking**: All tokens are stored in the database with their complete lifecycle information.
- **Token Revocation**: Administrators can revoke tokens through the admin UI or programmatically.
- **Session Limiting**: Option to limit the number of active refresh tokens per user, automatically revoking oldest sessions.
- **IP and User Agent Tracking**: Stores client information with each token for security auditing.

### Token Security Features

- **One-Time Use Refresh Tokens**: When a refresh token is used to obtain a new access token, the used refresh token and its entire token family are immediately removed from the database to prevent replay attacks.
- **Automatic Cleanup**: Expired tokens are automatically purged from the database during cron runs.
- **Password Change Protection**: When a user changes their password, all existing tokens are completely removed from the database.
- **Secret Rotation Protection**: When JWT secret keys are changed in the configuration, all existing tokens are automatically removed.
- **Secure Logout Mechanism**: API provides a dedicated logout endpoint that removes all tokens for a user.
- **Configurable Expiration Times**: Both access and refresh token expiration times can be configured.
- **Strict Token Validation**: Enforces validation of all required JWT claims.

## Administration

### Configuration

JWT token settings can be configured at `/admin/config/services/uwezo-auth`, including:

- Access and refresh token expiration times
- Secret keys for signing tokens
- Security settings such as strict validation
- Token limiting per user

### Token Management

The module provides a token management interface at `/admin/config/services/uwezo-auth/tokens` that allows administrators to:

- View all tokens with detailed information (user, IP, expiration date, status)
- Revoke individual tokens
- Revoke all tokens at once
- Filter and sort tokens by various criteria

When JWT secret keys are changed in the configuration, all existing tokens are automatically removed from the database for security reasons.

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/user/login` | POST | User login to obtain tokens |
| `/api/v1/user/token/refresh` | POST | Refresh an access token using a refresh token |
| `/api/v1/user/logout` | POST | Log out and remove all user tokens |
| `/api/v1/user/register` | POST | Register a new user |

### Login

**Endpoint:** `/api/v1/user/login`  
**Method:** POST

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "token_type": "Bearer"
  },
  "meta": {
    "timestamp": 1234567890,
    "version": "v1"
  }
}
```

### Token Refresh

**Endpoint:** `/api/v1/user/token/refresh`  
**Method:** POST

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "token_type": "Bearer"
  },
  "meta": {
    "timestamp": 1234567890,
    "version": "v1"
  }
}
```

### Logout

**Endpoint:** `/api/v1/user/logout`  
**Method:** POST  
**Headers:** Authorization: Bearer {access_token}

**Response:**
```json
{
  "data": {
    "message": "Successfully logged out",
    "removed_tokens": 3
  },
  "meta": {
    "timestamp": 1234567890,
    "version": "v1"
  }
}
```

## Token Lifecycle

1. **Login**: User logs in and receives an access token and a refresh token (a token family).
2. **Access**: Access token is used to authorize API requests.
3. **Refresh**: When the access token expires, the refresh token can be used once to obtain a new pair of tokens. The used refresh token is immediately invalidated, and a new token family is created.
4. **Complete Removal**: During logout, the entire token family (access token + refresh token) is completely removed from the database.
5. **Automatic Cleanup**: Expired tokens are automatically purged from the database during cron runs.

## Configuration

JWT settings can be configured at `/admin/config/services/uwezo-auth`.

## Security Recommendations

1. **Token Lifetime Management**:
   - Keep access token expiration times short (5-15 minutes recommended)
   - Set refresh token expirations based on your security requirements (1-7 days recommended)
   - Consider your application's sensitivity when setting these values

2. **Secure Storage**:
   - Store refresh tokens in secure HTTP-only cookies with the Secure flag enabled
   - Keep access tokens in memory (never in localStorage or sessionStorage)
   - For mobile apps, use secure storage options provided by the platform

3. **Transport Security**:
   - Always use HTTPS for all API endpoints
   - Implement proper HSTS headers on your server
   - Consider implementing certificate pinning for mobile applications

4. **Token Handling**:
   - Implement automatic token refresh logic that activates shortly before access tokens expire
   - Always call the logout endpoint when users sign out
   - Handle 401 responses properly with refresh attempts

5. **Monitoring**:
   - Regularly review token usage patterns in logs
   - Set up alerts for unusual token activity (multiple refreshes, geographically dispersed usage)
   - Periodically purge old tokens beyond their useful lifetime

## Best Practices for Clients

- Store the refresh token securely (e.g., in secure HTTP-only cookies).
- Keep access tokens in memory whenever possible.
- Implement automatic token refresh logic that activates shortly before the access token expires.
- For logout, always call the logout endpoint with the access token in the Authorization header.
- Implement proper error handling for token expiration and automatic refresh on 401 responses.

## Command Line Management

The module provides several Drush commands for managing tokens from the command line:

### Available Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `drush uwezo:token-stats` | `uwezo-token-stats` | Display statistics about tokens in the database |
| `drush uwezo:purge-tokens` | `uwezo-purge-tokens` | Remove all expired tokens from the database |
| `drush uwezo:remove-user-tokens [uid]` | `uwezo-remove-user-tokens` | Remove all tokens for a specific user |
| `drush uwezo:remove-all-tokens` | `uwezo-remove-all-tokens` | Remove all tokens from the database (with confirmation) |

### Examples

**View token statistics:**
```bash
drush uwezo:token-stats
```

**Purge expired tokens:**
```bash
drush uwezo:purge-tokens
```

**Remove tokens for a specific user:**
```bash
drush uwezo:remove-user-tokens 42
```

**Remove all tokens:**
```bash
drush uwezo:remove-all-tokens
```

## Implementation Approach

This module implements a comprehensive JWT (JSON Web Token) authentication system with several key components:

### Database Structure

Tokens are stored in a single database table (`uwezo_active_tokens`) with fields for:

- Token identifier (jti)
- User ID
- Token type (access or refresh)
- Token hash (for security)
- Issued timestamp
- Expiration timestamp
- IP address and user agent of the client
- Revocation status
- Parent-child relationships between tokens

### Token Families

Tokens are organized into families:
- Each login creates an access token and a refresh token
- The refresh token is linked to its parent access token
- When a refresh operation occurs, the entire token family is removed and a new family is created
- This approach prevents the "refresh token rotation attack"

### Complete Token Removal

Unlike traditional approaches that just mark tokens as "revoked" but keep them in the database:
- This implementation completely removes tokens when they're no longer needed
- Tokens are removed on logout, refresh operations, and password changes
- Only tokens actively in use remain in the database
- This approach reduces database bloat and improves security

### Security Features

The implementation includes several advanced security features:
- Token rotation with complete removal of used tokens
- Automatic cleanup of expired tokens
- Automatic invalidation of all tokens when secrets change
- Strict validation of token claims
- Comprehensive token tracking and management


## Endpoints

### Authentication Endpoints

#### User Registration
```http
POST /api/v1/user/register
```

Register a new user account and receive authentication tokens.

##### Request Format
```json
{
  "name": [{"value": "username"}],
  "mail": [{"value": "user@example.com"}],
  "pass": [{"value": "password"}]
}
```

##### Response Format
```json
{
  "data": {
    "mail": "user@example.com",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "token_type": "Bearer",
    "status": "active"
  },
  "meta": {
    "timestamp": 1234567890,
    "version": "v1"
  }
}
```

#### User Login
```http
POST /api/v1/user/login
```

Authenticate and receive JWT tokens.

##### Request Format
```json
{
  "username": "username",
  "password": "password"
}
```

##### Response Format
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "token_type": "Bearer"
  },
  "meta": {
    "timestamp": 1234567890,
    "version": "v1"
  }
}
```

#### Token Refresh
```http
POST /api/v1/user/token/refresh
```

Refresh expired access tokens.

##### Request Format
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

##### Response Format
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "token_type": "Bearer"
  },
  "meta": {
    "timestamp": 1234567890,
    "version": "v1"
  }
}
```

#### Password Reset Request
```http
POST /api/v1/user/password/reset-request
```

Request a password reset link.

##### Request Format
```json
{
  "email": "user@example.com"
}
```

##### Response Format
```json
{
  "data": {
    "message": "If the email exists, a password reset link has been sent."
  },
  "meta": {
    "timestamp": 1234567890,
    "version": "v1"
  }
}
```

##### Rate Limiting
- Maximum 3 requests per hour per email address
- 5-minute cooldown between requests

#### Password Reset
```http
POST /api/v1/user/password/reset
```

Reset password using the reset link parameters.

##### Request Format
```json
{
  "uid": "123",
  "timestamp": "1234567890",
  "hash": "abc123...",
  "new_password": "NewSecurePassword123!"
}
```

##### Response Format
```json
{
  "data": {
    "message": "Password has been reset successfully."
  },
  "meta": {
    "timestamp": 1234567890,
    "version": "v1"
  }
}
```

##### Password Requirements
- Minimum 8 characters
- Must contain at least one number
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one special character

##### Security Features
- Rate limiting on reset requests
- One-time use reset tokens
- Token expiration (configurable in Drupal settings)
- Secure hash verification
- Prevention of email enumeration
- JWT token revocation on password change

### Protected Endpoints

#### User Profile
```http
GET /api/v1/user/profile
```

Retrieve profile information for the authenticated user. This endpoint requires JWT authentication.

##### Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

##### Response Format
```json
{
  "data": {
    "email": "user@example.com",
    "name": "User Name",
    "roles": ["authenticated", "editor"],
    "created": "2023-08-25T12:00:00+00:00",
    "last_access": "2023-08-26T15:30:45+00:00"
  },
  "meta": {
    "timestamp": 1234567890,
    "version": "v1"
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the GPL v2.0 or later.
