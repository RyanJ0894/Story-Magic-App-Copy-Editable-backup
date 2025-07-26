// Test script for Supabase Edge Function integration
// Run with: node test-function.js

import fetch from 'node-fetch';

async function testSupabaseFunction() {
  console.log('🧪 Testing Supabase Edge Function Integration...\n');
  
  // Test data (simulating frontend request)
  const testData = {
    voiceStyle: 'Warm Female',
    mood: 'Inspiring',
    userId: 'test-user-123',
    projectId: 'test-project-456',
    customText: 'This is a test of the dynamic script content. We are now using actual script text instead of static content. The system should process this text and generate audio with the selected voice style and mood.'
  };
  
  console.log('📤 Sending request to Supabase Edge Function:');
  console.log('- Voice Style:', testData.voiceStyle);
  console.log('- Mood:', testData.mood);
  console.log('- Text Length:', testData.customText.length);
  console.log('- Text Preview:', testData.customText.substring(0, 100) + '...');
  
  try {
    // Your actual Supabase function URL
    const functionUrl = 'https://eyfxxhkbotkjsazvhxlj.supabase.co/functions/v1/generate-audio';
    
    console.log('\n🔄 Making request to:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Znh4aGtib3RranNhenZoeGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjc1NDEsImV4cCI6MjA2ODkwMzU0MX0.IKlj4-494b6k5Te9Qbv5CZpJt25INYchGRixQYBEdoM'
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Function error:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Function response:');
    console.log('- Success:', result.success);
    console.log('- Audio URL:', result.audioUrl);
    
    if (result.audioUrl) {
      console.log('🎵 Audio generated successfully!');
      console.log('You can play it at:', result.audioUrl);
    }
    
  } catch (error) {
    console.error('❌ Error testing function:', error.message);
  }
}

// Instructions for setup
console.log('📋 Testing Supabase Edge Function...');
console.log('Make sure you have:');
console.log('1. Deployed the Edge Function to Supabase');
console.log('2. Set ELEVENLABS_API_KEY environment variable');
console.log('3. The function is named "generate-audio"\n');

testSupabaseFunction(); 