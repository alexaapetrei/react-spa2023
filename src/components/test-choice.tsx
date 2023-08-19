type AnsProps = {
  val: string;
  text: string;
  active: string[];
  correct: string;
  checked: boolean;
};

export default function TestChoice({
  text,
  val,
  active,
  correct,
  checked,
}: AnsProps) {
  const tick = checked ? (correct?.includes(val) ? "✔️" : "❌") : "🤔";
  const selectedByUser = active.includes(val);
  return (
    <div
      className={`p-3 rounded-md mb-3 flex gap-3 ${
        selectedByUser ? "btn-primary" : "btn-secondary"
      }`}
    >
      <div className="avatar placeholder">
        <div className="bg-neutral-focus text-neutral-content rounded-full w-12 font-semibold uppercase">
          {checked
            ? correct?.includes(val)
              ? "✔️"
              : "❌"
            : selectedByUser
            ? tick
            : val}
        </div>
      </div>

      <span className={` wrap-balance `}>{text}</span>
    </div>
  );
}
