CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone_number VARCHAR(15) UNIQUE,
    profile_image TEXT,
    role VARCHAR(20) CHECK (role IN('admin','user'))DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    industry VARCHAR(100) NOT NULL,
    market_cap BIGINT CHECK (market_cap > 0),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE ipos (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    api_source_id VARCHAR(50) UNIQUE,
    price_per_share DECIMAL(10,2) CHECK (price_per_share > 0) NOT NULL,
    total_shares INT CHECK (total_shares > 0) NOT NULL,
    opening_date DATE NOT NULL,
    closing_date DATE NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('Upcoming', 'Open', 'Closed')) NOT NULL DEFAULT 'Upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    ipo_id INT NOT NULL,
    shares_applied INT CHECK (shares_applied > 0) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ipo FOREIGN KEY (ipo_id) REFERENCES ipos(id) ON DELETE CASCADE
);
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    ipo_id INT NOT NULL,
    amount DECIMAL(15,2) CHECK (amount > 0) NOT NULL,
    payment_status VARCHAR(20) CHECK (payment_status IN ('Pending', 'Completed', 'Failed')) NOT NULL DEFAULT 'Pending',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_transaction FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ipo_transaction FOREIGN KEY (ipo_id) REFERENCES ipos(id) ON DELETE CASCADE
);
CREATE TABLE watchlists (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    ipo_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_watchlist FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ipo_watchlist FOREIGN KEY (ipo_id) REFERENCES ipos(id) ON DELETE CASCADE
);
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_notification FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

/*
Users → Subscriptions → IPOs → Companies
       → Transactions
       → Watchlists
       → Notifications
*/

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_ipos_company_id ON ipos(company_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

\l
-- To list all databases, use the following command in the psql terminal:
-- \l
-- To connect to a specific database, use the following command in the psql terminal:
-- \c your_database_name

-- To list all tables in the current database, use the following command in the psql terminal:
-- \dt

-- To describe a specific table, use the following command in the psql terminal:
-- \d table_name

-- To view the database schema in VS Code, you can use the "SQLTools" extension.
-- Install the SQLTools extension from the Extensions view in VS Code.
-- After installing, configure a new connection to your PostgreSQL database.

-- Example configuration for SQLTools:
/*
{
    "sqltools.connections": [
        {
            "name": "PostgreSQL",
            "driver": "PostgreSQL",
            "server": "localhost",
            "port": 5432,
            "database": "bluestock_ipo",
            "username": "postgres",
            "password": "$@!25"
        }
    ]
}
*/
/*
1. **List all databases:**
    ```sql
    \l
    ```

2. **Connect to your specific database:**
    ```sql
    \c bluestock_ipo
    ```

3. **List all tables in the current database:**
    ```sql
    \dt
    ```

4. **Describe a specific table:**
    ```sql
    \d table_name
    ```
*/

