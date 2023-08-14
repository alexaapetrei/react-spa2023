import { Avatar, AvatarFallback } from "./ui/avatar";

type AnsProps = {
  val: string;
  text: string;
  active: string[];
  correct: string;
  checked: boolean;
};

export default function Ans({ text, val, active, correct, checked }: AnsProps) {
  const tick = checked ? (correct?.includes(val) ? "✔️" : "❌") : "🤔";
  const selectedByUser = active.includes(val);
  return (
    <div
      className={`border-cyan-100 rounded-md p-3 m-2  flex flex-row gap-3
        ${selectedByUser ? "bg-lime-900" : "bg-slate-300"}
        `}
    >
      <Avatar>
        <AvatarFallback className="uppercase font-semibold">
          {checked
            ? correct?.includes(val)
              ? "✔️"
              : "❌"
            : selectedByUser
            ? tick
            : val}
        </AvatarFallback>
      </Avatar>

      <span className="text">{text}</span>
    </div>
  );
}
