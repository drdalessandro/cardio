import { Observation, Patient, Reference } from '@medplum/fhirtypes';

const getMeasurementObject = (
  subject: Reference<Patient>,
  type: string,
  firstValue: string,
  secondValue?: string
): Observation => {
  const date = new Date().toISOString();

  switch (type) {
    case 'Presión Arterial':
      return {
        resourceType: 'Observation',
        subject,
	category: [
	    {
		"coding": [
	    {
        	"system": "http://terminology.hl7.org/CodeSystem/observation-category",
        	"code": "vital-signs",
        	"display": "Vital Signs"
    	    }
    		    ]
	    }
	],
        code: {
          coding: [
            {
              code: '85354-9',
              display: 'Blood Pressure',
              system: 'http://loinc.org',
            },
          ],
          text: 'Blood Pressure',
        },
        component: [
          {
            code: {
              coding: [
                {
                  code: '8462-4',
                  display: 'Diastolic Blood Pressure',
                  system: 'http://loinc.org',
                },
              ],
              text: 'Diastolic Blood Pressure',
            },
            valueQuantity: {
              code: 'mm[Hg]',
              system: 'http://unitsofmeasure.org',
              unit: 'mm[Hg]',
              value: Number(firstValue),
            },
          },
          {
            code: {
              coding: [
                {
                  code: '8480-6',
                  display: 'Systolic Blood Pressure',
                  system: 'http://loinc.org',
                },
              ],
              text: 'Systolic Blood Pressure',
            },
            valueQuantity: {
              code: 'mm[Hg]',
              system: 'http://unitsofmeasure.org',
              unit: 'mm[Hg]',
              value: Number(secondValue),
            },
          },
        ],
        effectiveDateTime: date,
        status: 'final',
      };
    case 'Temperatura Axilar':
      return {
        resourceType: 'Observation',
        subject,
	category: [
	    {
		"coding": [
	    {
        	"system": "http://terminology.hl7.org/CodeSystem/observation-category",
        	"code": "vital-signs",
        	"display": "Vital Signs"
    	    }
    		    ]
	    }
	],
        code: {
          coding: [
            {
              code: '8310-5',
              display: 'Body temperature',
              system: 'http://loinc.org',
            },
            {
              code: '8331-1',
              display: 'Oral temperature',
              system: 'http://loinc.org',
            },
          ],
          text: 'Body temperature',
        },
        valueQuantity: {
          code: 'Cel',
          system: 'http://unitsofmeasure.org',
          unit: 'Cel',
          value: Number(firstValue),
        },
        effectiveDateTime: date,
        status: 'final',
      };
    case 'Altura':
      return {
        resourceType: 'Observation',
        subject,
	category: [
	    {
		"coding": [
	    {
        	"system": "http://terminology.hl7.org/CodeSystem/observation-category",
        	"code": "vital-signs",
        	"display": "Vital Signs"
    	    }
    		    ]
	    }
	],
        code: {
          coding: [
            {
              code: '8302-2',
              display: 'Body Height',
              system: 'http://loinc.org',
            },
          ],
          text: 'Body Height',
        },
        valueQuantity: {
          code: 'cm',
          system: 'http://unitsofmeasure.org',
          unit: 'cm',
          value: Number(firstValue),
        },
        effectiveDateTime: date,
        status: 'final',
      };
    case 'Circunferencia Abdominal':
      return {
        resourceType: 'Observation',
        subject,
	category: [
	    {
		"coding": [
	    {
        	"system": "http://terminology.hl7.org/CodeSystem/observation-category",
        	"code": "vital-signs",
        	"display": "Vital Signs"
    	    }
    		    ]
	    }
	],
        code: {
          coding: [
            {
              code: '56114-2',
              display: 'Waist Circunference By NHANES',
              system: 'http://loinc.org',
            },
          ],
          text: 'Circunferencia Abdominal',
        },
        valueQuantity: {
          code: 'cm',
          system: 'http://unitsofmeasure.org',
          unit: 'cm',
          value: Number(firstValue),
        },
        effectiveDateTime: date,
        status: 'final',
      };

    case 'Frecuencia Respiratoria':
      return {
        resourceType: 'Observation',
        subject,
	category: [
	    {
		"coding": [
	    {
        	"system": "http://terminology.hl7.org/CodeSystem/observation-category",
        	"code": "vital-signs",
        	"display": "Vital Signs"
    	    }
    		    ]
	    }
	],
        code: {
          coding: [
            {
              code: '9279-1',
              display: 'Respiratory rate',
              system: 'http://loinc.org',
            },
          ],
          text: 'Respiratory rate',
        },
        valueQuantity: {
          code: '/min',
          system: 'http://unitsofmeasure.org',
          unit: '/min',
          value: Number(firstValue),
        },
        effectiveDateTime: date,
        status: 'final',
      };
    case 'Saturación Oxígeno':
      return {
        resourceType: 'Observation',
        subject,
	category: [
	    {
		"coding": [
	    {
        	"system": "http://terminology.hl7.org/CodeSystem/observation-category",
        	"code": "vital-signs",
        	"display": "Vital Signs"
    	    }
    		    ]
	    }
	],
        code: {
          coding: [
            {
              code: '59408-5',
              display: 'OxygenSaturationArterialBloodPulseOx',
              system: 'http://loinc.org',
            },
          ],
          text: 'Saturación O2',
        },
        valueQuantity: {
          code: '%',
          system: 'http://unitsofmeasure.org',
          unit: '%',
          value: Number(firstValue),
        },
        effectiveDateTime: date,
        status: 'final',
      };
    case 'Frecuencia Cardíaca':
      return {
        resourceType: 'Observation',
        subject,
	category: [
	    {
		"coding": [
	    {
        	"system": "http://terminology.hl7.org/CodeSystem/observation-category",
        	"code": "vital-signs",
        	"display": "Vital Signs"
    	    }
    		    ]
	    }
	],
        code: {
          coding: [
            {
              code: '8867-4',
              display: 'Heart rate',
              system: 'http://loinc.org',
            },
          ],
          text: 'Heart rate',
        },
        valueQuantity: {
          code: '/min',
          system: 'http://unitsofmeasure.org',
          unit: '/min',
          value: Number(firstValue),
        },
        effectiveDateTime: date,
        status: 'final',
      };
case 'Duración Sueño':
      return {
        resourceType: 'Observation',
        subject,
	category: [
	    {
		"coding": [
	    {
        	"system": "http://terminology.hl7.org/CodeSystem/observation-category",
        	"code": "vital-signs",
        	"display": "Vital Signs"
    	    }
    		    ]
	    }
	],
        code: {
          coding: [
            {
              code: '93832-4',
              display: 'Sleep duration',
              system: 'http://loinc.org',
            },
          ],
          text: 'Sleep duration',
        },
        valueQuantity: {
          code: 'h',
          system: 'http://unitsofmeasure.org',
          unit: 'h',
          value: Number(firstValue),
        },
        effectiveDateTime: date,
        status: 'final',
      };

case 'Duración Ejercicio':
      return {
        resourceType: 'Observation',
        subject,
	category: [
	    {
		"coding": [
	    {
        	"system": "http://terminology.hl7.org/CodeSystem/observation-category",
        	"code": "vital-signs",
        	"display": "Vital Signs"
    	    }
    		    ]
	    }
	],
        code: {
          coding: [
            {
              code: '101691-4',
              display: 'Duration on Physical Activity',
              system: 'http://loinc.org',
            },
          ],
          text: 'Duration of Physical Activity',
        },
        valueQuantity: {
          code: 'm',
          system: 'http://unitsofmeasure.org',
          unit: 'm',
          value: Number(firstValue),
        },
        effectiveDateTime: date,
        status: 'final',
      };

case 'Duración Período':
      return {
        resourceType: 'Observation',
        subject,
	category: [
	    {
		"coding": [
	    {
        	"system": "http://terminology.hl7.org/CodeSystem/observation-category",
        	"code": "vital-signs",
        	"display": "Vital Signs"
    	    }
    		    ]
	    }
	],
        code: {
          coding: [
            {
              code: '3144-3',
              display: 'Last menstrual Period duration',
              system: 'http://loinc.org',
            },
          ],
          text: 'Last menstrual Period duration',
        },
        valueQuantity: {
          code: 'd',
          system: 'http://unitsofmeasure.org',
          unit: 'd',
          value: Number(firstValue),
        },
        effectiveDateTime: date,
        status: 'final',
      };

    case 'Peso':
      return {
        resourceType: 'Observation',
        subject,
	category: [
	    {
		"coding": [
	    {
        	"system": "http://terminology.hl7.org/CodeSystem/observation-category",
        	"code": "vital-signs",
        	"display": "Vital Signs"
    	    }
    		    ]
	    }
	],
        code: {
          coding: [
            {
              code: '29463-7',
              display: 'Body Weight',
              system: 'http://loinc.org',
            },
          ],
          text: 'Body Weight',
        },
        valueQuantity: {
          code: 'kg',
          system: 'http://unitsofmeasure.org',
          unit: 'kg',
          value: Number(firstValue),
        },
        effectiveDateTime: date,
        status: 'final',
      };
    default:
      return { resourceType: 'Observation' };
  }
};

export default getMeasurementObject;
