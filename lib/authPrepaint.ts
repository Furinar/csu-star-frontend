import { AUTH_STORAGE_KEY } from "@/store/useAuthStore";

/**
 * Blocking head script: restore login chrome before first paint.
 * Sets `html[data-auth="1"]` and optional `--nav-avatar-url` from localStorage
 * so the nav avatar slot does not flash placeholder → real avatar on refresh.
 */
export function getAuthPrepaintScript(): string {
  // Keep this self-contained (no imports) — inlined into <head>.
  return `(function(){try{var raw=localStorage.getItem(${JSON.stringify(AUTH_STORAGE_KEY)});if(!raw)return;var parsed=JSON.parse(raw);var s=parsed&&parsed.state;if(!s||typeof s!=="object")return;var loggedIn=!!((typeof s.access_token==="string"&&s.access_token)||(s.user&&typeof s.user==="object"));if(!loggedIn)return;document.documentElement.setAttribute("data-auth","1");var u=s.user&&s.user.avatar_url;if(typeof u!=="string")return;u=u.trim();if(!u||u.indexOf("identicon:")===0)return;if(u.charAt(0)==="/"||u.indexOf("https://")===0||u.indexOf("http://")===0||u.indexOf("data:")===0){var safe=u.replace(/\\\\/g,"\\\\\\\\").replace(/"/g,'\\\\"');document.documentElement.style.setProperty("--nav-avatar-url",'url("'+safe+'")');}}catch(e){}})();`;
}
