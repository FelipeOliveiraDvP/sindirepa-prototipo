import { describe, expect, it } from "vitest";
import { porteDeProdutivos } from "./porte";

describe("porteDeProdutivos", () => {
  it.each([
    [0, "pequena"],
    [1, "pequena"],
    [2, "pequena"],
    [3, "media"],
    [8, "media"],
    [9, "grande"],
    [20, "grande"],
  ] as const)("%i produtivos → %s", (quantidade, esperado) => {
    expect(porteDeProdutivos(quantidade)).toBe(esperado);
  });
});
