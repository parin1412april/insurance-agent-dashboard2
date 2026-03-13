const CDN = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663213925077/7md5ixsfuyx3z6YVy8PeuB';

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  url: string;
  likes: number;
  dislikes: number;
  userVote?: 'like' | 'dislike' | null;
}

export interface FAQEntry {
  id: string;
  date: string; // Format: "2026-03-04"
  dayOfWeek: string; // Thai day name
  question: string;
  answer: string;
  asker: string;
  responder: string;
  tags: string[];
  documents: Document[];
  category: string;
}

export interface CategoryGroup {
  category: string;
  color: string;
  icon: string;
}

// Category definitions
export const CATEGORIES: Record<string, CategoryGroup> = {
  'foreign-insurance': {
    category: 'ประกันชาวต่างชาติ',
    color: 'bg-blue-100 text-blue-800',
    icon: '🌍'
  },
  'memo-tracking': {
    category: 'การติดเมมโม่',
    color: 'bg-purple-100 text-purple-800',
    icon: '📋'
  },
  'etr-payment': {
    category: 'ETR และการชำระเงิน',
    color: 'bg-green-100 text-green-800',
    icon: '💳'
  },
  'documents': {
    category: 'เอกสารและการขอประวัติ',
    color: 'bg-orange-100 text-orange-800',
    icon: '📄'
  },
  'medical-cases': {
    category: 'เคสทางการแพทย์',
    color: 'bg-red-100 text-red-800',
    icon: '⚕️'
  },
  'system-procedures': {
    category: 'ขั้นตอนระบบ',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⚙️'
  },
  'general': {
    category: 'ทั่วไป',
    color: 'bg-gray-100 text-gray-800',
    icon: '📌'
  }
};

// FAQ Entries Data
export const FAQ_ENTRIES: FAQEntry[] = [
  {
    id: 'q1',
    date: '2026-03-04',
    dayOfWeek: 'วันพุธ',
    question: 'ประกันของชาวต่างชาติ — ภรรยาที่ถือวีซ่าติดตามสามีทำประกันได้หรือไม่?',
    answer: 'สามีชาวต่างชาติมี Work Permit และจดทะเบียนสมรส เป็นผู้ชำระเบี้ยให้ภรรยา ของสามีทำได้ปกติ แต่ของภรรยาทำไม่ได้ ล่าสุดถามว่าถ้าภรรยามีวีซ่าติดตามสามี ให้ลองยื่นดูก่อน\n\nสรุปหลักการ:\n- กรณีชาวต่างชาติ บริษัทพิจารณาเป็นรายๆ ขึ้นอยู่กับประเภทวีซ่าและสถานะการพำนัก\n- ภรรยาที่ถือวีซ่าติดตามสามี (Dependent Visa) สามารถลองยื่นได้ แต่ผลขึ้นอยู่กับการพิจารณา',
    asker: '666114_Suthee',
    responder: 'PP',
    tags: ['ชาวต่างชาติ', 'วีซ่า', 'DTV', 'ประกันชีวิต'],
    category: 'foreign-insurance',
    documents: [
      {
        id: 'doc-q1-1',
        name: 'S__29933609_0.jpg',
        type: 'image',
        url: `${CDN}/S__29933609_0_4beb0888.jpg`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q1-2',
        name: 'S__29933610_0.jpg',
        type: 'image',
        url: `${CDN}/S__29933610_0_6c06336a.jpg`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q1-3',
        name: 'S__29933611_0.jpg',
        type: 'image',
        url: `${CDN}/S__29933611_0_8ef597b3.jpg`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q1-4',
        name: 'S__217358582_0.jpg',
        type: 'image',
        url: `${CDN}/S__217358582_0_f7b1de87.jpg`,
        likes: 0,
        dislikes: 0
      }
    ]
  },
  {
    id: 'q2',
    date: '2026-03-05',
    dayOfWeek: 'วันพฤหัสบดี',
    question: 'การติดเมมโม่ — รอการพิจารณาประมาณกี่วัน?',
    answer: 'ขึ้นอยู่กับเอกสารที่ยื่นไปว่ามีประวัติการรักษาเยอะมั้ย ถ้ามีเอกสารประวัติเยอะมากอาจจะต้องให้เจ้าหน้าที่ใช้เวลาอ่านหน่อย แนะนำให้รอดูภายในสัปดาห์นี้ก่อน ถ้าเคสยังนิ่งให้ติดตามกับเจ้าหน้าที่ตามช่องทางที่แจ้ง\n\nช่องทางติดตามเคสเมมโม่:\n- กรอกลิงก์ติดตามเคส: https://forms.office.com/...\n- โทรสอบถามได้ทางเบอร์ที่บริษัทแจ้ง (อาจต้องรอสายหรือแจ้งให้โทรกลับ)',
    asker: '695832_Prempimon',
    responder: 'PP',
    tags: ['เมมโม่', 'รอการพิจารณา', 'ติดตามเคส'],
    category: 'memo-tracking',
    documents: [
      {
        id: 'doc-q2-1',
        name: 'S__217407515_0.jpg',
        type: 'image',
        url: `${CDN}/S__217407515_0_94a3af66.jpg`,
        likes: 0,
        dislikes: 0
      }
    ]
  },
  {
    id: 'q3',
    date: '2026-03-05',
    dayOfWeek: 'วันพฤหัสบดี',
    question: 'ETR เวอร์ชันใหม่ — QR/Barcode หายไปไหน?',
    answer: 'ETR สำหรับรับชำระเงินสดมีการเปลี่ยนแปลง (มีผล 5 มีนาคม 2569):\n- ❌ ยกเลิกการแสดง QR/Barcode ในเอกสาร ETR\n- ✅ เพิ่มปุ่ม "QR/Barcode นำส่งเงิน" สำหรับให้ตัวแทนสร้าง QR/Barcode เพื่อนำส่งเงินสด\n\nการปรับปรุงนี้ช่วยให้ขั้นตอนการรับเงินสด ชัดเจน ถูกต้อง และสะดวกมากขึ้น',
    asker: 'PP',
    responder: 'PP',
    tags: ['ETR', 'QR Code', 'เงินสด', 'ประชาสัมพันธ์'],
    category: 'etr-payment',
    documents: [
      {
        id: 'doc-q3-1',
        name: 'S__28123193_0.png',
        type: 'image',
        url: `${CDN}/S__28123193_0_3cffa788.png`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q3-2',
        name: 'การถอดQRCodeออกจากETRสำหรับรับชำระเงินสด.pdf',
        type: 'pdf',
        url: `${CDN}/qr_code_etr_cash_d59a7bec.pdf`,
        likes: 0,
        dislikes: 0
      }
    ]
  },
  {
    id: 'q4',
    date: '2026-03-06',
    dayOfWeek: 'วันศุกร์',
    question: 'จดหมาย CNTOF — ต้องทำจดหมายชี้แจงฝั่งตัวแทนเข้าไปด้วยหรือโทรสอบถามอย่างเดียว?',
    answer: 'สามารถกรอกลิงก์ติดตามเคสแล้วแจ้งเจ้าหน้าที่ว่าให้ติดต่อกลับมาคุยได้ว่าทำไมถึงออก Counter ดังกล่าว หรือตัวแทนสามารถไปจับบัตรคิวสอบถามกับเจ้าหน้าที่แผนกพิจารณาที่สำนักงานใหญ่ชั้น 2 ได้เหมือนกัน (หากกรอกลิงก์อาจต้องรอหลายวัน)',
    asker: '695832_Prempimon',
    responder: 'PP',
    tags: ['CNTOF', 'จดหมาย', 'Counter', 'ติดตามเคส'],
    category: 'memo-tracking',
    documents: []
  },
  {
    id: 'q5',
    date: '2026-03-06',
    dayOfWeek: 'วันศุกร์',
    question: 'การเปลี่ยนชื่อในกลุ่ม — ทำไมต้องมีรหัสตัวแทน?',
    answer: 'ฝากสมาชิกทุกคนแก้ไขชื่อในกลุ่มให้มีรูปแบบ: รหัสตัวแทน_ชื่อจริง เพื่อให้ง่ายต่อการ monitor ข้อมูลหลังบ้าน',
    asker: '623631_อัศวิน',
    responder: '623631_อัศวิน',
    tags: ['ชื่อกลุ่ม', 'รหัสตัวแทน', 'การจัดการ'],
    category: 'system-procedures',
    documents: []
  },
  {
    id: 'q6',
    date: '2026-03-09',
    dayOfWeek: 'วันจันทร์',
    question: 'ขอประวัติการรักษาจาก รพ. ต่างจังหวัด — ตัวแทนและลูกค้าอยู่ กทม. ต้องทำอย่างไร?',
    answer: 'กรอกแบบฟอร์ม หนังสือมอบอำนาจขอประวัติการรักษา พร้อมแนบสำเนาบัตรประชาชนลูกค้าเซ็นรับรองสำเนาถูกต้อง ส่งให้บริษัท\n\nต้องส่งเป็น ใบจริง เซ็นสดปากกาน้ำเงิน พร้อมบัตรประชาชนเซ็นสด ส่งได้ที่สำนักงานใหญ่ชั้น 1 ห้องตรงข้ามตู้ ATM\n\nแผนที่สำนักงานใหญ่ AIA: https://maps.app.goo.gl/CQwiPC39X8jCdwga6',
    asker: '718511_Fahsai',
    responder: 'PP, 623631_อัศวิน',
    tags: ['ประวัติการรักษา', 'โรงพยาบาล', 'เอกสาร', 'มอบอำนาจ'],
    category: 'documents',
    documents: [
      {
        id: 'doc-q6-1',
        name: 'หนังสือยินยอมขอประวัติการรักษา.pdf',
        type: 'pdf',
        url: `${CDN}/consent_medical_history_7a5f31b5.pdf`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q6-2',
        name: 'การขอประวัติการรักษาจากโรงพยาบาล.pdf',
        type: 'pdf',
        url: `${CDN}/request_medical_history_hospital_b6e57128.pdf`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q6-3',
        name: 'S__1335328_0.jpg',
        type: 'image',
        url: `${CDN}/S__1335328_0_9db8efa3.jpg`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q6-4',
        name: 'S__57327669_0.jpg',
        type: 'image',
        url: `${CDN}/S__57327669_0_7783091c.jpg`,
        likes: 0,
        dislikes: 0
      }
    ]
  },
  {
    id: 'q7',
    date: '2026-03-09',
    dayOfWeek: 'วันจันทร์',
    question: 'เคสลูกค้าเด็ก 4 เดือน มีประวัติสุขภาพ (G6PD + ไทรอยด์) — ควรส่งเอกสารก่อนหรือรอ Memo ออกก่อน?',
    answer: 'สามารถส่งเลยก็ได้ หรือจะรอ Memo ออกก่อนก็ได้ ทำได้ทั้ง 2 อย่าง แต่ถ้าจะส่งก่อนไม่มี Memo ให้ปริ้นใบที่มีเลขกรมธรรม์ปะหน้าไป และโน้ตเขียนเข้าไปว่า "ขอส่งประวัติการรักษา" พร้อมแนบหนังสือมอบอำนาจขอประวัติไว้ให้บริษัท\n\nเอกสารที่เตรียมสำหรับเคสเด็ก:\n- สำเนาบัตรประชาชนคุณแม่\n- สำเนาสูติบัตร\n- ใบขอความยินยอม\n- ประวัติการรักษา รพ. ลูกค้า\n\nหมายเหตุ: ไม่สามารถส่ง PDF ที่ลูกค้าเซ็นใน iPad แล้วปริ้นออกมา ต้องส่งตัวจริงเซ็นสดเท่านั้น',
    asker: '696780_ปรินทร์',
    responder: 'PP, 623631_อัศวิน',
    tags: ['เด็ก', 'G6PD', 'ไทรอยด์', 'สุขภาพ', 'เอกสาร'],
    category: 'medical-cases',
    documents: [
      {
        id: 'doc-q7-1',
        name: 'S__68214793_0.jpg',
        type: 'image',
        url: `${CDN}/S__68214793_0_fefa3d8f.jpg`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q7-2',
        name: 'S__68214794_0.jpg',
        type: 'image',
        url: `${CDN}/S__68214794_0_baa66ab4.jpg`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q7-3',
        name: 'S__68214795_0.jpg',
        type: 'image',
        url: `${CDN}/S__68214795_0_1c7e987b.jpg`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q7-4',
        name: 'S__217751647_0.jpg',
        type: 'image',
        url: `${CDN}/S__217751647_0_b3a36588.jpg`,
        likes: 0,
        dislikes: 0
      }
    ]
  },
  {
    id: 'q8',
    date: '2026-03-09',
    dayOfWeek: 'วันจันทร์',
    question: 'เคสลูกค้าเด็ก — เคยถูกปฏิเสธ ยื่นใหม่ก่อนครบ 6 เดือนได้หรือไม่?',
    answer: 'กรอกใบสมัครแถลงตามที่ตัวแทนกรอก และส่งเข้าระบบให้เรียบร้อย หลังจากเคสเข้าระบบแล้ว ให้เข้าระบบ iPOS+ ไปที่หัวข้อ "ระหว่างพิจารณา" แล้วเลือก "เขียนชี้แจงโดยตัวแทน" ในนั้นได้เลย\n\nตัวอย่างคำชี้แจงที่แนะนำ:\n"ข้าพเจ้าขอนำส่งประวัติสุขภาพเพิ่มเติมของลูกค้า โดยมีการอัพเดทประวัติสุขภาพตั้งแต่แรกเกิด จนถึงปัจจุบันตามเอกสารที่แนบมา ซึ่งลูกค้ามีสุขภาพแข็งแรง และติดตามการรักษาตามคำแนะนำของแพทย์สม่ำเสมอ ไม่มีโรคหรืออาการแทรกซ้อนใด ๆ มีการปรับลดยา และมีสุขภาพดีขึ้นมากๆ ดังนั้นข้าพเจ้าจึงมีความประสงค์ขอให้บริษัทช่วยดำเนินการพิจารณาอนุมัติการสมัครทำประกันให้กับลูกค้าเคสนี้ด้วย"',
    asker: '623631_อัศวิน',
    responder: 'PP',
    tags: ['เด็ก', 'ยื่นใหม่', 'iPOS+', 'ชี้แจง'],
    category: 'medical-cases',
    documents: [
      {
        id: 'doc-q8-1',
        name: 'S__217743409_0.jpg',
        type: 'image',
        url: `${CDN}/S__217743409_0_e59cfad8.jpg`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q8-2',
        name: 'S__28360710_0.jpg',
        type: 'image',
        url: `${CDN}/S__28360710_0_9c8dd50e.jpg`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q8-3',
        name: 'S__28360709_0.jpg',
        type: 'image',
        url: `${CDN}/S__28360709_0_2b992a97.jpg`,
        likes: 0,
        dislikes: 0
      }
    ]
  },
  {
    id: 'q9',
    date: '2026-03-09',
    dayOfWeek: 'วันจันทร์',
    question: 'เคสลูกค้า — Memo ขอประวัติ รพ. แต่ลูกค้าไม่มีประวัติภายใน 1 ปี จะขอเปลี่ยนเป็นตรวจกับแพทย์แต่งตั้งได้หรือไม่?',
    answer: 'ส่งประกันสุขภาพ บริษัทออก Memo ให้ขอประวัติสุขภาพไม่เกิน 1 ปี แต่ลูกค้าไม่มี เพราะตรวจล่าสุดปี 2566 ตัวแทนเขียนหนังสือชี้แจงขอเปลี่ยนเป็นตรวจสุขภาพกับแพทย์แต่งตั้งแทน\n\nแนะนำให้โทรหาโดยตรง และหลังโทร Memo เปลี่ยนเลย ลูกค้าสามารถนัดตรวจสุขภาพกับแพทย์แต่งตั้งได้',
    asker: '632787_จิรัฏฐ์',
    responder: 'PP',
    tags: ['Memo', 'ประวัติการรักษา', 'แพทย์แต่งตั้ง', 'ตรวจสุขภาพ'],
    category: 'medical-cases',
    documents: [
      {
        id: 'doc-q9-1',
        name: 'S__28360710_0.jpg',
        type: 'image',
        url: `${CDN}/S__28360710_0_9c8dd50e.jpg`,
        likes: 0,
        dislikes: 0
      },
      {
        id: 'doc-q9-2',
        name: 'S__28360709_0.jpg',
        type: 'image',
        url: `${CDN}/S__28360709_0_2b992a97.jpg`,
        likes: 0,
        dislikes: 0
      }
    ]
  },
  {
    id: 'q10',
    date: '2026-03-10',
    dayOfWeek: 'วันอังคาร',
    question: 'วิธีตรวจสอบว่าลูกค้าเซ็นยืนยันรับกรมธรรม์ที่ไหน?',
    answer: 'สามารถเข้าไปเช็คว่าลูกค้าเซ็นยืนยันรับกรมธรรม์ได้โดยดูในวิดีโอ YouTube ที่ลิงก์ด้านล่าง\n\nLink: https://youtu.be/OQGNyPLftAQ?si=AL1oWw2qDCfYITn8',
    asker: 'ณัฐกมล (712053)',
    responder: 'อัศวิน (623631)',
    tags: ['กรมธรรม์', 'ลายเซ็น', 'ยืนยัน'],
    category: 'documents',
    documents: []
  },
  {
    id: 'q11',
    date: '2026-03-10',
    dayOfWeek: 'วันอังคาร',
    question: 'ปลดข้อยกเว้น - ต้องรอนานเท่าไหร่? และมีเคสคล้ายกันได้รับการยกเลิกไหม?',
    answer: 'เกี่ยวกับการปลดข้อยกเว้น:\n\n• เรื่องปลดข้อยกเว้นอาจจะต้องถามฝ่ายพิจารณา (แต่ละเคสมีระยะเวลาในการยื่นปลดไม่เท่ากัน)\n• แนะนำว่าถามที่ฝ่ายพิจารณาก่อนจะได้คำตอบชัวร์\n• ส่วนใหญ่ลูกค้าเอาผลตรวจประจำปีมาลองยื่นดู\n• บางเคสได้ปลด บางเคสไม่ได้ปลด\n• แต่ละเคสใช้เวลาในการยื่นปลดไม่เท่ากัน (ขึ้นอยู่กับผลประวัติสุขภาพด้วย)\n• Case by case จริงๆ\n\nในกรณีนี้ ลูกค้าผ่าเนื้องอกในมดลูก และเป็น PCOS ได้ CTOF ยกเว้นเรื่องมดลูก ได้ติดต่อ Call Center แล้ว บอกรอติดต่อวันจันทร์',
    asker: 'Jidapa (659402)',
    responder: 'PP',
    tags: ['ปลดข้อยกเว้น', 'CTOF', 'มดลูก', 'PCOS', 'การพิจารณา'],
    category: 'medical-cases',
    documents: []
  }
];

// Helper function to get all unique tags
export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  FAQ_ENTRIES.forEach(entry => {
    entry.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

// Helper function to filter entries by search query
export function searchFAQEntries(query: string, entries: FAQEntry[]): FAQEntry[] {
  const lowerQuery = query.toLowerCase();
  return entries.filter(entry =>
    entry.question.toLowerCase().includes(lowerQuery) ||
    entry.answer.toLowerCase().includes(lowerQuery) ||
    entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    entry.asker.toLowerCase().includes(lowerQuery) ||
    entry.responder.toLowerCase().includes(lowerQuery)
  );
}

// Helper function to filter by tags
export function filterByTags(entries: FAQEntry[], selectedTags: string[]): FAQEntry[] {
  if (selectedTags.length === 0) return entries;
  return entries.filter(entry =>
    selectedTags.some(tag => entry.tags.includes(tag))
  );
}

// Helper function to filter by category
export function filterByCategory(entries: FAQEntry[], category: string): FAQEntry[] {
  if (category === 'all') return entries;
  return entries.filter(entry => entry.category === category);
}

// Format Thai date
export function formatThaiDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const monthIndex = parseInt(month) - 1;
  const buddhistYear = parseInt(year) + 543;
  return `${parseInt(day)} ${monthNames[monthIndex]} ${buddhistYear}`;
}
