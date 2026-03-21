# Database Setup Instructions

## Apply Password Reset Feature to Database

### Method 1: Using MySQL Command (Recommended)

#### Windows
```bash
cd c:\Users\chhet\OneDrive\Desktop\minorcode\lost-found-platform\database
mysql -u root -p -h localhost < migration-add-reset-token.sql
```

When prompted, enter your MySQL root password.

#### Mac/Linux
```bash
cd ~/path/to/lost-found-platform/database
mysql -u root -p -h localhost < migration-add-reset-token.sql
```

---

### Method 2: Using MySQL Workbench or Client GUI

1. Open MySQL Workbench or your MySQL client
2. Connect to your local MySQL server
3. Open File → Open SQL Script
4. Navigate to: `database/migration-add-reset-token.sql`
5. Click Execute (▶ button)
6. Verify successful execution

---

### Method 3: Manual SQL Execution

1. Open your MySQL client
2. Copy and paste the following SQL:

```sql
USE lost_found_db;

-- Add reset token fields to users table
ALTER TABLE users ADD COLUMN reset_token VARCHAR(500) NULL DEFAULT NULL;
ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME NULL DEFAULT NULL;

-- Add index on reset_token for faster lookups
CREATE INDEX idx_reset_token ON users(reset_token);

-- Verify the columns were added
DESCRIBE users;
```

3. Execute the queries

---

## Verification

After running the migration, verify it worked:

```sql
-- Check if columns exist
DESCRIBE users;
```

You should see output like:
```
+--------------------+--------------+-----+-----+----------+
| Field              | Type         | Null| Key | Default  |
+--------------------+--------------+-----+-----+----------+
| id                 | int          | NO  | PRI | NULL     |
| name               | varchar(100) | NO  |     | NULL     |
| email              | varchar(150) | NO  | UNI | NULL     |
| password           | varchar(255) | NO  |     | NULL     |
| role               | enum('user', | YES |     | user     |
| created_at         | timestamp    | NO  |     | NOW()    |
| reset_token        | varchar(500) | YES | MUL | NULL     |
| reset_token_expiry | datetime     | YES |     | NULL     |
+--------------------+--------------+-----+-----+----------+
```

The key things to verify:
- ✓ `reset_token` column exists (VARCHAR 500)
- ✓ `reset_token_expiry` column exists (DATETIME)
- ✓ Both columns are nullable (`Null: YES`)
- ✓ Index created on `reset_token` (`Key: MUL`)

---

## Rollback (If Needed)

If you need to rollback these changes:

```sql
-- Drop the columns
ALTER TABLE users DROP COLUMN reset_token;
ALTER TABLE users DROP COLUMN reset_token_expiry;
ALTER TABLE users DROP INDEX idx_reset_token;

-- Verify columns are gone
DESCRIBE users;
```

---

## Backup Recommendation

Before running any database migrations, create a backup:

```bash
-- Backup the entire database
mysqldump -u root -p lost_found_db > backup_before_reset_token.sql

-- Backup just the users table
mysqldump -u root -p lost_found_db users > backup_users_before_reset_token.sql
```

Store backups in a safe location.

---

## Troubleshooting

### Error: "Unknown database 'lost_found_db'"

**Solution**: Make sure you've already created the main database:
```sql
CREATE DATABASE IF NOT EXISTS lost_found_db;
USE lost_found_db;
-- Then run the migration
```

### Error: "Duplicate column name 'reset_token'"

**Solution**: The columns already exist! Verify using:
```sql
DESCRIBE users;
```

If they already exist, you can skip this migration.

### Error: "Access denied for user 'root'@'localhost'"

**Solution**: Check your MySQL password and credentials in .env file:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lost_found_db
```

### Error: "The used table type doesn't support INDEXES"

**Solution**: Ensure you're using InnoDB or MyISAM storage engine:
```sql
ALTER TABLE users ENGINE=InnoDB;
```

---

## After Migration

Once the migration completes successfully:

1. ✅ Database is ready for password reset feature
2. ✅ Start backend server (will not error on missing columns)
3. ✅ Start frontend server
4. ✅ Test the forgot password flow

---

## Important Notes

- This migration is **one-time only** per database
- It's **safe to run** - only adds columns, doesn't modify existing data
- **No downtime** required for this simple migration
- All existing user accounts are unaffected
- The new columns start as NULL for all existing users

---

Need help? Check the FORGOT_PASSWORD_GUIDE.md for complete feature documentation.
