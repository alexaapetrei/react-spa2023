import { useState, useEffect } from "react";
import { MessageCircle, Facebook, Mail, Twitter } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Social() {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const socialLinks = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      href: isMobile
        ? "whatsapp://send?text=https://test.urssur.com E cea mai faina metoda de a invata pentru examenul sala"
        : "https://api.whatsapp.com/send?text=https://test.urssur.com E cea mai faina metoda de a invata pentru examenul sala",
      show: true,
    },
    {
      icon: MessageCircle,
      label: "SMS",
      href: "sms:?&body=https://test.urssur.com",
      show: isMobile,
    },
    {
      icon: Facebook,
      label: "Facebook",
      href: "https://www.facebook.com/sharer/sharer.php?u=https://test.urssur.com",
      show: true,
    },
    {
      icon: MessageCircle,
      label: "Messenger",
      href: "fb-messenger://share/?link=https://test.urssur.com",
      show: isMobile,
    },
    {
      icon: Mail,
      label: "Email",
      href: "mailto:?subject=Chestionare Auto DRPCIV - Invata pe UrsSur.com&body=Cea mai buna metoda de a invata pentru examenul sala: https://test.urssur.com",
      show: true,
    },
    {
      icon: Twitter,
      label: "Twitter",
      href: "https://twitter.com/intent/tweet?source=https://test.urssur.com&text=Chestionare Auto DRPCIV - Invata pe UrsSur.com: https://test.urssur.com&via=urssur",
      show: true,
    },
  ];

  const visibleLinks = socialLinks.filter(link => link.show);

  return (
    <div className="mt-auto pt-4">
      <p className="text-sm text-muted-foreground text-center mb-4">{t("common.disourage")}</p>
      <div className="grid grid-cols-2 gap-2">
        {visibleLinks.map((link, index) => (
          <a
            key={index}
            className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
            href={link.href}
            target={!link.href.startsWith('sms:') && !link.href.startsWith('whatsapp:') && !link.href.startsWith('mailto:') ? "_blank" : undefined}
            rel="noopener noreferrer"
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
