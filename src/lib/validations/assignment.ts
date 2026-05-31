import { z } from "zod";

export const createAssignmentSchema = z.object({
  machineId: z.string().regex(/^M-0(0[1-9]|[1-3][0-9]|40)$/, "Machine ID must be between M-001 and M-040"),
  orderId: z.string().min(1, "Order ID is required"),
  startDate: z.string().datetime({ message: "Invalid date format. Must be UTC ISO string." }),
  endDate: z.string().datetime({ message: "Invalid date format. Must be UTC ISO string." }),
});

export const updateAssignmentSchema = z.object({
  machineId: z.string().regex(/^M-0(0[1-9]|[1-3][0-9]|40)$/, "Machine ID must be between M-001 and M-040").optional(),
  startDate: z.string().datetime({ message: "Invalid date format. Must be UTC ISO string." }).optional(),
  endDate: z.string().datetime({ message: "Invalid date format. Must be UTC ISO string." }).optional(),
});
