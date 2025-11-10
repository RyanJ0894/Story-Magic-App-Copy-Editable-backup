# 🔐 Secure Role System Setup

## ⚠️ CRITICAL: Current Security Issue

Your roles are currently stored in the `profiles` table where users can potentially modify them. This is a **security vulnerability** that could lead to privilege escalation attacks.

## 🛠️ Required Setup

To implement proper role security, you need to:

1. **Open your Supabase SQL Editor**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Create a new query

2. **Run the setup script**
   - Copy the entire contents of `supabase/setup-user-roles.sql`
   - Paste it into the SQL Editor
   - Execute the query

3. **What this does:**
   - Creates a separate `user_roles` table with proper security
   - Sets up Row Level Security (RLS) policies
   - Only Masters can change roles (prevents privilege escalation)
   - Migrates your existing role data
   - Creates security definer functions for safe role checks

4. **After running the SQL:**
   - The role changes will work properly
   - Only Master users can change roles
   - Roles are stored securely in a separate table
   - Your app will automatically use the new secure system

## 🔍 Current Behavior

- ❌ Role changes flash but don't persist (RLS blocking unauthorized updates)
- ❌ Users can see role fields in profiles table (security risk)
- ❌ No proper permission enforcement at database level

## ✅ After Setup

- ✅ Role changes persist properly
- ✅ Only Masters can modify roles
- ✅ Roles stored in secure, auditable table
- ✅ Database-level permission enforcement
- ✅ Protection against privilege escalation

## 📝 Need Help?

If you encounter any issues running the setup:
1. Check your database logs in Supabase
2. Ensure you have the required permissions
3. Make sure no existing `user_roles` table conflicts exist
