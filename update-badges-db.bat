@echo off
echo Running Supabase migrations to create and update the badges table...

cd supabase
npx supabase migration up

echo Migration completed! Please restart your application.

pause 