# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ansqfdzcxwhqoloovotu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuc3FmZHpjeHdocW9sb292b3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNTU3NzcsImV4cCI6MjA1OTYzMTc3N30.ABU9ldHzIt_flWJIEToa4NZHBFIWeXTwWsU1ZUrAJOw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuc3FmZHpjeHdocW9sb292b3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDA1NTc3NywiZXhwIjoyMDU5NjMxNzc3fQ.gNDysxo4DDGi66s501Xw2j41U9EEP8FgUN9MLKKHmIc
```

## Important Notes

1. **File Format**
   - No spaces around the `=` sign
   - No quotes around values
   - Each variable on its own line
   - No trailing spaces

2. **Security**
   - Never commit `.env.local` to version control
   - Keep your service role key secure
   - Only use service role key for admin operations

3. **Verification**
   After setting up:
   1. Restart your Next.js server
   2. Check console logs for Supabase connection status
   3. Try signing up a new user to verify auth works

## Troubleshooting

If you encounter issues:

1. **Auth Issues**
   - Check browser console for connection logs
   - Verify environment variables are loaded
   - Clear browser storage and try again

2. **Database Issues**
   - Check RLS policies are in place
   - Verify user has correct permissions
   - Check for any migration errors

3. **Profile Creation Issues**
   - Verify the `handle_new_user` trigger is working
   - Check the profiles table exists
   - Monitor the auth.users table for new entries
