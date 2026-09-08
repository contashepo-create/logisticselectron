import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  Building2,
  FileText,
  DollarSign,
  X,
  Truck,
  PlusCircle,
} from "lucide-react";
import type { Company, PurchaseInvoice, PurchaseItem, Supplier, Vehicle } from "@/types";
import {
  deletePurchase,
  deleteSupplier,
  getPurchases,
  getSuppliers,
  getVehicles,
  savePurchase,
  saveSupplier,
} from "@/lib/storage";
import { supplierBalance, supplierStatement, suppliersWithBalance } from "@/lib/calc";
import { formatMoney, PURCHASE_EXPENSE_CATEGORIES } from "@/lib/format";
import { renderMasterReportHtml } from "@/lib/print-templates";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";

interface Props {
  company: Company;
  onRefreshData: () => void;
}

export const SuppliersView: React.FC<Props> = ({ company, onRefreshData }) => {
  const [activeSubTab, setActiveSubTab] = useState<"suppliers" | "purchases">("suppliers");
  const [suppliers, setSuppliers] = useState(() => suppliersWithBalance());
  const [purchases, setPurchases] = useState(() => getPurchases());
  const [vehicles, setVehicles] = useState(() => getVehicles());

  const [searchTerm, setSearchTerm] = useState("");

  // Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [supplierTaxNo, setSupplierTaxNo] = useState("");
  const [supplierCr, setSupplierCr] = useState("");
  const [supplierOpenBal, setSupplierOpenBal] = useState(0);
  const [supplierNotes, setSupplierNotes] = useState("");

  // Purchase Invoice Modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null);
  const [purDate, setPurDate] = useState(new Date().toISOString().slice(0, 10));
  const [purNumber, setPurNumber] = useState("");
  const [purType, setPurType] = useState<"credit" | "cash">("credit");
  const [purSupplierId, setPurSupplierId] = useState<number | null>(suppliers[0]?.id || null);
  const [purRef, setPurRef] = useState("");
  const [purCategory, setPurCategory] = useState("fuel");
  const [purVehicleId, setPurVehicleId] = useState<number | null>(null);
  const [purVatRate, setPurVatRate] = useState(15);
  const [purVatIncluded, setPurVatIncluded] = useState(false);
  const [purNotes, setPurNotes] = useState("");
  const [purItems, setPurItems] = useState<PurchaseItem[]>([
    {
      id: 1,
      purchase_invoice_id: 0,
      item_name: "ديزل شاحنات",
      unit: "لتر",
      qty: 1000,
      unit_price: 1.15,
      vat_rate: 15,
      notes: "",
    },
  ]);

  // Statement Modal
  const [statementSupplier, setStatementSupplier] = useState<Supplier | null>(null);
  const [statementFrom, setStatementFrom] = useState("");
  const [statementTo, setStatementTo] = useState("");

  // Print Preview
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState("");

  const reloadData = () => {
    setSuppliers(suppliersWithBalance());
    setPurchases(getPurchases());
    setVehicles(getVehicles());
    onRefreshData();
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone || "").includes(searchTerm)
    );
  }, [suppliers, searchTerm]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(
      (p) =>
        String(p.number).includes(searchTerm) ||
        (p.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.supplier_ref || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.notes || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [purchases, searchTerm]);

  // Supplier Handlers
  const handleOpenCreateSupplier = () => {
    setEditingSupplierId(null);
    setSupplierName("");
    setSupplierPhone("");
    setSupplierEmail("");
    setSupplierContact("");
    setSupplierAddress("");
    setSupplierTaxNo("");
    setSupplierCr("");
    setSupplierOpenBal(0);
    setSupplierNotes("");
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (s: Supplier) => {
    setEditingSupplierId(s.id);
    setSupplierName(s.name);
    setSupplierPhone(s.phone || "");
    setSupplierEmail(s.email || "");
    setSupplierContact(s.contact_person || "");
    setSupplierAddress(s.address || "");
    setSupplierTaxNo(s.tax_number || "");
    setSupplierCr(s.commercial_reg || "");
    setSupplierOpenBal(s.opening_balance || 0);
    setSupplierNotes(s.notes || "");
    setIsSupplierModalOpen(true);
  };

  const handleDeleteSupplier = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المورد؟")) {
      deleteSupplier(id);
      reloadData();
    }
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveSupplier(
        {
          name: supplierName,
          phone: supplierPhone,
          email: supplierEmail,
          contact_person: supplierContact,
          address: supplierAddress,
          tax_number: supplierTaxNo,
          commercial_reg: supplierCr,
          opening_balance: Number(supplierOpenBal),
          notes: supplierNotes,
        },
        editingSupplierId
      );
      setIsSupplierModalOpen(false);
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Purchase Handlers
  const handleOpenCreatePurchase = () => {
    setEditingPurchaseId(null);
    setPurDate(new Date().toISOString().slice(0, 10));
    setPurNumber("");
    setPurType("credit");
    setPurSupplierId(suppliers[0]?.id || null);
    setPurRef("");
    setPurCategory("fuel");
    setPurVehicleId(null);
    setPurVatRate(15);
    setPurVatIncluded(false);
    setPurNotes("");
    setPurItems([
      {
        id: 1,
        purchase_invoice_id: 0,
        item_name: "ديزل للشاحنات",
        unit: "لتر",
        qty: 1000,
        unit_price: 1.15,
        vat_rate: 15,
        notes: "",
      },
    ]);
    setIsPurchaseModalOpen(true);
  };

  const handleOpenEditPurchase = (p: PurchaseInvoice) => {
    setEditingPurchaseId(p.id);
    setPurDate(p.date);
    setPurNumber(String(p.number));
    setPurType(p.purchase_type);
    setPurSupplierId(p.supplier_id);
    setPurRef(p.supplier_ref || "");
    setPurCategory(p.expense_category);
    setPurVehicleId(p.vehicle_id);
    setPurVatRate(p.vat_rate);
    setPurVatIncluded(p.vat_included);
    setPurNotes(p.notes || "");
    setPurItems(p.items || []);
    setIsPurchaseModalOpen(true);
  };

  const handleDeletePurchase = (id: number) => {
    if (confirm("هل أنت متأكد من حذف فاتورة المشتريات؟")) {
      deletePurchase(id);
      reloadData();
    }
  };

  const handleAddItem = () => {
    setPurItems([
      ...purItems,
      {
        id: purItems.length + 1,
        purchase_invoice_id: editingPurchaseId || 0,
        item_name: "",
        unit: "",
        qty: 1,
        unit_price: 0,
        vat_rate: 15,
        notes: "",
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (purItems.length <= 1) return;
    setPurItems(purItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof PurchaseItem, val: any) => {
    const updated = [...purItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setPurItems(updated);
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      savePurchase(
        {
          date: purDate,
          number: purNumber ? Number(purNumber) : undefined,
          purchase_type: purType,
          supplier_id: purType === "credit" ? purSupplierId : null,
          supplier_ref: purRef,
          expense_category: purCategory,
          vehicle_id: purVehicleId,
          vat_rate: purVatRate,
          vat_included: purVatIncluded,
          notes: purNotes,
          items: purItems,
        },
        editingPurchaseId
      );
      setIsPurchaseModalOpen(false);
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Statement Handlers
  const statementData = useMemo(() => {
    if (!statementSupplier) return null;
    return supplierStatement(statementSupplier.id, statementFrom, statementTo);
  }, [statementSupplier, statementFrom, statementTo]);

  const handlePrintStatement = () => {
    if (!statementSupplier || !statementData) return;
    const html = renderMasterReportHtml(
      {
        title: `كشف حساب مورد — ${statementSupplier.name}`,
        subtitle: `كود المورد: ${statementSupplier.code} | الرقم الضريبي: ${statementSupplier.tax_number || "—"}`,
        period: { from: statementFrom, to: statementTo },
        kpis: [
          { label: "إجمالي المشتريات (له)", value: formatMoney(statementData.totals.credit, company.currency) },
          { label: "إجمالي السدادات (عليه)", value: formatMoney(statementData.totals.debit, company.currency) },
          { label: "الرصيد المستحق النهائي للمورد", value: formatMoney(statementData.totals.balance, company.currency), color: "#dc2626" },
        ],
        columns: [
          { header: "التاريخ", key: "date", align: "center" },
          { header: "نوع المستند", key: "doc" },
          { header: "البيان والتفاصيل", key: "desc" },
          { header: "دائن (له)", key: "credit", align: "left", format: (v) => (v ? formatMoney(v, "") : "—") },
          { header: "مدين (عليه)", key: "debit", align: "left", format: (v) => (v ? formatMoney(v, "") : "—") },
          { header: "الرصيد المرحل", key: "balance", align: "left", format: (v) => formatMoney(v, "") },
        ],
        rows: statementData.rows,
        summaryRow: {
          date: "الإجمالي",
          doc: "",
          desc: "",
          credit: formatMoney(statementData.totals.credit, ""),
          debit: formatMoney(statementData.totals.debit, ""),
          balance: formatMoney(statementData.totals.balance, company.currency),
        },
      },
      company
    );
    setPrintHtml(html);
    setPrintModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            <span>الموردون وفواتير المشتريات والمصروفات</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            متابعة حسابات موردي الوقود، قطع الغيار، فواتير المشتريات الآجلة والنقدية، وأرصدة الموردين
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === "suppliers" ? (
            <button
              onClick={handleOpenCreateSupplier}
              className="btn btn-primary bg-amber-600 hover:bg-amber-700 text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مورد جديد</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreatePurchase}
              className="btn btn-primary bg-amber-600 hover:bg-amber-700 text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>فاتورة مشتريات جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab("suppliers")}
          className={`pb-2.5 flex items-center gap-2 transition ${
            activeSubTab === "suppliers"
              ? "border-b-2 border-amber-600 text-amber-600 dark:text-amber-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>دليل الموردين ({suppliers.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("purchases")}
          className={`pb-2.5 flex items-center gap-2 transition ${
            activeSubTab === "purchases"
              ? "border-b-2 border-amber-600 text-amber-600 dark:text-amber-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>فواتير المشتريات ({purchases.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="app-card p-3.5 text-xs">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeSubTab === "suppliers"
                ? "البحث باسم المورد، الكود، الهاتف..."
                : "البحث برقم الفاتورة، المورد، المرجع..."
            }
            className="form-input pr-9 text-xs"
          />
        </div>
      </div>

      {/* Tab 1: Suppliers List */}
      {activeSubTab === "suppliers" && (
        <div className="app-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">كود المورد</th>
                  <th className="p-3">اسم المورد</th>
                  <th className="p-3">مسؤول التواصل</th>
                  <th className="p-3">الهاتف والبريد</th>
                  <th className="p-3">الرقم الضريبي</th>
                  <th className="p-3">رصيد المورد المستحق (له)</th>
                  <th className="p-3 text-center">كشف الحساب والخيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      لا يوجد موردون مسجلون
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-slate-500">{s.code}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{s.name}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{s.contact_person || "—"}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        <div>{s.phone || "—"}</div>
                        <div className="text-[10px] text-slate-400">{s.email || ""}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                        {s.tax_number || "—"}
                      </td>
                      <td className="p-3 font-black text-amber-600 dark:text-amber-400 text-xs md:text-sm">
                        {formatMoney(s.balance, company.currency)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setStatementSupplier(s)}
                            className="btn py-1 px-2.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1"
                            title="عرض كشف حساب المورد"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>كشف الحساب</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditSupplier(s)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(s.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Purchases List */}
      {activeSubTab === "purchases" && (
        <div className="app-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">نوع الشراء</th>
                  <th className="p-3">المورد / المرجع</th>
                  <th className="p-3">تصنيف المصروف</th>
                  <th className="p-3">الصافي</th>
                  <th className="p-3">الضريبة</th>
                  <th className="p-3">الإجمالي شامل الضريبة</th>
                  <th className="p-3 text-center">خيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      لا توجد فواتير مشتريات مسجلة
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 font-bold text-amber-600 dark:text-amber-400">#{p.number}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{p.date}</td>
                      <td className="p-3">
                        <span className={`badge ${p.purchase_type === "cash" ? "badge-green" : "badge-amber"}`}>
                          {p.purchase_type === "cash" ? "نقدي" : "آجل"}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">
                        {p.supplier_name || "شراء نقدي"}
                        {p.supplier_ref && (
                          <span className="block text-[10px] text-slate-400">مرجع: {p.supplier_ref}</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {PURCHASE_EXPENSE_CATEGORIES[p.expense_category] || p.expense_category}
                      </td>
                      <td className="p-3 text-slate-600">{formatMoney(p.subtotal, "")}</td>
                      <td className="p-3 text-amber-600">{formatMoney(p.vat_amount, "")}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        {formatMoney(p.total, company.currency)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditPurchase(p)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="تعديل الفاتورة"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePurchase(p.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                            title="حذف الفاتورة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Create/Edit Modal */}
      {isSupplierModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="bg-amber-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingSupplierId ? "تعديل بيانات المورد" : "إضافة مورد جديد"}
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المورد / المحطة:
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="مثال: شركة الدريس للخدمات البترولية"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مسؤول التواصل:
                  </label>
                  <input
                    type="text"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    placeholder="اسم المسؤول"
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الهاتف:
                  </label>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الرقم الضريبي:
                  </label>
                  <input
                    type="text"
                    value={supplierTaxNo}
                    onChange={(e) => setSupplierTaxNo(e.target.value)}
                    placeholder="3000XXXXXXXX003"
                    className="form-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الرصيد الافتتاحي المستحق له:
                  </label>
                  <input
                    type="number"
                    value={supplierOpenBal}
                    onChange={(e) => setSupplierOpenBal(Number(e.target.value))}
                    className="form-input text-xs font-bold"
                    step="any"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  العنوان والملاحظات:
                </label>
                <textarea
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  placeholder="ملاحظات الحساب وشروط الدفع..."
                  className="form-textarea text-xs h-16"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="btn py-2 px-4"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary bg-amber-600 hover:bg-amber-700 py-2 px-6 font-bold"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Invoice Create/Edit Modal */}
      {isPurchaseModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingPurchaseId ? "تعديل فاتورة مشتريات" : "إصدار فاتورة مشتريات جديدة"}
              </h3>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    طريقة الشراء:
                  </label>
                  <select
                    value={purType}
                    onChange={(e) => setPurType(e.target.value as any)}
                    className="form-select text-xs"
                  >
                    <option value="credit">آجل على حساب المورد</option>
                    <option value="cash">نقدي مباشر</option>
                  </select>
                </div>

                {purType === "credit" && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      المورد:
                    </label>
                    <select
                      value={purSupplierId || ""}
                      onChange={(e) => setPurSupplierId(Number(e.target.value))}
                      className="form-select text-xs"
                      required
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ الفاتورة:
                  </label>
                  <input
                    type="date"
                    value={purDate}
                    onChange={(e) => setPurDate(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تصنيف المصروف:
                  </label>
                  <select
                    value={purCategory}
                    onChange={(e) => setPurCategory(e.target.value)}
                    className="form-select text-xs"
                  >
                    {Object.entries(PURCHASE_EXPENSE_CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    بنود الفاتورة والكميات:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn py-1 px-2.5 text-xs text-blue-600"
                  >
                    + إضافة بند
                  </button>
                </div>

                {purItems.map((it, idx) => (
                  <div
                    key={it.id || idx}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <input
                      type="text"
                      placeholder="اسم البند أو الخدمة"
                      value={it.item_name}
                      onChange={(e) => handleItemChange(idx, "item_name", e.target.value)}
                      className="form-input text-xs sm:col-span-2"
                      required
                    />
                    <input
                      type="number"
                      placeholder="الكمية"
                      value={it.qty}
                      onChange={(e) => handleItemChange(idx, "qty", Number(e.target.value))}
                      className="form-input text-xs"
                      min="1"
                    />
                    <input
                      type="number"
                      placeholder="سعر الوحدة"
                      value={it.unit_price}
                      onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                      className="form-input text-xs"
                      min="0"
                      step="any"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-500 hover:text-red-700 text-center font-bold"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مرجع المورد / رقم الفاتورة الورقية والملاحظات:
                </label>
                <input
                  type="text"
                  value={purRef}
                  onChange={(e) => setPurRef(e.target.value)}
                  placeholder="مثال: فاتورة ضريبية ورقية #88491"
                  className="form-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="btn py-2 px-4"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary bg-amber-600 hover:bg-amber-700 py-2 px-6 font-bold"
                >
                  حفظ فاتورة المشتريات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Statement Modal */}
      {statementSupplier && statementData && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base">كشف حساب مورد: {statementSupplier.name}</h3>
                <p className="text-xs text-slate-400">
                  كود: {statementSupplier.code} | هاتف: {statementSupplier.phone || "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintStatement}
                  className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الكشف</span>
                </button>
                <button
                  onClick={() => setStatementSupplier(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={statementFrom}
                  onChange={(e) => setStatementFrom(e.target.value)}
                  className="form-input text-xs py-1"
                />
                <input
                  type="date"
                  value={statementTo}
                  onChange={(e) => setStatementTo(e.target.value)}
                  className="form-input text-xs py-1"
                />
              </div>

              <div className="bg-amber-600 text-white font-bold px-3 py-1 rounded-lg">
                الرصيد المستحق للمورد: {formatMoney(statementData.totals.balance, company.currency)}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">التاريخ</th>
                    <th className="p-2.5">المستند</th>
                    <th className="p-2.5">البيان</th>
                    <th className="p-2.5">دائن (له)</th>
                    <th className="p-2.5">مدين (عليه)</th>
                    <th className="p-2.5">الرصيد المرحل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {statementData.rows.map((r, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">{r.date || "—"}</td>
                      <td className="p-2.5 font-bold text-amber-600">{r.doc}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">{r.desc}</td>
                      <td className="p-2.5 text-amber-600 font-medium">
                        {r.credit ? formatMoney(r.credit, "") : "—"}
                      </td>
                      <td className="p-2.5 text-emerald-600 font-medium">
                        {r.debit ? formatMoney(r.debit, "") : "—"}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">
                        {formatMoney(r.balance, company.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="معاينة وطباعة كشف حساب المورد"
        htmlContent={printHtml}
        showTemplatePicker={false}
      />
    </div>
  );
};
