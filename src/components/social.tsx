import { useState, useEffect } from "react";
import { MessageCircle, Facebook, Mail, Twitter } from "lucide-react";

export function Social() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <a
        className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
        href={
          isMobile
            ? "whatsapp://send?text=https://test.urssur.com E cea mai faina metoda de a invata pentru examenul sala"
            : "https://api.whatsapp.com/send?text=https://test.urssur.com E cea mai faina metoda de a invata pentru examenul sala"
        }
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
      
      {isMobile && (
        <a 
          className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
          href="sms:?&body=https://test.urssur.com"
        >
          <MessageCircle className="h-4 w-4" />
          SMS
        </a>
      )}

      <a
        className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
        href="https://www.facebook.com/sharer/sharer.php?u=https://test.urssur.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Facebook className="h-4 w-4" />
        Facebook
      </a>

      {isMobile && (
        <a
          className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
          href="fb-messenger://share/?link=https://test.urssur.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="h-4 w-4" />
          Messenger
        </a>
      )}

      <a
        className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
        href="mailto:?subject=Chestionare Auto DRPCIV - Invata pe UrsSur.com&body=Cea mai buna metoda de a invata pentru examenul sala: https://test.urssur.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Mail className="h-4 w-4" />
        Email
      </a>

      <a
        className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
        href="https://twitter.com/intent/tweet?source=https://test.urssur.com&text=Chestionare Auto DRPCIV - Invata pe UrsSur.com: https://test.urssur.com&via=urssur"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Twitter className="h-4 w-4" />
        Twitter
      </a>
    </div>
  );
}
