import { MessageCircle, Facebook, Mail, Twitter } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Social() {
  const { t } = useTranslation();
  const url = typeof window === "undefined" ? "https://test.urssur.com" : window.location.origin;
  const message = `${t("common.disourage")} ${url}`;
  const links = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      href: `whatsapp://send?text=${encodeURIComponent(message)}`,
    },
    { icon: MessageCircle, label: "SMS", href: `sms:?body=${encodeURIComponent(message)}` },
    {
      icon: Facebook,
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      icon: MessageCircle,
      label: "Messenger",
      href: `fb-messenger://share/?link=${encodeURIComponent(url)}`,
    },
    {
      icon: Mail,
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent("UrsSur")}&body=${encodeURIComponent(message)}`,
    },
    {
      icon: Twitter,
      label: "Twitter",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-center text-lg text-muted-foreground">{t("common.disourage")}</p>
      <div className="grid grid-cols-2 gap-2">
        {links.map((link) => (
          <a
            key={link.label}
            className="flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
          >
            <link.icon className="size-5 shrink-0" />
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
