/**
 * Guarda de exaustividade para uniões discriminadas (ex.: RelicEffect,
 * ForgeEffect). Usar como o `default` de um switch sobre `.kind` depois de
 * listar todos os casos conhecidos: se um caso novo for adicionado à união
 * sem que o switch seja atualizado, o parâmetro deixa de ser `never` e o
 * TypeScript aponta o erro em tempo de compilação, no próprio switch.
 */
export function assertNever(value: never): never {
  throw new Error(`Caso não tratado: ${JSON.stringify(value)}`);
}
