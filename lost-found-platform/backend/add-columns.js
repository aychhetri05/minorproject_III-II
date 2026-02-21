// Script to add missing columns to items table
const db = require('./config/db');

async function addMissingColumns() {
    try {
        console.log('Adding missing columns to items table...\n');
        
        const alters = [
            "ALTER TABLE items ADD COLUMN physically_verified BOOLEAN DEFAULT FALSE AFTER status",
            "ALTER TABLE items ADD COLUMN verification_type ENUM('AI','Physical') DEFAULT 'AI' AFTER physically_verified",
            "ALTER TABLE items ADD COLUMN verified_by INT DEFAULT NULL AFTER verification_type",
            "ALTER TABLE items ADD COLUMN verification_timestamp TIMESTAMP NULL DEFAULT NULL AFTER verified_by",
            "ALTER TABLE items ADD COLUMN police_notes TEXT DEFAULT NULL AFTER verification_timestamp",
            "ALTER TABLE items ADD COLUMN submission_timestamp TIMESTAMP NULL DEFAULT NULL AFTER police_notes",
            "ALTER TABLE items ADD COLUMN storage_status ENUM('none', 'stored', 'closed') DEFAULT 'none' AFTER submission_timestamp",
            "ALTER TABLE items ADD COLUMN storage_details TEXT DEFAULT NULL AFTER storage_status",
            "ALTER TABLE items ADD COLUMN storage_updated_at TIMESTAMP NULL DEFAULT NULL AFTER storage_details"
        ];
        
        for (const alter of alters) {
            try {
                console.log(`Executing: ${alter.substring(0, 70)}...`);
                await db.query(alter);
                console.log('  ✓ Success\n');
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('  ✓ Column already exists\n');
                } else {
                    console.error('  ❌ Error:', err.message, '\n');
                }
            }
        }
        
        // Update status enum to include new values
        try {
            console.log('Updating status ENUM to include new values...');
            await db.query(`ALTER TABLE items MODIFY status ENUM('open', 'matched', 'verified', 'reported', 'pending_physical', 'physically_verified', 'resolved') DEFAULT 'reported'`);
            console.log('  ✓ Status ENUM updated\n');
        } catch (err) {
            console.error('  ⚠️  Could not update status ENUM:', err.message, '\n');
        }
        
        // Verify columns
        const [columns] = await db.query('DESC items');
        const columnNames = columns.map(c => c.Field);
        
        console.log('✅ Items table columns now:', columnNames.join(', '));
        
        const requiredColumns = ['verified_by', 'physically_verified', 'verification_type'];
        const missing = requiredColumns.filter(col => !columnNames.includes(col));
        
        if (missing.length === 0) {
            console.log('\n✅ All required columns are present!');
        } else {
            console.warn('\n⚠️  Still missing columns:', missing.join(', '));
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
}

addMissingColumns();
