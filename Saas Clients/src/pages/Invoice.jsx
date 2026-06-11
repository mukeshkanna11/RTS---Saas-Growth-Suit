import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";

import {
  Receipt,
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
      email: "support@readytechsolutions.in",
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

    items: [
      {
        name: "",
        hsn: "998314",
        qty: 1,
        price: 0,
      },
    ],

    discount: { type: "percent", value: 0 },

    tax: { type: "intra", cgst: 9, sgst: 9, igst: 0 },

    notes: "Thank you for choosing ReadyTechSolutions.",

    terms: "Invoice generated electronically.",
  });

  // ================= LOAD INVOICES =================
  const loadInvoices = async () => {
    try {
      setLoading(true);

      const res = await API.get("/invoice");

      setInvoices(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // ================= CREATE INVOICE =================
  const createInvoice = async () => {
    try {
      const payload = {
        ...form,
        orderDate: new Date().toISOString(),
        purchaseDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        paymentStatus: "pending",
      };

      const res = await API.post("/invoice/generate", payload);

      const newInvoice = res.data?.data?.invoice;

      if (newInvoice) {
        setInvoices((prev) => [newInvoice, ...prev]);
      }

      alert(res.data?.data?.message || "Created");
      setShowCreate(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create invoice");
    }
  };

  // ================= DOWNLOAD =================
  const downloadInvoice = async (invoiceId) => {
    try {
      const res = await API.get(`/invoice/download/${invoiceId}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${invoiceId}.pdf`;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= DELETE =================
  const deleteInvoice = async (invoiceId) => {
    try {
      await API.delete(`/invoice/${invoiceId}`);
      setInvoices((prev) =>
        prev.filter((i) => i.invoiceId !== invoiceId)
      );
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
          value={
            invoices.filter(
              (i) => i.paymentStatus?.toLowerCase() === "paid"
            ).length
          }
        />

        <Card
          icon={<Clock />}
          title="Pending"
          value={
            invoices.filter(
              (i) => i.paymentStatus?.toLowerCase() === "pending"
            ).length
          }
        />

        <Card
          icon={<IndianRupee />}
          title="Revenue"
          value={`₹${invoices.reduce(
            (a, b) => a + Number(b.totals?.total || 0),
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

      {/* TABLE */}
      <div className="overflow-hidden border rounded-2xl border-slate-800">
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr>
              <th className="p-4">Invoice</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((invoice) => (
              <tr key={invoice._id} className="border-t border-slate-800">
                <td className="p-4">{invoice.invoiceId}</td>

                <td>{invoice.customer?.name}</td>

                <td>₹{invoice.totals?.total}</td>

                <td>{invoice.paymentStatus}</td>

                <td>
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </td>

                <td>
                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        downloadInvoice(invoice.invoiceId)
                      }
                      className="p-2 bg-green-600 rounded-lg"
                    >
                      <Download size={16} />
                    </button>

                    <button
                      onClick={() => deleteInvoice(invoice.invoiceId)}
                      className="p-2 bg-red-600 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE BUTTON LOGIC ONLY (UI NOT INCLUDED HERE) */}
      {showCreate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="bg-slate-900 p-6 rounded-xl w-[500px]">
            <h2 className="mb-4 text-xl">Create Invoice</h2>

            <button
              onClick={createInvoice}
              className="w-full p-3 bg-indigo-600 rounded"
            >
              Generate Invoice
            </button>

            <button
              onClick={() => setShowCreate(false)}
              className="w-full p-3 mt-2 bg-red-600 rounded"
            >
              Close
            </button>
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