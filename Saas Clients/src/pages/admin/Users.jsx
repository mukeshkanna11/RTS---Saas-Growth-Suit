import { useEffect, useState } from "react";
import axios from "axios";

export default function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/v1/users");
      setUsers(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="mb-4 text-xl font-bold">Users Management</h1>

      <table className="w-full border border-gray-800">
        <thead>
          <tr className="bg-gray-900">
            <th className="p-2">Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-t border-gray-800">
              <td className="p-2">{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.isActive ? "Active" : "Inactive"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}