import { FastifyRequest, FastifyReply } from 'fastify';
import { SimulationService } from '../services/simulationService.js';

export async function runSimulationScenarioHandler(request: FastifyRequest, reply: FastifyReply) {
  const { scenario } = request.body as any;

  try {
    let result: any;
    switch (scenario) {
      case 'CONFLICT':
        result = await SimulationService.runConcurrentICUConflict();
        break;
      case 'DUPLICATE':
        result = await SimulationService.runDuplicateEventScenario();
        break;
      case 'OUT_OF_ORDER':
        result = await SimulationService.runOutOfOrderScenario();
        break;
      case 'DOCTOR_FAILURE':
        result = await SimulationService.runDoctorFailureScenario();
        break;
      case 'PARTIAL_FAILURE':
        result = await SimulationService.runPartialFailureScenario();
        break;
      case 'NETWORK_TIMEOUT':
        result = await SimulationService.runDuplicateEventScenario(); // Simulates network retry with idempotency
        break;
      case 'STRESS_100':
        result = await SimulationService.runStressTest(100);
        break;
      case 'STRESS_500':
        result = await SimulationService.runStressTest(500);
        break;
      case 'STRESS_1000':
        result = await SimulationService.runStressTest(1000);
        break;
      default:
        return reply.status(400).send({ error: 'Unknown simulation scenario' });
    }
    return reply.send(result);
  } catch (error: any) {
    return reply.status(500).send({ error: error.message || 'Simulation execution failed' });
  }
}
