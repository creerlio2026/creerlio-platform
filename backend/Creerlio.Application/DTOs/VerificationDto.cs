namespace Creerlio.Application.DTOs;

/// <summary>
/// Complete verification report for a talent profile
/// Master Plan: 0-100% confidence score with multi-source verification
/// </summary>
public class VerificationReportDto
{
    public Guid TalentProfileId { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    
    // Overall Verification Score (0-100%)
    public double OverallScore { get; set; }
    public string VerificationLevel { get; set; } = string.Empty; // Verified, Partial, Unverified
    
    // Individual Verification Results
    public List<VerificationResultDto> EducationVerifications { get; set; } = new();
    public List<VerificationResultDto> EmploymentVerifications { get; set; } = new();
    public List<VerificationResultDto> CertificationVerifications { get; set; } = new();
    
    // Timeline Consistency
    public TimelineConsistencyDto TimelineConsistency { get; set; } = new();
    
    // Summary
    public int TotalCredentials { get; set; }
    public int VerifiedCredentials { get; set; }
    public int PartiallyVerifiedCredentials { get; set; }
    public int UnverifiedCredentials { get; set; }
    
    // Flags & Warnings
    public List<string> Warnings { get; set; } = new();
    public List<string> Concerns { get; set; } = new();
    public bool HasTimelineGaps { get; set; }
    public bool HasOverlappingExperiences { get; set; }
}

public class VerificationResultDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty; // Education, Employment, Certification
    public string ItemName { get; set; } = string.Empty; // e.g., "University of Sydney", "TechCorp Australia"
    
    // Verification Score (0-100%)
    public double ConfidenceScore { get; set; }
    public string Status { get; set; } = string.Empty; // Verified, Partial, Unverified, Pending
    
    // Verification Details
    public List<string> VerificationSources { get; set; } = new(); // LinkedIn, Website, Database, API
    public DateTime VerifiedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    
    // Evidence
    public List<string> MatchedDataPoints { get; set; } = new();
    public List<string> MismatchedDataPoints { get; set; } = new();
    public List<string> MissingDataPoints { get; set; } = new();
    
    // Explanation
    public string Explanation { get; set; } = string.Empty;
    public List<string> RecommendedActions { get; set; } = new();
}

public class TimelineConsistencyDto
{
    public bool IsConsistent { get; set; }
    public double ConsistencyScore { get; set; } // 0-100%
    
    // Issues Found
    public List<TimelineIssueDto> Issues { get; set; } = new();
    public int TotalGapMonths { get; set; }
    public int OverlappingPeriodsCount { get; set; }
    
    // Timeline Visualization Data
    public List<TimelineEventDto> Timeline { get; set; } = new();
}

public class TimelineIssueDto
{
    public string Type { get; set; } = string.Empty; // Gap, Overlap, Inconsistency
    public string Severity { get; set; } = string.Empty; // Low, Medium, High
    public string Description { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public List<string> AffectedItems { get; set; } = new();
}

public class TimelineEventDto
{
    public string Type { get; set; } = string.Empty; // Education, Employment
    public string Title { get; set; } = string.Empty;
    public string Organization { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrent { get; set; }
}

public class VerificationStatusDto
{
    public Guid TalentProfileId { get; set; }
    public double OverallVerificationScore { get; set; }
    public bool EmailVerified { get; set; }
    public bool PhoneVerified { get; set; }
    public bool IdentityVerified { get; set; }
    public bool EducationVerified { get; set; }
    public bool EmploymentVerified { get; set; }
    public bool CertificationsVerified { get; set; }
    public DateTime LastVerificationDate { get; set; }
    public DateTime? NextVerificationDue { get; set; }
}
