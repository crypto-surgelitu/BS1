# BS1 Project Agent Instructions

## Project Context
This is a Room Booking System (BS1) with:
- **Backend**: Node.js/Express on port 3000
- **Frontend**: React/Vite on port 5173  
- **Database**: MySQL (XAMPP)

## Critical Rules

### 1. Environment & Working Directory
- ALWAYS run commands from `C:\Users\ANTONY\Documents\BS1\backend` for backend
- NEVER rely on cwd - always use `workdir` parameter explicitly
- The .env file loads correctly IF dotenv.config() is called first

### 2. Starting Backend Server
- Check if port 3000 is already in use BEFORE starting
- Use this command pattern:
  ```
  cd backend && node server.js
  ```
- If EADDRINUSE error, find and kill the process first, then restart
- The backend works - do NOT keep retrying if it fails to start

### 3. Testing Endpoints
- Use curl for testing (does NOT automatically include cookies)
- For signup/login, use cookies to hold CSRF:
  ```
  curl -c cookies.txt -b cookies.txt http://localhost:3000/csrf-token
  curl -b cookies.txt -c cookies.txt -X POST ... -H "X-CSRF-Token: $(grep csrf_token cookies.txt | awk '{print $7}')"
  ```

### 4. Database Access
- MySQL credentials: DB_USER=root, DB_PASS=(empty), DB_NAME=swahilipot_booking
- Connection works when dotenv loads properly in backend dir

### 5. Admin Accounts (Fixed)
- **Admin**: admin@swahilipot.co.ke / admin@123  
- **Superadmin**: superadmin@bs1.com / superadmin@123

### 6. CSRF Middleware
- Currently DISABLED (returns next() immediately)
- If re-enabling, the server MUST be restarted for changes to take effect
- Code is in: `backend/middleware/csrf.js`

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| EADDRINUSE | Kill existing node process, restart |
| DB connection fails | cd to backend dir before running |
| CSRF error on POST | Server needs restart, or check cookies |
| Env variables undefined | Ensure dotenv.config() runs from backend dir |

## Skills Available

### Debugging
- Check port usage: `netstat -ano | findstr ":3000"`
- Test server health: `curl http://localhost:3000/health`
- View running node: Find process on port, check its output

### Database
- Direct query via backend:
  ```js
  const {dbPromise} = require('./config/db');
  const db = await dbPromise;
  await db.query('SELECT * FROM users');
  ```

### Server Management
- Start: `cd backend && node server.js`
- Stop: Ctrl+C or kill process
- Test: `curl http://localhost:3000/health`

## Important Reminders
1. ALWAYS verify working directory before running commands
2. ALWAYS check port availability before starting server
3. Test endpoints with curl BEFORE asking user to test
4. If server "doesn't start" - first check if already running
5. Don't hallucinate responses - verify with actual tests
6. Keep responses SHORT and direct
7. **NEVER launch frontend or backend servers without user permission. If testing is needed, ask the user to run the server manually and report results.**

## Verification Gates (MUST complete before proceeding)

### Server Start Gate
1. Run: `cd backend && node server.js &`
2. Wait 2 seconds, THEN verify: `curl -s http://localhost:3000/health`
3. If health check fails → server did NOT start. Stop. Report actual error output.
4. NEVER report "server started" without a successful health check response.

### Curl Test Gate
- ALWAYS capture full response: `curl -sv ...` (verbose)
- Report the EXACT status code and body received
- If curl returns nothing or errors → say so. Do NOT invent a response.

---

## Windows curl Specifics
- In Git Bash: use `curl.exe` explicitly to avoid PowerShell alias conflicts
- Single quotes DON'T work in CMD — use double quotes for JSON body
- Git Bash flag prefix: use `//` not `/` for Windows-style flags
- CSRF token extraction on Git Bash: and also fix the frontend server. check for error on the server logs