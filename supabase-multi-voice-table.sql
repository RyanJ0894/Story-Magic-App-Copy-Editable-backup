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

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_multi_voice_data_project_user ON multi_voice_data(project_id, user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE multi_voice_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own multi-voice data" ON multi_voice_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own multi-voice data" ON multi_voice_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own multi-voice data" ON multi_voice_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own multi-voice data" ON multi_voice_data
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_multi_voice_data_updated_at 
    BEFORE UPDATE ON multi_voice_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 