import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insuranceFormSchema, type InsuranceFormData, THAI_BANKS, INSURANCE_COMPANIES, REJECTION_REASONS } from "@shared/insurance";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Briefcase,
  Heart,
  CreditCard,
  FileText,
  Wallet,
  Shield,
  UserPlus,
  Trash2,
  CheckCircle2,
  Loader2,
  Upload,
  Image as ImageIcon,
  IdCard,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Bank brand colors for visual identification
const BANK_COLORS: Record<string, string> = {
  kbank: "#138f2d",
  scb: "#4e2a84",
  ktb: "#1ba5e0",
  bbl: "#1e3a8a",
  bay: "#ffc107",
  ttb: "#fc4c02",
  gsb: "#e91e8c",
  baac: "#2e7d32",
  uob: "#0033a0",
  cimb: "#ec1c24",
  lhbank: "#006838",
  tisco: "#003366",
  kkp: "#1a237e",
  ghb: "#f57c00",
};

const RELATIONSHIP_OPTIONS = [
  "บิดา", "มารดา", "สามี", "ภรรยา", "บุตร",
  "พี่", "น้อง", "ปู่", "ย่า", "ตา", "ยาย", "อื่นๆ",
];

const PREFIX_OPTIONS = ["นาย", "นาง", "นางสาว", "เด็กชาย", "เด็กหญิง"];

// Format number with comma separator
const formatCurrency = (value: string): string => {
  const num = value.replace(/[^0-9]/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร",
  "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ",
  "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก",
  "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์",
  "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี",
  "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา",
  "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์",
  "แพร่", "พะเยา", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน",
  "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี",
  "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร",
  "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร",
  "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี",
  "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง",
  "อุดรธานี", "อุทัยธานี", "อุตรดิตถ์", "อุบลราชธานี", "อำนาจเจริญ",
];

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  number,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  number: number;
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold text-sm shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-[oklch(0.78_0.12_85)]" />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  error,
  required,
  children,
  hint,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-foreground">{error}</p>}
    </div>
  );
}

function BankIcon({ color, abbr }: { color: string; abbr: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-white text-[10px] font-bold shrink-0 leading-none"
      style={{ backgroundColor: color }}
    >
      {abbr.slice(0, 3)}
    </span>
  );
}

export default function InsuranceForm() {
  const params = useParams<{ agentCode: string }>();
  const agentCode = params.agentCode || "";
  const [submitted, setSubmitted] = useState(false);
  const [submissionRef, setSubmissionRef] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InsuranceFormData>({
    resolver: zodResolver(insuranceFormSchema),
    defaultValues: {
      prefix: "นาย",
      firstName: "",
      lastName: "",
      nickname: "",
      phone: "",
      email: "",
      occupation: "",
      position: "",
      height: undefined,
      weight: undefined,
      annualIncome: undefined,
      idCardStatus: "not_sent",
      idCardImageUrl: "",
      maritalStatus: "single",
      spouseGender: "male",
      spouseFirstName: "",
      spouseLastName: "",
      spouseBirthDate: "",
      useIdCardAddress: false,
      addressLine: "",
      subDistrict: "",
      district: "",
      province: "",
      postalCode: "",
      benefitPaymentMethod: "bank_account",
      bankName: "",
      bankAccountNumber: "",
      policyDelivery: "e_document",
      paymentMethod: "qr_transfer",
      hasExistingInsurance: false,
      existingInsuranceCompany: "",
      hasLifeInsurance: false,
      hasCriticalIllness: false,
      hasAccidentRider: false,
      hasHospitalDaily: false,
      existingPolicyActive: undefined,
      wasPreviouslyRejected: false,
      rejectedCompany: "",
      rejectedReason: "",
      rejectedDate: "",
      beneficiaries: [
        {
          gender: "male",
          birthDate: "",
          age: 0,
          prefix: "นาย",
          firstName: "",
          lastName: "",
          percentage: 100,
          relationship: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "beneficiaries",
  });

  const useIdCardAddress = watch("useIdCardAddress");
  const benefitPaymentMethod = watch("benefitPaymentMethod");
  const maritalStatus = watch("maritalStatus");
  const idCardStatus = watch("idCardStatus");
  const hasExistingInsurance = watch("hasExistingInsurance");
  const wasPreviouslyRejected = watch("wasPreviouslyRejected");

  const submitMutation = trpc.insurance.submit.useMutation({
    onSuccess: (data) => {
      setSubmissionRef(data.submissionRef);
      setSubmitted(true);
      toast.success("ส่งข้อมูลสำเร็จ");
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    },
  });

  const onSubmit = (data: InsuranceFormData) => {
    submitMutation.mutate({ ...data, agentCode });
  };

  const uploadImageMutation = trpc.insurance.uploadImage.useMutation();
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const base64 = (ev.target?.result as string).split(",")[1];
          const result = await uploadImageMutation.mutateAsync({ base64, mimeType: file.type });
          setUploadedImageUrl(result.url);
          setValue("idCardImageUrl", result.url);
          toast.success("อัปโหลดรูปบัตรประชาชนสำเร็จ");
        } catch {
          toast.error("อัปโหลดไม่สำเร็จ กรุณาลองใหม่");
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        toast.error("เกิดข้อผิดพลาดในการอ่านไฟล์");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="elegant-gradient py-16 px-4">
          <div className="max-w-lg mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="h-20 w-20 text-[oklch(0.78_0.12_85)] mx-auto mb-6" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-3 font-serif">
              กรอกข้อมูลเสร็จแล้ว!
            </h1>
            <p className="text-white/80 mb-2">
              แคปหน้าจอนี้ส่งให้ตัวแทนประกันของคุณ
            </p>
            <p className="text-white/70 text-sm mt-4">
              เพื่อดำเนินการต่อไป
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 mt-6 inline-block">
              <p className="text-white/70 text-sm">รหัสอ้างอิง</p>
              <p className="text-2xl font-bold text-[oklch(0.78_0.12_85)] tracking-wider">
                {submissionRef}
              </p>
            </div>
            <p className="text-white/60 text-sm mt-6">
              กรุณาบันทึกรหัสอ้างอิงนี้ไว้เพื่อใช้ในการติดตามสถานะ
            </p>
            <p className="text-white/70 text-sm mt-4 px-4">
              ข้อมูลของท่านถูกบันทึกเรียบร้อยแล้ว
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                window.location.reload();
              }}
              className="mt-8 bg-[oklch(0.78_0.12_85)] text-[oklch(0.20_0.05_260)] hover:bg-[oklch(0.83_0.10_85)] font-semibold px-8"
            >
              กรอกข้อมูลใหม่
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="elegant-gradient py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[oklch(0.78_0.12_85)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[oklch(0.78_0.12_85)] rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
            <Shield className="h-4 w-4 text-[oklch(0.78_0.12_85)]" />
            <span className="text-white/90 text-sm font-medium">
              แบบฟอร์มข้อมูลประกันชีวิต
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white font-serif mb-3">
            กรอกข้อมูลสำหรับทำประกัน
          </h1>
          <p className="text-white/70 text-sm md:text-base max-w-xl mx-auto">
            กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง
            ข้อมูลทั้งหมดจะถูกเก็บรักษาเป็นความลับ
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8 -mt-4 relative z-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ===== Section 1: Personal Info ===== */}
          <Card className="shadow-lg border-0 shadow-black/5">
            <CardContent className="p-6 md:p-8">
              <SectionHeader
                icon={User}
                title="ข้อมูลส่วนตัว"
                subtitle="กรุณากรอกข้อมูลส่วนตัวของท่าน"
                number={1}
              />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField label="คำนำหน้า" error={errors.prefix?.message} required>
                  <Controller
                    name="prefix"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="นาย">นาย</SelectItem>
                          <SelectItem value="นาง">นาง</SelectItem>
                          <SelectItem value="นางสาว">นางสาว</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
                <FormField label="ชื่อ" error={errors.firstName?.message} required>
                  <Input placeholder="กรอกชื่อ" {...register("firstName")} className="h-11" />
                </FormField>
                <FormField label="นามสกุล" error={errors.lastName?.message} required>
                  <Input placeholder="กรอกนามสกุล" {...register("lastName")} className="h-11" />
                </FormField>
                <FormField label="ชื่อเล่น" error={errors.nickname?.message}>
                  <Input placeholder="กรอกชื่อเล่น" {...register("nickname")} className="h-11" />
                </FormField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField label="เบอร์มือถือ" error={errors.phone?.message} required>
                  <Input placeholder="0xx-xxx-xxxx" {...register("phone")} className="h-11" />
                </FormField>
                <FormField label="อีเมล์" error={errors.email?.message} required>
                  <Input type="email" placeholder="example@email.com" {...register("email")} className="h-11" />
                </FormField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField label="อาชีพ" error={errors.occupation?.message} required>
                  <Input placeholder="กรอกอาชีพ" {...register("occupation")} className="h-11" />
                </FormField>
                <FormField label="ตำแหน่ง" error={errors.position?.message} required>
                  <Input placeholder="กรอกตำแหน่ง" {...register("position")} className="h-11" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <FormField label="ส่วนสูง (ซม.)" error={errors.height?.message} required>
                  <Input type="number" placeholder="170" {...register("height", { valueAsNumber: true })} className="h-11" />
                </FormField>
                <FormField label="น้ำหนัก (กก.)" error={errors.weight?.message} required>
                  <Input type="number" placeholder="65" {...register("weight", { valueAsNumber: true })} className="h-11" />
                </FormField>
                <div className="col-span-2 md:col-span-1">
                  <FormField
                    label="รายได้ต่อปี (บาท)"
                    error={errors.annualIncome?.message}
                    required
                    hint="ไม่ได้เปิดเผยกับสรรพากร ใช้รายได้เพื่อประกอบการพิจารณาทุนประกันต่างๆ"
                  >
                    <Input
                      type="text"
                      placeholder="500,000"
                      {...register("annualIncome", {
                        setValueAs: (value) => {
                          if (typeof value === 'string') {
                            const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
                            return isNaN(num) ? 0 : num;
                          }
                          return value;
                        },
                        onChange: (e) => {
                          const formatted = formatCurrency(e.target.value);
                          e.target.value = formatted;
                        }
                      })}
                      className="h-11"
                      onBlur={(e) => {
                        const num = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
                        if (!isNaN(num)) {
                          e.target.value = formatCurrency(num.toString());
                        }
                      }}
                    />
                  </FormField>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===== Section 2: ID Card ===== */}
          <Card className="shadow-lg border-0 shadow-black/5">
            <CardContent className="p-6 md:p-8">
              <SectionHeader
                icon={IdCard}
                title="ข้อมูลหน้าบัตรประชาชน"
                subtitle="สถานะการส่งสำเนาบัตรประชาชน"
                number={2}
              />
              <Controller
                name="idCardStatus"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="idcard_sent"
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        field.value === "sent"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value="sent" id="idcard_sent" />
                      <div>
                        <p className="font-medium text-sm">ส่งให้ตัวแทนแล้ว</p>
                        <p className="text-xs text-muted-foreground">สำเนาบัตรถูกส่งให้ตัวแทนเรียบร้อย</p>
                      </div>
                    </Label>
                    <Label
                      htmlFor="idcard_not_sent"
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        field.value === "not_sent"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value="not_sent" id="idcard_not_sent" />
                      <div>
                        <p className="font-medium text-sm">ยังไม่ส่ง</p>
                        <p className="text-xs text-muted-foreground">อัปโหลดรูปบัตรประชาชนผ่านระบบ</p>
                      </div>
                    </Label>
                  </RadioGroup>
                )}
              />

              <AnimatePresence>
                {idCardStatus === "not_sent" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4"
                  >
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {uploadedImageUrl ? (
                        <div className="space-y-3">
                          <div className="w-48 h-32 mx-auto rounded-lg overflow-hidden border bg-muted">
                            <img src={uploadedImageUrl} alt="บัตรประชาชน" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            อัปโหลดสำเร็จ
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            เปลี่ยนรูป
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploading ? (
                            <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-3" />
                          ) : (
                            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          )}
                          <p className="text-sm font-medium text-foreground">
                            {uploading ? "กำลังอัปโหลด..." : "คลิกเพื่ออัปโหลดรูปบัตรประชาชน"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            รองรับไฟล์ JPG, PNG (สูงสุด 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* ===== Section 3: Marital Status ===== */}
          <Card className="shadow-lg border-0 shadow-black/5">
            <CardContent className="p-6 md:p-8">
              <SectionHeader
                icon={Heart}
                title="สถานภาพ"
                subtitle="กรุณาเลือกสถานภาพของท่าน"
                number={3}
              />
              <Controller
                name="maritalStatus"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: "single", label: "โสด" },
                      { value: "married", label: "สมรส" },
                      { value: "divorced", label: "หย่าร้าง" },
                      { value: "widowed", label: "หม้าย" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          field.value === option.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/30 text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              />

              <AnimatePresence>
                {maritalStatus === "married" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 p-4 bg-accent/20 rounded-lg border"
                  >
                    <p className="text-sm font-medium text-foreground mb-3">ข้อมูลคู่สมรส</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField label="เพศคู่สมรส" error={errors.spouseGender?.message} required>
                        <Controller
                          name="spouseGender"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value || "male"} onValueChange={field.onChange}>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="เลือกเพศ" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">ชาย</SelectItem>
                                <SelectItem value="female">หญิง</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField label="ชื่อคู่สมรส" error={errors.spouseFirstName?.message} required>
                        <Input placeholder="กรอกชื่อ" {...register("spouseFirstName")} className="h-11" />
                      </FormField>
                      <FormField label="นามสกุลคู่สมรส" error={errors.spouseLastName?.message} required>
                        <Input placeholder="กรอกนามสกุล" {...register("spouseLastName")} className="h-11" />
                      </FormField>
                      <FormField label="วันเดือนปีเกิดคู่สมรส" error={errors.spouseBirthDate?.message}>
                        <Input type="date" {...register("spouseBirthDate")} className="h-11" />
                      </FormField>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* ===== Section 4: Address ===== */}
          <Card className="shadow-lg border-0 shadow-black/5">
            <CardContent className="p-6 md:p-8">
              <SectionHeader
                icon={MapPin}
                title="ที่อยู่ปัจจุบัน"
                subtitle="ใช้สำหรับจัดส่งเอกสาร"
                number={4}
              />

              <div className="flex items-center gap-3 mb-4 p-3 bg-accent/30 rounded-lg border">
                <Controller
                  name="useIdCardAddress"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="useIdCardAddress"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="useIdCardAddress" className="text-sm font-medium cursor-pointer">
                  ใช้ที่อยู่ตามบัตรประชาชน (ไม่ต้องกรอกข้อมูลที่อยู่)
                </Label>
              </div>

              <AnimatePresence>
                {useIdCardAddress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-4"
                  >
                    <FormField label="รหัสไปรษณีย์ ตามบัตรประชาชน" required>
                      <Input placeholder="10110" {...register("postalCode")} className="h-11" maxLength={5} />
                    </FormField>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!useIdCardAddress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <FormField label="ที่อยู่ (บ้านเลขที่ ซอย ถนน)" error={errors.addressLine?.message} required>
                      <Input placeholder="เช่น 123/45 ซ.สุขุมวิท 55 ถ.สุขุมวิท" {...register("addressLine")} className="h-11" />
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="ตำบล / แขวง" error={errors.subDistrict?.message} required>
                        <Input placeholder="กรอกตำบล/แขวง" {...register("subDistrict")} className="h-11" />
                      </FormField>
                      <FormField label="อำเภอ / เขต" error={errors.district?.message} required>
                        <Input placeholder="กรอกอำเภอ/เขต" {...register("district")} className="h-11" />
                      </FormField>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="จังหวัด" error={errors.province?.message} required>
                        <Controller
                          name="province"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="เลือกจังหวัด" />
                              </SelectTrigger>
                              <SelectContent>
                                {PROVINCES.map((p) => (
                                  <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                      <FormField label="รหัสไปรษณีย์" error={errors.postalCode?.message} required>
                        <Input placeholder="10110" {...register("postalCode")} className="h-11" maxLength={5} />
                      </FormField>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* ===== Section 5: Benefit Payment ===== */}
          <Card className="shadow-lg border-0 shadow-black/5">
            <CardContent className="p-6 md:p-8">
              <SectionHeader
                icon={Wallet}
                title="การรับเงินผลประโยชน์"
                subtitle="เลือกวิธีการรับเงินผลประโยชน์ผ่านบัญชี"
                number={5}
              />
              <div className="space-y-4">
                <Controller
                  name="benefitPaymentMethod"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      <Label
                        htmlFor="bank_account"
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          field.value === "bank_account"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <RadioGroupItem value="bank_account" id="bank_account" />
                        <div>
                          <p className="font-medium text-sm">บัญชีธนาคาร</p>
                          <p className="text-xs text-muted-foreground">รับเงินผ่านบัญชีธนาคาร</p>
                        </div>
                      </Label>
                      <Label
                        htmlFor="promptpay"
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          field.value === "promptpay"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <RadioGroupItem value="promptpay" id="promptpay" />
                        <div>
                          <p className="font-medium text-sm">พร้อมเพย์</p>
                          <p className="text-xs text-muted-foreground">รับเงินผ่านพร้อมเพย์</p>
                        </div>
                      </Label>
                    </RadioGroup>
                  )}
                />

                <AnimatePresence>
                  {benefitPaymentMethod === "bank_account" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
                    >
                      <FormField label="ธนาคาร" error={errors.bankName?.message} required>
                        <Controller
                          name="bankName"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="เลือกธนาคาร" />
                              </SelectTrigger>
                              <SelectContent>
                                {THAI_BANKS.map((bank) => (
                                  <SelectItem key={bank.value} value={bank.value}>
                                    <div className="flex items-center gap-2">
                                      <BankIcon
                                        color={BANK_COLORS[bank.value] || "#666"}
                                        abbr={bank.abbr}
                                      />
                                      <span>{bank.label}</span>
                                      <span className="text-muted-foreground text-xs">({bank.abbr})</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                      <FormField label="เลขบัญชี" error={errors.bankAccountNumber?.message} required>
                        <Input placeholder="กรอกเลขบัญชี" {...register("bankAccountNumber")} className="h-11" />
                      </FormField>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* ===== Section 6: Policy Delivery ===== */}
          <Card className="shadow-lg border-0 shadow-black/5">
            <CardContent className="p-6 md:p-8">
              <SectionHeader
                icon={FileText}
                title="การรับกรมธรรม์"
                subtitle="เลือกวิธีการรับเล่มกรมธรรม์"
                number={6}
              />
              <Controller
                name="policyDelivery"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="space-y-3"
                  >
                    {[
                      { value: "e_document", label: "e-Document & e-Receipt", desc: "รับเอกสารอิเล็กทรอนิกส์ผ่านอีเมล" },
                      { value: "paper_customer", label: "รับแบบกระดาษ จัดส่งผ่านที่อยู่ลูกค้า", desc: "จัดส่งเอกสารไปยังที่อยู่ที่ท่านระบุ" },
                      { value: "paper_agent", label: "รับแบบกระดาษ ผ่านตัวแทน", desc: "รับเอกสารผ่านตัวแทนประกัน" },
                    ].map((option) => (
                      <Label
                        key={option.value}
                        htmlFor={`policy_${option.value}`}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          field.value === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <RadioGroupItem value={option.value} id={`policy_${option.value}`} />
                        <div>
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.desc}</p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                )}
              />
            </CardContent>
          </Card>

          {/* ===== Section 7: Payment Method ===== */}
          <Card className="shadow-lg border-0 shadow-black/5">
            <CardContent className="p-6 md:p-8">
              <SectionHeader
                icon={CreditCard}
                title="วิธีชำระเงิน"
                subtitle="เลือกวิธีการชำระค่าเบี้ยประกัน"
                number={7}
              />
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="qr_transfer"
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        field.value === "qr_transfer"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value="qr_transfer" id="qr_transfer" />
                      <div>
                        <p className="font-medium text-sm">QR Code โอนเงิน</p>
                        <p className="text-xs text-muted-foreground">สแกน QR Code เพื่อชำระเงิน</p>
                      </div>
                    </Label>
                    <Label
                      htmlFor="credit_debit"
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        field.value === "credit_debit"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value="credit_debit" id="credit_debit" />
                      <div>
                        <p className="font-medium text-sm">บัตรเครดิต & เดบิต</p>
                        <p className="text-xs text-muted-foreground">ชำระผ่านบัตรเครดิตหรือเดบิต</p>
                      </div>
                    </Label>
                  </RadioGroup>
                )}
              />
            </CardContent>
          </Card>

          {/* ===== Section 8: Beneficiaries ===== */}
          <Card className="shadow-lg border-0 shadow-black/5">
            <CardContent className="p-6 md:p-8">
              <SectionHeader
                icon={Users}
                title="ผู้รับผลประโยชน์"
                subtitle="กรุณาระบุผู้รับผลประโยชน์อย่างน้อย 1 ท่าน สูงสุด 3 ท่าน (ร้อยละรวมกันต้องเท่ากับ 100%)"
                number={8}
              />
              {errors.beneficiaries?.root?.message && (
                <p className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded-lg">
                  {errors.beneficiaries.root.message}
                </p>
              )}
              {(errors as any).beneficiaries?.message && (
                <p className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded-lg">
                  {(errors as any).beneficiaries.message}
                </p>
              )}
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-4 md:p-5 border rounded-lg bg-accent/20 relative"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground">
                        ผู้รับผลประโยชน์คนที่ {index + 1}
                      </h3>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          ลบ
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <FormField label="เพศ" error={errors.beneficiaries?.[index]?.gender?.message} required>
                        <Controller
                          name={`beneficiaries.${index}.gender`}
                          control={control}
                          render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="เลือกเพศ" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">ชาย</SelectItem>
                                <SelectItem value="female">หญิง</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                      <FormField label="วันเกิด" error={errors.beneficiaries?.[index]?.birthDate?.message} required>
                        <Input
                          type="date"
                          {...register(`beneficiaries.${index}.birthDate`, {
                            onChange: (e) => {
                              const birthDate = e.target.value;
                              if (birthDate) {
                                const today = new Date();
                                const birth = new Date(birthDate);
                                let age = today.getFullYear() - birth.getFullYear();
                                const monthDiff = today.getMonth() - birth.getMonth();
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                                  age--;
                                }
                                setValue(`beneficiaries.${index}.age`, age);
                              }
                            },
                          })}
                          className="h-10"
                        />
                      </FormField>
                      <FormField label="อายุ" error={errors.beneficiaries?.[index]?.age?.message} required>
                        <Input
                          type="number"
                          placeholder="อายุ"
                          {...register(`beneficiaries.${index}.age`, { valueAsNumber: true })}
                          className="h-10"
                          readOnly
                        />
                      </FormField>
                      <FormField label="คำนำหน้า" error={errors.beneficiaries?.[index]?.prefix?.message} required>
                        <Controller
                          name={`beneficiaries.${index}.prefix`}
                          control={control}
                          render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="คำนำหน้า" />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFIX_OPTIONS.map((p) => (
                                  <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                      <FormField label="ชื่อ" error={errors.beneficiaries?.[index]?.firstName?.message} required>
                        <Input placeholder="ชื่อ" {...register(`beneficiaries.${index}.firstName`)} className="h-10" />
                      </FormField>
                      <FormField label="นามสกุล" error={errors.beneficiaries?.[index]?.lastName?.message} required>
                        <Input placeholder="นามสกุล" {...register(`beneficiaries.${index}.lastName`)} className="h-10" />
                      </FormField>
                      <FormField label="ร้อยละผลประโยชน์" error={errors.beneficiaries?.[index]?.percentage?.message} required>
                        <Input
                          type="number"
                          placeholder="%"
                          {...register(`beneficiaries.${index}.percentage`, { valueAsNumber: true })}
                          className="h-10"
                        />
                      </FormField>
                      <div className="col-span-2 md:col-span-3">
                        <FormField label="ความสัมพันธ์" error={errors.beneficiaries?.[index]?.relationship?.message} required>
                          <Controller
                            name={`beneficiaries.${index}.relationship`}
                            control={control}
                            render={({ field: f }) => (
                              <Select value={f.value} onValueChange={f.onChange}>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="เลือกความสัมพันธ์" />
                                </SelectTrigger>
                                <SelectContent>
                                  {RELATIONSHIP_OPTIONS.map((r) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </FormField>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {fields.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        gender: "male",
                        birthDate: "",
                        age: 0,
                        prefix: "นาย",
                        firstName: "",
                        lastName: "",
                        percentage: 0,
                        relationship: "",
                      })
                    }
                    className="w-full border-dashed border-2 h-12 hover:bg-accent/50"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    เพิ่มผู้รับผลประโยชน์
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ===== Section 9: Insurance History (ข้อมูลและรายละเอียดกรมธรรม์) ===== */}
          <Card className="shadow-lg border-0 shadow-black/5">
            <CardContent className="p-6 md:p-8">
              <SectionHeader
                icon={Shield}
                title="ข้อมูลและรายละเอียดกรมธรรม์"
                number={9}
              />

              {/* Question 1 */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        ท่านมีหรือเคยมีประกันชีวิต หรือประกันสุขภาพ หรือ ประกันอุบัติเหตุ
                        หรือ กำลังขอเอาประกันภัยดังกล่าวไว้กับบริษัทนี้ หรือบริษัทอื่นหรือไม่
                      </p>
                    </div>
                    <Controller
                      name="hasExistingInsurance"
                      control={control}
                      render={({ field }) => (
                        <div className="flex shrink-0">
                          <button
                            type="button"
                            onClick={() => field.onChange(true)}
                            className={`px-8 py-2.5 text-sm font-medium border transition-all ${
                              field.value === true
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                            } rounded-l-lg`}
                          >
                            มี
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange(false)}
                            className={`px-8 py-2.5 text-sm font-medium border-y border-r transition-all ${
                              field.value === false
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                            } rounded-r-lg`}
                          >
                            ไม่มี
                          </button>
                        </div>
                      )}
                    />
                  </div>

                  <AnimatePresence>
                    {hasExistingInsurance && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 space-y-4 pt-4 border-t"
                      >
                        <p className="text-sm text-muted-foreground">โปรดแจ้งรายละเอียด</p>

                        <FormField label="ชื่อบริษัท" error={errors.existingInsuranceCompany?.message}>
                          <Controller
                            name="existingInsuranceCompany"
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value || ""} onValueChange={field.onChange}>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="เลือกบริษัท" />
                                </SelectTrigger>
                                <SelectContent>
                                  {INSURANCE_COMPANIES.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </FormField>

                        <div>
                          <p className="text-sm font-medium text-foreground mb-3">ข้อมูลประกันชีวิต/ประกันสุขภาพ</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { name: "hasLifeInsurance" as const, label: "ประกันชีวิต" },
                              { name: "hasCriticalIllness" as const, label: "สัญญาเพิ่มเติมโรคร้ายแรง" },
                              { name: "hasAccidentRider" as const, label: "สัญญาเพิ่มเติมอุบัติเหตุ" },
                              { name: "hasHospitalDaily" as const, label: "สัญญาเพิ่มเติมค่าชดเชยรายวัน การเข้ารักษาในโรงพยาบาล" },
                            ].map((item) => (
                              <Controller
                                key={item.name}
                                name={item.name}
                                control={control}
                                render={({ field }) => (
                                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/30 transition-colors">
                                    <Checkbox
                                      checked={field.value === true}
                                      onCheckedChange={field.onChange}
                                    />
                                    <span className="text-sm">{item.label}</span>
                                  </label>
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">ขณะนี้สัญญามีผลบังคับหรือไม่</p>
                          <Controller
                            name="existingPolicyActive"
                            control={control}
                            render={({ field }) => (
                              <div className="flex">
                                <button
                                  type="button"
                                  onClick={() => field.onChange("active")}
                                  className={`px-6 py-2 text-sm font-medium border transition-all ${
                                    field.value === "active"
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                                  } rounded-l-lg`}
                                >
                                  มีผลบังคับ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => field.onChange("inactive")}
                                  className={`px-6 py-2 text-sm font-medium border-y border-r transition-all ${
                                    field.value === "inactive"
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                                  } rounded-r-lg`}
                                >
                                  ไม่มีผลบังคับ
                                </button>
                              </div>
                            )}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Question 2 */}
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        ท่านเคยถูกปฏิเสธ เลื่อนการรับประกันภัย เพิ่มอัตราเบี้ยประกันภัย
                        เปลี่ยนแปลงเงื่อนไข สำหรับการขอเอาประกันภัย การขอกลับคืนสู่สถานะเดิม
                        หรือ การขอต่ออายุของกรมธรรม์จากบริษัทนี้ หรือบริษัทอื่นบ้างหรือไม่
                      </p>
                    </div>
                    <Controller
                      name="wasPreviouslyRejected"
                      control={control}
                      render={({ field }) => (
                        <div className="flex shrink-0">
                          <button
                            type="button"
                            onClick={() => field.onChange(true)}
                            className={`px-8 py-2.5 text-sm font-medium border transition-all ${
                              field.value === true
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                            } rounded-l-lg`}
                          >
                            เคย
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange(false)}
                            className={`px-8 py-2.5 text-sm font-medium border-y border-r transition-all ${
                              field.value === false
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                            } rounded-r-lg`}
                          >
                            ไม่เคย
                          </button>
                        </div>
                      )}
                    />
                  </div>

                  <AnimatePresence>
                    {wasPreviouslyRejected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 space-y-4 pt-4 border-t"
                      >
                        <p className="text-sm text-muted-foreground">โปรดแจ้งรายละเอียด</p>

                        <FormField label="ถ้าเคย โปรดระบุชื่อบริษัท" error={errors.rejectedCompany?.message}>
                          <Controller
                            name="rejectedCompany"
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value || ""} onValueChange={field.onChange}>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="เลือกบริษัท" />
                                </SelectTrigger>
                                <SelectContent>
                                  {INSURANCE_COMPANIES.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </FormField>

                        <FormField label="สาเหตุ" error={errors.rejectedReason?.message}>
                          <Controller
                            name="rejectedReason"
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value || ""} onValueChange={field.onChange}>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="เลือกสาเหตุ" />
                                </SelectTrigger>
                                <SelectContent>
                                  {REJECTION_REASONS.map((r) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </FormField>

                        <FormField label="เมื่อ" error={errors.rejectedDate?.message}>
                          <Input type="date" {...register("rejectedDate")} className="h-11" />
                        </FormField>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="pt-4 pb-12">
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  กำลังส่งข้อมูล...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  ส่งข้อมูล
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              ข้อมูลทั้งหมดจะถูกเก็บรักษาเป็นความลับตามนโยบายความเป็นส่วนตัว
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
