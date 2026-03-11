import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const profileQuery = trpc.profile.get.useQuery();
  const upsertMutation = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      toast.success("บันทึกข้อมูลสำเร็จ");
      profileQuery.refetch();
    },
    onError: (err) => {
      toast.error("เกิดข้อผิดพลาด: " + err.message);
    },
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    agentCode: "",
    phone: "",
    status: "active",
  });

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        firstName: profileQuery.data.firstName || "",
        lastName: profileQuery.data.lastName || "",
        nickname: profileQuery.data.nickname || "",
        agentCode: profileQuery.data.agentCode || "",
        phone: profileQuery.data.phone || "",
        status: profileQuery.data.status || "active",
      });
    }
  }, [profileQuery.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(form);
  };

  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">ข้อมูลส่วนตัว</CardTitle>
              <CardDescription>
                กรอกข้อมูลส่วนตัวของคุณ ({user?.email})
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">ชื่อ</Label>
                <Input
                  id="firstName"
                  placeholder="ชื่อจริง"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">นามสกุล</Label>
                <Input
                  id="lastName"
                  placeholder="นามสกุล"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">ชื่อเล่น</Label>
                <Input
                  id="nickname"
                  placeholder="ชื่อเล่น"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentCode">รหัสตัวแทน</Label>
                <Input
                  id="agentCode"
                  placeholder="เช่น 696780"
                  value={form.agentCode}
                  onChange={(e) => setForm({ ...form, agentCode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทรติดต่อ</Label>
                <Input
                  id="phone"
                  placeholder="0xx-xxx-xxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">สถานะ</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              บันทึกข้อมูล
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
