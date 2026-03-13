import { z } from "zod";

export const beneficiarySchema = z.object({
  gender: z.enum(["male", "female"]),
  birthDate: z.string().min(1, "กรุณากรอกวันเกิด"),
  age: z.number().min(0).max(150),
  prefix: z.string().min(1, "กรุณากรอกคำนำหน้า"),
  firstName: z.string().min(1, "กรุณากรอกชื่อ"),
  lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
  percentage: z.number().min(0.01).max(100),
  relationship: z.string().min(1, "กรุณากรอกความสัมพันธ์"),
});

export const insuranceFormSchema = z.object({
  // Agent code (injected from URL param, optional)
  agentCode: z.string().optional(),
  // Personal info
  prefix: z.string().min(1, "กรุณาเลือกคำนำหน้า"),
  firstName: z.string().min(1, "กรุณากรอกชื่อ"),
  lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
  nickname: z.string().min(1, "กรุณากรอกชื่อเล่น").optional(),
  phone: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง").max(15),
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  occupation: z.string().min(1, "กรุณากรอกอาชีพ"),
  position: z.string().min(1, "กรุณากรอกตำแหน่ง"),
  height: z.number().min(50, "กรุณากรอกส่วนสูง").max(300),
  weight: z.number().min(20, "กรุณากรอกน้ำหนัก").max(500),
  annualIncome: z.number().min(0, "กรุณากรอกรายได้ต่อปี"),

  // ID Card
  idCardStatus: z.enum(["sent", "not_sent"]),
  idCardImageUrl: z.string().optional(),

  // Marital status
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]),
  spouseGender: z.enum(["male", "female"]).optional(),
  spouseFirstName: z.string().optional(),
  spouseLastName: z.string().optional(),
  spouseBirthDate: z.string().optional(),

  // Address (structured)
  useIdCardAddress: z.boolean(),
  addressLine: z.string().optional(),
  subDistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),

  // Benefit payment
  benefitPaymentMethod: z.enum(["bank_account", "promptpay"]),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),

  // Policy delivery
  policyDelivery: z.enum(["e_document", "paper_customer", "paper_agent"]),

  // Payment method
  paymentMethod: z.enum(["qr_transfer", "credit_debit"]),

  // Previous insurance - question 1
  hasExistingInsurance: z.boolean(),
  existingInsuranceCompany: z.string().optional(),
  hasLifeInsurance: z.boolean().optional(),
  hasCriticalIllness: z.boolean().optional(),
  hasAccidentRider: z.boolean().optional(),
  hasHospitalDaily: z.boolean().optional(),
  existingPolicyActive: z.enum(["active", "inactive"]).optional(),
  sumInsured: z.number().optional(), // ทุนประกัน

  // Previous insurance - question 2
  wasPreviouslyRejected: z.boolean(),
  rejectedCompany: z.string().optional(),
  rejectedReason: z.string().optional(),
  rejectedDate: z.string().optional(),

  // Beneficiaries (1-3)
  beneficiaries: z.array(beneficiarySchema).min(1, "กรุณาเพิ่มผู้รับผลประโยชน์อย่างน้อย 1 คน").max(3),
}).refine(
  (data) => {
    if (!data.useIdCardAddress) {
      return data.addressLine && data.addressLine.trim() !== "" &&
             data.subDistrict && data.subDistrict.trim() !== "" &&
             data.district && data.district.trim() !== "" &&
             data.province && data.province.trim() !== "" &&
             data.postalCode && data.postalCode.trim() !== "";
    }
    return true;
  },
  { message: "กรุณากรอกที่อยู่ให้ครบถ้วน", path: ["addressLine"] }
).refine(
  (data) => {
    if (data.benefitPaymentMethod === "bank_account") {
      return data.bankName && data.bankName.trim() !== "";
    }
    return true;
  },
  { message: "กรุณาเลือกธนาคาร", path: ["bankName"] }
).refine(
  (data) => {
    if (data.benefitPaymentMethod === "bank_account") {
      return data.bankAccountNumber && data.bankAccountNumber.trim() !== "";
    }
    return true;
  },
  { message: "กรุณากรอกเลขบัญชี", path: ["bankAccountNumber"] }
).refine(
  (data) => {
    if (data.maritalStatus === "married") {
      return data.spouseFirstName && data.spouseFirstName.trim() !== "" &&
             data.spouseLastName && data.spouseLastName.trim() !== "";
    }
    return true;
  },
  { message: "กรุณากรอกชื่อ-นามสกุลคู่สมรส", path: ["spouseFirstName"] }
).refine(
  (data) => {
    const total = data.beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
    return Math.abs(total - 100) < 0.01;
  },
  { message: "ร้อยละผลประโยชน์รวมกันต้องเท่ากับ 100%", path: ["beneficiaries"] }
);

export type InsuranceFormData = z.infer<typeof insuranceFormSchema>;
export type BeneficiaryData = z.infer<typeof beneficiarySchema>;

// Bank list with abbreviations for Thai users
export const THAI_BANKS = [
  { value: "kbank", label: "กสิกรไทย", abbr: "KBank" },
  { value: "scb", label: "ไทยพาณิชย์", abbr: "SCB" },
  { value: "ktb", label: "กรุงไทย", abbr: "KTB" },
  { value: "bbl", label: "กรุงเทพ", abbr: "BBL" },
  { value: "bay", label: "กรุงศรีอยุธยา", abbr: "BAY" },
  { value: "ttb", label: "ทหารไทยธนชาต", abbr: "TTB" },
  { value: "gsb", label: "ออมสิน", abbr: "GSB" },
  { value: "baac", label: "ธ.ก.ส.", abbr: "BAAC" },
  { value: "uob", label: "ยูโอบี", abbr: "UOB" },
  { value: "cimb", label: "ซีไอเอ็มบี", abbr: "CIMB" },
  { value: "lhbank", label: "แลนด์ แอนด์ เฮ้าส์", abbr: "LH Bank" },
  { value: "tisco", label: "ทิสโก้", abbr: "TISCO" },
  { value: "kkp", label: "เกียรตินาคินภัทร", abbr: "KKP" },
  { value: "ghb", label: "อาคารสงเคราะห์", abbr: "GHB" },
] as const;

// Insurance company list
export const INSURANCE_COMPANIES = [
  "AIA",
  "เมืองไทยประกันชีวิต",
  "ไทยประกันชีวิต",
  "กรุงเทพประกันชีวิต",
  "อลิอันซ์ อยุธยา",
  "FWD",
  "แมนูไลฟ์",
  "พรูเด็นเชียล",
  "ไทยสมุทร",
  "เจนเนอราลี่",
  "ทิพยประกันชีวิต",
  "อื่นๆ",
] as const;

// Rejection reasons
export const REJECTION_REASONS = [
  "เลื่อนการรับประกันภัย",
  "เพิ่มอัตราเบี้ยประกันภัย",
  "เปลี่ยนแปลงเงื่อนไข",
  "การขอเอาประกันภัย",
  "การขอกลับคืนสู่สถานะเดิม",
  "การขอต่ออายุกรมธรรม์",
  "อื่นๆ",
] as const;
