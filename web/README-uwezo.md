# Uwezo Application

## Environment Variables

Create a `.env.local` file in the root of the `apps/uwezo` directory with the following variables:

```env
# API Configuration
NEXT_API_URL=https://uwezo-api-qa.fusion.adm.ee
```

## Authentication

The application uses JWT-based authentication with the following flow:

1. User logs in with email and password
2. API returns access and refresh tokens
3. Tokens are stored in secure HTTP-only cookies
4. Access token is automatically refreshed when expired
5. All API requests include the access token in the Authorization header

### Features

#### Login

- Users can log in with email and password
- Successful login redirects to dashboard
- Failed login shows appropriate error messages

#### Signup

- Users can register with email and password
- Password confirmation is required
- Successful registration automatically logs in the user
- Uses email as username for the API

#### Password Reset

- Users can request a password reset by entering their email
- If the email exists, a reset link is sent
- Success/error messages are displayed to the user

#### Token Refresh

- Access tokens are automatically refreshed when they expire
- Refresh happens transparently in the middleware
- If refresh fails, user is redirected to login

### Error Handling

Authentication errors are displayed to users with appropriate messages:

- 401 errors show "Invalid email or password" (login) or redirect to login (other endpoints)
- 400 errors show "Please check your email and password"
- Other errors show the HTTP status text

## Session Management

Sessions are managed through:

- `lib/session.ts` - Server-side session management with token refresh
- `hooks/useSession.tsx` - Client-side session state
- `middleware.ts` - Route protection and automatic token refresh
- `lib/api/utils.ts` - API client with automatic auth headers
