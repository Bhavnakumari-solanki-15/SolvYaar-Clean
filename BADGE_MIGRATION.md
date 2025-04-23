# Badges System Migration

This migration adds a new `badges` table to the Supabase database to support the achievement badges system in Math Wizard.

## What's included

1. A new Supabase migration to create the badges table
2. Updated TypeScript typings for the Supabase database schema
3. Fixed a syntax error in the badgeService.ts file
4. Added a new badge for geometry transformations
5. Integration of badge awarding in the Transform Trek game

## How to apply the migration

### Option 1: Using the update script

1. Run the `update-db.bat` file included in the root directory
2. This will apply all pending migrations to your Supabase database

### Option 2: Manual migration

If you prefer to run the migration manually:

1. Navigate to the supabase directory:
   ```
   cd supabase
   ```

2. Run the migration command:
   ```
   npx supabase migration up
   ```

## Badge System Usage

The badge system allows awarding achievements to users when they complete various tasks:

```typescript
// Award a badge to a user
const badge = await badgeService.awardBadge(userId, 'transformations');

// Get all badges for a user
const badges = await badgeService.getUserBadges(userId);
```

## Available Badge Categories

The system supports these badge categories:

- algebra
- geometry
- trigonometry
- calculus
- statistics
- arithmetic
- linear_algebra
- number_theory
- discrete_math
- set_theory
- transformations (new)

## Troubleshooting

If you encounter any issues with the badge service:

1. Make sure your Supabase instance is running
2. Verify the badges table was created successfully
3. Check for any console errors when awarding badges
4. Make sure the user is authenticated before trying to award a badge

### Common Issues and Solutions

#### Badges not being awarded

Check the browser console for errors. Common issues include:

- **Database table not created**: Run the `update-db.bat` script to create the badges table
- **Badge category mismatch**: Make sure the quiz topic matches one of the supported badge categories
- **User not authenticated**: The user must be logged in to receive badges
- **Permissions issue**: Check that row-level security policies are properly configured

#### Error with type conversion

If you see errors about type conversion between string and BadgeCategory:

1. Make sure the migration script was run to create the badge_category enum
2. Check that the badges table is using the badge_category enum type
3. Verify that your TypeScript types correctly match the database schema

#### Database connection issues

If the system can't connect to Supabase:

1. Check that your environment variables are properly set:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
2. Make sure your Supabase instance is running
3. Check for CORS issues in the browser console 