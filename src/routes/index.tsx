import { Route, Routes } from 'react-router-dom';
import ChatRoom from '../pages/ChatRoom/ChatRoom';
import Community from '../pages/Community/Community';
import Home from '../pages/Home/Home';
import InvitationJoin from '../pages/InvitationJoin/InvitationJoin';
import Login from '../pages/Login/Login';
import NotFound from '../pages/NotFound/NotFound';
import OpenChat from '../pages/OpenChat/OpenChat';
import Survey from '../pages/Survey/Survey';
import TripCreate from '../pages/TripCreate/TripCreate';
import TripDetail from '../pages/TripDetail/TripDetail';
import TripCreated from '../pages/TripCreate/TripCreated';
import TripCreateLayout from '../pages/TripCreate/TripCreateLayout';
import TripDate from '../pages/TripCreate/TripDate';
import TripPlace from '../pages/TripCreate/TripPlace';
import TripSchedule from '../pages/TripSchedule/TripSchedule';
import GuestOnly from './GuestOnly';
import RequireAuth from './RequireAuth';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* 초대 링크는 토큰 검증을 로그인보다 먼저 하므로 로그인 확인은 화면 안에서 한다. */}
      <Route path="/invitations/:invitationToken" element={<InvitationJoin />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<Home />} />
        <Route path="/open-chat" element={<OpenChat />} />
        <Route path="/open-chat/rooms/:roomId" element={<ChatRoom />} />
        <Route path="/community" element={<Community />} />
        <Route path="/trips/new" element={<TripCreateLayout />}>
          <Route index element={<TripCreate />} />
          <Route path="place" element={<TripPlace />} />
          <Route path="date" element={<TripDate />} />
          <Route path="done" element={<TripCreated />} />
        </Route>
        <Route path="/trips/:tripId" element={<TripDetail />} />
        <Route path="/trips/:tripId/schedule" element={<TripSchedule />} />
        <Route path="/trips/:tripId/survey" element={<Survey />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
