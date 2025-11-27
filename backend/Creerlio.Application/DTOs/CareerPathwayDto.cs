namespace Creerlio.Application.DTOs;

/// <summary>
/// Career pathway from current to target role
/// Master Plan: Step-by-step pathway with skill gaps, courses, timeline, costs
/// </summary>
public class CareerPathwayDto
{
    public Guid Id { get; set; }
    public Guid TalentProfileId { get; set; }
    
    // Current State
    public string CurrentRole { get; set; } = string.Empty;
    public int CurrentYearsOfExperience { get; set; }
    public List<string> CurrentSkills { get; set; } = new();
    
    // Target State
    public string TargetRole { get; set; } = string.Empty;
    public string TargetIndustry { get; set; } = string.Empty;
    public int TargetSalary { get; set; }
    
    // Pathway Steps
    public List<PathwayStepDto> Steps { get; set; } = new();
    public List<IntermediateRoleDto> IntermediateRoles { get; set; } = new();
    
    // Skill Gaps
    public SkillGapAnalysisDto SkillGapAnalysis { get; set; } = new();
    
    // Recommendations
    public List<TrainingRecommendationDto> TrainingRecommendations { get; set; } = new();
    public List<string> CertificationRecommendations { get; set; } = new();
    
    // Timeline & Cost Estimates
    public int EstimatedMonths { get; set; }
    public int EstimatedCost { get; set; }
    public string Currency { get; set; } = "AUD";
    
    // Progress Tracking
    public int CompletionPercentage { get; set; }
    public List<PathwayMilestoneDto> Milestones { get; set; } = new();
    
    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUpdated { get; set; }
    public bool IsActive { get; set; } = true;
}

public class PathwayStepDto
{
    public int StepNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Skill, Certification, Experience, Education
    public int EstimatedMonths { get; set; }
    public int EstimatedCost { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class SkillGapAnalysisDto
{
    public List<string> CurrentSkills { get; set; } = new();
    public List<string> RequiredSkills { get; set; } = new();
    public List<string> MissingSkills { get; set; } = new();
    public List<string> PartialSkills { get; set; } = new(); // Skills partially met
    public int TotalGapCount { get; set; }
    public double GapSeverity { get; set; } // 0-100, higher = more gaps
}

public class TrainingRecommendationDto
{
    public string Title { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Course, Certification, Bootcamp, Degree
    public int DurationHours { get; set; }
    public int Cost { get; set; }
    public string Currency { get; set; } = "AUD";
    public List<string> SkillsCovered { get; set; } = new();
    public double Rating { get; set; }
    public int Reviews { get; set; }
}

public class IntermediateRoleDto
{
    public string RoleTitle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int StepNumber { get; set; }
    public int EstimatedMonthsInRole { get; set; }
    public int AverageSalary { get; set; }
    public List<string> RequiredSkills { get; set; } = new();
    public List<string> SkillsToGain { get; set; } = new();
}

public class PathwayMilestoneDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime TargetDate { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class PathwayProgressDto
{
    public Guid PathwayId { get; set; }
    public List<Guid> CompletedStepIds { get; set; } = new();
    public List<string> NewSkillsAcquired { get; set; } = new();
    public List<string> CertificationsEarned { get; set; } = new();
    public string CurrentRole { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
