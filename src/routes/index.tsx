import { Route, Routes } from 'react-router-dom';
import Home from '../pages/Home/Home';
import Login from '../pages/Login/Login';
import NotFound from '../pages/NotFound/NotFound';
import OAuthResult from '../pages/OAuthResult/OAuthResult';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/oauth/result" element={<OAuthResult />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
