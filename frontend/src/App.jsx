import { useEffect, useState } from "react";
import api from "./api/axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import MockTest from "./pages/MockTest";
import ExamResults from "./pages/ExamResults";
import ResultReview from "./pages/ResultReview";
import AdminDashboard from "./pages/AdminDashboard";
import UploadPaper from "./pages/UploadPaper";
import CreateExam from "./pages/CreateExam";
import AdminExams from "./pages/AdminExams";
import AdminStudents from "./pages/AdminStudents";
import AdminLayout from "./components/AdminLayout";
import NotFound from "./components/Notfound";
import Analytics from "./pages/Analytics";
import Tests from "./pages/Tests";
import Profile from "./pages/Profile";



const AppContent = ({ user, setUser, error }) => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  const isTestPage = location.pathname.startsWith("/test/");
  const isResultsPage = location.pathname.startsWith("/results/");

  // Conditionally show student-specific navigation
  const showNavbar = !user && !isAuthPage && !isTestPage && !isAdminPath;
  const showBottomNav = user && user.role !== 'admin' && !isTestPage && !isResultsPage;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {showNavbar && <Navbar user={user} setUser={setUser} />}
      <Routes>
        <Route path="/" element={<Home user={user} setUser={setUser} error={error} />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login setUser={setUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <Register user={user} setUser={setUser} />}
        />


        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout user={user} setUser={setUser}><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/create-exam" element={<AdminLayout user={user} setUser={setUser}><CreateExam /></AdminLayout>} />
        <Route path="/admin/upload-paper" element={<AdminLayout user={user} setUser={setUser}><UploadPaper /></AdminLayout>} />
        <Route path="/admin/exams" element={<AdminLayout user={user} setUser={setUser}><AdminExams /></AdminLayout>} />
        <Route path="/admin/students" element={<AdminLayout user={user} setUser={setUser}><AdminStudents /></AdminLayout>} />

        {/* Student Routes */}
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />

        <Route path="/test/:id" element={<MockTest user={user} />} />
        <Route path="/results/:id" element={<ExamResults user={user} />} />
        <Route path="/results/:id/review" element={<ResultReview />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showBottomNav && <BottomNav />}
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      console.log("App Version: 1.6 - HARD LOGOUT & EXAM FIX"); // 🔥 VERIFY 1.6
      console.log("App: Fetching user...");
      try {
        const res = await api.get("/api/auth/me");
        console.log("App: User fetched:", res.data);

        // ZOMBIE CHECK: User via Cookie YES, Token NO -> Force Logout
        const hasToken = localStorage.getItem('token') || localStorage.getItem('adminToken');
        if (res.data && !hasToken) {
          console.warn("App: ZOMBIE SESSION DETECTED! User logged in via Cookie, but LocalStorage Token is missing. Forcing logout to fix.");
          await api.post("/api/auth/logout");
          setUser(null);
          return;
        }

        setUser(res.data);
      } catch (err) {
        console.log("App: No session found or error:", err.message);
        // Clear any potentially bad tokens explicitly
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');

        if (err.code === 'ECONNABORTED') {
          console.error("App: Request timed out. Backend might be sleeping or unreachable.");
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

    // Absolute failsafe: Turn off loading after 5 seconds no matter what
    const timer = setTimeout(() => {
      setLoading(current => {
        if (current) {
          console.error("App: Failsafe triggered. Forcing loading to false.");
          console.log("App: VITE_API_URL is:", import.meta.env.VITE_API_URL);
          return false; // Force stop loading
        }
        return current;
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center font-bold text-[#3b6a9a] gap-4">
        <div className="animate-pulse text-xl">Loading...</div>
        <div className="text-xs text-gray-400 font-normal">Connecting to server...</div>
      </div>
    );
  }

  return (
    <Router>
      <AppContent user={user} setUser={setUser} error={error} />
    </Router>
  );
}

export default App;