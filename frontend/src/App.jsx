import { Route, Routes } from 'react-router-dom';
import RequireAuth from './auth/RequireAuth.jsx';
import Layout from './components/Layout.jsx';
import Book from './pages/Book.jsx';
import FlightDetails from './pages/FlightDetails.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import ManageBooking from './pages/ManageBooking.jsx';
import NotFound from './pages/NotFound.jsx';
import Register from './pages/Register.jsx';
import SearchResults from './pages/SearchResults.jsx';
import Ticket from './pages/Ticket.jsx';
import Trips from './pages/Trips.jsx';
import Bookings from './pages/admin/Bookings.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import FlightForm from './pages/admin/FlightForm.jsx';
import Flights from './pages/admin/Flights.jsx';

// Every page in the site. RequireAuth only affects what the browser shows;
// the backend enforces login and the admin role on every request regardless.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/flights/:id" element={<FlightDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Passenger */}
        <Route path="/book/:flightId" element={<RequireAuth><Book /></RequireAuth>} />
        <Route path="/bookings/:pnr" element={<RequireAuth><Ticket /></RequireAuth>} />
        <Route path="/trips" element={<RequireAuth><Trips /></RequireAuth>} />
        <Route path="/manage" element={<RequireAuth><ManageBooking /></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth admin><Dashboard /></RequireAuth>} />
        <Route path="/admin/flights" element={<RequireAuth admin><Flights /></RequireAuth>} />
        <Route path="/admin/flights/new" element={<RequireAuth admin><FlightForm /></RequireAuth>} />
        <Route path="/admin/flights/:id/edit" element={<RequireAuth admin><FlightForm /></RequireAuth>} />
        <Route path="/admin/bookings" element={<RequireAuth admin><Bookings /></RequireAuth>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
