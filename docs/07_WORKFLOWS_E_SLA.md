# SW Service Desk v1.0 - Workflows e Regras de SLA
**Empresa:** SW Cloud Solutions  
**Versão:** 1.0.0 Production Ready  
**Data:** 2026-11-06  

---

## 1. Fluxo do Ciclo de Vida do Ticket (End-to-End)

```
[Solicitante Abre Ticket]
          |
          v
    [Estado: NOVO] ----------> (Cálculo Automático de Prioridade: Impacto x Urgência)
          |                    (Cálculo de Prazos de SLA: 1ª Resposta e Resolução)
          v
 [Atribuição a Técnico/Equipa]
          |
          v
  [Estado: ATRIBUIDO]
          |
          v
 [Técnico Inicia Trabalho] ---> (Adiciona 1ª Resposta / Nota Pública)
          |                     (Regista Timestamp de Primeira Resposta no SLA)
          v
[Estado: EM_PROGRESSO] <---------------------------------------------+
    |               |                                                |
    | (Precisa      | (Aguardando                                    |
    |  de info)     |  fornecedor)                                   |
    v               v                                                |
[PENDENTE_CLIENTE] [PENDENTE_TERCEIROS]                              |
    | (SLA Pausa)       | (SLA Pausa)                                |
    +---------------+---+                                            |
                    |                                                |
                    +------------(Informação Recebida)---------------+
                    |
                    v
          [Problema Corrigido]
                    |
                    v
          [Estado: RESOLVIDO] ---> (Notificação com Resumo ao Solicitante)
                    |
          +---------+---------+
          |                   |
          v                   v
[Solicitante Confirma]   [Solicitante Reabre]
          |                   |
          v                   v
   [Estado: FECHADO]    [Estado: EM_PROGRESSO]
```

### 1.1. Matriz de Prioridade Automática

| Impacto \ Urgência | BAIXA | MEDIA | ALTA | CRITICA |
| :--- | :---: | :---: | :---: | :---: |
| **CRITICO** | P3_MEDIA | P2_ALTA | P1_CRITICA | P1_CRITICA |
| **ALTO** | P4_BAIXA | P3_MEDIA | P2_ALTA | P1_CRITICA |
| **MEDIO** | P4_BAIXA | P3_MEDIA | P3_MEDIA | P2_ALTA |
| **BAIXO** | P4_BAIXA | P4_BAIXA | P3_MEDIA | P3_MEDIA |

### 1.2. Políticas de SLA e Calendários Operacionais

- **P1_CRITICA (Paragem de Produção / Falha de Infraestrutura Crítica):**
  - Primeira Resposta: **15 minutos**
  - Resolução: **2 horas**
  - Calendário: **24x7** (Contagem ininterrupta)
  - Notificação de Escalamento: Alerta a supervisores aos 75% (90 min) e violação aos 120 min.
  
- **P2_ALTA (Degradação Severa de Serviço):**
  - Primeira Resposta: **1 hora**
  - Resolução: **8 horas úteis**
  - Calendário: **8x5** (Dias úteis 09:00 - 18:00 com pausa 13:00-14:00)
  
- **P3_MEDIA (Incidente Normal / Acesso Individual):**
  - Primeira Resposta: **4 horas úteis**
  - Resolução: **24 horas úteis** (3 dias de trabalho)
  - Calendário: **8x5**
  
- **P4_BAIXA (Dúvidas, Pequenos Pedidos de Informação):**
  - Primeira Resposta: **8 horas úteis**
  - Resolução: **48 horas úteis** (6 dias de trabalho)
  - Calendário: **8x5**

---

## 2. Fluxo do Ciclo de Vida do Equipamento (CMDB)

```
[1. Entrada de Equipamento] -> Registo no CMDB: Tag de Ativo, Serial, Modelo, Specs
            |
            v
   [Estado: EM_STOCK]
            |
            v
[2. Atribuição a Utilizador] -> Seleciona Colaborador, Regista Termo no Histórico
            |
            v
  [Estado: ATRIBUIDO] <---------------------------------------------+
            |                                                       |
            +------------>[3. Associação a Ticket de Suporte]        |
            |             (Diagnóstico de Avaria / Substituição)     |
            |                                                       |
            v                                                       |
[4. Transferência de Utilizador] -----------------------------------+
    (Devolução do anterior e atribuição ao novo com registo forense)
            |
            v (Fim de Vida Útil / Avaria Irreparável)
[5. Abate de Equipamento] -> Justificação obrigatória, Desvinculação de licenças
            |
            v
   [Estado: ABATIDO] (Histórico imutável preservado)
```

---

## 3. Fluxo de Catálogo de Serviços e Aprovações

1. **Solicitação:** Utilizador escolhe item do catálogo (ex.: "Nova Máquina Virtual AWS" ou "Acesso a Repositório").
2. **Avaliação de Requisito de Aprovação:** Se o item tem `requires_approval = 1`:
   - Ticket criado no estado inicial `NOVO`.
   - Registo em `service_approvals` no estado `PENDENTE`.
   - Notificação imediata para a fila de **Aprovações** de supervisores.
3. **Decisão:**
   - **Se Aprovado:** Ticket avança automaticamente para a equipa técnica com registo no histórico de aprovação.
   - **Se Rejeitado:** Ticket é marcado como `CANCELADO` com a justificação do supervisor enviada ao solicitante.
