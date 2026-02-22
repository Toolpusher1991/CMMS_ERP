import { describe, it, expect } from 'vitest';
import {
  createProjectSchema,
  updateProjectSchema,
  createTaskSchema,
  updateTaskSchema,
  createProjectFileSchema,
} from '../schemas/project.schema';
import { createEquipmentSchema, updateEquipmentSchema } from '../schemas/equipment.schema';
import { createRigSchema } from '../schemas/rig.schema';
import { createAssetRigSchema, updateAssetRigSchema } from '../schemas/asset-integrity.schema';
import { createActionSchema, statusRequestSchema } from '../schemas/action.schema';
import { commentSchema } from '../schemas/comment.schema';
import { chatSchema } from '../schemas/chatbot.schema';
import { createFailureReportSchema } from '../schemas/failure-report.schema';
import { createTenderSchema } from '../schemas/tender.schema';
import { createInspectionReportSchema } from '../schemas/inspection-report.schema';

describe('Zod schemas', () => {
  // ── Project ──────────────────────────────────────────

  describe('createProjectSchema', () => {
    it('accepts valid project', () => {
      const result = createProjectSchema.safeParse({
        projectNumber: 'T208-001',
        name: 'Test Project',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing projectNumber', () => {
      const result = createProjectSchema.safeParse({ name: 'X' });
      expect(result.success).toBe(false);
    });

    it('rejects missing name', () => {
      const result = createProjectSchema.safeParse({ projectNumber: 'T208-001' });
      expect(result.success).toBe(false);
    });

    it('accepts optional fields', () => {
      const result = createProjectSchema.safeParse({
        projectNumber: 'T208-001',
        name: 'X',
        status: 'Aktiv',
        priority: 'Hoch',
        progress: 50,
        totalBudget: 100000,
      });
      expect(result.success).toBe(true);
    });

    it('rejects progress > 100', () => {
      const result = createProjectSchema.safeParse({
        projectNumber: 'T208-001',
        name: 'X',
        progress: 150,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProjectSchema', () => {
    it('accepts partial updates', () => {
      const result = updateProjectSchema.safeParse({ status: 'Fertig' });
      expect(result.success).toBe(true);
    });

    it('accepts empty object', () => {
      const result = updateProjectSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  // ── Task ─────────────────────────────────────────────

  describe('createTaskSchema', () => {
    it('accepts valid task', () => {
      const result = createTaskSchema.safeParse({ title: 'Do thing' });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = createTaskSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateTaskSchema', () => {
    it('accepts completedAt', () => {
      const result = updateTaskSchema.safeParse({ completedAt: '2025-01-01' });
      expect(result.success).toBe(true);
    });
  });

  // ── Project File ─────────────────────────────────────

  describe('createProjectFileSchema', () => {
    it('accepts valid file', () => {
      const result = createProjectFileSchema.safeParse({
        filename: 'doc.pdf',
        originalName: 'document.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        filePath: '/uploads/doc.pdf',
        uploadedBy: 'user-123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative fileSize', () => {
      const result = createProjectFileSchema.safeParse({
        filename: 'x',
        originalName: 'x',
        fileType: 'x',
        fileSize: -1,
        filePath: 'x',
        uploadedBy: 'x',
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Equipment ────────────────────────────────────────

  describe('createEquipmentSchema', () => {
    it('accepts valid equipment', () => {
      const result = createEquipmentSchema.safeParse({
        category: 'Pumps',
        name: 'Mud Pump',
        price: '50000',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
      const result = createEquipmentSchema.safeParse({ category: 'X', price: '1' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateEquipmentSchema', () => {
    it('accepts partial update', () => {
      const result = updateEquipmentSchema.safeParse({ price: '60000' });
      expect(result.success).toBe(true);
    });
  });

  // ── Rig ──────────────────────────────────────────────

  describe('createRigSchema', () => {
    it('accepts valid rig with string nums', () => {
      const result = createRigSchema.safeParse({
        name: 'T700',
        category: 'Heavy',
        maxDepth: '6000',
        maxHookLoad: '500',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxDepth).toBe(6000); // coerced to number
      }
    });

    it('accepts numeric values directly', () => {
      const result = createRigSchema.safeParse({
        name: 'T700',
        category: 'Heavy',
        maxDepth: 6000,
        maxHookLoad: 500,
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
      const result = createRigSchema.safeParse({
        category: 'X',
        maxDepth: 1000,
        maxHookLoad: 100,
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Asset Integrity ──────────────────────────────────

  describe('createAssetRigSchema', () => {
    it('accepts valid rig', () => {
      const result = createAssetRigSchema.safeParse({ name: 'T46', region: 'Oman' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid contractStatus', () => {
      const result = createAssetRigSchema.safeParse({
        name: 'T46',
        region: 'Oman',
        contractStatus: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateAssetRigSchema', () => {
    it('accepts nested arrays', () => {
      const result = updateAssetRigSchema.safeParse({
        inspections: [{ id: '1', type: 'internal', description: 'Check' }],
        issues: [],
      });
      expect(result.success).toBe(true);
    });
  });

  // ── Action ───────────────────────────────────────────

  describe('createActionSchema', () => {
    it('accepts valid action', () => {
      const result = createActionSchema.safeParse({ plant: 'T208', title: 'Fix pump' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid plant', () => {
      const result = createActionSchema.safeParse({ plant: 'INVALID', title: 'X' });
      expect(result.success).toBe(false);
    });

    it('rejects missing title', () => {
      const result = createActionSchema.safeParse({ plant: 'T208' });
      expect(result.success).toBe(false);
    });
  });

  describe('statusRequestSchema', () => {
    it('accepts valid request', () => {
      const result = statusRequestSchema.safeParse({
        involvedUsers: ['user1@test.com'],
        message: 'Please check',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty users array', () => {
      const result = statusRequestSchema.safeParse({
        involvedUsers: [],
        message: 'X',
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Comment ──────────────────────────────────────────

  describe('commentSchema', () => {
    it('accepts non-empty text', () => {
      const result = commentSchema.safeParse({ text: 'Hello' });
      expect(result.success).toBe(true);
    });

    it('trims whitespace', () => {
      const result = commentSchema.safeParse({ text: '  Hello  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe('Hello');
      }
    });

    it('rejects empty text', () => {
      const result = commentSchema.safeParse({ text: '' });
      expect(result.success).toBe(false);
    });
  });

  // ── Chatbot ──────────────────────────────────────────

  describe('chatSchema', () => {
    it('accepts message only', () => {
      const result = chatSchema.safeParse({ message: 'Hi' });
      expect(result.success).toBe(true);
    });

    it('accepts with conversation history', () => {
      const result = chatSchema.safeParse({
        message: 'Hi',
        conversationHistory: [{ role: 'user', content: 'Hello' }],
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid role in history', () => {
      const result = chatSchema.safeParse({
        message: 'Hi',
        conversationHistory: [{ role: 'hacker', content: 'X' }],
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Failure Report ───────────────────────────────────

  describe('createFailureReportSchema', () => {
    it('accepts valid report', () => {
      const result = createFailureReportSchema.safeParse({
        plant: 'T700',
        title: 'Pump failure',
        description: 'Mud pump stopped working',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid plant', () => {
      const result = createFailureReportSchema.safeParse({
        plant: 'UNKNOWN',
        title: 'X',
        description: 'Y',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid severity', () => {
      const result = createFailureReportSchema.safeParse({
        plant: 'T208',
        title: 'X',
        description: 'Y',
        severity: 'extreme',
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Tender ───────────────────────────────────────────

  describe('createTenderSchema', () => {
    it('accepts valid tender', () => {
      const result = createTenderSchema.safeParse({
        projectName: 'Nordseebohrung',
        selectedRig: 'T700',
        totalPrice: 500000,
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing totalPrice', () => {
      const result = createTenderSchema.safeParse({
        projectName: 'X',
        selectedRig: 'T700',
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Inspection Report ────────────────────────────────

  describe('createInspectionReportSchema', () => {
    it('accepts valid report', () => {
      const result = createInspectionReportSchema.safeParse({
        title: 'CAT III Inspection',
        type: 'catIII',
        plant: 'T208',
        equipment: 'Drawworks',
        inspectionDate: '2025-06-15',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing type', () => {
      const result = createInspectionReportSchema.safeParse({
        title: 'X',
        plant: 'T208',
        equipment: 'Y',
        inspectionDate: '2025-01-01',
      });
      expect(result.success).toBe(false);
    });
  });
});
