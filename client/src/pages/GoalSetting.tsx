import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Target, Clock, TrendingUp, Users, Calendar, CheckCircle2, Circle } from "lucide-react";

// ─── Goal Definitions ─────────────────────────────────────────────────────────
type GoalKey =
  | "CAREER_AGENT"
  | "VIETNAM_TRIP"
  | "MDRT"
  | "PREMIER_ADVISOR"
  | "ELITE_ADVISOR"
  | "AIA_CONVENTION"
  | "OTHERS";

type Goal = {
  key: GoalKey;
  label: string;
  shortLabel: string;
  fyp: number;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  requirements: string[];
};

const GOALS: Goal[] = [
  {
    key: "CAREER_AGENT",
    label: "Career Agent",
    shortLabel: "Career Agent",
    fyp: 240000,
    color: "emerald",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-400 dark:border-emerald-600",
    textColor: "text-emerald-700 dark:text-emerald-400",
    requirements: ["Active 9/12", "9 Cases", "Top FYC 240,000", "LIMRA 80%"],
  },
  {
    key: "VIETNAM_TRIP",
    label: "New Agent Vietnam Trip",
    shortLabel: "Vietnam Trip",
    fyp: 650000,
    color: "blue",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-400 dark:border-blue-600",
    textColor: "text-blue-700 dark:text-blue-400",
    requirements: ["FYP 650,000", "Rider FYP 65,000", "10 Cases"],
  },
  {
    key: "MDRT",
    label: "MDRT / COT / TOT",
    shortLabel: "MDRT",
    fyp: 1964400,
    color: "violet",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-400 dark:border-violet-600",
    textColor: "text-violet-700 dark:text-violet-400",
    requirements: ["FYP 1,964,400 or FYC 982,000"],
  },
  {
    key: "PREMIER_ADVISOR",
    label: "Premier Advisor",
    shortLabel: "Premier",
    fyp: 450000,
    color: "amber",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-400 dark:border-amber-600",
    textColor: "text-amber-700 dark:text-amber-400",
    requirements: [
      "Qualified MDRT & Career Agent",
      "10% Repurchase or 10 Cases",
      "12 Cases",
      "LIMRA 85%",
      "Vitality FYP 450,000",
      "IC License",
    ],
  },
  {
    key: "ELITE_ADVISOR",
    label: "Elite Advisor",
    shortLabel: "Elite",
    fyp: 500000,
    color: "orange",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-400 dark:border-orange-600",
    textColor: "text-orange-700 dark:text-orange-400",
    requirements: ["Prestige Product FYP 500,000"],
  },
  {
    key: "AIA_CONVENTION",
    label: "AIA Annual Convention",
    shortLabel: "Convention",
    fyp: 3600000,
    color: "red",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-400 dark:border-red-600",
    textColor: "text-red-700 dark:text-red-400",
    requirements: ["FYP 3,600,000 (Rider FYP 540,000)", "20 Cases", "LIMRA 85%"],
  },
  {
    key: "OTHERS",
    label: "Others",
    shortLabel: "Others",
    fyp: 0,
    color: "slate",
    bgColor: "bg-slate-50 dark:bg-slate-900/30",
    borderColor: "border-slate-300 dark:border-slate-600",
    textColor: "text-slate-600 dark:text-slate-400",
    requirements: ["กำหนดเป้าหมายเอง"],
  },
];

// ─── Time Calculation ─────────────────────────────────────────────────────────
function useTimeRemaining() {
  const now = new Date();
  const deadline = new Date("2026-12-31T23:59:59");
  const remainingMs = deadline.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24)));
  const remainingWeeks = Math.max(1, Math.ceil(remainingDays / 7));
  const remainingMonths = Math.max(0, Math.floor(remainingDays / 30.44));
  const progressPct = Math.round(((365 - remainingDays) / 365) * 100);
  return { remainingDays, remainingWeeks, remainingMonths, progressPct };
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString("th-TH");
}

// ─── Funnel Row ───────────────────────────────────────────────────────────────
function FunnelRow({
  icon: Icon,
  label,
  weekly,
  total,
  color,
  width,
  unit = "ครั้ง",
}: {
  icon: React.ElementType;
  label: string;
  weekly: number;
  total: number;
  color: string;
  width: string;
  unit?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${width} mx-auto rounded-xl py-3 px-4 flex items-center justify-between gap-3 ${color} transition-all duration-300`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="text-sm font-semibold truncate">{label}</span>
        </div>
          <div className="text-right shrink-0">
          <div className="text-xl font-black leading-none">{weekly} <span className="text-sm font-semibold">{unit}</span></div>
          <div className="text-[10px] opacity-70">/ สัปดาห์</div>
        </div>
      </div>

    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GoalSetting() {
  const { remainingDays, remainingWeeks, remainingMonths, progressPct } = useTimeRemaining();

  const [selectedGoal, setSelectedGoal] = useState<GoalKey>("MDRT");
  const [customFYP, setCustomFYP] = useState(2000000);
  const [avgCaseSize, setAvgCaseSize] = useState(80000);
  const [prospectToAppt, setProspectToAppt] = useState(50); // %
  const [apptToPres, setApptToPres] = useState(70); // %
  const [presToClose, setPresToClose] = useState(30); // %

  const goal = GOALS.find((g) => g.key === selectedGoal)!;
  const targetFYP = selectedGoal === "OTHERS" ? customFYP : goal.fyp;

  // ─── Core Calculation ─────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const safeCaseSize = Math.max(1, avgCaseSize);
    const pClose = presToClose / 100;
    const pAppt = apptToPres / 100;
    const pProspect = prospectToAppt / 100;

    const totalCases = targetFYP / safeCaseSize;
    const totalPres = totalCases / Math.max(0.01, pClose);
    const totalAppt = totalPres / Math.max(0.01, pAppt);
    const totalProspects = totalAppt / Math.max(0.01, pProspect);

    return {
      totalCases: Math.ceil(totalCases),
      totalPres: Math.ceil(totalPres),
      totalAppt: Math.ceil(totalAppt),
      totalProspects: Math.ceil(totalProspects),
      weeklyCases: Math.ceil(totalCases / remainingWeeks),
      weeklyPres: Math.ceil(totalPres / remainingWeeks),
      weeklyAppt: Math.ceil(totalAppt / remainingWeeks),
      weeklyProspects: Math.ceil(totalProspects / remainingWeeks),
    };
  }, [targetFYP, avgCaseSize, presToClose, apptToPres, prospectToAppt, remainingWeeks]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Goal Setting</h1>
        <p className="text-sm text-muted-foreground mt-1">
          แผนการทำงานรายสัปดาห์ คำนวณจากเวลาที่เหลือจริง
        </p>
      </div>

      {/* ── Countdown Banner ─────────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3 opacity-70">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-widest">เวลาที่เหลือในปี 2026</span>
          </div>
          <div className="flex items-end gap-6 flex-wrap">
            <div>
              <div className="text-5xl font-black tabular-nums leading-none">{remainingDays}</div>
              <div className="text-sm opacity-60 mt-1">วัน</div>
            </div>
            <div className="pb-1 opacity-40 text-2xl font-thin">/</div>
            <div>
              <div className="text-5xl font-black tabular-nums leading-none">{remainingWeeks}</div>
              <div className="text-sm opacity-60 mt-1">สัปดาห์</div>
            </div>
            <div className="pb-1 opacity-40 text-2xl font-thin">/</div>
            <div>
              <div className="text-5xl font-black tabular-nums leading-none">{remainingMonths}</div>
              <div className="text-sm opacity-60 mt-1">เดือน</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[11px] opacity-50 mb-1">
              <span>ม.ค. 2026</span>
              <span>ผ่านมาแล้ว {progressPct}%</span>
              <span>ธ.ค. 2026</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Goal Selector ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            เลือกเป้าหมาย
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {GOALS.map((g) => {
            const isSelected = selectedGoal === g.key;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setSelectedGoal(g.key)}
                className={`w-full text-left rounded-xl border-2 p-3 transition-all duration-200 ${
                  isSelected
                    ? `${g.bgColor} ${g.borderColor}`
                    : "border-border bg-transparent hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className={`h-5 w-5 ${g.textColor}`} />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm ${isSelected ? g.textColor : ""}`}>
                      {g.label}
                    </div>
                    {g.fyp > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        FYP เป้าหมาย: {fmt(g.fyp)} บาท
                      </div>
                    )}
                    {g.requirements.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {g.requirements.map((r) => (
                          <li key={r} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-current shrink-0 opacity-50" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {g.fyp > 0 && (
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[11px] ${isSelected ? `${g.textColor} border-current` : ""}`}
                    >
                      {fmt(g.fyp)}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}

          {/* Custom FYP input for OTHERS */}
          {selectedGoal === "OTHERS" && (
            <div className="mt-3 p-3 rounded-xl border bg-muted/30">
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                กำหนด FYP เป้าหมายเอง (บาท)
              </label>
              <input
                type="number"
                value={customFYP}
                onChange={(e) => setCustomFYP(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono"
                step={10000}
                min={0}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Engine: Inputs ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            ปรับตัวแปร
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Average Case Size */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Average Case Size</label>
              <span className="text-sm font-bold tabular-nums">{fmt(avgCaseSize)} บาท</span>
            </div>
            <Slider
              min={10000}
              max={500000}
              step={5000}
              value={[avgCaseSize]}
              onValueChange={([v]) => setAvgCaseSize(v)}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>10,000</span>
              <span>500,000</span>
            </div>
          </div>

          {/* Conversion Rates */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Conversion Rates
            </div>

            {/* Prospect → Appt */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Prospect → นัดพบ</label>
                <span className="text-sm font-bold">{prospectToAppt}%</span>
              </div>
              <Slider
                min={5}
                max={100}
                step={5}
                value={[prospectToAppt]}
                onValueChange={([v]) => setProspectToAppt(v)}
              />
            </div>

            {/* Appt → Presentation */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">นัดพบ → นำเสนอ</label>
                <span className="text-sm font-bold">{apptToPres}%</span>
              </div>
              <Slider
                min={5}
                max={100}
                step={5}
                value={[apptToPres]}
                onValueChange={([v]) => setApptToPres(v)}
              />
            </div>

            {/* Presentation → Close */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">นำเสนอ → ปิดการขาย</label>
                <span className="text-sm font-bold">{presToClose}%</span>
              </div>
              <Slider
                min={5}
                max={100}
                step={5}
                value={[presToClose]}
                onValueChange={([v]) => setPresToClose(v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Dynamic Funnel Output ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Action Plan
            <Badge variant="secondary" className="ml-auto text-xs">
              {remainingWeeks} สัปดาห์ที่เหลือ
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            เป้าหมาย FYP: <span className="font-bold text-foreground">{fmt(targetFYP)} บาท</span>
            {" · "}Case เฉลี่ย: <span className="font-bold text-foreground">{fmt(avgCaseSize)} บาท</span>
          </p>
        </CardHeader>
        <CardContent>
          {/* Funnel visualization — widest at top, narrowest at bottom */}
          <div className="space-y-2">
            <FunnelRow
              icon={Users}
              label="หาผู้มุ่งหวัง (Prospects)"
              weekly={calc.weeklyProspects}
              total={calc.totalProspects}
              color="bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100"
              width="w-full"
              unit="คน"
            />
            <FunnelRow
              icon={Calendar}
              label="นัดพบ (Appointments)"
              weekly={calc.weeklyAppt}
              total={calc.totalAppt}
              color="bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100"
              width="w-[88%]"
              unit="คน"
            />
            <FunnelRow
              icon={TrendingUp}
              label="นำเสนอ (Presentations)"
              weekly={calc.weeklyPres}
              total={calc.totalPres}
              color="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
              width="w-[74%]"
              unit="คน"
            />
            <FunnelRow
              icon={Target}
              label="ปิดการขาย (Cases)"
              weekly={calc.weeklyCases}
              total={calc.totalCases}
              color="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
              width="w-[60%]"
              unit="เคส"
            />
          </div>

          {/* Summary strip */}
          <div className="mt-5 p-3 rounded-xl bg-muted/40 text-center">
            <div className="text-xs text-muted-foreground mb-1">FYP ที่ต้องทำต่อสัปดาห์</div>
            <div className="text-2xl font-black">
              {fmt(Math.ceil(targetFYP / remainingWeeks))} บาท
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ≈ {fmt(Math.ceil(targetFYP / remainingWeeks / 30))} บาท / วัน
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
