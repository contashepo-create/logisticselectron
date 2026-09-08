import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Truck,
  PlusCircle,
  X,
  CreditCard,
  DollarSign,
  Receipt,
} from "lucide-react";
import type {
  Company,
  Customer,
  Invoice,
  InvoicePrintTemplate,
  InvoiceTrip,
  PrintSettings,
  TripExpense,
  Vehicle,
  Employee,
} from "@/types";
import {
  deleteInvoice,
  getCustomers,
  getEmployees,
  getInvoices,
  getVehicles,
  saveInvoice,
  saveCustomer,
} from "@/lib/storage";
import { formatMoney, EXPENSE_TYPES, EXPENSE_SOURCE_LABELS } from "@/lib/format";
import { DEFAULT_PRINT_SETTINGS, renderInvoiceHtml } from "@/lib/print-templates";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";

interface Props {
  company: Company;
  onRefreshData: () => void;
  initialNewInvoiceModal?: boolean;
}

export const InvoicesView: React.FC<Props> = ({
  company,
  onRefreshData,
  initialNewInvoiceModal = false,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>(() => getInvoices());
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getVehicles());
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");

  // Create / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(initialNewInvoiceModal);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);

  const [formCustomerId, setFormCustomerId] = useState<number>(customers[0]?.id || 1);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formNumber, setFormNumber] = useState<string>("");
  const [formVatRate, setFormVatRate] = useState<number>(company.vat_rate || 15);
  const [formNotes, setFormNotes] = useState<string>("");
  const [formContainerNumber, setFormContainerNumber] = useState<string>("");

  const [formTrips, setFormTrips] = useState<InvoiceTrip[]>([
    {
      id: 1,
      invoice_id: 0,
      vehicle_id: vehicles[0]?.id || null,
      driver_id: employees[0]?.id || null,
      from_loc: "الرياض",
      to_loc: "الدمام",
      qty: 1,
      unit_price: 2500,
      price: 2500,
      container_numbers: [],
      notes: "",
      expenses: [],
    },
  ]);

  // Quick Add Customer inside invoice form
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustTaxNo, setNewCustTaxNo] = useState("");

  // Print Preview Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState("");
  const [printTemplate, setPrintTemplate] = useState<InvoicePrintTemplate>("modern");
  const [printAccentColor, setPrintAccentColor] = useState("#2563eb");
  const [currentPrintInvoice, setCurrentPrintInvoice] = useState<Invoice | null>(null);

  const reloadData = () => {
    setInvoices(getInvoices());
    setCustomers(getCustomers());
    setVehicles(getVehicles());
    setEmployees(getEmployees());
    onRefreshData();
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        String(inv.number).includes(searchTerm) ||
        (inv.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.notes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.container_number || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchCustomer =
        selectedCustomerId === "all" || String(inv.customer_id) === selectedCustomerId;

      return matchSearch && matchCustomer;
    });
  }, [invoices, searchTerm, selectedCustomerId]);

  // Handle Open Create Form
  const handleOpenCreate = () => {
    setEditingInvoiceId(null);
    setFormCustomerId(customers[0]?.id || 1);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNumber("");
    setFormVatRate(company.vat_rate || 15);
    setFormNotes("");
    setFormContainerNumber("");
    setFormTrips([
      {
        id: 1,
        invoice_id: 0,
        vehicle_id: vehicles[0]?.id || null,
        driver_id: employees[0]?.id || null,
        from_loc: "الرياض",
        to_loc: "الدمام",
        qty: 1,
        unit_price: 2500,
        price: 2500,
        container_numbers: [],
        notes: "",
        expenses: [],
      },
    ]);
    setIsFormOpen(true);
  };

  // Handle Edit Invoice
  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoiceId(inv.id);
    setFormCustomerId(inv.customer_id);
    setFormDate(inv.date);
    setFormNumber(String(inv.number));
    setFormVatRate(inv.vat_rate);
    setFormNotes(inv.notes || "");
    setFormContainerNumber(inv.container_number || "");
    setFormTrips(
      (inv.trips || []).map((t, idx) => ({
        ...t,
        id: t.id || idx + 1,
        expenses: t.expenses || [],
      }))
    );
    setIsFormOpen(true);
  };

  // Handle Delete Invoice
  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من رغبتك في حذف هذه الفاتورة؟")) {
      deleteInvoice(id);
      reloadData();
    }
  };

  // Trip Line helpers
  const handleAddTrip = () => {
    const newId = formTrips.length + 1;
    setFormTrips([
      ...formTrips,
      {
        id: newId,
        invoice_id: editingInvoiceId || 0,
        vehicle_id: vehicles[0]?.id || null,
        driver_id: employees[0]?.id || null,
        from_loc: "",
        to_loc: "",
        qty: 1,
        unit_price: 0,
        price: 0,
        container_numbers: [],
        notes: "",
        expenses: [],
      },
    ]);
  };

  const handleRemoveTrip = (idx: number) => {
    if (formTrips.length <= 1) {
      alert("يجب أن تحتوي الفاتورة على نقلة واحدة على الأقل.");
      return;
    }
    setFormTrips(formTrips.filter((_, i) => i !== idx));
  };

  const handleTripChange = (idx: number, field: keyof InvoiceTrip, value: any) => {
    const updated = [...formTrips];
    const trip = { ...updated[idx], [field]: value };

    if (field === "qty" || field === "unit_price") {
      trip.price = (Number(trip.qty) || 0) * (Number(trip.unit_price) || 0);
    }
    if (field === "vehicle_id") {
      const veh = vehicles.find((v) => v.id === Number(value));
      trip.vehicle_name = veh ? veh.plate_number : "";
      if (veh?.default_driver_id) {
        trip.driver_id = veh.default_driver_id;
        const driver = employees.find((e) => e.id === veh.default_driver_id);
        trip.driver_name = driver ? driver.name : "";
      }
    }
    if (field === "driver_id") {
      const driver = employees.find((e) => e.id === Number(value));
      trip.driver_name = driver ? driver.name : "";
    }

    updated[idx] = trip;
    setFormTrips(updated);
  };

  // Trip Expense Helpers
  const handleAddExpense = (tripIdx: number) => {
    const updated = [...formTrips];
    const trip = updated[tripIdx];
    const expId = (trip.expenses?.length || 0) + 1;
    const newExp: TripExpense = {
      id: expId,
      trip_id: trip.id,
      expense_type: "fuel",
      qty: 1,
      unit_amount: 100,
      amount: 100,
      source: "cash",
      notes: "",
    };
    trip.expenses = [...(trip.expenses || []), newExp];
    updated[tripIdx] = trip;
    setFormTrips(updated);
  };

  const handleRemoveExpense = (tripIdx: number, expIdx: number) => {
    const updated = [...formTrips];
    updated[tripIdx].expenses = updated[tripIdx].expenses.filter((_, i) => i !== expIdx);
    setFormTrips(updated);
  };

  const handleExpenseChange = (tripIdx: number, expIdx: number, field: keyof TripExpense, value: any) => {
    const updated = [...formTrips];
    const exp = { ...updated[tripIdx].expenses[expIdx], [field]: value };
    if (field === "qty" || field === "unit_amount") {
      exp.amount = (Number(exp.qty) || 0) * (Number(exp.unit_amount) || 0);
    }
    updated[tripIdx].expenses[expIdx] = exp;
    setFormTrips(updated);
  };

  // Form Totals Calculation
  const formCalculations = useMemo(() => {
    let subtotal = 0;
    let customerReimbursed = 0;
    for (const t of formTrips) {
      subtotal += Number(t.price) || 0;
      for (const e of t.expenses || []) {
        if (e.source === "customer") {
          customerReimbursed += Number(e.amount) || 0;
        }
      }
    }
    const taxable = subtotal + customerReimbursed;
    const vat = (taxable * formVatRate) / 100;
    const total = taxable + vat;

    return { subtotal, customerReimbursed, taxable, vat, total };
  }, [formTrips, formVatRate]);

  // Handle Save Invoice Form
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveInvoice(
        {
          customer_id: formCustomerId,
          date: formDate,
          number: formNumber ? Number(formNumber) : undefined,
          vat_rate: formVatRate,
          notes: formNotes,
          container_number: formContainerNumber,
          trips: formTrips,
        },
        editingInvoiceId
      );

      setIsFormOpen(false);
      reloadData();
    } catch (err: any) {
      alert("خطأ: " + err.message);
    }
  };

  // Handle Quick Add Customer
  const handleSaveQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    try {
      const created = saveCustomer({
        name: newCustName,
        phone: newCustPhone,
        tax_number: newCustTaxNo,
        opening_balance: 0,
      });
      setCustomers(getCustomers());
      setFormCustomerId(created.id);
      setIsQuickCustomerOpen(false);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustTaxNo("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Open Print Preview
  const handleOpenPrintPreview = async (inv: Invoice) => {
    const cust = customers.find((c) => c.id === inv.customer_id) || null;
    const ps: PrintSettings = {
      ...DEFAULT_PRINT_SETTINGS,
      template: printTemplate,
      accent_color: printAccentColor,
    };

    setCurrentPrintInvoice(inv);
    const html = await renderInvoiceHtml(inv, company, cust, ps);
    setPrintHtml(html);
    setPrintModalOpen(true);
  };

  // When changing template or color in print modal
  const handleChangePrintTemplate = async (tpl: InvoicePrintTemplate) => {
    setPrintTemplate(tpl);
    if (currentPrintInvoice) {
      const cust = customers.find((c) => c.id === currentPrintInvoice.customer_id) || null;
      const ps: PrintSettings = {
        ...DEFAULT_PRINT_SETTINGS,
        template: tpl,
        accent_color: printAccentColor,
      };
      const html = await renderInvoiceHtml(currentPrintInvoice, company, cust, ps);
      setPrintHtml(html);
    }
  };

  const handleChangeAccentColor = async (color: string) => {
    setPrintAccentColor(color);
    if (currentPrintInvoice) {
      const cust = customers.find((c) => c.id === currentPrintInvoice.customer_id) || null;
      const ps: PrintSettings = {
        ...DEFAULT_PRINT_SETTINGS,
        template: printTemplate,
        accent_color: color,
      };
      const html = await renderInvoiceHtml(currentPrintInvoice, company, cust, ps);
      setPrintHtml(html);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>فواتير النقل والرحلات</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إصدار فواتير النقل، بوالص الشحن، وإدارة مصروفات الرحلات والطباعة الضريبية
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn btn-primary text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء فاتورة نقل جديدة</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="app-card p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث برقم الفاتورة، اسم العميل، الحاوية..."
              className="form-input pr-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">العميل:</span>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="form-select text-xs min-w-[160px]"
          >
            <option value="all">كل العملاء ({invoices.length})</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">العميل</th>
                <th className="p-3 text-center">الرحلات</th>
                <th className="p-3">الصافي</th>
                <th className="p-3">الضريبة (15%)</th>
                <th className="p-3">الإجمالي المستحق</th>
                <th className="p-3 text-center">خيارات والطباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لا توجد فواتير مطابقة لخيارات البحث
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                      #{inv.number}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{inv.date}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {inv.customer_name}
                      {inv.container_number && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          حاوية: {inv.container_number}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="badge badge-blue">
                        {inv.trips?.length || 1} نقلة
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {formatMoney(inv.subtotal, "")}
                    </td>
                    <td className="p-3 text-blue-600 dark:text-blue-400">
                      {formatMoney(inv.vat_amount, "")}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                      {formatMoney(inv.total, company.currency)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenPrintPreview(inv)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                          title="معاينة وطباعة الفاتورة (6 قوالب)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="تعديل الفاتورة"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
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

      {/* Invoice Create / Edit Modal Form */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">
                  {editingInvoiceId ? `تعديل فاتورة نقل #${formNumber}` : "إصدار فاتورة نقل جديدة"}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveInvoice} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Top Row: Customer & Date & Number */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                {/* Customer with quick add */}
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">العميل:</label>
                    <button
                      type="button"
                      onClick={() => setIsQuickCustomerOpen(!isQuickCustomerOpen)}
                      className="text-blue-600 hover:underline text-[11px] font-bold"
                    >
                      + عميل جديد
                    </button>
                  </div>
                  <select
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(Number(e.target.value))}
                    className="form-select text-xs"
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.tax_number ? `(ضريبي: ${c.tax_number})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ الفاتورة:
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>

                {/* Number & VAT */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نسبة الضريبة (%):
                  </label>
                  <input
                    type="number"
                    value={formVatRate}
                    onChange={(e) => setFormVatRate(Number(e.target.value))}
                    className="form-input text-xs"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Quick Add Customer Drawer (if open) */}
              {isQuickCustomerOpen && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
                  <div className="font-bold text-blue-800 dark:text-blue-300 text-xs">إضافة عميل سريع:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="اسم العميل أو الشركة"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="form-input text-xs"
                    />
                    <input
                      type="text"
                      placeholder="رقم الهاتف"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="form-input text-xs"
                    />
                    <input
                      type="text"
                      placeholder="الرقم الضريبي (15 رقم)"
                      value={newCustTaxNo}
                      onChange={(e) => setNewCustTaxNo(e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsQuickCustomerOpen(false)}
                      className="btn py-1 px-2.5 text-[11px]"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveQuickCustomer}
                      className="btn btn-primary py-1 px-3 text-[11px]"
                    >
                      حفظ العميل
                    </button>
                  </div>
                </div>
              )}

              {/* Trip Lines & Direct Expenses Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>بنود النقلات والرحلات والمصروفات المباشرة:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddTrip}
                    className="btn btn-primary py-1 px-2.5 text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة نقلة / خط سير</span>
                  </button>
                </div>

                {formTrips.map((trip, tIdx) => (
                  <div
                    key={trip.id || tIdx}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        نقلة رقم ({tIdx + 1})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTrip(tIdx)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف النقلة</span>
                      </button>
                    </div>

                    {/* Route, Truck, Price Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          من (التحميل):
                        </label>
                        <input
                          type="text"
                          value={trip.from_loc}
                          onChange={(e) => handleTripChange(tIdx, "from_loc", e.target.value)}
                          placeholder="مثال: الرياض"
                          className="form-input text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          إلى (التسليم):
                        </label>
                        <input
                          type="text"
                          value={trip.to_loc}
                          onChange={(e) => handleTripChange(tIdx, "to_loc", e.target.value)}
                          placeholder="مثال: الدمام"
                          className="form-input text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          الشاحنة:
                        </label>
                        <select
                          value={trip.vehicle_id || ""}
                          onChange={(e) => handleTripChange(tIdx, "vehicle_id", e.target.value)}
                          className="form-select text-xs"
                        >
                          <option value="">بدون تحديد</option>
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.plate_number} ({v.vehicle_type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          الكمية / العدد:
                        </label>
                        <input
                          type="number"
                          value={trip.qty}
                          onChange={(e) => handleTripChange(tIdx, "qty", Number(e.target.value))}
                          className="form-input text-xs"
                          min="1"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          سعر النقلة:
                        </label>
                        <input
                          type="number"
                          value={trip.unit_price}
                          onChange={(e) => handleTripChange(tIdx, "unit_price", Number(e.target.value))}
                          className="form-input text-xs"
                          min="0"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          المجموع:
                        </label>
                        <div className="form-input bg-slate-100 dark:bg-slate-700/50 font-bold text-blue-600 dark:text-blue-400 flex items-center">
                          {formatMoney(trip.price, "")}
                        </div>
                      </div>
                    </div>

                    {/* Containers & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          أرقام الحاويات (مفصولة بفاصلة):
                        </label>
                        <input
                          type="text"
                          value={trip.container_numbers?.join(", ") || ""}
                          onChange={(e) =>
                            handleTripChange(
                              tIdx,
                              "container_numbers",
                              e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          placeholder="مثال: MSCU-123456, TGHU-987654"
                          className="form-input text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          ملاحظات النقلة:
                        </label>
                        <input
                          type="text"
                          value={trip.notes}
                          onChange={(e) => handleTripChange(tIdx, "notes", e.target.value)}
                          placeholder="تعليمات خاصة، نوع الحمولة..."
                          className="form-input text-xs"
                        />
                      </div>
                    </div>

                    {/* Direct Trip Expenses Sub-section */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                          مصروفات الرحلة المباشرة (ديزل / كارتة / ميزان):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddExpense(tIdx)}
                          className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                        >
                          + إضافة مصروف رحلة
                        </button>
                      </div>

                      {trip.expenses?.length ? (
                        <div className="space-y-1.5">
                          {trip.expenses.map((exp, eIdx) => (
                            <div
                              key={exp.id || eIdx}
                              className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                            >
                              <select
                                value={exp.expense_type}
                                onChange={(e) => handleExpenseChange(tIdx, eIdx, "expense_type", e.target.value)}
                                className="form-select text-[11px]"
                              >
                                {Object.entries(EXPENSE_TYPES).map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="number"
                                value={exp.amount}
                                onChange={(e) => handleExpenseChange(tIdx, eIdx, "unit_amount", Number(e.target.value))}
                                placeholder="المبلغ"
                                className="form-input text-[11px]"
                              />

                              <select
                                value={exp.source}
                                onChange={(e) => handleExpenseChange(tIdx, eIdx, "source", e.target.value)}
                                className="form-select text-[11px]"
                              >
                                {Object.entries(EXPENSE_SOURCE_LABELS).map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="text"
                                value={exp.notes}
                                onChange={(e) => handleExpenseChange(tIdx, eIdx, "notes", e.target.value)}
                                placeholder="بيان المصروف..."
                                className="form-input text-[11px]"
                              />

                              <button
                                type="button"
                                onClick={() => handleRemoveExpense(tIdx, eIdx)}
                                className="text-red-500 hover:text-red-700 text-center font-bold text-xs"
                              >
                                حذف
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {/* General Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات الفاتورة العامة وشروط السداد:
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="تظهر أسفل الفاتورة المطبوعة..."
                  className="form-textarea text-xs h-16"
                />
              </div>

              {/* Totals Summary Footer Box */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div>
                    مجموع النقلات: <b>{formatMoney(formCalculations.subtotal, company.currency)}</b>
                  </div>
                  {formCalculations.customerReimbursed > 0 && (
                    <div className="text-amber-300">
                      مصروفات يتحملها العميل: +{formatMoney(formCalculations.customerReimbursed, company.currency)}
                    </div>
                  )}
                  <div className="text-blue-300">
                    ضريبة القيمة المضافة ({formVatRate}%): <b>{formatMoney(formCalculations.vat, company.currency)}</b>
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-xs text-slate-400">الإجمالي النهائي شامل الضريبة:</div>
                  <div className="text-xl md:text-2xl font-black text-emerald-400">
                    {formatMoney(formCalculations.total, company.currency)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn py-2 px-4"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary py-2 px-6 font-bold"
                >
                  حفظ واعتماد الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title={`معاينة وطباعة فاتورة نقل #${currentPrintInvoice?.number || ""}`}
        htmlContent={printHtml}
        template={printTemplate}
        onChangeTemplate={handleChangePrintTemplate}
        accentColor={printAccentColor}
        onChangeAccentColor={handleChangeAccentColor}
      />
    </div>
  );
};
