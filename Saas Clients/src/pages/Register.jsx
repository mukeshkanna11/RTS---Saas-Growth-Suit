// src/pages/Register.jsx
import { useState } from "react";
import { registerUser } from "../api/auth";
import Input from "../components/Input";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
  });

 const handleRegister = async (e) => {
  e.preventDefault();

  try {
    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: "employee" // default OR choose dropdown later
    };

    await registerUser(payload);

    alert("Account created successfully");
    navigate("/login");

  } catch (err) {
    alert(err.response?.data?.message || "Register failed");
  }
};

  return (
    <div className="flex items-center justify-center h-screen bg-gray-950">
      <div className="w-full max-w-md p-8 bg-gray-900 shadow-xl rounded-2xl">

        <h2 className="mb-2 text-2xl font-bold text-white">
          Create Account 🚀
        </h2>
        <p className="mb-6 text-gray-400">
          Start your SaaS journey
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            placeholder="Full Name"
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <Input
            placeholder="Email"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <Input
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <Input
            placeholder="Company Name"
            onChange={(e) =>
              setForm({ ...form, companyName: e.target.value })
            }
          />

          <Button>Create Account</Button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-400">
          Already have an account?{" "}
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}