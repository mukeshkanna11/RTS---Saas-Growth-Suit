import { useState } from "react";
import axios from "axios";

export default function CreateUser() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/v1/users", form);

      alert("User created successfully");

      setForm({ name: "", email: "", password: "", role: "employee" });

    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="mb-4 text-xl font-bold">Create User</h1>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">

        <input
          className="w-full p-2 bg-gray-900 border border-gray-700"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="w-full p-2 bg-gray-900 border border-gray-700"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          className="w-full p-2 bg-gray-900 border border-gray-700"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <select
          className="w-full p-2 bg-gray-900 border border-gray-700"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
        </select>

        <button className="w-full p-2 bg-blue-600 rounded">
          Create User
        </button>
      </form>
    </div>
  );
}