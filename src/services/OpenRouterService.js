export class OpenRouterService {
    constructor() {
        this.baseURL = "https://api.groq.com/openai/v1/chat/completions";
        this.apiKey = import.meta.env.VITE_GROQ_API_KEY || '';
        this.model = "llama-3.3-70b-versatile";
    }

    async generateChecklist(position) {
        const prompt = `Act as an elite Senior Tech Recruiter. Generate a comprehensive Professional Interview Guide for the position of "${position}". 
The output MUST be formatted exactly like this structure, using these exact section headers:

Candidate Name: __________________

Checklist:
[ ] Skill/Requirement 1
[ ] Skill/Requirement 2
[ ] Skill/Requirement 3
[ ] Skill/Requirement 4
[ ] Skill/Requirement 5
[ ] Skill/Requirement 6

Questionnaire:
Q1: [High-impact Technical or Behavioral Question]
A1: [Expected professional answer or key points the interviewer should look for]

Q2: [High-impact Technical or Behavioral Question]
A2: [Expected professional answer or key points the interviewer should look for]

Q3: [High-impact Technical or Behavioral Question]
A3: [Expected professional answer or key points the interviewer should look for]

Q4: [High-impact Technical or Behavioral Question]
A4: [Expected professional answer or key points the interviewer should look for]

Remarks:
__________________________________________________
__________________________________________________

Score: ____ / 10`;

        return this._callAI(prompt);
    }

    async analyzeCandidates(position, evaluationsText) {
        const prompt = `Act as an expert HR assistant. Read the following candidate evaluations for the position of "${position}" and select the best candidate. 
Provide your response strictly in this format:

Best Candidate: [Candidate Name]
Score: [Score]/10
Reason: [A detailed, professional paragraph explaining why this candidate was chosen based on the provided qualitative feedback and scores.]

Evaluations:
${evaluationsText}`;

        return this._callAI(prompt);
    }

    async _callAI(prompt) {
        try {
            const response = await fetch(this.baseURL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": this.model,
                    "messages": [
                        { "role": "user", "content": prompt }
                    ],
                    "max_tokens": 1500
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API error: ${response.status} - ${errText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error calling Groq API:', error);
            throw new Error('Failed to generate response using AI.');
        }
    }
}

export const openRouterService = new OpenRouterService();
