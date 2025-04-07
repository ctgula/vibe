// utils/livekit.ts

import { Room, RoomOptions } from "livekit-client";

export async function connectToLiveKit(token: string, url: string): Promise<Room> {
  const room = new Room();
  
  await room.connect(url, token, {
    autoSubscribe: true,
  });

  return room;
}
