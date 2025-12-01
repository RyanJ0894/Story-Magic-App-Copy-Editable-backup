import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VOICES = [
  { label: "Older Male", voice_id: "iiidtqDt9FBdT1vfBluA", gender: "Male", tone: "Calm", style: "American" },
  { label: "Older Male", voice_id: "NOpBlnGInO9m6vDvFkFC", gender: "Male", tone: "Friendly", style: "African American" },
  { label: "Older Male", voice_id: "tp4cRlXymyN4yXXo3DYv", gender: "Male", tone: "Southern", style: "American" },
  { label: "Older Male", voice_id: "yW0E1QYarnD3WCLTdWuX", gender: "Male", tone: "Southern", style: "American" },
  { label: "Older Male", voice_id: "Vv4DE9DtUpdmwjp7ucgc", gender: "Male", tone: "Wise", style: "American" },
  { label: "Older Male", voice_id: "1muICAxikLeZXeIglHdH", gender: "Male", tone: "Deep", style: "American" },
  { label: "Older Male", voice_id: "Vnuyx38AQEZgAlsJN8mB", gender: "Male", tone: "Energetic", style: "American" },
  { label: "Older Male", voice_id: "1G9Ya1Fy4Ju2EAKyjGYJ", gender: "Male", tone: "Southern", style: "African American" },
  { label: "Older Male", voice_id: "00y4m1PbCBtjIPrwiynB", gender: "Male", tone: "Stern", style: "American" },
  { label: "Female - 20s to 30s", voice_id: "xZVrOjUURog02K298cjt", gender: "Female", tone: "polished", style: "American" },
  { label: "Female - 20s to 30s", voice_id: "XhNlP8uwiH6XZSFnH1yL", gender: "Female", tone: "calm", style: "American" },
  { label: "Female - 20s to 30s", voice_id: "C3x1TEM7scV4p2AXJyrp", gender: "Female", tone: "calm", style: "New Yorker" },
  { label: "Female - 20s to 30s", voice_id: "uYXf8XasLslADfZ2MB4u", gender: "Female", tone: "caring", style: "American" },
  { label: "Female - 20s to 30s", voice_id: "WAhoMTNdLdMoq1j3wf3I", gender: "Female", tone: "smooth", style: "American" },
  { label: "Female - 20s to 30s", voice_id: "S2fYVrVpl5QYHVJ1LkgT", gender: "Female", tone: "southern", style: "Southern American" },
  { label: "Female - 20s to 30s", voice_id: "ccczwhcFl5t2kkNhz4Xg", gender: "Female", tone: "soft", style: "American" },
  { label: "Female - 20s to 30s", voice_id: "4D9Pkpgb8u9YXb1E2jKB", gender: "Female", tone: "Southern", style: "African American" },
  { label: "Female - 20s to 30s", voice_id: "LElbsnORyWdRipDG9D4D", gender: "Female", tone: "Southern", style: "American" },
  { label: "Female - 20s to 30s", voice_id: "cnPPy2dWDNfzwhzvZ3CJ", gender: "Female", tone: "Southern", style: "American" },
  { label: "Female - 20s to 30s", voice_id: "vr5WKaGvRWsoaX5LCVax", gender: "Female", tone: "Calm", style: "American" },
  { label: "Female - 20s to 30s", voice_id: "5BkEaSrc8SxSp7cOflae", gender: "Female", tone: "breathy", style: "British" },
  { label: "Female Teen", voice_id: "bMxLr8fP6hzNRRi9nJxU", gender: "Female", tone: "Playful", style: "American" },
  { label: "Female Teen", voice_id: "wrxvN1LZJIfL3HHvffqe", gender: "Female", tone: "bubbly", style: "American" },
  { label: "Female Teen", voice_id: "T7eLpgAAhoXHlrNajG8v", gender: "Female", tone: "calm", style: "American" },
  { label: "Female Teen", voice_id: "JGwmRZcgvck23cD2TuYq", gender: "Female", tone: "energetic", style: "American" },
  { label: "Female Teen", voice_id: "4amdp26YcC12p4g0caal", gender: "Female", tone: "Breathy", style: "American" },
  { label: "Female Teen", voice_id: "PV8O5l7QO8ZTd5Rln7Z5", gender: "Female", tone: "chill", style: "American" },
  { label: "Female Teen", voice_id: "2bIeDnqItemdU7o6zCwq", gender: "Female", tone: "breathy", style: "African American" },
  { label: "Female Teen", voice_id: "Djjbjv1y8TG5IpNX5YAK", gender: "Female", tone: "raspy", style: "American" },
  { label: "Female Teen", voice_id: "VmeYJ8yn9LbQxhPAl5wO", gender: "Female", tone: "raspy", style: "American" },
  { label: "Female Teen", voice_id: "dP9ClfrTRIUt2zMBr00W", gender: "Female", tone: "calm", style: "American" },
  { label: "Female Under 10", voice_id: "jLreTVzdmVFjzOZ4f2Jx", gender: "Female", tone: "soft", style: "American" },
  { label: "Female Under 10", voice_id: "TkSyBjII8TcWww0CSouI", gender: "Female", tone: "soft", style: "American" },
  { label: "Male 20s to 30s", voice_id: "PSqRw3ln34TxQZrTS6Wt", gender: "Male", tone: "Energetic", style: "American" },
  { label: "Male 20s to 30s", voice_id: "mcuuWJIofmzgKEGk3EMA", gender: "Male", tone: "Deep", style: "African American" },
  { label: "Male 20s to 30s", voice_id: "Yy9hdn23JDNfhVPIWlHY", gender: "Male", tone: "Casual", style: "American" },
  { label: "Male 20s to 30s", voice_id: "1RVpBInY9YUYMLSUQReV", gender: "Male", tone: "Calm", style: "African American" },
  { label: "Male 20s to 30s", voice_id: "XvfwInXiPC6BcAjGWhmS", gender: "Male", tone: "Warm", style: "African American" },
  { label: "Male 20s to 30s", voice_id: "MWYZAv88R6kW8dvZNtvU", gender: "Male", tone: "Energetic", style: "American" },
  { label: "Male 20s to 30s", voice_id: "JRt8VLagGlOd5Vi5tMfX", gender: "Male", tone: "Smooth", style: "British" },
  { label: "Male 20s to 30s", voice_id: "m9Ul0apeWDFimb3H9yGY", gender: "Male", tone: "chill", style: "American" },
  { label: "Male 20s to 30s", voice_id: "Tm4QO7PzRBQqp7MSSl5w", gender: "Male", tone: "Southern", style: "American" },
  { label: "Male 20s to 30s", voice_id: "k1SgXRmVVqpFcQpNU1ou", gender: "Male", tone: "raspy", style: "Hispanic American" },
  { label: "Male Teen", voice_id: "DTKMou8ccj1ZaWGBiotd", gender: "Male", tone: "Stylish", style: "African American" },
  { label: "Male Teen", voice_id: "3XOBzXhnDY98yeWQ3GdM", gender: "Male", tone: "Deep", style: "American" },
  { label: "Male Teen", voice_id: "Pb8RZcHs3ga4StE7wiPM", gender: "Male", tone: "chill", style: "American" },
  { label: "Male Teen", voice_id: "FIsP50cHv9JY47BkNVR7", gender: "Male", tone: "chill", style: "American Midwestern" },
  { label: "Male Teen", voice_id: "iRR5JQNuSp2XN7iF7jPL", gender: "Male", tone: "smooth", style: "African American" },
  { label: "Male Teen", voice_id: "BFnAlAvxDrOEsXlGCLZ2", gender: "Male", tone: "chill", style: "American" },
  { label: "Male Teen", voice_id: "QEDAiBNESWY7Es1bu9HY", gender: "Male", tone: "chill", style: "African American" },
  { label: "Male Teen", voice_id: "AtHOGgML51i4RHBVD0le", gender: "Male", tone: "raspy", style: "American" },
  { label: "Male Teen", voice_id: "ZhLVlARQZoYYz5GikrfB", gender: "Male", tone: "breathy", style: "American" },
  { label: "Male Teen", voice_id: "ciopqvYA9WYw3xOGbodX", gender: "Male", tone: "breathy", style: "American" },
  { label: "Male Under 10", voice_id: "RnC1vV4hTIG6mpspiNMw", gender: "Male", tone: "soft", style: "American" },
  { label: "Male Under 10", voice_id: "OzETXvniP8ZpkhCsvTBQ", gender: "Male", tone: "soft", style: "American" },
  { label: "Narrator", voice_id: "L0Dsvb3SLTyegXwtm47J", gender: "Male", tone: "Calm", style: "British" },
  { label: "Narrator", voice_id: "uju3wxzG5OhpWcoi3SMy", gender: "Male", tone: "Calm", style: "American" },
  { label: "Narrator", voice_id: "XjLkpWUlnhS8i7gGz3lZ", gender: "Male", tone: "Clear and Crisp", style: "American" },
  { label: "Narrator", voice_id: "AeRdCCKzvd23BpJoofzx", gender: "Male", tone: "Calm", style: "British" },
  { label: "Narrator", voice_id: "L1aJrPa7pLJEyYlh3Ilq", gender: "Male", tone: "Warm", style: "British" },
  { label: "Narrator", voice_id: "wJqPPQ618aTW29mptyoc", gender: "Female", tone: "Smooth", style: "British" },
  { label: "Narrator", voice_id: "RILOU7YmBhvwJGDGjNmP", gender: "Female", tone: "Smooth", style: "British" },
  { label: "Narrator", voice_id: "e5WNhrdI30aXpS2RSGm1", gender: "Male", tone: "Deep", style: "American" },
  { label: "Narrator", voice_id: "pcKdPWtbF6bM9o7NHjCI", gender: "Female", tone: "Warm", style: "New Zealand" },
  { label: "Older Female", voice_id: "XxY7LfDr5SzeemL30EAJ", gender: "Female", tone: "Southern", style: "African American" },
  { label: "Older Female", voice_id: "lIgS04i5awvulQMifXvy", gender: "Female", tone: "Raspy", style: "African American" },
  { label: "Older Female", voice_id: "xMZOFuTAHKtUd0aelHvM", gender: "Female", tone: "Southern", style: "American" },
  { label: "Older Female", voice_id: "Mh8UZv56BYw5HLxsvw5K", gender: "Female", tone: "wise", style: "American" },
  { label: "Older Female", voice_id: "loP8wMysfD4AP5kifsuy", gender: "Female", tone: "wise", style: "American" },
  { label: "Older Female", voice_id: "dvw9ITErgRa9TX7AkMgx", gender: "Female", tone: "wise", style: "American" },
  { label: "Older Female", voice_id: "4eC0mcIIjlMstsKu8fMF", gender: "Female", tone: "comforting", style: "African American" },
];

const MUSIC_CATALOG = [
  { id: "m_string_orchestra_uplifting_01", file: "music/m_string_orchestra_uplifting_01.mp3", group: "UPLIFTING", mood: ["uplifting", "hopeful", "bright", "soaring", "inspiring"], intensity: 70 },
  { id: "m_piano_orchestra_uplifting_02", file: "music/m_piano_orchestra_uplifting_02.mp3", group: "UPLIFTING", mood: ["uplifting", "hopeful", "bright", "soaring", "inspiring"], intensity: 70 },
  { id: "m_string_orchestra_uplifting_02", file: "music/m_string_orchestra_uplifting_02.mp3", group: "UPLIFTING", mood: ["uplifting", "hopeful", "bright", "soaring", "inspiring"], intensity: 70 },
  { id: "m_electronic_uplifting_01", file: "music/m_electronic_uplifting_01.mp3", group: "UPLIFTING", mood: ["uplifting", "hopeful", "bright", "soaring", "inspiring"], intensity: 70 },
  { id: "m_string_orchestra_dramatic_01", file: "music/m_string_orchestra_dramatic_01.mp3", group: "DRAMATIC", mood: ["dramatic", "serious", "weighty", "emotional", "tense"], intensity: 75 },
  { id: "m_piano_strings_dramatic_01", file: "music/m_piano_strings_dramatic_01.mp3", group: "DRAMATIC", mood: ["dramatic", "serious", "weighty", "emotional", "tense"], intensity: 75 },
  { id: "m_strings_drums_dramatic_01", file: "music/m_strings_drums_dramatic_01.mp3", group: "DRAMATIC", mood: ["dramatic", "serious", "weighty", "emotional", "tense"], intensity: 75 },
  { id: "m_orchestra_epic_01", file: "music/m_orchestra_epic_01.mp3", group: "EPIC", mood: ["epic", "heroic", "majestic", "powerful", "grand"], intensity: 85 },
  { id: "m_strings_orchestra_epic_01", file: "music/m_strings_orchestra_epic_01.mp3", group: "EPIC", mood: ["epic", "heroic", "majestic", "powerful", "grand"], intensity: 85 },
  { id: "m_orchestra_epic_02", file: "music/m_orchestra_epic_02.mp3", group: "EPIC", mood: ["epic", "heroic", "majestic", "powerful", "grand"], intensity: 85 },
  { id: "m_orchestra_epic_03", file: "music/m_orchestra_epic_03.mp3", group: "EPIC", mood: ["epic", "heroic", "majestic", "powerful", "grand"], intensity: 85 },
  { id: "m_drums_horns_epic_01", file: "music/m_drums_horns_epic_01.mp3", group: "EPIC", mood: ["epic", "heroic", "majestic", "powerful", "grand"], intensity: 85 },
  { id: "m_string_orchestra_love_01", file: "music/m_string_orchestra_love_01.mp3", group: "LOVE", mood: ["romantic", "tender", "warm", "intimate", "glowing"], intensity: 55 },
  { id: "m_piano_strings_love_01", file: "music/m_piano_strings_love_01.mp3", group: "LOVE", mood: ["romantic", "tender", "warm", "intimate", "glowing"], intensity: 55 },
  { id: "m_latin_jazz_love_01", file: "music/m_latin_jazz_love_01.mp3", group: "LOVE", mood: ["romantic", "tender", "warm", "intimate", "glowing"], intensity: 55 },
  { id: "m_latin_jazz_love_02", file: "music/m_latin_jazz_love_02.mp3", group: "LOVE", mood: ["romantic", "tender", "warm", "intimate", "glowing"], intensity: 55 },
  { id: "m_soul_jazz_love_01", file: "music/m_soul_jazz_love_01.mp3", group: "LOVE", mood: ["romantic", "tender", "warm", "intimate", "glowing"], intensity: 55 },
  { id: "m_soul_jazz_love_02", file: "music/m_soul_jazz_love_02.mp3", group: "LOVE", mood: ["romantic", "tender", "warm", "intimate", "glowing"], intensity: 55 },
  { id: "m_piano_strings_groovy_01", file: "music/m_piano_strings_groovy_01.mp3", group: "GROOVY RETRO", mood: ["groovy", "retro", "playful", "cool", "bouncy"], intensity: 50 },
  { id: "m_strings_drums_groovy_01", file: "music/m_strings_drums_groovy_01.mp3", group: "GROOVY RETRO", mood: ["groovy", "retro", "playful", "cool", "bouncy"], intensity: 50 },
  { id: "m_soul_lounge_groovy_01", file: "music/m_soul_lounge_groovy_01.mp3", group: "GROOVY RETRO", mood: ["groovy", "retro", "playful", "cool", "bouncy"], intensity: 50 },
  { id: "m_horns_orchestra_tense_01", file: "music/m_horns_orchestra_tense_01.mp3", group: "TENSE", mood: ["tense", "uneasy", "suspenseful", "urgent", "nervy"], intensity: 65 },
  { id: "m_horns_orchestra_tense_02", file: "music/m_horns_orchestra_tense_02.mp3", group: "TENSE", mood: ["tense", "uneasy", "suspenseful", "urgent", "nervy"], intensity: 65 },
  { id: "m_strings_orchestra_tense_01", file: "music/m_strings_orchestra_tense_01.mp3", group: "TENSE", mood: ["tense", "uneasy", "suspenseful", "urgent", "nervy"], intensity: 65 },
  { id: "m_drums_strings_tesnse_01", file: "music/m_drums_strings_tesnse_01.mp3", group: "TENSE", mood: ["tense", "uneasy", "suspenseful", "urgent", "nervy"], intensity: 65 },
  { id: "m_drums_orchestra_tense_01", file: "music/m_drums_orchestra_tense_01.mp3", group: "TENSE", mood: ["tense", "uneasy", "suspenseful", "urgent", "nervy"], intensity: 65 },
  { id: "m_piano_strings_sexy_01", file: "music/m_piano_strings_sexy_01.mp3", group: "SEXY", mood: ["sensual", "smoky", "smooth", "confident", "late-night"], intensity: 50 },
  { id: "m_sax_piano_sexy_01", file: "music/m_sax_piano_sexy_01.mp3", group: "SEXY", mood: ["sensual", "smoky", "smooth", "confident", "late-night"], intensity: 50 },
  { id: "m_guitar_drums_sexy_01", file: "music/m_guitar_drums_sexy_01.mp3", group: "SEXY", mood: ["sensual", "smoky", "smooth", "confident", "late-night"], intensity: 50 },
  { id: "m_piano_strings_playful_01", file: "music/m_piano_strings_playful_01.mp3", group: "PLAYFUL", mood: ["playful", "cheeky", "light", "whimsical", "spry"], intensity: 45 },
  { id: "m_jazz_retro_playful_01", file: "music/m_jazz_retro_playful_01.mp3", group: "PLAYFUL", mood: ["playful", "cheeky", "light", "whimsical", "spry"], intensity: 45 },
  { id: "m_drums_hum_mysterious_01", file: "music/m_drums_hum_mysterious_01.mp3", group: "MYSTERIOUS, SCARY", mood: ["mysterious", "ominous", "noir", "scary", "foreboding"], intensity: 60 },
  { id: "m_paino_soft_mysterious_01", file: "music/m_paino_soft_mysterious_01.mp3", group: "MYSTERIOUS, SCARY", mood: ["mysterious", "ominous", "noir", "scary", "foreboding"], intensity: 60 },
  { id: "m_drums_strings_scary_01", file: "music/m_drums_strings_scary_01.mp3", group: "MYSTERIOUS, SCARY", mood: ["mysterious", "ominous", "noir", "scary", "foreboding"], intensity: 60 },
  { id: "m_deep_strings_scary_01", file: "music/m_deep_strings_scary_01.mp3", group: "MYSTERIOUS, SCARY", mood: ["mysterious", "ominous", "noir", "scary", "foreboding"], intensity: 60 },
  { id: "m_piano_scary_01", file: "music/m_piano_scary_01.mp3", group: "MYSTERIOUS, SCARY", mood: ["mysterious", "ominous", "noir", "scary", "foreboding"], intensity: 60 },
  { id: "m_piano_slow_sad_01", file: "music/m_piano_slow_sad_01.mp3", group: "SAD", mood: ["sad", "melancholic", "pensive", "tender", "quiet"], intensity: 40 },
  { id: "m_piano_strings_sad_01", file: "music/m_piano_strings_sad_01.mp3", group: "SAD", mood: ["sad", "melancholic", "pensive", "tender", "quiet"], intensity: 40 },
  { id: "m_strings_sad_01", file: "music/m_strings_sad_01.mp3", group: "SAD", mood: ["sad", "melancholic", "pensive", "tender", "quiet"], intensity: 40 },
];

const AMBIENCE_CATALOG = [
  { id: "a_countryside_farm_01", file: "ambience/a_countryside_farm_01.mp3", group: "Suburbs & Countryside", mood: ["natural", "peaceful", "outdoors"], intensity: 40 },
  { id: "a_countryside_birds_01", file: "ambience/a_countryside_birds_01.mp3", group: "Suburbs & Countryside", mood: ["natural", "peaceful", "outdoors"], intensity: 40 },
  { id: "a_forest_calm_01", file: "ambience/a_forest_calm_01.mp3", group: "Forest", mood: ["natural", "peaceful", "outdoors"], intensity: 40 },
  { id: "a_restaurant_people_outdoor_01", file: "ambience/a_restaurant_people_outdoor_01.mp3", group: "People in the City", mood: ["busy", "urban", "energetic"], intensity: 70 },
  { id: "a_city_streets_people_01", file: "ambience/a_city_streets_people_01.mp3", group: "People in the City", mood: ["busy", "urban", "energetic"], intensity: 50 },
  { id: "a_park_fair_music_01", file: "ambience/a_park_fair_music_01.mp3", group: "Parks", mood: ["neutral", "ambient", "cinematic"], intensity: 50 },
  { id: "a_park_spring_sounds_01", file: "ambience/a_park_spring_sounds_01.mp3", group: "Parks", mood: ["neutral", "ambient", "cinematic"], intensity: 50 },
  { id: "a_crowd_busy_01", file: "ambience/a_crowd_busy_01.mp3", group: "Big Crowds", mood: ["social", "lively", "human"], intensity: 60 },
  { id: "a_building_fire_explosions_01", file: "ambience/a_building_fire_explosions_01.mp3", group: "Big Spaces", mood: ["neutral", "ambient", "cinematic"], intensity: 70 },
  { id: "a_city_streets_cars_people_01", file: "ambience/a_city_streets_cars_people_01.mp3", group: "Metropolis", mood: ["busy", "urban", "energetic"], intensity: 80 },
  { id: "a_river_flow_birds_01", file: "ambience/a_river_flow_birds_01.mp3", group: "Lakes & Rivers", mood: ["neutral", "ambient", "cinematic"], intensity: 80 },
  { id: "a_lake_spring_flowing_01", file: "ambience/a_lake_spring_flowing_01.mp3", group: "Lakes & Rivers", mood: ["neutral", "ambient", "cinematic"], intensity: 40 },
  { id: "a_blizzard_wind_howling_01", file: "ambience/a_blizzard_wind_howling_01.mp3", group: "Wind", mood: ["neutral", "ambient", "cinematic"], intensity: 60 },
  { id: "a_wind_howling_spooky_01", file: "ambience/a_wind_howling_spooky_01.mp3", group: "Wind", mood: ["neutral", "ambient", "cinematic"], intensity: 80 },
  { id: "a_wind_blowing_steadily_01", file: "ambience/a_wind_blowing_steadily_01.mp3", group: "Wind", mood: ["neutral", "ambient", "cinematic"], intensity: 50 },
  { id: "a_beach_ocean_waves_01", file: "ambience/a_beach_ocean_waves_01.mp3", group: "Beach & Ocean", mood: ["relaxing", "natural", "open"], intensity: 70 },
  { id: "a_beach_splashing_sloshing_01", file: "ambience/a_beach_splashing_sloshing_01.mp3", group: "Beach & Ocean", mood: ["relaxing", "natural", "open"], intensity: 40 },
  { id: "a_ocean_waves_crashing_01", file: "ambience/a_ocean_waves_crashing_01.mp3", group: "Beach & Ocean", mood: ["relaxing", "natural", "open"], intensity: 50 },
  { id: "a_public_spaces_people_mall_airport_01", file: "ambience/a_public_spaces_people_mall_airport_01.mp3", group: "Small Crowds", mood: ["social", "lively", "human"], intensity: 40 },
  { id: "a_city_streets_small_calm_crowds_01", file: "ambience/a_city_streets_small_calm_crowds_01.mp3", group: "Small Crowds", mood: ["social", "lively", "human"], intensity: 60 },
  { id: "a_driving_accelerating_low_01", file: "ambience/a_driving_accelerating_low_01.mp3", group: "Vehicles Ambience", mood: ["neutral", "ambient", "cinematic"], intensity: 50 },
  { id: "a_sportscar_driving_fast_01", file: "ambience/a_sportscar_driving_fast_01.mp3", group: "Vehicles Ambience", mood: ["neutral", "ambient", "cinematic"], intensity: 50 },
  { id: "a_car_cruising_steady_01", file: "ambience/a_car_cruising_steady_01.mp3", group: "Vehicles Ambience", mood: ["neutral", "ambient", "cinematic"], intensity: 70 },
  { id: "a_fast_driving_getaway_01", file: "ambience/a_fast_driving_getaway_01.mp3", group: "Vehicles Ambience", mood: ["neutral", "ambient", "cinematic"], intensity: 60 },
  { id: "a_car_cruising_steady_02", file: "ambience/a_car_cruising_steady_02.mp3", group: "Vehicles Ambience", mood: ["neutral", "ambient", "cinematic"], intensity: 50 },
  { id: "a_rain_light_outdoors_01", file: "ambience/a_rain_light_outdoors_01.mp3", group: "Rain", mood: ["wet", "moody", "atmospheric"], intensity: 80 },
  { id: "a_rain_on_roof_01", file: "ambience/a_rain_on_roof_01.mp3", group: "Rain", mood: ["wet", "moody", "atmospheric"], intensity: 40 },
  { id: "a_medical_equipment_beeping_01", file: "ambience/a_medical_equipment_beeping_01.mp3", group: "Medical Facilities", mood: ["neutral", "ambient", "cinematic"], intensity: 50 },
  { id: "a_hospital_hallway_01", file: "ambience/a_hospital_hallway_01.mp3", group: "Medical Facilities", mood: ["neutral", "ambient", "cinematic"], intensity: 60 },
  { id: "a_storming_thunderclaps_rain_01", file: "ambience/a_storming_thunderclaps_rain_01.mp3", group: "Storm", mood: ["wet", "moody", "atmospheric"], intensity: 50 },
  { id: "a_rain_light_thunder_01", file: "ambience/a_rain_light_thunder_01.mp3", group: "Storm", mood: ["wet", "moody", "atmospheric"], intensity: 60 },
  { id: "a_storm_raging_01", file: "ambience/a_storm_raging_01.mp3", group: "Storm", mood: ["wet", "moody", "atmospheric"], intensity: 40 },
  { id: "a_bus_ride_public_01", file: "ambience/a_bus_ride_public_01.mp3", group: "Public Transportation Ambience", mood: ["neutral", "ambient", "cinematic"], intensity: 60 },
  { id: "a_restaurant_people_indoor_01", file: "ambience/a_restaurant_people_indoor_01.mp3", group: "Interiors", mood: ["quiet", "neutral", "background"], intensity: 40 },
  { id: "a_restaurant_people_indoor_02", file: "ambience/a_restaurant_people_indoor_02.mp3", group: "Interiors", mood: ["quiet", "neutral", "background"], intensity: 50 },
  { id: "a_office_phones_people_quiet_01", file: "ambience/a_office_phones_people_quiet_01.mp3", group: "Interiors", mood: ["quiet", "neutral", "background"], intensity: 50 },
  { id: "a_battlefield_scifi_lasers_01", file: "ambience/a_battlefield_scifi_lasers_01.mp3", group: "Battlefield / War Zones", mood: ["chaotic", "intense", "violent"], intensity: 50 },
  { id: "a_battlefield_scifi_lasers_02", file: "ambience/a_battlefield_scifi_lasers_02.mp3", group: "Battlefield / War Zones", mood: ["chaotic", "intense", "violent"], intensity: 70 },
  { id: "a_warzone_gunshots_rockets_01", file: "ambience/a_warzone_gunshots_rockets_01.mp3", group: "Battlefield / War Zones", mood: ["chaotic", "intense", "violent"], intensity: 40 },
  { id: "a_warzone_distant_gunshots_explosions_soldiers_01", file: "ambience/a_warzone_distant_gunshots_explosions_soldiers_01.mp3", group: "Battlefield / War Zones", mood: ["chaotic", "intense", "violent"], intensity: 60 },
  { id: "a_military_medical_tent_01", file: "ambience/a_military_medical_tent_01.mp3", group: "Battlefield / War Zones", mood: ["chaotic", "intense", "violent"], intensity: 40 },
  { id: "a_industrial_warehouse_01", file: "ambience/a_industrial_warehouse_01.mp3", group: "Industrial / Factories", mood: ["mechanical", "noisy", "gritty"], intensity: 50 },
];

const SFX_CATALOG = [
  { id: "s_explosion_light_debris_01", file: "sfx/s_explosion_light_debris_01.mp3", group: "Explosions", intensity: 80 },
  { id: "s_explosion_heavy_debris_breaking_glass_01", file: "sfx/s_explosion_heavy_debris_breaking_glass_01.mp3", group: "Explosions", intensity: 40 },
  { id: "s_grappling_fighting_01", file: "sfx/s_grappling_fighting_01.mp3", group: "Fighting", intensity: 80 },
  { id: "s_bar_fight_brawl_01", file: "sfx/s_bar_fight_brawl_01.mp3", group: "Fighting", intensity: 40 },
  { id: "s_fighting_hand_to_hand_01", file: "sfx/s_fighting_hand_to_hand_01.mp3", group: "Fighting", intensity: 40 },
  { id: "s_single_gunshot_01", file: "sfx/s_single_gunshot_01.mp3", group: "Gunshot(s)", intensity: 50 },
  { id: "s_machine_pistol_multiple_shots_01", file: "sfx/s_machine_pistol_multiple_shots_01.mp3", group: "Gunshot(s)", intensity: 80 },
  { id: "s_machine_gun_sporadic_01", file: "sfx/s_machine_gun_sporadic_01.mp3", group: "Gunshot(s)", intensity: 60 },
  { id: "s_single_gunshot_glass_shatter_01", file: "sfx/s_single_gunshot_glass_shatter_01.mp3", group: "Gunshot(s)", intensity: 80 },
  { id: "s_engine_acceleration_01", file: "sfx/s_engine_acceleration_01.mp3", group: "Cars", intensity: 70 },
  { id: "s_car_crash_01", file: "sfx/s_car_crash_01.mp3", group: "Cars", intensity: 80 },
  { id: "s_walking_hardwood_floor_01", file: "sfx/s_walking_hardwood_floor_01.mp3", group: "Wooden Floor", intensity: 70 },
  { id: "s_walking_fast_creeking_01", file: "sfx/s_walking_fast_creeking_01.mp3", group: "Wooden Floor", intensity: 80 },
  { id: "s_walking_in_leaves_01", file: "sfx/s_walking_in_leaves_01.mp3", group: "Walking", intensity: 40 },
  { id: "s_crowd_cheering_01", file: "sfx/s_crowd_cheering_01.mp3", group: "Reactions", intensity: 60 },
  { id: "s_coughing_male_01", file: "sfx/s_coughing_male_01.mp3", group: "Bodily Functions", intensity: 50 },
  { id: "s_coughing_female_01", file: "sfx/s_coughing_female_01.mp3", group: "Bodily Functions", intensity: 40 },
  { id: "s_children_laughing_group_01", file: "sfx/s_children_laughing_group_01.mp3", group: "Kids", intensity: 60 },
  { id: "s_rocks_debris_breaking_falling_01", file: "sfx/s_rocks_debris_breaking_falling_01.mp3", group: "Demolition", intensity: 50 },
  { id: "s_rockslide_breaking_01", file: "sfx/s_rockslide_breaking_01.mp3", group: "Demolition", intensity: 70 },
  { id: "s_demolition_heavy_01", file: "sfx/s_demolition_heavy_01.mp3", group: "Demolition", intensity: 80 },
  { id: "s_siren_ambulance_01", file: "sfx/s_siren_ambulance_01.mp3", group: "Sirens/Ambulance", intensity: 80 },
  { id: "s_police_siren_01", file: "sfx/s_police_siren_01.mp3", group: "Sirens/Ambulance", intensity: 50 },
  { id: "s_heartbeat_steady_01", file: "sfx/s_heartbeat_steady_01.mp3", group: "Heartbeat", intensity: 80 },
  { id: "s_beeping_medical_equipment_01", file: "sfx/s_beeping_medical_equipment_01.mp3", group: "Medical Equipment", intensity: 40 },
  { id: "s_door_knocking_01", file: "sfx/s_door_knocking_01.mp3", group: "Doors", intensity: 60 },
  { id: "s_car_door_opening_01", file: "sfx/s_car_door_opening_01.mp3", group: "Doors", intensity: 50 },
  { id: "s_door_knocking_02", file: "sfx/s_door_knocking_02.mp3", group: "Doors", intensity: 50 },
  { id: "s_door_lock_01", file: "sfx/s_door_lock_01.mp3", group: "Doors", intensity: 80 },
  { id: "s_door_closing_01", file: "sfx/s_door_closing_01.mp3", group: "Doors", intensity: 70 },
  { id: "s_window_breaking_01", file: "sfx/s_window_breaking_01.mp3", group: "Glass", intensity: 80 },
  { id: "s_wine_glass_shattering_01", file: "sfx/s_wine_glass_shattering_01.mp3", group: "Glass", intensity: 60 },
  { id: "s_window_breaking_02", file: "sfx/s_window_breaking_02.mp3", group: "Glass", intensity: 80 },
  { id: "s_drip_on_rythym_01", file: "sfx/s_drip_on_rythym_01.mp3", group: "Water", intensity: 70 },
  { id: "s_bonfire_crackling_01", file: "sfx/s_bonfire_crackling_01.mp3", group: "Fire", intensity: 50 },
  { id: "s_wildfire_whoosh_01", file: "sfx/s_wildfire_whoosh_01.mp3", group: "Fire", intensity: 70 },
  { id: "s_match_lit_01", file: "sfx/s_match_lit_01.mp3", group: "Fire", intensity: 70 },
  { id: "s_office_phone_ringing_01", file: "sfx/s_office_phone_ringing_01.mp3", group: "Electronics", intensity: 70 },
  { id: "s_landline_ringing_01", file: "sfx/s_landline_ringing_01.mp3", group: "Electronics", intensity: 80 },
  { id: "s_landline_ringing_02", file: "sfx/s_landline_ringing_02.mp3", group: "Electronics", intensity: 60 },
  { id: "s_phone_notification_chime_01", file: "sfx/s_phone_notification_chime_01.mp3", group: "Electronics", intensity: 80 },
  { id: "s_typing_computer_01", file: "sfx/s_typing_computer_01.mp3", group: "Electronics", intensity: 40 },
  { id: "s_alarm_clock_retro_01", file: "sfx/s_alarm_clock_retro_01.mp3", group: "Electronics", intensity: 80 },
  { id: "s_alarm_clock_01", file: "sfx/s_alarm_clock_01.mp3", group: "Electronics", intensity: 70 },
  { id: "s_swords_fighting_01", file: "sfx/s_swords_fighting_01.mp3", group: "Weapons", intensity: 80 },
  { id: "s_swords_fighting_02", file: "sfx/s_swords_fighting_02.mp3", group: "Weapons", intensity: 50 },
  { id: "s_dog_barking_neighborhood_01", file: "sfx/s_dog_barking_neighborhood_01.mp3", group: "Animals", intensity: 60 },
  { id: "s_horse_neighing_01", file: "sfx/s_horse_neighing_01.mp3", group: "Animals", intensity: 70 },
];

function buildSystemPrompt(): string {
  const voiceList = VOICES.map(v => `- ${v.voice_id}: ${v.label}, ${v.gender}, ${v.tone}, ${v.style}`).join("\n");
  const musicList = MUSIC_CATALOG.map(m => `- ${m.file}: ${m.group}, moods: ${m.mood.join(", ")}`).join("\n");
  const ambienceList = AMBIENCE_CATALOG.map(a => `- ${a.file}: ${a.group}, moods: ${a.mood.join(", ")}`).join("\n");
  const sfxList = SFX_CATALOG.map(s => `- ${s.file}: ${s.group}`).join("\n");

  return `You are Script-to-JSON Agent. Convert film scripts into strictly valid JSON for audio production.

CRITICAL RULES:
- Start taking the text from the top and identify where the script starts
- Process ENTIRE script from beginning to end without losing any script part
- Identify ALL scene headers (INT., EXT., I.E., I/E)
- Create separate scene object for EACH header
- Never stop until end of script is reached
- MUST select music + ambience for every scene
- CRITICAL: You MUST analyze the COMPLETE screenplay from beginning to end.
- Process EVERY scene in the uploaded script, not just the first few.
- Continue analyzing until you reach the final scene.

KNOWLEDGE BASE - USE ONLY THESE:

=== AVAILABLE VOICES ===
${voiceList}

=== AVAILABLE MUSIC ===
${musicList}

=== AVAILABLE AMBIENCE ===
${ambienceList}

=== AVAILABLE SFX ===
${sfxList}

DO NOT invent or make up any voice IDs, track names, or file paths.
ONLY use exact IDs and file paths from the lists above.

CRITICAL FIELD NAMES:
- For SFX timing: Use "at" (not "start" or "time")
- For SFX ID: Use "cue_id" (required, use format "cue_001", "cue_002", etc.)
- For dialogue ID: Use "line_id" (required, use format "line_001", "line_002", etc.)
- For scene ID: Use "scene_id" (required, use format "scene_001", "scene_002", etc.)

SCENE STRUCTURE:
{
  "scene_id": "scene_001",
  "mood": "emotional tone",
  "intensity": 0.7,
  "dialogue": [
    {
      "line_id": "line_001",
      "character": "Character Name or Narrator",
      "text": "dialogue text",
      "voice_key": "voice_id_from_list_above"
    }
  ],
  "music": [
    {
      "track_id": "music/track_name.mp3",
      "volume": 0.25,
      "fade_in": 2,
      "fade_out": 2
    }
  ],
  "ambience": [
    {
      "track_id": "ambience/track_name.mp3",
      "volume": 0.28,
      "fade_in": 1.5,
      "fade_out": 1.5
    }
  ],
  "sfx": [
    {
      "cue_id": "cue_001",
      "track_id": "sfx/track_name.mp3",
      "volume": 0.5,
      "at": 10.5
    }
  ]
}

VOICE CASTING GUIDELINES:
- Match character age, gender, and personality to voice
- Use Narrator voices for action lines and descriptions
- Male characters: Match age (Older Male, Male 20s-30s, Male Teen, Male Under 10)
- Female characters: Match age (Older Female, Female 20s-30s, Female Teen, Female Under 10)
- Consider tone (Calm, Energetic, Deep, Southern, etc.) based on character personality
- Keep voice assignments consistent for each character throughout the script

MUSIC SELECTION GUIDELINES:
- Match music to scene mood and emotional tone
- UPLIFTING: hopeful, inspiring scenes
- DRAMATIC: serious, emotional, tense scenes
- EPIC: heroic, majestic, powerful moments
- LOVE: romantic, tender, intimate scenes
- TENSE: suspenseful, urgent, uneasy scenes
- SAD: melancholic, pensive, quiet moments
- MYSTERIOUS/SCARY: ominous, noir, foreboding
- PLAYFUL: light, whimsical, cheeky moments
- GROOVY RETRO: cool, bouncy, retro vibes
- SEXY: sensual, smoky, late-night mood

AMBIENCE SELECTION GUIDELINES:
- Match ambience to scene location
- INT. scenes: Use interior ambience (restaurants, offices, apartments)
- EXT. scenes: Match outdoor setting (city, countryside, beach, forest)
- Consider time of day and weather conditions
- Layer ambience appropriately for complex settings

SFX GUIDELINES:
- Add SFX for specific actions mentioned in the script
- Door sounds for entries/exits
- Vehicle sounds for car scenes
- Weather sounds for storms, rain
- Combat sounds for fight scenes
- Use "at" field to time SFX placement (in seconds from scene start)

VOLUME GUIDELINES (all values should be 0.0 to 1.0):
- Music: 0.20 to 0.35 (background, not overpowering dialogue)
- Ambience: 0.25 to 0.40 (subtle environmental)
- SFX: 0.40 to 0.70 (impactful but not jarring)
- ALL VOLUMES MUST BE >= 0 (never negative)

PROCESSING STEPS:
1. Read script from line 1
2. Find scene header → create scene object
3. Extract dialogue until next header
4. Select appropriate voice for each character
5. Select music that matches scene mood
6. Select ambience that matches scene location
7. Add SFX for specific actions
8. Repeat until END OF SCRIPT

OUTPUT FORMAT:
You MUST output ONLY valid JSON with this structure:
{
  "project_id": "the_project_id",
  "scenes": [array of scene objects]
}

Do not include any text before or after the JSON. Output ONLY the JSON object.`;
}

async function callGroq(script: string, projectId: string): Promise<any> {
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  
  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const systemPrompt = buildSystemPrompt();
  const userMessage = `Convert this script to Director JSON. Project ID: ${projectId}\n\nSCRIPT:\n${script}`;

  console.log("[Groq AI Director] Calling Groq API with llama-3.3-70b-versatile...");
  const startTime = Date.now();

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 32000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Groq AI Director] Groq API error:", errorText);
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const elapsed = Date.now() - startTime;
  console.log(`[Groq AI Director] Groq API response in ${elapsed}ms`);

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in Groq response");
  }

  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch (e) {
    console.error("[Groq AI Director] Failed to parse JSON response:", content.substring(0, 500));
    throw new Error("Failed to parse Groq response as JSON");
  }
}

function sanitizeVolumes(directorJson: any): any {
  if (!directorJson || !directorJson.scenes) {
    return directorJson;
  }

  return {
    ...directorJson,
    scenes: directorJson.scenes.map((scene: any) => ({
      ...scene,
      music: scene.music?.map((m: any) => ({
        ...m,
        volume: Math.max(0, m.volume || 0.25),
      })),
      ambience: scene.ambience?.map((a: any) => ({
        ...a,
        volume: Math.max(0, a.volume || 0.28),
      })),
      sfx: scene.sfx?.map((s: any) => ({
        ...s,
        volume: Math.max(0, s.volume || 0.5),
      })),
    })),
  };
}

async function saveToSupabase(supabaseClient: any, projectId: string, directorJson: any): Promise<void> {
  console.log(`[Groq AI Director] Saving Director JSON to Supabase for project ${projectId}`);

  const sanitizedJson = sanitizeVolumes(directorJson);

  const { error } = await supabaseClient
    .from("director_json")
    .upsert({
      project_id: projectId,
      json_data: sanitizedJson,
      status: "completed",
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "project_id",
    });

  if (error) {
    console.error("[Groq AI Director] Failed to save to Supabase:", error);
    throw new Error(`Failed to save Director JSON: ${error.message}`);
  }

  console.log("[Groq AI Director] Successfully saved Director JSON to Supabase");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { project_id, script } = await req.json();

    if (!project_id) {
      throw new Error("project_id is required");
    }

    if (!script) {
      throw new Error("script is required");
    }

    console.log(`[Groq AI Director] Processing project ${project_id}`);
    console.log(`[Groq AI Director] Script length: ${script.length} characters`);

    const totalStartTime = Date.now();

    const directorJson = await callGroq(script, project_id);

    await saveToSupabase(supabaseClient, project_id, {
      project_id,
      scenes: directorJson.scenes || [],
    });

    const totalElapsed = Date.now() - totalStartTime;
    console.log(`[Groq AI Director] Total processing time: ${totalElapsed}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        project_id,
        scene_count: directorJson.scenes?.length || 0,
        processing_time_ms: totalElapsed,
        message: "Director JSON generated and saved successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("[Groq AI Director] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
