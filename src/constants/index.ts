/** WebRTC chunk size in bytes (16KB — reliable for Data Channels) */
export const CHUNK_SIZE = 16_384;

/** Length of the room code */
export const ROOM_CODE_LENGTH = 6;

/** Timeout for WebRTC connection attempt in ms */
export const CONNECTION_TIMEOUT_MS = 12_000;

/** How long toast notifications remain visible in ms */
export const TOAST_DURATION_MS = 4_000;

/** Maximum character length for chat messages */
export const MAX_CHAT_LENGTH = 1_000;

/** QR Code scanner frames per second */
export const QR_SCANNER_FPS = 10;

/** QR Code scanning box ratio relative to viewport */
export const QR_BOX_RATIO = 0.7;

/** Delay before showing "Establishing secure channel" stage message */
export const STAGE_TRANSITION_DELAY_MS = 1_500;

/** Delay before starting camera to allow DOM to mount */
export const CAMERA_START_DELAY_MS = 150;

/** Maximum number of participants per room (host + guests) */
export const MAX_PARTICIPANTS = 6;

/** Maximum number of simultaneous peer connections (MAX_PARTICIPANTS - 1) */
export const MAX_CONNECTIONS = MAX_PARTICIPANTS - 1;
