using Creerlio.Application.DTOs;
using Creerlio.Application.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;
using System.Net.Http.Headers;

namespace Creerlio.Infrastructure.Services;

/// <summary>
/// Implementation of AI-powered resume parsing using OpenAI GPT-4
/// Master Plan: NLP extraction, Named entity recognition, Skill identification, Structure data automatically
/// </summary>
public class ResumeParsingService : IResumeParsingService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ResumeParsingService> _logger;
    private readonly string _openAiApiKey;
    private readonly string _openAiModel;

    public ResumeParsingService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<ResumeParsingService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _openAiApiKey = configuration["OpenAI:ApiKey"] ?? throw new InvalidOperationException("OpenAI API key not configured");
        _openAiModel = configuration["OpenAI:Model"] ?? "gpt-4";
    }

    public async Task<ParsedResumeDto> ParseResumeAsync(Stream fileStream, string fileName)
    {
        try
        {
            _logger.LogInformation("Starting resume parsing for file: {FileName}", fileName);

            // Step 1: Extract text from file
            var resumeText = await ExtractTextFromFileAsync(fileStream, fileName);

            // Step 2: Parse the extracted text
            var parsedResume = await ParseResumeTextAsync(resumeText);

            _logger.LogInformation("Resume parsing completed with confidence score: {Score}%", parsedResume.ConfidenceScore);

            return parsedResume;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing resume file: {FileName}", fileName);
            throw;
        }
    }

    public async Task<ParsedResumeDto> ParseResumeTextAsync(string resumeText)
    {
        try
        {
            _logger.LogInformation("Parsing resume text with AI (length: {Length} chars)", resumeText.Length);

            // Build the prompt for GPT-4
            var prompt = BuildResumeParsingPrompt(resumeText);

            // Call OpenAI API
            var response = await CallOpenAIAsync(prompt);

            // Parse JSON response
            var parsedResume = ParseOpenAIResponse(response);

            return parsedResume;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing resume text with AI");
            throw;
        }
    }

    public async Task<string> ExtractTextFromFileAsync(Stream fileStream, string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        return extension switch
        {
            ".txt" => await ExtractTextFromTxtAsync(fileStream),
            ".pdf" => await ExtractTextFromPdfAsync(fileStream),
            ".docx" => await ExtractTextFromDocxAsync(fileStream),
            _ => throw new NotSupportedException($"File format {extension} is not supported. Supported formats: .txt, .pdf, .docx")
        };
    }

    public async Task<ParsedResumeDto> ParseLinkedInProfileAsync(string linkedInContent)
    {
        try
        {
            _logger.LogInformation("Parsing LinkedIn profile data");

            var prompt = BuildLinkedInParsingPrompt(linkedInContent);
            var response = await CallOpenAIAsync(prompt);
            var parsedResume = ParseOpenAIResponse(response);

            return parsedResume;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing LinkedIn profile");
            throw;
        }
    }

    private string BuildResumeParsingPrompt(string resumeText)
    {
        return $@"You are an expert resume parser. Extract structured data from the following resume text and return it as JSON.

IMPORTANT: Return ONLY valid JSON, no additional text or explanations.

Resume Text:
{resumeText}

Extract the following information and return as JSON matching this exact structure:
{{
  ""firstName"": ""string"",
  ""lastName"": ""string"",
  ""email"": ""string"",
  ""phone"": ""string"",
  ""city"": ""string"",
  ""state"": ""string"",
  ""country"": ""string"",
  ""postalCode"": ""string"",
  ""headline"": ""string (professional title)"",
  ""summary"": ""string (professional summary)"",
  ""linkedInUrl"": ""string"",
  ""gitHubUrl"": ""string"",
  ""portfolioUrl"": ""string"",
  ""workExperiences"": [
    {{
      ""jobTitle"": ""string"",
      ""company"": ""string"",
      ""location"": ""string"",
      ""startDate"": ""YYYY-MM or YYYY"",
      ""endDate"": ""YYYY-MM or YYYY or Present"",
      ""isCurrent"": boolean,
      ""description"": ""string"",
      ""achievements"": [""string""],
      ""technologies"": [""string""],
      ""employmentType"": ""Full-time|Part-time|Contract|Freelance""
    }}
  ],
  ""educations"": [
    {{
      ""institution"": ""string"",
      ""degree"": ""string"",
      ""field"": ""string"",
      ""startDate"": ""YYYY-MM or YYYY"",
      ""endDate"": ""YYYY-MM or YYYY"",
      ""gpa"": ""string"",
      ""description"": ""string"",
      ""honors"": [""string""]
    }}
  ],
  ""skills"": [
    {{
      ""name"": ""string"",
      ""category"": ""Technical|Soft|Language|Domain"",
      ""yearsOfExperience"": number or null,
      ""proficiencyLevel"": 1-5 or null
    }}
  ],
  ""certifications"": [
    {{
      ""name"": ""string"",
      ""issuingOrganization"": ""string"",
      ""issueDate"": ""YYYY-MM or YYYY"",
      ""expiryDate"": ""YYYY-MM or YYYY or null"",
      ""credentialId"": ""string"",
      ""credentialUrl"": ""string""
    }}
  ],
  ""awards"": [
    {{
      ""title"": ""string"",
      ""issuer"": ""string"",
      ""dateReceived"": ""YYYY-MM or YYYY"",
      ""description"": ""string""
    }}
  ],
  ""languages"": [
    {{
      ""name"": ""string"",
      ""proficiencyLevel"": ""Native|Fluent|Professional|Conversational|Basic""
    }}
  ],
  ""confidenceScore"": 0-100,
  ""suggestedSections"": [""string (sections that could be added)""],
  ""parsingWarnings"": [""string (any issues or uncertainties)""]
}}

Guidelines:
- Extract all information accurately
- For dates, use YYYY-MM format when month is available, YYYY when only year
- For current positions, use ""Present"" as endDate and set isCurrent to true
- Categorize skills appropriately (Technical, Soft, Language, Domain)
- Achievements should be specific, measurable accomplishments
- Technologies should be extracted from job descriptions
- confidenceScore: 0-100 based on clarity and completeness of the resume
- suggestedSections: Recommend sections the candidate should add (e.g., ""Portfolio"", ""Certifications"", ""Awards"")
- parsingWarnings: Note any ambiguous or unclear information

Return ONLY the JSON object, nothing else.";
    }

    private string BuildLinkedInParsingPrompt(string linkedInContent)
    {
        return $@"You are an expert profile parser. Extract structured data from the following LinkedIn profile and return it as JSON.

IMPORTANT: Return ONLY valid JSON, no additional text or explanations.

LinkedIn Profile Data:
{linkedInContent}

[Use same JSON structure as BuildResumeParsingPrompt]

Return ONLY the JSON object, nothing else.";
    }

    private async Task<string> CallOpenAIAsync(string prompt)
    {
        try
        {
            var requestBody = new
            {
                model = _openAiModel,
                messages = new[]
                {
                    new { role = "system", content = "You are an expert resume parser that extracts structured data from resumes and returns only valid JSON." },
                    new { role = "user", content = prompt }
                },
                temperature = 0.3, // Lower temperature for more consistent parsing
                max_tokens = 3000,
                response_format = new { type = "json_object" } // Request JSON mode
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _openAiApiKey);

            var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var jsonResponse = JsonDocument.Parse(responseContent);
            var messageContent = jsonResponse.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return messageContent ?? throw new InvalidOperationException("OpenAI returned null response");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling OpenAI API");
            throw;
        }
    }

    private ParsedResumeDto ParseOpenAIResponse(string jsonResponse)
    {
        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var parsedResume = JsonSerializer.Deserialize<ParsedResumeDto>(jsonResponse, options);
            return parsedResume ?? throw new InvalidOperationException("Failed to deserialize OpenAI response");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing OpenAI JSON response: {Response}", jsonResponse);
            throw;
        }
    }

    private async Task<string> ExtractTextFromTxtAsync(Stream fileStream)
    {
        using var reader = new StreamReader(fileStream, Encoding.UTF8);
        return await reader.ReadToEndAsync();
    }

    private async Task<string> ExtractTextFromPdfAsync(Stream fileStream)
    {
        // TODO: Implement PDF text extraction using a library like iTextSharp or PdfPig
        // For now, throw an exception indicating this needs implementation
        _logger.LogWarning("PDF extraction not yet implemented");
        throw new NotImplementedException("PDF text extraction requires additional library (iTextSharp/PdfPig). Please use .txt files for now.");
    }

    private async Task<string> ExtractTextFromDocxAsync(Stream fileStream)
    {
        // TODO: Implement DOCX text extraction using DocumentFormat.OpenXml or similar
        _logger.LogWarning("DOCX extraction not yet implemented");
        throw new NotImplementedException("DOCX text extraction requires additional library (DocumentFormat.OpenXml). Please use .txt files for now.");
    }
}
