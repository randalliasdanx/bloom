import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://nphoevtuwxlwuzqwkjra.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5waG9ldnR1d3hsd3V6cXdranJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTU5MTcsImV4cCI6MjA2NTYzMTkxN30.5SAgDtDSicEGPr9j6wcjkDmUd2Cy1LOgowwWLC8cvyk"

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 