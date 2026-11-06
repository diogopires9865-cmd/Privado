// ========================================================================
// SW Service Desk v1.0 - Controlador de Comentários, Notas Internas e Anexos
// Empresa: SW Cloud Solutions
// ========================================================================

import { Response } from 'express';
import { query, queryOne, execute, transaction } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { notificationService } from '../services/notificationService.js';

export const commentController = {
  /**
   * Adicionar comentário público ou nota interna
   */
  async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    const { body, commentType = 'PUBLIC' } = req.body;

    if (!body || !body.trim()) {
      res.status(400).json({ error: 'O conteúdo do comentário não pode estar vazio.' });
      return;
    }

    // RBAC: Clientes/utilizadores comuns NÃO podem criar notas internas
    if (user.role === 'user' && commentType === 'INTERNAL_NOTE') {
      res.status(403).json({ error: 'Não tem permissão para adicionar notas internas confidenciais.' });
      return;
    }

    const ticket = await queryOne('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket não encontrado.' });
      return;
    }

    // RBAC: Utilizador comum só pode comentar no seu próprio ticket
    if (user.role === 'user' && ticket.requester_id !== user.id) {
      res.status(403).json({ error: 'Acesso negado a este ticket.' });
      return;
    }

    const result = await transaction(async (tx) => {
      // 1. Inserir comentário
      const commentRes = await tx.execute(
        `INSERT INTO ticket_comments (ticket_id, author_id, comment_type, body)
         VALUES (?, ?, ?, ?)`,
        [ticketId, user.id, commentType, body.trim()]
      );

      // 2. Se for a primeira resposta pública de um técnico, satisfaz o SLA de primeira resposta
      let firstRespondedAt = ticket.first_responded_at;
      let newStatus = ticket.status;

      if (commentType === 'PUBLIC' && ['agent', 'supervisor', 'admin'].includes(user.role)) {
        if (!firstRespondedAt) {
          firstRespondedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
          await tx.execute('UPDATE tickets SET first_responded_at = ? WHERE id = ?', [firstRespondedAt, ticketId]);
          
          await tx.execute(
            `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
             VALUES (?, ?, 'SLA_ATUALIZADO', NULL, 'CUMPRIDO', 'Primeira resposta pública registada. SLA de primeira resposta concluído.')`,
            [ticketId, user.id]
          );
        }

        // Se o ticket estava NOVO ou ATRIBUIDO, passa para EM_PROGRESSO
        if (ticket.status === 'NOVO' || ticket.status === 'ATRIBUIDO') {
          newStatus = 'EM_PROGRESSO';
          await tx.execute('UPDATE tickets SET status = ? WHERE id = ?', ['EM_PROGRESSO', ticketId]);
        }
      }

      // 3. Registar evento no histórico
      const eventType = commentType === 'INTERNAL_NOTE' ? 'NOTA_INTERNA' : 'COMENTARIO_PUBLICO';
      await tx.execute(
        `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
         VALUES (?, ?, ?, NULL, NULL, ?)`,
        [
          ticketId,
          user.id,
          eventType,
          commentType === 'INTERNAL_NOTE'
            ? `Nota interna confidencial adicionada por ${user.fullName}.`
            : `Comentário público adicionado por ${user.fullName}.`,
        ]
      );

      return { commentId: commentRes.insertId, firstRespondedAt, newStatus };
    });

    // 4. Notificar intervenientes
    if (commentType === 'PUBLIC') {
      if (user.id === ticket.requester_id) {
        // Solicitante respondeu -> notificar técnico atribuído
        if (ticket.assigned_agent_id) {
          notificationService.createNotification(
            ticket.assigned_agent_id,
            'Nova Mensagem no Ticket',
            `O solicitante respondeu ao ticket #${ticket.ticket_number}`,
            'TICKET_UPDATED',
            `/tickets/${ticketId}`
          );
        }
      } else {
        // Técnico respondeu -> notificar solicitante
        notificationService.createNotification(
          ticket.requester_id,
          'Nova Resposta no seu Ticket',
          `O técnico ${user.fullName} respondeu ao seu pedido #${ticket.ticket_number}`,
          'TICKET_UPDATED',
          `/tickets/${ticketId}`
        );
      }
    }

    res.status(201).json({
      success: true,
      commentId: result.commentId,
      message: 'Comentário registado com sucesso.',
    });
  },

  /**
   * Upload de anexos para o ticket
   */
  async uploadAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
      return;
    }

    const ticket = await queryOne('SELECT id, ticket_number, requester_id FROM tickets WHERE id = ?', [ticketId]);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket não encontrado.' });
      return;
    }

    if (user.role === 'user' && ticket.requester_id !== user.id) {
      res.status(403).json({ error: 'Acesso negado.' });
      return;
    }

    const result = await transaction(async (tx) => {
      const attachRes = await tx.execute(
        `INSERT INTO ticket_attachments (ticket_id, uploader_id, file_name, stored_file_name, file_size, mime_type, file_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          ticketId,
          user.id,
          file.originalname,
          file.filename,
          file.size,
          file.mimetype,
          file.path,
        ]
      );

      await tx.execute(
        `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
         VALUES (?, ?, 'ANEXO_ADICIONADO', NULL, ?, ?)`,
        [ticketId, user.id, file.originalname, `Anexo '${file.originalname}' (${Math.round(file.size / 1024)} KB) enviado por ${user.fullName}.`]
      );

      return attachRes.insertId;
    });

    res.status(201).json({
      success: true,
      attachmentId: result,
      fileName: file.originalname,
      message: 'Ficheiro anexado com sucesso.',
    });
  },
};
