import { Router } from 'express'

const router = Router()
router.get('/', (_req, res) => res.json({ status: 'ok', service: 'prontuario-ai-api' }))
export default router
