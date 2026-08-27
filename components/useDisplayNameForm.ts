import { useState } from 'react';

import { validateDisplayName } from '../engine';
import { displayNameErrorMessage } from './format';

interface UseDisplayNameFormArgs {
  readonly initialValue: string;
  readonly saving: boolean;
  readonly onSave: (name: string) => void;
}

/**
 * Estado + validação ao vivo do formulário de Nome de Exibição — compartilhado
 * entre o modal obrigatório (DailyChallengeScreen) e a edição no Perfil.
 * Valida no cliente a cada mudança (engine/displayName.ts, mesmas regras do
 * servidor) para nunca esperar rede pra dizer que um nome é curto/longo/tem
 * caractere ou termo proibido.
 */
export function useDisplayNameForm({ initialValue, saving, onSave }: UseDisplayNameFormArgs) {
  const [value, setValue] = useState(initialValue);
  const trimmed = value.trim();
  const validation = trimmed.length > 0 ? validateDisplayName(trimmed) : null;
  const clientError = validation !== null && !validation.valid ? displayNameErrorMessage(validation.reason) : null;
  const canSave = validation !== null && validation.valid && !saving;

  function submit() {
    if (canSave) onSave(trimmed);
  }

  return { value, setValue, clientError, canSave, submit };
}
