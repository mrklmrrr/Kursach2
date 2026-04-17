const { z } = require('zod');

const idString = z.string().min(1);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeString = z.string().regex(/^\d{2}:\d{2}$/);

const base = {
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough()
};

const authSchemas = {
  register: {
    ...base,
    body: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().min(5),
      birthDate: z.string().min(1),
      gender: z.string().min(1),
      password: z.string().min(6)
    })
  },
  login: {
    ...base,
    body: z.object({
      phone: z.string().min(5),
      password: z.string().min(1)
    })
  },
  adminLogin: {
    ...base,
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1)
    })
  },
  changePassword: {
    ...base,
    body: z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6)
    })
  }
};

const appointmentSchemas = {
  create: {
    ...base,
    body: z.object({
      doctorId: idString,
      date: dateString,
      time: timeString,
      type: z.string().optional(),
      consultationType: z.string().optional(),
      duration: z.number().int().min(15).max(180).optional()
    })
  },
  assign: {
    ...base,
    body: z.object({
      patientId: idString,
      date: dateString,
      time: timeString,
      type: z.string().optional(),
      consultationType: z.string().optional(),
      duration: z.number().int().min(15).max(180).optional()
    })
  },
  idParam: {
    ...base,
    params: z.object({ id: idString })
  },
  slots: {
    ...base,
    params: z.object({ doctorId: idString }),
    query: z.object({ date: dateString }),
    body: z.object({}).passthrough()
  },
  updateComment: {
    ...base,
    params: z.object({ id: idString }),
    body: z.object({ comment: z.string().max(2000).optional() })
  }
};

const consultationSchemas = {
  create: {
    ...base,
    body: z.object({
      doctorId: idString,
      duration: z.number().int().min(5).max(180).optional(),
      type: z.enum(['chat', 'video']).optional()
    }).passthrough()
  },
  idParam: {
    ...base,
    params: z.object({ id: idString })
  },
  sendMessage: {
    ...base,
    params: z.object({ id: idString }),
    body: z.object({
      message: z.string().min(1).max(5000)
    })
  }
};

module.exports = {
  authSchemas,
  appointmentSchemas,
  consultationSchemas
};
