import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ProgressProvider } from "./state/ProgressContext";
import { DifficultyProvider } from "./state/DifficultyContext";
import Home from "./pages/Home";
import Topics from "./pages/Topics";
import TopicPage from "./pages/TopicPage";
import Problem from "./pages/Problem";
import ProgressPage from "./pages/ProgressPage";
import RandomRedirect from "./pages/RandomRedirect";
import NotFound from "./pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [ready] = useState(() => typeof window !== "undefined");
  if (!ready) return null;
  return (
    <DifficultyProvider>
      <ProgressProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/topics/:topicId" element={<TopicPage />} />
          <Route path="/problem/:problemId" element={<Problem />} />
          <Route path="/random" element={<RandomRedirect />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ProgressProvider>
    </DifficultyProvider>
  );
}
