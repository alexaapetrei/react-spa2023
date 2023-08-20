import { useEffect, useCallback } from "react";

function useTheme() {
  // The function to change the theme
  const changeTheme = useCallback(() => {
    const current = document.documentElement.getAttribute("data-theme");
    const themes = ["cyberpunk", "dracula", "lofi", "mutedDark", "cookie"];

    // Get the index of the current theme.
    const currentIndex = themes.indexOf(current!);

    // Calculate the index of the next theme. If current is not in the list, default to 0.
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % themes.length;

    document.documentElement.setAttribute("data-theme", themes[nextIndex]);
    localStorage.setItem("currentTheme", themes[nextIndex]);
  }, []);

  // Initialize the theme when the component mounts
  useEffect(() => {
    //check for theme
    const currentTheme = localStorage.getItem("currentTheme") || "cookie";
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, []);

  return changeTheme;
}

export default useTheme;
