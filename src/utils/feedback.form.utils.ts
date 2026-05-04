export interface FeedbackFormData {
  candidate: {
    name: string;
  };
  jobPosting: {
    title: string;
    company: string;
  };
  assessment: {
    scheduledDate?: string;
  };
  isSubmitted: boolean;
}

export class FeedbackFormUtils {
  /**
   * Generate HTML for feedback already submitted page
   */
  static generateAlreadySubmittedHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feedback Already Submitted</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            background: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
            border: 1px solid #e9ecef;
          }
          
          .icon {
            width: 80px;
            height: 80px;
            background: #d4edda;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
            color: #28a745;
          }
          
          h1 {
            color: #495057;
            margin-bottom: 15px;
            font-size: 24px;
            font-weight: 600;
          }
          
          p {
            color: #6c757d;
            line-height: 1.6;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✓</div>
          <h1>Feedback Already Submitted</h1>
          <p>This feedback has already been submitted. Thank you for your participation.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for invalid token page
   */
  static generateInvalidTokenHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invalid Feedback Token</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            background: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
            border: 1px solid #e9ecef;
          }
          
          .icon {
            width: 80px;
            height: 80px;
            background: #fff5f5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
            color: #e53e3e;
          }
          
          h1 {
            color: #2d3748;
            margin-bottom: 15px;
            font-size: 24px;
            font-weight: 600;
          }
          
          p {
            color: #4a5568;
            line-height: 1.6;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">⚠</div>
          <h1>Invalid Feedback Token</h1>
          <p>The feedback token is invalid or has expired. Please check your email for the correct link.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for the feedback form
   */
  static generateFeedbackFormHtml(
    feedbackToken: string,
    data: FeedbackFormData
  ): string {
    const scheduledDate = data.assessment.scheduledDate
      ? new Date(data.assessment.scheduledDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Not scheduled';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Panel Assessment Feedback</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            background: white;
            min-height: 100vh;
            padding: 20px;
            line-height: 1.6;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e9ecef;
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          
          .header p {
            font-size: 18px;
            opacity: 0.9;
          }
          
          .content {
            padding: 40px;
          }
          
          .info-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 32px;
            border-left: 4px solid #667eea;
          }
          
          .info-card h3 {
            color: #495057;
            margin-bottom: 16px;
            font-size: 20px;
            font-weight: 600;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
          }
          
          .info-label {
            font-weight: 600;
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .info-value {
            color: #495057;
            font-size: 16px;
          }
          
          .form-group {
            margin-bottom: 24px;
          }
          
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #495057;
            font-size: 16px;
          }
          
          input, select, textarea {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
            background: white;
            font-family: inherit;
          }
          
          input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          
          textarea {
            height: 120px;
            resize: vertical;
          }
          
          .submit-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            font-weight: 600;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            width: 100%;
          }
          
          .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          }
          
          .submit-btn:disabled {
            background: #6c757d;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          
          .message {
            margin-top: 16px;
            padding: 12px 16px;
            border-radius: 8px;
            font-weight: 500;
          }
          
          .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          
          .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
          
          .error-text {
            color: #dc3545;
            font-size: 14px;
            margin-top: 8px;
            display: none;
          }
          
          .success-page {
            display: none;
            text-align: center;
            padding: 60px 40px;
          }
          
          .success-icon {
            width: 100px;
            height: 100px;
            background: #d4edda;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            font-size: 50px;
            color: #28a745;
          }
          
          .success-title {
            font-size: 28px;
            font-weight: 700;
            color: #495057;
            margin-bottom: 20px;
          }
          
          .success-message {
            font-size: 18px;
            color: #6c757d;
            line-height: 1.6;
            max-width: 500px;
            margin: 0 auto;
          }
          
          @media (max-width: 768px) {
            .header {
              padding: 30px 20px;
            }
            
            .header h1 {
              font-size: 24px;
            }
            
            .content {
              padding: 30px 20px;
            }
            
            .success-page {
              padding: 40px 20px;
            }
            
            .success-title {
              font-size: 24px;
            }
            
            .info-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Panel Assessment Feedback</h1>
            <p>Please provide your feedback for the panel assessment</p>
          </div>
          
          <div class="content" id="formContent">
            <div class="info-card">
              <h3>Assessment Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Candidate</span>
                  <span class="info-value">${data.candidate.name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Position</span>
                  <span class="info-value">${data.jobPosting.title}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Company</span>
                  <span class="info-value">${data.jobPosting.company}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Interview Date</span>
                  <span class="info-value">${scheduledDate}</span>
                </div>
              </div>
            </div>

            <form id="feedbackForm">
              <div class="form-group">
                <label for="detailedFeedback">Detailed Feedback *</label>
                <textarea 
                  id="detailedFeedback" 
                  name="detailedFeedback" 
                  required 
                  placeholder="Please provide detailed feedback about the candidate's performance, skills, and overall assessment..."
                ></textarea>
                <div id="feedbackError" class="error-text"></div>
              </div>

              <div class="form-group">
                <label for="decision">Decision *</label>
                <select id="decision" name="decision" required>
                  <option value="">Select a decision</option>
                  <option value="HIRE">Hire</option>
                  <option value="NO_HIRE">No Hire</option>
                  <option value="NEEDS_ANOTHER_ROUND">Needs Another Round</option>
                </select>
              </div>

              <div class="form-group">
                <label for="recommendation">Recommendation *</label>
                <select id="recommendation" name="recommendation" required>
                  <option value="">Select a recommendation</option>
                  <option value="HIGHLY_RECOMMENDED">Highly Recommended</option>
                  <option value="RECOMMENDED">Recommended</option>
                  <option value="NOT_RECOMMENDED">Not Recommended</option>
                  <option value="REQUIRES_FURTHER_REVIEW">Requires Further Review</option>
                </select>
              </div>

              <button type="button" id="submitBtn" class="submit-btn">Submit Feedback</button>
              <div id="submitMessage"></div>
            </form>
          </div>
          
          <div class="success-page" id="successPage">
            <div class="success-icon">✓</div>
            <h1 class="success-title">Your Feedback is Submitted!</h1>
            <p class="success-message">Thank you for providing your valuable feedback. Your input has been successfully recorded and will be reviewed by our team.</p>
          </div>
        </div>

        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('feedbackForm');
            const submitBtn = document.getElementById('submitBtn');
            const submitMessage = document.getElementById('submitMessage');
            const feedbackError = document.getElementById('feedbackError');
            const formContent = document.getElementById('formContent');
            const successPage = document.getElementById('successPage');

            // Handle form submission
            async function submitFeedback() {
              // Get form data
              const detailedFeedback = document.getElementById('detailedFeedback').value.trim();
              const decision = document.getElementById('decision').value;
              const recommendation = document.getElementById('recommendation').value;

              const data = {
                detailedFeedback,
                decision,
                recommendation
              };

              // Validation
              if (!detailedFeedback) {
                feedbackError.textContent = 'Please provide detailed feedback';
                feedbackError.style.display = 'block';
                return;
              }

              if (!decision) {
                alert('Please select a decision');
                return;
              }

              if (!recommendation) {
                alert('Please select a recommendation');
                return;
              }

              feedbackError.style.display = 'none';

              // Submit
              submitBtn.disabled = true;
              submitBtn.textContent = 'Submitting...';
              submitMessage.innerHTML = '<div class="message success">Submitting feedback...</div>';

              try {
                const apiUrl = '/api/client/panel-assessment/feedback/public/${feedbackToken}';
                
                const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  body: JSON.stringify(data)
                });

                let result;
                try {
                  result = await response.json();
                } catch (parseError) {
                  console.error('Error parsing JSON response:', parseError);
                  throw new Error('Invalid response format from server');
                }

                if (response.ok) {
                  // Immediately show success page
                  formContent.style.display = 'none';
                  successPage.style.display = 'block';
                } else {
                  throw new Error(result.message || result.error || 'Failed to submit feedback');
                }
              } catch (error) {
                console.error('Error submitting feedback:', error);
                let errorMessage = 'An error occurred while submitting feedback';
                
                if (error.message) {
                  errorMessage = error.message;
                } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                  errorMessage = 'Network error - please check your internet connection';
                }
                
                submitMessage.innerHTML = '<div class="message error">Error: ' + errorMessage + '</div>';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Feedback';
              }
            }

            // Add click event listener to submit button
            submitBtn.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              submitFeedback();
            });

            // Add form submit event listener as backup
            form.addEventListener('submit', function(e) {
              e.preventDefault();
              e.stopPropagation();
              submitFeedback();
            });

            // Add Enter key support for form submission
            form.addEventListener('keydown', function(e) {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submitFeedback();
              }
            });
          });
        </script>
      </body>
      </html>
    `;
  }
}
