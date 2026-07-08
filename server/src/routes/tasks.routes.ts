import { Router } from 'express';
import { listTasks, getTask, createTask, updateTask, patchStatus, deleteTask } from '../controllers/tasks.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', listTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.patch('/:id/status', patchStatus);
router.delete('/:id', deleteTask);

export default router;
