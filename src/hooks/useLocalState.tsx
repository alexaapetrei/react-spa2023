import { useState, useEffect } from "react";

type localState = { corecte: string[]; gresite: string[] };

function useLocalState(
  defaultState: localState = { corecte: [], gresite: [] }
): [localState, React.Dispatch<React.SetStateAction<localState>>] {
  const [state, setState] = useState<localState>(defaultState);

  useEffect(() => {
    const savedState = localStorage.getItem("state");
    if (savedState) setState(JSON.parse(savedState));
  }, []);

  return [state, setState];
}

export default useLocalState;
