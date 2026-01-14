"""
AI Service for Resume Parsing
Uses OpenAI and LangChain for intelligent resume parsing and data extraction
"""

import os
import base64
from typing import Dict, List, Optional
import json
from openai import OpenAI
import PyPDF2
import docx
import io

# Optional LangChain imports - only import if available
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    LANGCHAIN_AVAILABLE = True
except ImportError:
    try:
        # Fallback for older langchain versions
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        LANGCHAIN_AVAILABLE = True
    except ImportError:
        LANGCHAIN_AVAILABLE = False
        RecursiveCharacterTextSplitter = None

class AIService:
    """AI-powered resume parsing service"""
    
    def __init__(self):
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")
        # Initialize text splitter only if langchain is available
        if LANGCHAIN_AVAILABLE and RecursiveCharacterTextSplitter:
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=4000,
                chunk_overlap=200
            )
        else:
            self.text_splitter = None
    
    async def parse_resume(self, file_content: bytes, filename: str) -> Dict:
        """
        Parse resume file and extract structured data using AI
        
        Args:
            file_content: Binary content of the resume file
            filename: Original filename
            
        Returns:
            Dictionary with parsed resume data
        """
        try:
            print(f"[AI_SERVICE] Extracting text from {filename}...")
            # Extract text from file
            text = self._extract_text(file_content, filename)
            
            if not text:
                raise ValueError("Could not extract text from resume file")
            
            print(f"[AI_SERVICE] Extracted {len(text)} characters of text")
            print(f"[AI_SERVICE] First 300 chars: {text[:300]}")
            
            # Use AI to parse and structure the resume
            print(f"[AI_SERVICE] Calling OpenAI API to parse resume...")
            structured_data = await self._parse_with_ai(text, filename)
            
            print(f"[AI_SERVICE] OpenAI parsing completed. Experience count: {len(structured_data.get('experience', []))}")
            
            # Add file metadata
            structured_data["original_filename"] = filename
            structured_data["file_type"] = self._get_file_type(filename)
            structured_data["file_size"] = len(file_content)
            
            return structured_data
            
        except Exception as e:
            import traceback
            print(f"[AI_SERVICE] Error parsing resume: {str(e)}")
            print(f"[AI_SERVICE] Traceback: {traceback.format_exc()}")
            raise Exception(f"Error parsing resume: {str(e)}")
    
    async def polish_text(self, text: str) -> str:
        """
        Polish and format text using AI to improve grammar, spelling, and style.
        
        Args:
            text: The text to polish
            
        Returns:
            Polished text with improved grammar, spelling, and formatting
        """
        if not text or not text.strip():
            return text
        
        try:
            system_prompt = """You are a professional writing assistant. Your task is to polish and improve the provided text.

Requirements:
1. Fix all spelling and grammar mistakes
2. Improve sentence structure and flow
3. Make the text sound more professional and polished
4. Maintain the original meaning and tone
5. Keep the same level of formality
6. Preserve paragraph breaks and structure
7. Do not add new information not present in the original text
8. If the text is already well-written, make only minor improvements

Return only the polished text without any explanations or additional commentary."""
            
            user_prompt = f"""Please polish the following text, fixing grammar, spelling, and making it sound more professional:

{text}"""
            
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            polished_text = response.choices[0].message.content.strip()
            return polished_text
            
        except Exception as e:
            import traceback
            print(f"[AI_SERVICE] Error polishing text: {str(e)}")
            print(f"[AI_SERVICE] Traceback: {traceback.format_exc()}")
            raise Exception(f"Error polishing text: {str(e)}")
    
    def _extract_text(self, file_content: bytes, filename: str) -> str:
        """Extract text from various file formats"""
        file_ext = filename.lower().split('.')[-1] if '.' in filename else ''
        print(f"[AI_SERVICE] Extracting text from {filename} (extension: {file_ext})")
        
        if file_ext == 'pdf':
            return self._extract_from_pdf(file_content)
        elif file_ext in ['doc', 'docx']:
            return self._extract_from_docx(file_content)
        elif file_ext == 'txt':
            text = file_content.decode('utf-8', errors='ignore')
            print(f"[AI_SERVICE] Extracted {len(text)} characters from text file")
            return text
        else:
            # Try to decode as text
            try:
                text = file_content.decode('utf-8', errors='ignore')
                print(f"[AI_SERVICE] Extracted {len(text)} characters from text file (fallback)")
                return text
            except:
                print(f"[AI_SERVICE] WARNING: Unknown file extension: {file_ext}")
                raise ValueError(f"Unsupported file format: {file_ext}")
    
    def _extract_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file"""
        try:
            print(f"[AI_SERVICE] Extracting text from PDF ({len(file_content)} bytes)...")
            pdf_file = io.BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            page_count = len(pdf_reader.pages)
            print(f"[AI_SERVICE] PDF has {page_count} pages")
            for i, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                text += page_text + "\n"
                print(f"[AI_SERVICE] Page {i+1}: extracted {len(page_text)} characters")
            print(f"[AI_SERVICE] Total extracted text: {len(text)} characters")
            if len(text.strip()) == 0:
                print(f"[AI_SERVICE] WARNING: No text extracted from PDF!")
            return text
        except Exception as e:
            import traceback
            print(f"[AI_SERVICE] Error extracting PDF text: {str(e)}")
            print(f"[AI_SERVICE] Traceback: {traceback.format_exc()}")
            raise Exception(f"Error extracting PDF text: {str(e)}")
    
    def _extract_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX file"""
        try:
            print(f"[AI_SERVICE] Extracting text from DOCX ({len(file_content)} bytes)...")
            doc_file = io.BytesIO(file_content)
            doc = docx.Document(doc_file)
            paragraphs = [paragraph.text for paragraph in doc.paragraphs]
            text = "\n".join(paragraphs)
            print(f"[AI_SERVICE] DOCX has {len(paragraphs)} paragraphs")
            print(f"[AI_SERVICE] Total extracted text: {len(text)} characters")
            if len(text.strip()) == 0:
                print(f"[AI_SERVICE] WARNING: No text extracted from DOCX!")
            return text
        except Exception as e:
            import traceback
            print(f"[AI_SERVICE] Error extracting DOCX text: {str(e)}")
            print(f"[AI_SERVICE] Traceback: {traceback.format_exc()}")
            raise Exception(f"Error extracting DOCX text: {str(e)}")
    
    def _get_file_type(self, filename: str) -> str:
        """Get file type from filename"""
        ext = filename.lower().split('.')[-1] if '.' in filename else 'unknown'
        return ext
    
    async def _parse_with_ai(self, text: str, filename: str) -> Dict:
        """Use OpenAI to parse and structure resume text"""
        
        system_prompt = """You are an expert resume parser. Your primary task is to extract ALL work experience entries from the resume text.

CRITICAL: You MUST extract every work experience entry, even if the format is non-standard. Look for:
- Job titles and company names
- Employment dates (start and end dates, or "Current"/"Present")
- Job descriptions, responsibilities, and achievements
- Location information if provided

Work experience entries may appear under headings like:
- "Work Experience"
- "Employment History"
- "Professional Experience"
- "Career History"
- "Employment"
- Or simply as company names with job titles

Return a JSON object with the following structure:
{
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "address": "full address",
    "linkedin": "LinkedIn URL if present",
    "github": "GitHub URL if present",
    "website": "Personal website if present",
    "summary": "Professional summary or objective",
    "objective": "Career objective if separate from summary",
    "experience": [
        {
            "company": "Company Name (REQUIRED - extract from text)",
            "title": "Job Title/Position (REQUIRED - extract from text)",
            "start_date": "Start date (format: Month YYYY or YYYY-MM)",
            "end_date": "End date or 'Present' or 'Current' if ongoing",
            "description": "Full job description including all responsibilities, duties, and key achievements. Combine all bullet points and paragraphs related to this position.",
            "achievements": ["achievement 1", "achievement 2", "achievement 3"]
        }
    ],
    "education": [
        {
            "institution": "School/University Name",
            "degree": "Degree Type",
            "field": "Field of Study",
            "start_date": "Start date",
            "end_date": "End date",
            "gpa": "GPA if mentioned"
        }
    ],
    "skills": {
        "technical": ["skill1", "skill2"],
        "soft": ["skill1", "skill2"],
        "languages": ["language1", "language2"],
        "tools": ["tool1", "tool2"]
    },
    "certifications": [
        {
            "name": "Certification Name",
            "issuer": "Issuing Organization",
            "date": "Date obtained",
            "expiry": "Expiry date if applicable"
        }
    ],
    "projects": [
        {
            "name": "Project Name",
            "description": "Project description",
            "technologies": ["tech1", "tech2"],
            "url": "Project URL if available"
        }
    ],
    "languages": [
        {
            "language": "Language Name",
            "proficiency": "Native/Fluent/Intermediate/Basic"
        }
    ],
    "awards": [
        {
            "title": "Award Title",
            "issuer": "Issuing Organization",
            "date": "Date received",
            "description": "Award description"
        }
    ]
}

IMPORTANT RULES:
1. The "experience" array MUST contain ALL work experience entries found in the resume
2. Each experience entry MUST have at minimum: company, title, and dates
3. If dates are in different formats (e.g., "Feb 2020 - Current", "2020-02 to Present"), normalize them but preserve the original meaning
4. Include ALL bullet points and descriptions under each job as part of the "description" field
5. Extract achievements separately if they are clearly listed as achievements, otherwise include them in the description
6. If a section has multiple roles at the same company, create separate entries
7. Do NOT skip any work experience entries, even if they seem incomplete

Extract all available information. If a field is not present, use null or empty array/object as appropriate.
Be thorough and accurate in extraction. The work experience section is the most critical part."""
        
        user_prompt = f"""Parse the following resume text and extract ALL work experience entries. Pay special attention to the "Work Experience" section and extract every job entry you find.

Resume text:
{text}

IMPORTANT: Make sure you extract EVERY work experience entry. Look carefully through the entire text for any employment history, work experience, or job positions."""
        
        try:
            print(f"[AI_SERVICE] Sending request to OpenAI model: {self.model}")
            print(f"[AI_SERVICE] Text length: {len(text)} characters")
            print(f"[AI_SERVICE] System prompt length: {len(system_prompt)} characters")
            print(f"[AI_SERVICE] User prompt length: {len(user_prompt)} characters")
            
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            print(f"[AI_SERVICE] OpenAI API response received")
            
            # Parse JSON response
            response_content = response.choices[0].message.content
            print(f"[AI_SERVICE] Response content length: {len(response_content)} characters")
            print(f"[AI_SERVICE] First 500 chars of response: {response_content[:500]}")
            
            parsed_data = json.loads(response_content)
            
            # Validate that we got experience data
            experiences = parsed_data.get("experience", [])
            print(f"[AI_SERVICE] Parsed {len(experiences)} experiences from AI response")
            
            if len(experiences) == 0:
                print(f"[AI_SERVICE] WARNING: No experiences in parsed data!")
                print(f"[AI_SERVICE] All keys in parsed_data: {list(parsed_data.keys())}")
                # Try to see if experiences are under a different key
                for key in parsed_data.keys():
                    if 'experience' in key.lower() or 'work' in key.lower() or 'employment' in key.lower():
                        print(f"[AI_SERVICE] Found potential experience key: {key} = {type(parsed_data[key])}")
            
            # Store raw data
            parsed_data["raw_data"] = {
                "original_text": text[:1000],  # Store first 1000 chars for debugging
                "filename": filename,
                "parsing_model": self.model
            }
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            print(f"[AI_SERVICE] JSON decode error: {str(e)}")
            print(f"[AI_SERVICE] Response content: {response_content[:1000] if 'response_content' in locals() else 'N/A'}")
            raise Exception(f"Error parsing AI response as JSON: {str(e)}")
        except Exception as e:
            import traceback
            print(f"[AI_SERVICE] Error in AI parsing: {str(e)}")
            print(f"[AI_SERVICE] Traceback: {traceback.format_exc()}")
            raise Exception(f"Error in AI parsing: {str(e)}")
    
    async def summarize_conversation(self, transcription_text: str, conversation_context: Optional[Dict] = None) -> Dict:
        """
        Summarize a video conversation transcription using AI
        
        Args:
            transcription_text: The full transcription text from the video recording
            conversation_context: Optional context like participant names, meeting topic, etc.
            
        Returns:
            Dictionary with summary, key points, action items, and sentiment
        """
        try:
            if not transcription_text or not transcription_text.strip():
                raise ValueError("Transcription text is required for summarization")
            
            print(f"[AI_SERVICE] Summarizing conversation ({len(transcription_text)} characters)...")
            
            # Build system prompt for conversation summarization
            system_prompt = """You are an expert at summarizing professional conversations and video calls. 
Your task is to analyze a conversation transcription and provide:
1. A concise summary of the main discussion points
2. Key points or highlights from the conversation
3. Action items or next steps mentioned
4. Overall sentiment of the conversation

Return a JSON object with the following structure:
{
    "summary": "A 2-3 paragraph summary of the main discussion",
    "key_points": ["Point 1", "Point 2", "Point 3"],
    "action_items": ["Action item 1", "Action item 2"],
    "sentiment": "positive" | "neutral" | "negative",
    "topics": ["Topic 1", "Topic 2", "Topic 3"]
}

Be professional, accurate, and focus on actionable insights."""
            
            # Build user prompt with context
            context_info = ""
            if conversation_context:
                if conversation_context.get('talent_name'):
                    context_info += f"\nTalent participant: {conversation_context['talent_name']}"
                if conversation_context.get('business_name'):
                    context_info += f"\nBusiness participant: {conversation_context['business_name']}"
                if conversation_context.get('topic'):
                    context_info += f"\nMeeting topic: {conversation_context['topic']}"
            
            user_prompt = f"""Please summarize the following conversation transcription.{context_info}

Transcription:
{transcription_text}

Provide a comprehensive summary in JSON format."""
            
            print(f"[AI_SERVICE] Calling OpenAI API for conversation summary...")
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent summaries
                response_format={"type": "json_object"}
            )
            
            response_content = response.choices[0].message.content
            print(f"[AI_SERVICE] OpenAI API response received ({len(response_content)} characters)")
            
            # Parse JSON response
            summary_data = json.loads(response_content)
            
            # Validate and structure response
            result = {
                "summary": summary_data.get("summary", ""),
                "key_points": summary_data.get("key_points", []),
                "action_items": summary_data.get("action_items", []),
                "sentiment": summary_data.get("sentiment", "neutral"),
                "topics": summary_data.get("topics", []),
                "ai_model_used": self.model
            }
            
            print(f"[AI_SERVICE] Summary generated: {len(result['summary'])} chars, {len(result['key_points'])} key points, {len(result['action_items'])} action items")
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"[AI_SERVICE] JSON decode error in summarization: {str(e)}")
            print(f"[AI_SERVICE] Response content: {response_content[:1000] if 'response_content' in locals() else 'N/A'}")
            raise Exception(f"Error parsing AI summary response: {str(e)}")
        except Exception as e:
            import traceback
            print(f"[AI_SERVICE] Error in conversation summarization: {str(e)}")
            print(f"[AI_SERVICE] Traceback: {traceback.format_exc()}")
            raise Exception(f"Error summarizing conversation: {str(e)}")
    
    async def enhance_resume_data(self, resume_data: Dict) -> Dict:
        """Enhance resume data with AI insights and suggestions"""
        try:
            prompt = f"""Analyze this resume data and provide enhancements:
            - Suggest missing skills based on experience
            - Identify strengths and areas for improvement
            - Suggest keywords for ATS optimization
            - Provide career recommendations
            
            Resume Data: {json.dumps(resume_data, indent=2)}
            
            Return JSON with:
            {{
                "suggested_skills": ["skill1", "skill2"],
                "strengths": ["strength1", "strength2"],
                "improvements": ["improvement1", "improvement2"],
                "ats_keywords": ["keyword1", "keyword2"],
                "career_recommendations": ["recommendation1", "recommendation2"]
            }}"""
            
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a career advisor and resume expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            enhancements = json.loads(response.choices[0].message.content)
            return enhancements
            
        except Exception as e:
            raise Exception(f"Error enhancing resume: {str(e)}")



