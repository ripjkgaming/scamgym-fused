export type ScamChannelId = "text-sms" | "phone" | "email" | "social-media" | "websites";

export interface ScamChannel {
  id: ScamChannelId;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  hook: string;
  readTime: string;
  exampleTitle: string;
  exampleIntro: string;
  warningSigns: { title: string; body: string }[];
  safeSteps: { title: string; body: string }[];
  takeaway: string;
  practice: {
    title: string;
    intro: string;
    sender: string;
    opening: string;
    steps: {
      message: string;
      choices: { label: string; safe: boolean; feedback: string }[];
    }[];
  };
}

export const scamChannels: ScamChannel[] = [
  {
    id: "text-sms",
    number: "01",
    title: "Text or SMS scams",
    shortTitle: "Text or SMS",
    description:
      "Scam texts can look like messages from businesses, government or loved ones. Learn to pause and check before sharing details or paying.",
    hook: "A familiar sender name is not proof of who sent it.",
    readTime: "4 min guide",
    exampleTitle: "The small fee with a bigger catch",
    exampleIntro:
      "This fictional parcel text makes a small payment sound urgent.",
    warningSigns: [
      {
        title: "A familiar sender can be faked",
        body: "Scammers can copy a delivery service's name, and scam texts can appear beside genuine messages. A familiar name or message thread does not prove who sent it.",
      },
      {
        title: "A small fee can hide bigger risks",
        body: "The link could lead to a page that steals card details and personal information. You could lose more than the small fee shown.",
      },
      {
        title: "A deadline pressures you to hurry",
        body: "The threat of returning your parcel pushes you to act quickly. Check your original order or delivery app instead of following the text's link.",
      },
    ],
    safeSteps: [
      {
        title: "Pause before responding",
        body: "Do not use the payment link, share personal details or call a number in the text. Pause even if you expect a parcel, toll notice or bank alert.",
      },
      {
        title: "Check independently",
        body: "Open the delivery company's official app or tracking details from your original order. For bank or toll claims, use the official app or a website address you already know, not a sponsored search result.",
      },
      {
        title: "Get help and report",
        body: "If you paid or entered card details, contact your bank immediately using its official app or the number on your card. Keep evidence, report as junk or spam, then delete; you can also report to Scamwatch.",
      },
    ],
    takeaway: "Check an unexpected delivery fee through the official app or your original order, not the text's link.",
    practice: {
      title: "A parcel text arrives. What next?",
      intro: "Try three decisions about a parcel text. This practice sends no messages, opens no links and takes no payments.",
      sender: "Parcel service (fictional sender)",
      opening: "Your parcel is on hold. Pay a $2.80 redelivery fee at parcel-update.example/redelivery by 6 pm or it will be returned.",
      steps: [
        {
          message: "You are waiting for a parcel, and the sender name looks familiar. What is your first move?",
          choices: [
            {
              label: "Open the link to see if it looks official.",
              safe: false,
              feedback: "A copied delivery page can look convincing. Leave the link alone and check your original order or official delivery app.",
            },
            {
              label: "Leave the text and open my usual delivery app.",
              safe: true,
              feedback: "You are checking separately from the text. Expecting a parcel or recognising the sender name does not prove the message is genuine.",
            },
            {
              label: "Reply and ask them to confirm my address.",
              safe: false,
              feedback: "The same sender controls the reply and may already know your address. Do not confirm personal details here; check your original order or official app.",
            },
          ],
        },
        {
          message: "The app shows your parcel is on its way, with no fee listed. What will you do as the text's deadline approaches?",
          choices: [
            {
              label: "Pay the small fee in case the app is behind.",
              safe: false,
              feedback: "Entering card details could expose you to more charges, not just this fee. If you are still unsure, contact the delivery service through its official app.",
            },
            {
              label: "Ask the sender for a different payment link.",
              safe: false,
              feedback: "Another link from the same sender proves nothing. Use contact details from your original order or official app instead.",
            },
            {
              label: "Do not pay; use the official app's support if unsure.",
              safe: true,
              feedback: "You have given yourself time to check. Support reached through the official app can clarify a genuine delivery issue without using the text.",
            },
          ],
        },
        {
          message: "You have not opened the link or shared details. How would you finish handling this text?",
          choices: [
            {
              label: "Report as junk or spam, then delete without replying.",
              safe: true,
              feedback: "Reporting and deleting avoids further contact; Scamwatch also accepts reports. If you paid or entered card details, contact your bank immediately rather than waiting for a report response.",
            },
            {
              label: "Forward to family and ask them to try the link.",
              safe: false,
              feedback: "A second opinion can help without spreading the risky link. Share a description or screenshot with personal details hidden, and warn others not to open the address.",
            },
            {
              label: "Reply STOP so the sender leaves me alone.",
              safe: false,
              feedback: "STOP can suit genuine subscriptions, but replying here may confirm your number is active. Report and delete this suspicious text instead.",
            },
          ],
        },
      ],
    },
  },
  {
    id: "phone",
    number: "02",
    title: "Phone scams",
    shortTitle: "Phone",
    description:
      "Scam callers may pretend to be your bank or a government agency. Learn to end the call and check their story safely.",
    hook: "You do not owe an unexpected caller an immediate answer.",
    readTime: "4 min guide",
    exampleTitle: "The caller who wants to keep you on the line",
    exampleIntro:
      "This fictional bank caller pressures you to move your savings.",
    warningSigns: [
      {
        title: "Caller details can be faked",
        body: "The displayed name or Australian phone number can be faked. Knowing your name or account details, or sounding professional, does not prove a caller's identity.",
      },
      {
        title: "They ask for a 'safe account' transfer",
        body: "Your bank will not ask you to move money to another account to protect it from fraud. Requests for passwords, one-time codes or remote control of your device are warning signs on unexpected calls.",
      },
      {
        title: "They stop you checking separately",
        body: "Being told to stay on the line or avoid your branch stops you checking independently. A transfer to another 'department' still keeps you in the caller's conversation.",
      },
    ],
    safeSteps: [
      {
        title: "Hang up",
        body: "Say, 'I will contact the bank myself,' then hang up; you do not need permission. Do not share codes, install software or move money for an unexpected caller.",
      },
      {
        title: "Contact your bank separately",
        body: "Make sure the call has ended; use another device if unsure. Call the number on your bank card or use support in the official app, not a number or call transfer offered by the caller.",
      },
      {
        title: "Get help immediately",
        body: "If you shared details or money, contact your bank immediately to secure accounts and ask about stopping or recovering payments. If you allowed remote access, disconnect that device from the internet and contact the bank from another trusted device; also report to Scamwatch.",
      },
    ],
    takeaway: "Hang up and contact your bank independently instead of moving money to a caller's 'safe account'.",
    practice: {
      title: "Take back control of the call",
      intro: "Try three decisions about a fake bank call. This is written practice, not the voice simulator; no audio is played or recorded.",
      sender: "Bank security (fictional caller)",
      opening: "This is bank security. We have found an unusual payment. Stay on the line and move your savings to a safe holding account so we can protect them.",
      steps: [
        {
          message: "The caller sounds professional and already knows your name. How would you respond?",
          choices: [
            {
              label: "Follow their instructions if they give a staff ID.",
              safe: false,
              feedback: "Asking for proof makes sense, but a caller can invent a staff ID. Hang up and check with your bank through its official app or the number on your card.",
            },
            {
              label: "Send a small amount to test the 'safe account'.",
              safe: false,
              feedback: "A small transfer does not prove the account is safe. Your bank will not ask you to move savings to a new account to protect them from fraud.",
            },
            {
              label: "Say I will call the bank myself, then hang up.",
              safe: true,
              feedback: "You can hang up even if the caller claims an emergency. This gives you time to contact the real bank separately.",
            },
          ],
        },
        {
          message: "The call has ended, but you still want to check your account. How would you contact the bank?",
          choices: [
            {
              label: "Use the number on my bank card or support in its official app.",
              safe: true,
              feedback: "That is a separate, trusted route to your bank. Explain the call and ask the bank to check your account before taking action.",
            },
            {
              label: "Call back using the recent-calls list.",
              safe: false,
              feedback: "Caller ID can be faked, so your recent-calls list is not a reliable check. Use the number on your bank card or the official app.",
            },
            {
              label: "Use the fraud-team number the caller gave me.",
              safe: false,
              feedback: "That number came from the person you are trying to check. Use a trusted source instead, such as your bank card.",
            },
          ],
        },
        {
          message: "The real bank confirms the call was fake. If you had shared a one-time banking code, what would you do now?",
          choices: [
            {
              label: "Wait for a payment to appear before mentioning the code.",
              safe: false,
              feedback: "A code may allow account access or a payment. Tell the real bank immediately, even if your balance looks normal.",
            },
            {
              label: "Tell the bank immediately and ask it to secure my account.",
              safe: true,
              feedback: "Explain what you shared and follow the bank's security advice. Report to Scamwatch too, but do not delay contacting your bank.",
            },
            {
              label: "Just block the caller and let the code expire.",
              safe: false,
              feedback: "Blocking cannot undo a code already used. Tell your bank immediately so it can check access and payments and help secure your account.",
            },
          ],
        },
      ],
    },
  },
  {
    id: "email",
    number: "03",
    title: "Email scams",
    shortTitle: "Email",
    description:
      "Scam emails can appear in familiar conversations. Learn to check unexpected links, attachments and payment changes before trusting them.",
    hook: "A real-looking invoice can still send money to the wrong account.",
    readTime: "4 min guide",
    exampleTitle: "Same booking. Different bank details.",
    exampleIntro:
      "This fictional booking email asks you to pay a different bank account.",
    warningSigns: [
      {
        title: "Familiar emails can still be unsafe",
        body: "Names and logos can be copied, and genuine email accounts can be taken over. Even the correct email address or an old conversation does not prove a payment change is genuine.",
      },
      {
        title: "Changed bank details need checking",
        body: "Scammers can replace invoices or add bank details to genuine-looking conversations. Matching booking details or an attached invoice do not prove the new account belongs to the business.",
      },
      {
        title: "They rush you and limit contact",
        body: "A same-day deadline and 'reply here only' discourage checking another way. Your reply could reach the scammer, not the real business.",
      },
    ],
    safeSteps: [
      {
        title: "Pause before opening or paying",
        body: "Do not open unexpected attachments or sign in through email links to investigate. For account alerts, open the official app or a known website yourself; good spelling and a polished signature are not proof.",
      },
      {
        title: "Call a trusted number",
        body: "Call using your original booking, a previously verified invoice or other trusted records, not a new number in the email. Ask someone authorised by the business to confirm the bank details.",
      },
      {
        title: "Protect accounts and report",
        body: "If you paid, contact your bank immediately; transfer recovery is not guaranteed. For exposed passwords, change them through the real service, replace reused passwords and enable multi-factor authentication (an extra sign-in check); at work, tell your IT or security team.",
      },
    ],
    takeaway: "Check changed bank details using a trusted phone number, not a reply to the email.",
    practice: {
      title: "Check an invoice before you pay",
      intro: "Try three decisions about changed payment details. This practice sends no emails and has no attachment to open.",
      sender: "Accounts team (fictional email)",
      opening: "Subject: Action required: updated bank details. Please use the new account in Invoice-update.pdf for your booking. Payment is due today. Reply to this email only if you have questions.",
      steps: [
        {
          message: "The booking sounds right, but the bank details have changed. What would you do before paying?",
          choices: [
            {
              label: "Reply to ask if the new bank details are genuine.",
              safe: false,
              feedback: "Checking is the right idea, but the same email account could be controlled by a scammer. Call using your original booking or another trusted record.",
            },
            {
              label: "Pause and call using the number in my original booking.",
              safe: true,
              feedback: "You are checking through a separate, trusted route. Ask someone authorised by the business to confirm whether its bank details changed.",
            },
            {
              label: "Pay because the logo and booking details match.",
              safe: false,
              feedback: "Logos and booking details can be copied or stolen from an email account. The new bank details still need an independent check.",
            },
          ],
        },
        {
          message: "You cannot reach the business, and another email threatens to cancel your booking unless you pay now. What next?",
          choices: [
            {
              label: "Open the attachment and call its new number to check.",
              safe: false,
              feedback: "That number comes from the same unverified source. Keep the attachment closed and use contact details you already trust.",
            },
            {
              label: "Pay a small deposit to hold the booking while I check.",
              safe: false,
              feedback: "A small payment does not verify who receives it. Keep payment on hold and explain the delay when you reach the real business.",
            },
            {
              label: "Wait until I can confirm the details through a trusted contact.",
              safe: true,
              feedback: "You are giving yourself time to check. Another urgent email in the same conversation is not independent confirmation.",
            },
          ],
        },
        {
          message: "The real business confirms its bank details never changed, and you have not paid. What would you do next?",
          choices: [
            {
              label: "Alert my trusted business contact and report the email as phishing.",
              safe: true,
              feedback: "This helps the business investigate and your email provider flag the scam; at work, tell IT or security too. If you had paid, contact your bank immediately before reporting.",
            },
            {
              label: "Reply to tell the sender I know it is a scam.",
              safe: false,
              feedback: "Replying may invite more contact and will not secure a hacked email account. Alert the real business through your trusted contact instead.",
            },
            {
              label: "Forward the attachment so others can inspect it.",
              safe: false,
              feedback: "Do not circulate suspicious attachments, as this can spread the risk. Share a description or screenshot with personal details hidden, and follow workplace reporting steps where relevant.",
            },
          ],
        },
      ],
    },
  },
  {
    id: "social-media",
    number: "04",
    title: "Social media scams",
    shortTitle: "Social media",
    description:
      "Scammers use familiar profiles and friendly messages to gain trust. Learn to check who is contacting you before sharing details or money.",
    hook: "A familiar profile does not prove your friend sent the message.",
    readTime: "4 min guide",
    exampleTitle: "A friend's profile. Someone else's pitch.",
    exampleIntro:
      "This fictional message uses a friend's profile to promote a risky investment.",
    warningSigns: [
      {
        title: "Familiar profiles can be taken over",
        body: "Scammers can copy profiles or take over real accounts. A friend's photo, shared friends and old messages do not prove your friend is writing now.",
      },
      {
        title: "Fast, guaranteed profits signal risk",
        body: "Promises of high returns with little or no risk are a warning sign. Profit screenshots, glowing comments and even small early payouts can be staged to encourage bigger payments.",
      },
      {
        title: "They ask for secrecy or another app",
        body: "'Today only' and 'keep it between us' discourage independent checks. Moving to a private adviser on another app may put you outside the original platform's reporting tools and any applicable buyer protections.",
      },
    ],
    safeSteps: [
      {
        title: "Check outside the chat",
        body: "Call your friend on a number you already have, or ask in person. Photos, voice notes and personal details from the same account are not reliable proof; they can be stolen or faked, including with AI audio.",
      },
      {
        title: "Protect money and details",
        body: "Do not send money, login codes or identity documents to unverified contacts. For investments, independently check the provider and authorisation in ASIC's registers and seek licensed advice; a copied licence number does not prove the contact represents that provider.",
      },
      {
        title: "Get help and report",
        body: "If you sent money, contact your bank immediately. IDCARE can help if you shared identity documents. Keep screenshots, report and block the account, and alert your friend through a separate trusted contact.",
      },
    ],
    takeaway: "Check with your friend outside the chat rather than trusting a familiar profile or profit screenshots.",
    practice: {
      title: "When a familiar profile asks for trust",
      intro: "Try three decisions about an investment tip from a familiar profile. Messages are scripted; no social account or messaging app is connected.",
      sender: "Alex (fictional familiar profile)",
      opening: "Hey! My investment group doubled my balance in a week. The returns are guaranteed. There is one spot left today. Keep it between us and message my adviser on another app.",
      steps: [
        {
          message: "The profile has your friend's photo and old chat history. What would you do first?",
          choices: [
            {
              label: "Call my friend on their usual number, outside this chat.",
              safe: true,
              feedback: "You are checking independently instead of trusting the same account. Real profiles can be taken over, even when old messages are still there.",
            },
            {
              label: "Ask for a screenshot of the profits.",
              safe: false,
              feedback: "Profit screenshots can be faked and do not prove who is messaging. Check with your friend using a number you already have.",
            },
            {
              label: "Message the adviser on another app to reserve a place.",
              safe: false,
              feedback: "The adviser comes from the same unverified account, and changing apps may remove access to the original platform's reporting tools. Check with your friend separately first.",
            },
          ],
        },
        {
          message: "Your friend answers your call and says they did not send the message. What would you do next?",
          choices: [
            {
              label: "Invest a little and withdraw it to test the offer.",
              safe: false,
              feedback: "Some scams allow small early withdrawals to build trust before asking for more. Do not invest through this impersonated account, even if a test payment works.",
            },
            {
              label: "Save screenshots, report and block the account, and tell my friend.",
              safe: true,
              feedback: "You have stopped contact and kept useful evidence. Your friend can use the platform's official account-recovery process if needed.",
            },
            {
              label: "Ask the account for a voice note to prove its identity.",
              safe: false,
              feedback: "Your friend has already confirmed the message was not theirs. A voice note could use stolen or AI-generated audio, so do not keep engaging.",
            },
          ],
        },
        {
          message: "Now imagine you had already transferred money before checking. What would you do immediately?",
          choices: [
            {
              label: "Pay an online expert who guarantees to recover my money.",
              safe: false,
              feedback: "Guaranteed recovery for an upfront fee can be another scam. Do not send more money; contact your bank immediately through its official app or the number on your card.",
            },
            {
              label: "Just report the profile and wait for a platform refund.",
              safe: false,
              feedback: "Reporting a profile does not automatically reverse a bank transfer. Contact your bank immediately to ask about stopping or recovering the payment, then report the scam.",
            },
            {
              label: "Contact my bank immediately, stop sending money and keep evidence.",
              safe: true,
              feedback: "Quick action gives your bank the best chance to help, but recovery is not guaranteed. Keep messages and payment records, report to Scamwatch and ReportCyber for cybercrime, and avoid guaranteed recovery offers for a fee.",
            },
          ],
        },
      ],
    },
  },
  {
    id: "websites",
    number: "05",
    title: "Website scams",
    shortTitle: "Websites",
    description:
      "A polished shop or tempting deal can hide a scam. Learn to check the seller and payment options before buying.",
    hook: "A secure connection does not mean an honest seller.",
    readTime: "4 min guide",
    exampleTitle: "The bargain that skips a safer checkout",
    exampleIntro:
      "This fictional headphone shop offers a bargain but demands a quick bank transfer.",
    warningSigns: [
      {
        title: "Local business details can be copied",
        body: "An 'Australian warehouse' claim, address or Australian Business Number (ABN) can be copied. Even a valid ABN does not prove the shop belongs to that business; check its identity and contacts independently.",
      },
      {
        title: "Big discounts come with time pressure",
        body: "An unusually low price and 'today only' deadline deserve a closer look. The shop's own reviews, photos and trust badges can be copied or invented; they are not independent evidence.",
      },
      {
        title: "The shop only accepts bank transfers",
        body: "Transfers can be hard to recover and may lack dispute protections offered by some cards or payment services. A padlock or HTTPS means an encrypted connection, not an honest seller.",
      },
    ],
    safeSteps: [
      {
        title: "Pause the purchase",
        body: "Ignore countdown pressure and compare prices with established sellers. While unsure about the shop, do not sign in, download anything or enter payment details.",
      },
      {
        title: "Check outside the website",
        body: "Check the shop's history and contact details across independent sources. Use ABN Lookup to compare business details, but remember valid numbers can be copied; neither a search ad nor a padlock is an endorsement.",
      },
      {
        title: "Choose safer payment options",
        body: "Avoid unverified or transfer-only shops. For sellers you have checked, consider card or payment-service dispute protections; read conditions, as refunds are not guaranteed. If you paid a suspected scammer, contact your bank or payment provider immediately and keep records.",
      },
    ],
    takeaway: "Leave the bargain behind if you cannot verify the seller or understand the payment protections.",
    practice: {
      title: "Would you trust this checkout?",
      intro: "Try three shopping decisions about a fictional store. Messages are scripted; no seller, checkout or payment is connected.",
      sender: "Weekend Audio (fictional storefront)",
      opening: "Today only: wireless headphones reduced from $249 to $49. Australian warehouse. Bank transfer only. Pay within 15 minutes to hold this price.",
      steps: [
        {
          message: "The shop looks polished and shows a padlock in the browser preview. What would you check before buying?",
          choices: [
            {
              label: "Trust the padlock as proof the shop has been checked.",
              safe: false,
              feedback: "A padlock means the connection is encrypted; scam sites can have one too. Check the seller independently before sharing details.",
            },
            {
              label: "Compare prices and check the business outside its website.",
              safe: true,
              feedback: "You are looking beyond the seller's claims. Independent history, consistent business details and realistic prices help you judge risk, but no single check guarantees safety.",
            },
            {
              label: "Read only the shop's five-star product reviews.",
              safe: false,
              feedback: "The shop controls the reviews on its own pages. Look across independent sources and check business details rather than relying on its testimonials.",
            },
          ],
        },
        {
          message: "You cannot confirm the shop's history, and checkout demands a bank transfer within 15 minutes. What would you do?",
          choices: [
            {
              label: "Leave and look for a seller I can check independently.",
              safe: true,
              feedback: "You do not need proof of a scam to walk away. An unverified seller, time pressure and transfer-only payment are good reasons not to buy.",
            },
            {
              label: "Pay by transfer because it lists an Australian warehouse.",
              safe: false,
              feedback: "A local warehouse claim can be copied and does not protect your payment. Do not transfer money to an unverified seller to keep a discount.",
            },
            {
              label: "Ask for a card-payment link and pay without further checks.",
              safe: false,
              feedback: "Some card payments offer dispute options, but neither seller safety nor refunds are guaranteed. Check the seller first; another link could steal your card details.",
            },
          ],
        },
        {
          message: "Now imagine you had paid by bank transfer and then suspected a scam. What would you do?",
          choices: [
            {
              label: "Wait until the seller's countdown ends.",
              safe: false,
              feedback: "Waiting can reduce the chance of stopping a payment. Contact your bank immediately through its official app or the number on your card.",
            },
            {
              label: "Contact my bank immediately and keep order and payment records.",
              safe: true,
              feedback: "Ask your bank whether the transfer can be stopped or recovered, but recovery is not guaranteed. Keep receipts, screenshots and messages, report to Scamwatch, and do not pay a 'refund release' fee.",
            },
            {
              label: "Pay a fee if the shop says it will release my refund.",
              safe: false,
              feedback: "A fee to release a refund can be another part of the scam. Stop sending money and contact your bank independently, not through the seller.",
            },
          ],
        },
      ],
    },
  },
];

export function getScamChannel(id: string): ScamChannel | undefined {
  return scamChannels.find((channel) => channel.id === id);
}
