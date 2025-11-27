using Creerlio.Application.DTOs;

namespace Creerlio.Application.Services;

/// <summary>
/// Service for automated credential verification
/// Master Plan: Cross-reference multiple sources, timeline logic checking, confidence scoring 0-100%
/// </summary>
public interface ICredentialVerificationService
{
    /// <summary>
    /// Verify all credentials for a talent profile
    /// </summary>
    /// <param name="talentProfileId">Talent profile ID</param>
    /// <returns>Complete verification report</returns>
    Task<VerificationReportDto> VerifyAllCredentialsAsync(Guid talentProfileId);

    /// <summary>
    /// Verify education credentials
    /// </summary>
    /// <param name="education">Education details to verify</param>
    /// <returns>Verification result with confidence score</returns>
    Task<VerificationResultDto> VerifyEducationAsync(EducationVerificationRequest education);

    /// <summary>
    /// Verify employment history
    /// </summary>
    /// <param name="employment">Employment details to verify</param>
    /// <returns>Verification result with confidence score</returns>
    Task<VerificationResultDto> VerifyEmploymentAsync(EmploymentVerificationRequest employment);

    /// <summary>
    /// Verify professional certifications
    /// </summary>
    /// <param name="certification">Certification details to verify</param>
    /// <returns>Verification result with confidence score</returns>
    Task<VerificationResultDto> VerifyCertificationAsync(CertificationVerificationRequest certification);

    /// <summary>
    /// Check timeline consistency across all experiences
    /// </summary>
    /// <param name="talentProfileId">Talent profile ID</param>
    /// <returns>Timeline consistency report</returns>
    Task<TimelineConsistencyDto> CheckTimelineConsistencyAsync(Guid talentProfileId);

    /// <summary>
    /// Get verification status for a talent profile
    /// </summary>
    /// <param name="talentProfileId">Talent profile ID</param>
    /// <returns>Overall verification status with scores</returns>
    Task<VerificationStatusDto> GetVerificationStatusAsync(Guid talentProfileId);
}

public class EducationVerificationRequest
{
    public string Institution { get; set; } = string.Empty;
    public string Degree { get; set; } = string.Empty;
    public string Field { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
}

public class EmploymentVerificationRequest
{
    public string Company { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public string LinkedInUrl { get; set; } = string.Empty;
}

public class CertificationVerificationRequest
{
    public string Name { get; set; } = string.Empty;
    public string IssuingOrganization { get; set; } = string.Empty;
    public string IssueDate { get; set; } = string.Empty;
    public string CredentialId { get; set; } = string.Empty;
    public string CredentialUrl { get; set; } = string.Empty;
}
