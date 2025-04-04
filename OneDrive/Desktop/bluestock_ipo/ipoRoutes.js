import express from "express";
import cors from "cors";
import pool from "./config/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authenticate from "./middleware/auth.js";
import cookieParser from "cookie-parser";

const router = express.Router();
router.use(cors());
router.use(express.json());
router.use(cookieParser());

const PORT = process.env.PORT || 8080;

// Test API
router.get("/test", (_, res) => {
    res.send(`Bluestock IPO API is running on port ${PORT}`);
});

// Get all users
router.get("/users", authenticate, async (req, res, next) => {
    try {
        let { page, limit } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            "SELECT id, full_name, email FROM users ORDER BY id ASC LIMIT $1 OFFSET $2",
            [limit, offset]
        );

        res.json({
            status: "success",
            totalUsers: result.rows.length,
            page,
            limit,
            users: result.rows
        });
    } catch (err) {
        next(err); // Passes error to the global error handler
    }
});

// Get user by ID
router.get("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID is a positive integer
        if (!/^\d+$/.test(id)) {
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        const result = await pool.query("SELECT id,full_name, email FROM users WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ status: "success", user: result.rows[0] });

    } catch (err) {
        console.error("Error fetching user:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// Get Watchlist by User ID
router.get("/watchlists/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        const result = await pool.query(`
            SELECT watchlists.*, ipos.company_id, companies.name AS company_name 
            FROM watchlists
            JOIN ipos ON watchlists.ipo_id = ipos.id
            JOIN companies ON ipos.company_id = companies.id
            WHERE watchlists.user_id = $1
        `, [user_id]);

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get Subscriptions 
// Dummy IPO Data
const iposubsData = [
    { id: 1, company: "ABC Ltd.", price: 500, lot_size: 10, subscription: 125, closing_date: "2024-04-05" },
    { id: 2, company: "XYZ Corp.", price: 320, lot_size: 15, subscription: 90, closing_date: "2024-04-10" },
    { id: 3, company: "LMN Industries", price: 250, lot_size: 12, subscription: 110, closing_date: "2024-04-15" }
];
router.get("/subscriptions", async (req, res) => {
    res.json(iposubsData);
});

// Get Transactions by User ID
router.get("/transactions/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        const result = await pool.query(`
            SELECT transactions.*, ipos.company_id, companies.name AS company_name 
            FROM transactions
            JOIN ipos ON transactions.ipo_id = ipos.id
            JOIN companies ON ipos.company_id = companies.id
            WHERE transactions.user_id = $1
        `, [user_id]);

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
// Fetch notifications
router.get("/notifications", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM notifications");

      res.json({
        status: "success",
        notifications: result.rows // Ensure correct key name
      });

    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
});
  
// Register a new user
router.post("/register", async (req, res) => {
    try {
        const { full_name, email, password, phone_number, profile_image, role } = req.body;

        // Check if the email or phone number already exists
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1 OR phone_number = $2",
            [email, phone_number]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "Email or Phone Number already exists" });
        }

        // Hash the password before storing it
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user into the database
        const insertUserQuery = `
            INSERT INTO users (full_name, email, password, phone_number, profile_image, role) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;

        const result = await pool.query(insertUserQuery, [
            full_name, email, hashedPassword, phone_number, profile_image, role
        ]);

        res.status(201).json({ message: "User registered successfully", user: result.rows[0] });

    } catch (err) {
        console.error("Error in /register:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Check if user exists
      const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userQuery.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      const user = userQuery.rows[0];
  
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
  
      // Set the token in an HttpOnly cookie
      res.cookie('authToken', token, {
        httpOnly: true, // Accessible only by the server
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        sameSite: 'Strict', // CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
  
      // Send user information in the response body
      res.status(200).json({
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
        message: 'Login successful',
      });
    } catch (err) {
      console.error('Error in /login:', err);
      res.status(500).json({ message: 'Server Error' });
    }
  });

// Update User
router.put("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, phone_number, profile_image, role } = req.body;

        // Check if user exists
        const userQuery = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update user
        await pool.query(
            "UPDATE users SET full_name = $1, email = $2, phone_number = $3, profile_image = $4, role = $5 WHERE id = $6",
            [full_name, email, phone_number, profile_image, role, id]
        );

        res.json({ message: "User updated successfully" });
    } catch (err) {
        console.error("Error in /users/:id (PUT):", err);
        res.status(500).json({ message: "Server Error" });
    }
});

router.get("/protected-route", authenticate, (req, res) => {
    res.json({ message: "You have access!", user: req.user });
});

//IPO CRUD Operations
// Create IPO

import { format } from 'date-fns';

router.post('/ipo',  async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            company_id,
            api_source_id,
            price_per_ipo,
            price_band,
            issue_size,
            issue_type,
            opening_date,
            closing_date,
            created_at,
            status,
            listing_price,
            listing_gain,
            CMP,
            current_return,
            RHP,
            DRHP
        } = req.body;

        // Validate required fields
        if (!company_id || !api_source_id || !price_per_ipo || !issue_size || !opening_date || !closing_date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Format dates to 'yyyy-MM-dd HH:mm:ss' for PostgreSQL compatibility
        const formattedOpeningDate = format(new Date(opening_date), 'yyyy-MM-dd HH:mm:ss');
        const formattedClosingDate = format(new Date(closing_date), 'yyyy-MM-dd HH:mm:ss');
        const formattedCreatedAt = created_at ? format(new Date(created_at), 'yyyy-MM-dd HH:mm:ss') : null;

        // Insert into the ipos table
        const insertIpoText = `
            INSERT INTO ipos (
                company_id,api_source_id, price_per_ipo, price_band, issue_size, issue_type, opening_date, closing_date, created_at, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING company_id;
        `;
        const insertIpoValues = [
             company_id,api_source_id, price_per_ipo, price_band, issue_size, issue_type,
            formattedOpeningDate, formattedClosingDate, formattedCreatedAt, status
        ];
        const ipoResult = await client.query(insertIpoText, insertIpoValues);
        const ipo_id = ipoResult.rows[0].id;

        // Insert into the ipo_details table
        const insertDetailsText = `
            INSERT INTO ipo_details (
                listing_price, listing_gain, CMP, current_return, RHP, DRHP
            ) VALUES ($1, $2, $3, $4, $5, $6);
        `;
        const insertDetailsValues = [listing_price, listing_gain, CMP, current_return, RHP, DRHP];
        await client.query(insertDetailsText, insertDetailsValues);

        await client.query('COMMIT');
        res.status(201).json({ message: 'IPO created successfully', ipo_id });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating IPO:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    } finally {
        client.release();
    }
});
// Get all IPOs with full column data
router.get("/ipos",  async (req, res) => {
    try {
        let { page, limit } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const offset = (page - 1) * limit;

        // Fetch all columns from ipos table
        const query = `SELECT * FROM ipos ORDER BY opening_date DESC LIMIT $1 OFFSET $2`;
        const result = await pool.query(query, [limit, offset]);

        // Get total count for pagination
        const countQuery = "SELECT COUNT(*) FROM ipos";
        const countResult = await pool.query(countQuery);
        const totalRows = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalRows / limit);

        res.json({
            page,
            totalPages,
            totalRecords: totalRows,
            ipos: result.rows
        });

    } catch (error) {
        console.error("Error fetching IPOs:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});


// Get single IPO by Id
router.get("/ipos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT ipos.*, 
                   companies.name AS company_name, 
                   ipos.company_logo_url AS company_logo_url 
            FROM ipos
            JOIN companies ON ipos.company_id = companies.id
            WHERE ipos.id = $1
        `, [id]); // Correct parameterized query format

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "IPO not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching IPO:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

import { marked } from 'marked'; // Import marked to convert Markdown to HTML

// Route to fetch IPO details by ID
router.get('/ipo-details/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT ipo_info FROM ipo_details WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'IPO not found' });
        }

        res.json({
            ipo_info: marked.parse(result.rows[0].ipo_info) // Convert Markdown to HTML
        });

    } catch (err) {
        console.error('Error fetching IPO details:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update IPO
router.put("/ipo/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { company_id, api_source_id, price_per_ipo, total_shares, opening_date, closing_date } = req.body;

        const query = `
            UPDATE ipos 
            SET company_id = $1, api_source_id = $2, price_per_ipo = $3, total_shares = $4, opening_date = $5, closing_date = $6, last_updated = CURRENT_TIMESTAMP
            WHERE id = $7 RETURNING *`;

        const values = [company_id, api_source_id, price_per_ipo, total_shares, opening_date, closing_date, id];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "IPO not found" });
        }

        res.status(200).json({ message: "IPO updated successfully", ipo: result.rows[0] });
    } catch (error) {
        console.error("Error updating IPO:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// Delete IPO
router.delete("/ipo/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM ipos WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "IPO not found" });
        }

        res.status(200).json({ message: "IPO deleted successfully" });
    } catch (error) {
        console.error("Error deleting IPO:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

//Implement Search by Name, Date, or Price Range
router.get("/ipos/search", authenticate, async (req, res) => {
    try {
        const { name, startDate, endDate, minPrice, maxPrice } = req.query;
        let query = `SELECT * FROM ipos WHERE 1=1`;
        let values = [];
        let index = 1;

        // Search by Company Name (Case-Insensitive)
        if (name && typeof name === "string") {
            query += ` AND EXISTS (
                SELECT 1 FROM companies 
                WHERE companies.id = ipos.company_id 
                AND companies.name ILIKE $${index}
            )`;
            values.push(`%${name.trim()}%`);
            index++;
        }


        // Search by Date Range
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate).toISOString().split("T")[0] : null;
            const end = endDate ? new Date(endDate).toISOString().split("T")[0] : null;

            if (start && end) {
                query += ` AND opening_date BETWEEN $${index} AND $${index + 1}`;
                values.push(start, end);
                index += 2;
            } else if (start) {
                query += ` AND opening_date >= $${index}`;
                values.push(start);
                index++;
            } else if (end) {
                query += ` AND opening_date <= $${index}`;
                values.push(end);
                index++;
            }
        }

        // Search by Price Range
        if (minPrice || maxPrice) {
            const min = minPrice ? parseFloat(minPrice) : null;
            const max = maxPrice ? parseFloat(maxPrice) : null;

            if (!isNaN(min) && !isNaN(max)) {
                query += ` AND price_per_ipo BETWEEN $${index} AND $${index + 1}`;
                values.push(min, max);
                index += 2;
            } else if (!isNaN(min)) {
                query += ` AND price_per_ipo >= $${index}`;
                values.push(min);
                index++;
            } else if (!isNaN(max)) {
                query += ` AND price_per_ipo <= $${index}`;
                values.push(max);
                index++;
            }
        }

        query += " ORDER BY opening_date DESC";
        const result = await pool.query(query, values);

        res.json({ ipos: result.rows });

    } catch (error) {
        console.error("Error searching IPOs:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Get IPO Dashboard Data
router.get("/ipo-dashboard", async (_, res) => {
    try {
        const query = `
            SELECT ipos.company_id, ipos.api_source_id, ipos.price_per_ipo,status, ipos.total_shares, 
                   ipos.opening_date, ipos.closing_date, ipos.status,
                   companies.name AS company_name, companies.logo_url
            FROM ipos
            JOIN companies ON ipos.company_id = companies.id
            ORDER BY ipos.opening_date ASC;
        `;

        const result = await pool.query(query);

        // Categorize IPOs
        const activeIPOs = [];
        const upcomingIPOs = [];
        const pastIPOs = [];

        // Get current date-time in UTC
        const now = new Date();
        console.log(`🕒 Current Time: ${now.toISOString()}`);

        result.rows.forEach((ipo) => {
            const openingDate = new Date(ipo.opening_date);
            const closingDate = new Date(ipo.closing_date);

            console.log(`🔍 IPO ${ipo.id} - Opening: ${openingDate.toISOString()}, Closing: ${closingDate.toISOString()}, Now: ${now.toISOString()}`);

            if (openingDate <= now && closingDate >= now) {
                activeIPOs.push({ ...ipo, status: "Active" }); // Add status as a property to the IPO object
            }
            else if (openingDate > now) {
                upcomingIPOs.push({ ...ipo,status: "Upcoming"}); // IPO has not yet opened
            } 
            else{
                pastIPOs.push({ ...ipo,status:"PastIPO"}); // IPO has already closed
            }
        });

        console.log({ activeIPOs, upcomingIPOs, pastIPOs });

        res.json({
            status: "success",
            activeIPOs,
            upcomingIPOs,
            pastIPOs,
        });
    } catch (err) {
        console.error("Error fetching IPO dashboard data:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
    });
    // Dummy IPO data
    const dashboardData = {
        totalIPO: 30,
        ipoInLoss: 10,
        ipoInGain: 30
    };

    // Define the API route
    router.get("/dashboard", (req, res) => {
        res.json(dashboardData);
    });

// Dummy allotment data
const dummyAllotments = [
    {
      application_id: 'APP1001',
      investor_name: 'Ravi Kumar',
      company_name: 'Tata Tech Ltd',
      applied_shares: 100,
      allotted_shares: 80,
      status: 'Approved',
      allotted_on: new Date()
    },
    {
      application_id: 'APP1002',
      investor_name: 'Priya Mehta',
      company_name: 'Adani Green',
      applied_shares: 50,
      allotted_shares: 0,
      status: 'Rejected',
      allotted_on: new Date()
    },
    {
      application_id: 'APP1003',
      investor_name: 'Aman Singh',
      company_name: 'Reliance Jio',
      applied_shares: 70,
      allotted_shares: 70,
      status: 'Approved',
      allotted_on: new Date()
    },
    {
      application_id: 'APP1004',
      investor_name: 'Kavya Shah',
      company_name: 'Zomato Ltd',
      applied_shares: 100,
      allotted_shares: 0,
      status: 'Pending',
      allotted_on: new Date()
    }
  ];
  
  // Route to return dummy data
  router.get('/ipo-allotments', (req, res) => {
    res.json(dummyAllotments);
  });

// Get IPOs with Company Info and Status
    router.get("/upcomingipos", async (_, res) => {
        try {
            const result = await pool.query(`
                SELECT 
                    ipos.company_logo_url,
                    ipos.id,
                    companies.name AS company_name,
                    ipos.price_band,
                    ipos.issue_size,
                    ipos.created_at AS listing_date,
                    ipos.opening_date,
                    ipos.closing_date,
                    ipos.issue_type,
                    CASE 
                        WHEN NOW() BETWEEN ipos.opening_date AND ipos.closing_date THEN 'Ongoing'
                        WHEN NOW() < ipos.opening_date THEN 'Upcoming'
                        ELSE 'New Listed'
                    END AS status
                FROM ipos
                JOIN companies ON ipos.company_id = companies.id
            `);
    
            res.json(result.rows);
        } catch (error) {
            console.error("Error fetching IPOs:", error);
            res.status(500).json({ status: "error", message: "Internal Server Error" });
        }
    });
    
    // Delete IPO by ID
    router.delete("/iposdlt/:id", async (req, res) => {
        try {
            const { id } = req.params;

            // Check if IPO exists
            const ipoQuery = await pool.query("SELECT * FROM ipos WHERE id = $1", [id]);
            if (ipoQuery.rows.length === 0) {
                return res.status(404).json({ status: "error", message: "IPO not found" });
            }

            // Delete IPO
            await pool.query("DELETE FROM ipos WHERE id = $1", [id]);
            res.json({ status: "success", message: "IPO deleted successfully", id });
        } catch (error) {
            console.error("Error deleting IPO:", error);
            res.status(500).json({ status: "error", message: "Internal Server Error" });
        }
    });
    // Update IPO (Here, you can modify as per required fields)
    router.put("/iposupdate/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const { price_band, issue_size, issue_type } = req.body;

            // Validate required fields
            if (!price_band || !issue_size || !issue_type) {
                return res.status(400).json({ status: "error", message: "All fields are required" });
            }

            // Validate data types
            const priceBand = parseFloat(price_band);
            const issueSize = parseInt(issue_size, 10);

            if (isNaN(priceBand) || isNaN(issueSize)) {
                return res.status(400).json({ status: "error", message: "Invalid data format for price_band or issue_size" });
            }

            await pool.query(`
                UPDATE ipos 
                SET price_band = $1, issue_size = $2, issue_type = $3
                WHERE id = $4
            `, [priceBand, issueSize, issue_type, id]);
    
            res.json({ status: "success", message: "IPO updated successfully" });
        } catch (error) {
            console.error("Error updating IPO:", error);
            res.status(500).json({ status: "error", message: "Internal Server Error" });
        }
    });
    
    
export default router;