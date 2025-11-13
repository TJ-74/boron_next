# Firebase Email Configuration Guide

This guide will help you set up beautiful password reset emails and prevent them from going to spam.

---

## 🎨 Part 1: Customize Your Password Reset Email Template

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `boron_next`
3. Navigate to **Authentication** → **Templates** (in the left sidebar)

### Step 2: Customize Email Template
1. Select **Password reset** from the template list
2. Click **Edit template** (pencil icon)

### Step 3: Email Template Design

**Recommended Email Subject:**
```
Reset Your Boron Password - Action Required
```

**Recommended Email Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #0f172a;
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            text-align: center;
            padding: 30px 0;
            background: linear-gradient(135deg, #9333ea 0%, #e879f9 50%, #06b6d4 100%);
            border-radius: 16px 16px 0 0;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: white;
            letter-spacing: 2px;
        }
        .content {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0 0 16px 16px;
            padding: 40px;
        }
        .greeting {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #ffffff;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            color: #cbd5e1;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(90deg, #9333ea 0%, #e879f9 50%, #06b6d4 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 10px 30px rgba(147, 51, 234, 0.5);
            transition: all 0.3s;
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(147, 51, 234, 0.6);
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .info-box {
            background: rgba(147, 51, 234, 0.1);
            border-left: 4px solid #9333ea;
            padding: 16px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: #64748b;
            font-size: 14px;
        }
        .security-note {
            background: rgba(6, 182, 212, 0.1);
            border: 1px solid rgba(6, 182, 212, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-top: 30px;
        }
        .security-title {
            color: #06b6d4;
            font-weight: bold;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">BORON</div>
        </div>
        <div class="content">
            <div class="greeting">Hi there! 👋</div>
            
            <div class="message">
                We received a request to reset your password for your Boron account. 
                Don't worry, we've got you covered!
            </div>

            <div class="info-box">
                <strong>🔐 Password Reset Request</strong><br>
                Click the button below to create a new password for your account.
            </div>

            <div class="button-container">
                <a href="%LINK%" class="button">Reset My Password</a>
            </div>

            <div class="message">
                This link will expire in <strong>1 hour</strong> for security reasons.
            </div>

            <div class="security-note">
                <div class="security-title">🛡️ Security Notice</div>
                <div style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
                    • If you didn't request this reset, please ignore this email<br>
                    • Never share your password with anyone<br>
                    • Boron will never ask for your password via email
                </div>
            </div>

            <div class="message" style="margin-top: 30px; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <span style="color: #9333ea; word-break: break-all;">%LINK%</span>
            </div>
        </div>

        <div class="footer">
            <div style="margin-bottom: 10px;">
                <strong>Boron</strong> - Professional Resume Builder
            </div>
            <div>
                Questions? Contact us at support@boron.com
            </div>
            <div style="margin-top: 10px;">
                © 2024 Boron. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>
```

**Important:** Keep `%LINK%` in the template - Firebase will automatically replace it with the actual reset link.

### Step 4: Configure Action URL (Use Your Custom Page)
1. In the same template editor, look for **Customize action URL**
2. Enter: `https://your-domain.com/reset-password` (replace with your actual domain)
3. For local testing, use: `http://localhost:3000/reset-password`
4. Click **Save**

**Note:** The action URL must be added to your Firebase authorized domains:
- Go to **Authentication** → **Settings** → **Authorized domains**
- Add your production domain (e.g., `boron.com`)
- `localhost` is already authorized by default

---

## 📧 Part 2: Prevent Emails from Going to Spam

### Issue: Firebase Default Email Configuration
Firebase sends emails from: `noreply@[YOUR-PROJECT-ID].firebaseapp.com`

This can trigger spam filters because:
- It's not your custom domain
- No SPF/DKIM records
- Generic "noreply" address

### Solution Options:

#### Option 1: SMTP Configuration (Recommended - Best Deliverability)
Use a custom SMTP service like SendGrid, AWS SES, or Mailgun:

1. **Choose an SMTP Provider:**
   - [SendGrid](https://sendgrid.com/) - Free tier: 100 emails/day
   - [AWS SES](https://aws.amazon.com/ses/) - Very affordable
   - [Mailgun](https://www.mailgun.com/) - Free tier: 5,000 emails/month
   - [Resend](https://resend.com/) - Modern, developer-friendly

2. **Set Up Custom Email with Firebase Cloud Functions:**

Create a Cloud Function to handle email sending:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net', // or your SMTP host
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});

exports.sendPasswordResetEmail = functions.https.onCall(async (data, context) => {
  const { email, resetLink } = data;

  const mailOptions = {
    from: 'Boron <noreply@boron.com>', // Your custom email
    to: email,
    subject: 'Reset Your Boron Password',
    html: `<!-- Your beautiful HTML template here -->`
  };

  await transporter.sendMail(mailOptions);
  return { success: true };
});
```

3. **Update your forgot-password page to use the Cloud Function:**

```typescript
// In src/app/forgot-password/page.tsx
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendPasswordResetEmail = httpsCallable(functions, 'sendPasswordResetEmail');

// In handleSubmit:
await sendPasswordResetEmail({ email, resetLink });
```

#### Option 2: Use Firebase Auth with Domain Verification (Simpler)

1. **Set up a custom domain for your app**
2. **Add your domain to Firebase:**
   - Go to **Authentication** → **Settings** → **Authorized domains**
   - Add your domain (e.g., `boron.com`)

3. **Configure SPF and DKIM records in your domain DNS:**

Add these DNS records to your domain:

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.firebaseapp.com ~all

Type: TXT  
Name: firebase1._domainkey
Value: [Get this from Firebase support]
```

4. **Sender Name Configuration:**
In Firebase Console:
- **Authentication** → **Templates** → **Customize sender**
- Change from `noreply@...` to `Boron <noreply@boron.com>`

#### Option 3: Quick Wins (Improve but not perfect)

These won't completely solve spam issues but will help:

1. **Improve Email Content:**
   - ✅ Use professional language
   - ✅ Include your company name prominently
   - ✅ Add a physical address in the footer
   - ✅ Include an unsubscribe link
   - ✅ Use proper HTML structure
   - ✅ Avoid spam trigger words ("free", "urgent", excessive caps)

2. **Sender Reputation:**
   - Start with smaller email volumes
   - Monitor bounce rates
   - Remove invalid email addresses promptly

3. **Ask Users to Whitelist:**
   - After signup, show a message: "To ensure you receive our emails, add noreply@boron.firebaseapp.com to your contacts"

4. **Test Email Deliverability:**
   - Use [Mail Tester](https://www.mail-tester.com/)
   - Send test emails to Gmail, Outlook, Yahoo
   - Check spam scores

---

## 🚀 Part 3: Your Custom Reset Page is Ready!

Your new custom password reset page at `/reset-password` includes:

✅ **Beautiful Modern UI** - Matches your login/register pages
✅ **Real-time Password Strength Indicator** - Visual feedback
✅ **Password Match Validation** - Ensures passwords match
✅ **Error Handling** - Expired links, invalid codes, etc.
✅ **Success State** - Clear confirmation and redirect
✅ **Mobile Responsive** - Works on all devices
✅ **Glassmorphism Design** - Consistent with your brand
✅ **Security Tips** - Educates users on password best practices

---

## 📝 Implementation Checklist

### Immediate Actions:
- [x] Custom reset password page created (`/reset-password`)
- [x] Reset password function added to AuthContext
- [ ] Update Firebase email template (use HTML above)
- [ ] Set custom action URL in Firebase Console
- [ ] Test the complete flow locally

### For Production (Choose One):
- [ ] **Option A:** Set up SMTP with SendGrid/AWS SES (Best deliverability)
- [ ] **Option B:** Configure custom domain with SPF/DKIM (Good deliverability)
- [ ] **Option C:** Use quick wins and monitor spam rates (Basic improvement)

### Testing:
1. Test password reset flow:
   ```bash
   1. Go to /forgot-password
   2. Enter email
   3. Check inbox (and spam folder)
   4. Click the link
   5. Should redirect to /reset-password with oobCode
   6. Enter new password
   7. Submit and verify redirect to /login
   8. Test login with new password
   ```

2. Test edge cases:
   - Invalid email
   - Expired reset link (wait 1+ hour)
   - Already used reset link
   - Weak passwords
   - Mismatched passwords

---

## 🔍 Troubleshooting

### Emails still going to spam?
1. Check your spam score: https://www.mail-tester.com/
2. Verify SPF/DKIM records are set up correctly
3. Consider using a dedicated SMTP service (Option 1)
4. Monitor email bounce rates in Firebase Console

### Reset link not working?
1. Verify action URL is set correctly in Firebase Console
2. Check that domain is authorized in Firebase
3. Ensure `oobCode` parameter is being passed in URL
4. Check browser console for errors

### Emails not sending at all?
1. Check Firebase Console → Authentication → Users (verify email is correct)
2. Check Firebase Console → Usage (ensure you haven't exceeded quotas)
3. Verify Firebase project is on Blaze plan (if using production features)
4. Check browser console and Firebase Functions logs

---

## 💡 Pro Tips

1. **Email Design Best Practices:**
   - Keep HTML under 102KB
   - Use inline CSS (not external stylesheets)
   - Test on multiple email clients (Gmail, Outlook, Apple Mail)
   - Include both HTML and plain text versions

2. **Security Best Practices:**
   - Reset links expire after 1 hour (Firebase default)
   - Links can only be used once
   - Always verify the oobCode on your backend
   - Log password reset attempts for security monitoring

3. **User Experience:**
   - Send confirmation email after successful password reset
   - Add a "Password Reset Successful" email
   - Consider adding 2FA for extra security
   - Show clear success/error messages

---

## 📞 Need Help?

- **Firebase Documentation:** https://firebase.google.com/docs/auth/custom-email-handler
- **SendGrid Setup:** https://sendgrid.com/docs/
- **DNS Configuration:** Contact your domain registrar's support

---

## 🎉 Next Steps

1. Update your Firebase email template (copy HTML above)
2. Test the complete flow
3. Choose and implement a spam prevention solution
4. Monitor email deliverability
5. Iterate and improve based on user feedback

Good luck! 🚀

