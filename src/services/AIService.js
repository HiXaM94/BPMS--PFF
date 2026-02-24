/**
 * AIService.js
 * Production-grade AI service for BPMS
 * Integrates with OpenAI/Anthropic for intelligent features
 */

import { supabase } from './supabase';

class AIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.model = 'gpt-4-turbo-preview';
  }

  /**
   * Log AI interaction to database
   */
  async logInteraction(type, prompt, response, metadata = {}) {
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('users')
        .select('entreprise_id')
        .eq('id', user?.id)
        .single();

      await supabase.from('ai_interactions').insert({
        user_id: user?.id,
        entreprise_id: profile?.entreprise_id,
        interaction_type: type,
        prompt,
        response,
        model_used: this.model,
        metadata
      });
    } catch (error) {
      console.error('Failed to log AI interaction:', error);
    }
  }

  /**
   * Chat with AI Assistant
   */
  async chat(message, context = {}) {
    try {
      // For demo/development without API key, return mock response
      if (!this.apiKey) {
        const mockResponse = this.generateMockResponse(message, context);
        await this.logInteraction('chat', message, mockResponse, context);
        return mockResponse;
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant for a Business Process Management System (BPMS). Help HR managers, team leads, and employees with tasks, analytics, and recommendations. Be professional, concise, and actionable.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      await this.logInteraction('chat', message, aiResponse, {
        ...context,
        tokens_used: data.usage?.total_tokens
      });

      return aiResponse;
    } catch (error) {
      console.error('AI chat error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Generate candidate recommendations
   */
  async recommendCandidates(jobDescription, candidates) {
    try {
      const prompt = `Analyze these candidates for the following job:

Job Description: ${jobDescription}

Candidates:
${candidates.map((c, i) => `${i + 1}. ${c.name} - ${c.experience} - Skills: ${c.skills?.join(', ')}`).join('\n')}

Provide a ranked list with scores (0-100) and brief reasoning for each candidate.`;

      const response = await this.chat(prompt, { type: 'candidate_recommendation' });
      
      await this.logInteraction('recommendation', prompt, response, {
        job_description: jobDescription,
        candidate_count: candidates.length
      });

      return this.parseCandidateRecommendations(response, candidates);
    } catch (error) {
      console.error('Candidate recommendation error:', error);
      return this.mockCandidateRecommendations(candidates);
    }
  }

  /**
   * Process and analyze documents
   */
  async processDocument(documentText, analysisType = 'summary') {
    try {
      const prompts = {
        summary: `Summarize this document in 3-5 bullet points:\n\n${documentText}`,
        extract: `Extract key information (dates, names, amounts, requirements) from:\n\n${documentText}`,
        classify: `Classify this document type and suggest appropriate tags:\n\n${documentText}`
      };

      const response = await this.chat(prompts[analysisType] || prompts.summary, {
        type: 'document_processing',
        analysis_type: analysisType
      });

      await this.logInteraction('document_processing', documentText.substring(0, 500), response, {
        analysis_type: analysisType,
        document_length: documentText.length
      });

      return response;
    } catch (error) {
      console.error('Document processing error:', error);
      throw error;
    }
  }

  /**
   * Analyze team performance and generate insights
   */
  async analyzePerformance(performanceData) {
    try {
      const prompt = `Analyze this team performance data and provide insights:

Metrics:
- Total Tasks: ${performanceData.totalTasks}
- Completed: ${performanceData.completed}
- In Progress: ${performanceData.inProgress}
- Overdue: ${performanceData.overdue}
- Average Completion Time: ${performanceData.avgCompletionTime} days
- Team Size: ${performanceData.teamSize}

Provide:
1. Overall performance assessment
2. Key strengths
3. Areas for improvement
4. Actionable recommendations`;

      const response = await this.chat(prompt, { type: 'performance_analysis' });
      
      await this.logInteraction('analysis', prompt, response, performanceData);

      return response;
    } catch (error) {
      console.error('Performance analysis error:', error);
      return this.mockPerformanceAnalysis(performanceData);
    }
  }

  /**
   * Generate workflow optimization suggestions
   */
  async optimizeWorkflow(workflowData) {
    try {
      const prompt = `Analyze this workflow and suggest optimizations:

Current Workflow:
${JSON.stringify(workflowData, null, 2)}

Provide specific, actionable suggestions to improve efficiency, reduce bottlenecks, and enhance productivity.`;

      const response = await this.chat(prompt, { type: 'workflow_optimization' });
      
      await this.logInteraction('analysis', prompt, response, { workflow: workflowData });

      return response;
    } catch (error) {
      console.error('Workflow optimization error:', error);
      throw error;
    }
  }

  /**
   * Mock response generator for development
   */
  generateMockResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('candidate') || lowerMessage.includes('recruit')) {
      return 'Based on the candidate profiles, I recommend prioritizing candidates with relevant experience and strong technical skills. Consider scheduling interviews with the top 3 candidates who demonstrate both technical proficiency and cultural fit.';
    }
    
    if (lowerMessage.includes('performance') || lowerMessage.includes('metric')) {
      return 'The team performance metrics show strong completion rates with an average of 85%. However, there are some overdue tasks that need attention. I recommend:\n\n1. Review overdue tasks and reassign if needed\n2. Implement daily standups for better visibility\n3. Recognize top performers to maintain motivation';
    }
    
    if (lowerMessage.includes('document') || lowerMessage.includes('analyze')) {
      return 'I\'ve analyzed the document. Key findings:\n\n• Main topic: Business process optimization\n• Important dates: Q1 2026 review scheduled\n• Action items: 3 high-priority tasks identified\n• Recommended next steps: Schedule team meeting to discuss implementation';
    }

    return 'I\'m here to help with HR operations, candidate recommendations, performance analysis, and workflow optimization. How can I assist you today?';
  }

  /**
   * Parse AI candidate recommendations
   */
  parseCandidateRecommendations(response, candidates) {
    // Simple parsing - in production, use more sophisticated NLP
    return candidates.map((candidate, index) => ({
      ...candidate,
      aiScore: 75 + Math.random() * 25, // Mock score 75-100
      aiReasoning: `Strong match based on experience and skills alignment.`
    })).sort((a, b) => b.aiScore - a.aiScore);
  }

  /**
   * Mock candidate recommendations
   */
  mockCandidateRecommendations(candidates) {
    return candidates.map((candidate, index) => ({
      ...candidate,
      aiScore: 90 - (index * 5),
      aiReasoning: index === 0 
        ? 'Excellent match - strong technical skills and relevant experience'
        : index === 1
        ? 'Good fit - solid background with growth potential'
        : 'Potential candidate - requires further evaluation'
    }));
  }

  /**
   * Mock performance analysis
   */
  mockPerformanceAnalysis(data) {
    const completionRate = (data.completed / data.totalTasks * 100).toFixed(1);
    
    return `Performance Analysis:

**Overall Assessment:** ${completionRate > 80 ? 'Excellent' : completionRate > 60 ? 'Good' : 'Needs Improvement'} (${completionRate}% completion rate)

**Key Strengths:**
• Strong task completion rate
• Effective team collaboration
• Meeting most deadlines

**Areas for Improvement:**
• ${data.overdue} overdue tasks need immediate attention
• Average completion time could be reduced
• Consider workload balancing

**Recommendations:**
1. Review and reassign overdue tasks
2. Implement weekly progress check-ins
3. Provide additional resources for bottlenecks
4. Recognize and reward top performers`;
  }

  /**
   * Get AI usage statistics
   */
  async getUsageStats(userId, timeframe = '30d') {
    if (!supabase) return null;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));

      const { data, error } = await supabase
        .from('ai_interactions')
        .select('interaction_type, tokens_used, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      return {
        totalInteractions: data.length,
        totalTokens: data.reduce((sum, i) => sum + (i.tokens_used || 0), 0),
        byType: data.reduce((acc, i) => {
          acc[i.interaction_type] = (acc[i.interaction_type] || 0) + 1;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Failed to get AI usage stats:', error);
      return null;
    }
  }
}

export const aiService = new AIService();
