import { Route, Routes } from 'react-router-dom';
import ChatRoom from '../pages/ChatRoom/ChatRoom';
import Community from '../pages/Community/Community';
import Home from '../pages/Home/Home';
import Login from '../pages/Login/Login';
import NotFound from '../pages/NotFound/NotFound';
import OpenChat from '../pages/OpenChat/OpenChat';
import Survey from '../pages/Survey/Survey';
import RequireAuth from './RequireAuth';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<Home />} />
        <Route path="/open-chat" element={<OpenChat />} />
        <Route path="/open-chat/rooms/:roomId" element={<ChatRoom />} />
        <Route path="/community" element={<Community />} />
        <Route path="/trips/:tripId/survey" element={<Survey />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
