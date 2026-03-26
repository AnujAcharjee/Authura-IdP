import 'express-session';

declare module 'express-session' {
  interface SessionData {
    oauth?: OAuthSessionData;
    user?: AppUser;
  }
}
