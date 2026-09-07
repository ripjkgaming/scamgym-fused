import type { ScenarioConfig, ScenarioId } from "@/lib/types";

export const SCENARIOS: Record<ScenarioId, ScenarioConfig> = {
  bank_fraud: {
    id: "bank_fraud",
    icon: "bank",
    title: { en: "Fake bank call", zh: "假冒银行来电", ms: "Panggilan bank palsu", ta: "போலி வங்கி அழைப்பு" },
    description: {
      en: "A caller claims there is a suspicious charge.",
      zh: "来电者声称您的账户有可疑交易。",
      ms: "Pemanggil mendakwa ada transaksi mencurigakan.",
      ta: "சந்தேகத்திற்குரிய பரிவர்த்தனை உள்ளதாக அழைப்பவர் கூறுகிறார்.",
    },
    callerLabel: { en: "Bank security", zh: "银行保安部", ms: "Keselamatan bank", ta: "வங்கி பாதுகாப்பு" },
    premise: {
      en: "You are a fake bank security officer claiming there is an unfamiliar card payment.",
      zh: "你是假冒银行保安人员，声称客户的银行卡出现陌生交易。",
      ms: "Anda pegawai keselamatan bank palsu yang mendakwa terdapat bayaran kad yang tidak dikenali.",
      ta: "அறியாத அட்டை பணப்பரிவர்த்தனை இருப்பதாக கூறும் போலி வங்கி பாதுகாப்பு அதிகாரி நீங்கள்.",
    },
    stages: [
      { id: "alert", tactic: "fear", instruction: "Claim a suspicious card payment was detected." },
      { id: "verify", tactic: "authority", instruction: "Claim you must verify the account, without requesting actual private data." },
      { id: "urgent", tactic: "urgency", instruction: "Say the account may be frozen unless they act now." },
      { id: "secrecy", tactic: "secrecy", instruction: "Discourage them from calling the number on their bank card." },
      { id: "transfer", tactic: "payment", instruction: "Suggest a fictional safe-account transfer, without collecting details." },
      { id: "final", tactic: "fear", instruction: "Apply one final mild pressure, then finish the simulation." },
    ],
    redFlags: {
      en: ["Unexpected call", "Pressure to act immediately", "Request to move money", "Discouraging independent verification"],
      zh: ["意外来电", "催促立即行动", "要求转账", "阻止您自行核实"],
      ms: ["Panggilan tidak dijangka", "Desakan untuk bertindak segera", "Permintaan memindahkan wang", "Menghalang semakan sendiri"],
      ta: ["எதிர்பாராத அழைப்பு", "உடனடியாக செயல்பட அழுத்தம்", "பணம் மாற்றக் கோருதல்", "தனியாக சரிபார்ப்பதைத் தடுத்தல்"],
    },
  },
  government_impersonation: {
    id: "government_impersonation",
    icon: "government",
    title: { en: "Fake government call", zh: "假冒政府来电", ms: "Panggilan kerajaan palsu", ta: "போலி அரசு அழைப்பு" },
    description: {
      en: "A caller says you are linked to an investigation.",
      zh: "来电者声称您涉及一项调查。",
      ms: "Pemanggil berkata anda dikaitkan dengan siasatan.",
      ta: "நீங்கள் விசாரணையுடன் தொடர்புடையவர் என அழைப்பவர் கூறுகிறார்.",
    },
    callerLabel: { en: "Investigation office", zh: "调查部门", ms: "Pejabat siasatan", ta: "விசாரணை அலுவலகம்" },
    premise: {
      en: "You impersonate a fictional investigation officer and claim the user is linked to a case.",
      zh: "你冒充虚构的调查人员，声称用户涉及一宗案件。",
      ms: "Anda menyamar sebagai pegawai siasatan rekaan dan mendakwa pengguna dikaitkan dengan satu kes.",
      ta: "நீங்கள் கற்பனையான விசாரணை அதிகாரியாக நடித்து, பயனர் ஒரு வழக்குடன் தொடர்புடையவர் என்று கூறுகிறீர்கள்.",
    },
    stages: [
      { id: "case", tactic: "authority", instruction: "Claim their identity appeared in a fictional investigation." },
      { id: "fear", tactic: "fear", instruction: "Mention possible consequences without making threats." },
      { id: "secret", tactic: "secrecy", instruction: "Say the case must remain confidential." },
      { id: "transfer", tactic: "authority", instruction: "Offer to transfer them to a fictional senior officer." },
      { id: "urgent", tactic: "urgency", instruction: "Insist the interview must happen now." },
      { id: "final", tactic: "fear", instruction: "Apply one final mild pressure, then finish the simulation." },
    ],
    redFlags: {
      en: ["Unsolicited investigation claim", "Demand for secrecy", "Threatening consequences", "Refusal to let you verify"],
      zh: ["突如其来的调查指控", "要求保密", "威胁后果", "不允许您自行核实"],
      ms: ["Dakwaan siasatan tanpa diminta", "Tuntutan merahsiakan perkara", "Ancaman akibat", "Tidak membenarkan semakan"],
      ta: ["எதிர்பாராத விசாரணை குற்றச்சாட்டு", "ரகசியமாக வைக்கக் கோருதல்", "விளைவுகள் குறித்து மிரட்டல்", "சரிபார்க்க அனுமதிக்காமை"],
    },
  },
  parcel_delivery: {
    id: "parcel_delivery",
    icon: "parcel",
    title: { en: "Fake parcel call", zh: "假冒包裹来电", ms: "Panggilan bungkusan palsu", ta: "போலி பார்சல் அழைப்பு" },
    description: {
      en: "A caller says your delivery needs a small fee.",
      zh: "来电者称您的包裹需要支付一笔小额费用。",
      ms: "Pemanggil berkata penghantaran anda memerlukan bayaran kecil.",
      ta: "உங்கள் விநியோகத்திற்கு சிறிய கட்டணம் தேவை என அழைப்பவர் கூறுகிறார்.",
    },
    callerLabel: { en: "Parcel support", zh: "包裹客服", ms: "Sokongan bungkusan", ta: "பார்சல் உதவி" },
    premise: {
      en: "You are a fake delivery representative claiming a parcel cannot be delivered.",
      zh: "你是假冒快递客服，声称一个包裹无法送达。",
      ms: "Anda wakil penghantaran palsu yang mendakwa bungkusan tidak dapat dihantar.",
      ta: "ஒரு பார்சலை வழங்க முடியவில்லை என கூறும் போலி விநியோக பிரதிநிதி நீங்கள்.",
    },
    stages: [
      { id: "delivery", tactic: "urgency", instruction: "Claim an unnamed parcel could not be delivered." },
      { id: "fee", tactic: "payment", instruction: "Ask for a fictional small redelivery fee, never real payment data." },
      { id: "link", tactic: "link", instruction: "Mention a fictional link but never provide a URL." },
      { id: "expiry", tactic: "urgency", instruction: "Say the parcel may be returned soon." },
      { id: "pressure", tactic: "fear", instruction: "Say they may lose the parcel, without threatening them." },
      { id: "final", tactic: "payment", instruction: "Apply one final mild pressure, then finish the simulation." },
    ],
    redFlags: {
      en: ["Unnamed parcel", "Unexpected fee", "Request to open a link", "Artificial deadline"],
      zh: ["未说明的包裹", "意外费用", "要求打开链接", "人为制造的期限"],
      ms: ["Bungkusan tanpa nama", "Bayaran tidak dijangka", "Permintaan membuka pautan", "Tarikh akhir palsu"],
      ta: ["பெயரிடப்படாத பார்சல்", "எதிர்பாராத கட்டணம்", "இணைப்பைத் திறக்கக் கோருதல்", "செயற்கையான காலக்கெடு"],
    },
  },
};

export const scenarioList = Object.values(SCENARIOS);
