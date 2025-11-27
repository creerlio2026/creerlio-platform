using Creerlio.Application.DTOs;

namespace Creerlio.Application.Services;

/// <summary>
/// Service for AI-driven career pathway planning
/// Master Plan: Analyze current vs target role, identify skill gaps, recommend training, suggest intermediate roles
/// </summary>
public interface ICareerPathwayService
{
    /// <summary>
    /// Generate career pathway from current role to target role
    /// </summary>
    /// <param name="talentProfileId">Talent profile ID</param>
    /// <param name="targetRole">Desired target role/title</param>
    /// <returns>Complete career pathway with steps, gaps, recommendations</returns>
    Task<CareerPathwayDto> GeneratePathwayAsync(Guid talentProfileId, string targetRole);

    /// <summary>
    /// Analyze skill gaps for a specific target role
    /// </summary>
    /// <param name="talentProfileId">Talent profile ID</param>
    /// <param name="targetRole">Target role to analyze</param>
    /// <returns>Detailed skill gap analysis</returns>
    Task<SkillGapAnalysisDto> AnalyzeSkillGapsAsync(Guid talentProfileId, string targetRole);

    /// <summary>
    /// Get recommended courses and certifications
    /// </summary>
    /// <param name="skillGaps">List of skills to acquire</param>
    /// <returns>Recommended training resources</returns>
    Task<List<TrainingRecommendationDto>> GetTrainingRecommendationsAsync(List<string> skillGaps);

    /// <summary>
    /// Get suggested intermediate roles between current and target
    /// </summary>
    /// <param name="currentRole">Current role title</param>
    /// <param name="targetRole">Target role title</param>
    /// <returns>List of intermediate roles with timelines</returns>
    Task<List<IntermediateRoleDto>> GetIntermediateRolesAsync(string currentRole, string targetRole);

    /// <summary>
    /// Update pathway based on progress (dynamic updates)
    /// </summary>
    /// <param name="pathwayId">Career pathway ID</param>
    /// <param name="progress">Progress updates</param>
    /// <returns>Updated pathway</returns>
    Task<CareerPathwayDto> UpdatePathwayProgressAsync(Guid pathwayId, PathwayProgressDto progress);
}
