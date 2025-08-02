// blood-pressure-email-alert-bot.ts
import { BotEvent, MedplumClient } from '@medplum/core';
import { Observation, Patient, Communication, Practitioner } from '@medplum/fhirtypes';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Configuración AWS SES con validación de variables de entorno
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function handler(medplum: MedplumClient, event: BotEvent<Observation>): Promise<void> {
  const observation = event.input;
  
  console.log('🔍 Procesando observación:', observation.id);

  // Verificar que es una observación de presión arterial
  if (!isBloodPressureObservation(observation)) {
    console.log('❌ No es observación de presión arterial');
    return;
  }

  const { systolic, diastolic } = extractBloodPressureValues(observation);
  console.log(`📊 Valores: Sistólica ${systolic}, Diastólica ${diastolic}`);
  
  // Verificar si hay valores elevados
  if (systolic > 140 || diastolic > 90) {
    console.log('🚨 Valores elevados detectados');
    await handleHighBloodPressureWithEmail(medplum, observation, systolic, diastolic);
  } else {
    console.log('✅ Valores normales');
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

async function handleHighBloodPressureWithEmail(
  medplum: MedplumClient, 
  observation: Observation, 
  systolic: number, 
  diastolic: number
): Promise<void> {
  
  console.log('🏥 Iniciando proceso de alertas...');
  
  // 1. Obtener información del paciente
  const patient = await medplum.readReference(observation.subject as any) as Patient;
  console.log('👤 Paciente obtenido:', patient.name?.[0]?.given?.[0]);
  
  // 2. Crear Communication en FHIR
  const communication = createBloodPressureCommunication(medplum, patient, observation, systolic, diastolic);
  console.log('💬 Communication creada:', (await communication).id);
  
  // 3. Buscar médico de cabecera
  const primaryDoctor = await findPrimaryDoctor(medplum, patient);
  
  if (primaryDoctor) {
    console.log('👨‍⚕️ Médico encontrado:', primaryDoctor.name?.[0]?.given?.[0]);
    
    // 4. Enviar email al médico
    await sendEmailToDoctor(medplum, patient, primaryDoctor, systolic, diastolic, observation);
    
    // 5. Registrar notificación al médico en FHIR
    await createDoctorNotificationCommunication(medplum, patient, primaryDoctor, systolic, diastolic);
  } else {
    console.log('⚠️ No se encontró médico de cabecera');
    
    // Enviar a email genérico del sistema
    await sendEmailToSystemAdmin(patient, systolic, diastolic);
  }
}

async function createBloodPressureCommunication(
  medplum: MedplumClient,
  patient: Patient,
  observation: Observation,
  systolic: number,
  diastolic: number
): Promise<Communication> {

  const alertMessage = generatePatientAlertMessage(patient, systolic, diastolic);
  
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
        code: 'hta-patient-alert'
      }]
    }
  };

  return medplum.createResource(communication);
}

// Encuentra las líneas 159 y 165 y reemplázalas:

async function findPrimaryDoctor(medplum: MedplumClient, patient: Patient): Promise<Practitioner | null> {
  try {
    // Buscar CareTeam del paciente
    const careTeams = await medplum.searchResources('CareTeam', {
      'subject': `Patient/${patient.id}`,
      'status': 'active'
    });

    if (careTeams.length > 0) {
      // Buscar practitioner en el care team
      const careTeam = careTeams[0];
      const practitionerParticipant = careTeam.participant?.find(
        p => p.member?.reference?.startsWith('Practitioner/')
      );

      if (practitionerParticipant?.member?.reference) {
        // ✅ Línea 159 - Agregando await explícito
        return await medplum.readReference(practitionerParticipant.member as any) as Practitioner;
      }
    }

    // Fallback: buscar por Patient.generalPractitioner
    if (patient.generalPractitioner?.[0]?.reference) {
      // ✅ Línea 165 - Agregando await explícito
      return await medplum.readReference(patient.generalPractitioner[0] as any) as Practitioner;
    }

    return null;
  } catch (error) {
    console.error('Error finding primary doctor:', error);
    return null;
  }
}

async function sendEmailToDoctor(
  medplum: MedplumClient,
  patient: Patient,
  doctor: Practitioner,
  systolic: number,
  diastolic: number,
  observation: Observation
): Promise<void> {
  
  const doctorEmail = getDoctorEmail(doctor);
  if (!doctorEmail) {
    console.log('❌ No se encontró email del médico');
    return;
  }

  const emailContent = generateDoctorEmailContent(patient, doctor, systolic, diastolic, observation);
  const fromEmail = process.env.FROM_EMAIL || 'alertas@epa-bienestar.com.ar';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@epa-bienestar.com.ar';

  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: [doctorEmail],
      CcAddresses: [adminEmail]
    },
    Message: {
      Subject: {
        Data: `🚨 EPA Bienestar IA - Alerta HTA: ${patient.name?.[0]?.given?.[0]} ${patient.name?.[0]?.family}`,
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: emailContent.html,
          Charset: 'UTF-8'
        },
        Text: {
          Data: emailContent.text,
          Charset: 'UTF-8'
        }
      }
    },
    Tags: [
      {
        Name: 'Type',
        Value: 'BloodPressureAlert'
      },
      {
        Name: 'PatientId',
        Value: patient.id || 'unknown'
      }
    ]
  });

  try {
    const result = await sesClient.send(command);
    console.log('✅ Email enviado exitosamente:', result.MessageId);
    
    // Registrar el envío en FHIR
    await logEmailSent(medplum, patient, doctor, result.MessageId || 'unknown');
    
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw error;
  }
}

function getDoctorEmail(doctor: Practitioner): string | null {
  // Buscar email en los contactos del practitioner
  const emailContact = doctor.telecom?.find(
    contact => contact.system === 'email' && contact.use === 'work'
  );
  
  return emailContact?.value || null;
}

function generateDoctorEmailContent(
  patient: Patient,
  doctor: Practitioner,
  systolic: number,
  diastolic: number,
  observation: Observation
): { html: string; text: string } {
  
  const patientName = `${patient.name?.[0]?.given?.[0] || ''} ${patient.name?.[0]?.family || ''}`.trim();
  const doctorName = `${doctor.name?.[0]?.given?.[0] || ''} ${doctor.name?.[0]?.family || 'Doctor'}`.trim();
  const measurementDate = new Date(observation.effectiveDateTime || '').toLocaleString('es-AR');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .alert-box { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .values { background-color: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .footer { background-color: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px; }
        .btn { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚨 ALERTA - PRESIÓN ARTERIAL ELEVADA</h1>
        <p>EPA Bienestar IA - Sistema de Monitoreo Cardiovascular</p>
      </div>
      
      <div class="content">
        <h2>Estimado/a Dr./Dra. ${doctorName},</h2>
        
        <div class="alert-box">
          <strong>⚠️ Su paciente ${patientName} presenta valores elevados de presión arterial que requieren su atención inmediata.</strong>
        </div>
        
        <h3>📊 Detalles de la Medición:</h3>
        <div class="values">
          <p><strong>Paciente:</strong> ${patientName}</p>
          <p><strong>Fecha y Hora:</strong> ${measurementDate}</p>
          <p><strong>Presión Arterial:</strong> ${systolic}/${diastolic} mmHg</p>
          <p><strong>Estado:</strong> 
            ${systolic > 140 ? `🔴 Sistólica elevada (${systolic} > 140 mmHg)` : '🟢 Sistólica normal'}<br>
            ${diastolic > 90 ? `🔴 Diastólica elevada (${diastolic} > 90 mmHg)` : '🟢 Diastólica normal'}
          </p>
        </div>
        
        <h3>🎯 Recomendaciones Clínicas:</h3>
        <ul>
          <li>Verificar adherencia al tratamiento antihipertensivo actual</li>
          <li>Evaluar necesidad de ajuste de medicación</li>
          <li>Considerar medición ambulatoria de presión arterial (MAPA)</li>
          <li>Revisar factores de riesgo cardiovascular</li>
          <li>Programar consulta de seguimiento si no está ya programada</li>
        </ul>
        
        <p>
          <a href="https://cardio.epa-bienestar.com.ar/health-record/Observation/${observation.id}" class="btn">
            Ver Detalles Completos en EPA Bienestar IA
          </a>
        </p>
        
        <div class="alert-box">
          <strong>📞 Contacto de Emergencia:</strong><br>
          Si considera que este caso requiere atención inmediata, puede contactar al paciente o derivar a emergencias según su criterio clínico.
        </div>
      </div>
      
      <div class="footer">
        <p>Este mensaje fue generado automáticamente por EPA Bienestar IA</p>
        <p>Sistema de Monitoreo Cardiovascular - cardio.epa-bienestar.com.ar</p>
        <p>Para soporte técnico: admin@epa-bienestar.com.ar</p>
      </div>
    </body>
    </html>
  `;

  const text = `
🚨 ALERTA - PRESIÓN ARTERIAL ELEVADA
EPA Bienestar IA - Sistema de Monitoreo Cardiovascular

Estimado/a Dr./Dra. ${doctorName},

Su paciente ${patientName} presenta valores elevados de presión arterial que requieren su atención.

DETALLES DE LA MEDICIÓN:
- Paciente: ${patientName}
- Fecha y Hora: ${measurementDate}
- Presión Arterial: ${systolic}/${diastolic} mmHg
- Estado: ${systolic > 140 || diastolic > 90 ? 'ELEVADA' : 'NORMAL'}

VALORES ESPECÍFICOS:
- Sistólica: ${systolic} mmHg ${systolic > 140 ? '(ELEVADA - >140)' : '(NORMAL)'}
- Diastólica: ${diastolic} mmHg ${diastolic > 90 ? '(ELEVADA - >90)' : '(NORMAL)'}

RECOMENDACIONES:
- Verificar adherencia al tratamiento
- Evaluar ajuste de medicación
- Considerar MAPA si es necesario
- Programar seguimiento

Ver detalles completos: https://cardio.epa-bienestar.com.ar/health-record/Observation/${observation.id}

Este mensaje fue generado automáticamente por EPA Bienestar IA
Para soporte: admin@epa-bienestar.com.ar
  `;

  return { html, text };
}

async function createDoctorNotificationCommunication(
  medplum: MedplumClient,
  patient: Patient,
  doctor: Practitioner,
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
      reference: `Practitioner/${doctor.id}`
    }],
    sender: {
      display: 'Sistema EPA Bienestar IA'
    },
    topic: {
      text: 'Notificación médica: Presión arterial elevada'
    },
    sent: new Date().toISOString(),
    payload: [{
      contentString: `Email enviado al Dr./Dra. ${doctor.name?.[0]?.given?.[0]} ${doctor.name?.[0]?.family} notificando presión arterial elevada del paciente ${patient.name?.[0]?.given?.[0]} ${patient.name?.[0]?.family}: ${systolic}/${diastolic} mmHg`
    }],
    meta: {
      tag: [{
        system: 'http://epa-bienestar.com.ar/tags',
        code: 'doctor-email-notification'
      }]
    }
  };

  await medplum.createResource(notification);
}

async function sendEmailToSystemAdmin(
  patient: Patient,
  systolic: number,
  diastolic: number
): Promise<void> {
  
  const fromEmail = process.env.FROM_EMAIL || 'alertas@epa-bienestar.com.ar';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@epa-bienestar.com.ar';
  
  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: [adminEmail]
    },
    Message: {
      Subject: {
        Data: `🚨 EPA Bienestar IA - Paciente sin médico asignado con HTA: ${patient.name?.[0]?.given?.[0]}`,
        Charset: 'UTF-8'
      },
      Body: {
        Text: {
          Data: `ALERTA: El paciente ${patient.name?.[0]?.given?.[0]} ${patient.name?.[0]?.family} presenta presión arterial elevada (${systolic}/${diastolic} mmHg) pero no tiene médico de cabecera asignado. Requiere atención administrativa.`,
          Charset: 'UTF-8'
        }
      }
    }
  });

  try {
    await sesClient.send(command);
    console.log('✅ Email enviado a administración');
  } catch (error) {
    console.error('❌ Error enviando email a admin:', error);
  }
}

async function logEmailSent(
  medplum: MedplumClient,
  patient: Patient,
  recipient: Practitioner,
  _messageId: string
): Promise<void> {
  
  const auditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'RESTful Operation'
    },
    subtype: [{
      system: 'http://epa-bienestar.com.ar/audit-codes',
      code: 'email-sent',
      display: 'Email Sent'
    }],
    action: 'C',
    recorded: new Date().toISOString(),
    outcome: '0',
    agent: [{
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/extra-security-role-type',
          code: 'humanuser',
          display: 'human user'
        }]
      },
      who: {
        display: 'EPA Bienestar IA Bot'
      },
      requestor: false
    }],
    source: {
      observer: {
        display: 'EPA Bienestar IA System'
      },
      type: [{
        system: 'http://terminology.hl7.org/CodeSystem/security-source-type',
        code: '4',
        display: 'Application Server'
      }]
    },
    entity: [
      {
        what: {
          reference: `Patient/${patient.id}`
        },
        type: {
          system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
          code: '1',
          display: 'Person'
        }
      },
      {
        what: {
          reference: `Practitioner/${recipient.id}`
        },
        type: {
          system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
          code: '1',
          display: 'Person'
        }
      }
    ]
  };

  try {
    await medplum.createResource(auditEvent as any);
    console.log('📝 Audit log creado para envío de email');
  } catch (error) {
    console.error('Error creando audit log:', error);
  }
}

function generatePatientAlertMessage(patient: Patient, systolic: number, diastolic: number): string {
  const patientName = patient.name?.[0]?.given?.[0] || 'Paciente';
  
  return `🚨 ALERTA PRESIÓN ARTERIAL ELEVADA

Estimado/a ${patientName},

Se ha detectado que su última medición de presión arterial presenta valores elevados:

📊 MEDICIÓN ACTUAL:
- Presión Sistólica: ${systolic} mmHg ${systolic > 140 ? '(ELEVADA - Normal <140)' : ''}
- Presión Diastólica: ${diastolic} mmHg ${diastolic > 90 ? '(ELEVADA - Normal <90)' : ''}

⚠️ IMPORTANTE:
Su médico de cabecera ha sido notificado automáticamente de estos valores.

📋 RECOMENDACIONES INMEDIATAS:
- Repita la medición en 15 minutos en reposo
- Verifique que esté tomando su medicación según indicación médica
- Evite actividad física intensa por el momento
- Si presenta síntomas como dolor de cabeza, mareos o dolor en el pecho, busque atención médica inmediata

📞 En caso de emergencia, no dude en contactar a su médico o dirigirse al centro de salud más cercano.

💙 EPA Bienestar IA - Cuidando su salud cardiovascular
Fecha: ${new Date().toLocaleString('es-AR')}`;
}
