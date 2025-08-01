// blood-pressure-alert-bot.ts
import { BotEvent, MedplumClient } from '@medplum/core';
import { Observation, Patient, Communication, Practitioner } from '@medplum/fhirtypes';

export async function handler(medplum: MedplumClient, event: BotEvent<Observation>): Promise<void> {
  const observation = event.input;
  
  // Verificar que es una observación de presión arterial
  if (!isBloodPressureObservation(observation)) {
    return;
  }

  const { systolic, diastolic } = extractBloodPressureValues(observation);
  
  // Verificar si hay valores elevados
  if (systolic > 140 || diastolic > 90) {
    await handleHighBloodPressure(medplum, observation, systolic, diastolic);
  }
}

function isBloodPressureObservation(observation: Observation): boolean {
  return observation.code?.coding?.some(
    coding => coding.code === '85354-9' && coding.system === 'http://loinc.org'
  ) || false;
}

function extractBloodPressureValues(observation: Observation): { systolic: number; diastolic: number } {
  let systolic = 0;
  let diastolic = 0;

  observation.component?.forEach(component => {
    const code = component.code?.coding?.[0]?.code;
    const value = component.valueQuantity?.value;
    
    if (code === '8480-6' && value) { // Presión sistólica
      systolic = value;
    } else if (code === '8462-4' && value) { // Presión diastólica
      diastolic = value;
    }
  });

  return { systolic, diastolic };
}

async function handleHighBloodPressure(
  medplum: MedplumClient, 
  observation: Observation, 
  systolic: number, 
  diastolic: number
): Promise<void> {
  
  const patient = await medplum.readReference(observation.subject as any);
  
  // Crear comunicación de alerta
  await createAlertCommunication(medplum, patient, observation, systolic, diastolic);
  
  // Notificar al equipo médico
  await notifyMedicalTeam(medplum, patient, systolic, diastolic);
  
  // Registrar en el log del sistema
  console.log(`ALERTA HTA: Paciente ${patient.id} - Sistólica: ${systolic}, Diastólica: ${diastolic}`);
}

async function createAlertCommunication(
  medplum: MedplumClient,
  patient: Patient,
  observation: Observation,
  systolic: number,
  diastolic: number
): Promise<void> {

  const alertMessage = generateAlertMessage(patient, systolic, diastolic);
  
  const communication: Communication = {
    resourceType: 'Communication',
    status: 'completed',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/communication-category',
        code: 'alert',
        display: 'Alert'
      }]
    }],
    priority: 'urgent',
    subject: {
      reference: `Patient/${patient.id}`
    },
    topic: {
      text: 'Alerta: Presión Arterial Elevada'
    },
    sent: new Date().toISOString(),
    payload: [{
      contentString: alertMessage
    }],
    basedOn: [{
      reference: `Observation/${observation.id}`
    }],
    meta: {
      tag: [{
        system: 'http://epa-bienestar.com.ar/tags',
        code: 'hta-alert'
      }]
    }
  };

  await medplum.createResource(communication);
}

function generateAlertMessage(patient: Patient, systolic: number, diastolic: number): string {
  const patientName = patient.name?.[0]?.given?.[0] || 'Paciente';
  
  return `🚨 ALERTA PRESIÓN ARTERIAL ELEVADA

Paciente: ${patientName}
Presión Arterial: ${systolic}/${diastolic} mmHg

⚠️ Valores por encima del rango normal:
- Sistólica: ${systolic > 140 ? `${systolic} mmHg (>140)` : `${systolic} mmHg (normal)`}
- Diastólica: ${diastolic > 90 ? `${diastolic} mmHg (>90)` : `${diastolic} mmHg (normal)`}

📋 Recomendaciones inmediatas:
- Repetir medición en 15 minutos
- Verificar técnica de medición correcta
- Contactar al equipo médico si persiste elevada
- Revisar medicación antihipertensiva actual

Fecha: ${new Date().toLocaleString('es-AR')}
Plataforma: EPA Bienestar IA`;
}

async function notifyMedicalTeam(
  medplum: MedplumClient,
  patient: Patient,
  systolic: number,
  diastolic: number
): Promise<void> {
  
  // Buscar practitioners asignados al paciente
  const practitioners = await medplum.searchResources('Practitioner', {
    'patient': patient.id
  });

  for (const practitioner of practitioners) {
    await createPractitionerNotification(medplum, practitioner, patient, systolic, diastolic);
  }
}

async function createPractitionerNotification(
  medplum: MedplumClient,
  practitioner: Practitioner,
  patient: Patient,
  systolic: number,
  diastolic: number
): Promise<void> {

  const notification: Communication = {
    resourceType: 'Communication',
    status: 'completed',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/communication-category',
        code: 'notification',
        display: 'Notification'
      }]
    }],
    priority: 'urgent',
    subject: {
      reference: `Patient/${patient.id}`
    },
    recipient: [{
      reference: `Practitioner/${practitioner.id}`
    }],
    topic: {
      text: 'Notificación: Paciente con HTA'
    },
    sent: new Date().toISOString(),
    payload: [{
      contentString: `Paciente ${patient.name?.[0]?.given?.[0]} presenta presión arterial elevada: ${systolic}/${diastolic} mmHg. Requiere evaluación médica.`
    }],
    meta: {
      tag: [{
        system: 'http://epa-bienestar.com.ar/tags',
        code: 'practitioner-alert'
      }]
    }
  };

  await medplum.createResource(notification);
}
