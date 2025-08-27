-- Migration script to remove state and country fields from cafe tables
-- Run this in your Supabase SQL Editor

-- Remove state and country columns from cafe_applications table
ALTER TABLE cafe_applications DROP COLUMN IF EXISTS state;
ALTER TABLE cafe_applications DROP COLUMN IF EXISTS country;

-- Remove state and country columns from cafes table
ALTER TABLE cafes DROP COLUMN IF EXISTS state;
ALTER TABLE cafes DROP COLUMN IF EXISTS country;

-- Update any existing applications to have clean data
-- (This will set the fields to NULL for existing records, which is fine since they're no longer required)

-- Verify the table structure
SELECT 'cafe_applications' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cafe_applications' 
ORDER BY ordinal_position;

SELECT 'cafes' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cafes' 
ORDER BY ordinal_position;
