-- 0006 — Nome de Exibição: acrescenta termos à lista de moderação (0003)
--
-- Espelho do array atualizado em engine/displayName.ts (fonte da verdade).
-- Redefine só a função de termos — sem SECURITY DEFINER/search_path porque
-- o original em 0003_display_name.sql também não tinha (não é preciso
-- redeclarar o que nunca existiu).

create or replace function public._display_name_prohibited_terms()
returns text[]
language sql
immutable
as $$
  select array[
    'porra', 'caralho', 'merda', 'buceta', 'cacete', 'piroca', 'cuzao',
    'arrombado', 'arrombada', 'punheta', 'xoxota', 'putinha', 'corno',
    'fdp', 'desgracado', 'desgracada', 'viadinho', 'bosta', 'puta', 'pinto', 'retardado',
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'whore',
    'faggot', 'nigger', 'nigga', 'motherfucker', 'dickhead', 'slut',
    'retard', 'pussy'
  ];
$$;

revoke all on function public._display_name_prohibited_terms() from public;
