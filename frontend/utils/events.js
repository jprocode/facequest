export const event = (type, payload={}) => ({ type, payload, ts: Date.now() });
