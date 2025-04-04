import axios from 'axios';
import { Pool } from 'pg';

if (!process.env.DB_PASSWORD) {
    console.error("Error: DB_PASSWORD environment variable is not set.");
    process.exit(1);
}
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'bluestock_ipo',
    password: process.env.DB_PASSWORD,
    port: 5432,
});
        if (!response.data || !Array.isArray(response.data)) {
            console.error("Error: Invalid API response format.");
            return;
        }
        const ipos = response.data;
pool.on('error', (err) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
});

const fetchIPOData = async () => {
    try {
        const apiUrl = "http://127.0.0.1:8000/api/ipo-list/"; // Replace with actual URL
        const response = await axios.get(apiUrl);
        const ipos = Array.isArray(response.data) ? response.data : [];

        for (const ipo of ipos) {
            const query = `
                INSERT INTO ipos (company_id, price_per_share, total_shares, opening_date, closing_date, status, api_source_id, last_updated)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                ON CONFLICT (api_source_id) 
                DO UPDATE SET price_per_share = EXCLUDED.price_per_share, 
                              total_shares = EXCLUDED.total_shares, 
                              opening_date = EXCLUDED.opening_date, 
                              closing_date = EXCLUDED.closing_date, 
                              status = EXCLUDED.status,
                              last_updated = NOW();
            `;
        console.error("Error fetching IPO data:", error.stack || error.message || error);
            await pool.query(query, [
                ipo.company_id,
                ipo.price_per_share,
                ipo.total_shares,
                ipo.opening_date,
                ipo.closing_date,
                ipo.status,
                ipo.id
            ]);
        }

        console.log("IPO data synced successfully!");
    } catch (error) {
        console.error("Error fetching IPO data:", error.message || error);
    }
};

fetchIPOData();
