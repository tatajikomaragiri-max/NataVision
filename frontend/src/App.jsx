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
import ForgotPassword from "./pages/ForgotPassword";
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
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
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
      console.log("App: Fetching user...");
      try {
        const res = await api.get("/api/auth/me");
        console.log("App: User fetched:", res.data);
        setUser(res.data);
      } catch (err) {
        console.log("App: No session found or error:", err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center font-bold text-[#3b6a9a]">Loading...</div>;
  }

  return (
    <Router>
      <AppContent user={user} setUser={setUser} error={error} />
    </Router>
  );
}

export default App;