import { atom, useAtom } from "jotai"

import { mails } from "./data"
import type { Mail } from "./data"

type Config = {
  selected: Mail["id"] | null
}

const configAtom = atom<Config>({
  selected: mails[0].id,
})

export function useMail() {
  return useAtom(configAtom)
}