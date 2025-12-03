-- Migration: Add user notification preferences table
-- Date: 2025-12-01
-- Description: Allows users to configure recurring report notifications

CREATE TABLE user_notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_enabled BOOLEAN DEFAULT FALSE,
    report_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
    report_day_of_week INTEGER, -- 0-6 for weekly (0=Sunday, 1=Monday, etc.)
    report_day_of_month INTEGER, -- 1-31 for monthly
    report_time TIME DEFAULT '09:00',
    notification_method VARCHAR(20) DEFAULT 'in-app', -- 'in-app', 'email', 'both'
    last_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_notification_preferences UNIQUE (user_id),
    CONSTRAINT chk_day_of_week CHECK (report_day_of_week IS NULL OR (report_day_of_week >= 0 AND report_day_of_week <= 6)),
    CONSTRAINT chk_day_of_month CHECK (report_day_of_month IS NULL OR (report_day_of_month >= 1 AND report_day_of_month <= 31)),
    CONSTRAINT chk_frequency CHECK (report_frequency IN ('daily', 'weekly', 'monthly'))
);

CREATE INDEX idx_notification_preferences_enabled ON user_notification_preferences(user_id, report_enabled) WHERE report_enabled = TRUE;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_timestamp
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_timestamp();
