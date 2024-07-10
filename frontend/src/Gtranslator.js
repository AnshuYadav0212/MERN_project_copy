import React, { useEffect, useRef, useState } from "react";

const Layout = ({ children }) => {
  const googleTranslateRef = useRef(null);
  const [isHindi, setIsHindi] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    window.googleTranslateElementInit = () => {
      const googleTranslate = new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
          layout:
            window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
          includedLanguages: "en,hi",
        },
        googleTranslateRef.current
      );

      // Apply custom styles to the Google Translate widget
      const style = document.createElement("style");
      style.innerHTML = `
        #google_translate_element { display: none; }
        .translate-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 50%; /* Make the button circular */
          padding: 10px; /* Increase padding for circular button */
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        .translate-button:hover {
          background-color: #0056b3;
        }
        .skiptranslate {
          display: none !important; /* Hide the skiptranslate iframe */
        }
      `;
      document.head.appendChild(style);

      // Remove "Powered by Google" link
      const poweredByGoogle = document.querySelector(
        ".VIpgJd-ZVi9od-l4eHX-hSRGPd"
      );
      if (poweredByGoogle) {
        poweredByGoogle.parentElement.style.display = "none";
      }
    };

    return () => {
      document.body.removeChild(script);
      delete window.googleTranslateElementInit;
    };
  }, []);

  const toggleLanguage = () => {
    const languageDropdown = document.querySelector(".goog-te-combo");
    if (languageDropdown) {
      if (isHindi) {
        console.log("To English");
        languageDropdown.value = "en";
        languageDropdown.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        console.log("To Hindi");
        languageDropdown.value = "hi";
        languageDropdown.dispatchEvent(new Event("change", { bubbles: true }));
      }
      setIsHindi(!isHindi);
    }
  };

  return (
    <div>
      <noscript>You need to enable JavaScript to run this app.</noscript>
      <div id="google_translate_element" ref={googleTranslateRef}></div>
      <button className="translate-button" onClick={toggleLanguage}>
        {isHindi ? (
          <span data-lang="en" className="notranslate">
            Eng
          </span>
        ) : (
          <span data-lang="hi" className="notranslate">
            हिंदी
          </span>
        )}
      </button>
      {children}
    </div>
  );
};

export default Layout;
