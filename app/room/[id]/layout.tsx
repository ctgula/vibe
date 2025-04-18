import RoomAuth from './components/room-auth';

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoomAuth>{children}</RoomAuth>;
}
