"""AI service for resume enhancement using Azure OpenAI."""
import os
import logging
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered resume enhancements."""
    
    def __init__(self):
        """Initialize Azure OpenAI client."""
        self.client = AzureOpenAI(
            azure_endpoint=os.getenv("AZURE_ENDPOINT"),
            api_key=os.getenv("AZURE_API_KEY"),
            api_version=os.getenv("AZURE_API_VERSION", "2024-06-01")
        )
        self.deployment_name = "gpt-4o"  # Default deployment name
    
    def enhance_description(self, text: str, context: str = "") -> str:
        """
        Enhance a resume description using AI.
        
        Args:
            text: The text to enhance
            context: Additional context (e.g., "work experience", "summary")
        
        Returns:
            Enhanced text
        """
        prompt = f"""You are a professional resume writer. 
Improve the following {context if context else 'text'} to make it more professional, 
impactful, and ATS-friendly. Keep it concise and use action verbs.

Original text:
{text}

Enhanced version (provide only the improved text without explanations):"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": "You are an expert resume writer."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error enhancing text: {e}")
            return text  # Return original if enhancement fails
    
    def suggest_skills(self, experiences: list, education: list) -> list:
        """
        Suggest relevant skills based on experience and education.
        
        Args:
            experiences: List of work experiences
            education: List of education entries
        
        Returns:
            List of suggested skills
        """
        exp_text = "\n".join([
            f"- {exp.get('position', '')} at {exp.get('company', '')}: {exp.get('description', '')}"
            for exp in experiences
        ])
        
        edu_text = "\n".join([
            f"- {edu.get('degree', '')} in {edu.get('field', '')} from {edu.get('institution', '')}"
            for edu in education
        ])
        
        prompt = f"""Based on the following professional background, suggest 10-15 relevant skills 
that should be included in a resume. Focus on both technical and soft skills.

Work Experience:
{exp_text}

Education:
{edu_text}

Provide only a comma-separated list of skills, nothing else:"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": "You are a career counselor and resume expert."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.7
            )
            skills_text = response.choices[0].message.content.strip()
            skills = [skill.strip() for skill in skills_text.split(',')]
            return skills[:15]  # Limit to 15 skills
        except Exception as e:
            logger.error(f"Error suggesting skills: {e}")
            return []
