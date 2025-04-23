@echo off
echo Running Supabase migrations to create and update the badges table...
cd supabase

echo Ensuring Supabase CLI is installed...
npx supabase --version

echo Running migrations...
npx supabase migration up

echo Database updated successfully!
echo If you're experiencing issues with badge awarding:
echo 1. Make sure your Supabase instance is running
echo 2. Check if the badges table was created with the badge_category enum
echo 3. Verify your user session is active in the browser

pause 