import os
import json
from emergentintegrations import Anthropic
from typing import Dict, Any

class VoiceIntakeService:
    """Service for processing voice transcriptions and extracting medical data"""
    
    def __init__(self):
        self.llm_key = os.getenv("EMERGENT_LLM_KEY")
        self.anthropic_client = Anthropic(api_key=self.llm_key)
    
    async def extract_medical_data(self, transcript: str) -> Dict[str, Any]:
        """
        Extract structured medical data from voice transcription using Claude Sonnet-4
        
        Args:
            transcript: Raw transcription text from Deepgram
            
        Returns:
            Structured medical data as dictionary
        """
        
        system_prompt = """You are a medical data extraction assistant. 
Your job is to extract structured medical information from patient voice transcriptions.

Extract the following information when available:
- Current medications (name, dosage, frequency)
- Known allergies
- Chronic medical conditions
- Previous weight loss attempts and outcomes
- Weight loss goals
- Current weight and height
- Concerns or questions about GLP-1 therapy

Format the response as a structured JSON object with clear sections.
If information is not provided, mark as "Not mentioned" or null.
"""

        user_prompt = f"""Extract medical information from this patient transcript:

{transcript}

Provide a structured JSON response with the following format:
{{
  "medications": [
    {{"name": "medication name", "dosage": "dosage", "frequency": "frequency"}}
  ],
  "allergies": ["allergy1", "allergy2"],
  "chronic_conditions": ["condition1", "condition2"],
  "weight_history": {{
    "current_weight": "weight in lbs",
    "current_height": "height in inches",
    "previous_attempts": ["attempt1", "attempt2"],
    "weight_loss_goals": "goal description"
  }},
  "concerns": ["concern1", "concern2"],
  "additional_notes": "any other relevant information"
}}
"""

        try:
            response = self.anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ]
            )
            
            # Extract the content from response
            content = response.content[0].text
            
            # Parse JSON from response
            try:
                medical_data = json.loads(content)
            except json.JSONDecodeError:
                # If response is not pure JSON, try to extract JSON from it
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    medical_data = json.loads(json_match.group())
                else:
                    medical_data = {
                        "raw_extraction": content,
                        "error": "Could not parse as JSON"
                    }
            
            return {
                "success": True,
                "data": medical_data,
                "raw_transcript": transcript
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "raw_transcript": transcript
            }
    
    def format_for_storage(self, medical_data: Dict[str, Any]) -> str:
        """
        Format extracted medical data for storage in MongoDB
        
        Args:
            medical_data: Extracted medical data dictionary
            
        Returns:
            Formatted string for database storage
        """
        if not medical_data.get("success"):
            return f"Extraction Error: {medical_data.get('error')}"
        
        data = medical_data.get("data", {})
        
        formatted = []
        formatted.append("=== MEDICAL HISTORY (AI-EXTRACTED) ===\n")
        
        # Medications
        meds = data.get("medications", [])
        if meds and isinstance(meds, list):
            formatted.append("MEDICATIONS:")
            for med in meds:
                if isinstance(med, dict):
                    formatted.append(f"  - {med.get('name', 'Unknown')}: {med.get('dosage', '')} {med.get('frequency', '')}")
                else:
                    formatted.append(f"  - {med}")
            formatted.append("")
        
        # Allergies
        allergies = data.get("allergies", [])
        if allergies:
            formatted.append(f"ALLERGIES: {', '.join(allergies)}")
            formatted.append("")
        
        # Chronic conditions
        conditions = data.get("chronic_conditions", [])
        if conditions:
            formatted.append(f"CHRONIC CONDITIONS: {', '.join(conditions)}")
            formatted.append("")
        
        # Weight history
        weight_history = data.get("weight_history", {})
        if weight_history:
            formatted.append("WEIGHT HISTORY:")
            if weight_history.get("current_weight"):
                formatted.append(f"  Current Weight: {weight_history.get('current_weight')}")
            if weight_history.get("current_height"):
                formatted.append(f"  Current Height: {weight_history.get('current_height')}")
            if weight_history.get("weight_loss_goals"):
                formatted.append(f"  Goals: {weight_history.get('weight_loss_goals')}")
            prev_attempts = weight_history.get("previous_attempts", [])
            if prev_attempts:
                formatted.append(f"  Previous Attempts: {', '.join(prev_attempts)}")
            formatted.append("")
        
        # Concerns
        concerns = data.get("concerns", [])
        if concerns:
            formatted.append("CONCERNS/QUESTIONS:")
            for concern in concerns:
                formatted.append(f"  - {concern}")
            formatted.append("")
        
        # Additional notes
        if data.get("additional_notes"):
            formatted.append(f"ADDITIONAL NOTES: {data.get('additional_notes')}")
        
        return "\n".join(formatted)
