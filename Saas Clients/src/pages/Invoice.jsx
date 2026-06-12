import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import {
  Download,
  Search,
  Plus,
  FileText,
  CheckCircle,
  Clock,
  IndianRupee,
  Trash2,
} from "lucide-react";

export default function Invoice() {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    company: {
      name: "ReadyTechSolutions Pvt Ltd",
      address: "Coimbatore, Tamil Nadu, India",
      email: "quries@readytechsolutions.in",
      phone: "+91 9600364121",
      gstin: "33ABCDE1234F1Z5",
      pan: "ABCDE1234F",
      website: "https://www.readytechsolutions.in",
    },
    customer: {
      name: "",
      email: "",
      phone: "",
      address: "",
      gstin: "",
    },
    items: [{ name: "", hsn: "998314", qty: 1, price: 0 }],
    discount: { type: "percent", value: 0 },
    tax: { type: "intra", cgst: 9, sgst: 9, igst: 0 },
    paymentStatus: "pending",
    notes: "",
  });

  // ================= LOAD =================
  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await API.get("/invoice");

      const data = res?.data?.data;
      const list =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.invoices)
          ? data.invoices
          : [];

      setInvoices(list);
    } catch (err) {
      console.error(err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const createInvoice = async () => {
  try {
    setLoading(true);

    const now = new Date();
    const due = new Date(Date.now() + 7 * 86400000);

    const items = form.items || [];

    const subtotal = items.reduce((sum, item) => {
      return sum + Number(item.qty || 0) * Number(item.price || 0);
    }, 0);

    const discountPercent = Number(form.discount?.value || 0);
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxable = subtotal - discountAmount;

    const cgst = taxable * 0.09;
    const sgst = taxable * 0.09;

    const total = taxable + cgst + sgst;

    const payload = {
      company: form.company,
      customer: form.customer,
      items: form.items,

      orderDate: now.toISOString(),
      purchaseDate: now.toISOString(),
      paymentDate: now.toISOString(),
      dueDate: due.toISOString(),

      paymentStatus: form.paymentStatus?.toLowerCase() || "pending",

      discount: form.discount,
      tax: form.tax,

      totals: {
        subtotal,
        discountAmount,
        taxable,
        cgst,
        sgst,
        igst: 0,
        total,
      },

      notes: form.notes || "",
    };

    const res = await API.post("/invoice/generate", payload);

    if (!res?.data?.success && !res?.data?.data) {
      throw new Error("Invalid response from server");
    }

    // 🔥 IMPORTANT FIX: ALWAYS REFRESH FROM SERVER
    await loadInvoices();

    setShowCreate(false);

    setForm({
      company: form.company,
      customer: {
        name: "",
        email: "",
        phone: "",
        address: "",
        gstin: "",
      },
      items: [{ name: "", hsn: "998314", qty: 1, price: 0 }],
      discount: { type: "percent", value: 0 },
      tax: { type: "intra", cgst: 9, sgst: 9, igst: 0 },
      paymentStatus: "pending",
      notes: "",
    });

    alert("Invoice created successfully 🚀");

  } catch (err) {
    console.error("CREATE ERROR:", err);
    alert("Failed to create invoice ❌");
  } finally {
    setLoading(false);
  }
};

  // ================= UPDATE STATUS =================
  const updateInvoiceStatus = async (invoiceId, status) => {
    try {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.invoiceId === invoiceId
            ? { ...inv, paymentStatus: status }
            : inv
        )
      );

      const res = await API.patch(`/invoice/${invoiceId}/status`, {
        paymentStatus: status,
      });

      const updated = res?.data?.data;

      if (updated) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.invoiceId === invoiceId ? updated : inv
          )
        );
      }
    } catch (err) {
      console.error(err);
      loadInvoices();
    }
  };

  // ================= DOWNLOAD =================
  const downloadInvoice = async (id) => {
    try {
      const res = await API.get(`/invoice/download/${id}`, {
        responseType: "arraybuffer",
      });

      const blob = new Blob([res.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Download failed ❌");
    }
  };

  // ================= DELETE =================
  const deleteInvoice = async (id) => {
    try {
      await API.delete(`/invoice/${id}`);
      setInvoices((prev) => prev.filter((i) => i.invoiceId !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ================= FILTER =================
  const filtered = useMemo(() => {
    return invoices.filter(
      (i) =>
        i.invoiceId?.toLowerCase().includes(search.toLowerCase()) ||
        i.customer?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [invoices, search]);

  // ================= STATS =================
  const paidCount = invoices.filter(
    (i) => i.paymentStatus === "paid"
  ).length;

  const pendingCount = invoices.filter(
    (i) => i.paymentStatus === "pending"
  ).length;

  const statusStyle = (s) => {
    switch (s) {
      case "paid":
        return "bg-green-500/10 text-green-400 border-green-500";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500";
    }
  };

  return (
    <div className="min-h-screen p-6 text-white bg-slate-950">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invoice Dashboard</h1>
          <p className="text-slate-400">Billing System</p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl"
        >
          <Plus /> Create
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        <Card icon={<FileText />} title="Total" value={invoices.length} />
        <Card icon={<CheckCircle />} title="Paid" value={paidCount} />
        <Card icon={<Clock />} title="Pending" value={pendingCount} />
        <Card
          icon={<IndianRupee />}
          title="Revenue"
          value={`₹${invoices.reduce(
            (a, b) => a + Number(b?.totals?.total || 0),
            0
          )}`}
        />
      </div>

      {/* SEARCH */}
      <input
        className="w-full p-3 mb-4 bg-slate-900 rounded-xl"
        placeholder="Search invoice..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

     {/* ================= PREMIUM TABLE ================= */}
<div className="overflow-hidden border shadow-2xl rounded-2xl border-slate-800 bg-slate-950">

  <table className="w-full text-sm">

    {/* HEADER */}
    <thead className="text-xs tracking-wider text-left uppercase bg-slate-900 text-slate-400">
      <tr>
        <th className="p-4">Invoice</th>
        <th>Customer</th>
        <th>Amount</th>
        <th>Status</th>
        <th className="text-center">Actions</th>
      </tr>
    </thead>

    {/* BODY */}
    <tbody>
      {filtered.map((i) => (
        <tr
          key={i.invoiceId}
          className="transition border-t border-slate-800 hover:bg-slate-900/50"
        >

          {/* INVOICE ID */}
          <td className="p-4 font-medium text-white">
            {i.invoiceId}
          </td>

          {/* CUSTOMER */}
          <td className="text-slate-300">
            {i.customer?.name || "—"}
          </td>

          {/* AMOUNT */}
          <td className="font-semibold text-slate-200">
            ₹{i?.totals?.total?.toLocaleString() || 0}
          </td>

          {/* STATUS BADGE */}
          <td>
            <span
              className={`px-3 py-1 rounded-full border text-xs font-medium capitalize ${statusStyle(
                i.paymentStatus
              )}`}
            >
              {i.paymentStatus}
            </span>
          </td>

          {/* ACTIONS */}
          <td className="flex items-center justify-center gap-2 p-3">

            {/* TOGGLE BUTTON (SMART) */}
            <button
              onClick={() =>
                updateInvoiceStatus(
                  i.invoiceId,
                  i.paymentStatus === "paid" ? "pending" : "paid"
                )
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200
                ${
                  i.paymentStatus === "paid"
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500 hover:bg-yellow-500/20"
                    : "bg-green-500/10 text-green-400 border border-green-500 hover:bg-green-500/20"
                }`}
            >
              {i.paymentStatus === "paid" ? "Mark Pending" : "Mark Paid"}
            </button>

            {/* DOWNLOAD */}
            <button
              onClick={() => downloadInvoice(i.invoiceId)}
              className="p-2 transition border rounded-xl border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-emerald-500"
              title="Download Invoice"
            >
              <Download size={16} className="text-emerald-400" />
            </button>

            {/* DELETE */}
            <button
              onClick={() => deleteInvoice(i.invoiceId)}
              className="p-2 transition border rounded-xl border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-red-500"
              title="Delete Invoice"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>

          </td>

        </tr>
      ))}
    </tbody>

  </table>
</div>

      {/* CREATE MODAL */}
     {showCreate && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl">

    <div className="w-[1050px] max-h-[95vh] overflow-y-auto rounded-3xl bg-[#0A0F1C] border border-slate-800 shadow-2xl">

      {/* HEADER */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 rounded-t-3xl">

        <div>
          <h2 className="text-2xl font-bold tracking-wide text-white">
            Create Invoice
          </h2>
          <p className="text-sm text-slate-400">
            SaaS Billing • GST Engine • Auto Tax Calculation
          </p>
        </div>

        {/* BACK BUTTON */}
        <button
          onClick={() => setShowCreate(false)}
          className="px-4 py-2 text-sm transition bg-slate-800 rounded-xl hover:bg-slate-700"
        >
          ← Back
        </button>

      </div>

      <div className="p-6 space-y-6 text-slate-200">

        {/* ================= CUSTOMER ================= */}
        <div className="p-5 border rounded-2xl bg-slate-900/40 border-slate-800">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">
            Customer Information
          </h3>

          <div className="grid grid-cols-2 gap-4">

            <input className="input" placeholder="Customer Name *"
              onChange={(e)=>setForm({...form,customer:{...form.customer,name:e.target.value}})} />

            <input className="input" placeholder="Email *"
              onChange={(e)=>setForm({...form,customer:{...form.customer,email:e.target.value}})} />

            <input className="input" placeholder="Phone *"
              onChange={(e)=>setForm({...form,customer:{...form.customer,phone:e.target.value}})} />

            <input className="input" placeholder="Address *"
              onChange={(e)=>setForm({...form,customer:{...form.customer,address:e.target.value}})} />

          </div>
        </div>

        {/* ================= TIMELINE ================= */}
<div className="p-5 border rounded-2xl bg-indigo-500/5 border-indigo-500/20">

  <h3 className="mb-4 text-sm font-semibold text-indigo-300">
    📅 Invoice Timeline
  </h3>

  <div className="grid grid-cols-4 gap-4">

    {/* ORDER DATE */}
    <div>
      <label className="block mb-1 text-xs text-slate-400">
        Order Date
      </label>
      <input
        type="date"
        className="input"
        onChange={(e) =>
          setForm({ ...form, orderDate: e.target.value })
        }
      />
    </div>

    {/* PURCHASE DATE */}
    <div>
      <label className="block mb-1 text-xs text-slate-400">
        Purchase Date
      </label>
      <input
        type="date"
        className="input"
        onChange={(e) =>
          setForm({ ...form, purchaseDate: e.target.value })
        }
      />
    </div>

    {/* PAYMENT DATE */}
    <div>
      <label className="block mb-1 text-xs text-slate-400">
        Payment Date
      </label>
      <input
        type="date"
        className="input"
        onChange={(e) =>
          setForm({ ...form, paymentDate: e.target.value })
        }
      />
    </div>

    {/* DUE DATE */}
    <div>
      <label className="block mb-1 text-xs text-slate-400">
        Due Date
      </label>
      <input
        type="date"
        className="input"
        onChange={(e) =>
          setForm({ ...form, dueDate: e.target.value })
        }
      />
    </div>

  </div>
</div>

        {/* ================= ITEMS ================= */}
        <div className="p-5 border rounded-2xl bg-slate-900/40 border-slate-800">

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">
              Services / Items
            </h3>

            <button
              className="text-sm text-indigo-400 hover:text-indigo-300"
              onClick={() =>
                setForm({
                  ...form,
                  items: [...form.items, { name: "", qty: 1, price: 0, hsn: "998314" }]
                })
              }
            >
              + Add Item
            </button>
          </div>

          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 mb-3">

              <input className="input" placeholder="Service Name"
                value={item.name}
                onChange={(e)=>{
                  const arr=[...form.items];
                  arr[i].name=e.target.value;
                  setForm({...form,items:arr});
                }}
              />

              <input className="input" type="number" placeholder="Qty"
                value={item.qty}
                onChange={(e)=>{
                  const arr=[...form.items];
                  arr[i].qty=Number(e.target.value);
                  setForm({...form,items:arr});
                }}
              />

              <input className="input" type="number" placeholder="Price"
                value={item.price}
                onChange={(e)=>{
                  const arr=[...form.items];
                  arr[i].price=Number(e.target.value);
                  setForm({...form,items:arr});
                }}
              />

            </div>
          ))}

        </div>

        {/* ================= TAX + DISCOUNT ================= */}
        <div className="p-5 border rounded-2xl bg-slate-900/40 border-slate-800">

          <h3 className="mb-4 text-sm font-semibold text-slate-300">
            Tax & Discount Engine
          </h3>

          <div className="grid grid-cols-4 gap-4">

            <input className="input" type="number" placeholder="Discount %"
              onChange={(e)=>
                setForm({
                  ...form,
                  discount:{type:"percent",value:Number(e.target.value)}
                })
              }
            />

            <input className="input" type="number" placeholder="CGST %"
              onChange={(e)=>
                setForm({...form,tax:{...form.tax,cgst:Number(e.target.value)}})
              }
            />

            <input className="input" type="number" placeholder="SGST %"
              onChange={(e)=>
                setForm({...form,tax:{...form.tax,sgst:Number(e.target.value)}})
              }
            />

            <input className="input" type="number" placeholder="IGST %"
              onChange={(e)=>
                setForm({...form,tax:{...form.tax,igst:Number(e.target.value)}})
              }
            />

          </div>
        </div>

        {/* ================= PAYMENT STATUS ================= */}
        <div className="p-5 border rounded-2xl bg-slate-900/40 border-slate-800">

          <h3 className="mb-3 text-sm font-semibold text-slate-300">
            Payment Status
          </h3>

          <select
            className="input"
            value={form.paymentStatus}
            onChange={(e)=>setForm({...form,paymentStatus:e.target.value})}
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>

        </div>

        {/* ================= NOTES ONLY ================= */}
        <div className="p-5 border rounded-2xl bg-slate-900/40 border-slate-800">

          <h3 className="mb-3 text-sm font-semibold text-slate-300">
            Notes
          </h3>

          <textarea
            className="h-20 input"
            placeholder="Add invoice notes..."
            onChange={(e)=>setForm({...form,notes:e.target.value})}
          />

        </div>

        {/* ================= ACTIONS ================= */}
        <div className="flex gap-4 pt-4 border-t border-slate-800">

          <button
            onClick={createInvoice}
            className="flex-1 py-3 font-semibold text-white transition rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-[1.01]"
          >
            {loading ? "Generating Invoice..." : "Generate Invoice"}
          </button>

          <button
            onClick={()=>setShowCreate(false)}
            className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700"
          >
            Cancel
          </button>

        </div>

      </div>
    </div>
  </div>
)}

    </div>
  );
}

// ================= CARD =================
function Card({ icon, title, value }) {
  return (
    <div className="p-4 border rounded-xl border-slate-800 bg-slate-900">
      <div>{icon}</div>
      <p className="text-slate-400">{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>
    </div>
  );
}