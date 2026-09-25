import { Route, Routes } from 'react-router-dom';
import GuestOnly from '../components/auth/GuestOnly';
import RequireAuth from '../components/auth/RequireAuth';
import ComingSoon from '../pages/ComingSoon/ComingSoon';
import Home from '../pages/Home/Home';
import InvitationJoin from '../pages/InvitationJoin/InvitationJoin';
import Login from '../pages/Login/Login';
import NotFound from '../pages/NotFound/NotFound';
import OAuthResult from '../pages/OAuthResult/OAuthResult';
import TripCreate from '../pages/TripCreate/TripCreate';
import TripCreated from '../pages/TripCreate/TripCreated';
import TripCreateLayout from '../pages/TripCreate/TripCreateLayout';
import TripDate from '../pages/TripCreate/TripDate';
import TripPlace from '../pages/TripCreate/TripPlace';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Home />} />
        <Route path="/trips/new" element={<TripCreateLayout />}>
          <Route index element={<TripCreate />} />
          <Route path="place" element={<TripPlace />} />
          <Route path="date" element={<TripDate />} />
          <Route path="done" element={<TripCreated />} />
        </Route>
        <Route path="/trips/:tripId" element={<ComingSoon title="여행방 상세" />} />
        <Route path="/chat" element={<ComingSoon title="오픈채팅" />} />
        <Route path="/community" element={<ComingSoon title="커뮤니티" />} />
        <Route path="/trips/:tripId/survey" element={<ComingSoon title="취향 설문" />} />
      </Route>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
      </Route>
      {/* 토큰 형식 검사를 로그인보다 먼저 하므로 로그인 확인은 화면 안에서 합니다. */}
      <Route path="/invitations/:invitationToken" element={<InvitationJoin />} />
      <Route path="/oauth/result" element={<OAuthResult />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
