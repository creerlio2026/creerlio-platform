using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Creerlio.Application.Services;

namespace Creerlio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FootprintController : ControllerBase
{
    private readonly IElectronicFootprintService _footprintService;
    private readonly ILogger<FootprintController> _logger;

    public FootprintController(
        IElectronicFootprintService footprintService,
        ILogger<FootprintController> logger)
    {
        _footprintService = footprintService;
        _logger = logger;
    }

    /// <summary>
    /// Scan complete electronic footprint for a talent profile
    /// </summary>
    [HttpGet("talent/{talentId}/scan")]
    public async Task<IActionResult> ScanFootprint(Guid talentId)
    {
        try
        {
            var report = await _footprintService.ScanFootprintAsync(talentId);
            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scanning footprint for talent {TalentId}", talentId);
            return StatusCode(500, new { error = "Failed to scan electronic footprint" });
        }
    }

    /// <summary>
    /// Get reputation score breakdown
    /// </summary>
    [HttpGet("talent/{talentId}/reputation")]
    public async Task<IActionResult> GetReputationScore(Guid talentId)
    {
        try
        {
            var score = await _footprintService.CalculateReputationScoreAsync(talentId);
            return Ok(score);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating reputation for talent {TalentId}", talentId);
            return StatusCode(500, new { error = "Failed to calculate reputation score" });
        }
    }

    /// <summary>
    /// Monitor GitHub activity
    /// </summary>
    [HttpGet("github/{username}")]
    public async Task<IActionResult> GetGitHubActivity(string username)
    {
        try
        {
            var activity = await _footprintService.MonitorGitHubActivityAsync(username);
            return Ok(activity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error monitoring GitHub for {Username}", username);
            return StatusCode(500, new { error = "Failed to retrieve GitHub activity" });
        }
    }
}
