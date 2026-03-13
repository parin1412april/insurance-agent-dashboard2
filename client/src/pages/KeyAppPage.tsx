import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
  TrendingUp,
  Link2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const POLICY_DELIVERY_LABELS: Record<string, string> = {
  e_document: "เอกสารอิเล็กทรอนิกส์",
  paper_customer: "กระดาษ (ส่งลูกค้า)",
  paper_agent: "กระดาษ (ส่งตัวแทน)",
};
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  qr_transfer: "QR / โอนเงิน",
  credit_debit: "บัตรเครดิต/เดบิต",
};
const BENEFIT_PAYMENT_LABELS: Record<string, string> = {
  bank_account: "บัญชีธนาคาร",
  promptpay: "พร้อมเพย์",
};
const MARITAL_LABELS: Record<string, string> = {
  single: "โสด",
  married: "สมรส",
  divorced: "หย่าร้าง",
  widowed: "หม้าย",
};

function formatDate(ts: Date | string | null | undefined) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground text-sm w-44 shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground break-all">{value ?? "-"}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-primary mt-4 mb-1 uppercase tracking-wide">{children}</h3>
  );
}

export default function KeyAppPage() {
  useAuth();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const utils = trpc.useUtils();

  // Get agent profile to build the form link
  const profileQuery = trpc.profile.get.useQuery();
  const agentCode = profileQuery.data?.agentCode || "";
  const formLink = agentCode
    ? `${window.location.origin}/form/${agentCode}`
    : null;

  const statsQuery = trpc.insurance.stats.useQuery();
  const listQuery = trpc.insurance.list.useQuery(
    { page, limit: 20, search: search || undefined },
    {}
  );
  const detailQuery = trpc.insurance.detail.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null }
  );
  const deleteMutation = trpc.insurance.delete.useMutation({
    onSuccess: () => {
      toast.success("ลบข้อมูลเรียบร้อยแล้ว");
      setDeleteId(null);
      utils.insurance.list.invalidate();
      utils.insurance.stats.invalidate();
    },
    onError: (e) => toast.error(e.message || "ลบไม่สำเร็จ"),
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleCopyLink = () => {
    if (!formLink) return;
    navigator.clipboard.writeText(formLink).then(() => {
      setLinkCopied(true);
      toast.success("คัดลอก link แล้ว");
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const { items = [], total = 0, totalPages = 0 } = listQuery.data ?? {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">ข้อมูล KeyApp</h1>
        <p className="text-muted-foreground text-sm mt-1">
          รายการข้อมูลลูกค้าที่กรอกผ่าน link ของคุณ
        </p>
      </div>

      {/* Form Link Banner */}
      {agentCode ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Link2 className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground shrink-0">Link ของคุณ:</span>
            <span className="text-sm font-medium text-primary truncate">{formLink}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="shrink-0 gap-2"
          >
            {linkCopied ? (
              <><CheckCircle2 className="h-4 w-4 text-green-500" /> คัดลอกแล้ว</>
            ) : (
              <><Copy className="h-4 w-4" /> คัดลอก Link</>
            )}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
          กรุณากรอกรหัสตัวแทนในหน้า <strong>ข้อมูลส่วนตัว</strong> ก่อน เพื่อสร้าง link ส่งให้ลูกค้า
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">รายการทั้งหมด</p>
            <p className="text-2xl font-bold">{statsQuery.data?.total ?? 0}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-500/10 p-2">
            <CalendarDays className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">รายการวันนี้</p>
            <p className="text-2xl font-bold">{statsQuery.data?.today ?? 0}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">จำนวนหน้า</p>
            <p className="text-2xl font-bold">{totalPages}</p>
          </div>
        </div>
      </div>

      {/* Search + Refresh */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร, รหัสอ้างอิง..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} variant="outline">ค้นหา</Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => utils.insurance.list.invalidate()}
          disabled={listQuery.isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${listQuery.isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">รหัสอ้างอิง</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ชื่อ-นามสกุล</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">เบอร์โทร</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">อีเมล</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">วันที่กรอก</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    กำลังโหลด...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-mono text-xs">{item.submissionRef}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {item.prefix}{item.firstName} {item.lastName}
                      {item.nickname && <span className="text-muted-foreground text-xs ml-1">({item.nickname})</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{item.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{item.email}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setSelectedId(item.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
            <span className="text-sm text-muted-foreground">
              แสดง {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} จาก {total} รายการ
            </span>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              รายละเอียดข้อมูล
              {detailQuery.data && (
                <Badge variant="outline" className="font-mono text-xs ml-1">
                  {detailQuery.data.submissionRef}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              กำลังโหลด...
            </div>
          ) : detailQuery.data ? (
            <div className="space-y-1">
              <SectionTitle>ข้อมูลส่วนตัว</SectionTitle>
              <DetailRow label="คำนำหน้า" value={detailQuery.data.prefix} />
              <DetailRow label="ชื่อ" value={detailQuery.data.firstName} />
              <DetailRow label="นามสกุล" value={detailQuery.data.lastName} />
              <DetailRow label="ชื่อเล่น" value={detailQuery.data.nickname} />
              <DetailRow label="เบอร์โทรศัพท์" value={detailQuery.data.phone} />
              <DetailRow label="อีเมล" value={detailQuery.data.email} />
              <DetailRow label="อาชีพ" value={detailQuery.data.occupation} />
              <DetailRow label="ตำแหน่ง" value={detailQuery.data.position} />
              <DetailRow label="ส่วนสูง (ซม.)" value={detailQuery.data.height} />
              <DetailRow label="น้ำหนัก (กก.)" value={detailQuery.data.weight} />
              <DetailRow label="รายได้ต่อปี (บาท)" value={Number(detailQuery.data.annualIncome).toLocaleString("th-TH")} />
              <DetailRow label="สถานภาพสมรส" value={MARITAL_LABELS[detailQuery.data.maritalStatus] ?? detailQuery.data.maritalStatus} />
              {detailQuery.data.maritalStatus === "married" && (
                <>
                  <DetailRow label="ชื่อคู่สมรส" value={`${detailQuery.data.spouseFirstName ?? ""} ${detailQuery.data.spouseLastName ?? ""}`.trim()} />
                  <DetailRow label="วันเกิดคู่สมรส" value={detailQuery.data.spouseBirthDate} />
                </>
              )}

              <SectionTitle>บัตรประชาชน</SectionTitle>
              <DetailRow label="สถานะบัตร" value={detailQuery.data.idCardStatus === "sent" ? "ส่งแล้ว" : "ยังไม่ส่ง"} />
              {detailQuery.data.idCardImageUrl && (
                <div className="py-2">
                  <p className="text-muted-foreground text-sm mb-1">รูปบัตรประชาชน</p>
                  <img
                    src={detailQuery.data.idCardImageUrl}
                    alt="ID Card"
                    className="rounded-lg max-h-48 object-contain border"
                  />
                </div>
              )}

              <SectionTitle>ที่อยู่</SectionTitle>
              <DetailRow label="ใช้ที่อยู่ตามบัตร" value={detailQuery.data.useIdCardAddress ? "ใช่" : "ไม่ใช่"} />
              {!detailQuery.data.useIdCardAddress && (
                <>
                  <DetailRow label="ที่อยู่" value={detailQuery.data.addressLine} />
                  <DetailRow label="แขวง/ตำบล" value={detailQuery.data.subDistrict} />
                  <DetailRow label="เขต/อำเภอ" value={detailQuery.data.district} />
                  <DetailRow label="จังหวัด" value={detailQuery.data.province} />
                  <DetailRow label="รหัสไปรษณีย์" value={detailQuery.data.postalCode} />
                </>
              )}

              <SectionTitle>การชำระเงินและรับกรมธรรม์</SectionTitle>
              <DetailRow label="วิธีรับผลประโยชน์" value={BENEFIT_PAYMENT_LABELS[detailQuery.data.benefitPaymentMethod] ?? detailQuery.data.benefitPaymentMethod} />
              {detailQuery.data.benefitPaymentMethod === "bank_account" && (
                <>
                  <DetailRow label="ธนาคาร" value={detailQuery.data.bankName} />
                  <DetailRow label="เลขบัญชี" value={detailQuery.data.bankAccountNumber} />
                </>
              )}
              <DetailRow label="รูปแบบรับกรมธรรม์" value={POLICY_DELIVERY_LABELS[detailQuery.data.policyDelivery] ?? detailQuery.data.policyDelivery} />
              <DetailRow label="วิธีชำระเบี้ย" value={PAYMENT_METHOD_LABELS[detailQuery.data.paymentMethod] ?? detailQuery.data.paymentMethod} />

              <SectionTitle>ประกันที่มีอยู่</SectionTitle>
              <DetailRow label="มีประกันอยู่แล้ว" value={detailQuery.data.hasExistingInsurance ? "ใช่" : "ไม่มี"} />
              {detailQuery.data.hasExistingInsurance && (
                <>
                  <DetailRow label="บริษัทประกัน" value={detailQuery.data.existingInsuranceCompany} />
                  <DetailRow label="ประกันชีวิต" value={detailQuery.data.hasLifeInsurance ? "มี" : "ไม่มี"} />
                  <DetailRow label="โรคร้ายแรง" value={detailQuery.data.hasCriticalIllness ? "มี" : "ไม่มี"} />
                  <DetailRow label="อุบัติเหตุ" value={detailQuery.data.hasAccidentRider ? "มี" : "ไม่มี"} />
                  <DetailRow label="ค่ารักษาพยาบาล" value={detailQuery.data.hasHospitalDaily ? "มี" : "ไม่มี"} />
                  <DetailRow label="สถานะกรมธรรม์" value={detailQuery.data.existingPolicyActive === "active" ? "ยังมีผล" : "หมดอายุ"} />
                </>
              )}
              <DetailRow label="เคยถูกปฏิเสธ" value={detailQuery.data.wasPreviouslyRejected ? "ใช่" : "ไม่เคย"} />
              {detailQuery.data.wasPreviouslyRejected && (
                <>
                  <DetailRow label="บริษัทที่ปฏิเสธ" value={detailQuery.data.rejectedCompany} />
                  <DetailRow label="เหตุผล" value={detailQuery.data.rejectedReason} />
                  <DetailRow label="วันที่" value={detailQuery.data.rejectedDate} />
                </>
              )}

              {detailQuery.data.beneficiaries && detailQuery.data.beneficiaries.length > 0 && (
                <>
                  <SectionTitle>ผู้รับผลประโยชน์</SectionTitle>
                  {detailQuery.data.beneficiaries.map((b, i) => (
                    <div key={b.id} className="rounded-lg border bg-muted/20 p-3 mb-2">
                      <p className="text-sm font-semibold mb-1">ผู้รับที่ {i + 1}</p>
                      <DetailRow label="ชื่อ-นามสกุล" value={`${b.prefix}${b.firstName} ${b.lastName}`} />
                      <DetailRow label="ความสัมพันธ์" value={b.relationship} />
                      <DetailRow label="อายุ" value={`${b.age} ปี`} />
                      <DetailRow label="ร้อยละ" value={`${b.percentage}%`} />
                    </div>
                  ))}
                </>
              )}

              <SectionTitle>ข้อมูลระบบ</SectionTitle>
              <DetailRow label="วันที่กรอก" value={formatDate(detailQuery.data.createdAt)} />
              <DetailRow label="รหัสตัวแทน" value={detailQuery.data.agentCode} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบข้อมูลรายการนี้ใช่ไหม? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
