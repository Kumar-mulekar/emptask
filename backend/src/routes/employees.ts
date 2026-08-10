import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  createEmployee,
  deactivateEmployee,
  getEmployeeById,
  getEmployees,
  updateEmployee,
} from '../services/employeeService';
import {
  CreateEmployeeDTO,
  GetEmployeesParams,
  UpdateEmployeeDTO,
} from '../dtos/employee.dto';
import {
  createEmployeeSchema,
  employeeIdParamsSchema,
  getEmployeesQuerySchema,
  updateEmployeeSchema,
} from '../schemas/employeeSchemas';

export async function employeeRoutes(fastify: FastifyInstance) {
  // GET /api/employees — List active employees (paginated, filtered, searchable)
  fastify.get(
    '/',
    {
      schema: {
        querystring: getEmployeesQuerySchema,
      },
    },
    async (request: FastifyRequest<{ Querystring: GetEmployeesParams }>, reply: FastifyReply) => {
      const result = await getEmployees(request.query);
      return reply.status(200).send(result);
    }
  );

  // POST /api/employees — Create a new employee
  fastify.post(
    '/',
    {
      schema: {
        body: createEmployeeSchema,
      },
    },
    async (request: FastifyRequest<{ Body: CreateEmployeeDTO }>, reply: FastifyReply) => {
      const created = await createEmployee(request.body);
      return reply.status(201).send(created);
    }
  );

  // GET /api/employees/:id — Get a single employee
  fastify.get(
    '/:id',
    {
      schema: {
        params: employeeIdParamsSchema,
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const employee = await getEmployeeById(request.params.id);
      return reply.status(200).send(employee);
    }
  );

  // PUT /api/employees/:id — Update an employee
  fastify.put(
    '/:id',
    {
      schema: {
        params: employeeIdParamsSchema,
        body: updateEmployeeSchema,
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateEmployeeDTO }>, reply: FastifyReply) => {
      const updated = await updateEmployee(request.params.id, request.body);
      return reply.status(200).send(updated);
    }
  );

  // PATCH /api/employees/:id/deactivate — Soft delete (sets isActive = false)
  fastify.patch(
    '/:id/deactivate',
    {
      schema: {
        params: employeeIdParamsSchema,
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const deactivated = await deactivateEmployee(request.params.id);
      return reply.status(200).send(deactivated);
    }
  );
}
