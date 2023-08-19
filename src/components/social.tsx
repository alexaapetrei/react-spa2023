import { useState, useEffect } from "react";

export function Social() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  return (
    <>
      <a
        className="btn btn-outline btn-success"
        href={
          isMobile
            ? "whatsapp://send?text=https://test.urssur.com E cea mai faina metoda de a invata pentru examenul sala"
            : "https://api.whatsapp.com/send?text=https://test.urssur.com E cea mai faina metoda de a invata pentru examenul sala"
        }
        title="Share pe WhatsApp"
        target="_blank"
        rel="noopener noreferrer"
      >
        💚 WhatsApp
      </a>
      {isMobile && (
        <a
          className="btn btn-outline bg-slate-500"
          href="sms:?&body=https://test.urssur.com"
        >
          📱 Share SMS
        </a>
      )}

      <a
        className="btn btn-outline btn-info"
        href="https://www.facebook.com/sharer/sharer.php?u=https://test.urssur.com"
        target="_blank"
        title="Share pe Facebook"
        rel="noopener noreferrer"
      >
        📘 Facebook
      </a>
      {isMobile && (
        <a
          className="btn btn-outline bg-fuchsia-600"
          href="fb-messenger://share/?link=https://test.urssur.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          🗨 Messenger
        </a>
      )}
      <a
        className="btn btn-outline btn-dark"
        href="mailto:?subject=Chestionare Auto DRPCIV - Invata pe UrsSur.com&body=Cea mai buna metoda de a invata pentru examenul sala: https://test.urssur.com"
        target="_blank"
        title="Trimite pe email"
        rel="noopener noreferrer"
      >
        📧 e-mail
      </a>
      <a
        className="btn btn-outline btn-primary bg-blue-200"
        href="https://twitter.com/intent/tweet?source=https://test.urssur.com&text=Chestionare Auto DRPCIV - Invata pe UrsSur.com: https://test.urssur.com&via=urssur"
        target="_blank"
        title="Share pe Twitter"
        rel="noopener noreferrer"
      >
        🐤Twitter
      </a>
    </>
  );
}
