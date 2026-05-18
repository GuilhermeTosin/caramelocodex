import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import BusinessPage from "@/pages/BusinessPage";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import UserProfile from "@/pages/UserProfile";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buscar" element={<SearchResults />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/perfil" element={<UserProfile />} />
          <Route path="/:countryCode/:stateCode/:city/:businessName" element={<BusinessPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}
