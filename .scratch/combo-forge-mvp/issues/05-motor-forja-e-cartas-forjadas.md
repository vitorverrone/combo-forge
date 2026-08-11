# 05 — Motor: Forja e Cartas Forjadas

**What to build:** O motor gera a Forja ao vencer uma Rodada (da 1ª à 5ª): 3 ofertas com RNG injetado (2 de Efeito de Forja + 1 de Relíquia), aplica os Efeitos de Forja (+Valor, Multiplicador, Curinga, Gatilho) a cartas do Baralho transformando-as em Cartas Forjadas, e permite empilhar efeitos em Forjas futuras resolvendo somas antes de multiplicadores. Entrega as funções de geração e aplicação com testes.

**Blocked by:** 02 — Motor: Padrões e Valor-Base, 03 — Motor: Baralho, Mão e Descarte

**Status:** done

- [ ] Vencer a Rodada R (1–5) gera 3 ofertas de Forja distintas com RNG injetado; vencer a 6ª Rodada encerra a Run em vitória, sem Forja
- [ ] Aplicar um Efeito de Forja transforma a carta em Carta Forjada com efeito permanente na Run
- [ ] Uma Carta Forjada pode receber novos efeitos em Forjas futuras, com ordem de resolução somas → multiplicadores
- [ ] Curinga conta como qualquer Valor e qualquer Naipe para formar Padrões
- [ ] Gatilho concede o bônus apenas quando a condição é satisfeita (ex.: se for a 3ª Jogada da Rodada)
- [ ] Ofertas de Relíquia respeitam o teto de 3 Relíquias ativas; oferta excedente vira uma terceira oferta de carta
- [ ] As ofertas e a aplicação são determinísticas com o mesmo seed
