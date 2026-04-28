import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { createGroup, getMyGroups, getGroup, addMember, deleteGroup } from '../controllers/groupController.js';
import { addExpense, getGroupExpenses, deleteExpense, getGroupBalances, settleUp, debugBalances } from '../controllers/expenseController.js';
import { getSpendingInsights, aiCategorizeRoute } from '../services/aiService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// Groups
router.post('/groups', authenticate, createGroup);
router.get('/groups', authenticate, getMyGroups);
router.get('/groups/:id', authenticate, getGroup);
router.post('/groups/:id/members', authenticate, addMember);
router.delete('/groups/:id', authenticate, deleteGroup);

// Expenses
router.post('/expenses', authenticate, addExpense);
router.get('/groups/:id/expenses', authenticate, getGroupExpenses);
router.delete('/expenses/:id', authenticate, deleteExpense);
router.post('/expenses/settle', authenticate, settleUp);

// Balances
router.get('/groups/:id/balances', authenticate, getGroupBalances);
router.get('/groups/:id/debug-balances', authenticate, debugBalances);

// AI
router.post('/ai/categorize', authenticate, aiCategorizeRoute);
router.post('/ai/insights', authenticate, getSpendingInsights);

export default router;
