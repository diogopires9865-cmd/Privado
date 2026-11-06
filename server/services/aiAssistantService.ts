// ========================================================================
// SW Service Desk v1.0 - Assistente de IA Privada para Técnicos
// Integração com Google Gemini SDK (@google/genai)
// Regra Fundamental: Todas as ações sensíveis requerem confirmação humana
// Empresa: SW Cloud Solutions
// ========================================================================

import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { query } from '../db/index.js';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && ENV.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
    } catch (err: any) {
      logger.warn('Não foi possível inicializar o cliente Gemini AI:', err.message);
    }
  }
  return aiClient;
}

export const aiAssistantService = {
  /**
   * Gera um resumo executivo estruturado de um ticket e dos seus comentários
   */
  async summarizeTicket(ticket: any, comments: any[]): Promise<{
    summary: string;
    keyPoints: string[];
    suggestedNextStep: string;
    requiresHumanConfirmation: boolean;
  }> {
    const ai = getAiClient();
    const commentsText = comments
      .map((c) => `[${c.created_at}] ${c.comment_type} (${c.author_name || 'Utilizador'}): ${c.body}`)
      .join('\n');

    if (ai) {
      try {
        const prompt = `És o assistente técnico de IA da SW Cloud Solutions para técnicos de Service Desk.
Analisa este ticket de suporte e gera um resumo executivo objetivo em Português:
Título: ${ticket.title}
Tipo: ${ticket.ticket_type}
Prioridade: ${ticket.priority}
Descrição Inicial: ${ticket.description}
Comentários e Histórico:
${commentsText || 'Nenhum comentário registado.'}

Responde APENAS em formato JSON válido com as seguintes chaves:
{
  "summary": "Resumo sintético em 2-3 frases do estado atual e do problema",
  "keyPoints": ["Ponto chave 1", "Ponto chave 2", "Ponto chave 3"],
  "suggestedNextStep": "Ação recomendada para o técnico humano validar"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const raw = response.text || '';
        const parsed = JSON.parse(raw);
        return {
          summary: parsed.summary || 'Resumo do ticket indisponível.',
          keyPoints: parsed.keyPoints || [],
          suggestedNextStep: parsed.suggestedNextStep || 'Rever histórico e contactar o solicitante.',
          requiresHumanConfirmation: true,
        };
      } catch (err: any) {
        logger.warn('Erro na chamada Gemini AI (summarizeTicket), usando análise heurística local:', err.message);
      }
    }

    // Heurística local de contingência caso não haja chave Gemini configurada
    const commentCount = comments.length;
    const lastComment = comments[comments.length - 1];
    return {
      summary: `Ticket #${ticket.ticket_number} (${ticket.ticket_type}) com prioridade ${ticket.priority}. Aberto com ${commentCount} interação(ões) registada(s).`,
      keyPoints: [
        `Problema reportado: ${ticket.title}`,
        `Estado atual: ${ticket.status}`,
        lastComment ? `Última atualização por ${lastComment.author_name || 'Técnico'}` : 'Aguardando primeira intervenção técnica',
      ],
      suggestedNextStep:
        ticket.status === 'NOVO'
          ? 'Atribuir a um técnico da equipa e registar a primeira resposta pública para cumprimento do SLA.'
          : 'Validar testes com o solicitante ou solicitar evidências adicionais.',
      requiresHumanConfirmation: true,
    };
  },

  /**
   * Sugere classificação automática (Categoria, Subcategoria, Impacto, Urgência)
   */
  async suggestClassification(title: string, description: string): Promise<{
    suggestedCategory: string;
    suggestedImpact: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
    suggestedUrgency: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    reasoning: string;
    requiresHumanConfirmation: boolean;
  }> {
    const ai = getAiClient();
    const textLower = `${title} ${description}`.toLowerCase();

    if (ai) {
      try {
        const prompt = `Analisa este pedido de suporte da SW Cloud Solutions e sugere a classificação ITIL:
Título: ${title}
Descrição: ${description}

Categorias válidas: "Cloud & Infraestrutura", "Hardware & Equipamentos", "Acessos & Software", "Rede & Telecomunicações".
Impactos válidos: "BAIXO", "MEDIO", "ALTO", "CRITICO".
Urgências válidas: "BAIXA", "MEDIA", "ALTA", "CRITICA".

Responde APENAS em JSON:
{
  "suggestedCategory": "Categoria recomendada",
  "suggestedImpact": "IMPACTO",
  "suggestedUrgency": "URGENCIA",
  "reasoning": "Breve justificação técnica"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        const parsed = JSON.parse(response.text || '{}');
        return {
          suggestedCategory: parsed.suggestedCategory || 'Cloud & Infraestrutura',
          suggestedImpact: parsed.suggestedImpact || 'MEDIO',
          suggestedUrgency: parsed.suggestedUrgency || 'MEDIA',
          reasoning: parsed.reasoning || 'Classificação sugerida por IA.',
          requiresHumanConfirmation: true,
        };
      } catch (err: any) {
        logger.warn('Erro Gemini AI (suggestClassification), usando regras determinísticas:', err.message);
      }
    }

    // Regras heurísticas determinísticas
    if (textLower.includes('parado') || textLower.includes('em baixo') || textLower.includes('crítico') || textLower.includes('produção') || textLower.includes('outage')) {
      return {
        suggestedCategory: 'Cloud & Infraestrutura',
        suggestedImpact: 'CRITICO',
        suggestedUrgency: 'CRITICA',
        reasoning: 'Detetados termos que indicam interrupção total de produção ou infraestrutura crítica.',
        requiresHumanConfirmation: true,
      };
    }

    if (textLower.includes('laptop') || textLower.includes('computador') || textLower.includes('ecrã') || textLower.includes('teclado') || textLower.includes('monitor')) {
      return {
        suggestedCategory: 'Hardware & Equipamentos',
        suggestedImpact: 'MEDIO',
        suggestedUrgency: 'MEDIA',
        reasoning: 'O pedido refere-se a componentes físicos ou postos de trabalho.',
        requiresHumanConfirmation: true,
      };
    }

    if (textLower.includes('vpn') || textLower.includes('wifi') || textLower.includes('firewall') || textLower.includes('rede')) {
      return {
        suggestedCategory: 'Rede & Telecomunicações',
        suggestedImpact: 'MEDIO',
        suggestedUrgency: 'ALTA',
        reasoning: 'Detetados termos relativos a conectividade e segurança de rede.',
        requiresHumanConfirmation: true,
      };
    }

    return {
      suggestedCategory: 'Acessos & Software',
      suggestedImpact: 'BAIXO',
      suggestedUrgency: 'MEDIA',
      reasoning: 'Pedido padrão de utilizador sobre software ou permissões.',
      requiresHumanConfirmation: true,
    };
  },

  /**
   * Sugere uma resposta técnica para o técnico enviar ao solicitante
   */
  async suggestResponseDraft(ticket: any, comments: any[]): Promise<{
    draftResponse: string;
    requiresHumanConfirmation: boolean;
  }> {
    const ai = getAiClient();
    const requesterName = ticket.requester_name || 'Colaborador';

    if (ai) {
      try {
        const prompt = `És o assistente técnico de IA da SW Cloud Solutions.
Elabora um rascunho de resposta profissional, cordial e tecnicamente preciso para o técnico rever antes de enviar ao solicitante:
Solicitante: ${requesterName}
Título do Ticket: ${ticket.title}
Descrição: ${ticket.description}
Últimos Comentários: ${JSON.stringify(comments.slice(-3))}

A resposta deve:
1. Cumprimentar o solicitante pelo nome.
2. Explicar claramente a ação que a equipa está a tomar ou pedir as informações necessárias.
3. Manter o tom prestável e corporativo da SW Cloud Solutions.
4. Assinar como "Equipa de Suporte - SW Cloud Solutions".

Devolve apenas o texto da mensagem sugerida.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        return {
          draftResponse: response.text?.trim() || `Olá ${requesterName}, estamos a analisar a sua situação.`,
          requiresHumanConfirmation: true,
        };
      } catch (err: any) {
        logger.warn('Erro Gemini AI (suggestResponseDraft), usando modelo padrão:', err.message);
      }
    }

    return {
      draftResponse: `Olá ${requesterName},

Agradecemos o seu contacto. A nossa equipa de Engenharia de Suporte já está a averiguar a situação reportada relativamente a "${ticket.title}".

Caso tenha registos de erro adicionais ou capturas de ecrã, por favor anexe a este ticket para acelerar o diagnóstico.

Com os melhores cumprimentos,
Equipa de Suporte | SW Cloud Solutions`,
      requiresHumanConfirmation: true,
    };
  },

  /**
   * Pesquisa semântica na Base de Conhecimento
   */
  async searchKnowledgeBase(searchQuery: string): Promise<any[]> {
    const terms = searchQuery.trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    // Pesquisa SQL com LIKE nos campos relevantes
    const conditions = terms.map(() => '(title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags LIKE ?)').join(' OR ');
    const params: any[] = [];
    terms.forEach((t) => {
      const p = `%${t}%`;
      params.push(p, p, p, p);
    });

    const articles = await query(
      `SELECT id, title, slug, summary, category_id, is_internal_only, helpful_count, view_count, tags, created_at 
       FROM kb_articles 
       WHERE is_published = 1 AND (${conditions})
       ORDER BY helpful_count DESC, view_count DESC LIMIT 5`,
      params
    );

    return articles;
  },
};
