import { NotificationFactory } from '../src/services/notification/notification.factory';
import { logger } from '../src/shared/utils/logger';

async function testNodemailerEmailFramework() {
  try {
    logger.info('Testing Nodemailer Email Framework', {
      context: 'testNodemailerEmailFramework',
    });

    // Get the notification provider (will use SMTP/Nodemailer when NOTIFICATION_PROVIDER=smtp)
    const notificationProvider =
      new NotificationFactory().getNotificationProvider();

    // Test 1: Send a verification email
    logger.info('Sending verification email...');
    await notificationProvider.sendVerificationEmail(
      'vijay.khade@humancloud.co.in',
      'Vijay Khade',
      'https://app.teamcast.ai/verify?token=test-token-123'
    );

    // Test 2: Send a password reset email
    logger.info('Sending password reset email...');
    await notificationProvider.sendPasswordResetEmail(
      'vijay.khade@humancloud.co.in',
      'Vijay Khade',
      'https://app.teamcast.ai/reset-password?token=reset-token-456'
    );

    // Test 3: Send a client invitation email
    logger.info('Sending client invitation email...');
    await notificationProvider.sendClientUserInvitationEmail(
      'vijay.khade@humancloud.co.in',
      'Vijay Khade',
      'HumanCloud Solutions',
      'John Manager',
      'https://app.teamcast.ai/accept-invitation?token=invite-token-789',
      'HR Manager',
      48
    );

    // Test 4: Send a custom email with dynamic HTML
    logger.info('Sending custom email with dynamic HTML...');
    await notificationProvider.sendEmail({
      from: 'noreply@teamcast.ai',
      to: 'vijay.khade@humancloud.co.in',
      cc: ['admin@teamcast.ai'],
      subject: 'Custom Dynamic Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Hello {{params.name}}!</h1>
          <p>This is a custom email with dynamic content.</p>
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Dynamic Data:</h3>
            <ul>
              <li><strong>Company:</strong> {{params.company}}</li>
              <li><strong>Position:</strong> {{params.position}}</li>
              <li><strong>Salary:</strong> {{params.salary}}</li>
              <li><strong>Location:</strong> {{params.location}}</li>
            </ul>
          </div>
          <p>Best regards,<br>Teamcast Team</p>
        </div>
      `,
      text: 'Hello! This is a custom email with dynamic content. Best regards, Teamcast Team',
    });

    logger.info('All email tests completed successfully!', {
      context: 'testNodemailerEmailFramework',
    });
  } catch (error) {
    logger.error('Error testing Nodemailer email framework', {
      context: 'testNodemailerEmailFramework',
      error,
    });
  }
}

// Run the test
testNodemailerEmailFramework();
