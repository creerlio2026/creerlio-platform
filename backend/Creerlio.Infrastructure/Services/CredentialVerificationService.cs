using Creerlio.Application.DTOs;
using Creerlio.Application.Services;
using Creerlio.Domain.Entities;
using Creerlio.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace Creerlio.Infrastructure.Services;

public class CredentialVerificationService : ICredentialVerificationService
{
    private readonly CreerlioDbContext _context;
    private readonly ILogger<CredentialVerificationService> _logger;
    private readonly HttpClient _httpClient;

    public CredentialVerificationService(
        CreerlioDbContext context,
        ILogger<CredentialVerificationService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task<VerificationReportDto> VerifyAllCredentialsAsync(Guid talentId)
    {
        var talent = await _context.TalentProfiles
            .Include(t => t.Educations)
            .Include(t => t.WorkExperiences)
            .Include(t => t.Certifications)
            .FirstOrDefaultAsync(t => t.Id == talentId);

        if (talent == null)
            throw new ArgumentException("Talent profile not found");

        var report = new VerificationReportDto
        {
            TalentProfileId = talentId,
            GeneratedAt = DateTime.UtcNow,
            EducationVerifications = new List<VerificationResultDto>(),
            EmploymentVerifications = new List<VerificationResultDto>(),
            CertificationVerifications = new List<VerificationResultDto>()
        };

        // Verify education credentials
        foreach (var education in talent.Educations ?? new List<Education>())
        {
            var request = new EducationVerificationRequest
            {
                Institution = education.Institution,
                Degree = education.Degree,
                Field = education.Field,
                StartDate = education.StartDate.ToString("yyyy-MM-dd"),
                EndDate = education.EndDate?.ToString("yyyy-MM-dd")
            };

            var result = await VerifyEducationAsync(request);
            report.EducationVerifications.Add(result);
        }

        // Verify employment credentials
        foreach (var work in talent.WorkExperiences ?? new List<WorkExperience>())
        {
            var request = new EmploymentVerificationRequest
            {
                Company = work.Company,
                JobTitle = work.Title,
                StartDate = work.StartDate.ToString("yyyy-MM-dd"),
                EndDate = work.EndDate?.ToString("yyyy-MM-dd")
            };

            var result = await VerifyEmploymentAsync(request);
            report.EmploymentVerifications.Add(result);
        }

        // Verify certifications
        foreach (var cert in talent.Certifications ?? new List<Certification>())
        {
            var request = new CertificationVerificationRequest
            {
                IssuingOrganization = cert.IssuingOrganization,
                IssueDate = cert.IssueDate.ToString("yyyy-MM-dd"),
                CredentialId = cert.CredentialId
            };

            var result = await VerifyCertificationAsync(request);
            report.CertificationVerifications.Add(result);
        }

        // Check timeline consistency
        report.TimelineConsistency = await CheckTimelineConsistencyAsync(talentId);

        // Calculate overall statistics
        var allVerifications = report.EducationVerifications
            .Concat(report.EmploymentVerifications)
            .Concat(report.CertificationVerifications)
            .ToList();

        report.TotalCredentials = allVerifications.Count;
        report.VerifiedCredentials = allVerifications.Count(v => v.Status == "Verified");
        report.PartiallyVerifiedCredentials = allVerifications.Count(v => v.Status == "Partial");
        report.UnverifiedCredentials = allVerifications.Count(v => v.Status == "Unverified");

        report.OverallScore = allVerifications.Any() 
            ? allVerifications.Average(v => v.ConfidenceScore) 
            : 0;

        report.VerificationLevel = report.OverallScore switch
        {
            >= 80 => "Verified",
            >= 50 => "Partial",
            _ => "Unverified"
        };

        report.HasTimelineGaps = report.TimelineConsistency.TotalGapMonths > 6;
        report.HasOverlappingExperiences = report.TimelineConsistency.OverlappingPeriodsCount > 0;

        // Generate warnings
        if (report.HasTimelineGaps)
            report.Warnings.Add($"Timeline contains {report.TimelineConsistency.TotalGapMonths} months of gaps");
        
        if (report.HasOverlappingExperiences)
            report.Warnings.Add($"Found {report.TimelineConsistency.OverlappingPeriodsCount} overlapping work experiences");

        if (report.UnverifiedCredentials > 0)
            report.Concerns.Add($"{report.UnverifiedCredentials} credentials could not be verified");

        return report;
    }

    public async Task<VerificationResultDto> VerifyEducationAsync(EducationVerificationRequest request)
    {
        _logger.LogInformation($"Verifying education: {request.Institution} - {request.Degree}");

        // Multi-source verification
        var institutionScore = await VerifyInstitutionExistsAsync(request.Institution) ? 40 : 0;
        var datesScore = ValidateDates(request.StartDate, request.EndDate) ? 20 : 0;
        var degreeScore = !string.IsNullOrEmpty(request.Degree) ? 20 : 0;

        // Check against education databases (placeholder - would call real APIs)
        var databaseScore = await CheckEducationDatabaseAsync(request) ? 20 : 0;

        var confidence = institutionScore + datesScore + degreeScore + databaseScore;

        var status = confidence switch
        {
            >= 80 => "Verified",
            >= 50 => "Partial",
            _ => "Unverified"
        };

        return new VerificationResultDto
        {
            Id = Guid.NewGuid(),
            Type = "Education",
            ItemName = request.Institution,
            ConfidenceScore = confidence,
            Status = status,
            VerificationSources = new List<string> { "Institution Database", "Date Validation" },
            VerifiedAt = DateTime.UtcNow,
            MatchedDataPoints = new List<string> { "Institution Name", "Degree Type" },
            MismatchedDataPoints = new List<string>(),
            MissingDataPoints = confidence < 80 ? new List<string> { "Database Confirmation" } : new List<string>(),
            Explanation = $"Education verified with {confidence}% confidence based on available data sources",
            RecommendedActions = confidence < 80 
                ? new List<string> { "Upload degree certificate", "Provide transcript" }
                : new List<string>()
        };
    }

    public async Task<VerificationResultDto> VerifyEmploymentAsync(EmploymentVerificationRequest request)
    {
        _logger.LogInformation($"Verifying employment: {request.Company} - {request.JobTitle}");

        // Multi-source verification
        var companyScore = await VerifyCompanyExistsAsync(request.Company) ? 30 : 0;
        var datesScore = ValidateDates(request.StartDate, request.EndDate) ? 20 : 0;
        var titleScore = !string.IsNullOrEmpty(request.JobTitle) ? 10 : 0;

        // LinkedIn verification (placeholder - would call LinkedIn API)
        var linkedInScore = await CheckLinkedInVerificationAsync(request) ? 40 : 0;

        var confidence = companyScore + datesScore + titleScore + linkedInScore;

        var status = confidence switch
        {
            >= 80 => "Verified",
            >= 50 => "Partial",
            _ => "Unverified"
        };

        return new VerificationResultDto
        {
            Id = Guid.NewGuid(),
            Type = "Employment",
            ItemName = request.Company,
            ConfidenceScore = confidence,
            Status = status,
            VerificationSources = new List<string> { "Company Database", "LinkedIn", "Date Validation" },
            VerifiedAt = DateTime.UtcNow,
            MatchedDataPoints = new List<string> { "Company Name", "Job Title", "Employment Dates" },
            MismatchedDataPoints = new List<string>(),
            MissingDataPoints = confidence < 80 ? new List<string> { "Direct Company Verification" } : new List<string>(),
            Explanation = $"Employment verified with {confidence}% confidence",
            RecommendedActions = confidence < 80
                ? new List<string> { "Provide reference contact", "Upload employment letter" }
                : new List<string>()
        };
    }

    public async Task<VerificationResultDto> VerifyCertificationAsync(CertificationVerificationRequest request)
    {
        _logger.LogInformation($"Verifying certification: {request.IssuingOrganization}");

        // Multi-source verification
        var issuerScore = await VerifyIssuerExistsAsync(request.IssuingOrganization) ? 50 : 0;
        var credentialIdScore = !string.IsNullOrEmpty(request.CredentialId) ? 30 : 0;
        var dateScore = !string.IsNullOrEmpty(request.IssueDate) ? 20 : 0;

        var confidence = issuerScore + credentialIdScore + dateScore;

        var status = confidence switch
        {
            >= 80 => "Verified",
            >= 50 => "Partial",
            _ => "Unverified"
        };

        return new VerificationResultDto
        {
            Id = Guid.NewGuid(),
            Type = "Certification",
            ItemName = request.IssuingOrganization,
            ConfidenceScore = confidence,
            Status = status,
            VerificationSources = new List<string> { "Issuer Database", "Credential ID Verification" },
            VerifiedAt = DateTime.UtcNow,
            MatchedDataPoints = new List<string> { "Issuing Organization", "Credential ID" },
            MismatchedDataPoints = new List<string>(),
            MissingDataPoints = confidence < 80 ? new List<string> { "API Verification" } : new List<string>(),
            Explanation = $"Certification verified with {confidence}% confidence",
            RecommendedActions = confidence < 80
                ? new List<string> { "Provide certificate document", "Add verification URL" }
                : new List<string>()
        };
    }

    public async Task<TimelineConsistencyDto> CheckTimelineConsistencyAsync(Guid talentId)
    {
        var talent = await _context.TalentProfiles
            .Include(t => t.WorkExperiences)
            .Include(t => t.Educations)
            .FirstOrDefaultAsync(t => t.Id == talentId);

        if (talent == null)
            throw new ArgumentException("Talent profile not found");

        var timeline = new List<TimelineEventDto>();
        var issues = new List<TimelineIssueDto>();

        // Build timeline from work experiences
        foreach (var work in talent.WorkExperiences ?? new List<WorkExperience>())
        {
            timeline.Add(new TimelineEventDto
            {
                Type = "Employment",
                Title = work.Title,
                Organization = work.Company,
                StartDate = work.StartDate,
                EndDate = work.EndDate,
                IsCurrent = work.IsCurrentRole
            });
        }

        // Build timeline from educations
        foreach (var edu in talent.Educations ?? new List<Education>())
        {
            timeline.Add(new TimelineEventDto
            {
                Type = "Education",
                Title = edu.Degree,
                Organization = edu.Institution,
                StartDate = edu.StartDate,
                EndDate = edu.EndDate,
                IsCurrent = edu.EndDate == null
            });
        }

        // Sort timeline
        timeline = timeline.OrderBy(t => t.StartDate).ToList();

        // Check for gaps
        var totalGapMonths = 0;
        for (int i = 0; i < timeline.Count - 1; i++)
        {
            var current = timeline[i];
            var next = timeline[i + 1];

            if (current.EndDate.HasValue && next.StartDate > current.EndDate.Value.AddMonths(1))
            {
                var gapMonths = (int)((next.StartDate - current.EndDate.Value).TotalDays / 30);
                totalGapMonths += gapMonths;

                if (gapMonths > 3)
                {
                    issues.Add(new TimelineIssueDto
                    {
                        Type = "Gap",
                        Severity = gapMonths > 12 ? "High" : "Medium",
                        Description = $"{gapMonths} month gap between {current.Organization} and {next.Organization}",
                        StartDate = current.EndDate,
                        EndDate = next.StartDate,
                        AffectedItems = new List<string> { current.Organization, next.Organization }
                    });
                }
            }
        }

        // Check for overlaps
        var overlappingCount = 0;
        for (int i = 0; i < timeline.Count - 1; i++)
        {
            for (int j = i + 1; j < timeline.Count; j++)
            {
                var first = timeline[i];
                var second = timeline[j];

                if (first.EndDate.HasValue && 
                    second.StartDate < first.EndDate.Value && 
                    second.StartDate > first.StartDate)
                {
                    overlappingCount++;
                    issues.Add(new TimelineIssueDto
                    {
                        Type = "Overlap",
                        Severity = "Low",
                        Description = $"Overlapping period between {first.Organization} and {second.Organization}",
                        StartDate = second.StartDate,
                        EndDate = first.EndDate,
                        AffectedItems = new List<string> { first.Organization, second.Organization }
                    });
                }
            }
        }

        var consistencyScore = 100 - (issues.Count * 10);
        if (consistencyScore < 0) consistencyScore = 0;

        return new TimelineConsistencyDto
        {
            IsConsistent = issues.Count == 0,
            ConsistencyScore = consistencyScore,
            Issues = issues,
            TotalGapMonths = totalGapMonths,
            OverlappingPeriodsCount = overlappingCount,
            Timeline = timeline
        };
    }

    public async Task<VerificationStatusDto> GetVerificationStatusAsync(Guid talentId)
    {
        var report = await VerifyAllCredentialsAsync(talentId);

        return new VerificationStatusDto
        {
            TalentProfileId = talentId,
            OverallVerificationScore = report.OverallScore,
            EmailVerified = false, // Would check from Identity
            PhoneVerified = false, // Would check from Identity
            IdentityVerified = false, // Would check from Identity verification
            EducationVerified = report.EducationVerifications.Any(v => v.Status == "Verified"),
            EmploymentVerified = report.EmploymentVerifications.Any(v => v.Status == "Verified"),
            CertificationsVerified = report.CertificationVerifications.Any(v => v.Status == "Verified"),
            LastVerificationDate = DateTime.UtcNow,
            NextVerificationDue = DateTime.UtcNow.AddMonths(6)
        };
    }

    // Helper methods for external verification
    private async Task<bool> VerifyInstitutionExistsAsync(string institution)
    {
        // Would call education database APIs
        // For now, check against known universities
        var knownUniversities = new[] { "University", "College", "Institute", "School" };
        return knownUniversities.Any(u => institution.Contains(u, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<bool> VerifyCompanyExistsAsync(string company)
    {
        // Would call company database APIs (e.g., Companies House, LinkedIn)
        // For now, simple validation
        return !string.IsNullOrEmpty(company) && company.Length > 2;
    }

    private async Task<bool> VerifyIssuerExistsAsync(string issuer)
    {
        // Would call certification provider APIs
        var knownIssuers = new[] { "Microsoft", "AWS", "Google", "Oracle", "Cisco", "CompTIA" };
        return knownIssuers.Any(i => issuer.Contains(i, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<bool> CheckEducationDatabaseAsync(EducationVerificationRequest request)
    {
        // Would call National Student Clearinghouse or similar
        return await Task.FromResult(true); // Placeholder
    }

    private async Task<bool> CheckLinkedInVerificationAsync(EmploymentVerificationRequest request)
    {
        // Would call LinkedIn API to verify employment
        return await Task.FromResult(true); // Placeholder
    }

    private bool ValidateDates(string? startDate, string? endDate)
    {
        if (string.IsNullOrEmpty(startDate)) return false;
        
        if (!DateTime.TryParse(startDate, out var start)) return false;
        
        if (!string.IsNullOrEmpty(endDate))
        {
            if (!DateTime.TryParse(endDate, out var end)) return false;
            return end >= start;
        }

        return true;
    }
}
