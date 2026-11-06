// ========================================================================
// SW Service Desk v1.0 - Controlador de IA Privada (Gemini API)
// Todas as ações de sugestão requerem validação humana explícita
// Empresa: SW Cloud Solutions
// ========================================================================

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { aiAssistantService } from '../services/aiAssistantService.js';
import { query, queryOne } from '../db/index.js';

export const aiController = {
  /**
   * Resumo executivo de ticket
   */
  async summarizeTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { ticketId } = req.body;

    if (!ticketId) {
      res.status(400).json({ error: 'ID do ticket obrigatório.' });
      return;
    }

    const ticket = await queryOne('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket não encontrado.' });
      return;
    }

    const comments = await query(
      `SELECT c.*, u.full_name as author_name 
       FROM ticket_comments c 
       JOIN users u ON c.author_id = u.id 
       WHERE c.ticket_id = ? 
       ORDER BY c.created_at ASC`,
      [ticketId]
    );

    const result = await aiAssistantService.summarizeTicket(ticket, comments);
    res.json(result);
  },

  /**
   * Sugestão de classificação ITIL
   */
  async suggestClassification(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { title, description } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Título e descrição são necessários para classificação.' });
      return;
    }

    const result = await aiAssistantService.suggestClassification(title, description);
    res.json(result);
  },

  /**
   * Sugestão de resposta técnica
   */
  async suggestResponse(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { ticketId } = req.body;

    const ticket = await queryOne(
      `SELECT t.*, u.full_name as requester_name 
       FROM tickets t 
       JOIN users u ON t.requester_id = u.id 
       WHERE t.id = ?`,
      [ticketId]
    );

    if (!ticket) {
      res.status(404).json({ error: 'Ticket não encontrado.' });
      return;
    }

    const comments = await query('SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);
    const result = await aiAssistantService.suggestResponseDraft(ticket, comments);
    res.json(result);
  },

  /**
   * Pesquisa semântica na Base de Conhecimento
   */
  async searchKnowledgeBase(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { query: searchQuery } = req.body;

    if (!searchQuery) {
      res.status(400).json({ error: 'Termo de pesquisa obrigatório.' });
      return;
    }

    const results = await aiAssistantService.searchKnowledgeBase(String(searchQuery));
    res.json(results);
  },
};
