import { useEffect, useState } from "react";
import { exchangeCodeForToken } from "../utils/spotifyAuth";

export default function AuthCallback({ onComplete }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (!code) {
      setError("ไม่พบ authorization code");
      return;
    }

    exchangeCodeForToken(code)
      .then(() => {
        // Clean the URL (remove ?code=...) then hand control back.
        window.history.replaceState({}, document.title, window.location.pathname);
        onComplete();
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [onComplete]);

  return (
    <div className="login-screen">
      <div className="login-card">
        {error ? (
          <>
            <h1>เกิดข้อผิดพลาด</h1>
            <p>{error}</p>
          </>
        ) : (
          <>
            <div className="lyrics-spinner" />
            <p>กำลังเชื่อมต่อ...</p>
          </>
        )}
      </div>
    </div>
  );
}
