# Authentication & Authorization

## Overview

The Strivers Platform uses **JWT (JSON Web Token)** based authentication with role-based access control (RBAC). Authentication is required for all API endpoints except login.

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                                           │
└─────────────────────────────────────────────────────────────────────────────┘

1. User enters email/password in LoginPage
                │
                ▼
2. Frontend: POST /api/auth/login
   { email, password }
                │
                ▼
3. Backend: Find user by email (include password field)
                │
                ▼
4. Backend: Compare password with bcrypt hash
                │
                ├─── Invalid ──> 401 Unauthorized
                │
                ▼
5. Backend: Generate JWT token (7 day expiry)
                │
                ▼
6. Frontend: Store token in localStorage
   Set user state in AuthContext
                │
                ▼
7. Redirect to role-appropriate page:
   - Admin → /
   - Employee → / (My Tasks)
```

---

## JWT Token

### Generation
```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);
```

### Payload
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "iat": 1706140800,
  "exp": 1706745600
}
```

### Configuration
- `JWT_SECRET`: Secret key (set in .env)
- `JWT_EXPIRES_IN`: Token expiration (default: 7d)

---

## Backend Middleware

### auth.js (`middleware/auth.js`)

Validates JWT token and attaches user to request.

```javascript
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    res.status(500).json({ message: 'Authentication failed.' });
  }
};
```

### roleCheck.js (`middleware/roleCheck.js`)

Validates user role for protected endpoints.

```javascript
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin only.' });
};

const hasRole = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      message: `Access denied. Required role(s): ${roles.join(', ')}`
    });
  };
};
```

### Usage in Routes
```javascript
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// Public route
router.post('/login', authController.login);

// Authenticated route
router.get('/me', auth, authController.getCurrentUser);

// Admin only
router.post('/register', auth, isAdmin, authController.register);
```

---

## User Roles

### Two Primary Roles

| Role | Description | Access |
|------|-------------|--------|
| `admin` | Administrator | Full access to all features |
| `employee` | Standard user | Tasks, time logs, quiz generator |

### isTeamMember Flag

A secondary flag that grants additional access regardless of role.

| User Type | role | isTeamMember | Access |
|-----------|------|--------------|--------|
| Super Admin | admin | true | Everything |
| Admin (read-only) | admin | false | Admin features, but not personal tasks/time logs |
| Team Member | employee | true | Tasks, time logs, quiz generator |
| External User | employee | false | Quiz generator only |

### Department Values
- `faculty`: Teachers (YouTube content creators)
- `tech`: Technical team
- `promotional`: Marketing/promotional team
- `owners_club`: Special access group

A user can belong to multiple departments (array field).

---

## Frontend Auth Implementation

### AuthContext (`context/AuthContext.jsx`)

Provides global auth state to all components.

**State**:
```javascript
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
```

**On Mount** (page refresh):
```javascript
useEffect(() => {
  const initAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data.user);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };
  initAuth();
}, []);
```

**Login Function**:
```javascript
const login = async (email, password) => {
  const response = await authAPI.login(email, password);
  const { user, token } = response.data;
  localStorage.setItem('token', token);
  setUser(user);
  return { user, token };
};
```

**Logout Function**:
```javascript
const logout = () => {
  localStorage.removeItem('token');
  setUser(null);
};
```

### Computed Properties
```javascript
const value = {
  user,
  loading,
  isAuthenticated: !!user,
  isAdmin: user?.role === 'admin',
  isEmployee: user?.role === 'employee',
  isTeamMember: user?.isTeamMember === true
};
```

### useAuth Hook
```javascript
import { useAuth } from './context/AuthContext';

const { user, isAdmin, isTeamMember, logout } = useAuth();
```

---

## Route Protection

### Frontend Protection

**App.jsx** - Redirect logic:
```jsx
function RedirectByRole() {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) return <CatLoader />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return <Layout />;
}
```

**LoginGuard** - Already logged in check:
```jsx
function LoginGuard() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" />;
  
  return <LoginPage />;
}
```

**Layout.jsx** - Role-based routing:
```jsx
<Routes>
  {isAdmin ? (
    // Admin routes
    <Route path="/" element={<AdminDashboard />} />
    <Route path="/employees" element={<EmployeesPage />} />
    // ...
  ) : (
    // Employee routes
    <Route path="/" element={<MyTasks />} />
    // ...
  )}
</Routes>
```

### Backend Protection

Every protected route uses middleware:
```javascript
router.use(auth);              // Require authentication
router.use(isAdmin);           // Require admin role
```

Or per-route:
```javascript
router.post('/register', auth, isAdmin, authController.register);
```

---

## Password Security

### Hashing
Passwords are hashed using bcrypt with 10 salt rounds:

```javascript
const bcrypt = require('bcryptjs');

userSchema.pre('save', async function() {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});
```

### Comparison
```javascript
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

### Schema Protection
Password is excluded from queries by default:
```javascript
password: {
  type: String,
  required: true,
  minlength: 6,
  select: false  // Never returned in queries
}
```

To include password in queries (for login):
```javascript
const user = await User.findOne({ email }).select('+password');
```

---

## Token Storage

### Current Implementation
- Token stored in `localStorage`
- Sent via `Authorization: Bearer <token>` header
- Removed on 401 response or manual logout

### Security Considerations
- `localStorage` is vulnerable to XSS attacks
- For production, consider:
  - HTTP-only cookies (more secure)
  - CSRF protection
  - Refresh token rotation

---

## Auto-Logout on Token Expiry

### Frontend Interceptor
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);
```

### AuthContext Listener
```javascript
const handleLogout = () => {
  setUser(null);
  localStorage.removeItem('token');
};
window.addEventListener('auth:logout', handleLogout);
```

When token expires:
1. API returns 401
2. Interceptor removes token
3. Dispatches `auth:logout` event
4. AuthContext clears user state
5. User redirected to login

---

## Creating New Users

### Via API (Admin Only)
```javascript
POST /api/auth/register
{
  "name": "New Employee",
  "email": "new@strivers.co.in",
  "password": "securepass123",
  "role": "employee",
  "department": ["tech"],
  "isTeamMember": true
}
```

### Validation Rules
- Name: required, max 100 characters
- Email: required, valid format, unique
- Password: required, min 6 characters
- Role: 'admin' or 'employee' (default: 'employee')
- Department: array of valid values
- isTeamMember: boolean (default: true for employees)

---

## Security Best Practices

### Implemented
✅ Password hashing with bcrypt
✅ JWT with expiration
✅ Role-based access control
✅ Password field hidden by default
✅ Input validation
✅ CORS configuration
✅ Auto-logout on token expiry

### Recommendations for Production
⚠️ Move to HTTP-only cookies
⚠️ Add rate limiting
⚠️ Implement refresh tokens
⚠️ Add password complexity requirements
⚠️ Add email verification
⚠️ Add 2FA for admin accounts
⚠️ Add password reset functionality
⚠️ Use HTTPS only
⚠️ Set secure cookie flags
