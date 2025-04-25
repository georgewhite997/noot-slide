/**
 * @constant {string} LOCAL_STORAGE_KEY_PREFIX
 * @description Prefix used for storing encrypted session data in local storage
 *
 * The actual storage key is created by appending the user's wallet address to this prefix,
 * ensuring each wallet address has its own unique storage key.
 */
export const LOCAL_STORAGE_KEY_PREFIX = "abstract_session_";

/**
 * @constant {string} ENCRYPTION_KEY_PREFIX
 * @description Prefix used for storing encryption keys in local storage
 *
 * The actual storage key is created by appending the user's wallet address to this prefix,
 * ensuring each wallet address has its own unique encryption key stored separately from the
 * encrypted session data.
 */
export const ENCRYPTION_KEY_PREFIX = "encryption_key_";
