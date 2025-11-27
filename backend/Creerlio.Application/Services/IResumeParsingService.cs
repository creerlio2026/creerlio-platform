using Creerlio.Application.DTOs;

namespace Creerlio.Application.Services;

/// <summary>
/// Service for parsing resumes using AI (OpenAI GPT-4) to extract structured data
/// Master Plan: Upload resume (AI extracts data) → Parses resume/LinkedIn data → 
/// Suggests profile sections → Pre-fills 60-70% of profile → User reviews and confirms
/// </summary>
public interface IResumeParsingService
{
    /// <summary>
    /// Parse resume from file and extract structured profile data
    /// </summary>
    /// <param name="fileStream">Resume file stream (PDF, DOCX, TXT)</param>
    /// <param name="fileName">Original file name</param>
    /// <returns>Parsed talent profile data with ~60-70% of fields populated</returns>
    Task<ParsedResumeDto> ParseResumeAsync(Stream fileStream, string fileName);

    /// <summary>
    /// Parse resume from text content
    /// </summary>
    /// <param name="resumeText">Plain text resume content</param>
    /// <returns>Parsed talent profile data</returns>
    Task<ParsedResumeDto> ParseResumeTextAsync(string resumeText);

    /// <summary>
    /// Extract text from resume file (PDF, DOCX)
    /// </summary>
    /// <param name="fileStream">Resume file stream</param>
    /// <param name="fileName">Original file name</param>
    /// <returns>Extracted plain text</returns>
    Task<string> ExtractTextFromFileAsync(Stream fileStream, string fileName);

    /// <summary>
    /// Import profile data from LinkedIn URL or HTML
    /// </summary>
    /// <param name="linkedInContent">LinkedIn profile HTML or structured data</param>
    /// <returns>Parsed talent profile data</returns>
    Task<ParsedResumeDto> ParseLinkedInProfileAsync(string linkedInContent);
}
