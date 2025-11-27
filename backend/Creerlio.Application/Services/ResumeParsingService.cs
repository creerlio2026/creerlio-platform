using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Creerlio.Application.Services
{
    public class ResumeParsingService
    {
        private readonly ILogger<ResumeParsingService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private const string OpenAIModel = "gpt-4-turbo-preview";

        public ResumeParsingService(
            ILogger<ResumeParsingService> logger,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public async Task<ResumeParseResult> ParseResumeAsync(string resumeText)
        {
            try
            {
                _logger.LogInformation("📄 Starting resume parsing with OpenAI...");

                var apiKey = _configuration["OpenAI:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogWarning("⚠️ OpenAI API key not configured. Using fallback parsing.");
                    return await FallbackParse(resumeText);
                }

                var prompt = BuildExtractionPrompt(resumeText);
                var requestBody = new
                {
                    model = OpenAIModel,
                    messages = new[]
                    {
                        new { role = "system", content = "You are an expert resume parser. Extract structured data from resumes in JSON format matching the schema provided." },
                        new { role = "user", content = prompt }
                    },
                    response_format = new { type = "json_object" },
                    temperature = 0.3,
                    max_tokens = 3000
                };

                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
                request.Headers.Add("Authorization", $"Bearer {apiKey}");
                request.Content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"❌ OpenAI API error: {response.StatusCode} - {responseContent}");
                    return await FallbackParse(resumeText);
                }

                var openAIResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseContent);
                var extractedJson = openAIResponse?.choices?[0]?.message?.content;

                if (string.IsNullOrEmpty(extractedJson))
                {
                    _logger.LogWarning("⚠️ No content in OpenAI response. Using fallback.");
                    return await FallbackParse(resumeText);
                }

                var result = JsonSerializer.Deserialize<ResumeParseResult>(extractedJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogInformation("✅ Resume parsed successfully with OpenAI");
                return result ?? await FallbackParse(resumeText);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error parsing resume with OpenAI. Using fallback.");
                return await FallbackParse(resumeText);
            }
        }

        private string BuildExtractionPrompt(string resumeText)
        {
            return $@"Extract all relevant information from this resume and return as JSON matching this exact schema:

{{
  ""personalInfo"": {{
    ""firstName"": ""string"",
    ""lastName"": ""string"",
    ""email"": ""string"",
    ""phone"": ""string"",
    ""city"": ""string"",
    ""state"": ""string"",
    ""linkedInUrl"": ""string (optional)"",
    ""githubUrl"": ""string (optional)"",
    ""websiteUrl"": ""string (optional)""
  }},
  ""headline"": ""string (professional title/headline)"",
  ""summary"": ""string (professional summary/bio)"",
  ""workExperiences"": [
    {{
      ""company"": ""string"",
      ""title"": ""string"",
      ""startDate"": ""YYYY-MM-DD"",
      ""endDate"": ""YYYY-MM-DD or null if current"",
      ""isCurrentRole"": boolean,
      ""location"": ""string (city, state)"",
      ""employmentType"": ""Full-time|Part-time|Contract|Freelance|Internship"",
      ""description"": ""string"",
      ""achievements"": [""string array of key achievements""],
      ""technologies"": [""string array of tools/tech used""]
    }}
  ],
  ""educations"": [
    {{
      ""institution"": ""string"",
      ""degree"": ""string (e.g., Bachelor of Science)"",
      ""field"": ""string (e.g., Computer Science)"",
      ""startDate"": ""YYYY-MM-DD"",
      ""endDate"": ""YYYY-MM-DD"",
      ""gpa"": number (optional),
      ""description"": ""string"",
      ""honors"": [""string array of honors/awards""]
    }}
  ],
  ""skills"": [
    {{
      ""name"": ""string"",
      ""category"": ""Programming Languages & Frameworks|Cloud & DevOps|Data & Analytics|Design & Creative|Business & Management|Marketing & Sales|Engineering & Technical|Healthcare & Medical|Soft Skills & Leadership"",
      ""proficiencyLevel"": number (1-5),
      ""yearsOfExperience"": number
    }}
  ],
  ""certifications"": [
    {{
      ""name"": ""string"",
      ""issuingOrganization"": ""string"",
      ""issueDate"": ""YYYY-MM-DD"",
      ""expiryDate"": ""YYYY-MM-DD or null"",
      ""credentialId"": ""string (optional)"",
      ""credentialUrl"": ""string (optional)""
    }}
  ],
  ""awards"": [
    {{
      ""title"": ""string"",
      ""issuer"": ""string"",
      ""dateReceived"": ""YYYY-MM-DD"",
      ""description"": ""string""
    }}
  ]
}}

Resume text:
{resumeText}

Important rules:
1. Extract all dates in YYYY-MM-DD format
2. If a field is not found, use empty string or null
3. For current employment, set isCurrentRole=true and endDate=null
4. Categorize skills accurately based on the categories provided
5. Estimate proficiency levels based on context (years mentioned, project complexity)
6. Return ONLY valid JSON, no additional text";
        }

        private async Task<ResumeParseResult> FallbackParse(string resumeText)
        {
            _logger.LogInformation("🔄 Using fallback parsing (basic extraction)...");

            // Basic email/phone extraction
            var emailPattern = @"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b";
            var phonePattern = @"(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}";
            
            var emailMatch = System.Text.RegularExpressions.Regex.Match(resumeText, emailPattern);
            var phoneMatch = System.Text.RegularExpressions.Regex.Match(resumeText, phonePattern);

            return new ResumeParseResult
            {
                PersonalInfo = new PersonalInfoDto
                {
                    Email = emailMatch.Success ? emailMatch.Value : "",
                    Phone = phoneMatch.Success ? phoneMatch.Value : ""
                },
                Summary = "Please review and edit the imported information.",
                WorkExperiences = new List<WorkExperienceDto>(),
                Educations = new List<EducationDto>(),
                Skills = new List<SkillDto>(),
                Certifications = new List<CertificationDto>(),
                Awards = new List<AwardDto>()
            };
        }

        // OpenAI Response DTOs
        private class OpenAIResponse
        {
            public Choice[]? choices { get; set; }
        }

        private class Choice
        {
            public Message? message { get; set; }
        }

        private class Message
        {
            public string? content { get; set; }
        }
    }

    // Result DTOs
    public class ResumeParseResult
    {
        public PersonalInfoDto PersonalInfo { get; set; } = new();
        public string Headline { get; set; } = "";
        public string Summary { get; set; } = "";
        public List<WorkExperienceDto> WorkExperiences { get; set; } = new();
        public List<EducationDto> Educations { get; set; } = new();
        public List<SkillDto> Skills { get; set; } = new();
        public List<CertificationDto> Certifications { get; set; } = new();
        public List<AwardDto> Awards { get; set; } = new();
    }

    public class PersonalInfoDto
    {
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Phone { get; set; } = "";
        public string City { get; set; } = "";
        public string State { get; set; } = "";
        public string? LinkedInUrl { get; set; }
        public string? GithubUrl { get; set; }
        public string? WebsiteUrl { get; set; }
    }

    public class WorkExperienceDto
    {
        public string Company { get; set; } = "";
        public string Title { get; set; } = "";
        public string StartDate { get; set; } = "";
        public string? EndDate { get; set; }
        public bool IsCurrentRole { get; set; }
        public string Location { get; set; } = "";
        public string EmploymentType { get; set; } = "Full-time";
        public string Description { get; set; } = "";
        public List<string> Achievements { get; set; } = new();
        public List<string> Technologies { get; set; } = new();
    }

    public class EducationDto
    {
        public string Institution { get; set; } = "";
        public string Degree { get; set; } = "";
        public string Field { get; set; } = "";
        public string StartDate { get; set; } = "";
        public string EndDate { get; set; } = "";
        public double? Gpa { get; set; }
        public string Description { get; set; } = "";
        public List<string> Honors { get; set; } = new();
    }

    public class SkillDto
    {
        public string Name { get; set; } = "";
        public string Category { get; set; } = "";
        public int ProficiencyLevel { get; set; } = 3;
        public int YearsOfExperience { get; set; } = 0;
    }

    public class CertificationDto
    {
        public string Name { get; set; } = "";
        public string IssuingOrganization { get; set; } = "";
        public string IssueDate { get; set; } = "";
        public string? ExpiryDate { get; set; }
        public string? CredentialId { get; set; }
        public string? CredentialUrl { get; set; }
    }

    public class AwardDto
    {
        public string Title { get; set; } = "";
        public string Issuer { get; set; } = "";
        public string DateReceived { get; set; } = "";
        public string Description { get; set; } = "";
    }
}
