'use server';

/**
 * @fileOverview Provides AI-powered suggestions for search terms (keywords and categories)
 * based on the user's initial input.
 *
 * @function suggestSearchTerms - The main function to get search term suggestions.
 *
 * @type {SuggestSearchTermsInput} - Input type for the suggestSearchTerms function.
 *
 * @type {SuggestSearchTermsOutput} - Output type for the suggestSearchTerms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSearchTermsInputSchema = z.object({
  searchTerm: z.string().describe('The initial search term provided by the user.'),
});

export type SuggestSearchTermsInput = z.infer<
  typeof SuggestSearchTermsInputSchema
>;

const SuggestSearchTermsOutputSchema = z.object({
  suggestedKeywords: z
    .array(z.string())
    .describe('Suggested keywords related to the initial search term.'),
  suggestedCategories: z
    .array(z.string())
    .describe('Suggested categories related to the initial search term.'),
});

export type SuggestSearchTermsOutput = z.infer<
  typeof SuggestSearchTermsOutputSchema
>;

export async function suggestSearchTerms(
  input: SuggestSearchTermsInput
): Promise<SuggestSearchTermsOutput> {
  return suggestSearchTermsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSearchTermsPrompt',
  input: {schema: SuggestSearchTermsInputSchema},
  output: {schema: SuggestSearchTermsOutputSchema},
  prompt: `You are an expert in generating search terms for influencer discovery.
  Given the initial search term provided by the user, suggest relevant keywords and categories
  that can help them discover more influencers.

  Initial Search Term: {{{searchTerm}}}

  Provide 5 suggested keywords and 3 suggested categories.
  Keywords should be specific and related to the search term.
  Categories should be broad and relevant to the search term.

  Format your response as a JSON object with "suggestedKeywords" and "suggestedCategories" arrays.
  `,
});

const suggestSearchTermsFlow = ai.defineFlow(
  {
    name: 'suggestSearchTermsFlow',
    inputSchema: SuggestSearchTermsInputSchema,
    outputSchema: SuggestSearchTermsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
