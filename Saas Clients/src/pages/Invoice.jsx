import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import {
  Download,
  Search,
  Plus,
  Trash2,
  IndianRupee,
  FileText,
  CheckCircle,
  Clock,
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
    notes: "Thank you for choosing ReadyTechSolutions.",
    terms: "Invoice generated electronically.",
  });

  // ================= FETCH INVOICES (FIXED) =================
  const loadInvoices = async () => {
    try {
      setLoading(true);

      const res = await API.get("/invoice");

      // IMPORTANT: normalize backend response safely
      const data = res?.data?.data;

      const list =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.invoices)
          ? data.invoices
          : Array.isArray(data?.data)
          ? data.data
          : [];

      setInvoices(list);
    } catch (err) {
      console.error("Load invoices error:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 AUTO FETCH ON PAGE LOAD (THIS WAS MISSING)
  useEffect(() => {
    loadInvoices();
  }, []);

 const createInvoice = async () => {
  try {
    setLoading(true);

    const now = new Date();
    const due = new Date(Date.now() + 7 * 86400000);

    // ================= SAFE CALCULATION =================
    const items = form.items || [];

    const subtotal = items.reduce((sum, item) => {
      const qty = Number(item.qty || 0);
      const price = Number(item.price || 0);
      return sum + qty * price;
    }, 0);

    const discountPercent = Number(form.discount?.value || 0);

    const discountAmount = Number(
      ((subtotal * discountPercent) / 100).toFixed(2)
    );

    const taxable = Number((subtotal - discountAmount).toFixed(2));

    const cgst = Number((taxable * 0.09).toFixed(2));
    const sgst = Number((taxable * 0.09).toFixed(2));
    const igst = 0;

    const total = Number((taxable + cgst + sgst).toFixed(2));

    // ================= PAYLOAD =================
    const payload = {
      company: form.company,
      customer: form.customer,
      items: form.items,

      orderDate: now.toISOString(),
      purchaseDate: now.toISOString(),
      paymentDate: now.toISOString(),
      dueDate: due.toISOString(),

      paymentStatus: "PAID",

      discount: {
        type: "percent",
        value: discountPercent,
      },

      tax: {
        type: "intra",
        cgst: 9,
        sgst: 9,
        igst: 0,
      },

      totals: {
        subtotal,
        discountAmount,
        taxable,
        cgst,
        sgst,
        igst,
        total,
      },

      notes: form.notes || "",
    };

    // ================= API CALL =================
    const res = await API.post("/invoice/generate", payload);

    console.log("INVOICE RESPONSE:", res.data);

    const newInvoice =
      res?.data?.data?.invoice ||
      res?.data?.invoice ||
      res?.data?.data;

    if (!newInvoice) {
      alert("Invoice created but response mapping failed ❌");
      return;
    }

    // ================= UPDATE UI =================
    setInvoices((prev) => [newInvoice, ...prev]);

    alert("Invoice created successfully 🚀");

    setShowCreate(false);

    // ================= RESET FORM (FIXED) =================
    setForm((prev) => ({
      ...prev,
      customer: {
        name: "",
        email: "",
        phone: "",
        address: "",
        gstin: "",
      },
      items: [{ name: "", hsn: "998314", qty: 1, price: 0 }],
      discount: { type: "percent", value: 0 },
      notes: "",
    }));

  } catch (err) {
    console.error("CREATE ERROR:", err);
    alert("Invoice creation failed ❌");
  } finally {
    setLoading(false);
  }
};

const refreshInvoices = async () => {
  try {
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
  }
};

const updateInvoiceStatus = async (invoiceId, newStatus) => {
  try {
    // ================= OPTIMISTIC UI UPDATE =================
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.invoiceId === invoiceId
          ? {
              ...inv,
              paymentStatus: newStatus,
              status:
                newStatus === "paid"
                  ? "generated"
                  : inv.status,
            }
          : inv
      )
    );

    // ================= API CALL =================
    const res = await API.patch(
      `/invoice/${invoiceId}/status`,
      {
        paymentStatus: newStatus,
      }
    );

    const updated = res?.data?.data;

    if (updated) {
      // ================= HARD SYNC (IMPORTANT) =================
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.invoiceId === invoiceId ? updated : inv
        )
      );
    }

  } catch (err) {
    console.error(err);

    // rollback
    refreshInvoices();
  }
};

  // ================= DOWNLOAD INVOICE (SAFE VERSION) =================
const downloadInvoice = async (invoiceId) => {
  try {
    const res = await API.get(`/invoice/download/${invoiceId}`, {
      responseType: "arraybuffer", // ✅ more stable than blob in PDF cases
    });

    // Validate response
    if (!res.data || res.data.byteLength === 0) {
      throw new Error("Empty PDF response from server");
    }

    // Create PDF blob
    const blob = new Blob([res.data], {
      type: "application/pdf",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoiceId}.pdf`;

    document.body.appendChild(link); // ✅ safer in some browsers
    link.click();

    // Cleanup
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("❌ Download error:", err);

    alert(
      err?.response?.data?.message ||
      err.message ||
      "Failed to download invoice PDF"
    );
  }
};

  // ================= DELETE =================
  const deleteInvoice = async (invoiceId) => {
    try {
      await API.delete(`/invoice/${invoiceId}`);
      setInvoices((prev) => prev.filter((i) => i.invoiceId !== invoiceId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ================= FILTER =================
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return (invoices || []).filter(
      (i) =>
        i?.invoiceId?.toLowerCase().includes(s) ||
        i?.customer?.name?.toLowerCase().includes(s)
    );
  }, [invoices, search]);

  const statusStyle = (status) => {
  switch (status) {
    case "paid":
      return "bg-green-500/10 text-green-400 border-green-500";

    case "pending":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500";

    case "draft":
      return "bg-slate-500/10 text-slate-300 border-slate-500";

    case "failed":
      return "bg-red-500/10 text-red-400 border-red-500";

    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500";
  }
};

  return (
    <div className="min-h-screen p-6 text-white bg-slate-950">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-slate-400">Billing & Revenue</p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 rounded-xl"
        >
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      {/* STATS */}
      <div className="grid gap-6 mb-8 md:grid-cols-4">
        <Card icon={<FileText />} title="Invoices" value={invoices.length} />

        <Card
          icon={<CheckCircle />}
          title="Paid"
          value={invoices.filter(i => i.paymentStatus === "paid").length}
        />

        <Card
          icon={<Clock />}
          title="Pending"
          value={invoices.filter(i => i.paymentStatus === "pending").length}
        />

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
      <div className="flex gap-3 p-4 mb-6 border rounded-2xl bg-slate-900 border-slate-800">
        <Search />
        <input
          className="w-full bg-transparent outline-none"
          placeholder="Search Invoice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* EMPTY STATE */}
      {!loading && filtered.length === 0 && (
        <div className="p-10 text-center border text-slate-400 border-slate-800 rounded-2xl">
          No invoices found. Create your first invoice 🚀
        </div>
      )}

      
{/* TABLE */}
<div className="overflow-hidden border shadow-xl rounded-2xl border-slate-800 bg-slate-950">
  <table className="w-full text-sm">

    {/* HEADER */}
    <thead className="text-xs tracking-wider uppercase bg-slate-900 text-slate-400">
      <tr>
        <th className="p-4 text-left">Invoice</th>
        <th className="text-left">Customer</th>
        <th className="text-left">Amount</th>
        <th className="text-left">Status</th>
        <th className="text-left">Date</th>
        <th className="text-left">Actions</th>
      </tr>
    </thead>

    {/* BODY */}
    <tbody>
      {filtered.map((invoice) => (
        <tr
          key={invoice._id}
          className="transition border-t border-slate-800 hover:bg-slate-900/50"
        >
          {/* Invoice ID */}
          <td className="p-4 font-medium text-white">
            {invoice.invoiceId}
          </td>

          {/* Customer */}
          <td className="text-slate-300">
            {invoice.customer?.name || "—"}
          </td>

          {/* Amount */}
          <td className="font-semibold text-slate-200">
            ₹{invoice?.totals?.total || 0}
          </td>

          {/* STATUS BADGE */}
          <td>
            <span
              className={`px-3 py-1 rounded-full border text-xs capitalize ${statusStyle(
                invoice.paymentStatus
              )}`}
            >
              {invoice.paymentStatus}
            </span>
          </td>

          {/* DATE */}
          <td className="text-slate-400">
            {new Date(invoice.createdAt).toLocaleDateString()}
          </td>

          {/* ACTIONS */}
          <td className="flex gap-2 p-2">
            <button
              onClick={() => downloadInvoice(invoice.invoiceId)}
              className="p-2 transition rounded-lg bg-emerald-600 hover:bg-emerald-500"
            >
              ⬇
            </button>

            <button
              onClick={() => deleteInvoice(invoice.invoiceId)}
              className="p-2 transition bg-red-600 rounded-lg hover:bg-red-500"
            >
              🗑
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {showCreate && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">

    <div className="w-[900px] max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0B1220] border border-slate-800 shadow-2xl">

      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 rounded-t-3xl">
        <h2 className="text-2xl font-bold tracking-wide text-white">
          Create Invoice
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          GST Billing • SaaS Invoice Generator • Auto Tax Engine
        </p>
      </div>

      <div className="p-6 space-y-6 text-slate-200">

        {/* ================= CUSTOMER ================= */}
        <div className="card">
          <h3 className="section-title">Customer Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <input className="input" placeholder="Customer Name" onChange={(e)=>setForm({...form,customer:{...form.customer,name:e.target.value}})} />
            <input className="input" placeholder="Email" onChange={(e)=>setForm({...form,customer:{...form.customer,email:e.target.value}})} />
            <input className="input" placeholder="Phone" onChange={(e)=>setForm({...form,customer:{...form.customer,phone:e.target.value}})} />
            <input className="input" placeholder="Address" onChange={(e)=>setForm({...form,customer:{...form.customer,address:e.target.value}})} />
          </div>
        </div>

        {/* ================= DATES ================= */}
       <div className="card">
  <h3 className="section-title">Invoice Timeline</h3>

  <div className="grid grid-cols-3 gap-4">

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
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Items</h3>

            <button
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
              onClick={() =>
                setForm({
                  ...form,
                  items: [...form.items, { name: "", qty: 1, price: 0 }],
                })
              }
            >
              + Add Item
            </button>
          </div>

          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 mb-3">

              <input className="input" placeholder="Item Name"
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

        {/* ================= BILLING ================= */}
        <div className="card">
          <h3 className="section-title">Billing & Discount</h3>

          <div className="grid grid-cols-2 gap-4">

            <input
              className="input"
              placeholder="Discount %"
              type="number"
              onChange={(e)=>
                setForm({
                  ...form,
                  discount:{type:"percent",value:Number(e.target.value)}
                })
              }
            />

            <textarea
              className="input h-[45px]"
              placeholder="Notes"
              onChange={(e)=>setForm({...form,notes:e.target.value})}
            />

          </div>
        </div>

        {/* ================= TAX PREVIEW ================= */}
        <div className="card border-indigo-500/20 bg-indigo-500/5">

          <h3 className="section-title">GST Breakdown</h3>

          <div className="grid grid-cols-4 gap-3 text-center">

            <div className="tax-box">
              <p>CGST</p><span>9%</span>
            </div>

            <div className="tax-box">
              <p>SGST</p><span>9%</span>
            </div>

            <div className="tax-box">
              <p>IGST</p><span>0%</span>
            </div>

            <div className="tax-box highlight">
              <p>TYPE</p><span>INTRA</span>
            </div>

          </div>

        </div>

        {/* ================= ACTIONS ================= */}
        <div className="flex gap-4 pt-4 border-t border-slate-800">

          <button
            onClick={createInvoice}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 font-semibold hover:scale-[1.01] transition"
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
    <div className="p-5 border rounded-2xl bg-slate-900 border-slate-800">
      <div className="mb-3">{icon}</div>
      <p className="text-sm text-slate-400">{title}</p>
      <h2 className="mt-2 text-2xl font-bold">{value}</h2>
    </div>
  );
}