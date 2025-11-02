import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import axios from 'axios';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MaintenanceScheduleData {
  taskName: string;
  description: string;
  interval: string;
  intervalHours?: number;
  intervalDays?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category?: string;
  estimatedDuration?: string;
  requiredTools?: string;
  safetyNotes?: string;
}

interface SparePartData {
  partNumber: string;
  partName: string;
  description?: string;
  category?: string;
  quantity?: number;
  manufacturer?: string;
  supplier?: string;
  replacementInterval?: string;
  criticalPart: boolean;
}

interface SpecificationData {
  category: string;
  name: string;
  value: string;
  unit?: string;
  notes?: string;
}

interface ManualAnalysisResult {
  summary: string;
  maintenanceSchedules: MaintenanceScheduleData[];
  spareParts: SparePartData[];
  specifications: SpecificationData[];
}

// Extract text from PDF URL
async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    // Download PDF from Cloudinary
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
    });

    // Parse PDF
    const pdfBuffer = Buffer.from(response.data);
    const data = await pdfParse(pdfBuffer);

    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Convert interval string to hours/days
function parseInterval(interval: string): { hours?: number; days?: number } {
  const result: { hours?: number; days?: number } = {};
  
  // Match patterns like "500h", "500 hours", "Daily", "Monthly", "Annually"
  const hourMatch = interval.match(/(\d+)\s*(h|hour|hours)/i);
  const dayMatch = interval.match(/(\d+)\s*(d|day|days)/i);
  
  if (hourMatch) {
    result.hours = parseInt(hourMatch[1]);
  } else if (dayMatch) {
    result.days = parseInt(dayMatch[1]);
  } else if (/daily/i.test(interval)) {
    result.days = 1;
  } else if (/weekly/i.test(interval)) {
    result.days = 7;
  } else if (/monthly/i.test(interval)) {
    result.days = 30;
  } else if (/quarterly/i.test(interval)) {
    result.days = 90;
  } else if (/annually|yearly/i.test(interval)) {
    result.days = 365;
  }
  
  return result;
}

// Analyze manual with OpenAI
export async function analyzeManualWithAI(
  pdfUrl: string,
  equipmentName: string,
  manufacturer?: string
): Promise<ManualAnalysisResult> {
  try {
    console.log('🤖 Starting AI analysis of manual...');
    
    // Step 1: Extract text from PDF
    console.log('📄 Extracting text from PDF...');
    const pdfText = await extractTextFromPDF(pdfUrl);
    
    if (!pdfText || pdfText.length < 100) {
      throw new Error('PDF text extraction failed or text too short');
    }
    
    console.log(`✅ Extracted ${pdfText.length} characters from PDF`);
    
    // Truncate text if too long (OpenAI has token limits)
    const maxChars = 50000; // ~12,500 tokens for GPT-4
    const truncatedText = pdfText.length > maxChars 
      ? pdfText.substring(0, maxChars) + '\n\n[Text truncated due to length...]'
      : pdfText;

    // Step 2: Send to OpenAI for analysis
    console.log('🧠 Sending to OpenAI for analysis...');
    
    const systemPrompt = `You are an expert at analyzing equipment maintenance manuals. 
Extract structured data from the provided equipment manual text.

Focus on:
1. **Maintenance Schedules**: Regular maintenance tasks, intervals, priorities
2. **Spare Parts**: Part numbers, names, categories, critical parts
3. **Technical Specifications**: Performance data, dimensions, electrical specs

Be thorough but concise. Extract actual data from the manual, don't make assumptions.
If information is not clearly stated, omit it rather than guessing.`;

    const userPrompt = `Analyze this equipment manual for: ${equipmentName}${manufacturer ? ` (${manufacturer})` : ''}

Extract:
1. All maintenance schedules with intervals
2. All spare parts with part numbers
3. Technical specifications

Manual text:
${truncatedText}

Provide the response in JSON format with this structure:
{
  "summary": "Brief summary of the equipment and manual",
  "maintenanceSchedules": [
    {
      "taskName": "Task name",
      "description": "What needs to be done",
      "interval": "e.g., 500 hours, Monthly, Daily",
      "priority": "LOW | MEDIUM | HIGH | CRITICAL",
      "category": "e.g., Lubrication, Inspection, Replacement",
      "estimatedDuration": "e.g., 2 hours, 30 minutes",
      "requiredTools": "Tools needed",
      "safetyNotes": "Safety considerations"
    }
  ],
  "spareParts": [
    {
      "partNumber": "Manufacturer part number",
      "partName": "Part name",
      "description": "Part description",
      "category": "e.g., Filter, Bearing, Seal",
      "quantity": 1,
      "manufacturer": "Manufacturer name",
      "replacementInterval": "When to replace",
      "criticalPart": true/false
    }
  ],
  "specifications": [
    {
      "category": "e.g., Performance, Dimensions, Electrical",
      "name": "Specification name",
      "value": "Specification value",
      "unit": "Unit if applicable",
      "notes": "Additional notes"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster and cheaper for structured extraction
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 4000,
    });

    const responseText = completion.choices[0].message.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    console.log('✅ OpenAI analysis complete');

    // Step 3: Parse response
    const analysis = JSON.parse(responseText) as ManualAnalysisResult;

    // Step 4: Post-process data
    // Parse intervals to hours/days
    if (analysis.maintenanceSchedules) {
      analysis.maintenanceSchedules = analysis.maintenanceSchedules.map(schedule => {
        const parsed = parseInterval(schedule.interval);
        return {
          ...schedule,
          intervalHours: parsed.hours,
          intervalDays: parsed.days,
        };
      });
    }

    // Validate and set defaults
    if (!analysis.summary) {
      analysis.summary = `Manual for ${equipmentName} analyzed successfully.`;
    }
    
    if (!analysis.maintenanceSchedules) {
      analysis.maintenanceSchedules = [];
    }
    
    if (!analysis.spareParts) {
      analysis.spareParts = [];
    }
    
    if (!analysis.specifications) {
      analysis.specifications = [];
    }

    console.log(`📊 Extracted: ${analysis.maintenanceSchedules.length} schedules, ${analysis.spareParts.length} parts, ${analysis.specifications.length} specs`);

    return analysis;
  } catch (error) {
    console.error('❌ Error analyzing manual with AI:', error);
    
    // Return empty result instead of throwing
    return {
      summary: `AI analysis failed for ${equipmentName}. Please review the manual manually.`,
      maintenanceSchedules: [],
      spareParts: [],
      specifications: [],
    };
  }
}

// Test function (optional)
export async function testManualAI() {
  console.log('🧪 Testing Manual AI Service...');
  
  const testResult = await analyzeManualWithAI(
    'https://example.com/manual.pdf',
    'Crown Block',
    'National Oilwell Varco'
  );
  
  console.log('Test Result:', JSON.stringify(testResult, null, 2));
}
