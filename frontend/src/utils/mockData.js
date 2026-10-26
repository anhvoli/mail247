/**
 * Dữ liệu giả lập phong phú cho chế độ dùng thử / Test Offline
 */
export const SAMPLE_SERVICES = [
  {
    sender: 'security@facebookmail.com',
    senderName: 'Facebook Security',
    subject: '849201 là mã khôi phục tài khoản Facebook của bạn',
    otp: '849201',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1877f2; margin-top: 0;">Facebook</h2>
        <p>Xin chào bạn,</p>
        <p>Chúng tôi đã nhận được yêu cầu xác thực hoặc đăng nhập tài khoản. Mã xác thực của bạn là:</p>
        <div style="background: #f0f2f5; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1c1e21; border-radius: 6px; margin: 20px 0;">
          849201
        </div>
        <p style="color: #65676b; font-size: 13px;">Mã này có hiệu lực trong vòng 10 phút. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
      </div>
    `,
    text: 'Facebook Security: Mã xác thực của bạn là 849201. Có hiệu lực trong 10 phút.'
  },
  {
    sender: 'noreply@shopee.vn',
    senderName: 'Shopee Official',
    subject: '[Shopee] Mã xác thực OTP đăng ký tài khoản mới: 395128',
    otp: '395128',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #fed7aa; border-radius: 8px;">
        <h2 style="color: #ee4d2d; margin-top: 0;">Shopee</h2>
        <p>Chúc mừng bạn đến với Shopee!</p>
        <p>Để hoàn tất đăng ký tài khoản, vui lòng nhập mã xác thực một lần (OTP) dưới đây:</p>
        <div style="background: #fff7ed; border: 2px dashed #f97316; padding: 14px; text-align: center; font-size: 30px; font-weight: bold; letter-spacing: 5px; color: #c2410c; border-radius: 6px; margin: 20px 0;">
          395128
        </div>
        <p style="color: #78716c; font-size: 13px;">Không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản của bạn.</p>
      </div>
    `,
    text: 'Shopee: Ma xac thuc OTP cua ban la 395128. Khong chia se ma nay voi ai.'
  },
  {
    sender: 'no-reply@telegram.org',
    senderName: 'Telegram Messenger',
    subject: 'Login code: 71204',
    otp: '71204',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #bae6fd; border-radius: 8px;">
        <h2 style="color: #0284c7; margin-top: 0;">Telegram</h2>
        <p>Here is your Telegram login code:</p>
        <div style="background: #f0f9ff; padding: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0369a1; border-radius: 6px; margin: 20px 0;">
          71204
        </div>
        <p style="color: #64748b; font-size: 13px;">Do not give this code to anyone, even if they say they're from Telegram!</p>
      </div>
    `,
    text: 'Telegram login code: 71204. Do not give this code to anyone.'
  },
  {
    sender: 'support@github.com',
    senderName: 'GitHub',
    subject: '[GitHub] Please verify your device',
    otp: '958214',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">GitHub</h2>
        <p>A sign-in attempt requires further verification.</p>
        <p>Verification code:</p>
        <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #0f172a; border-radius: 6px; margin: 20px 0; border: 1px solid #cbd5e1;">
          958214
        </div>
        <p style="color: #64748b; font-size: 13px;">This code will expire in 10 minutes.</p>
      </div>
    `,
    text: 'GitHub verification code: 958214. Expiring in 10 minutes.'
  }
];
