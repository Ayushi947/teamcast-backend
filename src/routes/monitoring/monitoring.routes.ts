import { Router } from 'express';
import { MonitoringController } from '@/controllers/monitoring/monitoring.controller';
import { MetricsService } from '@/services/metrics/metrics.service';

const router = Router();
const metricsService = new MetricsService();
const monitoringController = new MonitoringController(metricsService);

/**
 * @openapi
 * /monitoring/metrics:
 *   get:
 *     summary: Get Prometheus metrics
 *     description: Retrieve application metrics in Prometheus format
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: Metrics in Prometheus format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/metrics', monitoringController.getMetrics); // TODO: Add Authentication

/**
 * @openapi
 * /monitoring/health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of the application
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *       503:
 *         description: Application is unhealthy
 */
router.get('/health', monitoringController.getHealth);

/**
 * @openapi
 * /monitoring/readiness:
 *   get:
 *     summary: Readiness probe
 *     description: Check if the application is ready to serve requests
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: Application is ready
 *       503:
 *         description: Application is not ready
 */
router.get('/readiness', monitoringController.getReadiness);

/**
 * @openapi
 * /monitoring/liveness:
 *   get:
 *     summary: Liveness probe
 *     description: Check if the application is alive
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: Application is alive
 *       503:
 *         description: Application is not alive
 */
router.get('/liveness', monitoringController.getLiveness);

/**
 * @openapi
 * /monitoring/alerts:
 *   post:
 *     summary: Handle alerts
 *     description: Endpoint for receiving alerts from Alertmanager
 *     tags:
 *       - Monitoring
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Alert received successfully
 */
router.post('/alerts', monitoringController.handleAlert);

/**
 * @openapi
 * /monitoring/simulate-error:
 *   get:
 *     summary: Simulate error
 *     description: Endpoint to simulate an error for testing purposes
 *     tags:
 *       - Monitoring
 *     responses:
 *       500:
 *         description: Simulated error
 */
router.get('/simulate-error', monitoringController.simulateError);

/**
 * @openapi
 * /monitoring/trigger-gc:
 *   get:
 *     summary: Trigger garbage collection
 *     description: Manually trigger the Node.js garbage collector
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: Garbage collection triggered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "GC triggered"
 *       400:
 *         description: GC not exposed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "GC not exposed. Run Node with --expose-gc flag"
 */
router.get('/trigger-gc', async (_req, res) => {
  if (global.gc) {
    global.gc();
    res.json({ message: 'GC triggered' });
  } else {
    res
      .status(400)
      .json({ message: 'GC not exposed. Run Node with --expose-gc flag' });
  }
});

/**
 * @openapi
 * /monitoring/simulate-memory-leak:
 *   get:
 *     summary: Simulate memory leak
 *     description: Endpoint to simulate a memory leak for testing purposes
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: Memory leak simulated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Memory leak simulated"
 */
router.get('/simulate-memory-leak', (_req, res) => {
  const arr: any[] = [];
  for (let i = 0; i < 1000000; i++) {
    arr.push(new Array(1000).fill('test'));
  }
  res.json({ message: 'Memory leak simulated' });
});

export default router;
