import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API Key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('⚠️ SENDGRID_API_KEY not set - email notifications disabled');
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via SendGrid
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️ Email not sent - SendGrid not configured');
    return false;
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.error('❌ SENDGRID_FROM_EMAIL not set');
    return false;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log(`✅ Email sent to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    return true;
  } catch (error) {
    console.error('❌ SendGrid error:', error);
    return false;
  }
};

/**
 * Send action assignment notification
 */
export const sendActionAssignedEmail = async (
  recipientEmail: string,
  actionDetails: {
    title: string;
    plant: string;
    priority: string;
    dueDate?: Date;
    assignedBy: string;
  }
) => {
  const dueDateStr = actionDetails.dueDate
    ? new Date(actionDetails.dueDate).toLocaleDateString('de-DE')
    : 'Kein Fälligkeitsdatum';

  const priorityEmoji = {
    LOW: '🟢',
    MEDIUM: '🟡',
    HIGH: '🟠',
    URGENT: '🔴',
  }[actionDetails.priority] || '⚪';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Neue Action zugewiesen</h2>
      <p>Ihnen wurde eine neue Action zugewiesen:</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${actionDetails.title}</h3>
        <p><strong>Anlage:</strong> ${actionDetails.plant}</p>
        <p><strong>Priorität:</strong> ${priorityEmoji} ${actionDetails.priority}</p>
        <p><strong>Fällig am:</strong> ${dueDateStr}</p>
        <p><strong>Zugewiesen von:</strong> ${actionDetails.assignedBy}</p>
      </div>
      
      <a href="${process.env.FRONTEND_URL || 'https://maintain-nory.onrender.com'}/actions" 
         style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; margin-top: 10px;">
        Action ansehen
      </a>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px;">
        Diese E-Mail wurde automatisch vom CMMS-System gesendet.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Neue Action: ${actionDetails.title}`,
    html,
  });
};

/**
 * Send comment notification
 */
export const sendCommentNotificationEmail = async (
  recipientEmail: string,
  commentDetails: {
    commentText: string;
    itemTitle: string;
    itemType: 'action' | 'project' | 'failure-report';
    commentedBy: string;
  }
) => {
  const itemTypeLabel = {
    action: 'Action',
    project: 'Projekt',
    'failure-report': 'Schadensmeldung',
  }[commentDetails.itemType];

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Neuer Kommentar</h2>
      <p><strong>${commentDetails.commentedBy}</strong> hat einen Kommentar hinterlassen:</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-style: italic;">"${commentDetails.commentText}"</p>
      </div>
      
      <p><strong>${itemTypeLabel}:</strong> ${commentDetails.itemTitle}</p>
      
      <a href="${process.env.FRONTEND_URL || 'https://maintain-nory.onrender.com'}" 
         style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; margin-top: 10px;">
        Kommentar ansehen
      </a>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px;">
        Diese E-Mail wurde automatisch vom CMMS-System gesendet.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Neuer Kommentar zu: ${commentDetails.itemTitle}`,
    html,
  });
};

/**
 * Send deadline reminder
 */
export const sendDeadlineReminderEmail = async (
  recipientEmail: string,
  reminderDetails: {
    title: string;
    dueDate: Date;
    itemType: 'action' | 'project';
  }
) => {
  const daysUntilDue = Math.ceil(
    (new Date(reminderDetails.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const urgencyColor = daysUntilDue <= 1 ? '#dc2626' : daysUntilDue <= 3 ? '#f59e0b' : '#3b82f6';
  const urgencyText = daysUntilDue <= 0 ? 'ÜBERFÄLLIG' : `Noch ${daysUntilDue} Tag(e)`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${urgencyColor};">Fälligkeits-Erinnerung</h2>
      <p>Eine ${reminderDetails.itemType === 'action' ? 'Action' : 'Projekt'} wird bald fällig:</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
        <h3 style="margin-top: 0;">${reminderDetails.title}</h3>
        <p style="color: ${urgencyColor}; font-weight: bold; font-size: 18px;">${urgencyText}</p>
        <p><strong>Fällig am:</strong> ${new Date(reminderDetails.dueDate).toLocaleDateString('de-DE')}</p>
      </div>
      
      <a href="${process.env.FRONTEND_URL || 'https://maintain-nory.onrender.com'}" 
         style="display: inline-block; background: ${urgencyColor}; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; margin-top: 10px;">
        Jetzt ansehen
      </a>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px;">
        Diese E-Mail wurde automatisch vom CMMS-System gesendet.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `⏰ Erinnerung: ${reminderDetails.title} - ${urgencyText}`,
    html,
  });
};
