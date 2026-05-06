/**
 * Runs before React hydrates so the first paint matches `servlo-theme` in localStorage.
 * Default is dark when key is missing or invalid.
 */
export function ThemeScript() {
  const code = `(function(){try{var v=localStorage.getItem("servlo-theme");if(v==="light"){document.documentElement.classList.remove("dark");}else{document.documentElement.classList.add("dark");}}catch(e){document.documentElement.classList.add("dark");}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
