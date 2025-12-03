// runMigration.js - Script to run notification preferences migration
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running notification preferences migration...');
    
    // Create the table
    await db`
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        report_enabled BOOLEAN DEFAULT FALSE,
        report_frequency VARCHAR(20) DEFAULT 'weekly',
        report_day_of_week INTEGER,
        report_day_of_month INTEGER,
        report_time TIME DEFAULT '09:00',
        notification_method VARCHAR(20) DEFAULT 'in-app',
        last_sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_user_notification_preferences UNIQUE (user_id),
        CONSTRAINT chk_day_of_week CHECK (report_day_of_week IS NULL OR (report_day_of_week >= 0 AND report_day_of_week <= 6)),
        CONSTRAINT chk_day_of_month CHECK (report_day_of_month IS NULL OR (report_day_of_month >= 1 AND report_day_of_month <= 31)),
        CONSTRAINT chk_frequency CHECK (report_frequency IN ('daily', 'weekly', 'monthly'))
      )
    `;
    console.log('✅ Table created');

    // Create index
    await db`
      CREATE INDEX IF NOT EXISTS idx_notification_preferences_enabled 
      ON user_notification_preferences(user_id, report_enabled) 
      WHERE report_enabled = TRUE
    `;
    console.log('✅ Index created');

    // Create trigger function
    await db`
      CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;
    console.log('✅ Trigger function created');

    // Create trigger
    await db`
      DROP TRIGGER IF EXISTS trigger_update_notification_preferences_timestamp 
      ON user_notification_preferences
    `;
    
    await db`
      CREATE TRIGGER trigger_update_notification_preferences_timestamp
      BEFORE UPDATE ON user_notification_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_notification_preferences_timestamp()
    `;
    console.log('✅ Trigger created');
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
