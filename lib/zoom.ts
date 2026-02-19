export type ZoomMeetingResult = {
  join_url: string;
  start_url: string;
};

export type ZoomMeetingRequest = {
  topic: string;
  startsAtUtc: string;
  durationMinutes: number;
  hostEmail?: string;
};

export async function createZoomMeeting(
  request: ZoomMeetingRequest,
): Promise<ZoomMeetingResult> {
  const seed = Buffer.from(
    `${request.topic}-${request.startsAtUtc}`,
    'utf8',
  ).toString('base64');
  return {
    join_url: `https://zoom.example.com/join/${seed}`,
    start_url: `https://zoom.example.com/start/${seed}`,
  };
}
