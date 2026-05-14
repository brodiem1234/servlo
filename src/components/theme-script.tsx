/**
 * Runs before React hydrates so the first paint is always dark.
 * v2 TODO: restore localStorage-based theme switching when light mode is re-enabled.
 * Original code (kept for v2):
 *   var v=localStorage.getItem("servlo-theme");
 *   if(v==="light"){document.documentElement.classList.remove("dark");}
 *   else{document.documentElement.classList.add("dark");}
 */
export function ThemeScript() {
  const code = `(function(){try{document.documentElement.classList.add("dark");localStorage.setItem("servlo-theme","dark");}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
