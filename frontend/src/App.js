import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginSiswa from "./pages/Siswa/LoginSiswa";
import SiswaDashboard from "./pages/Siswa/SiswaDashboard";
import LoginAdmin from "./pages/Admin/LoginAdmin";
import AdminDashboard from "./pages/Admin/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Siswa Portal Routes */}
        <Route path="/" element={<LoginSiswa />} />
        <Route path="/siswa-dashboard" element={<SiswaDashboard />} />

        {/* Admin Portal Routes */}
        <Route path="/admin-login" element={<LoginAdmin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Fallback to Siswa Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
