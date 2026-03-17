"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

type DriverProfile = {
    id: string;
    fullName: string;
    phone: string;
    city?: string | null;
    status: string;
    ratingAvg: number;
    ratingCount: number;
};

type Vehicle = {
    id: string;
    plateNumber: string;
    make?: string | null;
    model?: string | null;
    year?: number | null;
    color?: string | null;
};

type DriverDocument = {
    id: string;
    type: string;
    status: string;
    fileUrl: string;
    createdAt: string;
};

const docTypes = [
    { value: "ID_CARD", label: "الهوية الوطنية" },
    { value: "LICENSE", label: "رخصة القيادة" },
    { value: "VEHICLE_REG", label: "ترخيص المركبة" },
    { value: "INSURANCE", label: "تأمين المركبة" },
    { value: "SELFIE", label: "صورة شخصية" },
];

export default function DriverProfilePage() {
    const { addToast } = useToast();
    const [profile, setProfile] = useState<DriverProfile | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [documents, setDocuments] = useState<DriverDocument[]>([]);
    const [loading, setLoading] = useState(true);

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");

    const [vehicleForm, setVehicleForm] = useState({ plateNumber: "", make: "", model: "", year: "", color: "" });
    const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

    const [docType, setDocType] = useState(docTypes[0].value);
    const [uploading, setUploading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [profileRes, vehiclesRes, documentsRes] = await Promise.all([
                fetch("/api/driver/me", { cache: "no-store" }),
                fetch("/api/driver/vehicles", { cache: "no-store" }),
                fetch("/api/driver/documents", { cache: "no-store" }),
            ]);

            const profileJson = await profileRes.json();
            if (profileRes.ok && profileJson.driver) {
                setProfile(profileJson.driver);
                setFullName(profileJson.driver.fullName || "");
                setPhone(profileJson.driver.phone || "");
                setCity(profileJson.driver.city || "");
            }

            const vehiclesJson = await vehiclesRes.json();
            if (vehiclesRes.ok) setVehicles(vehiclesJson.vehicles || []);

            const documentsJson = await documentsRes.json();
            if (documentsRes.ok) setDocuments(documentsJson.documents || []);
        } catch (error) {
            console.error("Driver profile fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleProfileSave = async () => {
        const response = await fetch("/api/driver/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, phone, city }),
        });
        const result = await response.json();
        if (!response.ok) {
            addToast(result.error || "تعذر حفظ البيانات", "error");
            return;
        }
        addToast("تم تحديث بيانات السائق", "success");
        fetchData();
    };

    const handleVehicleSave = async () => {
        if (!vehicleForm.plateNumber) {
            addToast("رقم اللوحة مطلوب", "warning");
            return;
        }

        const payload = {
            plateNumber: vehicleForm.plateNumber,
            make: vehicleForm.make || undefined,
            model: vehicleForm.model || undefined,
            year: vehicleForm.year ? Number(vehicleForm.year) : undefined,
            color: vehicleForm.color || undefined,
        };

        const response = await fetch(editingVehicleId ? `/api/driver/vehicles/${editingVehicleId}` : "/api/driver/vehicles", {
            method: editingVehicleId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
            addToast(result.error || "تعذر حفظ المركبة", "error");
            return;
        }
        addToast(editingVehicleId ? "تم تحديث المركبة" : "تم إضافة المركبة", "success");
        setVehicleForm({ plateNumber: "", make: "", model: "", year: "", color: "" });
        setEditingVehicleId(null);
        fetchData();
    };

    const handleVehicleEdit = (vehicle: Vehicle) => {
        setEditingVehicleId(vehicle.id);
        setVehicleForm({
            plateNumber: vehicle.plateNumber,
            make: vehicle.make || "",
            model: vehicle.model || "",
            year: vehicle.year ? String(vehicle.year) : "",
            color: vehicle.color || "",
        });
    };

    const handleVehicleDelete = async (vehicleId: string) => {
        await fetch(`/api/driver/vehicles/${vehicleId}`, { method: "DELETE" });
        addToast("تم حذف المركبة", "success");
        fetchData();
    };

    const hashString = async (value: string) => {
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(value);
        const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
        return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    };

    const handleDocUpload = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
            const uploadJson = await uploadRes.json();
            if (!uploadRes.ok || !uploadJson.success) {
                addToast(uploadJson.error || "فشل رفع الملف", "error");
                return;
            }

            const fileUrl = uploadJson.url;
            const fileSha256 = await hashString(fileUrl);

            const docRes = await fetch("/api/driver/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: docType, fileUrl, fileSha256 }),
            });
            const docJson = await docRes.json();
            if (!docRes.ok) {
                addToast(docJson.error || "تعذر رفع المستند", "error");
                return;
            }
            addToast("تم رفع المستند", "success");
            fetchData();
        } catch (error) {
            console.error("Doc upload error:", error);
            addToast("تعذر رفع المستند", "error");
        } finally {
            setUploading(false);
        }
    };

    const statusMeta = useMemo(() => {
        if (!profile) return { label: "--", color: "text-slate-400", bg: "bg-slate-500/10" };
        const map: Record<string, { label: string; color: string; bg: string }> = {
            PENDING: { label: "قيد التقديم", color: "text-amber-400", bg: "bg-amber-500/10" },
            UNDER_REVIEW: { label: "قيد المراجعة", color: "text-blue-400", bg: "bg-blue-500/10" },
            VERIFIED: { label: "موثق", color: "text-emerald-400", bg: "bg-emerald-500/10" },
            ACTIVE: { label: "نشط", color: "text-emerald-400", bg: "bg-emerald-500/10" },
            SUSPENDED: { label: "موقوف", color: "text-red-400", bg: "bg-red-500/10" },
        };
        return map[profile.status] || map.PENDING;
    }, [profile]);

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="حساب السائق" />

            <main className="flex-1 p-4 pb-24 space-y-6">
                <section className="bg-surface-dark border border-slate-800 rounded-3xl p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-slate-500">الملف الشخصي</p>
                            <p className="text-lg font-bold text-white">{profile?.fullName || "--"}</p>
                            <p className="text-xs text-slate-400 font-english">{profile?.phone || "--"}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-full ${statusMeta.bg} ${statusMeta.color} font-bold`}>
                            {statusMeta.label}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="الاسم الكامل"
                            className="bg-bg-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                        />
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="رقم الهاتف"
                            className="bg-bg-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                        />
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="المدينة"
                            className="bg-bg-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        <button onClick={handleProfileSave} className="bg-primary text-white text-xs font-bold rounded-xl px-4 py-2">حفظ التعديلات</button>
                        <Link href="/verification/status?role=DRIVER" className="text-xs text-slate-200 border border-slate-700 rounded-xl px-4 py-2">حالة التوثيق</Link>
                    </div>
                </section>

                <section className="bg-surface-dark border border-slate-800 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white">المركبات</h2>
                        <span className="text-xs text-slate-500">{vehicles.length} مركبة</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <input
                            value={vehicleForm.plateNumber}
                            onChange={(e) => setVehicleForm((prev) => ({ ...prev, plateNumber: e.target.value }))}
                            placeholder="رقم اللوحة"
                            className="bg-bg-dark border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                            value={vehicleForm.make}
                            onChange={(e) => setVehicleForm((prev) => ({ ...prev, make: e.target.value }))}
                            placeholder="الشركة"
                            className="bg-bg-dark border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                            value={vehicleForm.model}
                            onChange={(e) => setVehicleForm((prev) => ({ ...prev, model: e.target.value }))}
                            placeholder="الموديل"
                            className="bg-bg-dark border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                            value={vehicleForm.year}
                            onChange={(e) => setVehicleForm((prev) => ({ ...prev, year: e.target.value }))}
                            placeholder="السنة"
                            className="bg-bg-dark border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                            value={vehicleForm.color}
                            onChange={(e) => setVehicleForm((prev) => ({ ...prev, color: e.target.value }))}
                            placeholder="اللون"
                            className="bg-bg-dark border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleVehicleSave} className="bg-primary text-white text-xs font-bold rounded-xl px-4 py-2">
                            {editingVehicleId ? "تحديث المركبة" : "إضافة مركبة"}
                        </button>
                        {editingVehicleId && (
                            <button
                                onClick={() => {
                                    setEditingVehicleId(null);
                                    setVehicleForm({ plateNumber: "", make: "", model: "", year: "", color: "" });
                                }}
                                className="text-xs text-slate-300 border border-slate-700 rounded-xl px-4 py-2"
                            >
                                إلغاء
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="bg-bg-dark/60 border border-slate-800 rounded-2xl p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">رقم اللوحة</p>
                                        <p className="text-sm text-white font-bold">{vehicle.plateNumber}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleVehicleEdit(vehicle)} className="text-xs text-primary">تعديل</button>
                                        <button onClick={() => handleVehicleDelete(vehicle.id)} className="text-xs text-red-400">حذف</button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    {vehicle.make || "--"} {vehicle.model || ""} {vehicle.year ? `· ${vehicle.year}` : ""} {vehicle.color ? `· ${vehicle.color}` : ""}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-surface-dark border border-slate-800 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white">مستندات السائق</h2>
                        <span className="text-xs text-slate-500">{documents.length} مستند</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                            className="bg-bg-dark border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        >
                            {docTypes.map((doc) => (
                                <option key={doc.value} value={doc.value}>{doc.label}</option>
                            ))}
                        </select>
                        <label className="bg-primary text-white text-xs font-bold rounded-xl px-4 py-2 cursor-pointer">
                            {uploading ? "جاري الرفع..." : "رفع مستند"}
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleDocUpload(file);
                                }}
                            />
                        </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {documents.map((doc) => (
                            <div key={doc.id} className="bg-bg-dark/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500">{doc.type}</p>
                                    <p className="text-sm text-white font-bold">{doc.status}</p>
                                </div>
                                <a href={doc.fileUrl} target="_blank" className="text-xs text-primary">عرض</a>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
