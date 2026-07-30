jest.resetModules();

// Mocks
jest.mock('resend', () => {
  const send = jest.fn();
  global.__RESEND_SEND_MOCK = send;
  return { Resend: jest.fn(() => ({ emails: { send } })) };
});

jest.mock('../../middleware/logging', () => ({
  audit: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

jest.mock('../../config/services', () => ({
  email: { apiKey: 'test-key', fromEmail: 'noreply@test', fromName: 'Test', replyTo: 'support@test' },
  app: { frontendUrl: 'http://localhost:3000' }
}));

jest.mock('../../services/emailTemplates', () => ({
  submissionToken: jest.fn(() => '<html>submission</html>'),
  adminNewSubmission: jest.fn(() => '<html>admin</html>'),
  feedbackToAuthor: jest.fn(() => '<html>feedback</html>'),
  submissionApproved: jest.fn(() => '<html>approved</html>'),
  tokenExpirationWarning: jest.fn(() => '<html>expiring</html>'),
  tokenExpired: jest.fn(() => '<html>expired</html>'),
  securityAlert: jest.fn(() => '<html>alert</html>'),
  dailySummary: jest.fn(() => '<html>summary</html>'),
  testEmail: jest.fn(() => '<html>test</html>'),
  submissionAccessLinks: jest.fn(() => '<html>links</html>')
}));

const logging = require('../../middleware/logging');
const emailService = require('../../services/email');

describe('EmailService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendEmail - success response from Resend', async () => {
    global.__RESEND_SEND_MOCK.mockResolvedValue({ data: { id: 'msg-1' } });

    const res = await emailService.sendEmail({ to: 'a@test', subject: 'Hi', html: '<b>ok</b>' });

    expect(res.success).toBe(true);
    expect(res.messageId).toBe('msg-1');
    expect(logging.audit).toHaveBeenCalled();
  });

  test('sendEmail includes text when provided', async () => {
    global.__RESEND_SEND_MOCK.mockResolvedValue({ data: { id: 'msg-2' } });

    const res = await emailService.sendEmail({ to: 'a@test', subject: 'Hi', html: '<b>ok</b>', text: 'plain text' });

    expect(res.success).toBe(true);
    expect(global.__RESEND_SEND_MOCK).toHaveBeenCalledWith(expect.objectContaining({ text: 'plain text' }));
  });

  test('sendEmail - throws and retries until exhausted', async () => {
    // Make resend throw to exercise retry path
    global.__RESEND_SEND_MOCK.mockRejectedValue(new Error('network'));

    // reduce retryAttempts to speed test
    const originalAttempts = emailService.retryAttempts;
    emailService.retryAttempts = 2;

    await expect(emailService.sendEmail({ to: 'a@test', subject: 'Hi', html: '<b>ok</b>' }))
      .rejects.toThrow(/Falha ao enviar email/);

    emailService.retryAttempts = originalAttempts;
    expect(logging.error).toHaveBeenCalled();
  });

  test('sendSubmissionToken - success when sendEmail returns success', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

    const submission = { id: 's1', author_name: 'Au', title: 'T' };
    const res = await emailService.sendSubmissionToken('author@test', submission);

    expect(spy).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(logging.audit).toHaveBeenCalled();
  });

  test('sendSubmissionToken - returns false when sendEmail throws', async () => {
    jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('boom'));
    const submission = { id: 's2', author_name: 'Au', title: 'T' };
    const res = await emailService.sendSubmissionToken('author@test', submission);

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('sendSubmissionToken - returns error when sendEmail returns failure', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: false, errorMessage: 'err', statusCode: 500 });

    const submission = { id: 's2', author_name: 'Au', title: 'T' };
    const res = await emailService.sendSubmissionToken('author@test', submission);

    expect(spy).toHaveBeenCalled();
    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('notifyAdminNewSubmission sends to each admin', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
    const submission = { id: 's3', title: 'Title', author_name: 'A', author_email: 'a@a', category: 'c', summary: 'sum', created_at: new Date() };
    const admins = ['one@test', 'two@test'];

    const res = await emailService.notifyAdminNewSubmission(submission, admins);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(res.success).toBe(true);
  });

  test('testEmailConfiguration returns mapped result', async () => {
    jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
    const res = await emailService.testEmailConfiguration('me@test');
    expect(res.success).toBe(true);
  });

  test('sendFeedbackToAuthor uses different subject for rejected status', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
    const submission = { id: 's4', title: 'Title', author_name: 'A', author_email: 'author@test', token: 'tkn' };
    const feedback = { id: 'f1', content: 'Please fix', status: 'rejected', created_at: new Date() };

    const res = await emailService.sendFeedbackToAuthor(submission, feedback, 'Admin');

    expect(spy).toHaveBeenCalled();
    const callArg = spy.mock.calls[0][0];
    expect(callArg.subject).toMatch(/não foi aprovada|Sua submissão/);
    expect(res.success).toBe(true);
  });

  test('sendFeedbackToAuthor uses change request subject for changes_requested status', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
    const submission = { id: 's4', title: 'Title', author_name: 'A', author_email: 'author@test', token: 'tkn' };
    const feedback = { id: 'f2', content: 'Please fix', status: 'changes_requested', created_at: new Date() };

    const res = await emailService.sendFeedbackToAuthor(submission, feedback, 'Admin');

    expect(spy).toHaveBeenCalled();
    const callArg = spy.mock.calls[0][0];
    expect(callArg.subject).toMatch(/Correções solicitadas/);
    expect(res.success).toBe(true);
  });

  test('sendFeedbackToAuthor returns false when sendEmail returns failure', async () => {
    jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: false, errorMessage: 'fail', statusCode: 500 });
    const submission = { id: 's4', title: 'Title', author_name: 'A', author_email: 'author@test', token: 'tkn' };
    const feedback = { id: 'f1', content: 'Please fix', status: 'rejected', created_at: new Date() };

    const res = await emailService.sendFeedbackToAuthor(submission, feedback, 'Admin');

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('sendFeedbackToAuthor returns false when sendEmail throws', async () => {
    jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('boom'));
    const submission = { id: 's4', title: 'Title', author_name: 'A', author_email: 'author@test', token: 'tkn' };
    const feedback = { id: 'f1', content: 'Please fix', status: 'rejected', created_at: new Date() };

    const res = await emailService.sendFeedbackToAuthor(submission, feedback, 'Admin');

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('notifyAuthorApproval returns false when sendEmail throws', async () => {
    jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('boom'));
    const submission = { id: 's5', title: 'Title', author_name: 'A', author_email: 'author@test' };

    const res = await emailService.notifyAuthorApproval(submission, 'http://article');

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('notifyAuthorApproval sends approval notification', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
    const submission = { id: 's5', title: 'Title', author_name: 'A', author_email: 'author@test' };

    const res = await emailService.notifyAuthorApproval(submission, 'http://article');

    expect(spy).toHaveBeenCalled();
    expect(res.success).toBe(true);
  });

  test('sendExpirationWarning sends warning email', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
    const submission = { id: 's6', title: 'Title', author_name: 'A', author_email: 'author@test', token: 'tkn', expires_at: new Date() };

    const res = await emailService.sendExpirationWarning(submission, 3);

    expect(spy).toHaveBeenCalled();
    expect(res.success).toBe(true);
  });

  test('notifyTokenExpired sends expired token notification', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
    const submission = { id: 's7', title: 'Title', author_name: 'A', author_email: 'author@test' };

    const res = await emailService.notifyTokenExpired(submission);

    expect(spy).toHaveBeenCalled();
    expect(res.success).toBe(true);
  });

  test('alertAdminSuspiciousActivity sends security alert to admins', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
    const activity = { type: 'login', details: 'multiple failures', ip: '127.0.0.1' };
    const adminEmails = ['admin1@test', 'admin2@test'];

    const res = await emailService.alertAdminSuspiciousActivity(activity, adminEmails);

    expect(spy).toHaveBeenCalled();
    expect(res.success).toBe(true);
  });

  test('sendDailySummary sends summary email to admins', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
    const summary = { newSubmissions: 1, pendingReviews: 2, publishedArticles: 3, expiringTokens: 4 };
    const adminEmails = ['admin@test'];

    const res = await emailService.sendDailySummary(summary, adminEmails);

    expect(spy).toHaveBeenCalled();
    expect(res.success).toBe(true);
  });

  test('sendSubmissionAccessLinks sends links email', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
    const submissions = [{ title: 'Draft', updated_at: new Date(), token: 'tok', expires_at: new Date(), status: 'DRAFT' }];

    const res = await emailService.sendSubmissionAccessLinks('author@test', submissions);

    expect(spy).toHaveBeenCalled();
    expect(res.success).toBe(true);
  });

  test('notifyAdminNewSubmission returns false when sendEmail throws', async () => {
    jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('boom'));
    const submission = { id: 's3', title: 'Title', author_name: 'A', author_email: 'a@a', category: 'c', summary: 'sum', created_at: new Date() };

    const res = await emailService.notifyAdminNewSubmission(submission, ['one@test']);

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('notifyAuthorApproval returns false when sendEmail fails', async () => {
    jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: false, errorMessage: 'fail', statusCode: 500 });
    const submission = { id: 's5', title: 'Title', author_name: 'A', author_email: 'author@test' };

    const res = await emailService.notifyAuthorApproval(submission, 'http://article');

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('sendExpirationWarning returns false when sendEmail fails', async () => {
    jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: false, errorMessage: 'fail', statusCode: 500 });
    const submission = { id: 's6', title: 'Title', author_name: 'A', author_email: 'author@test', token: 'tkn', expires_at: new Date() };

    const res = await emailService.sendExpirationWarning(submission, 3);

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('notifyTokenExpired returns false when sendEmail fails', async () => {
    jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: false, errorMessage: 'fail', statusCode: 500 });
    const submission = { id: 's7', title: 'Title', author_name: 'A', author_email: 'author@test' };

    const res = await emailService.notifyTokenExpired(submission);

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('alertAdminSuspiciousActivity returns false when sendEmail fails', async () => {
    jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: false, errorMessage: 'fail', statusCode: 500 });
    const activity = { type: 'login', details: 'multiple failures', ip: '127.0.0.1' };
    const adminEmails = ['admin1@test'];

    const res = await emailService.alertAdminSuspiciousActivity(activity, adminEmails);

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('sendDailySummary returns false when sendEmail fails', async () => {
    jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: false, errorMessage: 'fail', statusCode: 500 });
    const summary = { newSubmissions: 1, pendingReviews: 2, publishedArticles: 3, expiringTokens: 4 };
    const adminEmails = ['admin@test'];

    const res = await emailService.sendDailySummary(summary, adminEmails);

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('sendSubmissionAccessLinks returns false when sendEmail fails', async () => {
    jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: false, errorMessage: 'fail', statusCode: 500 });
    const submissions = [{ title: 'Draft', updated_at: new Date(), token: 'tok', expires_at: new Date(), status: 'DRAFT' }];

    const res = await emailService.sendSubmissionAccessLinks('author@test', submissions);

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('testEmailConfiguration returns false when sendEmail throws', async () => {
    jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('boom'));
    const res = await emailService.testEmailConfiguration('me@test');

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('sendDailySummary returns false when sendEmail throws', async () => {
    jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('boom'));
    const summary = { newSubmissions: 1, pendingReviews: 2, publishedArticles: 3, expiringTokens: 4 };
    const res = await emailService.sendDailySummary(summary, ['admin@test']);

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('sendExpirationWarning catches exceptions and returns false', async () => {
    jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('boom'));
    const submission = { id: 's6', title: 'Title', author_name: 'A', author_email: 'author@test', token: 'tkn', expires_at: new Date() };

    const res = await emailService.sendExpirationWarning(submission, 3);
    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('notifyTokenExpired catches exceptions and returns false', async () => {
    jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('boom'));
    const submission = { id: 's7', title: 'Title', author_name: 'A', author_email: 'author@test' };

    const res = await emailService.notifyTokenExpired(submission);
    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('alertAdminSuspiciousActivity catches exceptions and returns false', async () => {
    jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('boom'));
    const activity = { type: 'login', details: 'multiple failures', ip: '127.0.0.1' };
    const adminEmails = ['admin1@test'];

    const res = await emailService.alertAdminSuspiciousActivity(activity, adminEmails);
    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('sendSubmissionAccessLinks returns false when sendEmail throws', async () => {
    jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('boom'));
    const submissions = [{ title: 'Draft', updated_at: new Date(), token: 'tok', expires_at: new Date(), status: 'DRAFT' }];

    const res = await emailService.sendSubmissionAccessLinks('author@test', submissions);

    expect(res.success).toBe(false);
    expect(logging.error).toHaveBeenCalled();
  });

  test('sleep waits for the specified time', async () => {
    const res = await emailService.sleep(1);
    expect(res).toBeUndefined();
  });

  test('getEmailStats returns baseline stats', async () => {
    const stats = await emailService.getEmailStats();
    expect(stats).toEqual({ emailsSentToday: 0, failureRate: 0, lastSuccessfulEmail: null, lastFailedEmail: null });
  });
});

