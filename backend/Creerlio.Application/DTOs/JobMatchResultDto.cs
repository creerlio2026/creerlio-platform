namespace Creerlio.Application.DTOs;

/// <summary>
/// Result of job-talent matching algorithm
/// Master Plan: 0-100% match score with detailed breakdown
/// </summary>
public class JobMatchResultDto
{
    public Guid TalentProfileId { get; set; }
    public string TalentName { get; set; } = string.Empty;
    public string TalentHeadline { get; set; } = string.Empty;
    public string TalentLocation { get; set; } = string.Empty;
    
    public Guid JobPostingId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string JobLocation { get; set; } = string.Empty;
    
    // Overall Match Score (0-100)
    public double OverallScore { get; set; }
    public string MatchLevel { get; set; } = string.Empty; // Excellent, Good, Fair, Poor
    
    // Breakdown by Factor (Master Plan weights)
    public MatchBreakdownDto Breakdown { get; set; } = new();
    
    // Matching Details
    public List<string> MatchingSkills { get; set; } = new();
    public List<string> MissingSkills { get; set; } = new();
    public List<string> Highlights { get; set; } = new(); // Key matching points
    public List<string> Concerns { get; set; } = new(); // Potential issues
    
    // Metadata
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    public bool IsBookmarked { get; set; }
    public bool HasApplied { get; set; }
}

public class MatchBreakdownDto
{
    // Master Plan: Skills match (40% weight)
    public double SkillsScore { get; set; }
    public double SkillsWeight { get; set; } = 0.40;
    public int RequiredSkillsMatched { get; set; }
    public int TotalRequiredSkills { get; set; }
    
    // Master Plan: Experience match (30% weight)
    public double ExperienceScore { get; set; }
    public double ExperienceWeight { get; set; } = 0.30;
    public int YearsOfExperience { get; set; }
    public int RequiredYears { get; set; }
    
    // Master Plan: Education match (10% weight)
    public double EducationScore { get; set; }
    public double EducationWeight { get; set; } = 0.10;
    public string HighestDegree { get; set; } = string.Empty;
    public string RequiredDegree { get; set; } = string.Empty;
    
    // Master Plan: Location/logistics (10% weight)
    public double LocationScore { get; set; }
    public double LocationWeight { get; set; } = 0.10;
    public double DistanceKm { get; set; }
    public bool RemoteOption { get; set; }
    
    // Master Plan: Cultural fit (5% weight)
    public double CultureScore { get; set; }
    public double CultureWeight { get; set; } = 0.05;
    public List<string> SharedValues { get; set; } = new();
    
    // Master Plan: Behavioral signals (5% weight)
    public double BehavioralScore { get; set; }
    public double BehavioralWeight { get; set; } = 0.05;
    public int ProfileCompleteness { get; set; }
    public int RecentActivity { get; set; }
}
