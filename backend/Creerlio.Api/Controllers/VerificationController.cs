using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Creerlio.Application.Services;

namespace Creerlio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VerificationController : ControllerBase
{
    private readonly ICredentialVerificationService _verificationService;
    private readonly ILogger<VerificationController> _logger;

    public VerificationController(
        ICredentialVerificationService verificationService,
        ILogger<VerificationController> logger)
    {
        _verificationService = verificationService;
        _logger = logger;
    }

    /// <summary>
    /// Get comprehensive verification report for a talent profile
    /// </summary>
    [HttpGet("talent/{talentId}/report")]
    public async Task<IActionResult> GetVerificationReport(Guid talentId)
    {
        try
        {
            var report = await _verificationService.VerifyAllCredentialsAsync(talentId);
            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting verification report for talent {TalentId}", talentId);
            return StatusCode(500, new { error = "Failed to retrieve verification report" });
        }
    }

    /// <summary>
    /// Get verification status summary
    /// </summary>
    [HttpGet("talent/{talentId}/status")]
    public async Task<IActionResult> GetVerificationStatus(Guid talentId)
    {
        try
        {
            var status = await _verificationService.GetVerificationStatusAsync(talentId);
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting verification status for talent {TalentId}", talentId);
            return StatusCode(500, new { error = "Failed to retrieve verification status" });
        }
    }

    /// <summary>
    /// Check timeline consistency for a talent profile
    /// </summary>
    [HttpGet("talent/{talentId}/timeline")]
    public async Task<IActionResult> CheckTimeline(Guid talentId)
    {
        try
        {
            var consistency = await _verificationService.CheckTimelineConsistencyAsync(talentId);
            return Ok(consistency);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking timeline for talent {TalentId}", talentId);
            return StatusCode(500, new { error = "Failed to check timeline consistency" });
        }
    }
}
