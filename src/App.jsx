import { useEffect, useState } from "react";
import DailyPage from "./pages/DailyPage";
import LegalPage, { getLegalPage } from "./pages/LegalPage";

function getHashRoute() {
  if (typeof window === "undefined") return "/";
  return window.location.hash.replace(/^#/, "") || "/";
}

export default function App() {
  const [route, setRoute] = useState(getHashRoute);

  useEffect(() => {
    function handleHashChange() {
      setRoute(getHashRoute());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const pageId = route.replace(/^\//, "");

  if (getLegalPage(pageId)) {
    return <LegalPage pageId={pageId} />;
  }

  return <DailyPage />;
}
