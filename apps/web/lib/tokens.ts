const ACCESS_TOKEN_KEY = "coach_access_token";
const TOKEN_EVENT = "coach-token-changed";
type TokenListener = () => void;

const listeners = new Set<TokenListener>();

const notifyListeners = () => {
  for (const listener of listeners) {
    listener();
  }
};

export const tokenStore = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setAccessToken(token: string) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    window.dispatchEvent(new Event(TOKEN_EVENT));
    notifyListeners();
  },
  clear() {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.dispatchEvent(new Event(TOKEN_EVENT));
    notifyListeners();
  },
  subscribe(listener: TokenListener): () => void {
    if (typeof window === "undefined") {
      return () => {};
    }
    listeners.add(listener);
    const handler = () => listener();
    window.addEventListener(TOKEN_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      listeners.delete(listener);
      window.removeEventListener(TOKEN_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }
};

