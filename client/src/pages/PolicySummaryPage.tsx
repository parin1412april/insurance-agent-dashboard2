import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ══════════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════════

type PolicyStatus = "active" | "surrendered" | "cancelled" | "archived";
type PolicyType =
  | "term"
  | "whole_life"
  | "health"
  | "pa"
  | "endowment"
  | "unit_linked"
  | "annuity"
  | "ci";

interface Policy {
  id: string;
  name: string;
  type: PolicyType;
  status: PolicyStatus;
  company: string;
  notes: string;
  premiumPerYear: number;
  sumInsured: number;
  ciAmount: number;
  medicalCoverage: number;
  paAmount: number;
  taxDeduction: number;
  startAge: number;
  coverageEndAge: number;
  paymentEndAge: number;
  cashBackPerYear: number;
  maturityAmount: number;
}

interface PolicyProfile {
  id: string;
  name: string;
  birthYear: number; // พ.ศ.
  gender: "ชาย" | "หญิง";
  notes: string;
  policies: Policy[];
}

// ══════════════════════════════════════════════════════════════════════════
// Constants & Helpers
// ══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "policy-summary-profiles";

const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  term: "ชั่วระยะ (Term)",
  whole_life: "ตลอดชีพ",
  health: "สุขภาพ",
  pa: "อุบัติเหตุ (PA)",
  endowment: "สะสมทรัพย์",
  unit_linked: "Unit-Linked",
  annuity: "บำนาญ",
  ci: "โรคร้ายแรง (CI)",
};

const STATUS_LABELS: Record<PolicyStatus, string> = {
  active: "คุ้มครอง",
  surrendered: "เวนคืน",
  cancelled: "ยกเลิก",
  archived: "เก็บถาวร",
};

const STATUS_COLORS: Record<PolicyStatus, string> = {
  active: "bg-green-500",
  surrendered: "bg-amber-500",
  cancelled: "bg-red-500",
  archived: "bg-gray-400",
};

const STATUS_BADGE_STYLES: Record<PolicyStatus, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  surrendered: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

function loadProfiles(): PolicyProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migrate old format policies that don't have the new fields
    return parsed.map((p: any) => ({
      ...p,
      policies: (p.policies || []).map((pol: any) => ({
        type: "whole_life",
        status: "active",
        company: "",
        notes: "",
        ciAmount: 0,
        medicalCoverage: 0,
        paAmount: 0,
        taxDeduction: 0,
        startAge: 30,
        coverageEndAge: 99,
        paymentEndAge: 60,
        cashBackPerYear: 0,
        maturityAmount: 0,
        ...pol,
      })),
    }));
  } catch {
    return [];
  }
}

function saveProfiles(profiles: PolicyProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function calcAge(birthYearBE: number): number {
  return new Date().getFullYear() + 543 - birthYearBE;
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  return n.toLocaleString();
}

function fmtBaht(n: number): string {
  return n.toLocaleString() + " ฿";
}

function defaultPolicy(): Omit<Policy, "id"> {
  return {
    name: "",
    type: "whole_life",
    status: "active",
    company: "",
    notes: "",
    premiumPerYear: 0,
    sumInsured: 0,
    ciAmount: 0,
    medicalCoverage: 0,
    paAmount: 0,
    taxDeduction: 0,
    startAge: 30,
    coverageEndAge: 99,
    paymentEndAge: 60,
    cashBackPerYear: 0,
    maturityAmount: 0,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// Profile Card (list view)
// ══════════════════════════════════════════════════════════════════════════

function ProfileCard({ profile, onClick }: { profile: PolicyProfile; onClick: () => void }) {
  const active = profile.policies.filter((p) => p.status === "active");
  const totalPremium = active.reduce((s, p) => s + p.premiumPerYear, 0);
  const totalSumInsured = active.reduce((s, p) => s + p.sumInsured, 0);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <User className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
              {profile.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {calcAge(profile.birthYear)} ปี · {profile.gender}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
      </div>
      <div className="flex justify-around">
        <StatBubble icon={<FileText className="w-5 h-5 text-blue-500" />} value={String(active.length)} label="กรมธรรม์" bg="bg-blue-50 dark:bg-blue-900/30" />
        <StatBubble icon={<FolderOpen className="w-5 h-5 text-amber-500" />} value={fmtMoney(totalPremium)} label="เบี้ย/ปี" bg="bg-amber-50 dark:bg-amber-900/30" />
        <StatBubble icon={<Shield className="w-5 h-5 text-green-500" />} value={fmtMoney(totalSumInsured)} label="ทุนชีวิต" bg="bg-green-50 dark:bg-green-900/30" />
      </div>
    </button>
  );
}

function StatBubble({ icon, value, label, bg }: { icon: React.ReactNode; value: string; label: string; bg: string }) {
  return (
    <div className="text-center">
      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center mx-auto mb-1`}>{icon}</div>
      <p className="font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Profile Dialog (add / edit profile)
// ══════════════════════════════════════════════════════════════════════════

function ProfileDialog({
  open,
  onOpenChange,
  onSave,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (d: { name: string; birthYear: number; gender: "ชาย" | "หญิง"; notes: string }) => void;
  initial?: PolicyProfile | null;
}) {
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("2539");
  const [gender, setGender] = useState<"ชาย" | "หญิง">("ชาย");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setBirthYear(String(initial.birthYear));
      setGender(initial.gender);
      setNotes(initial.notes);
    } else {
      setName("");
      setBirthYear("2539");
      setGender("ชาย");
      setNotes("");
    }
  }, [open, initial]);

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), birthYear: parseInt(birthYear) || 2539, gender, notes: notes.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{initial ? "แก้ไขโปรไฟล์" : "เพิ่มโปรไฟล์"}</DialogTitle>
          <p className="text-xs text-gray-400 uppercase tracking-widest">Profile Details</p>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-400">ชื่อ-นามสกุล <span className="text-red-500">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 focus-visible:ring-2 focus-visible:ring-blue-400" placeholder="ชื่อ นามสกุล" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">ปีเกิด (พ.ศ.)</Label>
              <Input value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0" placeholder="2539" type="number" />
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">เพศ</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as "ชาย" | "หญิง")}>
                <SelectTrigger className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ชาย">ชาย</SelectItem>
                  <SelectItem value="หญิง">หญิง</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-400">หมายเหตุ</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 min-h-[80px]" placeholder="หมายเหตุเพิ่มเติม..." />
          </div>
          <Button onClick={submit} disabled={!name.trim()} className="w-full rounded-2xl bg-green-700 hover:bg-green-800 text-white h-12 text-base font-medium">
            {initial ? "บันทึก" : "เพิ่มโปรไฟล์"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Quick Policy Dialog (บันทึกด่วน)
// ══════════════════════════════════════════════════════════════════════════

function QuickPolicyDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (p: Omit<Policy, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PolicyType>("whole_life");
  const [company, setCompany] = useState("");
  const [premium, setPremium] = useState("");
  const [sumInsured, setSumInsured] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) { setName(""); setType("whole_life"); setCompany(""); setPremium(""); setSumInsured(""); setNotes(""); }
  }, [open]);

  const submit = () => {
    if (!name.trim()) return;
    onSave({ ...defaultPolicy(), name: name.trim(), type, company: company.trim(), premiumPerYear: parseFloat(premium) || 0, sumInsured: parseFloat(sumInsured) || 0, notes: notes.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /> บันทึกด่วน</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-400">ชื่อแบบประกัน <span className="text-red-500">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0" placeholder="เช่น สุขภาพ เหมาจ่าย" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">ประเภท</Label>
              <Select value={type} onValueChange={(v) => setType(v as PolicyType)}>
                <SelectTrigger className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(POLICY_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">บริษัท</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0" placeholder="AIA, เมืองไทย..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">เบี้ย/ปี (฿)</Label>
              <Input value={premium} onChange={(e) => setPremium(e.target.value)} className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0" type="number" placeholder="0" />
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">ทุนชีวิต (฿)</Label>
              <Input value={sumInsured} onChange={(e) => setSumInsured(e.target.value)} className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0" type="number" placeholder="0" />
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-400">หมายเหตุ</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0" placeholder="หมายเหตุสั้นๆ" />
          </div>
          <Button onClick={submit} disabled={!name.trim()} className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium">
            บันทึกด่วน
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Detailed Policy Dialog (บันทึกละเอียด / แก้ไข)
// ══════════════════════════════════════════════════════════════════════════

function DetailedPolicyDialog({
  open,
  onOpenChange,
  onSave,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (p: Omit<Policy, "id">) => void;
  initial?: Policy | null;
}) {
  const [f, setF] = useState<Omit<Policy, "id">>(defaultPolicy());

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const { id: _, ...rest } = initial;
      setF(rest);
    } else {
      setF(defaultPolicy());
    }
  }, [open, initial]);

  const set = <K extends keyof Omit<Policy, "id">>(k: K, v: Omit<Policy, "id">[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const numField = (label: string, key: keyof Omit<Policy, "id">, placeholder = "0") => (
    <div>
      <Label className="text-sm text-gray-600 dark:text-gray-400">{label}</Label>
      <Input value={f[key] || ""} onChange={(e) => set(key, parseFloat(e.target.value) || 0)} className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0" type="number" placeholder={placeholder} />
    </div>
  );

  const submit = () => {
    if (!f.name.trim()) return;
    onSave(f);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" /> {initial ? "แก้ไขกรมธรรม์" : "บันทึกละเอียด"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Basic info */}
          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-400">ชื่อแบบประกัน <span className="text-red-500">*</span></Label>
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0" placeholder="เช่น คุ้มครองชีวิต 20 ปี" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">ประเภท</Label>
              <Select value={f.type} onValueChange={(v) => set("type", v as PolicyType)}>
                <SelectTrigger className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(POLICY_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">สถานะ</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v as PolicyStatus)}>
                <SelectTrigger className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">บริษัท</Label>
              <Input value={f.company} onChange={(e) => set("company", e.target.value)} className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0" placeholder="AIA" />
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ความคุ้มครอง</p>
          <div className="grid grid-cols-2 gap-3">
            {numField("ทุนชีวิต (฿)", "sumInsured")}
            {numField("CI โรคร้ายแรง (฿)", "ciAmount")}
            {numField("ค่ารักษาพยาบาล (฿)", "medicalCoverage")}
            {numField("อุบัติเหตุ PA (฿)", "paAmount")}
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">เบี้ย & ภาษี</p>
          <div className="grid grid-cols-2 gap-3">
            {numField("เบี้ยประกัน/ปี (฿)", "premiumPerYear")}
            {numField("ลดหย่อนภาษี (฿)", "taxDeduction")}
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ระยะเวลา</p>
          <div className="grid grid-cols-3 gap-3">
            {numField("อายุเริ่ม (ปี)", "startAge")}
            {numField("คุ้มครองถึงอายุ", "coverageEndAge")}
            {numField("จ่ายเบี้ยถึงอายุ", "paymentEndAge")}
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">เงินคืน</p>
          <div className="grid grid-cols-2 gap-3">
            {numField("เงินคืน/ปี (฿)", "cashBackPerYear")}
            {numField("เงินก้อนครบสัญญา (฿)", "maturityAmount")}
          </div>

          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-400">หมายเหตุ</Label>
            <Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 min-h-[60px]" placeholder="หมายเหตุ..." />
          </div>

          <Button onClick={submit} disabled={!f.name.trim()} className="w-full rounded-2xl bg-green-700 hover:bg-green-800 text-white h-12 text-base font-medium">
            {initial ? "บันทึก" : "เพิ่มกรมธรรม์"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Coverage Chart Helpers
// ══════════════════════════════════════════════════════════════════════════

const CHART_COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6"];

function buildCoverageData(policies: Policy[], currentAge: number, field: "sumInsured" | "ciAmount" | "medicalCoverage" | "paAmount") {
  const active = policies.filter((p) => p.status === "active" && (p[field] || 0) > 0);
  const data: Record<string, any>[] = [];
  for (let age = 20; age <= 100; age++) {
    const point: Record<string, any> = { age };
    active.forEach((p) => {
      point[p.id] = age >= p.startAge && age <= p.coverageEndAge ? p[field] : 0;
    });
    data.push(point);
  }
  return { data, items: active };
}

function buildCashFlowData(policies: Policy[], currentAge: number, mode: "premium" | "cashback" | "total") {
  const active = policies.filter((p) => p.status === "active");
  const data: { age: number; value: number }[] = [];
  for (let age = 20; age <= 100; age++) {
    let value = 0;
    active.forEach((p) => {
      if (mode === "premium") {
        if (age >= p.startAge && age <= p.paymentEndAge) value += p.premiumPerYear;
      } else if (mode === "cashback") {
        if (age >= p.startAge && age <= p.coverageEndAge) value += p.cashBackPerYear;
        if (age === p.coverageEndAge) value += p.maturityAmount;
      } else {
        // total accumulation
        if (age >= p.startAge && age <= p.coverageEndAge) value += p.cashBackPerYear;
        if (age === p.coverageEndAge) value += p.maturityAmount;
        if (age >= p.startAge && age <= p.paymentEndAge) value -= p.premiumPerYear;
      }
    });
    data.push({ age, value: Math.max(0, mode === "total" ? value : value) });
  }
  // For total mode, make it cumulative
  if (mode === "total") {
    let cum = 0;
    data.forEach((d) => { cum += d.value; d.value = cum; });
  }
  return data;
}

function CoverageSection({
  title,
  policies,
  currentAge,
  field,
  chartColor = "#22c55e",
}: {
  title: string;
  policies: Policy[];
  currentAge: number;
  field: "sumInsured" | "ciAmount" | "medicalCoverage" | "paAmount";
  chartColor?: string;
}) {
  const { data, items } = useMemo(() => buildCoverageData(policies, currentAge, field), [policies, currentAge, field]);
  const total = items.reduce((s, p) => s + (p[field] || 0), 0);

  if (items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-blue-500" /> {title}
      </h4>

      {/* Slider showing age */}
      <div className="flex items-center gap-3 mb-3 text-sm text-gray-500">
        <span>อายุ {currentAge} ปี</span>
        <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full relative">
          <div className="absolute h-3 w-3 bg-gray-800 dark:bg-white rounded-full -top-1" style={{ left: `${((currentAge - 20) / 80) * 100}%` }} />
        </div>
        <span className="font-semibold text-gray-900 dark:text-gray-100">ทั้งสิ้น</span>
      </div>

      {/* Policy breakdown */}
      <div className="space-y-2 mb-4">
        {items.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-gray-700 dark:text-gray-300">{p.name}</span>
              {p.company && <span className="text-gray-400 text-xs">· {p.company}</span>}
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">{fmtBaht(p[field])}</span>
          </div>
        ))}
        <div className="flex justify-end pt-1 border-t border-gray-100 dark:border-gray-700">
          <span className="font-bold text-gray-900 dark:text-gray-100">{fmtBaht(total)}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="age" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtMoney(v)} tickLine={false} />
            <Tooltip formatter={(v: number) => fmtBaht(v)} labelFormatter={(l) => `อายุ ${l} ปี`} />
            <ReferenceLine x={currentAge} stroke="#374151" strokeDasharray="4 4" label={{ value: `อายุ ${currentAge} ปี`, position: "top", fontSize: 11 }} />
            {items.map((p, i) => (
              <Area key={p.id} type="monotone" dataKey={p.id} stackId="1" fill={CHART_COLORS[i % CHART_COLORS.length]} stroke={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.4} name={p.name} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CashFlowSection({ policies, currentAge }: { policies: Policy[]; currentAge: number }) {
  const [mode, setMode] = useState<"premium" | "cashback" | "total">("premium");
  const data = useMemo(() => buildCashFlowData(policies, currentAge, mode), [policies, currentAge, mode]);
  const hasData = policies.some((p) => p.status === "active" && (p.premiumPerYear > 0 || p.cashBackPerYear > 0 || p.maturityAmount > 0));

  if (!hasData) return null;

  const modeLabels = { premium: "เบี้ยจ่าย/ปี", cashback: "เงินคืน/ปี", total: "เงินก้อนรวม" };
  const modeColors = { premium: "#ef4444", cashback: "#22c55e", total: "#a855f7" };

  // Summary values for current age
  const activePolicies = policies.filter((p) => p.status === "active");
  const premiumTotal = activePolicies.reduce((s, p) => s + p.premiumPerYear, 0);
  const cashBackTotal = activePolicies.reduce((s, p) => s + p.cashBackPerYear, 0);
  const maturityTotal = activePolicies.reduce((s, p) => s + p.maturityAmount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">กระแสเงินสดประกัน</h4>

      <div className="flex items-center gap-3 mb-3 text-sm text-gray-500">
        <span>อายุ {currentAge} ปี</span>
        <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full relative">
          <div className="absolute h-3 w-3 bg-gray-800 dark:bg-white rounded-full -top-1" style={{ left: `${((currentAge - 20) / 80) * 100}%` }} />
        </div>
        <span className="font-semibold text-gray-900 dark:text-gray-100">ทั้งสิ้น</span>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        {(["premium", "cashback", "total"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === m ? "text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
            style={mode === m ? { backgroundColor: modeColors[m] } : undefined}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-xl bg-red-50 dark:bg-red-900/20">
          <p className="text-xs text-gray-500">เบี้ยจ่าย/ปี</p>
          <p className="font-bold text-gray-900 dark:text-gray-100">{fmtBaht(premiumTotal)}</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-green-50 dark:bg-green-900/20">
          <p className="text-xs text-gray-500">เงินคืน/ปี</p>
          <p className="font-bold text-gray-900 dark:text-gray-100">{fmtBaht(cashBackTotal)}</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20">
          <p className="text-xs text-gray-500">เงินก้อนรวม</p>
          <p className="font-bold text-gray-900 dark:text-gray-100">{fmtBaht(maturityTotal)}</p>
        </div>
      </div>

      {/* Policy breakdown for current mode */}
      {mode === "premium" && (
        <div className="space-y-1 mb-4 text-sm">
          {activePolicies.filter((p) => p.premiumPerYear > 0).map((p) => (
            <div key={p.id} className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{p.name} <span className="text-xs text-gray-400">· {p.company || POLICY_TYPE_LABELS[p.type]}</span></span>
              <span className="font-medium">{fmtBaht(p.premiumPerYear)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="age" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtMoney(v)} tickLine={false} />
            <Tooltip formatter={(v: number) => fmtBaht(v)} labelFormatter={(l) => `อายุ ${l} ปี`} />
            <ReferenceLine x={currentAge} stroke="#374151" strokeDasharray="4 4" label={{ value: `อายุ ${currentAge} ปี`, position: "top", fontSize: 11 }} />
            <Area type="monotone" dataKey="value" fill={modeColors[mode]} stroke={modeColors[mode]} fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        ทั้งนี้ = เบี้ยจ่าย/ปี, ทั้งสิ้น = เงินคืน+เงินก้อน-เบี้ย, ทั้งเวลา = เงินก้อนสะสม
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Profile Detail View
// ══════════════════════════════════════════════════════════════════════════

type DetailTab = "policies" | "coverage" | "assess";
type PolicyFilter = "all" | "active" | "surrendered" | "cancelled" | "archived";

function ProfileDetail({
  profile,
  onBack,
  onUpdate,
  onDelete,
}: {
  profile: PolicyProfile;
  onBack: () => void;
  onUpdate: (u: PolicyProfile) => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("policies");
  const [filter, setFilter] = useState<PolicyFilter>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [detailedOpen, setDetailedOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const currentAge = calcAge(profile.birthYear);

  // Computed stats
  const active = profile.policies.filter((p) => p.status === "active");
  const totalSumInsured = active.reduce((s, p) => s + p.sumInsured, 0);
  const totalCI = active.reduce((s, p) => s + p.ciAmount, 0);
  const totalPremium = active.reduce((s, p) => s + p.premiumPerYear, 0);
  const totalTaxDeduction = active.reduce((s, p) => s + p.taxDeduction, 0);

  const statusCounts = useMemo(() => {
    const c: Record<PolicyStatus, number> = { active: 0, surrendered: 0, cancelled: 0, archived: 0 };
    profile.policies.forEach((p) => c[p.status]++);
    return c;
  }, [profile.policies]);

  const filteredPolicies = useMemo(() => {
    if (filter === "all") return profile.policies;
    return profile.policies.filter((p) => p.status === filter);
  }, [profile.policies, filter]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredPolicies.map((p) => p.id)));
    }
    setExpandAll(!expandAll);
  };

  const addPolicy = (p: Omit<Policy, "id">) => {
    onUpdate({ ...profile, policies: [...profile.policies, { id: genId(), ...p }] });
  };

  const updatePolicy = (p: Omit<Policy, "id">) => {
    if (!editingPolicy) return;
    onUpdate({ ...profile, policies: profile.policies.map((x) => (x.id === editingPolicy.id ? { ...x, ...p } : x)) });
    setEditingPolicy(null);
  };

  const deletePolicy = (id: string) => {
    onUpdate({ ...profile, policies: profile.policies.filter((p) => p.id !== id) });
  };

  const tabs: { key: DetailTab; label: string; icon?: string }[] = [
    { key: "policies", label: "กรมธรรม์" },
    { key: "coverage", label: "แผนความคุ้มครอง" },
    { key: "assess", label: "ประเมินชื่อใหม่" },
  ];

  const filterTabs: { key: PolicyFilter; label: string; count: number }[] = [
    { key: "all", label: "ทั้งหมด", count: profile.policies.length },
    { key: "active", label: "มีความคุ้มครอง", count: statusCounts.active },
    { key: "surrendered", label: "เวนคืนแล้ว", count: statusCounts.surrendered },
    { key: "cancelled", label: "ยกเลิกแล้ว", count: statusCounts.cancelled },
    { key: "archived", label: "เก็บถาวร", count: statusCounts.archived },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
        <ArrowLeft className="w-4 h-4" /> กลับ
      </button>

      {/* Profile header card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <User className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{currentAge} ปี · {profile.gender}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={() => setEditOpen(true)} className="text-gray-400 hover:text-gray-600">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setDeleteConfirmOpen(true)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">ทุนชีวิตรวม</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{fmtBaht(totalSumInsured)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500">CI รวม</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{fmtBaht(totalCI)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-500">เบี้ยรวม/ปี</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{fmtBaht(totalPremium)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">ลดหย่อนภาษี</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{fmtBaht(totalTaxDeduction)}</p>
        </div>
      </div>

      {/* Status dots summary */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        {(["active", "surrendered", "cancelled", "archived"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[s]}`} />
            {STATUS_LABELS[s]} {statusCounts[s]}
          </span>
        ))}
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === t.key ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: กรมธรรม์ ──────────────────────────────────────────── */}
      {tab === "policies" && (
        <div>
          {/* Header with buttons */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="w-5 h-5" /> กรมธรรม์
            </h3>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setQuickOpen(true)} className="rounded-full bg-blue-600 hover:bg-blue-700 text-white gap-1">
                <Sparkles className="w-4 h-4" /> บันทึกด่วน
              </Button>
              <Button size="sm" onClick={() => { setEditingPolicy(null); setDetailedOpen(true); }} className="rounded-full bg-green-700 hover:bg-green-800 text-white gap-1">
                <FileText className="w-4 h-4" /> บันทึกละเอียด
              </Button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {filterTabs.map((ft) => (
              <button
                key={ft.key}
                onClick={() => setFilter(ft.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === ft.key ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >
                {ft.label} ({ft.count})
              </button>
            ))}
          </div>

          {/* Expand all */}
          {filteredPolicies.length > 0 && (
            <div className="flex justify-end mb-3">
              <button onClick={toggleExpandAll} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                {expandAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {expandAll ? "ย่อทั้งหมด" : "ขยายทั้งหมด"}
              </button>
            </div>
          )}

          {/* Policy list */}
          {filteredPolicies.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีกรมธรรม์ในหมวดนี้</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPolicies.map((policy) => {
                const expanded = expandedIds.has(policy.id);
                return (
                  <div key={policy.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => toggleExpand(policy.id)}>
                      <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center mt-0.5 shrink-0">
                        <Shield className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE_STYLES[policy.status]}`}>
                            {STATUS_LABELS[policy.status]}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                            {POLICY_TYPE_LABELS[policy.type]}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{policy.name}</p>
                        {policy.company && <p className="text-sm text-gray-500">{policy.company}</p>}
                        {policy.notes && <p className="text-sm text-green-600 dark:text-green-400">{policy.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900 dark:text-gray-100">{fmtBaht(policy.premiumPerYear)}</p>
                        <p className="text-xs text-gray-500">ราย ปี</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 mt-1 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-sm">
                          {policy.sumInsured > 0 && <div><span className="text-gray-500">ทุนชีวิต</span><p className="font-medium">{fmtBaht(policy.sumInsured)}</p></div>}
                          {policy.ciAmount > 0 && <div><span className="text-gray-500">CI</span><p className="font-medium">{fmtBaht(policy.ciAmount)}</p></div>}
                          {policy.medicalCoverage > 0 && <div><span className="text-gray-500">ค่ารักษา</span><p className="font-medium">{fmtBaht(policy.medicalCoverage)}</p></div>}
                          {policy.paAmount > 0 && <div><span className="text-gray-500">PA</span><p className="font-medium">{fmtBaht(policy.paAmount)}</p></div>}
                          {policy.taxDeduction > 0 && <div><span className="text-gray-500">ลดหย่อนภาษี</span><p className="font-medium">{fmtBaht(policy.taxDeduction)}</p></div>}
                          <div><span className="text-gray-500">คุ้มครอง</span><p className="font-medium">อายุ {policy.startAge}-{policy.coverageEndAge} ปี</p></div>
                          <div><span className="text-gray-500">จ่ายเบี้ยถึง</span><p className="font-medium">อายุ {policy.paymentEndAge} ปี</p></div>
                          {policy.cashBackPerYear > 0 && <div><span className="text-gray-500">เงินคืน/ปี</span><p className="font-medium">{fmtBaht(policy.cashBackPerYear)}</p></div>}
                          {policy.maturityAmount > 0 && <div><span className="text-gray-500">เงินก้อนครบสัญญา</span><p className="font-medium">{fmtBaht(policy.maturityAmount)}</p></div>}
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={(e) => { e.stopPropagation(); setEditingPolicy(policy); setDetailedOpen(true); }}>
                            <Pencil className="w-3 h-3 mr-1" /> แก้ไข
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full text-xs text-red-500 hover:text-red-600 border-red-200" onClick={(e) => { e.stopPropagation(); deletePolicy(policy.id); }}>
                            <Trash2 className="w-3 h-3 mr-1" /> ลบ
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: แผนความคุ้มครอง ───────────────────────────────────── */}
      {tab === "coverage" && (
        <div className="space-y-6">
          <CoverageSection title="ทุนประกันชีวิต" policies={profile.policies} currentAge={currentAge} field="sumInsured" chartColor="#22c55e" />
          <CoverageSection title="ค่ารักษาพยาบาล" policies={profile.policies} currentAge={currentAge} field="medicalCoverage" chartColor="#3b82f6" />
          <CoverageSection title="โรคร้ายแรง (CI)" policies={profile.policies} currentAge={currentAge} field="ciAmount" chartColor="#a855f7" />
          <CoverageSection title="อุบัติเหตุ (PA)" policies={profile.policies} currentAge={currentAge} field="paAmount" chartColor="#f59e0b" />
          <CashFlowSection policies={profile.policies} currentAge={currentAge} />

          {active.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>เพิ่มกรมธรรม์เพื่อดูแผนความคุ้มครอง</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: ประเมินชื่อใหม่ ───────────────────────────────────── */}
      {tab === "assess" && (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium mb-1">ประเมินชื่อใหม่</p>
          <p className="text-sm">ฟีเจอร์นี้กำลังพัฒนา</p>
        </div>
      )}

      {/* Dialogs */}
      <ProfileDialog open={editOpen} onOpenChange={setEditOpen} initial={profile} onSave={(d) => onUpdate({ ...profile, ...d })} />
      <QuickPolicyDialog open={quickOpen} onOpenChange={setQuickOpen} onSave={addPolicy} />
      <DetailedPolicyDialog
        open={detailedOpen}
        onOpenChange={(v) => { setDetailedOpen(v); if (!v) setEditingPolicy(null); }}
        initial={editingPolicy}
        onSave={editingPolicy ? updatePolicy : addPolicy}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>ลบโปรไฟล์?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">ต้องการลบโปรไฟล์ &quot;{profile.name}&quot; และกรมธรรม์ทั้งหมดหรือไม่?</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteConfirmOpen(false)}>ยกเลิก</Button>
            <Button className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={() => { onDelete(); setDeleteConfirmOpen(false); }}>ลบ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════

export default function PolicySummaryPage() {
  const [profiles, setProfiles] = useState<PolicyProfile[]>(loadProfiles);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => { saveProfiles(profiles); }, [profiles]);

  const filtered = useMemo(() => profiles.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())), [profiles, search]);
  const selectedProfile = useMemo(() => profiles.find((p) => p.id === selectedId) ?? null, [profiles, selectedId]);

  const handleAdd = useCallback((d: { name: string; birthYear: number; gender: "ชาย" | "หญิง"; notes: string }) => {
    setProfiles((prev) => [...prev, { id: genId(), ...d, policies: [] }]);
  }, []);

  const handleUpdate = useCallback((u: PolicyProfile) => {
    setProfiles((prev) => prev.map((p) => (p.id === u.id ? u : p)));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setSelectedId(null);
  }, []);

  if (selectedProfile) {
    return (
      <ProfileDetail
        profile={selectedProfile}
        onBack={() => setSelectedId(null)}
        onUpdate={handleUpdate}
        onDelete={() => handleDelete(selectedProfile.id)}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาโปรไฟล์..." className="pl-10 rounded-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-12" />
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-full bg-green-700 hover:bg-green-800 text-white h-12 px-5 gap-2 shrink-0">
          <Plus className="w-5 h-5" /> โปรไฟล์
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{search ? "ไม่พบโปรไฟล์ที่ค้นหา" : 'ยังไม่มีโปรไฟล์ กด "+ โปรไฟล์" เพื่อเพิ่ม'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} onClick={() => setSelectedId(profile.id)} />
          ))}
        </div>
      )}

      <ProfileDialog open={addOpen} onOpenChange={setAddOpen} onSave={handleAdd} />
    </div>
  );
}
