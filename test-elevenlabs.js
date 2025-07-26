// Simple test script for ElevenLabs API integration
// Run with: node test-elevenlabs.js

import fetch from 'node-fetch';
import fs from 'fs';

// Voice mapping (same as in the Edge Function)
const voiceMap = {
  'Narrator Deep': 'JBFqnCBsd6RMkjVDRZzb', // George
  'Narrator Soothing': 'TX3LPaxmHKxFdv7VOQHJ', // Liam
  'Warm Female': 'EXAVITQu4vr4xnSDxMaL', // Sarah
  'Assertive Female': 'cgSgspJ2msm6clMCkdW9', // Jessica
  'Neutral Male': 'nPczCjzI2devNBz1zQrb', // Brian
  'Comedic Male': 'iP95p4xoKVk53GoZ742B', // Chris
  'Elderly Male Mentor': 'pqHfZKP75CvOlQylNhV4', // Bill
  'Elderly Female Mentor': 'XrExE9yKIg1WjnnlVkGX', // Matilda
  'Young Hero': 'IKne3meq5aSn9XLyUdCD', // Charlie
};

// Mood instructions (same as in the Edge Function)
const moodInstructions = {
  'Tense': 'Speak with tension and urgency in your voice.',
  'Inspiring': 'Speak with inspiration and motivation.',
  'Dark': 'Speak with a dark and mysterious tone.',
  'Comedic': 'Speak with humor and lightness.',
  'Melancholy': 'Speak with a sad and reflective tone.',
  'Hopeful': 'Speak with hope and optimism.',
  'Romantic': 'Speak with warmth and romance.',
  'Epic': 'Speak with grandeur and epicness.'
};

async function testElevenLabsAPI() {
  // Test configuration
  const voiceStyle = 'Warm Female'; // Change this to test different voices
  const mood = 'Inspiring'; // Change this to test different moods
  const testText = "This is a test of the ElevenLabs voice generation system. We are verifying that the audio generation pipeline works correctly with different voice styles and moods.";
  
  // Get voice ID
  const voiceId = voiceMap[voiceStyle] || 'EXAVITQu4vr4xnSDxMaL';
  
  // Create styled text with mood
  let styledText = testText;
  if (mood && moodInstructions[mood]) {
    styledText = `${moodInstructions[mood]} ${testText}`;
  }
  
  console.log('Testing ElevenLabs API with:');
  console.log('- Voice Style:', voiceStyle);
  console.log('- Voice ID:', voiceId);
  console.log('- Mood:', mood);
  console.log('- Text Length:', styledText.length);
  console.log('- Styled Text:', styledText.substring(0, 100) + '...');
  
  // You'll need to add your ElevenLabs API key here
  const ELEVENLABS_API_KEY = 'sk_d166b9980919a408b73eede7ad7cc1b65f892ee39307c7cf'; // Replace with your actual API key
  
  try {
    console.log('\n🔄 Making API call to ElevenLabs...');
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: styledText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', response.status, errorText);
      return;
    }
    
    const audioBuffer = await response.arrayBuffer();
    console.log('✅ Audio generated successfully!');
    console.log('- Audio size:', audioBuffer.byteLength, 'bytes');
    console.log('- Audio duration (estimated):', Math.round(audioBuffer.byteLength / 16000), 'seconds');
    
    // Save the audio file for testing
    fs.writeFileSync('test-audio.mp3', Buffer.from(audioBuffer));
    console.log('- Audio saved as: test-audio.mp3');
    
  } catch (error) {
    console.error('❌ Error testing ElevenLabs API:', error.message);
  }
}

async function testMultipleVoices() {
  console.log('🎭 Testing Multiple Voice and Mood Combinations...\n');
  
  const testCombinations = [
    { voice: 'Narrator Deep', mood: 'Epic' },
    { voice: 'Comedic Male', mood: 'Comedic' },
    { voice: 'Elderly Male Mentor', mood: 'Hopeful' },
    { voice: 'Assertive Female', mood: 'Tense' }
  ];
  
  const testText = "This is a comprehensive test of our voice generation system.";
  
  for (let i = 0; i < testCombinations.length; i++) {
    const { voice, mood } = testCombinations[i];
    const voiceId = voiceMap[voice];
    const moodInstruction = moodInstructions[mood];
    
    let styledText = testText;
    if (moodInstruction) {
      styledText = `${moodInstruction} ${testText}`;
    }
    
    console.log(`\n--- Test ${i + 1}: ${voice} with ${mood} mood ---`);
    console.log(`Voice ID: ${voiceId}`);
    console.log(`Text: ${styledText.substring(0, 80)}...`);
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': 'sk_d166b9980919a408b73eede7ad7cc1b65f892ee39307c7cf',
        },
        body: JSON.stringify({
          text: styledText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });
      
      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const fileName = `test-${voice.toLowerCase().replace(/\s+/g, '-')}-${mood.toLowerCase()}.mp3`;
        fs.writeFileSync(fileName, Buffer.from(audioBuffer));
        console.log(`✅ Generated: ${fileName} (${audioBuffer.byteLength} bytes)`);
      } else {
        console.log(`❌ Failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Multiple voice test completed!');
}

// Run the tests
console.log('🎵 ElevenLabs Voice Generation Test Suite\n');
await testElevenLabsAPI();
await testMultipleVoices(); 