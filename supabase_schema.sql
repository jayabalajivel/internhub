-- ========================================================
-- InternHub Supabase PostgreSQL Database Schema
-- Execute this script in your Supabase SQL Editor
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. PROFILES TABLE
-- Stores extended user profile information linked to Supabase Auth
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    domain TEXT DEFAULT 'Software Engineering',
    education TEXT DEFAULT '',
    university TEXT DEFAULT '',
    class_year TEXT DEFAULT '',
    cgpa TEXT DEFAULT '',
    location TEXT DEFAULT '',
    stipend_preference NUMERIC DEFAULT 0,
    work_mode TEXT DEFAULT 'Any',
    github TEXT DEFAULT '',
    linkedin TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert/update their own profile" 
    ON public.profiles FOR ALL 
    USING (auth.uid() = id);

-- --------------------------------------------------------
-- 2. AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- Automatically populates profiles table when user registers via Supabase Auth
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
        new.email
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------
-- 3. APPLICATIONS TABLE
-- Tracks user internship application statuses
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    job_title TEXT,
    company TEXT,
    status TEXT NOT NULL DEFAULT 'Applied',
    notes TEXT DEFAULT '',
    applied_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Applications
CREATE POLICY "Users can view their own applications" 
    ON public.applications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" 
    ON public.applications FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" 
    ON public.applications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" 
    ON public.applications FOR DELETE 
    USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 4. SAVED JOBS TABLE
-- Stores saved internship listings for each user
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    job_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, job_id)
);

-- Enable RLS on saved_jobs
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Saved Jobs
CREATE POLICY "Users can view their saved jobs" 
    ON public.saved_jobs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs" 
    ON public.saved_jobs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved jobs" 
    ON public.saved_jobs FOR DELETE 
    USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 5. INTERNSHIPS CACHE TABLE (Optional Server Cache)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.internships (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT DEFAULT 'Remote',
    stipend TEXT DEFAULT 'Competitive',
    apply_link TEXT,
    description TEXT,
    trust_score INTEGER DEFAULT 85,
    source TEXT DEFAULT 'Aggregated API',
    verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on internships
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

-- Public read access policy for internships
CREATE POLICY "Internships are readable by all authenticated users" 
    ON public.internships FOR SELECT 
    USING (true);
