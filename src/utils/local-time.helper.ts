import { format, addMinutes, parse } from 'date-fns';

export function computeLocalTimes(
  startTime: string,
  duration: string
): { localStartTime: string; localEndTime: string } {
  const parsedStart = parse(startTime, 'HH:mm', new Date()); // assuming 24hr input
  const durationMinutes = parseInt(duration);
  const endTime = addMinutes(parsedStart, durationMinutes);

  return {
    localStartTime: format(parsedStart, 'hh:mm a'),
    localEndTime: format(endTime, 'hh:mm a'),
  };
}
