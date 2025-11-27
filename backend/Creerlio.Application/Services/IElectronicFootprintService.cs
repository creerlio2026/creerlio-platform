using Creerlio.Application.DTOs;

namespace Creerlio.Application.Services;

/// <summary>
/// Service for electronic footprint monitoring
/// Master Plan: Web scraping, news mentions, social media, GitHub, publications, awards
/// </summary>
public interface IElectronicFootprintService
{
    /// <summary>
    /// Scan and update electronic footprint for a talent profile
    /// </summary>
    /// <param name="talentProfileId">Talent profile ID</param>
    /// <returns>Updated footprint report</returns>
    Task<ElectronicFootprintDto> ScanFootprintAsync(Guid talentProfileId);

    /// <summary>
    /// Monitor news mentions for a person
    /// </summary>
    /// <param name="fullName">Full name to search</param>
    /// <param name="context">Additional context (company, industry)</param>
    /// <returns>List of news mentions</returns>
    Task<List<NewsMentionDto>> MonitorNewsMentionsAsync(string fullName, string context);

    /// <summary>
    /// Track social media presence and activity
    /// </summary>
    /// <param name="socialMediaHandles">Social media URLs or handles</param>
    /// <returns>Social media activity summary</returns>
    Task<SocialMediaFootprintDto> TrackSocialMediaAsync(Dictionary<string, string> socialMediaHandles);

    /// <summary>
    /// Monitor GitHub activity for developers
    /// </summary>
    /// <param name="githubUsername">GitHub username</param>
    /// <returns>GitHub activity report</returns>
    Task<GitHubActivityDto> MonitorGitHubActivityAsync(string githubUsername);

    /// <summary>
    /// Track publications and speaking engagements
    /// </summary>
    /// <param name="fullName">Full name</param>
    /// <param name="expertise">Area of expertise</param>
    /// <returns>List of publications and talks</returns>
    Task<List<PublicationDto>> TrackPublicationsAsync(string fullName, string expertise);

    /// <summary>
    /// Monitor awards and recognition
    /// </summary>
    /// <param name="fullName">Full name</param>
    /// <param name="industry">Industry context</param>
    /// <returns>List of awards and recognition</returns>
    Task<List<AwardRecognitionDto>> MonitorAwardsAsync(string fullName, string industry);

    /// <summary>
    /// Get reputation score based on footprint data
    /// </summary>
    /// <param name="talentProfileId">Talent profile ID</param>
    /// <returns>Reputation score and analysis</returns>
    Task<ReputationScoreDto> CalculateReputationScoreAsync(Guid talentProfileId);

    /// <summary>
    /// Get footprint alerts (new mentions, activities)
    /// </summary>
    /// <param name="talentProfileId">Talent profile ID</param>
    /// <param name="since">Get alerts since this date</param>
    /// <returns>List of new footprint activities</returns>
    Task<List<FootprintAlertDto>> GetFootprintAlertsAsync(Guid talentProfileId, DateTime since);
}
