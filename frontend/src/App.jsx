import { Route, Routes } from 'react-router-dom';
import Shell from './components/Shell.jsx';
import { RequireAuth } from './lib/auth.jsx';
import SearchPage from './pages/SearchPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import FlightPage from './pages/FlightPage.jsx';
import TicketPage from './pages/TicketPage.jsx';
import TripsPage from './pages/TripsPage.jsx';
import FindBookingPage from './pages/FindBookingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import AdminFlightsPage from './pages/admin/AdminFlightsPage.jsx';
import AdminFlightFormPage from './pages/admin/AdminFlightFormPage.jsx';
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        {/* Anyone */}
        <Route path="/" element={<SearchPage />} />
        <Route path="/flights" element={<ResultsPage />} />
        <Route path="/flights/:id" element={<FlightPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Signed in */}
        <Route path="/bookings/:pnr" element={<RequireAuth><TicketPage /></RequireAuth>} />
        <Route path="/trips" element={<RequireAuth><TripsPage /></RequireAuth>} />
        <Route path="/find" element={<RequireAuth><FindBookingPage /></RequireAuth>} />

        {/* Admins */}
        <Route path="/admin/flights" element={<RequireAuth admin><AdminFlightsPage /></RequireAuth>} />
        <Route path="/admin/flights/new" element={<RequireAuth admin><AdminFlightFormPage /></RequireAuth>} />
        <Route path="/admin/flights/:id/edit" element={<RequireAuth admin><AdminFlightFormPage /></RequireAuth>} />
        <Route path="/admin/bookings" element={<RequireAuth admin><AdminBookingsPage /></RequireAuth>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
