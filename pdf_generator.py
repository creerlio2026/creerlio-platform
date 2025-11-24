"""PDF generation service for resumes."""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from models import Resume
import io


class PDFGenerator:
    """Service for generating PDF resumes."""
    
    def generate_resume_pdf(self, resume: Resume) -> bytes:
        """
        Generate a PDF resume from resume data.
        
        Args:
            resume: Resume data model
        
        Returns:
            PDF file as bytes
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=0.75*inch, leftMargin=0.75*inch,
                                topMargin=0.75*inch, bottomMargin=0.75*inch)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor='#2C3E50',
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        contact_style = ParagraphStyle(
            'ContactInfo',
            parent=styles['Normal'],
            fontSize=10,
            textColor='#34495E',
            alignment=TA_CENTER,
            spaceAfter=12
        )
        
        heading_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor='#2C3E50',
            spaceAfter=6,
            spaceBefore=12,
            fontName='Helvetica-Bold',
            borderWidth=0,
            borderColor='#2C3E50',
            borderPadding=0,
        )
        
        subheading_style = ParagraphStyle(
            'SubHeading',
            parent=styles['Normal'],
            fontSize=11,
            textColor='#2C3E50',
            spaceAfter=2,
            fontName='Helvetica-Bold'
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            textColor='#34495E',
            spaceAfter=6,
            alignment=TA_LEFT
        )
        
        # Add personal information
        personal = resume.personal_info
        elements.append(Paragraph(personal.full_name, title_style))
        
        # Contact information
        contact_parts = []
        if personal.email:
            contact_parts.append(personal.email)
        if personal.phone:
            contact_parts.append(personal.phone)
        if personal.location:
            contact_parts.append(personal.location)
        
        if contact_parts:
            elements.append(Paragraph(" | ".join(contact_parts), contact_style))
        
        # LinkedIn and Website
        links = []
        if personal.linkedin:
            links.append(f'<a href="{personal.linkedin}">LinkedIn</a>')
        if personal.website:
            links.append(f'<a href="{personal.website}">Website</a>')
        
        if links:
            elements.append(Paragraph(" | ".join(links), contact_style))
        
        # Summary
        if personal.summary:
            elements.append(Spacer(1, 0.1*inch))
            elements.append(Paragraph(personal.summary, normal_style))
        
        # Experience
        if resume.experiences:
            elements.append(Spacer(1, 0.2*inch))
            elements.append(Paragraph("PROFESSIONAL EXPERIENCE", heading_style))
            
            for exp in resume.experiences:
                # Company and position
                exp_header = f"<b>{exp.position}</b> - {exp.company}"
                elements.append(Paragraph(exp_header, subheading_style))
                
                # Dates
                end_date = "Present" if exp.current else (exp.end_date if exp.end_date else "")
                if exp.start_date or end_date:
                    date_range = f"{exp.start_date} - {end_date}" if exp.start_date else end_date
                    elements.append(Paragraph(date_range, normal_style))
                
                # Description
                elements.append(Paragraph(exp.description, normal_style))
                
                # Achievements
                if exp.achievements:
                    for achievement in exp.achievements:
                        elements.append(Paragraph(f"• {achievement}", normal_style))
                
                elements.append(Spacer(1, 0.1*inch))
        
        # Education
        if resume.education:
            elements.append(Spacer(1, 0.1*inch))
            elements.append(Paragraph("EDUCATION", heading_style))
            
            for edu in resume.education:
                edu_header = f"<b>{edu.degree} in {edu.field}</b>"
                elements.append(Paragraph(edu_header, subheading_style))
                
                edu_info = edu.institution
                if edu.gpa:
                    edu_info += f" | GPA: {edu.gpa}"
                elements.append(Paragraph(edu_info, normal_style))
                
                # Dates
                if edu.start_date:
                    end_date = edu.end_date if edu.end_date else "Present"
                    date_range = f"{edu.start_date} - {end_date}"
                    elements.append(Paragraph(date_range, normal_style))
                
                elements.append(Spacer(1, 0.1*inch))
        
        # Skills
        if resume.skills:
            elements.append(Spacer(1, 0.1*inch))
            elements.append(Paragraph("SKILLS", heading_style))
            skills_text = " • ".join(resume.skills)
            elements.append(Paragraph(skills_text, normal_style))
        
        # Build PDF
        doc.build(elements)
        
        # Get the value of the BytesIO buffer
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
