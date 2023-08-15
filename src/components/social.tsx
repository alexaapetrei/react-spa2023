export function Social() {
  return (
    <>
      <a
        className="btn btn-outline btn-success"
        href="whatsapp://send?text=https://test.urssur.com E cea mai faina metoda de a invata pentru examenul sala"
        title="Share pe WhatsApp"
      >
        WhatsApp
      </a>
      <a
        className="btn btn-outline bg-slate-500"
        href="sms:?&body=https://test.urssur.com"
      >
        Share SMS
      </a>

      <a
        className="btn btn-outline btn-info"
        href="https://www.facebook.com/sharer/sharer.php?u=https://test.urssur.com"
        target="_blank"
        title="Share pe Facebook"
      >
        Facebook
      </a>
      <a
        className="btn btn-outline bg-fuchsia-600"
        href="fb-messenger://share/?link=https://test.urssur.com"
        target="_blank"
      >
        Messenger
      </a>

      <a
        className="btn btn-outline btn-primary"
        href="https://twitter.com/intent/tweet?source=https://test.urssur.com&text=Chestionare Auto DRPCIV - Invata pe UrsSur.com: https://urssur.com&via=urssur"
        target="_blank"
        title="Share pe Twitter"
      >
        X - Twitter
      </a>

      <a
        className="btn btn-outline btn-dark"
        href="mailto:?subject=Chestionare Auto DRPCIV - Invata pe UrsSur.com&body=Cea mai buna metoda de a invata pentru examenul sala: https://test.urssur.com"
        target="_blank"
        title="Trimite pe email"
      >
        e-mail
      </a>
    </>
  );
}
