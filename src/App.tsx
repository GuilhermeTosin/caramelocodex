import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { setCanonical, setRobots, upsertMetaTag } from "@/lib/seo";
import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import BusinessPage from "@/pages/BusinessPage";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import UserProfile from "@/pages/UserProfile";
import VerifiedBusinessInfo from "@/pages/VerifiedBusinessInfo";
import EventPage from "@/pages/EventPage";
import BusinessShortLink from "@/pages/BusinessShortLink";
import BusinessWizardPage from "@/pages/BusinessWizardPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import NotFound from "@/pages/NotFound";
import { getGoogleAnalyticsMeasurementId } from "@/services/siteSettings";

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}

function CanonicalManager() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const privatePaths = new Set(["/cadastro", "/entrar", "/perfil", "/negocio/wizard"]);
    const isSearchPage = pathname === "/buscar";
    const canonicalPath = isSearchPage ? pathname : `${pathname}${search}`;
    const canonicalUrl = `${window.location.origin}${canonicalPath}`;

    setCanonical(canonicalUrl);
    upsertMetaTag("property", "og:url", canonicalUrl);

    if (privatePaths.has(pathname)) {
      setRobots("noindex,nofollow,noarchive");
      return;
    }

    if (isSearchPage && search) {
      setRobots("noindex,follow,max-image-preview:large");
      return;
    }

    setRobots("index,follow,max-image-preview:large");
  }, [pathname, search]);

  return null;
}

function AnalyticsBridge() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    let mounted = true;

    const ensureGa = async () => {
      const measurementId = await getGoogleAnalyticsMeasurementId();
      if (!mounted || !measurementId) return;

      const scriptId = "ga4-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);
      }

      (window as any).dataLayer = (window as any).dataLayer || [];
      const gtag = (...args: any[]) => (window as any).dataLayer.push(args);
      (window as any).gtag = (window as any).gtag || gtag;
      (window as any).gtag("js", new Date());
      (window as any).gtag("config", measurementId, {
        page_path: `${pathname}${search}`,
      });
    };

    void ensureGa();
    return () => {
      mounted = false;
    };
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <CanonicalManager />
        <AnalyticsBridge />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buscar" element={<SearchResults />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/perfil" element={<UserProfile />} />
          <Route path="/negocio-verificado" element={<VerifiedBusinessInfo />} />
          <Route path="/sobre" element={<AboutPage />} />
          <Route path="/contato" element={<ContactPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/eventos/:eventId" element={<EventPage />} />
          <Route path="/negocio/wizard" element={<BusinessWizardPage />} />
          <Route path="/go/:businessSlug" element={<BusinessShortLink />} />
          <Route path="/:countryCode/:stateCode/:city/:businessName" element={<BusinessPage />} />
          <Route path="/:countryCode/:businessName" element={<BusinessPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}
