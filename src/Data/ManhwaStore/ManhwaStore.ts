import type { Manhwa } from "@Data/Manhwa/CreateManhwaEntry";
import { Unit, useProperty } from "Jsock";

export const createManhwaStore = Unit(() => {
  const manhwas = useProperty<Manhwa[]>([]);

  const addManhwa = (m: Manhwa) => {
    manhwas.set((oldManhwas) => {
      if (oldManhwas.find((elem) => elem.hash === m.hash)) {
        return oldManhwas;
      }
      return [...oldManhwas, m];
    });
  };

  const deleteManhwa = (resourceHash: string) => {
    manhwas.set((oldManhwas) => {
      const index = oldManhwas.findIndex((elem) => elem.hash === resourceHash);
      if (index >= 0) return [...oldManhwas].splice(index, 1);
      return oldManhwas;
    });
  };

  const findManhwa = (resourceHash: string) =>
    manhwas.get().find((elem) => elem.hash === resourceHash);

  return {
    manhwas: manhwas.get(),
    addManhwa,
    deleteManhwa,
    findManhwa,
  };
});
