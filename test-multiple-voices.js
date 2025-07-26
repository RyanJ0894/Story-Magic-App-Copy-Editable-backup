// Comprehensive test for multiple voice and mood combinations
// Run with: node test-multiple-voices.js

import fetch from 'node-fetch';

const functionUrl = 'https://eyfxxhkbotkjsazvhxlj.supabase.co/functions/v1/generate-audio';
const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Znh4aGtib3RranNhenZoeGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjc1NDEsImV4cCI6MjA2ODkwMzU0MX0.IKlj4-494b6k5Te9Qbv5CZpJt25INYchGRixQYBEdoM';

const testCombinations = [
  { voice: 'Narrator Deep', mood: 'Epic', text: 'In the depths of the ancient forest, a legend was about to unfold.' },
  { voice: 'Comedic Male', mood: 'Comedic', text: 'Well, well, well! Look what the cat dragged in!' },
  { voice: 'Elderly Male Mentor', mood: 'Hopeful', text: 'Remember, my child, every journey begins with a single step.' },
  { voice: 'Assertive Female', mood: 'Tense', text: 'We have exactly three minutes before everything falls apart.' },
  { voice: 'Warm Female', mood: 'Romantic', text: 'In the soft glow of candlelight, their eyes met across the crowded room.' },
  { voice: 'Young Hero', mood: 'Inspiring', text: 'Today, we stand together as one. Today, we make history!' }
];

async function testVoiceCombination(combination, index) {
  const { voice, mood, text } = combination;
  
  console.log(`\n🎭 Test ${index + 1}: ${voice} with ${mood} mood`);
  console.log(`📝 Text: "${text}"`);
  
  const testData = {
    voiceStyle: voice,
    mood: mood,
    userId: 'test-user-123',
    projectId: `test-project-${index + 1}`,
    customText: text
  };
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Failed: ${response.status} - ${errorText}`);
      return false;
    }
    
    const result = await response.json();
    if (result.success && result.audioUrl) {
      console.log(`✅ Success! Audio: ${result.audioUrl}`);
      return true;
    } else {
      console.log(`❌ Failed: ${result.error || 'Unknown error'}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('🎵 Comprehensive Voice Generation Test');
  console.log('=====================================\n');
  
  let successCount = 0;
  const totalTests = testCombinations.length;
  
  for (let i = 0; i < testCombinations.length; i++) {
    const success = await testVoiceCombination(testCombinations[i], i);
    if (success) successCount++;
    
    // Small delay between requests
    if (i < testCombinations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Successful: ${successCount}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - successCount}/${totalTests}`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Your voice generation system is working perfectly!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
}

runComprehensiveTest(); 