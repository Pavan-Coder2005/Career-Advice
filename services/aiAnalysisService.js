const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdf = require("pdf-parse");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    systemInstruction: "You are an expert career counselor for students in India. Your sole purpose is to analyze student profiles and resumes. Respond ONLY with a single, valid JSON object based on the provided schema and nothing else. Your analysis should be concise, actionable, and tailored to the Indian job market.",
});

// --- NEW HELPER FUNCTION TO SUMMARIZE LONG TEXT ---
/**
 * Uses the AI to summarize long text to ensure it fits within token limits
 * for the main analysis prompt.
 * @param {string} text - The long text to summarize.
 * @returns {Promise<string>} A concise summary of the text.
 */
async function summarizeResumeText(text) {
    console.log("Resume text is too long. Summarizing...");
    const summarizationPrompt = `Summarize the key skills, experiences, and projects from the following resume text. Keep the summary under 500 words, focusing only on the most critical information for a career analysis. Resume Text: "${text}"`;
    
    // Using a simpler generation for the summarization task
    const result = await model.generateContent(summarizationPrompt);
    const summary = result.response.text();
    console.log("Summarization complete.");
    return summary;
}

async function getCareerAnalysis(profileData, resumeBuffer) {
    try {
        let resumeText = "No resume provided.";
        const CHARACTER_LIMIT = 8000; // Approx. 2k tokens

        if (resumeBuffer) {
            const pdfData = await pdf(resumeBuffer);
            resumeText = pdfData.text;

            // --- MODIFIED LOGIC: SUMMARIZE INSTEAD OF TRUNCATE ---
            // If the resume text exceeds the character limit, summarize it.
            // Otherwise, use the full text.
            if (resumeText.length > CHARACTER_LIMIT) {
                resumeText = await summarizeResumeText(resumeText);
            }
        }

        const userPrompt = `
            Analyze the following student profile and resume to suggest career paths.
            Profile Data: ${JSON.stringify(profileData)}
            Resume Text: "${resumeText}"
        `;
        
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
                response_mime_type: "application/json",
                response_schema: {
                    type: "OBJECT",
                    properties: {
                        profileSummary: { 
                            type: "STRING",
                            description: "A concise, 2-3 sentence summary of the student's profile, highlighting their key strengths and interests."
                        },
                        topCareers: {
                            type: "ARRAY",
                            description: "A list of the top 3 recommended careers for the student.",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    careerTitle: { type: "STRING" },
                                    matchScore: { type: "STRING", description: "e.g., '92%'" },
                                    justification: { type: "STRING" }
                                },
                                required: ["careerTitle", "matchScore", "justification"]
                            }
                        },
                        learningRoadmap: {
                            type: "OBJECT",
                            description: "A step-by-step learning plan to help the student achieve their top career recommendation.",
                            properties: {
                                introduction: { type: "STRING" },
                                steps: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            stepTitle: { type: "STRING" },
                                            description: { type: "STRING" },
                                            resources: { type: "ARRAY", items: { type: "STRING" } },
                                            projectIdea: { type: "STRING" }
                                        },
                                        required: ["stepTitle", "description", "resources", "projectIdea"]
                                    }
                                }
                            },
                            required: ["introduction", "steps"]
                        }
                    },
                    required: ["profileSummary", "topCareers", "learningRoadmap"]
                }
            },
        });

        const response = result.response;
        const generatedText = response.text();

        if (!generatedText) {
            throw new Error("Received an empty response from the AI model.");
        }
        
        return JSON.parse(generatedText);

    } catch (error) {
        console.error("Error in AI Analysis Service:", error);
        throw error;
    }
}

module.exports = { getCareerAnalysis };