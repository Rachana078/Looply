package com.flowdesk.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:onboarding@resend.dev}")
    private String fromAddress;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ─── Welcome email ────────────────────────────────────────────────────────

    @Async
    public void sendWelcomeEmail(String to, String username) {
        String subject = "Welcome to Looply, " + username + "!";
        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#1e3a5f 0%%,#4A87AC 100%%);padding:40px 40px 32px;text-align:center;">
                        <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Looply</p>
                        <p style="margin:0;font-size:13px;color:rgba(255,255,255,.65);">Project management, simplified</p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 40px 32px;">
                        <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">Welcome aboard, %s! 🎉</h1>
                        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                          Your account is ready. Looply helps your team plan sprints, track bugs,
                          and ship features — all in one place.
                        </p>

                        <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                          <tr>
                            <td style="padding:10px 0;vertical-align:top;width:24px;">
                              <span style="font-size:16px;">📋</span>
                            </td>
                            <td style="padding:10px 0 10px 12px;">
                              <strong style="color:#111827;font-size:14px;">Create a workspace</strong>
                              <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Invite your team and set up your first project.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:10px 0;vertical-align:top;width:24px;">
                              <span style="font-size:16px;">🎯</span>
                            </td>
                            <td style="padding:10px 0 10px 12px;">
                              <strong style="color:#111827;font-size:14px;">Add tickets to the backlog</strong>
                              <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Break work into tasks, bugs, and stories.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:10px 0;vertical-align:top;width:24px;">
                              <span style="font-size:16px;">🚀</span>
                            </td>
                            <td style="padding:10px 0 10px 12px;">
                              <strong style="color:#111827;font-size:14px;">Move cards on the Kanban board</strong>
                              <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Drag tickets from To Do → Done in real time.</p>
                            </td>
                          </tr>
                        </table>

                        <!-- CTA -->
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="border-radius:10px;background:#4A87AC;">
                              <a href="%s" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                                Go to Looply →
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#9ca3af;">© %d Looply. You're receiving this because you just signed up.</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(username, baseUrl, java.time.Year.now().getValue());

        send(to, subject, html);
    }

    // ─── @Mention notification ────────────────────────────────────────────────

    @Async
    public void sendMentionNotification(String to, String mentionedBy,
                                        String ticketTitle, String ticketUrl) {
        String subject = mentionedBy + " mentioned you in \"" + ticketTitle + "\"";
        String fullUrl = baseUrl + ticketUrl;
        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#1e3a5f 0%%,#4A87AC 100%%);padding:32px 40px;text-align:center;">
                        <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#ffffff;">Looply</p>
                        <p style="margin:0;font-size:13px;color:rgba(255,255,255,.65);">You were mentioned in a comment</p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 40px 32px;">
                        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#4A87AC;text-transform:uppercase;letter-spacing:.5px;">New Mention</p>
                        <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">
                          @%s mentioned you
                        </h1>
                        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                          You were mentioned in a comment on ticket:
                        </p>

                        <!-- Ticket card -->
                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border:1px solid #e5e7eb;border-left:4px solid #4A87AC;border-radius:8px;">
                          <tr>
                            <td style="padding:16px 20px;">
                              <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">%s</p>
                            </td>
                          </tr>
                        </table>

                        <!-- CTA -->
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="border-radius:10px;background:#4A87AC;">
                              <a href="%s" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                                View comment →
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#9ca3af;">© %d Looply · You're receiving this because you were @mentioned.</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(mentionedBy, ticketTitle, fullUrl, java.time.Year.now().getValue());

        send(to, subject, html);
    }

    // ─── Ticket assigned notification ─────────────────────────────────────────

    @Async
    public void sendTicketAssignedEmail(String to, String assignedBy,
                                        String ticketTitle, String ticketUrl) {
        String subject = assignedBy + " assigned you a ticket: \"" + ticketTitle + "\"";
        String fullUrl = baseUrl + ticketUrl;
        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#1e3a5f 0%%,#4A87AC 100%%);padding:32px 40px;text-align:center;">
                        <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#ffffff;">Looply</p>
                        <p style="margin:0;font-size:13px;color:rgba(255,255,255,.65);">A ticket has been assigned to you</p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 40px 32px;">
                        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#D06028;text-transform:uppercase;letter-spacing:.5px;">New Assignment</p>
                        <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">
                          %s assigned you a ticket
                        </h1>
                        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                          You have a new ticket waiting for you:
                        </p>

                        <!-- Ticket card -->
                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border:1px solid #e5e7eb;border-left:4px solid #D06028;border-radius:8px;">
                          <tr>
                            <td style="padding:16px 20px;">
                              <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">%s</p>
                            </td>
                          </tr>
                        </table>

                        <!-- CTA -->
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="border-radius:10px;background:#4A87AC;">
                              <a href="%s" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                                View ticket →
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#9ca3af;">© %d Looply · You're receiving this because a ticket was assigned to you.</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(assignedBy, ticketTitle, fullUrl, java.time.Year.now().getValue());

        send(to, subject, html);
    }

    // ─── Email verification ───────────────────────────────────────────────────

    @Async
    public void sendVerificationEmail(String to, String username, String verificationUrl) {
        String subject = "Verify your Looply email address";
        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#1e3a5f 0%%,#4A87AC 100%%);padding:40px 40px 32px;text-align:center;">
                        <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Looply</p>
                        <p style="margin:0;font-size:13px;color:rgba(255,255,255,.65);">Project management, simplified</p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 40px 32px;">
                        <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">Verify your email, %s</h1>
                        <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4b5563;">
                          Thanks for signing up! Click the button below to verify your email address and activate your account.
                          This link expires in <strong>24 hours</strong>.
                        </p>

                        <!-- CTA -->
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="border-radius:10px;background:#4A87AC;">
                              <a href="%s" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                                Verify email address →
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
                          If you didn't create a Looply account, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#9ca3af;">© %d Looply · This link expires in 24 hours.</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(username, verificationUrl, java.time.Year.now().getValue());

        send(to, subject, html);
    }

    // ─── Internal send helper ─────────────────────────────────────────────────

    private void send(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email sent to {} — {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {} — {}: {}", to, subject, e.getMessage());
        }
    }
}
