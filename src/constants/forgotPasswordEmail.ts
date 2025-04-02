export function forgotPasswordHtml(username: string, link: string) {
  const styles = {
    container: `max-width: 600px; margin: 2rem auto; padding: 2rem; 
                border: 1px solid #e0e0e0; border-radius: 12px; 
                font-family: 'Segoe UI', system-ui, sans-serif; 
                background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.05);`,
    header: `text-align: center; color: #2c7a5b; 
             margin-bottom: 1.5rem; font-size: 1.8rem; 
             font-weight: 600; letter-spacing: -0.5px;`,
    text: `line-height: 1.6; font-size: 1.05rem; color: #424242; 
           margin: 1rem 0;`,
    buttonContainer: `text-align: center; margin: 2rem 0;`,
    button: `display: inline-block; background-color: #2c7a5b; 
             color: #ffffff !important; text-decoration: none; 
             padding: 0.8rem 2rem; border-radius: 8px; 
             font-weight: 500; transition: transform 0.1s ease;
             box-shadow: 0 2px 4px rgba(0,0,0,0.1);`,
    footer: `text-align: center; font-size: 0.9rem; color: #757575; 
             margin-top: 2rem; padding-top: 1.5rem; 
             border-top: 1px solid #eeeeee;`,
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forgot password</title>
</head>
<body style="margin: 0; padding: 1rem; background: #f5f5f5;">
  <div style="${styles.container}">
    <!-- Header Section -->
    <h2 style="${styles.header}">
      Hello, ${username}!
    </h2>

    <!-- Main Content -->
    <div style="padding: 0 1rem;">
      <p style="${styles.text}">
        You have requested a password update, please continue by clicking the button below:
      </p>

      <!-- Verification Button -->
      <div style="${styles.buttonContainer}">
        <a href="${link}" 
           style="${styles.button}"
           role="button"
           aria-label=Reset Password">
          Reset Password
        </a>
      </div>

      <!-- Secondary Text -->
      <p style="${styles.text}; font-size: 0.95rem;">
        If you didn't request for a password update, you can safely ignore this email. 
        Please note this verification link will expire in 10 minutes.
      </p>
    </div>

    <!-- Footer -->
    <div style="${styles.footer}">
      <p style="margin: 0;">
        &copy; ${new Date().getFullYear()} GGECL. All rights reserved.<br>
        <span style="font-size: 0.85em;">This is an automated message, please do not reply.</span>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
