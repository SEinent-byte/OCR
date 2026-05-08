import { Navigate, Route, Routes } from "react-router-dom";

import { MeteorShower } from "@/components/magicui/meteor-shower";
import { Particles } from "@/components/magicui/particles";
import { SmoothCursor } from "@/components/magicui/smooth-cursor";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { CiudadanoPage } from "@/pages/CiudadanoPage";
import { EmpleadoPage } from "@/pages/EmpleadoPage";

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-deep">
      <MeteorShower number={20} className="z-0" />
      <Particles className="absolute inset-0 z-0" color="#0ea5e9" quantity={60} size={0.6} />
      <SmoothCursor cursor={<div className="h-3 w-3 rounded-full bg-ai-blue shadow-[0_0_20px_#0ea5e9]" />} />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/ciudadano" element={<CiudadanoPage />} />
        <Route path="/empleado" element={<EmpleadoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
