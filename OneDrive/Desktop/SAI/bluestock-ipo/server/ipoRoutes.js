/*Test Routes
http://localhost:8080/api/ipos → Fetch all IPOs
http://localhost:8080/api/ipos/id/1 → Get IPO details by ID
http://localhost:8080/api/ipos/market/1 → Get IPO market data
http://localhost:8080/api/users → Get all users
http://localhost:8080/api/transactions/user/1 → Get transactions for a user
http://localhost:8080/api/watchlist/user/1 → Get user’s watchlist
*/
import express from "express";
const router = express.Router();

//Dummy data for IPOs
const ipoData = [
    {
        id: 1,
        company: "Company A",
        price: 100,
        status: "Open",
        closingDate: "2025-04-15",
        details: {
            issue_size: "500M",
            lot_size: 10,
            listing_date: "2025-04-18",
            industry: "Tech"
        },
        company_info: {
            ceo: "John Doe",
            headquarters: "New York, USA",
            founded_year: 2010
        },
        market_data: {
            opening_price: 110,
            current_price: 120,
            volume_traded: 1000000
        }
    },
    {
        id: 2,
        company: "Company B",
        price: 150,
        status: "Closed",
        closingDate: "2025-03-20",
        details: {
            issue_size: "750M",
            lot_size: 15,
            listing_date: "2025-03-22",
            industry: "Finance"
        },
        company_info: {
            ceo: "Jane Smith",
            headquarters: "London, UK",
            founded_year: 2005
        },
        market_data: {
            opening_price: 155,
            current_price: 140,
            volume_traded: 800000
        }
    },
    {
        id: 3,
        company: "Company C",
        price: 120,
        status: "Upcoming",
        closingDate: "2025-05-10",
        details: {
            issue_size: "300M",
            lot_size: 8,
            listing_date: "2025-05-12",
            industry: "Healthcare"
        },
        company_info: {
            ceo: "Alice Johnson",
            headquarters: "Mumbai, India",
            founded_year: 2018
        },
        market_data: {
            opening_price: 125,
            current_price: 130,
            volume_traded: 500000
        }
    }
];

//dummy data for users,transactions and watchlists
//users
const users = [
    { id: 1, full_name: "Alice Johnson", email: "alice@example.com", phone: "1234567890", role: "user" },
    { id: 2, full_name: "Bob Smith", email: "bob@example.com", phone: "2345678901", role: "admin" }
];
//transactions
const transactions = [
    { id: 1, user_id: 1, ipo_id: 1, amount: 5000, payment_status: "Completed", transaction_date: "2025-03-10" },
    { id: 2, user_id: 2, ipo_id: 2, amount: 3000, payment_status: "Pending", transaction_date: "2025-03-11" }
];
//watchlits
const watchlists = [
    { id: 1, user_id: 1, ipo_id: 1, created_at: "2025-03-08" },
    { id: 2, user_id: 2, ipo_id: 3, created_at: "2025-03-09" }
];

//test api
router.get('/test',(req,res) => {
    res.send("API Is Workin...");
});

//users
router.get('/users',(req,res) => {
    res.json(users);
})

//get ny user_id
router.get('/users/:userid',(req,res) => {
    const user = users.find(i => i.user_id == req.params.userid);
    user ? res.json(user) : res.status(404).json({ message: "User not found" });
})

//transaction for user
router.get('/transactions/user/:user_id', (req, res) => {
    const userTransactions = transactions.filter(t => t.user_id == req.params.user_id);
    userTransactions.length > 0 ? res.json(userTransactions) : res.status(404).json({ message: "No transactions found" });
});

// Get all IPOs
router.get('/ipos',(req, res) => {
    res.json(ipoData);
});

//ipo name == company name
//get a specific IPO by ipos_name
router.get('/ipos/name/:ipos_name',(req,res) => {
    const ipo = ipoData.find(i => i.company.toLowerCase() == req.params.ipos_name.toLowerCase());
    ipo ? res.json(ipo) : res.status(404).json({message:"IPO not found"});
});

//Get Watchlist for a User
router.get('/watchlist/user/:user_id', (req, res) => {
    const userWatchlist = watchlists.filter(w => w.user_id == req.params.user_id);
    userWatchlist.length > 0 ? res.json(userWatchlist) : res.status(404).json({ message: "No watchlist found" });
});


//Get IPO Market Data by ID
router.get('/ipos/market/:id',(req,res) => {
    const ipo = ipoData.find(i => i.id == req.params.id);
    ipo ? res.json(ipo.market_data) : res.status(404).json({message:"IPO not found"});
});

//get a specific IPO by ID
router.get('/ipos/id/:id',(req,res) => {
    const ipo = ipoData.find(i => i.id == req.params.id);
    ipo ? res.json(ipo) : res.status(404).json({message:"IPO not found"});
});

export default router;