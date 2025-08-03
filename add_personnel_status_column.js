const db = require('./config/db');

async function addStatusColumn() {
  try {
    // Add status column with default value 'approved' for existing and new admin-created users
    await db.execute(
      'ALTER TABLE personnel ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT "approved"'
    );
    console.log('✅ Successfully added status column to personnel table');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ Status column already exists');
      process.exit(0);
    }
    console.error('❌ Error adding status column:', err.message);
    process.exit(1);
  }
}

addStatusColumn();