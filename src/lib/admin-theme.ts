/** Shared by the admin layout (server) and the theme toggle (client). */
export const ADMIN_THEME_KEY = "naturo-admin-theme";

/** Runs before paint so the admin never flashes the wrong theme. Default: dark. */
export const THEME_BOOT_SCRIPT = `(function(){try{var c=localStorage.getItem('${ADMIN_THEME_KEY}')||'dark';var t=c==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):c;document.getElementById('admin-root').setAttribute('data-theme',t);}catch(e){}})();`;
