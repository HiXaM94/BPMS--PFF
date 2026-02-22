import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert HR AI Assistant for a Business Process Management System (BPMS). 
You help HR managers and recruiters with:
- Ranking and screening job candidates based on CVs and qualifications
- Analyzing team performance trends and providing actionable recommendations
- Summarizing leave requests and flagging scheduling conflicts
- Drafting job descriptions, HR policies, and offer letters
- Parsing CV content to extract key skills, experience, and qualifications
- Providing candidate recommendations based on job requirements

Be concise, professional, and data-driven. Use bullet points and structured formatting.
When ranking candidates, always provide a score out of 100 and clear reasoning.
When analyzing performance, highlight both strengths and areas for improvement.
Always end with a clear recommendation or next action.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ reply: 'OpenAI API key not configured. Please set OPENAI_API_KEY in Supabase Edge Function secrets.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? 'No response generated.';

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ reply: `Error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
