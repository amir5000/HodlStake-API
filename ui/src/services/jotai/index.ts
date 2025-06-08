import { atom } from "jotai";

type State = {
    address: string;
    chainId: number;
};

const initialState: State = {
    address: "",
    chainId: 8453,
};

const state = atom(initialState);
export const stateAtom = atom((get) => get(state),
(get, set, update: State) => {
    set(state, { ...get(state), ...update });
  },
);