export const PENDING_INVITE_TOKEN_KEY = "pendingInviteToken";

export const storePendingInviteToken = (token) => {
  if (token) {
    localStorage.setItem(PENDING_INVITE_TOKEN_KEY, token);
  }
};

export const getPendingInviteToken = () => localStorage.getItem(PENDING_INVITE_TOKEN_KEY);

export const clearPendingInviteToken = () => {
  localStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
};
