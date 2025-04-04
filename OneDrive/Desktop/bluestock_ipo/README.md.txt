# 477117382842-s6l77uelagskpuiok78igmivb55ehsfv.apps.googleusercontent.com
//To implement **Google OAuth login** in your signup page and generate a **JWT token**, follow this step-by-step guide. 🚀  

---

## **✅ Step 1: Set Up Google OAuth Credentials**
1. Go to **Google Cloud Console** → [Google Developer Console](https://console.developers.google.com/)
2. Create a new project or select an existing one.
3. Navigate to **OAuth consent screen** → Configure it for your app.
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**.
5. Set the redirect URI:
   ```
   http://localhost:5000/auth/google/callback
   ```
6. Copy the **Client ID** and **Client Secret**.

---

## **✅ Step 2: Install Dependencies**
Run this in your backend:
```sh
npm install passport passport-google-oauth20 jsonwebtoken dotenv
```

---

## **✅ Step 3: Configure Google OAuth in Backend**
Create a file `auth.js` in your backend:
```js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../db.js"; // Your PostgreSQL database connection

dotenv.config();

// Configure Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
            scope: ["profile", "email"]
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Extract user data
                const { id, displayName, emails, photos } = profile;
                const email = emails[0].value;
                const profile_image = photos[0].value;

                // Check if user already exists
                const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

                let user;
                if (existingUser.rows.length > 0) {
                    user = existingUser.rows[0];
                } else {
                    // Insert new user
                    const insertQuery = `
                        INSERT INTO users (full_name, email, profile_image, role) 
                        VALUES ($1, $2, $3, 'user') RETURNING *;
                    `;
                    const result = await pool.query(insertQuery, [displayName, email, profile_image]);
                    user = result.rows[0];
                }

                // Generate JWT token
                const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
                    expiresIn: "7d",
                });

                return done(null, { user, token });

            } catch (err) {
                return done(err, null);
            }
        }
    )
);

// Serialize User
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

export default passport;
```

---

## **✅ Step 4: Create Google Auth Routes**
In your `routes/auth.js`:
```js
import express from "express";
import passport from "../config/auth.js"; // Import the auth setup

const router = express.Router();

// Redirect to Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback Route (Google redirects here)
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        const { user, token } = req.user;
        res.redirect(`http://localhost:3000/dashboard?token=${token}`); // Redirect to frontend with token
    }
);

export default router;
```

---

## **✅ Step 5: Use Authentication in Server**
Modify `server.js`:
```js
import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "./config/auth.js";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(
    session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## **✅ Step 6: Add Google Login Button in Frontend**
Modify your frontend **Signup Page**:
```jsx
import React from "react";

const Signup = () => {
    const handleGoogleLogin = () => {
        window.open("http://localhost:5000/auth/google", "_self");
    };

    return (
        <div>
            <h2>Sign Up</h2>
            <button onClick={handleGoogleLogin}>Continue with Google</button>
        </div>
    );
};

export default Signup;
```

---

## **✅ Step 7: Handle JWT Token in Frontend**
Once Google OAuth redirects to:
```
http://localhost:3000/dashboard?token=YOUR_JWT_TOKEN
```
Modify **Dashboard Page**:
```jsx
import React, { useEffect, useState } from "react";

const Dashboard = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const token = query.get("token");

        if (token) {
            localStorage.setItem("token", token);
            fetchUserData(token);
        }
    }, []);

    const fetchUserData = async (token) => {
        const res = await fetch("http://localhost:5000/user", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setUser(data);
    };

    return user ? <h1>Welcome, {user.full_name}</h1> : <h1>Loading...</h1>;
};

export default Dashboard;
```

---

## **✅ Step 8: Protect Routes Using JWT Middleware**
Modify **backend**:
```js
import jwt from "jsonwebtoken";

const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = decoded;
        next();
    });
};

export default authenticateJWT;
```

---

## **✅ Step 9: Get User Info from JWT**
Modify **routes/user.js**:
```js
import express from "express";
import authenticateJWT from "../middleware/auth.js";
import pool from "../db.js";

const router = express.Router();

router.get("/user", authenticateJWT, async (req, res) => {
    const user = await pool.query("SELECT full_name, email, profile_image FROM users WHERE id = $1", [req.user.id]);
    res.json(user.rows[0]);
});

export default router;
```

---

## **🔥 Now You Have:**
✅ Google OAuth Login  
✅ JWT Token Generation  
✅ Protected API Routes  
✅ Full Authentication Flow 🚀  

---

**🎯 Next Steps:**  
- **Deploy Backend** (Use Render/Vercel/Heroku)  
- **Use Refresh Tokens** for better security  
- **Improve UI** with a Google Login Button  

Let me know if you get stuck! 😃