#!/bin/bash
# Apply the freddy_sessions migration to Supabase
# Run this after setting up the Supabase CLI and linking to your project

# Option 1: Using Supabase CLI (recommended)
# supabase db push

# Option 2: Direct SQL via psql
# Replace with your actual connection string
# psql "$DATABASE_URL" -f 20261103000000_freddy_sessions.sql

echo "Migration file ready: supabase/migrations/20261103000000_freddy_sessions.sql"
echo "Run: supabase db push"
