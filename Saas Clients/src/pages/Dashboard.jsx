// export default function Dashboard() {
//   return (
//     <div className="space-y-6">

//       {/* HEADER */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-white">
//             Dashboard
//           </h1>
//           <p className="text-sm text-gray-400">
//             Welcome back 👋 Here's your business overview
//           </p>
//         </div>

//         <button className="px-4 py-2 text-sm text-white transition rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90">
//           + Create
//         </button>
//       </div>

//       {/* KPI CARDS */}
//       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

//         <Card title="Total Leads" value="1,240" growth="+12%" />
//         <Card title="Revenue" value="₹85,000" growth="+8%" />
//         <Card title="Campaigns" value="32" growth="+5%" />
//         <Card title="Conversion Rate" value="18%" growth="+3%" />

//       </div>

//       {/* MAIN GRID */}
//       <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

//         {/* ANALYTICS */}
//         <div className="p-5 bg-gray-900 border border-gray-800 shadow-md lg:col-span-2 rounded-xl">

//           <div className="flex items-center justify-between mb-4">
//             <h2 className="font-semibold text-white">
//               Performance Overview
//             </h2>

//             <select className="px-2 py-1 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg">
//               <option>Last 7 days</option>
//               <option>Last 30 days</option>
//             </select>
//           </div>

//           <div className="flex items-center justify-center h-64 text-gray-500">
//             📊 Chart coming soon
//           </div>
//         </div>

//         {/* ACTIVITY */}
//         <div className="p-5 bg-gray-900 border border-gray-800 shadow-md rounded-xl">
//           <h2 className="mb-4 font-semibold text-white">
//             Recent Activity
//           </h2>

//           <div className="space-y-3 text-sm">
//             <Activity text="New lead added" time="2 mins ago" />
//             <Activity text="Campaign launched" time="10 mins ago" />
//             <Activity text="Deal closed" time="1 hour ago" />
//             <Activity text="New user registered" time="3 hours ago" />
//           </div>
//         </div>

//       </div>

//       {/* BOTTOM CARDS */}
//       <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

//         <SmallCard title="Tasks Pending" value="8" />
//         <SmallCard title="Follow-ups Today" value="14" />

//       </div>

//     </div>
//   );
// }

// /* =========================
//    COMPONENTS
// ========================= */

// function Card({ title, value, growth }) {
//   return (
//     <div className="p-5 transition bg-gray-900 border border-gray-800 shadow-sm rounded-xl hover:shadow-lg hover:border-gray-700">

//       <p className="text-sm text-gray-400">{title}</p>

//       <h2 className="mt-2 text-3xl font-bold text-white">
//         {value}
//       </h2>

//       <p className="mt-2 text-sm text-green-400">
//         {growth} this week
//       </p>
//     </div>
//   );
// }

// function SmallCard({ title, value }) {
//   return (
//     <div className="p-5 bg-gray-900 border border-gray-800 shadow-sm rounded-xl">

//       <p className="text-sm text-gray-400">{title}</p>

//       <h2 className="mt-2 text-2xl font-semibold text-white">
//         {value}
//       </h2>
//     </div>
//   );
// }

// function Activity({ text, time }) {
//   return (
//     <div className="flex items-center justify-between px-3 py-2 transition bg-gray-800 rounded-lg hover:bg-gray-700">

//       <span className="text-gray-300">{text}</span>

//       <span className="text-xs text-gray-500">{time}</span>
//     </div>
//   );
// }