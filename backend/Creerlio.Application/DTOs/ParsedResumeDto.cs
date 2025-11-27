namespace Creerlio.Application.DTOs;

/// <summary>
/// DTO representing parsed resume data from AI processing
/// Master Plan: Pre-fills 60-70% of profile for user review
/// </summary>
public class ParsedResumeDto
{
    // Personal Information
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;

    // Professional Summary
    public string Headline { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;

    // Social Links
    public string LinkedInUrl { get; set; } = string.Empty;
    public string GitHubUrl { get; set; } = string.Empty;
    public string PortfolioUrl { get; set; } = string.Empty;

    // Work Experience
    public List<ParsedWorkExperienceDto> WorkExperiences { get; set; } = new();

    // Education
    public List<ParsedEducationDto> Educations { get; set; } = new();

    // Skills
    public List<ParsedSkillDto> Skills { get; set; } = new();

    // Certifications
    public List<ParsedCertificationDto> Certifications { get; set; } = new();

    // Awards
    public List<ParsedAwardDto> Awards { get; set; } = new();

    // Languages
    public List<ParsedLanguageDto> Languages { get; set; } = new();

    // Parsing Metadata
    public double ConfidenceScore { get; set; } // 0-100% confidence in parsing accuracy
    public List<string> SuggestedSections { get; set; } = new(); // Sections AI suggests adding
    public List<string> ParsingWarnings { get; set; } = new(); // Issues encountered
    public DateTime ParsedAt { get; set; } = DateTime.UtcNow;
}

public class ParsedWorkExperienceDto
{
    public string JobTitle { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty; // e.g., "2020-01"
    public string EndDate { get; set; } = string.Empty; // e.g., "2023-06" or "Present"
    public bool IsCurrent { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<string> Achievements { get; set; } = new();
    public List<string> Technologies { get; set; } = new();
    public string EmploymentType { get; set; } = string.Empty; // Full-time, Part-time, Contract
}

public class ParsedEducationDto
{
    public string Institution { get; set; } = string.Empty;
    public string Degree { get; set; } = string.Empty;
    public string Field { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public string GPA { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Honors { get; set; } = new();
}

public class ParsedSkillDto
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // Technical, Soft, Language, etc.
    public int? YearsOfExperience { get; set; }
    public int? ProficiencyLevel { get; set; } // 1-5
}

public class ParsedCertificationDto
{
    public string Name { get; set; } = string.Empty;
    public string IssuingOrganization { get; set; } = string.Empty;
    public string IssueDate { get; set; } = string.Empty;
    public string ExpiryDate { get; set; } = string.Empty;
    public string CredentialId { get; set; } = string.Empty;
    public string CredentialUrl { get; set; } = string.Empty;
}

public class ParsedAwardDto
{
    public string Title { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string DateReceived { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class ParsedLanguageDto
{
    public string Name { get; set; } = string.Empty;
    public string ProficiencyLevel { get; set; } = string.Empty; // Native, Fluent, Professional, Conversational, Basic
}
