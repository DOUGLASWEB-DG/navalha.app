CREATE TABLE "AppointmentService" (
    "appointmentId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "durationMins" INTEGER NOT NULL,
    CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("appointmentId", "serviceId")
);

INSERT INTO "AppointmentService" ("appointmentId", "serviceId", "price", "durationMins")
SELECT a."id", a."serviceId", s."price", s."durationMins"
FROM "Appointment" a
JOIN "Service" s ON s."id" = a."serviceId"
WHERE NOT EXISTS (
  SELECT 1 FROM "AppointmentService" aps
  WHERE aps."appointmentId" = a."id" AND aps."serviceId" = a."serviceId"
);

CREATE INDEX "AppointmentService_serviceId_idx" ON "AppointmentService"("serviceId");
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON UPDATE CASCADE;
