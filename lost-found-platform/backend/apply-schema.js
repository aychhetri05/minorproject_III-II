// Script to apply database schema line by line
const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function applySchema() {
    try {
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        // Parse statements more carefully
        let statements = [];
        let currentStatement = '';
        const lines = schemaContent.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('--')) {
                continue;
            }
            
            currentStatement += ' ' + line;
            
            if (trimmed.endsWith(';')) {
                statements.push(currentStatement.trim());
                currentStatement = '';
            }
        }
        
        // Add any remaining statement
        if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
        }
        
        console.log(`Found ${statements.length} SQL statements to execute`);
        
        for (let i = 0; i < statements.length; i++) {
            try {
                const stmt = statements[i];
                // Remove trailing semicolon for execution
                const cleanStmt = stmt.endsWith(';') ? stmt.slice(0, -1) : stmt;
                console.log(`[${i + 1}/${statements.length}] Executing: ${cleanStmt.substring(0, 60)}...`);
                await db.query(cleanStmt);
            } catch (err) {
                // Some errors are expected (like duplicate key, table already exists)
                if (!['ER_DUP_ENTRY', 'ER_DUP_UNIQUE', 'ER_TABLE_EXISTS_ERROR'].includes(err.code)) {
                    console.error(`  ⚠️  Error in statement ${i + 1}:`, err.message);
                } else {
                    console.log(`  ✓ Skipped (already exists)`);
                }
            }
        }
        
        // Verify schema was applied
        const [columns] = await db.query('DESC items');
        const columnNames = columns.map(c => c.Field);
        console.log('\n✅ Schema application complete!');
        console.log('Items table columns:', columnNames.join(', '));
        
        // Check for critical columns
        const requiredColumns = ['verified_by', 'physically_verified', 'verification_type'];
        const missing = requiredColumns.filter(col => !columnNames.includes(col));
        
        if (missing.length > 0) {
            console.warn('⚠️  WARNING: Missing columns:', missing.join(', '));
            console.warn('This might cause API errors!');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to apply schema:', err.message);
        process.exit(1);
    }
}

applySchema();
