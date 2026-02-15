import { cn } from "@/lib/utils";

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
  const selectedByUser = active.includes(val);
  const isCorrect = correct?.includes(val);
  
  let classes = "test-answer";
  
  if (checked) {
    if (isCorrect) {
      classes += " correct";
    } else if (selectedByUser) {
      classes += " incorrect";
    }
  } else if (selectedByUser) {
    classes += " selected";
  }

  const getIcon = () => {
    if (checked) {
      return isCorrect ? "✓" : selectedByUser ? "✗" : "";
    }
    return val.toUpperCase();
  };

  return (
    <div className={classes}>
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
        checked && isCorrect 
          ? "bg-green-500 text-white" 
          : checked && selectedByUser && !isCorrect
          ? "bg-red-500 text-white"
          : selectedByUser
          ? "bg-primary text-primary-foreground"
          : "bg-muted"
      )}>
        {getIcon()}
      </div>
      <span className="wrap-balance">{text}</span>
    </div>
  );
}
