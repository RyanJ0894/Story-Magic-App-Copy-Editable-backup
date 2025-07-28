-- Complete Supabase setup for multi-voice and project scripts functionality

-- Create the multi_voice_data table for storing multi-voice generation data
CREATE TABLE IF NOT EXISTS multi_voice_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    script_text TEXT,
    character_voices JSONB,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Create the project_scripts table for storing project script text
CREATE TABLE IF NOT EXISTS project_scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    script_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_multi_voice_data_project_user ON multi_voice_data(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_project_scripts_project_user ON project_scripts(project_id, user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_multi_voice_data_updated_at 
    BEFORE UPDATE ON multi_voice_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_scripts_updated_at 
    BEFORE UPDATE ON project_scripts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for multi_voice_data
ALTER TABLE multi_voice_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi_voice_data
CREATE POLICY "Users can view their own multi-voice data" ON multi_voice_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own multi-voice data" ON multi_voice_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own multi-voice data" ON multi_voice_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own multi-voice data" ON multi_voice_data
    FOR DELETE USING (auth.uid() = user_id);

-- Enable Row Level Security (RLS) for project_scripts
ALTER TABLE project_scripts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_scripts
CREATE POLICY "Users can view their own project scripts" ON project_scripts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project scripts" ON project_scripts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project scripts" ON project_scripts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project scripts" ON project_scripts
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON multi_voice_data TO authenticated;
GRANT ALL ON project_scripts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 