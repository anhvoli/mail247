import { useCallback, useEffect, useRef, useState } from 'react';
import GuestSetup from './components/GuestSetup';
import Lobby from './components/Lobby';
import RoomView from './components/RoomView';
import { useRoom } from './useRoom';
import { BOT_CHAT_LINES, BOT_NAMES } from './data';

const GUEST_KEY = 'rapchieu-guest';
const EXP_KEY = 'rapchieu-exp';

function todayStr() { return new Date().toISOString().slice(0, 10); }

function loadExp() {
  try {
    const raw = JSON.parse(localStorage.getItem(EXP_KEY) || 'null');
    if (raw && raw.day === todayStr()) return raw;
  } catch { /* ignore */ }
  return { exp: 0, day: todayStr(), missions: {}, watchExp: 0, chatReady: false };
}

export default function App() {
  const [guest, setGuest] = useState(() => {
    try { return JSON.parse(localStorage.getItem(GUEST_KEY) || 'null'); } catch { return null; }
  });
  const [expState, setExpState] = useState(loadExp);
  const [roomId, setRoomId] = useState(null);
  const roomState = useRoom(roomId || 'phim', guest?.name || 'Khách');
  const roomStateRef = useRef(roomState);
  roomStateRef.current = roomState;

  useEffect(() => { localStorage.setItem(EXP_KEY, JSON.stringify(expState)); }, [expState]);

  const addExp = useCallback((n) => {
    setExpState((s) => ({ ...s, exp: s.exp + n }));
  }, []);

  // Bot chat thỉnh thoảng (mô phỏng rạp đông).
  useEffect(() => {
    if (!roomId || !guest) return undefined;
    const t = setInterval(() => {
      if (Math.random() < 0.5) {
        const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        const line = BOT_CHAT_LINES[Math.floor(Math.random() * BOT_CHAT_LINES.length)];
        roomStateRef.current.botSay(line, name);
      }
    }, 14000);
    return () => clearInterval(t);
  }, [roomId, guest]);

  // Ngồi xem: +1 EXP / 3 phút, tối đa 50 EXP/ngày.
  useEffect(() => {
    if (!roomId || !guest) return undefined;
    const t = setInterval(() => {
      setExpState((s) => {
        if (s.watchExp >= 50) return s;
        return { ...s, exp: s.exp + 1, watchExp: s.watchExp + 1 };
      });
    }, 180000);
    return () => clearInterval(t);
  }, [roomId, guest]);

  const enterGuest = (g) => {
    setGuest(g);
    localStorage.setItem(GUEST_KEY, JSON.stringify(g));
  };

  const claimMission = (id, exp) => {
    if (id === 'watch') return; // xem tự cộng, không bấm nhận
    if (expState.missions[id]) return;
    if (id === 'chat' && !expState.chatReady) return;
    setExpState((s) => ({ ...s, exp: s.exp + exp, missions: { ...s.missions, [id]: true } }));
  };

  const onChatSent = () => {
    setExpState((s) => ({ ...s, chatReady: true }));
  };

  if (!guest) return <GuestSetup onEnter={enterGuest} />;
  if (!roomId) {
    return <Lobby guest={guest} exp={expState.exp} onEnterRoom={setRoomId} onLeave={() => { setGuest(null); localStorage.removeItem(GUEST_KEY); }} />;
  }
  return (
    <RoomView
      guest={guest}
      roomState={roomState}
      onLeave={() => setRoomId(null)}
      exp={expState.exp}
      missionsDone={{ ...expState.missions, chatReady: expState.chatReady }}
      onMissionDone={claimMission}
      onChatSent={onChatSent}
    />
  );
}
