export const EVENTS = {
  SIGNAL: {
    OFFER: 'signal:offer',
    ANSWER: 'signal:answer',
    CANDIDATE: 'signal:candidate'
  },
  RTC: {
    REACTION: 'rtc:data:reaction',
    DRAW: 'rtc:data:draw',
    UNDO: 'rtc:data:undo',
    GAME_MOVE: 'rtc:data:game:move',
    MUSIC_STATE: 'rtc:data:music:state',
    GESTURE: 'rtc:data:gesture',
    SNAPSHOT: 'rtc:system:snapshot'
  }
};