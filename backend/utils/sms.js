const TEXTIT_USERNAME = process.env.TEXTIT_USERNAME;
const TEXTIT_PASSWORD = process.env.TEXTIT_PASSWORD;
const SENDER_ID       = process.env.TEXTIT_SENDER_ID || 'TextitDemo';

async function sendSMS(to, msg) {
  try {
    const normalized = to.startsWith('0') ? '94' + to.slice(1) : to;

    const params = new URLSearchParams({
      id:     TEXTIT_USERNAME,
      pw:     TEXTIT_PASSWORD,
      to:     normalized,
      text:   msg,
      sender: SENDER_ID,
    });

    const url = `https://textit.biz/sendmsg/?${params.toString()}`;
    console.log(`📤 TextIt calling...`);

    const res  = await fetch(url);
    const text = await res.text();
    console.log(`📨 TextIt response: ${text}`);

    if (text.startsWith('OK')) {
      console.log(`✅ SMS sent to ${normalized}`);
      return { success: true, response: text };
    } else {
      console.error(`❌ SMS failed to ${normalized}: ${text}`);
      return { success: false, response: text };
    }
  } catch (err) {
    console.error(`❌ SMS error:`, err.message);
    return { success: false, error: err.message };
  }
}

async function sendOtpSMS(phone, otp, shopName) {
  const msg = `${otp} is your RT Loyalty OTP for ${shopName}. Valid for 5 minutes. Do not share.`;
  return sendSMS(phone, msg);
}

async function sendWelcomeSMS(phone, name, shopName) {
  const msg = `Welcome to ${shopName} Loyalty Program, ${name}! Earn points on every purchase. Login at rtpos.lk`;
  return sendSMS(phone, msg);
}

async function sendPointsSMS(phone, name, points, balance, shopName) {
  const msg = `Hi ${name}, you earned ${points} points at ${shopName}! Balance: ${balance} pts. rtpos.lk`;
  return sendSMS(phone, msg);
}

async function sendRedemptionSMS(phone, name, rewardTitle, pointsUsed, balance) {
  const msg = `Hi ${name}, you redeemed "${rewardTitle}" for ${pointsUsed} pts. Remaining balance: ${balance} pts. rtpos.lk`;
  return sendSMS(phone, msg);
}

module.exports = { sendSMS, sendOtpSMS, sendWelcomeSMS, sendPointsSMS, sendRedemptionSMS };