using Creerlio.Application.DTOs;

namespace Creerlio.Application.Services;

/// <summary>
/// Service for AI-powered job-talent matching algorithm
/// Master Plan: Multi-factor scoring (Skills 40%, Experience 30%, Education 10%, Location 10%, Culture 5%, Behavioral 5%)
/// </summary>
public interface IJobMatchingService
{
    /// <summary>
    /// Calculate match score between a talent profile and a job posting
    /// </summary>
    /// <param name="talentProfileId">Talent profile ID</param>
    /// <param name="jobPostingId">Job posting ID</param>
    /// <returns>Match result with 0-100% score and breakdown</returns>
    Task<JobMatchResultDto> CalculateMatchAsync(Guid talentProfileId, Guid jobPostingId);

    /// <summary>
    /// Get top matching jobs for a talent profile
    /// </summary>
    /// <param name="talentProfileId">Talent profile ID</param>
    /// <param name="limit">Maximum number of matches to return</param>
    /// <returns>List of matching jobs with scores</returns>
    Task<List<JobMatchResultDto>> GetTopMatchesForTalentAsync(Guid talentProfileId, int limit = 20);

    /// <summary>
    /// Get top matching candidates for a job posting
    /// </summary>
    /// <param name="jobPostingId">Job posting ID</param>
    /// <param name="limit">Maximum number of matches to return</param>
    /// <returns>List of matching candidates with scores</returns>
    Task<List<JobMatchResultDto>> GetTopMatchesForJobAsync(Guid jobPostingId, int limit = 20);

    /// <summary>
    /// Recalculate all matches for a talent profile (when profile is updated)
    /// </summary>
    Task RecalculateMatchesForTalentAsync(Guid talentProfileId);

    /// <summary>
    /// Recalculate all matches for a job posting (when job is updated)
    /// </summary>
    Task RecalculateMatchesForJobAsync(Guid jobPostingId);
}
